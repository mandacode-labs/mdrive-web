import { useCallback } from "react";
import { useWindowStore } from "@/store/window.store";
import { FileIconType } from "@/types/file";
import { WindowType } from "@/types/window";
import FileIcon from "../../file/file_icon";
import styles from "./navbar_icon.module.css";

export default function NavbarIcon({
  windowType,
  windowCount,
  driveID,
}: {
  windowType: WindowType;
  windowCount: number;
  driveID?: string;
}) {
  const size = "calc(100% - 5px)";

  const highlightWindowsByType = useWindowStore(
    (state) => state.highlightWindowsByType
  );
  const restoreWindow = useWindowStore((state) => state.restoreWindow);
  const windows = useWindowStore((state) => state.windows);
  const newWindow = useWindowStore((state) => state.newWindow);

  const handleClick = useCallback(() => {
    windows
      .filter((w) => w.type === windowType && w.minimized)
      .forEach((w) => void restoreWindow(w.key));

    switch (windowType) {
      case WindowType.Uploader:
        if (windowCount === 0) {
          newWindow({
            targetKey: "/",
            type: WindowType.Uploader,
            title: "Uploader",
            driveID,
          });
        }
        break;
    }
    highlightWindowsByType(windowType);
  }, [
    driveID,
    highlightWindowsByType,
    newWindow,
    restoreWindow,
    windows,
    windowCount,
    windowType,
  ]);

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.icon_container}
        onClick={handleClick}
      >
        {windowCount > 0 && <div className={styles.icon_highlight} />}
        {windowType === WindowType.Navigator && (
          <FileIcon
            icon={FileIconType.Directory}
            size={size}
            asButton={false}
          />
        )}
        {windowType === WindowType.Image && (
          <FileIcon icon={FileIconType.Image} size={size} asButton={false} />
        )}
        {windowType === WindowType.Video && (
          <FileIcon icon={FileIconType.Video} size={size} asButton={false} />
        )}
        {windowType === WindowType.Audio && (
          <FileIcon icon={FileIconType.Object} size={size} asButton={false} />
        )}
        {windowType === WindowType.Uploader && (
          <FileIcon icon={FileIconType.Upload} size={size} asButton={false} />
        )}
        {windowType === WindowType.Document && (
          <FileIcon icon={FileIconType.Regular} size={size} asButton={false} />
        )}
      </button>
    </div>
  );
}