import { memo, useEffect, useRef, useState } from "react";
import { useRename } from "@/api/hooks";
import { useFileStore } from "@/store/file.store";
import { useWindowStore } from "@/store/window.store";
import { parseSerialKey } from "@/utils/serial_key";
import styles from "./file_name.module.css";

export default memo(function FileName({
  name,
  fileKey,
  windowKey,
  backgroundFile = false,
}: {
  name: string;
  fileKey: string;
  windowKey: string;
  backgroundFile?: boolean;
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(name);

  const inputRef = useRef<HTMLInputElement>(null);

  const renamingFileSerial = useFileStore((state) => state.renamingFileSerial);
  const setRenamingFile = useFileStore((state) => state.setRenamingFile);

  const windows = useWindowStore((state) => state.windows);
  const currentWindow = windows.find((w) => w.key === windowKey);
  const driveID = currentWindow?.driveID || "";

  const renameMutation = useRename();

  const updateFileName = async () => {
    if (!newName.trim() || newName === name) {
      setIsRenaming(false);
      setRenamingFile(null);
      return;
    }

    try {
      await renameMutation.mutateAsync({
        driveID,
        path: fileKey,
        newName: newName.trim(),
      });
    } catch {
      setNewName(name);
    }

    setIsRenaming(false);
    setRenamingFile(null);
  };

  useEffect(() => {
    if (renamingFileSerial) {
      const { fileKey: renamingFileKey, windowKey: renamingWindowKey } =
        parseSerialKey(renamingFileSerial);
      if (fileKey === renamingFileKey && windowKey === renamingWindowKey) {
        setIsRenaming(true);
      }
    } else {
      setIsRenaming(false);
    }
  }, [fileKey, renamingFileSerial, windowKey]);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  return (
    <div className={`flex-center full-size`}>
      {isRenaming ? (
        <form
          className={styles.rename_form}
          onSubmit={(e) => {
            e.preventDefault();
            updateFileName();
            setIsRenaming(false);
            setRenamingFile(null);
          }}
        >
          <input
            ref={inputRef}
            type="text"
            className={`${styles.rename_input} ${backgroundFile ? styles.rename_input_background : ""}`}
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
            }}
            onBlur={() => {
              setIsRenaming(false);
              setRenamingFile(null);
            }}
          />
        </form>
      ) : (
        <div className={styles.stale_container}>
          <div
            className={`${styles.name_text} ${backgroundFile && styles.background_file_name}`}
          >
            {name}
          </div>
        </div>
      )}
    </div>
  );
});