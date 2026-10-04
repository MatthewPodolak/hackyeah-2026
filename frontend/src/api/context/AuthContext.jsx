"use client";
import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthService } from "@/api/services/AuthService";
import { t } from "@/lib/i18n";

export const ROLES = {
  CITIZEN: "CITIZEN",
  NGO: "NGO",
  JST: "JST",
  ROPS: "ROPS",
};

export const ROLE_LABELS = {
  CITIZEN: "Obywatel",
  NGO: "Organizacja pozarządowa",
  JST: "JST",
  ROPS: "ROPS",
};

const ME_KEY = ["auth", "me"];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [panelMode, setPanelMode] = useState(null);

  const me = useQuery({
    queryKey: ME_KEY,
    queryFn: ({ signal }) => AuthService.me({ ct: signal }),
    staleTime: 5 * 60_000,
    retry: false,
  });

  const user = me.data ?? null;
  const role = user?.role ?? null;
  const accountStatus = user?.accountStatus ?? null;
  const isPendingInstitution = !!user && (role === ROLES.JST || role === ROLES.ROPS) && accountStatus !== "ACTIVE";
  const effectiveRole = isPendingInstitution ? null : role;

  const openPanel = useCallback((mode = "login") => setPanelMode(mode === "register" ? "register" : "login"), []);
  const closePanel = useCallback(() => setPanelMode(null), []);

  const [accountGeneration, setAccountGeneration] = useState(0);
  const resolvedUserId = me.isPending ? undefined : user?.id ?? null;
  const lastUserId = useRef(undefined);

  const dropAccountData = useCallback(() => {
    queryClient.cancelQueries({ predicate: (q) => q.queryKey[0] !== ME_KEY[0] });
    queryClient.resetQueries({ predicate: (q) => q.queryKey[0] !== ME_KEY[0] });
    setAccountGeneration((g) => g + 1);
  }, [queryClient]);

  const setUser = useCallback((value) => {
    const nextId = value?.id ?? null;
    if (lastUserId.current !== nextId) {
      lastUserId.current = nextId;
      dropAccountData();
    }
    queryClient.setQueryData(ME_KEY, value);
  }, [queryClient, dropAccountData]);

  useEffect(() => {
    if (resolvedUserId === undefined) return;
    if (lastUserId.current !== undefined && lastUserId.current !== resolvedUserId) dropAccountData();
    lastUserId.current = resolvedUserId;
  }, [resolvedUserId, dropAccountData]);

  const login = useCallback(async (credentials) => {
    const res = await AuthService.login(credentials);
    setUser(res.user);
    return res.user;
  }, [setUser]);

  const register = useCallback(async (model) => {
    const res = await AuthService.register(model);
    setUser(res.user);
    return res.user;
  }, [setUser]);

  const updateProfile = useCallback(async (model) => {
    const updated = await AuthService.updateProfile(model);
    setUser(updated);
    return updated;
  }, [setUser]);

  const logout = useCallback(async () => {
    try {
      await AuthService.logout();
    } finally {
      setUser(null);
    }
  }, [setUser]);

  const refetchMe = me.refetch;
  const refresh = useCallback(async () => {
    const { data } = await refetchMe();
    return data ?? null;
  }, [refetchMe]);

  const hasRole = useCallback((...roles) => !!effectiveRole && roles.flat().includes(effectiveRole), [effectiveRole]);

  const value = useMemo(
    () => ({
      user,
      role,
      roleLabel: role ? t(ROLE_LABELS[role] ?? role) : null,
      isLoading: me.isPending,
      isLogged: !!user,
      isAuthed: !!user,
      accountStatus,
      isPendingInstitution,
      isCitizen: role === ROLES.CITIZEN,
      isJst: effectiveRole === ROLES.JST,
      isRops: effectiveRole === ROLES.ROPS,
      hasRole,
      login,
      register,
      updateProfile,
      logout,
      refresh,
      accountGeneration,
      isPanelOpen: panelMode !== null,
      panelMode,
      openPanel,
      closePanel,
    }),
    [user, role, accountStatus, isPendingInstitution, effectiveRole, me.isPending, hasRole, login, register, updateProfile, logout, refresh, accountGeneration, panelMode, openPanel, closePanel]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function AccountScope({ children }) {
  const { accountGeneration } = useAuth();
  return <Fragment key={accountGeneration}>{children}</Fragment>;
}

export function ShowFor({ roles, logged, fallback = null, children }) {
  const { isLoading, isLogged, hasRole } = useAuth();
  if (isLoading) return fallback;
  if (logged === true && !isLogged) return fallback;
  if (logged === false && isLogged) return fallback;
  if (roles && !hasRole(roles)) return fallback;
  return children;
}
