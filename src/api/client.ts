import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error) => {
        if (error instanceof Response && error.status === 401) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      const path = Array.isArray(query.queryKey)
        ? String(query.queryKey[0])
        : "unknown";
      const status =
        error instanceof Response
          ? error.status
          : (error as { status?: number })?.status;
      console.error(`[api] ${status ?? "error"} ${path}`, error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      console.error("[api] mutation error", error);
    },
  }),
});