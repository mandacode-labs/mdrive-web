// POSIX S_IFMT bits used to test node type from NodeStat.mode.
// These mirror the standard Go syscall package constants.
export const S_IFMT = 0o170000;
export const S_IFDIR = 0o040000;
export const S_IFREG = 0o100000;
export const S_IFLNK = 0o120000;

// Backend file types as returned by DirEntry.type (string).
export enum BackendFileType {
  Directory = "directory",
  Regular = "regular",
  Symlink = "symlink",
  Object = "object",
  Unknown = "unknown",
}

// UI-only virtual file types (not from API).
export enum VirtualFileType {
  Root = "root",
  Home = "home",
  Upload = "upload",
}

export type FileType = BackendFileType | VirtualFileType;

// Icon types for visual representation
export enum FileIconType {
  Directory = "directory",
  Regular = "regular",
  Object = "object",
  Home = "home",
  Upload = "upload",
  Image = "image",
  Video = "video",
  Audio = "audio",
}

export enum SpecialFileName {
  Root = "root",
  Home = "home",
  Upload = "upload",
}

export function isDirectory(mode?: number): boolean {
  if (mode === undefined) return false;
  return (mode & S_IFMT) === S_IFDIR;
}

export function isSymlink(mode?: number): boolean {
  if (mode === undefined) return false;
  return (mode & S_IFMT) === S_IFLNK;
}

export function isRegular(mode?: number): boolean {
  if (mode === undefined) return false;
  return (mode & S_IFMT) === S_IFREG;
}