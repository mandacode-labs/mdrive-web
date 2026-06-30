import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@/api/generated/model";
import { queryClient } from "@/api/client";
import {
  getAuthMeQueryOptions,
  getCreateDriveMutationOptions,
  getListDrivesQueryOptions,
  getDeleteDriveMutationOptions,
  getRestoreDriveMutationOptions,
} from "@/api/generated";

export function useMe() {
  return useQuery({
    ...getAuthMeQueryOptions(),
    retry: false,
    select: (response): User | null =>
      response.status === 200 ? (response.data as User) : null,
  });
}

export function useDrives(enabled: boolean) {
  return useQuery({
    ...getListDrivesQueryOptions(),
    retry: false,
    select: (response) => (response.status === 200 ? response.data : []),
    enabled,
  });
}

export function useCreateDrive() {
  const qc = useQueryClient();

  return useMutation({
    ...getCreateDriveMutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/v1/drives"] });
    },
  });
}

export function useDeleteDrive() {
  const qc = useQueryClient();

  return useMutation({
    ...getDeleteDriveMutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/v1/drives"] });
    },
  });
}

export function useRestoreDrive() {
  const qc = useQueryClient();

  return useMutation({
    ...getRestoreDriveMutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/v1/drives"] });
    },
  });
}

/**
 * Backend middleware drives the Zitadel login flow. We just navigate to a
 * protected route — the middleware will redirect to Zitadel if no session
 * cookie is present, then back to `/` with the cookie set.
 */
export function login() {
  window.location.href = "/";
}

/**
 * No explicit logout endpoint is exposed in the API. The current fallback
 * clears the local cache and reloads — useful until the backend adds a
 * proper sign-out endpoint.
 */
export function logout() {
  queryClient.removeQueries();
  window.location.href = "/";
}