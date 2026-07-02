import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { User } from "@/api/generated/model";
import {
  getAuthMeQueryOptions,
  getCreateDriveMutationOptions,
  getListDrivesQueryKey,
  getListDrivesQueryOptions,
  getDeleteDriveMutationOptions,
  getRestoreDriveMutationOptions,
} from "@/api/generated";

const API_BASE = "https://api.mdrive.mandacode.com";
const authUrl = (path: string) => `${API_BASE}${path}`;

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
      queryClient.invalidateQueries({ queryKey: getListDrivesQueryKey() });
    },
  });
}

export function useDeleteDrive() {
  const queryClient = useQueryClient();
  return useMutation({
    ...getDeleteDriveMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListDrivesQueryKey() });
    },
  });
}

export function useRestoreDrive() {
  const queryClient = useQueryClient();
  return useMutation({
    ...getRestoreDriveMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListDrivesQueryKey() });
    },
  });
}

// Top-level navigation so SameSite=Lax cookies travel through the
// OIDC redirect chain. `redirect_uri` is what the auth Service
// encrypts into state and redirects to after the callback.
export function login(redirectTo: string = "/") {
  const url = new URL(authUrl("/auth/login"));
  if (redirectTo !== "/") {
    url.searchParams.set(
      "redirect_uri",
      new URL(redirectTo, window.location.origin).toString()
    );
  }
  window.location.href = url.toString();
}

// Form POST (not fetch) so the cookie clearing and post-logout 302
// both happen in one top-level navigation.
export function useLogout() {
  return useCallback(() => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = authUrl("/auth/logout");
    form.style.display = "none";
    document.body.appendChild(form);
    form.submit();
  }, []);
}