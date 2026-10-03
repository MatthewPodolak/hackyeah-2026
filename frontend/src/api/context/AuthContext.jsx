"use client";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthService } from "@/api/services/AuthService";

export const ROLES = {
  CITIZEN: "CITIZEN",
  JST: "JST",
  ROPS: "ROPS",
};

export const ROLE_LABELS = {
  CITIZEN: "Obywatel",
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

  const setUser = useCallback((value) => queryClient.setQueryData(ME_KEY, value), [queryClient]);

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
      roleLabel: role ? ROLE_LABELS[role] ?? role : null,
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
      logout,
      refresh,
      isPanelOpen: panelMode !== null,
      panelMode,
      openPanel,
      closePanel,
    }),
    [user, role, accountStatus, isPendingInstitution, effectiveRole, me.isPending, hasRole, login, register, logout, refresh, panelMode, openPanel, closePanel]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function ShowFor({ roles, logged, fallback = null, children }) {
  const { isLoading, isLogged, hasRole } = useAuth();
  if (isLoading) return fallback;
  if (logged === true && !isLogged) return fallback;
  if (logged === false && isLogged) return fallback;
  if (roles && !hasRole(roles)) return fallback;
  return children;
}
