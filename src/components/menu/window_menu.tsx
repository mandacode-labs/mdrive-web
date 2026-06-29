import { useCallback } from "react";
import { useMkdir } from "@/api/hooks";
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
  const windows = useWindowStore((state) => state.windows);
  const currentWindow = windows.find((w) => w.targetKey === path);
  const driveID = currentWindow?.driveID || "";

  const newWindow = useWindowStore((state) => state.newWindow);

  const mkdirMutation = useMkdir();

  const handleUpload = useCallback(() => {
    newWindow({
      targetKey: path,
      type: WindowType.Uploader,
      title: "Uploader",
      driveID,
    });
    closeMenu();
  }, [closeMenu, newWindow, path, driveID]);

  const handleCreateFolder = useCallback(async () => {
    if (!path || !driveID) return;

    await mkdirMutation
      .mutateAsync({
        driveID,
        data: { path: `${path === "/" ? "" : path}/New Folder` },
      })
      .then(() => {
        closeMenu();
      });
  }, [path, driveID, closeMenu, mkdirMutation]);

  const handleRefresh = useCallback(() => {
    closeMenu();
  }, [closeMenu]);

  switch (windowType) {
    case WindowType.Navigator:
      return (
        <MenuList
          menuList={[
            { name: "Upload", action: handleUpload },
            { name: "Create Folder", action: handleCreateFolder },
            { name: "/", action: () => {} },
            { name: "Refresh", action: handleRefresh },
          ]}
        />
      );
    default:
      return null;
  }
}