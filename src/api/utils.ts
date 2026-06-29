import type { Query } from "@tanstack/react-query";
import type { Error } from "@/api/generated/model";

export interface ApiError {
  status: number;
  code: string;
  message: string;
  raw?: unknown;
}

export function parseApiError(error: unknown): ApiError {
  if (error instanceof Response) {
    return {
      status: error.status,
      code: `HTTP_${error.status}`,
      message: error.statusText,
      raw: error,
    };
  }

  if (typeof error === "object" && error !== null) {
    const err = error as { data?: Error; status?: number };
    if (err.data?.code) {
      return {
        status: err.status ?? 500,
        code: err.data.code,
        message: err.data.message,
        raw: error,
      };
    }
  }

  return {
    status: 500,
    code: "UNKNOWN_ERROR",
    message: error instanceof Error ? error.message : "Unknown error",
    raw: error,
  };
}

export function isAuthError(error: ApiError): boolean {
  return error.status === 401 || error.status === 403;
}

export function isNotFoundError(error: ApiError): boolean {
  return error.status === 404;
}

export function isConflictError(error: ApiError): boolean {
  return error.status === 409;
}

export const FS_PATH_PREFIX = "/api/v1/drives";
export const LS_SUFFIX = "/fs/ls";
export const STAT_SUFFIX = "/fs/stat";

export function isFsQuery(query: Query): boolean {
  const queryKey = query.queryKey[0] as string;
  return (
    queryKey.startsWith(FS_PATH_PREFIX) &&
    (queryKey.includes(LS_SUFFIX) || queryKey.includes(STAT_SUFFIX))
  );
}

export function isDriveQuery(query: Query, driveID?: string): boolean {
  const queryKey = query.queryKey[0] as string;
  if (driveID) {
    return queryKey.includes(`/api/v1/drives/${driveID}`);
  }
  return queryKey.startsWith("/api/v1/drives");
}

export function isUploadQuery(query: Query): boolean {
  const queryKey = query.queryKey[0] as string;
  return queryKey.includes("/uploads/");
}
