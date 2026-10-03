"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { LockIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/api/context/AuthContext";

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
          <EmptyTitle>{roles ? "Brak dostępu" : "Zaloguj się"}</EmptyTitle>
          <EmptyDescription>
            {description ?? (roles ? "Ta sekcja jest dostępna tylko dla kont JST i ROPS." : "Ta sekcja jest dostępna po zalogowaniu.")}
          </EmptyDescription>
        </EmptyHeader>
        {!isLogged && (
          <EmptyContent>
            <Button onClick={() => openPanel("login")}>Zaloguj się</Button>
          </EmptyContent>
        )}
      </Empty>
    </div>
  );
}
