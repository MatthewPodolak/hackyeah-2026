import { Suspense } from "react";
import ImplementationPlan from "@/views/admin/ImplementationPlan";

export const metadata = { title: "Plan wdrożenia innowacji" };

export default function Page() {
  return (
    <Suspense>
      <ImplementationPlan />
    </Suspense>
  );
}
