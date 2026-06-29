import { usePresignDownload } from "@/api/generated";
import { useWindowStore } from "@/store/window.store";
import styles from "./video.module.css";

export default function VideoViewer({ fileKey: path }: { fileKey: string }) {
  const windows = useWindowStore((state) => state.windows);
  const currentWindow = windows.find((w) => w.targetKey === path);
  const driveID = currentWindow?.driveID || "";

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

  return (
    <div className={`full-size flex-center ${styles.container}`}>
      {downloadQuery.data && (
        <video
          controls
          className="full-size flex-center"
          style={{ objectFit: "contain" }}
        >
          <source src={downloadQuery.data} type="video/mp4" />
          <track kind="captions" />
        </video>
      )}
    </div>
  );
}