import type { DirEntry } from "@/api/generated/model";
import type { FileType } from "@/types/file";
import { BackendFileType, FileIconType, VirtualFileType } from "@/types/file";
import { WindowType } from "@/types/window";
import { ContentTypes, getContentTypes } from "@/utils/content_type";

/**
 * Convert a DirEntry.type string (e.g. "directory", "regular") to a FileType.
 */
export function getFileTypeFromEntry(entry: DirEntry): FileType {
  switch (entry.type) {
    case BackendFileType.Directory:
      return BackendFileType.Directory;
    case BackendFileType.Symlink:
      return BackendFileType.Symlink;
    case BackendFileType.Object:
      return BackendFileType.Object;
    case BackendFileType.Regular:
      return BackendFileType.Regular;
    default:
      return BackendFileType.Regular;
  }
}

/**
 * Get icon type for a file based on its FileType and optional filename.
 */
export function getIconType(
  fileType: FileType,
  fileName?: string
): FileIconType {
  switch (fileType) {
    case BackendFileType.Directory:
      return FileIconType.Directory;
    case BackendFileType.Symlink:
      return FileIconType.Regular;
    case BackendFileType.Object:
    case BackendFileType.Regular:
      if (fileName) {
        const contentType = getContentTypes(fileName);
        switch (contentType) {
          case ContentTypes.Image:
            return FileIconType.Image;
          case ContentTypes.Video:
            return FileIconType.Video;
          case ContentTypes.Audio:
            return FileIconType.Audio;
        }
      }
      return fileType === BackendFileType.Object
        ? FileIconType.Object
        : FileIconType.Regular;
    case VirtualFileType.Home:
      return FileIconType.Home;
    case VirtualFileType.Upload:
      return FileIconType.Upload;
    case VirtualFileType.Root:
      return FileIconType.Directory;
    default:
      return FileIconType.Regular;
  }
}

/**
 * Determine which WindowType to open for a given file.
 * Returns null if the file type has no window (e.g., Symlink).
 */
export function getWindowType(
  fileType: FileType,
  fileName: string
): WindowType | null {
  switch (fileType) {
    case BackendFileType.Directory:
    case VirtualFileType.Root:
    case VirtualFileType.Home:
      return WindowType.Navigator;
    case BackendFileType.Object:
    case BackendFileType.Regular: {
      const contentType = getContentTypes(fileName);
      switch (contentType) {
        case ContentTypes.Image:
          return WindowType.Image;
        case ContentTypes.Video:
          return WindowType.Video;
        case ContentTypes.Audio:
          return WindowType.Audio;
        default:
          return null;
      }
    }
    case VirtualFileType.Upload:
      return WindowType.Uploader;
    default:
      return null;
  }
}

/**
 * Check if a file type can be a drag-and-drop target (files can be moved into it).
 */
export function isDragTarget(fileType: FileType): boolean {
  return (
    fileType === BackendFileType.Directory ||
    fileType === VirtualFileType.Root ||
    fileType === VirtualFileType.Home
  );
}

/**
 * Check if a file type can be selected via the selection box.
 */
export function isSelectable(fileType: FileType): boolean {
  return (
    fileType === BackendFileType.Directory ||
    fileType === BackendFileType.Object ||
    fileType === BackendFileType.Regular ||
    fileType === BackendFileType.Symlink
  );
}

/**
 * Get sort order for file types in directory listing.
 * Lower values appear first.
 */
export function getFileTypeSortOrder(fileType: FileType): number {
  switch (fileType) {
    case BackendFileType.Directory:
      return 0;
    case BackendFileType.Object:
      return 1;
    case BackendFileType.Regular:
      return 2;
    case BackendFileType.Symlink:
      return 3;
    default:
      return 4;
  }
}