import { forwardRef, memo } from "react";
import { XPImageIcons } from "@/components/icons/xp_image_icons";
import { FileIconType } from "@/types/file";
import styles from "./file_icon.module.css";

function getImageIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return <XPImageIcons.JPG />;
    case "gif":
      return <XPImageIcons.GIF />;
    case "bmp":
      return <XPImageIcons.Bitmap />;
    case "tiff":
    case "tif":
      return <XPImageIcons.TIFF />;
    default:
      return <XPImageIcons.Media />;
  }
}

export default memo(
  forwardRef(function FileIcon(
    {
      icon,
      fileName,
      onClick,
      onDoubleClick,
      hasContent = false,
      asButton = true,
      size = "4rem",
    }: {
      icon: FileIconType;
      fileName?: string;
      onClick?: () => void;
      onDoubleClick?: () => void;
      hasContent?: boolean;
      asButton?: boolean;
      size?: string;
    },
    ref?: React.Ref<HTMLButtonElement | HTMLDivElement>
  ) {
    const Wrapper = asButton ? "button" : "div";
    const wrapperProps = asButton
      ? {
          type: "button" as const,
          onClick,
          onDoubleClick,
          onDragStart: (e: React.DragEvent) => e.preventDefault(),
          draggable: false as const,
        }
      : {
          onClick,
          onDoubleClick,
          onDragStart: (e: React.DragEvent) => e.preventDefault(),
          draggable: false as const,
        };

    return (
      <Wrapper
        className={styles.icon_container}
        ref={ref as React.Ref<HTMLButtonElement> & React.Ref<HTMLDivElement>}
        style={{
          width: size,
          height: size,
        }}
        {...wrapperProps}
      >
        <div className={styles.image_icon}>
          {icon === FileIconType.Directory &&
            (hasContent ? <XPImageIcons.Home /> : <XPImageIcons.Folder />)}
          {icon === FileIconType.Regular && <XPImageIcons.File />}
          {icon === FileIconType.Object && <XPImageIcons.File />}
          {icon === FileIconType.Home && <XPImageIcons.Home />}
          {icon === FileIconType.Upload && <XPImageIcons.Upload />}
          {icon === FileIconType.Image &&
            (fileName ? getImageIcon(fileName) : <XPImageIcons.Media />)}
          {icon === FileIconType.Video && <XPImageIcons.Video />}
          {icon === FileIconType.Audio && <XPImageIcons.Audio />}
        </div>
      </Wrapper>
    );
  })
);