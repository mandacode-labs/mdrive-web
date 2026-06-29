import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMkdirMutationOptions,
  getMvMutationOptions,
  getRmMutationOptions,
} from "@/api/generated";
import { isFsQuery } from "@/utils/query_keys";

export function useMkdir() {
  const queryClient = useQueryClient();

  return useMutation({
    ...getMkdirMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: isFsQuery });
    },
  });
}

export function useMv() {
  const queryClient = useQueryClient();

  return useMutation({
    ...getMvMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: isFsQuery });
    },
  });
}

export function useRm() {
  const queryClient = useQueryClient();

  return useMutation({
    ...getRmMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: isFsQuery });
    },
  });
}

/**
 * Rename a file by moving it within the same directory with a new name.
 * The new API does not provide a dedicated rename endpoint.
 */
export function useRename() {
  const mvMutation = useMv();

  return useMutation({
    mutationFn: async ({
      driveID,
      path,
      newName,
    }: {
      driveID: string;
      path: string;
      newName: string;
    }) => {
      const lastSlash = path.lastIndexOf("/");
      const dir = lastSlash >= 0 ? path.slice(0, lastSlash) : "";
      const destination = `${dir}/${newName}`;
      return mvMutation.mutateAsync({
        driveID,
        data: { sources: [path], destination },
      });
    },
  });
}