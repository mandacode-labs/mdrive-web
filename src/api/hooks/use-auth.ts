import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { User } from "@/api/generated/model";
import {
  getAuthMeQueryOptions,
  getCreateDriveMutationOptions,
  getListDrivesQueryOptions,
  getDeleteDriveMutationOptions,
  getRestoreDriveMutationOptions,
} from "@/api/generated";

/**
 * Backend auth URL. In production we hit the API origin directly so the
 * auth cookies (state, session) are set against the response's own origin —
 * proxying the Set-Cookie through the Next.js rewrite would attribute the
 * cookie to `mdrive.mandacode.com` and trip the browser's domain check.
 *
 * Set NEXT_PUBLIC_AUTH_BASE in `.env.production` (e.g.
 * `https://api.mdrive.mandacode.com`). In dev it is empty so the path stays
 * relative and MSW intercepts it.
 */
function authUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_AUTH_BASE ?? "";
  if (!base) return `/api${path}`;
  return `${base}${path}`;
}

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
 * Triggers the backend Zitadel login flow. Top-level GET navigation
 * (so SameSite=Lax cookies travel across the OAuth redirect chain).
 */
export function login() {
  window.location.href = authUrl("/auth/login");
}

/**
 * Submits a POST to the backend's `/auth/logout` via a hidden form so the
 * cookie clearing and 302 redirect to the post-logout URL all happen in one
 * top-level navigation. No fetch + JSON dance — that would lose cookies
 * with the proxy in the middle.
 */
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