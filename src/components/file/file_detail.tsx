import { forwardRef, memo } from "react";
import type { BackendFileType } from "@/types/file";
import styles from "./file_detail.module.css";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
  if (bytes < 1024 ** 4) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  return `${(bytes / 1024 ** 4).toFixed(2)} TB`;
}

export default memo(
  forwardRef(function FileDetail(
    {
      fileName,
      fileType,
      bytes,
      created,
      modified,
    }: {
      fileName: string;
      fileType: BackendFileType;
      bytes: number;
      created: Date;
      modified: Date;
    },
    ref: React.Ref<HTMLDivElement>
  ) {
    return (
      <div className={styles.detail_container} ref={ref}>
        <div className={styles.detail_item}>
          <div className={styles.detail_item_name}>name</div>
          <div className={styles.detail_item_text}>{fileName}</div>
        </div>
        <div className={styles.detail_item}>
          <div className={styles.detail_item_name}>type</div>
          <div className={styles.detail_item_text}>{fileType}</div>
        </div>
        <div className={styles.detail_item}>
          <div className={styles.detail_item_name}>size</div>
          <div className={styles.detail_item_text}>{formatBytes(bytes)}</div>
        </div>
        <div className={styles.detail_item}>
          <div className={styles.detail_item_name}>created</div>
          <div className={styles.detail_item_text}>
            {created.toLocaleString()}
          </div>
        </div>
        <div className={styles.detail_item}>
          <div className={styles.detail_item_name}>modified</div>
          <div className={styles.detail_item_text}>
            {modified.toLocaleString()}
          </div>
        </div>
      </div>
    );
  })
);