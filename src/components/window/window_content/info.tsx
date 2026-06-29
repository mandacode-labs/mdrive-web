import { useDriveStat } from "@/api/hooks";
import { useWindowStore } from "@/store/window.store";
import { isDirectory, isSymlink } from "@/types/file";
import styles from "./info.module.css";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
  if (bytes < 1024 ** 4) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  return `${(bytes / 1024 ** 4).toFixed(2)} TB`;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString();
}

export default function InfoViewer({
  fileKey: path,
  fileName,
}: {
  fileKey: string;
  fileName: string;
}) {
  const windows = useWindowStore((state) => state.windows);
  const currentWindow = windows.find((w) => w.targetKey === path);
  const driveID = currentWindow?.driveID || "";

  const statQuery = useDriveStat(driveID, path);

  const nodeStat = statQuery.data ?? null;

  if (statQuery.isLoading) {
    return (
      <div className={`full-size flex-center ${styles.container}`}>
        <span className={styles.loading}>Loading...</span>
      </div>
    );
  }

  if (!nodeStat) {
    return (
      <div className={`full-size flex-center ${styles.container}`}>
        <span className={styles.error}>File info not available</span>
      </div>
    );
  }

  const fileType = isDirectory(nodeStat.mode)
    ? "directory"
    : isSymlink(nodeStat.mode)
      ? "symlink"
      : "file";

  return (
    <div className={`full-size ${styles.container}`}>
      <table className={styles.table}>
        <tbody>
          <tr>
            <td className={styles.label}>name</td>
            <td className={styles.value}>{fileName}</td>
          </tr>
          <tr>
            <td className={styles.label}>size</td>
            <td className={styles.value}>{formatBytes(nodeStat.size ?? 0)}</td>
          </tr>
          <tr>
            <td className={styles.label}>type</td>
            <td className={styles.value}>{fileType}</td>
          </tr>
          <tr>
            <td className={styles.label}>mode</td>
            <td className={styles.value}>
              {(nodeStat.mode ?? 0).toString(8).padStart(4, "0")}
            </td>
          </tr>
          <tr>
            <td className={styles.label}>uid</td>
            <td className={styles.value}>{nodeStat.uid ?? "-"}</td>
          </tr>
          <tr>
            <td className={styles.label}>gid</td>
            <td className={styles.value}>{nodeStat.gid ?? "-"}</td>
          </tr>
          <tr>
            <td className={styles.label}>inode</td>
            <td className={styles.value}>{nodeStat.ino ?? "-"}</td>
          </tr>
          <tr>
            <td className={styles.label}>created</td>
            <td className={styles.value}>{formatDate(nodeStat.crtime)}</td>
          </tr>
          <tr>
            <td className={styles.label}>modified</td>
            <td className={styles.value}>{formatDate(nodeStat.mtime)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}