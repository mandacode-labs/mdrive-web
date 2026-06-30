import { BackendFileType, type FileType } from "@/types/file";

export interface MockDrive {
  id: string;
  publicID: string;
  name: string;
  description?: string;
  ownerID: string;
  rootNodeID: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockFile {
  inodeID: string;
  parentInodeID: string | null;
  driveID: string;
  name: string;
  path: string;
  type: FileType;
  mode: number;
  size: number;
  nlink: number;
  atime: string;
  mtime: string;
  ctime: string;
  crtime: string;
  ino: string;
  uid: string;
  gid: string;
}

const ISO = () => new Date().toISOString();
const uid = () =>
  `mock-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;

export const mockDrives: Map<string, MockDrive> = new Map();
export const mockFiles: Map<string, MockFile> = new Map();
export const mockPathToInode: Map<string, string> = new Map();

function makeFile(
  driveID: string,
  parentInodeID: string | null,
  parentPath: string,
  name: string,
  type: FileType,
  size = 0,
  inodeID: string = uid()
): MockFile {
  const isDir = type === BackendFileType.Directory;
  const path = parentPath === "" || parentPath === "/"
    ? (name === "root" ? "/" : `/${name}`)
    : `${parentPath}/${name}`;
  const now = ISO();
  const file: MockFile = {
    inodeID,
    parentInodeID,
    driveID,
    name: name === "root" ? "/" : name,
    path,
    type,
    mode: isDir ? 0o040755 : 0o100644,
    size,
    nlink: 1,
    atime: now,
    mtime: now,
    ctime: now,
    crtime: now,
    ino: inodeID,
    uid: "1000",
    gid: "1000",
  };
  mockFiles.set(inodeID, file);
  mockPathToInode.set(`${driveID}::${path}`, inodeID);
  return file;
}

function mkdir(driveID: string, parentPath: string, name: string): MockFile {
  const parent = mockFiles.get(mockPathToInode.get(`${driveID}::${parentPath}`) ?? "");
  if (!parent) throw new Error(`parent not found: ${driveID}::${parentPath}`);
  return makeFile(driveID, parent.inodeID, parentPath, name, BackendFileType.Directory);
}

function mkfile(
  driveID: string,
  parentPath: string,
  name: string,
  size = 0
): MockFile {
  const parent = mockFiles.get(mockPathToInode.get(`${driveID}::${parentPath}`) ?? "");
  if (!parent) throw new Error(`parent not found: ${driveID}::${parentPath}`);
  return makeFile(
    driveID,
    parent.inodeID,
    parentPath,
    name,
    BackendFileType.Regular,
    size
  );
}

function initSampleDrive(driveID: string, name: string): MockDrive {
  const now = ISO();
  const drive: MockDrive = {
    id: driveID,
    publicID: driveID,
    name,
    description: "Sample drive",
    ownerID: "user-123",
    rootNodeID: "",
    createdAt: now,
    updatedAt: now,
  };
  mockDrives.set(driveID, drive);

  const root = makeFile(driveID, null, "", "root", BackendFileType.Directory);
  drive.rootNodeID = root.inodeID;

  const home = mkdir(driveID, "/", "home");
  mkdir(driveID, home.path, "Documents");
  mkdir(driveID, home.path, "Pictures");
  mkdir(driveID, home.path, "Music");
  mkfile(driveID, home.path, "README.md", 1024);
  mkfile(driveID, `${home.path}/Pictures`, "sample.png", 2048);
  mkfile(driveID, `${home.path}/Music`, "song.mp3", 4096);

  return drive;
}

initSampleDrive("drv-mock-001", "Personal");
initSampleDrive("drv-mock-002", "Work");

export function listDrives(includeDeleted = false): MockDrive[] {
  return Array.from(mockDrives.values()).filter((d) =>
    includeDeleted ? true : !d.deletedAt
  );
}

export function getDriveByID(driveID: string): MockDrive | undefined {
  return mockDrives.get(driveID);
}

export function createDrive(name: string, description?: string): MockDrive {
  const id = `drv-${uid()}`;
  const now = ISO();
  const drive: MockDrive = {
    id,
    publicID: id,
    name,
    description,
    ownerID: "user-123",
    rootNodeID: "",
    createdAt: now,
    updatedAt: now,
  };
  mockDrives.set(id, drive);
  const root = makeFile(id, null, "", "root", BackendFileType.Directory);
  drive.rootNodeID = root.inodeID;
  return drive;
}

export function softDeleteDrive(driveID: string): boolean {
  const drive = mockDrives.get(driveID);
  if (!drive) return false;
  drive.deletedAt = ISO();
  drive.updatedAt = drive.deletedAt;
  return true;
}

export function restoreDrive(driveID: string): boolean {
  const drive = mockDrives.get(driveID);
  if (!drive?.deletedAt) return false;
  drive.deletedAt = undefined;
  drive.updatedAt = ISO();
  return true;
}

export function resolveByPath(driveID: string, path: string): MockFile | null {
  const inodeID = mockPathToInode.get(`${driveID}::${path}`);
  if (!inodeID) return null;
  return mockFiles.get(inodeID) ?? null;
}

export function listChildren(driveID: string, path: string): MockFile[] {
  const parent = resolveByPath(driveID, path);
  if (!parent) return [];
  return Array.from(mockFiles.values()).filter(
    (f) => f.driveID === driveID && f.parentInodeID === parent.inodeID
  );
}

function createInDir(
  driveID: string,
  path: string,
  type: FileType,
  size = 0
): MockFile | null {
  if (resolveByPath(driveID, path)) return null;
  const lastSlash = path.lastIndexOf("/");
  const parentPath = lastSlash > 0 ? path.slice(0, lastSlash) : "/";
  const name = path.slice(lastSlash + 1);
  const parent = resolveByPath(driveID, parentPath);
  if (!parent) return null;
  return makeFile(
    driveID,
    parent.inodeID,
    parentPath,
    name,
    type,
    size
  );
}

export function mkdirByPath(driveID: string, path: string): MockFile | null {
  return createInDir(driveID, path, BackendFileType.Directory);
}

export function touch(driveID: string, path: string): MockFile | null {
  const existing = resolveByPath(driveID, path);
  if (existing) {
    const now = ISO();
    existing.mtime = now;
    existing.atime = now;
    return existing;
  }
  return createInDir(driveID, path, BackendFileType.Regular, 0);
}

export function rmRecursive(driveID: string, paths: string[]): string[] {
  const removed: string[] = [];
  for (const path of paths) {
    const file = resolveByPath(driveID, path);
    if (!file) continue;
    const toDelete = [file.inodeID];
    const queue = [file.inodeID];
    while (queue.length > 0) {
      const inode = queue.shift();
      if (!inode) continue;
      for (const child of mockFiles.values()) {
        if (child.driveID === driveID && child.parentInodeID === inode) {
          toDelete.push(child.inodeID);
          queue.push(child.inodeID);
        }
      }
    }
    for (const inode of toDelete) {
      const f = mockFiles.get(inode);
      if (f) {
        mockPathToInode.delete(`${driveID}::${f.path}`);
        mockFiles.delete(inode);
        removed.push(f.path);
      }
    }
  }
  return removed;
}

export function mv(
  driveID: string,
  sources: string[],
  destination: string
): string[] {
  const moved: string[] = [];
  const destFile = resolveByPath(driveID, destination);
  const destIsDir = destFile && destFile.type === BackendFileType.Directory;

  for (const src of sources) {
    const file = resolveByPath(driveID, src);
    if (!file) continue;

    let newPath: string;
    if (destIsDir) {
      newPath =
        destination === "/" ? `/${file.name}` : `${destination}/${file.name}`;
    } else {
      newPath = destination;
    }

    mockPathToInode.delete(`${driveID}::${file.path}`);
    file.path = newPath;
    file.name = newPath.split("/").pop() ?? file.name;
    if (destIsDir && destFile) {
      file.parentInodeID = destFile.inodeID;
    } else {
      const lastSlash = newPath.lastIndexOf("/");
      const parentPath = lastSlash > 0 ? newPath.slice(0, lastSlash) : "/";
      const parent = resolveByPath(driveID, parentPath);
      if (parent) file.parentInodeID = parent.inodeID;
    }
    file.mtime = ISO();
    mockPathToInode.set(`${driveID}::${newPath}`, file.inodeID);
    moved.push(newPath);
  }
  return moved;
}