"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { BulbIcon } from "@hugeicons/core-free-icons";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import RoleGuard from "@/views/reported/RoleGuard";
import { ROLES } from "@/api/context/AuthContext";

export default function ReportedInnovations() {
  return (
    <RoleGuard roles={[ROLES.JST, ROLES.ROPS]}>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-4 pt-14 pb-10 md:px-8">
          <header className="mb-6">
            <h1 className="font-heading text-2xl font-semibold">Zgłoszone innowacje</h1>
            <p className="text-muted-foreground">Propozycje rozwiązań i innowacji przesłane przez użytkowników</p>
          </header>

          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={BulbIcon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>Brak zgłoszonych innowacji</EmptyTitle>
              <EmptyDescription>Gdy użytkownicy prześlą propozycje, pojawią się tutaj.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </div>
    </RoleGuard>
  );
}
