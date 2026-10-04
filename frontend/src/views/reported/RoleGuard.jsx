"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { LockIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/api/context/AuthContext";
import { t } from "@/lib/i18n";

export default function RoleGuard({ roles, children, description }) {
  const { isLoading, isLogged, hasRole, openPanel } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (roles ? hasRole(roles) : isLogged) return children;

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Empty className="max-w-md border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={LockIcon} strokeWidth={2} aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>{roles ? t("Brak dostępu") : t("Zaloguj się")}</EmptyTitle>
          <EmptyDescription>
            {description ?? (roles ? t("Ta sekcja jest dostępna tylko dla kont JST i ROPS.") : t("Ta sekcja jest dostępna po zalogowaniu."))}
          </EmptyDescription>
        </EmptyHeader>
        {!isLogged && (
          <EmptyContent>
            <Button onClick={() => openPanel("login")}>{t("Zaloguj się")}</Button>
          </EmptyContent>
        )}
      </Empty>
    </div>
  );
}
