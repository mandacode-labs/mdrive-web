import { usePresignDownload } from "@/api/generated";
import { useWindowStore } from "@/store/window.store";

export default function Audio({ fileKey: path }: { fileKey: string }) {
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
    <div className={"full-size flex-center"}>
      {downloadQuery.data && (
        <audio controls>
          <source src={downloadQuery.data} type="audio/mpeg" />
          <track kind="captions" />
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  );
}