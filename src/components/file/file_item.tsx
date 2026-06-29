"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLs } from "@/api/generated";
import { useFileStore } from "@/store/file.store";
import { useWindowStore } from "@/store/window.store";
import type { FileType } from "@/types/file";
import { type FileIconType, VirtualFileType } from "@/types/file";
import { WindowType } from "@/types/window";
import { getIconType, getWindowType, isSelectable } from "@/utils/file_type";
import { createSerialKey } from "@/utils/serial_key";
import FileIcon from "./file_icon";
import styles from "./file_item.module.css";
import FileName from "./file_name";

export default memo(function FileItem({
  name,
  type,
  fileKey,
  windowKey,
  driveID,
  backgroundFile = false,
}: {
  name: string;
  type: FileType;
  fileKey: string;
  windowKey: string;
  driveID?: string;
  backgroundFile?: boolean;
}) {
  const serialKey = createSerialKey(fileKey, windowKey);
  const selectedFileBackground = "#f0f0f033";
  const selectedFile = "#55555533";

  const [icon, setIcon] = useState<FileIconType | null>(null);

  const selectedFileSerials = useFileStore(
    (state) => state.selectedFileSerials
  );
  const selectBox = useFileStore((state) => state.selectBoxRect);
  const targetWindow = useFileStore((state) => state.selectBoxWindowKey);
  const setFileIconRef = useFileStore((state) => state.setFileIconRef);
  const setHighlightedFile = useFileStore((state) => state.setHighlightedFile);
  const selectFile = useFileStore((state) => state.selectFile);
  const unselectFile = useFileStore((state) => state.unselectFile);
  const newWindow = useWindowStore((state) => state.newWindow);
  const getBackgroundWindow = useWindowStore(
    (state) => state.getBackgroundWindow
  );
  const updateWindow = useWindowStore((state) => state.updateWindow);

  const fileRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLButtonElement>(null);

  // For virtual "upload" file, show whether the target dir already has any
  // children to indicate it can accept uploads.
  const dirLsQuery = useLs(
    driveID || "",
    { path: fileKey },
    {
      query: {
        select: (data) =>
          data.status === 200 ? (data.data.entries?.length ?? 0) > 0 : false,
        enabled:
          !!driveID && type === VirtualFileType.Upload && fileKey.length > 0,
      },
      fetch: { credentials: "include" },
    }
  );

  const backgroundWindowKey = useMemo(() => {
    const backgroundWindow = getBackgroundWindow();
    return backgroundWindow?.key || "";
  }, [getBackgroundWindow]);

  const handleMouseEnter = useCallback(() => {
    setHighlightedFile({
      fileKey,
      windowKey,
      fileName: name,
      type,
      ref: fileRef,
    });
  }, [setHighlightedFile, fileKey, windowKey, name, type]);

  const handleMouseLeave = useCallback(() => {
    setHighlightedFile(null);
  }, [setHighlightedFile]);

  const checkFileInSelectBox = useCallback(() => {
    if (!selectBox) return;
    if (!fileRef.current) return;
    if (windowKey !== targetWindow) return;
    const fileRect = fileRef.current.getBoundingClientRect();
    if (
      isSelectable(type) &&
      fileRect.top < selectBox.bottom &&
      fileRect.bottom > selectBox.top &&
      fileRect.left < selectBox.right &&
      fileRect.right > selectBox.left
    ) {
      selectFile(fileKey, windowKey);
    } else {
      unselectFile(fileKey, windowKey);
    }
  }, [
    fileKey,
    selectBox,
    selectFile,
    targetWindow,
    type,
    unselectFile,
    windowKey,
  ]);

  useEffect(() => {
    checkFileInSelectBox();
  }, [checkFileInSelectBox]);

  useEffect(() => {
    setIcon(getIconType(type, name));
  }, [type, name]);

  useEffect(() => {
    setFileIconRef(fileKey, windowKey, iconRef);
  }, [fileKey, setFileIconRef, windowKey]);

  const handleSingleClick = useCallback(() => {
    selectFile(fileKey, windowKey);
  }, [fileKey, selectFile, windowKey]);

  const handleDoubleClick = useCallback(() => {
    const winType = getWindowType(type, name);
    if (winType === null) return;

    if (windowKey === backgroundWindowKey) {
      newWindow({
        targetKey: fileKey,
        type: winType,
        title: name,
        driveID,
      });
    } else if (winType === WindowType.Navigator) {
      setHighlightedFile(null);
      updateWindow({
        targetWindowKey: windowKey,
        targetFileKey: fileKey,
        title: name,
      });
    } else {
      newWindow({
        targetKey: fileKey,
        type: winType,
        title: name,
        driveID,
      });
    }
  }, [
    backgroundWindowKey,
    fileKey,
    name,
    newWindow,
    setHighlightedFile,
    driveID,
    type,
    updateWindow,
    windowKey,
  ]);

  return (
    <div className={`full-size ${styles.container}`}>
      <li
        className={`${styles.item_wrapper}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          backgroundColor:
            (selectedFileSerials.includes(serialKey) &&
              (backgroundFile ? selectedFileBackground : selectedFile)) ||
            "transparent",
        }}
      >
        <div className={`full-size flex-center ${styles.item}`} ref={fileRef}>
          {icon && (
            <FileIcon
              ref={iconRef}
              onClick={handleSingleClick}
              onDoubleClick={handleDoubleClick}
              icon={icon}
              fileName={name}
              hasContent={type === VirtualFileType.Upload ? !!dirLsQuery.data : false}
            />
          )}
          <FileName
            name={name}
            fileKey={fileKey}
            windowKey={windowKey}
            backgroundFile={backgroundFile}
          />
        </div>
      </li>
    </div>
  );
});