import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/page-header";
import { AuditLogTable } from "@/components/widgets/role-widgets";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit Logs Sistem — Casheva Koperasi TNI AD" },
      { name: "description", content: "Jejak aktivitas seluruh pengguna aplikasi koperasi." },
      { property: "og:title", content: "Audit Logs Sistem — Casheva" },
      { property: "og:description", content: "Jejak aktivitas seluruh pengguna aplikasi koperasi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs Sistem" description="Jejak aktivitas seluruh pengguna aplikasi koperasi." />
      <AuditLogTable />
    </div>
  );
}
