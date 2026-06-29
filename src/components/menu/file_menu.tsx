import { useCallback } from "react";
import { presignDownload } from "@/api/generated";
import { useRm } from "@/api/hooks";
import { useFileStore } from "@/store/file.store";
import { useWindowStore } from "@/store/window.store";
import { BackendFileType, type FileType, VirtualFileType } from "@/types/file";
import { WindowType } from "@/types/window";
import { ContentTypes, getContentTypes } from "@/utils/content_type";
import MenuList from "./menu_list";

export default function FileMenu({
  path,
  fileType,
  fileName,
  windowKey,
  closeMenu,
}: {
  path: string;
  fileType: FileType;
  fileName: string;
  windowKey: string;
  closeMenu: () => void;
}) {
  const windows = useWindowStore((state) => state.windows);
  const currentWindow = windows.find((w) => w.key === windowKey);
  const driveID = currentWindow?.driveID || "";

  const rmMutation = useRm();

  const newWindow = useWindowStore((state) => state.newWindow);
  const getSelectedFileKeys = useFileStore(
    (state) => state.getSelectedFileKeys
  );
  const setRenamingFile = useFileStore((state) => state.setRenamingFile);

  const getTargetPaths = useCallback(() => {
    const selectedKeys = getSelectedFileKeys();
    if (!selectedKeys.includes(path)) {
      return [path];
    }
    return selectedKeys;
  }, [getSelectedFileKeys, path]);

  const openFile = useCallback(
    async (
      fileType: Omit<FileType, BackendFileType.Symlink>,
      fileName: string,
      path: string
    ) => {
      let windowType: WindowType;
      switch (fileType) {
        case BackendFileType.Directory:
        case VirtualFileType.Root:
        case VirtualFileType.Home:
          windowType = WindowType.Navigator;
          break;
        case BackendFileType.Object:
        case BackendFileType.Regular: {
          const contentType = getContentTypes(fileName);
          switch (contentType) {
            case ContentTypes.Image:
              windowType = WindowType.Image;
              break;
            case ContentTypes.Video:
              windowType = WindowType.Video;
              break;
            case ContentTypes.Audio:
              windowType = WindowType.Audio;
              break;
            default:
              windowType = WindowType.Other;
              break;
          }
          break;
        }
        case VirtualFileType.Upload:
          windowType = WindowType.Uploader;
          break;
        default:
          windowType = WindowType.Other;
          break;
      }
      newWindow({
        targetKey: path,
        type: windowType,
        title: fileName,
        driveID,
      });
    },
    [newWindow, driveID]
  );

  const handleOpen = useCallback(async () => {
    closeMenu();
    openFile(fileType, fileName, path);
  }, [closeMenu, path, fileName, fileType, openFile]);

  const handleRename = useCallback(() => {
    closeMenu();
    setRenamingFile({ fileKey: path, windowKey });
  }, [closeMenu, path, windowKey, setRenamingFile]);

  const handleDownload = useCallback(async () => {
    closeMenu();
    try {
      const result = await presignDownload(
        driveID,
        { path },
        { credentials: "include" }
      );
      if (result.status !== 200 || !result.data?.url) {
        return;
      }
      const response = await fetch(result.data.url);
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
    } catch (error) {
      console.error("[FileMenu] download failed:", error);
    }
  }, [closeMenu, driveID, path, fileName]);

  const handleDelete = useCallback(async () => {
    closeMenu();
    try {
      const paths = getTargetPaths();
      await rmMutation.mutateAsync({
        driveID,
        data: { paths, recursive: true },
      });
    } catch (error) {
      console.error("[FileMenu] delete failed:", error);
    }
  }, [closeMenu, getTargetPaths, driveID, rmMutation]);

  const handleInfo = useCallback(() => {
    closeMenu();
    newWindow({
      targetKey: path,
      type: WindowType.Info,
      title: `${fileName} Info`,
      driveID,
    });
  }, [closeMenu, newWindow, path, fileName, driveID]);

  switch (fileType) {
    case BackendFileType.Directory:
    case VirtualFileType.Root:
    case VirtualFileType.Home:
      return (
        <MenuList
          menuList={[
            { name: "Open", action: handleOpen },
            { name: "Info", action: handleInfo },
            { name: "Rename", action: handleRename },
            { name: "/", action: () => {} },
            { name: "Delete", action: handleDelete },
          ]}
        />
      );
    case BackendFileType.Object:
      return (
        <MenuList
          menuList={[
            { name: "Open", action: handleOpen },
            { name: "Download", action: handleDownload },
            { name: "Info", action: handleInfo },
            { name: "Rename", action: handleRename },
            { name: "/", action: () => {} },
            { name: "Delete", action: handleDelete },
          ]}
        />
      );
    case BackendFileType.Regular:
      return (
        <MenuList
          menuList={[
            { name: "Download", action: handleDownload },
            { name: "Info", action: handleInfo },
            { name: "Rename", action: handleRename },
            { name: "/", action: () => {} },
            { name: "Delete", action: handleDelete },
          ]}
        />
      );
    case BackendFileType.Symlink:
      return (
        <MenuList
          menuList={[
            { name: "Open", action: handleOpen },
            { name: "Info", action: handleInfo },
            { name: "Rename", action: handleRename },
            { name: "/", action: () => {} },
            { name: "Delete", action: handleDelete },
          ]}
        />
      );
    case VirtualFileType.Upload:
      return <MenuList menuList={[{ name: "Open", action: handleOpen }]} />;
    default:
      return null;
  }
}