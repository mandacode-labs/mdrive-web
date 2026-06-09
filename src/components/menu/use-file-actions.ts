import { useCallback } from "react";
import { getDownloadUrl, ls } from "@/api/generated";
import { useDeleteFiles, useMoveFiles } from "@/api/hooks";
import { useWindowStore } from "@/store/window.store";
import { WindowType } from "@/types/window";

export function useFileActions({
  systemId,
  path,
  fileName,
  windowKey,
  getTargetPaths,
  closeMenu,
}: {
  systemId: string;
  path: string;
  fileName: string;
  windowKey: string;
  getTargetPaths: () => string[];
  closeMenu: () => void;
}) {
  const newWindow = useWindowStore((state) => state.newWindow);
  const mvMutation = useMoveFiles();
  const rmMutation = useDeleteFiles();

  const handleDownload = useCallback(async () => {
    closeMenu();
    try {
      const result = await getDownloadUrl(
        systemId,
        { path },
        { credentials: "include" }
      );
      if (result.status !== 200 || !result.data.downloadUrl?.downloadUrl) {
        return;
      }
      const { downloadUrl } = result.data.downloadUrl;
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Download failed silently
    }
  }, [closeMenu, systemId, path, fileName]);

  const handleMoveToTrash = useCallback(async () => {
    closeMenu();
    try {
      const paths = getTargetPaths();
      await mvMutation.mutateAsync({
        systemId,
        data: { sources: paths, destination: "/home/.trash" },
      });
    } catch {
      // Move to trash failed silently
    }
  }, [closeMenu, getTargetPaths, systemId, mvMutation]);

  const handlePermanentDelete = useCallback(async () => {
    closeMenu();
    try {
      const paths = getTargetPaths();
      await rmMutation.mutateAsync({
        systemId,
        data: { paths, recursive: true },
      });
    } catch {
      // Permanent delete failed silently
    }
  }, [closeMenu, getTargetPaths, systemId, rmMutation]);

  const handleEmptyTrash = useCallback(async () => {
    closeMenu();
    try {
      const readDirResult = await ls(
        systemId,
        { path },
        { credentials: "include" }
      );
      if (readDirResult.data && "entries" in readDirResult.data) {
        const paths = readDirResult.data.entries.map(
          (entry) => `${path === "/" ? "" : path}/${entry.name}`
        );
        await rmMutation.mutateAsync({
          systemId,
          data: { paths, recursive: true },
        });
      }
    } catch {
      // Empty trash failed silently
    }
  }, [closeMenu, path, systemId, rmMutation]);

  const handleInfo = useCallback(() => {
    closeMenu();
    newWindow({
      targetKey: path,
      type: WindowType.Info,
      title: `${fileName} Info`,
      systemId,
    });
  }, [closeMenu, newWindow, path, fileName, systemId]);

  return {
    handleDownload,
    handleMoveToTrash,
    handlePermanentDelete,
    handleEmptyTrash,
    handleInfo,
  };
}
