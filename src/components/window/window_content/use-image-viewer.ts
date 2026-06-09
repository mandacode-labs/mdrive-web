import { useCallback, useEffect, useRef, useState } from "react";

const ZOOM_STEP = 0.25;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 8;
const ROTATE_STEP = 90;

export function useImageViewer() {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOffset = useRef({ x: 0, y: 0 });

  const reset = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  }, []);

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

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY;
    if (delta < 0) {
      setZoom((z) => Math.min(z + ZOOM_STEP * 0.5, MAX_ZOOM));
    } else {
      setZoom((z) => {
        const next = Math.max(z - ZOOM_STEP * 0.5, MIN_ZOOM);
        if (next <= 1) setPan({ x: 0, y: 0 });
        return next;
      });
    }
  }, []);

  const isFit = zoom === 1;
  const cursor = isFit ? "default" : isPanning.current ? "grabbing" : "grab";

  const needsTransform = zoom !== 1 || rotation !== 0;
  const imageStyle: React.CSSProperties = needsTransform
    ? {
        objectFit: "contain",
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
        transition: isPanning.current ? "none" : "transform 0.15s ease",
      }
    : { objectFit: "contain" };

  return {
    zoom,
    rotation,
    pan,
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
  };
}

export function useKeyboardNavigation({
  windowKey,
  currentFocusedKey,
  hasPrev,
  hasNext,
  currentIndex,
  navigateTo,
  zoomIn,
  zoomOut,
  fitScreen,
}: {
  windowKey: string;
  currentFocusedKey: string | undefined;
  hasPrev: boolean;
  hasNext: boolean;
  currentIndex: number;
  navigateTo: (index: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitScreen: () => void;
}) {
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
}

export function useWheelZoom({
  windowKey,
  currentFocusedKey,
  handleWheel,
}: {
  windowKey: string;
  currentFocusedKey: string | undefined;
  handleWheel: (e: WheelEvent) => void;
}) {
  useEffect(() => {
    const container = document.querySelector(
      `[data-window-key="${windowKey}"]`
    );
    if (!container) return;

    const wrappedHandler = (e: Event) => {
      if (currentFocusedKey !== windowKey) return;
      handleWheel(e as WheelEvent);
    };

    container.addEventListener("wheel", wrappedHandler, { passive: false });
    return () => container.removeEventListener("wheel", wrappedHandler);
  }, [windowKey, currentFocusedKey, handleWheel]);
}
