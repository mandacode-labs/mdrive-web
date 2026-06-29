import { useCallback, useEffect } from "react";
import type { DirEntry } from "@/api/generated/model";
import { useDriveLs } from "@/api/hooks";
import { SpecialFileName, VirtualFileType } from "@/types/file";
import { getFileTypeFromEntry, getFileTypeSortOrder } from "@/utils/file_type";
import styles from "./file_container.module.css";
import FileItem from "./file_item";

export default function FileContainer({
  windowKey,
  driveID,
  path,
  setLoading,
  upload = false,
  backgroundFile = false,
}: {
  windowKey: string;
  driveID: string;
  path: string;
  setLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  upload?: boolean;
  backgroundFile?: boolean;
}) {
  const readDirQuery = useDriveLs(driveID, path);

  const sortFiles = useCallback((a: DirEntry, b: DirEntry): number => {
    const specialFileOrder = [SpecialFileName.Root, SpecialFileName.Home] as string[];

    const aName = a.name ?? "";
    const bName = b.name ?? "";

    if (aName.startsWith(".")) return 1;
    if (bName.startsWith(".")) return -1;

    const aIndex = specialFileOrder.indexOf(aName);
    const bIndex = specialFileOrder.indexOf(bName);
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;

    const aTypeOrder = getFileTypeSortOrder(getFileTypeFromEntry(a));
    const bTypeOrder = getFileTypeSortOrder(getFileTypeFromEntry(b));
    return aTypeOrder - bTypeOrder;
  }, []);

  useEffect(() => {
    if (setLoading) {
      setLoading(readDirQuery.isFetching);
    }
  }, [readDirQuery.isFetching, setLoading]);

  if (readDirQuery.isError && readDirQuery.error) {
    return (
      <div className="flex-center full-size">
        {"message" in readDirQuery.error &&
        typeof readDirQuery.error.message === "string"
          ? readDirQuery.error.message
          : "Error loading files"}
      </div>
    );
  }

  return (
    <div className={`${styles.container} full-size`}>
      {upload && (
        <FileItem
          name={SpecialFileName.Upload}
          type={VirtualFileType.Upload}
          fileKey={path}
          windowKey={windowKey}
          driveID={driveID}
          backgroundFile={backgroundFile}
        />
      )}
      {(readDirQuery.data ?? [])
        .filter((entry: DirEntry) => !entry.name?.startsWith("."))
        .filter((entry: DirEntry) => entry.name !== undefined)
        .sort(sortFiles)
        .map((entry: DirEntry) => (
          <FileItem
            key={entry.inodeID ?? entry.name}
            name={entry.name ?? ""}
            type={getFileTypeFromEntry(entry)}
            fileKey={joinPath(path, entry.name ?? "")}
            windowKey={windowKey}
            driveID={driveID}
            backgroundFile={backgroundFile}
          />
        ))}
    </div>
  );
}

function joinPath(base: string, name: string): string {
  const cleanedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  if (!cleanedBase || cleanedBase === "/") return `/${name}`;
  return `${cleanedBase}/${name}`;
}