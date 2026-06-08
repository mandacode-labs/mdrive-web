import { useCallback } from "react";
import { ls } from "@/api/generated";
import { useCreateDirectory, useDeleteFiles } from "@/api/hooks";
import { useWindowStore } from "@/store/window.store";
import { WindowType } from "@/types/window";
import MenuList from "./menu_list";

export default function WindowMenu({
  path,
  windowType,
  closeMenu,
}: {
  path: string;
  windowType: WindowType | null;
  closeMenu: () => void;
}) {
  // Get system ID from window store
  const windows = useWindowStore((state) => state.windows);
  const currentWindow = windows.find((w) => w.targetKey === path);
  const systemId = currentWindow?.systemId || "";

  // Store actions
  const newWindow = useWindowStore((state) => state.newWindow);

  // Mutations
  const mkdirMutation = useCreateDirectory();
  const deleteFilesMutation = useDeleteFiles();

  // Handle upload action
  const handleUpload = useCallback(() => {
    newWindow({
      targetKey: path,
      type: WindowType.Uploader,
      title: "Uploader",
      systemId,
    });
    closeMenu();
  }, [closeMenu, newWindow, path, systemId]);

  const handleCreateContainer = useCallback(async () => {
    if (!path || !systemId) return;

    await mkdirMutation
      .mutateAsync({
        systemId,
        data: {
          path: `${path === "/" ? "" : path}/New Folder`,
          mode: 0o755,
        },
      })
      .then(() => {
        closeMenu();
      });
  }, [path, systemId, closeMenu, mkdirMutation]);

  const handleEmptyTrash = useCallback(async () => {
    if (!path || !systemId) return;
    closeMenu();

    // Get all files in trash directory
    const readDirResult = await ls(
      systemId,
      { path },
      { credentials: "include" }
    );

    if (readDirResult.data && "entries" in readDirResult.data) {
      const paths = readDirResult.data.entries.map(
        (entry) => `${path === "/" ? "" : path}/${entry.name}`
      );

      if (paths.length > 0) {
        await deleteFilesMutation.mutateAsync({
          systemId,
          data: { paths, recursive: true },
        });
      }
    }
  }, [path, systemId, closeMenu, deleteFilesMutation]);

  const handleRefresh = useCallback(() => {
    // Queries will be refreshed automatically by the mutations
    closeMenu();
  }, [closeMenu]);

  switch (windowType) {
    case WindowType.Trash:
      return (
        <MenuList
          menuList={[
            { name: "Empty Trash", action: handleEmptyTrash },
            { name: "/", action: () => {} },
            { name: "Refresh", action: handleRefresh },
          ]}
        />
      );
    case WindowType.Navigator:
      return (
        <MenuList
          menuList={[
            { name: "Upload", action: handleUpload },
            { name: "Create Folder", action: handleCreateContainer },
            { name: "/", action: () => {} },
            { name: "Refresh", action: handleRefresh },
          ]}
        />
      );
    default:
      return null;
  }
}
