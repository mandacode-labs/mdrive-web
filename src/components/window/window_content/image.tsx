import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MdFitScreen,
  MdNavigateBefore,
  MdNavigateNext,
  MdRotateLeft,
  MdRotateRight,
  MdZoomIn,
  MdZoomOut,
} from "react-icons/md";
import { useLs, usePresignDownload } from "@/api/generated";
import type { DirEntry } from "@/api/generated/model";
import { useWindowStore } from "@/store/window.store";
import { ContentTypes, getContentTypes } from "@/utils/content_type";
import mediaStyles from "./media.module.css";

const ZOOM_STEP = 0.25;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 8;
const ROTATE_STEP = 90;

export default function ImageViewer({
  fileKey: path,
  fileName,
  windowKey,
}: {
  fileKey: string;
  fileName: string;
  windowKey: string;
}) {
  const windows = useWindowStore((state) => state.windows);
  const updateWindow = useWindowStore((state) => state.updateWindow);
  const currentFocusedKey = useWindowStore((state) => state.currentWindow?.key);
  const currentWindow = windows.find((w) => w.key === windowKey);
  const driveID = currentWindow?.driveID || "";

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!path) return;
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  }, [path]);

  const dirPath = useMemo(() => {
    const parts = path.split("/");
    parts.pop();
    return parts.join("/") || "/";
  }, [path]);

  const dirQuery = useLs(
    driveID,
    { path: dirPath },
    {
      query: {
        select: (data) => (data.status === 200 ? data.data.entries ?? [] : []),
        enabled: !!driveID && !!dirPath,
      },
      fetch: { credentials: "include" },
    }
  );

  const { imageFiles, currentIndex } = useMemo(() => {
    if (!dirQuery.data)
      return { imageFiles: [] as DirEntry[], currentIndex: -1 };
    const images = (dirQuery.data as DirEntry[])
      .filter((entry) => {
        if (!entry.name) return false;
        return getContentTypes(entry.name) === ContentTypes.Image;
      })
      .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    const idx = images.findIndex(
      (entry) => joinPath(dirPath, entry.name ?? "") === path
    );
    return { imageFiles: images, currentIndex: idx };
  }, [dirQuery.data, dirPath, path]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < imageFiles.length - 1;

  const downloadQuery = usePresignDownload(
    driveID,
    { path },
    {
      query: {
        select: (data) => (data.status === 200 ? data.data.url : null),
      },
      fetch: { credentials: "include" },
    }
  );

  const navigateTo = useCallback(
    (index: number) => {
      const target = imageFiles[index];
      if (!target?.name) return;
      const newFileKey = joinPath(dirPath, target.name);
      updateWindow({
        targetWindowKey: windowKey,
        targetFileKey: newFileKey,
        title: target.name,
      });
    },
    [imageFiles, dirPath, windowKey, updateWindow]
  );

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => {
      const next = Math.max(z - ZOOM_STEP, MIN_ZOOM);
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const fitScreen = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const rotateLeft = useCallback(() => {
    setRotation((r) => r - ROTATE_STEP);
  }, []);

  const rotateRight = useCallback(() => {
    setRotation((r) => r + ROTATE_STEP);
  }, []);

  useEffect(() => {
    const container = document.querySelector(
      `[data-window-key="${windowKey}"]`
    );
    if (!container) return;

    const handleWheel = (e: Event) => {
      if (currentFocusedKey !== windowKey) return;
      e.preventDefault();
      const delta = (e as WheelEvent).deltaY;
      if (delta < 0) {
        setZoom((z) => Math.min(z + ZOOM_STEP * 0.5, MAX_ZOOM));
      } else {
        setZoom((z) => {
          const next = Math.max(z - ZOOM_STEP * 0.5, MIN_ZOOM);
          if (next <= 1) setPan({ x: 0, y: 0 });
          return next;
        });
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [windowKey, currentFocusedKey]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (zoom <= 1) return;
      e.preventDefault();
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY };
      panOffset.current = { ...pan };
    },
    [zoom, pan]
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setPan({
      x: panOffset.current.x + dx,
      y: panOffset.current.y + dy,
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const isFit = zoom === 1;
  const cursor = isFit ? "default" : isPanning.current ? "grabbing" : "grab";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentFocusedKey !== windowKey) return;
      if (e.key === "ArrowLeft" && hasPrev) {
        navigateTo(currentIndex - 1);
      } else if (e.key === "ArrowRight" && hasNext) {
        navigateTo(currentIndex + 1);
      } else if (e.key === "+" || e.key === "=") {
        zoomIn();
      } else if (e.key === "-") {
        zoomOut();
      } else if (e.key === "0") {
        fitScreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    currentFocusedKey,
    windowKey,
    hasPrev,
    hasNext,
    currentIndex,
    navigateTo,
    zoomIn,
    zoomOut,
    fitScreen,
  ]);

  const needsTransform = zoom !== 1 || rotation !== 0;
  const imageStyle: React.CSSProperties = needsTransform
    ? {
        objectFit: "contain",
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
        transition: isPanning.current ? "none" : "transform 0.15s ease",
      }
    : { objectFit: "contain" };

  return (
    <div className={`full-size ${mediaStyles.container}`}>
      <div
        className={mediaStyles.imageArea}
        role="img"
        aria-label={fileName}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor }}
      >
        {downloadQuery.data && (
          <Image
            src={downloadQuery.data}
            alt={fileName}
            fill
            style={{
              ...imageStyle,
              userSelect: "none",
              pointerEvents: "none",
            }}
            unoptimized
            draggable={false}
          />
        )}
      </div>
      <div className={mediaStyles.toolbar}>
        <div className={mediaStyles.toolbarGroup}>
          <button
            type="button"
            className={mediaStyles.toolButton}
            onClick={() => navigateTo(currentIndex - 1)}
            disabled={!hasPrev}
            aria-label="Previous image"
          >
            <MdNavigateBefore size={20} />
          </button>
          <button
            type="button"
            className={mediaStyles.toolButton}
            onClick={() => navigateTo(currentIndex + 1)}
            disabled={!hasNext}
            aria-label="Next image"
          >
            <MdNavigateNext size={20} />
          </button>
        </div>
        <div className={mediaStyles.toolbarDivider} />
        <div className={mediaStyles.toolbarGroup}>
          <button
            type="button"
            className={mediaStyles.toolButton}
            onClick={zoomIn}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Zoom in"
          >
            <MdZoomIn size={18} />
          </button>
          <button
            type="button"
            className={mediaStyles.toolButton}
            onClick={zoomOut}
            disabled={zoom <= MIN_ZOOM}
            aria-label="Zoom out"
          >
            <MdZoomOut size={18} />
          </button>
          <button
            type="button"
            className={mediaStyles.toolButton}
            onClick={fitScreen}
            disabled={isFit && rotation === 0 && pan.x === 0 && pan.y === 0}
            aria-label="Best fit"
          >
            <MdFitScreen size={18} />
          </button>
        </div>
        <div className={mediaStyles.toolbarDivider} />
        <div className={mediaStyles.toolbarGroup}>
          <button
            type="button"
            className={mediaStyles.toolButton}
            onClick={rotateLeft}
            aria-label="Rotate left"
          >
            <MdRotateLeft size={18} />
          </button>
          <button
            type="button"
            className={mediaStyles.toolButton}
            onClick={rotateRight}
            aria-label="Rotate right"
          >
            <MdRotateRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function joinPath(base: string, name: string): string {
  const cleanedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  if (!cleanedBase || cleanedBase === "/") return `/${name}`;
  return `${cleanedBase}/${name}`;
}