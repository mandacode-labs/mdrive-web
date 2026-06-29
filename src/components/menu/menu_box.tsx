import { useCallback, useEffect, useRef, useState } from "react";
import { useFileStore } from "@/store/file.store";
import { useEventStore } from "@/store/ui.store";
import { useWindowStore } from "@/store/window.store";
import type { FileType } from "@/types/file";
import { WindowType } from "@/types/window";
import BackgroundMenu from "./background_menu";
import FileMenu from "./file_menu";
import styles from "./menu_box.module.css";
import WindowMenu from "./window_menu";

export default function MenuBox({ children }: { children: React.ReactNode }) {
  // States
  const [menuType, setMenuType] = useState<
    "file" | "window" | "background" | null
  >(null);
  const [windowType, setWindowType] = useState<WindowType | null>(null);

  // Refs
  const menuRef = useRef<HTMLDivElement>(null);

  // Store states
  const currentWindow = useWindowStore((state) => state.currentWindow);
  const highlightedFile = useFileStore((state) => state.highlightedFile);
  const pressedKeys = useEventStore((state) => state.pressedKeys);
  // Store actions
  const setMenuRef = useFileStore((state) => state.setMenuRef);
  const isFileKeySelected = useFileStore((state) => state.isFileKeySelected);
  const unselectAllFiles = useFileStore((state) => state.unselectAllFiles);
  const findWindow = useWindowStore((state) => state.findWindow);
  const getBackgroundWindow = useWindowStore(
    (state) => state.getBackgroundWindow
  );

  // States
  const [targetFile, setTargetFile] = useState<{
    fileKey: string;
    fileName: string;
    fileType: FileType;
  } | null>(null);
  const [targetFileKey, setTargetFileKey] = useState<string | null>(null);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 2) return;
      const currentMenuRef = menuRef.current;
      if (currentMenuRef) {
        e.preventDefault();
        currentMenuRef.style.left = `${e.clientX}px`;
        currentMenuRef.style.top = `${e.clientY}px`;
        // Set menu type to background by default
      }
      // Use currentWindow if valid, otherwise fall back to background window
      const validWindow =
        currentWindow && findWindow(currentWindow.key)
          ? findWindow(currentWindow.key)
          : getBackgroundWindow();
      if (validWindow) {
        setWindowType(validWindow.type);
        switch (validWindow.type) {
          case WindowType.Background:
            setMenuType("background");
            setTargetFileKey(validWindow.targetKey);
            break;
          case WindowType.Navigator:
            setMenuType("window");
            setTargetFileKey(validWindow.targetKey);
            break;
        }
      }
      if (highlightedFile) {
        if (
          !pressedKeys.includes("Shift") &&
          !isFileKeySelected(highlightedFile.fileKey)
        ) {
          unselectAllFiles();
        }
        setTargetFile({
          fileKey: highlightedFile.fileKey,
          fileName: highlightedFile.fileName,
          fileType: highlightedFile.type,
        });
        setMenuType("file");
      }
    },
    [
      currentWindow,
      findWindow,
      getBackgroundWindow,
      highlightedFile,
      isFileKeySelected,
      pressedKeys,
      unselectAllFiles,
    ]
  );

  const closeMenu = useCallback(() => {
    setMenuType(null);
    setTargetFile(null);
  }, []);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (e.button === 0) {
        const currentMenuRef = menuRef.current;
        if (
          currentMenuRef &&
          e.target !== currentMenuRef &&
          !currentMenuRef.contains(e.target as Node)
        ) {
          closeMenu();
        }
      }
    },
    [closeMenu]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [handleMouseDown]);

  useEffect(() => {
    if (menuRef.current) {
      setMenuRef(menuRef);
    }
  }, [setMenuRef]);

  return (
    <section
      className="flex-center full-size"
      onContextMenu={handleContextMenu}
      aria-label="context menu area"
    >
      <div className={styles.menu_box} ref={menuRef} hidden={menuType === null}>
        {menuType === "background" && targetFileKey && (
          <BackgroundMenu path={targetFileKey} closeMenu={closeMenu} />
        )}
        {menuType === "file" &&
          targetFile &&
          (currentWindow || getBackgroundWindow()) && (
            <FileMenu
              path={targetFile.fileKey}
              fileName={targetFile.fileName}
              fileType={targetFile.fileType}
              windowKey={currentWindow?.key || getBackgroundWindow()?.key || ""}
              closeMenu={closeMenu}
            />
          )}
        {menuType === "window" && targetFileKey && (
          <WindowMenu
            path={targetFileKey}
            windowType={windowType}
            closeMenu={closeMenu}
          />
        )}
      </div>
      {children}
    </section>
  );
}
