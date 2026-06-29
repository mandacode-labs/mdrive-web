import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getWindowConfig } from "@/config/window";
import { useEventStore } from "@/store/ui.store";
import { useWindowStore } from "@/store/window.store";
import { WindowType } from "@/types/window";
import styles from "./window.module.css";
import WindowContent from "./window_content";
import WindowHeader from "./window_header";

export default memo(function Window({ windowKey }: { windowKey: string }) {
  const minWindowSize = useMemo(() => ({ width: 250, height: 180 }), []);

  const [maximized, setMaximized] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [prevWindowSize, setPrevWindowSize] = useState({ width: 0, height: 0 });
  const [windowPosition, setWindowPosition] = useState({ x: 0, y: 0 });
  const [prevWindowPosition, setPrevWindowPosition] = useState({ x: 0, y: 0 });
  const [contentLoading, setContentLoading] = useState(false);

  const targetWindow = useWindowStore((state) =>
    state.windows.find((w) => w.key === windowKey)
  );
  const resizingCursor = useEventStore((state) => state.resizingCursor);
  const closeWindow = useWindowStore((state) => state.closeWindow);
  const minimizeWindow = useWindowStore((state) => state.minimizeWindow);
  const setResizingCursor = useEventStore((state) => state.setResizingCursor);
  const highlightWindow = useWindowStore((state) => state.highlightWindow);
  const prevWindow = useWindowStore((state) => state.prevWindow);
  const nextWindow = useWindowStore((state) => state.nextWindow);
  const setCurrentWindow = useWindowStore((state) => state.setCurrentWindow);
  const setMouseEnter = useWindowStore((state) => state.setMouseEnter);
  const setTitle = useWindowStore((state) => state.setTitle);
  const hasPrevWindow = useWindowStore((state) => state.hasPrevWindow);
  const hasNextWindow = useWindowStore((state) => state.hasNextWindow);

  const windowRef = useRef<HTMLDivElement>(null);
  const windowHeaderRef = useRef<HTMLDivElement>(null);
  const windowContentRef = useRef<HTMLDivElement>(null);
  const positionInitializedRef = useRef(false);

  useEffect(() => {
    if (targetWindow?.type === WindowType.Uploader) {
      setTitle(windowKey, "Uploader");
    } else if (targetWindow?.targetKey) {
      const path = targetWindow.targetKey;
      const fileName = path.split("/").filter(Boolean).pop() || path;
      setTitle(windowKey, fileName);
    }
  }, [setTitle, targetWindow?.targetKey, targetWindow?.type, windowKey]);

  const enterWindow = useCallback(() => {
    setCurrentWindow({
      key: windowKey,
      windowRef,
      contentRef: windowContentRef,
      headerRef: windowHeaderRef,
    });
  }, [setCurrentWindow, windowKey]);

  const enterWindowHeader = useCallback(() => {
    setCurrentWindow(null);
  }, [setCurrentWindow]);

  useEffect(() => {
    if (windowRef.current && targetWindow && !positionInitializedRef.current) {
      const config = getWindowConfig(targetWindow.type);
      const x = document.body.clientWidth / 2 - config.defaultSize.width / 2;
      const y = document.body.clientHeight / 2 - config.defaultSize.height / 2;
      setWindowPosition({ x, y });
      setWindowSize(config.defaultSize);
      positionInitializedRef.current = true;
    }
  }, [targetWindow]);

  useEffect(() => {
    if (windowRef.current) {
      windowRef.current.style.width = `${windowSize.width}px`;
      windowRef.current.style.height = `${windowSize.height}px`;
    }
  }, [windowSize]);

  useEffect(() => {
    if (windowRef.current) {
      windowRef.current.style.left = `${windowPosition.x}px`;
      windowRef.current.style.top = `${windowPosition.y}px`;
    }
  }, [windowPosition]);

  const maximizeWindow = useCallback(() => {
    setPrevWindowSize(windowSize);
    setPrevWindowPosition(windowPosition);
    setWindowSize({
      width: document.body.clientWidth,
      height: document.body.clientHeight,
    });
    setWindowPosition({ x: 0, y: 0 });
    setMaximized(true);
  }, [windowPosition, windowSize]);

  const revertWindowSize = useCallback(() => {
    setWindowSize(prevWindowSize);
    setWindowPosition(prevWindowPosition);
    setMaximized(false);
  }, [prevWindowSize, prevWindowPosition]);

  const moveWindow = useCallback(
    (e: React.MouseEvent) => {
      if (
        windowRef.current &&
        windowHeaderRef.current &&
        e.clientX > 0 &&
        e.clientY > 0 &&
        !resizingCursor
      ) {
        const headerRect = windowHeaderRef.current.getBoundingClientRect();
        const x = e.clientX - headerRect.left;
        const y = e.clientY - headerRect.top;
        const handleMouseMove = (e: MouseEvent) => {
          if (windowRef.current) {
            setWindowPosition({
              x: e.clientX - x,
              y: e.clientY - y,
            });
          }
        };
        const handleMouseUp = () => {
          if (windowRef.current) {
            const windowRect = windowRef.current.getBoundingClientRect();
            const x = windowRect.left;
            const y = windowRect.top;
            let newX = x;
            let newY = y;
            if (x < 0) {
              newX = 0;
            }
            if (y < 0) {
              newY = 0;
            }
            if (x + windowSize.width > document.body.clientWidth) {
              newX = document.body.clientWidth - windowSize.width;
            }
            if (y + windowSize.height > document.body.clientHeight) {
              newY = document.body.clientHeight - windowSize.height;
            }
            setWindowPosition({ x: newX, y: newY });
          }
          window.removeEventListener("mousemove", handleMouseMove);
          window.removeEventListener("mouseup", handleMouseUp);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
      }
    },
    [resizingCursor, windowSize.height, windowSize.width]
  );

  const changeCursor = useCallback(
    (e: MouseEvent) => {
      if (!windowRef.current) return;
      const rect = windowRef.current.getBoundingClientRect();
      if (e.clientX > rect.right - 10 && e.clientY > rect.bottom - 10) {
        setResizingCursor(true);
        windowRef.current.style.cursor = "nwse-resize";
      } else {
        setResizingCursor(false);
        windowRef.current.style.cursor = "default";
      }
    },
    [setResizingCursor]
  );
  useEffect(() => {
    const currentWindow = windowRef.current;
    if (!currentWindow) return;
    currentWindow.addEventListener("mousemove", changeCursor);
    return () => {
      currentWindow.removeEventListener("mousemove", changeCursor);
    };
  }, [changeCursor]);

  const resizeWindow = useCallback(
    (e: MouseEvent) => {
      if (!windowRef.current) return;
      const rect = windowRef.current.getBoundingClientRect();
      if (
        resizingCursor &&
        e.clientX > rect.right - 10 &&
        e.clientY > rect.bottom - 10
      ) {
        const handleMouseMove = (e: MouseEvent) => {
          const width = Math.max(e.clientX - rect.left, minWindowSize.width);
          const height = Math.max(e.clientY - rect.top, minWindowSize.height);
          setWindowSize({ width, height });
        };
        const handleMouseUp = () => {
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
        };
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      }
    },
    [minWindowSize.width, minWindowSize.height, resizingCursor]
  );
  useEffect(() => {
    const currentWindow = windowRef.current;
    if (!currentWindow) return;
    currentWindow.addEventListener("mousedown", resizeWindow);
    return () => {
      currentWindow.removeEventListener("mousedown", resizeWindow);
    };
  }, [resizeWindow]);

  if (targetWindow?.minimized) {
    return null;
  }

  return (
    <article
      className={`flex-center ${styles.container}`}
      ref={windowRef}
      onMouseDown={() => highlightWindow(windowKey)}
      onMouseEnter={() => setMouseEnter(true)}
      onMouseLeave={() => setMouseEnter(false)}
    >
      <WindowHeader
        ref={windowHeaderRef}
        onMouseDown={moveWindow}
        loading={contentLoading}
        title={targetWindow?.title || ""}
        prevWindowAction={() => prevWindow(windowKey)}
        nextWindowAction={() => nextWindow(windowKey)}
        hasPrevWindow={hasPrevWindow(windowKey)}
        hasNextWindow={hasNextWindow(windowKey)}
        buttonActions={[
          {
            action: () => minimizeWindow(windowKey),
            icon: "minimize",
          },
          {
            action: maximized ? revertWindowSize : maximizeWindow,
            icon: maximized ? "exit_fullscreen" : "fullscreen",
          },
          {
            action: () => closeWindow(windowKey),
            icon: "close",
          },
        ]}
        onMouseEnter={enterWindowHeader}
      />
      {targetWindow && (
        <WindowContent
          fileKey={targetWindow.targetKey}
          fileName={
            targetWindow.targetKey.split("/").filter(Boolean).pop() || ""
          }
          windowKey={windowKey}
          setLoading={setContentLoading}
          type={targetWindow.type}
          ref={windowContentRef}
          onMouseEnter={enterWindow}
        />
      )}
    </article>
  );
});