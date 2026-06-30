import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@/api/generated/model";
import {
  getAuthLoginUrl,
  getAuthLogoutMutationOptions,
  getAuthMeQueryOptions,
  getCreateDriveMutationOptions,
  getDeleteDriveMutationOptions,
  getListDrivesQueryOptions,
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
  const queryClient = useQueryClient();

  return useMutation({
    ...getCreateDriveMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/drives"] });
    },
  });
}

export function useDeleteDrive() {
  const queryClient = useQueryClient();

  return useMutation({
    ...getDeleteDriveMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/drives"] });
    },
  });
}

export function useRestoreDrive() {
  const queryClient = useQueryClient();

  return useMutation({
    ...getRestoreDriveMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/drives"] });
    },
  });
}

/**
 * Triggers the backend Zitadel login flow. The browser is redirected to
 * `/api/auth/login`, which Next.js rewrites to the backend in production.
 * The backend's AuthPassthrough middleware then handles the Zitadel OIDC
 * choreography and redirects back with the session cookie set.
 */
export function login() {
  window.location.href = getAuthLoginUrl();
}

/**
 * Calls the backend `/auth/logout` endpoint, clears the local query cache,
 * and reloads. The backend removes the `mdrive_session` cookie as part of
 * the response.
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    ...getAuthLogoutMutationOptions(),
    onSuccess: () => {
      queryClient.removeQueries();
      window.location.reload();
    },
  });
}
