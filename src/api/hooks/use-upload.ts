import { useMutation } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import {
  getCompleteUploadMutationOptions,
  getInitiateUploadMutationOptions,
  stat as statRequest,
} from "@/api/generated";
import { parseApiError } from "@/api/utils";
import { md5Base64 } from "@/utils/md5";

export type UploadStatus =
  | "pending"
  | "uploading"
  | "completed"
  | "failed"
  | "cancelled"
  | "skipped";

export interface UploadTask {
  id: string;
  file: File;
  fileName: string;
  filePath: string;
  status: UploadStatus;
  progress: number;
  bytesUploaded: number;
  totalBytes: number;
  error?: string;
  retryCount: number;
}

interface UploadManagerState {
  tasks: UploadTask[];
  isUploading: boolean;
}

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];
const CONCURRENCY = 5;

export function useUploadManager(driveID: string, basePath: string) {
  const [state, setState] = useState<UploadManagerState>({
    tasks: [],
    isUploading: false,
  });

  const tasksRef = useRef<UploadTask[]>([]);
  tasksRef.current = state.tasks;

  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const activeUploadsRef = useRef<number>(0);
  const isCancelledRef = useRef<Set<string>>(new Set());

  const initiateUpload = useMutation({
    ...getInitiateUploadMutationOptions(),
  });

  const completeUpload = useMutation({
    ...getCompleteUploadMutationOptions(),
  });

  const checkDuplicate = useCallback(
    async (filePath: string): Promise<boolean> => {
      try {
        const result = await statRequest(driveID, { path: filePath });
        return result.status === 200;
      } catch {
        return false;
      }
    },
    [driveID]
  );

  const uploadFile = useCallback(
    async (taskId: string) => {
      const task = tasksRef.current.find((t) => t.id === taskId);
      if (
        !task ||
        task.status === "cancelled" ||
        isCancelledRef.current.has(taskId)
      ) {
        return;
      }

      const abortController = new AbortController();
      abortControllersRef.current.set(taskId, abortController);
      activeUploadsRef.current++;

      setState((prev) => ({
        ...prev,
        isUploading: true,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? { ...t, status: "uploading", error: undefined, progress: 0 }
            : t
        ),
      }));

      try {
        const exists = await checkDuplicate(task.filePath);
        if (exists) {
          setState((prev) => ({
            ...prev,
            tasks: prev.tasks.map((t) =>
              t.id === taskId
                ? { ...t, status: "skipped", error: "File already exists" }
                : t
            ),
          }));
          return;
        }

        const checksum = await md5Base64(await task.file.arrayBuffer());

        const initiateResult = await initiateUpload.mutateAsync({
          driveID,
          data: {
            path: task.filePath,
            contentType: task.file.type,
            contentLength: task.totalBytes,
          },
        });

        if (
          initiateResult.status !== 200 ||
          !initiateResult.data?.uploadId ||
          !initiateResult.data.url
        ) {
          throw new Error("Failed to initiate upload");
        }

        const {
          uploadId,
          method,
          url,
          headers: presignedHeaders,
        } = initiateResult.data;

        await uploadToPresignedUrl(
          url,
          method,
          presignedHeaders,
          task.file,
          abortController.signal,
          (progress) => {
            if (isCancelledRef.current.has(taskId)) {
              abortController.abort();
              return;
            }
            setState((prev) => ({
              ...prev,
              tasks: prev.tasks.map((t) =>
                t.id === taskId ? { ...t, progress } : t
              ),
            }));
          }
        );

        if (isCancelledRef.current.has(taskId)) {
          return;
        }

        await completeUpload.mutateAsync({
          driveID,
          uploadId,
          data: {
            contentLength: task.totalBytes,
            checksum,
          },
        });

        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskId ? { ...t, status: "completed", progress: 100 } : t
          ),
        }));
      } catch (error) {
        if (
          abortController.signal.aborted ||
          isCancelledRef.current.has(taskId)
        ) {
          return;
        }

        const errorMessage = parseApiError(error).message;

        const currentTask = tasksRef.current.find((t) => t.id === taskId);
        const retryCount = currentTask?.retryCount ?? 0;

        if (retryCount < MAX_RETRIES) {
          const delay =
            RETRY_DELAYS[retryCount] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1];
          await new Promise((resolve) => setTimeout(resolve, delay));

          if (isCancelledRef.current.has(taskId)) {
            return;
          }

          setState((prev) => ({
            ...prev,
            tasks: prev.tasks.map((t) =>
              t.id === taskId
                ? { ...t, retryCount: t.retryCount + 1, status: "pending" }
                : t
            ),
          }));

          await uploadFile(taskId);
          return;
        }

        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskId
              ? { ...t, status: "failed", error: errorMessage }
              : t
          ),
        }));
      } finally {
        abortControllersRef.current.delete(taskId);
        activeUploadsRef.current--;
        isCancelledRef.current.delete(taskId);

        setState((prev) => ({
          ...prev,
          isUploading: prev.tasks.some((t) => t.status === "uploading"),
        }));
      }
    },
    [driveID, initiateUpload, completeUpload, checkDuplicate]
  );

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const newTasks: UploadTask[] = Array.from(files).map((file) => ({
        id: crypto.randomUUID(),
        file,
        fileName: file.name,
        filePath: joinPath(basePath, file.name),
        status: "pending",
        progress: 0,
        bytesUploaded: 0,
        totalBytes: file.size,
        retryCount: 0,
      }));

      setState((prev) => ({
        ...prev,
        tasks: [...prev.tasks, ...newTasks],
      }));

      setTimeout(async () => {
        for (let i = 0; i < newTasks.length; i += CONCURRENCY) {
          const batch = newTasks.slice(i, i + CONCURRENCY);
          await Promise.allSettled(batch.map((task) => uploadFile(task.id)));
        }
      }, 0);
    },
    [uploadFile, basePath]
  );

  const cancelUpload = useCallback((taskId: string) => {
    isCancelledRef.current.add(taskId);

    const abortController = abortControllersRef.current.get(taskId);
    if (abortController) {
      abortController.abort();
      abortControllersRef.current.delete(taskId);
    }

    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, status: "cancelled" } : t
      ),
    }));
  }, []);

  const retryUpload = useCallback(
    (taskId: string) => {
      isCancelledRef.current.delete(taskId);

      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: "pending",
                error: undefined,
                retryCount: 0,
                progress: 0,
              }
            : t
        ),
      }));

      setTimeout(() => uploadFile(taskId), 0);
    },
    [uploadFile]
  );

  const removeTask = useCallback(
    (taskId: string) => {
      cancelUpload(taskId);
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== taskId),
      }));
    },
    [cancelUpload]
  );

  const clearCompleted = useCallback(() => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter(
        (t) => t.status !== "completed" && t.status !== "cancelled"
      ),
    }));
  }, []);

  return {
    tasks: state.tasks,
    isUploading: state.isUploading,
    addFiles,
    cancelUpload,
    retryUpload,
    removeTask,
    clearCompleted,
  };
}

function joinPath(base: string, name: string): string {
  const cleanedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  if (!cleanedBase || cleanedBase === "/") {
    return `/${name}`;
  }
  return `${cleanedBase}/${name}`;
}

function uploadToPresignedUrl(
  url: string,
  method: string,
  presignedHeaders: Record<string, string> | undefined,
  file: File,
  signal: AbortSignal,
  onProgress: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = (event.loaded / event.total) * 100;
        onProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));

    signal.addEventListener("abort", () => {
      xhr.abort();
    });

    xhr.open(method, url);
    if (presignedHeaders) {
      for (const [key, value] of Object.entries(presignedHeaders)) {
        xhr.setRequestHeader(key, value);
      }
    }
    xhr.send(file);
  });
}