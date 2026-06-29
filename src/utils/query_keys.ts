import type { Query } from "@tanstack/react-query";

/**
 * Query key constants for API endpoints
 */
export const QUERY_KEYS = {
  DRIVE_PREFIX: "/api/v1/drives",
  LS_SUFFIX: "/fs/ls",
  STAT_SUFFIX: "/fs/stat",
} as const;

/**
 * Predicate function to check if a query is a filesystem query (ls or stat)
 * scoped to any drive.
 * @param query - The query object from react-query
 * @returns true if the query is a filesystem query
 */
export function isFsQuery(query: Query): boolean {
  const queryKey = query.queryKey[0] as string;
  return (
    queryKey.startsWith(QUERY_KEYS.DRIVE_PREFIX) &&
    (queryKey.includes(QUERY_KEYS.LS_SUFFIX) ||
      queryKey.includes(QUERY_KEYS.STAT_SUFFIX))
  );
}

/**
 * Predicate that matches any drive-scoped query (fs + drive metadata).
 */
export function isDriveQuery(query: Query, driveID?: string): boolean {
  const queryKey = query.queryKey[0] as string;
  if (driveID) {
    return queryKey.includes(`/api/v1/drives/${driveID}`);
  }
  return queryKey.startsWith(QUERY_KEYS.DRIVE_PREFIX);
}