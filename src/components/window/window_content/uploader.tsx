"use client";

import { useCallback, useRef, useState } from "react";
import { useUploadManager } from "@/api/hooks/use-upload";
import { XPImageIcons } from "@/components/icons/xp_image_icons";
import { useWindowStore } from "@/store/window.store";
import styles from "./uploader.module.css";

interface UploaderProps {
  targetPath: string;
}

export default function Uploader({ targetPath }: UploaderProps) {
  const windows = useWindowStore((state) => state.windows);
  const currentWindow = windows.find((w) => w.targetKey === targetPath);
  const driveID = currentWindow?.driveID || "";

  const {
    tasks,
    addFiles,
    cancelUpload,
    retryUpload,
    removeTask,
    clearCompleted,
  } = useUploadManager(driveID, targetPath);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
        e.target.value = "";
      }
    },
    [addFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const failedCount = tasks.filter(
    (t) => t.status === "failed" || t.status === "skipped"
  ).length;

  return (
    <div className={styles.container}>
      <section
        className={`${styles.dropZone} ${isDragOver ? styles.dropZoneActive : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        aria-label="File drop zone"
      >
        <div className={styles.dropZoneIcon}>
          <XPImageIcons.Upload />
        </div>
        <div className={styles.dropZoneText}>
          Drop files here or
          <button
            type="button"
            className={styles.browseButton}
            onClick={openFilePicker}
          >
            Browse
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className={styles.fileInput}
          multiple
          onChange={handleFileSelect}
        />
      </section>

      <div className={styles.fileList}>
        {tasks.length === 0 ? (
          <div className={styles.emptyState}>
            No files queued. Drop files above to upload.
          </div>
        ) : (
          <ul className={styles.taskList}>
            {tasks.map((task) => (
              <li key={task.id} className={styles.task}>
                <div className={styles.taskIcon}>
                  <XPImageIcons.File />
                </div>
                <div className={styles.taskFileName} title={task.fileName}>
                  {task.fileName}
                </div>
                <div className={styles.taskProgress}>
                  {task.status === "uploading" ? (
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressBarFill}
                        style={{ width: `${task.progress}%` }}
                      />
                      <span className={styles.progressText}>
                        {Math.round(task.progress)}%
                      </span>
                    </div>
                  ) : null}
                </div>
                <div
                  className={`${styles.taskStatus} ${statusClass(task.status, styles)}`}
                >
                  {statusText(task.status)}
                </div>
                <div className={styles.taskActions}>
                  {task.status === "uploading" && (
                    <button
                      type="button"
                      className={styles.actionButton}
                      onClick={() => cancelUpload(task.id)}
                    >
                      Cancel
                    </button>
                  )}
                  {task.status === "failed" && (
                    <button
                      type="button"
                      className={styles.actionButton}
                      onClick={() => retryUpload(task.id)}
                    >
                      Retry
                    </button>
                  )}
                  {(task.status === "failed" ||
                    task.status === "completed" ||
                    task.status === "skipped" ||
                    task.status === "cancelled") && (
                    <button
                      type="button"
                      className={styles.actionButton}
                      onClick={() => removeTask(task.id)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {tasks.length > 0 && (
        <div className={styles.footer}>
          <span className={styles.footerText}>
            {completedCount} / {tasks.length} completed
            {failedCount > 0 ? `, ${failedCount} failed` : ""}
          </span>
          {completedCount > 0 && (
            <button
              type="button"
              className={styles.actionButton}
              onClick={clearCompleted}
            >
              Clear completed
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function statusText(status: string): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "uploading":
      return "Uploading";
    case "completed":
      return "Done";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    case "skipped":
      return "Skipped";
    default:
      return status;
  }
}

function statusClass(status: string, styles: Record<string, string>): string {
  switch (status) {
    case "completed":
      return styles.statusCompleted ?? "";
    case "failed":
      return styles.statusFailed ?? "";
    case "skipped":
      return styles.statusSkipped ?? "";
    case "uploading":
      return styles.statusUploading ?? "";
    default:
      return "";
  }
}