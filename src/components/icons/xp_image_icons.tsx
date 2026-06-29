import Image from "next/image";

const iconMap = {
  folder_closed: "/icons/sprites/folder_closed.webp",
  folder_opened: "/icons/sprites/folder_opened.webp",
  recycle_bin_empty: "/icons/sprites/recycle_bin_empty.webp",
  recycle_bin_full: "/icons/sprites/recycle_bin_full.webp",
  generic_document: "/icons/sprites/generic_document.webp",
  generic_text_document: "/icons/sprites/generic_text_document.webp",
  generic_audio: "/icons/sprites/generic_audio.webp",
  generic_video: "/icons/sprites/generic_video.webp",
  generic_media: "/icons/sprites/generic_media.webp",
  my_documents: "/icons/sprites/my_documents.webp",
  my_music: "/icons/sprites/my_music.webp",
  my_pictures: "/icons/sprites/my_pictures.webp",
  my_videos: "/icons/sprites/my_videos.webp",
  bitmap: "/icons/sprites/bitmap.webp",
  gif: "/icons/sprites/gif.webp",
  jpg: "/icons/sprites/jpg.webp",
  tiff: "/icons/sprites/tiff.webp",
  txt: "/icons/sprites/txt.webp",
  up: "/icons/sprites/up.webp",
} as const;

const iconSize = 48;

export const XPImageIcons = {
  Folder: () => (
    <Image
      src={iconMap.folder_closed}
      alt="Folder"
      width={iconSize}
      height={iconSize}
      unoptimized
    />
  ),

  FolderOpen: () => (
    <Image
      src={iconMap.folder_opened}
      alt="Folder Open"
      width={iconSize}
      height={iconSize}
      unoptimized
    />
  ),

  File: () => (
    <Image
      src={iconMap.generic_document}
      alt="File"
      width={iconSize}
      height={iconSize}
      unoptimized
    />
  ),

  TextFile: () => (
    <Image
      src={iconMap.generic_text_document}
      alt="Text File"
      width={iconSize}
      height={iconSize}
      unoptimized
    />
  ),

  Audio: () => (
    <Image
      src={iconMap.generic_audio}
      alt="Audio"
      width={iconSize}
      height={iconSize}
      unoptimized
    />
  ),

  Video: () => (
    <Image
      src={iconMap.generic_video}
      alt="Video"
      width={iconSize}
      height={iconSize}
      unoptimized
    />
  ),

  Media: () => (
    <Image
      src={iconMap.generic_media}
      alt="Media"
      width={iconSize}
      height={iconSize}
      unoptimized
    />
  ),

  Trash: () => (
    <Image
      src={iconMap.recycle_bin_empty}
      alt="Trash"
      width={iconSize}
      height={iconSize}
      unoptimized
    />
  ),

  TrashFull: () => (
    <Image
      src={iconMap.recycle_bin_full}
      alt="Trash Full"
      width={iconSize}
      height={iconSize}
      unoptimized
    />
  ),

  Home: () => (
    <Image
      src={iconMap.my_documents}
      alt="Home"
      width={iconSize}
      height={iconSize}
      unoptimized
    />
  ),

  Upload: () => (
    <Image
      src={iconMap.up}
      alt="Upload"
      width={iconSize}
      height={iconSize}
      unoptimized
      priority
    />
  ),

  JPG: () => (
    <Image
      src={iconMap.jpg}
      alt="JPG"
      width={iconSize}
      height={iconSize}
      unoptimized
    />
  ),

  GIF: () => (
    <Image
      src={iconMap.gif}
      alt="GIF"
      width={iconSize}
      height={iconSize}
      unoptimized
    />
  ),

  Bitmap: () => (
    <Image
      src={iconMap.bitmap}
      alt="BMP"
      width={iconSize}
      height={iconSize}
      unoptimized
    />
  ),

  TIFF: () => (
    <Image
      src={iconMap.tiff}
      alt="TIFF"
      width={iconSize}
      height={iconSize}
      unoptimized
    />
  ),
};
