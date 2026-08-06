import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/page-header";
import { ApprovalTrailTimeline } from "@/components/widgets/role-widgets";

export const Route = createFileRoute("/audit-flow")({
  head: () => ({
    meta: [
      { title: "Audit Flow Approval — Casheva Koperasi TNI AD" },
      { name: "description", content: "Transparansi alur persetujuan berjenjang pengajuan pinjaman." },
      { property: "og:title", content: "Audit Flow Approval — Casheva" },
      { property: "og:description", content: "Transparansi alur persetujuan berjenjang pengajuan pinjaman." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Audit Flow Approval" description="Transparansi alur persetujuan berjenjang pengajuan pinjaman." />
      <ApprovalTrailTimeline />
    </div>
  );
}
