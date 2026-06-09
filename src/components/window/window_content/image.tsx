import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MdFitScreen,
  MdNavigateBefore,
  MdNavigateNext,
  MdRotateLeft,
  MdRotateRight,
  MdZoomIn,
  MdZoomOut,
} from "react-icons/md";
import { useGetDownloadUrl, useLs } from "@/api/generated";
import type { DirEntry } from "@/api/generated/model";
import { useWindowStore } from "@/store/window.store";
import { ContentTypes, getContentTypes } from "@/utils/content_type";
import mediaStyles from "./media.module.css";
import {
  useImageViewer,
  useKeyboardNavigation,
  useWheelZoom,
} from "./use-image-viewer";

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
  const systemId = currentWindow?.systemId || "";

  // Image viewer state
  const {
    zoom,
    isFit,
    cursor,
    imageStyle,
    zoomIn,
    zoomOut,
    fitScreen,
    rotateLeft,
    rotateRight,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    reset,
  } = useImageViewer();

  // Reset when image changes
  useEffect(() => {
    if (!path) return;
    reset();
  }, [path, reset]);

  // Derive parent directory
  const dirPath = useMemo(() => {
    const parts = path.split("/");
    parts.pop();
    return parts.join("/") || "/";
  }, [path]);

  // Get directory listing for sibling images
  const dirQuery = useLs(
    systemId,
    { path: dirPath },
    {
      query: {
        select: (data) => (data.status === 200 ? data.data.entries : []),
        enabled: !!systemId && !!dirPath,
      },
      fetch: { credentials: "include" },
    }
  );

  // Filter image files and find current index
  const { imageFiles, currentIndex } = useMemo(() => {
    if (!dirQuery.data)
      return { imageFiles: [] as DirEntry[], currentIndex: -1 };
    const images = (dirQuery.data as DirEntry[])
      .filter((entry) => getContentTypes(entry.name) === ContentTypes.Image)
      .sort((a, b) => a.name.localeCompare(b.name));
    const idx = images.findIndex(
      (entry) => `${dirPath === "/" ? "" : dirPath}/${entry.name}` === path
    );
    return { imageFiles: images, currentIndex: idx };
  }, [dirQuery.data, dirPath, path]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < imageFiles.length - 1;

  // Navigation
  const navigateTo = useCallback(
    (index: number) => {
      const target = imageFiles[index];
      if (!target) return;
      const newFileKey = `${dirPath === "/" ? "" : dirPath}/${target.name}`;
      updateWindow({
        targetWindowKey: windowKey,
        targetFileKey: newFileKey,
        title: target.name,
      });
    },
    [imageFiles, dirPath, windowKey, updateWindow]
  );

  // Download URL for current image
  const downloadQuery = useGetDownloadUrl(
    systemId,
    { path },
    {
      query: {
        select: (data) => (data.status === 200 ? data.data.downloadUrl : null),
      },
      fetch: { credentials: "include" },
    }
  );

  // Keyboard navigation
  useKeyboardNavigation({
    windowKey,
    currentFocusedKey,
    hasPrev,
    hasNext,
    currentIndex,
    navigateTo,
    zoomIn,
    zoomOut,
    fitScreen,
  });

  // Wheel zoom
  useWheelZoom({
    windowKey,
    currentFocusedKey,
    handleWheel,
  });

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
            src={downloadQuery.data.downloadUrl}
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
            disabled={zoom >= 8}
            aria-label="Zoom in"
          >
            <MdZoomIn size={18} />
          </button>
          <button
            type="button"
            className={mediaStyles.toolButton}
            onClick={zoomOut}
            disabled={zoom <= 0.25}
            aria-label="Zoom out"
          >
            <MdZoomOut size={18} />
          </button>
          <button
            type="button"
            className={mediaStyles.toolButton}
            onClick={fitScreen}
            disabled={isFit}
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
