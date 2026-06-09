import { useCallback } from "react";
import { useFileStore } from "@/store/file.store";
import { useWindowStore } from "@/store/window.store";
import { BackendFileType, type FileType, VirtualFileType } from "@/types/file";
import { WindowType } from "@/types/window";
import { ContentTypes, getContentTypes } from "@/utils/content_type";
import MenuList from "./menu_list";
import { useFileActions } from "./use-file-actions";

export default function FileMenu({
  path,
  fileType,
  fileName,
  windowKey,
  parentWindowType,
  closeMenu,
}: {
  path: string;
  fileType: FileType;
  fileName: string;
  windowKey: string;
  parentWindowType: WindowType | null;
  closeMenu: () => void;
}) {
  const windows = useWindowStore((state) => state.windows);
  const currentWindow = windows.find((w) => w.key === windowKey);
  const systemId = currentWindow?.systemId || "";

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

  const {
    handleDownload,
    handleMoveToTrash,
    handlePermanentDelete,
    handleEmptyTrash,
    handleInfo,
  } = useFileActions({
    systemId,
    path,
    fileName,
    windowKey,
    getTargetPaths,
    closeMenu,
  });

  const openFile = useCallback(
    (
      fileType: Omit<FileType, BackendFileType.Symlink>,
      fileName: string,
      path: string
    ) => {
      let windowType: WindowType;
      switch (fileType) {
        case BackendFileType.Directory:
        case VirtualFileType.Root:
        case VirtualFileType.Home:
        case VirtualFileType.Trash:
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
        systemId,
      });
    },
    [newWindow, systemId]
  );

  const handleOpen = useCallback(() => {
    closeMenu();
    openFile(fileType, fileName, path);
  }, [closeMenu, path, fileName, fileType, openFile]);

  const handleRename = useCallback(() => {
    closeMenu();
    setRenamingFile({ fileKey: path, windowKey });
  }, [closeMenu, path, windowKey, setRenamingFile]);

  const deleteMenu =
    parentWindowType === WindowType.Trash
      ? { name: "Permanent Delete", action: handlePermanentDelete }
      : { name: "Move to Trash", action: handleMoveToTrash };

  const infoItem = { name: "Info", action: handleInfo };

  switch (fileType) {
    case BackendFileType.Directory:
    case VirtualFileType.Root:
    case VirtualFileType.Home:
      return (
        <MenuList
          menuList={[
            { name: "Open", action: handleOpen },
            infoItem,
            { name: "Rename", action: handleRename },
            { name: "/", action: () => {} },
            deleteMenu,
          ]}
        />
      );
    case BackendFileType.Object:
      return (
        <MenuList
          menuList={[
            { name: "Open", action: handleOpen },
            { name: "Download", action: handleDownload },
            infoItem,
            { name: "Rename", action: handleRename },
            { name: "/", action: () => {} },
            deleteMenu,
          ]}
        />
      );
    case BackendFileType.Regular:
      return (
        <MenuList
          menuList={[
            infoItem,
            { name: "Rename", action: handleRename },
            { name: "/", action: () => {} },
            deleteMenu,
          ]}
        />
      );
    case BackendFileType.Symlink:
      return (
        <MenuList
          menuList={[
            { name: "Open", action: handleOpen },
            infoItem,
            { name: "Rename", action: handleRename },
            { name: "/", action: () => {} },
            deleteMenu,
          ]}
        />
      );
    case VirtualFileType.Upload:
      return <MenuList menuList={[{ name: "Open", action: handleOpen }]} />;
    case VirtualFileType.Trash:
      return (
        <MenuList
          menuList={[{ name: "Empty Trash", action: handleEmptyTrash }]}
        />
      );
    default:
      return null;
  }
}
