import { useQuery } from "@tanstack/react-query";
import type { DirContent, DirEntry, NodeStat } from "@/api/generated/model";
import {
  getGetDriveQueryOptions,
  getLsQueryOptions,
  getStatQueryOptions,
} from "@/api/generated";

export function useDrive(driveID: string) {
  return useQuery({
    ...getGetDriveQueryOptions(driveID),
    enabled: !!driveID,
    retry: false,
  });
}

export function useDriveLs(driveID: string, path: string) {
  return useQuery({
    ...getLsQueryOptions(driveID, { path }),
    enabled: !!driveID,
    select: (response): DirEntry[] => {
      if (response.status === 200) {
        const data = response.data as DirContent;
        return data.entries ?? [];
      }
      return [];
    },
  });
}

export function useDriveStat(driveID: string, path: string) {
  return useQuery({
    ...getStatQueryOptions(driveID, { path }),
    enabled: !!driveID && !!path,
    select: (response): NodeStat | null => {
      if (response.status === 200) {
        return response.data as NodeStat;
      }
      return null;
    },
  });
}