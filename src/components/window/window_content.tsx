import { forwardRef, memo } from "react";
import { WindowType } from "@/types/window";
import ImageViewer from "./window_content/image";
import InfoViewer from "./window_content/info";
import Navigator from "./window_content/navigator";
import Uploader from "./window_content/uploader";
import VideoViewer from "./window_content/video";
import styles from "./window_content.module.css";

// biome-ignore lint/suspicious/noExplicitAny: component props vary by WindowType
const contentComponents: Partial<Record<WindowType, React.ComponentType<any>>> =
  {
    [WindowType.Navigator]: Navigator,
    [WindowType.Uploader]: Uploader,
    [WindowType.Image]: ImageViewer,
    [WindowType.Video]: VideoViewer,
    [WindowType.Info]: InfoViewer,
  };

function getContentProps(
  type: WindowType,
  fileKey: string,
  fileName: string,
  windowKey: string,
  setLoading?: React.Dispatch<React.SetStateAction<boolean>>
) {
  switch (type) {
    case WindowType.Navigator:
      return { path: fileKey, windowKey, setLoading };
    case WindowType.Uploader:
      return { targetPath: fileKey };
    case WindowType.Image:
      return { fileKey, fileName, windowKey };
    case WindowType.Video:
      return { fileKey };
    case WindowType.Info:
      return { fileKey, fileName };
    default:
      return {};
  }
}

export default memo(
  forwardRef(function WindowContent(
    {
      fileKey,
      fileName,
      windowKey,
      setLoading,
      type,
      onMouseEnter,
      onMouseLeave,
    }: {
      fileKey: string;
      fileName: string;
      windowKey: string;
      setLoading?: React.Dispatch<React.SetStateAction<boolean>>;
      type: WindowType;
      onMouseEnter?: () => void;
      onMouseLeave?: () => void;
    },
    ref: React.Ref<HTMLDivElement>
  ) {
    const ContentComponent = contentComponents[type];
    const canRender =
      ContentComponent &&
      (type === WindowType.Uploader || setLoading || fileName);

    return (
      <section
        className={`flex-center full-size ${styles.container}`}
        ref={ref}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        aria-label="window content"
      >
        {canRender && (
          <ContentComponent
            {...getContentProps(type, fileKey, fileName, windowKey, setLoading)}
          />
        )}
      </section>
    );
  })
);
