"use client";
import { useSyncExternalStore } from "react";
import { useAuth } from "@/api/context/AuthContext";

const NO_TOKENS = [];

export function useScopedTokens(store) {
  const { user, isLoading } = useAuth();
  const scoped = store.forUser(user?.id ?? null);
  const tokens = useSyncExternalStore(scoped.subscribe, scoped.load, scoped.serverSnapshot);
  return { tokens: isLoading ? NO_TOKENS : tokens, remember: scoped.remember, forget: scoped.forget };
}
