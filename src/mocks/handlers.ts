import { HttpResponse, http } from "msw";
import {
  createDrive,
  getDriveByID,
  listChildren,
  listDrives,
  mkdir,
  mv,
  resolveByPath,
  restoreDrive,
  rmRecursive,
  softDeleteDrive,
  touch,
  type MockFile,
} from "./data";

let isAuthenticated = true;

export const resetMockAuth = (authenticated = true) => {
  isAuthenticated = authenticated;
};

function toDirEntry(f: MockFile) {
  return {
    inodeID: f.inodeID,
    name: f.name,
    type: f.type,
  };
}

function toNodeStat(f: MockFile) {
  return {
    type: f.type,
    size: f.size,
    mode: f.mode,
    nlink: f.nlink,
    ino: f.ino,
    uid: f.uid,
    gid: f.gid,
    atime: f.atime,
    mtime: f.mtime,
    ctime: f.ctime,
    crtime: f.crtime,
  };
}

function apiError(status: number, code: string, message: string) {
  return HttpResponse.json({ code, message }, { status });
}

function authed<T>(handler: () => T) {
  if (!isAuthenticated) {
    return apiError(401, "unauthorized", "Not authenticated");
  }
  return handler();
}

export const handlers = [
  http.get("/api/health", () =>
    HttpResponse.json({ status: "ok", version: "0.1.0" })
  ),

  http.get("/api/auth/me", () => {
    if (!isAuthenticated) {
      return apiError(401, "unauthorized", "Not authenticated");
    }
    return HttpResponse.json({
      id: "user-123",
      publicID: "user-123",
      name: "Mock User",
      email: "[email protected]",
      provider: "google",
      providerID: "google-mock",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }),

  http.post("/api/auth/logout", () => {
    isAuthenticated = false;
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("/api/v1/drives", () =>
    authed(() => HttpResponse.json(listDrives()))
  ),

  http.post("/api/v1/drives", async ({ request }) => {
    return authed(async () => {
      const body = (await request.json()) as { name?: string; description?: string };
      if (!body?.name) {
        return apiError(400, "bad_request", "name is required");
      }
      const drive = createDrive(body.name, body.description);
      return HttpResponse.json(drive, { status: 200 });
    });
  }),

  http.get("/api/v1/admin/drives/deleted", () =>
    authed(() => HttpResponse.json(listDrives(true).filter((d) => d.deletedAt)))
  ),

  http.get("/api/v1/drives/:driveID/root", ({ params }) => {
    return authed(() => {
      const drive = getDriveByID(params.driveID as string);
      if (!drive) {
        return apiError(404, "not_found", "Drive not found");
      }
      return HttpResponse.json(drive);
    });
  }),

  http.delete("/api/v1/drives/:driveID/root", ({ params }) => {
    return authed(() => {
      const ok = softDeleteDrive(params.driveID as string);
      if (!ok) return apiError(404, "not_found", "Drive not found");
      return new HttpResponse(null, { status: 204 });
    });
  }),

  http.put("/api/v1/drives/:driveID/root", async ({ params, request }) => {
    return authed(async () => {
      const body = (await request.json()) as { name?: string; description?: string };
      const drive = getDriveByID(params.driveID as string);
      if (!drive) return apiError(404, "not_found", "Drive not found");
      if (body.name) drive.name = body.name;
      if (body.description !== undefined) drive.description = body.description;
      drive.updatedAt = new Date().toISOString();
      return HttpResponse.json(drive);
    });
  }),

  http.post("/api/v1/drives/:driveID/restore", ({ params }) => {
    return authed(() => {
      const ok = restoreDrive(params.driveID as string);
      if (!ok) return apiError(404, "not_found", "Drive not found");
      const drive = getDriveByID(params.driveID as string);
      return HttpResponse.json(drive);
    });
  }),

  http.get("/api/v1/drives/:driveID/fs/ls", ({ params, request }) => {
    return authed(() => {
      const url = new URL(request.url);
      const path = url.searchParams.get("path") || "/";
      const driveID = params.driveID as string;
      const children = listChildren(driveID, path);
      return HttpResponse.json({ entries: children.map(toDirEntry) });
    });
  }),

  http.get("/api/v1/drives/:driveID/fs/stat", ({ params, request }) => {
    return authed(() => {
      const url = new URL(request.url);
      const path = url.searchParams.get("path") || "/";
      const driveID = params.driveID as string;
      const file = resolveByPath(driveID, path);
      if (!file) return apiError(404, "not_found", "Not found");
      return HttpResponse.json(toNodeStat(file));
    });
  }),

  http.post("/api/v1/drives/:driveID/fs/mkdir", async ({ params, request }) => {
    return authed(async () => {
      const body = (await request.json()) as { path?: string };
      if (!body?.path) return apiError(400, "bad_request", "path is required");
      const file = mkdir(params.driveID as string, body.path);
      if (!file) return apiError(409, "conflict", "Cannot create directory");
      return HttpResponse.json(toNodeStat(file));
    });
  }),

  http.post("/api/v1/drives/:driveID/fs/touch", async ({ params, request }) => {
    return authed(async () => {
      const body = (await request.json()) as { path?: string };
      if (!body?.path) return apiError(400, "bad_request", "path is required");
      const file = touch(params.driveID as string, body.path);
      if (!file) return apiError(404, "not_found", "Parent not found");
      return new HttpResponse(null, { status: 200 });
    });
  }),

  http.post("/api/v1/drives/:driveID/fs/mv", async ({ params, request }) => {
    return authed(async () => {
      const body = (await request.json()) as {
        sources?: string[];
        destination?: string;
      };
      if (!body?.sources || !body?.destination) {
        return apiError(400, "bad_request", "sources and destination required");
      }
      const moved = mv(
        params.driveID as string,
        body.sources,
        body.destination
      );
      return HttpResponse.json({ moved });
    });
  }),

  http.delete("/api/v1/drives/:driveID/fs", async ({ params, request }) => {
    return authed(async () => {
      const body = (await request.json()) as {
        paths?: string[];
        recursive?: boolean;
      };
      if (!body?.paths) {
        return apiError(400, "bad_request", "paths required");
      }
      const _removed = rmRecursive(params.driveID as string, body.paths);
      return new HttpResponse(null, { status: 204 });
    });
  }),

  http.post(
    "/api/v1/drives/:driveID/uploads",
    async ({ request }) => {
      return authed(async () => {
        const body = (await request.json()) as {
          path?: string;
          contentType?: string;
          contentLength?: number;
        };
        if (!body?.path) {
          return apiError(400, "bad_request", "path is required");
        }
        const uploadId = `upload-${Math.random().toString(36).slice(2)}`;
        // Echo back a same-origin URL so MSW can intercept the PUT.
        return HttpResponse.json({
          uploadId,
          method: "PUT",
          url: `/api/mock-upload/${uploadId}`,
          headers: {},
          key: body.path,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        });
      });
    }
  ),

  http.put("/api/mock-upload/:uploadId", () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.post(
    "/api/v1/drives/:driveID/uploads/:uploadId/complete",
    async ({ params, request }) => {
      return authed(async () => {
        const body = (await request.json()) as {
          contentLength?: number;
        };
        const url = new URL(request.url);
        const path = url.searchParams.get("path") || "";
        if (path) {
          touch(params.driveID as string, path);
        }
        return HttpResponse.json({
          inodeID: `mock-${Date.now()}`,
          size: body?.contentLength ?? 0,
        });
      });
    }
  ),

  http.get("/api/v1/drives/:driveID/downloads", ({ request }) => {
    return authed(() => {
      const url = new URL(request.url);
      const path = url.searchParams.get("path") || "";
      return HttpResponse.json({
        method: "GET",
        url: `/api/mock-download?path=${encodeURIComponent(path)}`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });
    });
  }),

  http.get("/api/mock-download", () => {
    return new HttpResponse("mock file contents", { status: 200 });
  }),
];