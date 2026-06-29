import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAuthMeQueryOptions,
  getAuthLogoutMutationOptions,
  getCreateDriveMutationOptions,
  getListDrivesQueryOptions,
  getDeleteDriveMutationOptions,
  getRestoreDriveMutationOptions,
} from "@/api/generated";

export function useMe() {
  return useQuery({
    ...getAuthMeQueryOptions(),
    retry: false,
  });
}

export function useDrives(enabled: boolean) {
  return useQuery({
    ...getListDrivesQueryOptions(),
    retry: false,
    select: (response) => {
      if (response.status === 200) {
        return response.data;
      }
      return [];
    },
    enabled,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    ...getAuthLogoutMutationOptions(),
    onSuccess: () => {
      queryClient.removeQueries();
    },
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

export function useGoogleLogin() {
  return () => {
    window.location.href = "/api/auth/google";
  };
}