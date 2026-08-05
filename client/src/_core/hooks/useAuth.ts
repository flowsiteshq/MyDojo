import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();

  // If the auth check takes > 10 seconds, stop showing the spinner and treat
  // as unauthenticated so the login form appears instead of hanging forever.
  const [authTimedOut, setAuthTimedOut] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setAuthTimedOut(true), 10_000);
    return () => clearTimeout(timer);
  }, []);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      // Clear ALL cached query data so no user's private data (payment history,
      // enrollment info, messages, etc.) is ever visible to the next user who
      // logs in on the same device/browser session.
      utils.auth.me.setData(undefined, null);
      utils.invalidate();
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(meQuery.data)
    );
    return {
      user: meQuery.data ?? null,
      // Stop showing "loading" if auth timed out — show the login form instead
      loading: (meQuery.isLoading && !authTimedOut) || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
    authTimedOut,
  ]);

  // Track the previous user ID so we can detect when a different user logs in
  // on the same device without an explicit logout (e.g., shared device).
  const prevUserIdRef = useRef<string | number | null | undefined>(undefined);
  useEffect(() => {
    const currentId = meQuery.data?.id ?? null;
    if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== currentId && currentId !== null) {
      // A different user just authenticated — purge all cached private data
      utils.invalidate();
    }
    prevUserIdRef.current = currentId;
  }, [meQuery.data?.id, utils]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
