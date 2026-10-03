"use client";

import { useMemo, useState } from "react";
import { cn } from "cn";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserMultipleIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import LoadingStatus from "@/components/loading-status";
import StatusPill from "@/components/status-pill";
import RoleGuard from "@/views/reported/RoleGuard";
import { ROLES, ROLE_LABELS, useAuth } from "@/api/context/AuthContext";
import { useInstitutionAccounts, useSetAccountStatus } from "@/api/hooks/useAdmin";
import { useToast } from "@/helpers/ToastProvider";

const dateFormat = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short" });

const ACCOUNT_STATUS = {
  PENDING: { label: "Czeka na akceptację", className: "bg-amber-500/15 text-amber-800 dark:text-amber-300" },
  ACTIVE: { label: "Aktywne", className: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" },
  REJECTED: { label: "Odrzucone", className: "bg-red-500/10 text-red-700 dark:text-red-300" },
};

function FilterChip({ active, label, count, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-foreground/45 bg-background hover:bg-muted"
      )}
    >
      {label}
      <span className="sr-only">, liczba:</span>
      <span className={cn("rounded-full px-1.5 text-xs tabular-nums", active ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground")}>{count}</span>
    </button>
  );
}

function AccountsList() {
  const { user } = useAuth();
  const { data, isPending } = useInstitutionAccounts();
  const setStatus = useSetAccountStatus();
  const { showToast } = useToast();
  const [filter, setFilter] = useState("PENDING");

  const all = useMemo(() => data ?? [], [data]);
  const counts = useMemo(() => {
    const result = {};
    for (const a of all) result[a.accountStatus] = (result[a.accountStatus] ?? 0) + 1;
    return result;
  }, [all]);
  const visible = filter ? all.filter((a) => a.accountStatus === filter) : all;

  const change = async (account, status) => {
    try {
      await setStatus.mutateAsync({ id: account.id, status });
      showToast(`Konto ${account.name}: ${ACCOUNT_STATUS[status].label.toLowerCase()}`, "success");
    } catch (err) {
      showToast(err?.body?.message ?? null, "error");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl px-4 pt-14 pb-10 md:px-8">
        <header className="mb-6">
          <h1 className="font-heading text-2xl font-semibold">Konta instytucji</h1>
          <p className="text-muted-foreground">
            Konta samorządów (JST) i pracowników ROPS uzyskują dostęp do paneli dopiero po akceptacji. Sprawdź, czy adres email należy do instytucji.
          </p>
        </header>

        <div role="group" aria-label="Status konta" className="mb-4 flex flex-wrap gap-2">
          {Object.entries(ACCOUNT_STATUS).map(([key, meta]) => (
            <FilterChip key={key} active={filter === key} label={meta.label} count={counts[key] ?? 0} onClick={() => setFilter(key)} />
          ))}
          <FilterChip active={!filter} label="Wszystkie" count={all.length} onClick={() => setFilter(null)} />
        </div>
        <p aria-live="polite" aria-atomic="true" className="sr-only">{isPending ? "" : `Wyniki: ${visible.length}`}</p>

        {isPending ? (
          <LoadingStatus label="Wczytywanie kont"><Skeleton className="h-32 w-full rounded-xl" /></LoadingStatus>
        ) : visible.length ? (
          <ul className="flex flex-col gap-3">
            {visible.map((account) => {
              const self = account.id === user?.id;
              return (
                <li key={account.id}>
                  <article aria-labelledby={`acc-${account.id}`} className="flex flex-col gap-2 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <h2 id={`acc-${account.id}`} className="font-semibold break-words">{account.name}{self && " (Ty)"}</h2>
                      <p className="text-sm break-all">
                        <a href={`mailto:${account.email}`} className="underline underline-offset-4">{account.email}</a>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ROLE_LABELS[account.role] ?? account.role}
                        {account.createdAt && <> · zarejestrowano <time dateTime={account.createdAt}>{dateFormat.format(new Date(account.createdAt))}</time></>}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill meta={ACCOUNT_STATUS[account.accountStatus]} />
                      {!self && account.accountStatus !== "ACTIVE" && (
                        <Button size="sm" disabled={setStatus.isPending} onClick={() => change(account, "ACTIVE")}>
                          Akceptuj<span className="sr-only"> konto {account.name}</span>
                        </Button>
                      )}
                      {!self && account.accountStatus !== "REJECTED" && (
                        <Button size="sm" variant="outline" disabled={setStatus.isPending} onClick={() => change(account, "REJECTED")}>
                          {account.accountStatus === "ACTIVE" ? "Odbierz dostęp" : "Odrzuć"}<span className="sr-only"> konto {account.name}</span>
                        </Button>
                      )}
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon"><HugeiconsIcon icon={UserMultipleIcon} strokeWidth={2} aria-hidden="true" /></EmptyMedia>
              <EmptyTitle>Brak kont</EmptyTitle>
              <EmptyDescription>{filter === "PENDING" ? "Żadne konto nie czeka na akceptację." : "Brak kont o tym statusie."}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </div>
  );
}

export default function AccountsAdmin() {
  return (
    <RoleGuard roles={[ROLES.ROPS]} description="Akceptacja kont jest dostępna tylko dla pracowników ROPS.">
      <AccountsList />
    </RoleGuard>
  );
}
