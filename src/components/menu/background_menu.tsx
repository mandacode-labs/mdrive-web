import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useMkdir } from "@/api/hooks";
import { useWindowStore } from "@/store/window.store";
import { WindowType } from "@/types/window";
import { isFsQuery } from "@/utils/query_keys";
import MenuList from "./menu_list";

export default function BackgroundMenu({
  path,
  closeMenu,
}: {
  path: string;
  closeMenu: () => void;
}) {
  const queryClient = useQueryClient();

  const windows = useWindowStore((state) => state.windows);
  const backgroundWindow = windows.find(
    (w) => w.type === WindowType.Background
  );
  const driveID = backgroundWindow?.driveID || "";

  const mkdirMutation = useMkdir();

  const newWindow = useWindowStore((state) => state.newWindow);

  const handleUpload = useCallback(() => {
    if (path) {
      newWindow({
        targetKey: path,
        type: WindowType.Uploader,
        title: "Uploader",
        driveID,
      });
      closeMenu();
    }
  }, [path, driveID, newWindow, closeMenu]);

  const handleCreateFolder = useCallback(async () => {
    if (!path || !driveID) {
      return;
    }
    closeMenu();

    const folderName = "New Folder";
    const folderPath = `${path === "/" ? "" : path}/${folderName}`;

    try {
      await mkdirMutation.mutateAsync({
        driveID,
        data: { path: folderPath },
      });
      queryClient.invalidateQueries({
        predicate: isFsQuery,
      });
    } catch {
      // Error is surfaced via the mutation's onError handler in the UI layer
    }
  }, [path, driveID, closeMenu, mkdirMutation, queryClient]);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({
      predicate: isFsQuery,
    });
    closeMenu();
  }, [queryClient, closeMenu]);

  const menuList = [
    { name: "Upload", action: handleUpload },
    { name: "Create Folder", action: handleCreateFolder },
    { name: "/", action: () => {} },
    { name: "Refresh", action: handleRefresh },
  ];

  return <MenuList menuList={menuList} />;
}