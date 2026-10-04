import { Suspense } from "react";
import ImplementationPlan from "@/views/admin/ImplementationPlan";
import { getServerT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getServerT();
  return { title: t("Plan wdrożenia innowacji") };
}

export default function Page() {
  return (
    <Suspense>
      <ImplementationPlan />
    </Suspense>
  );
}
