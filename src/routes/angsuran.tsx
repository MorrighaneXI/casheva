import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/page-header";
import { RekapAngsuranTable } from "@/components/widgets/role-widgets";

export const Route = createFileRoute("/angsuran")({
  head: () => ({
    meta: [
      { title: "Rekap Angsuran Anggota — Casheva Koperasi TNI AD" },
      { name: "description", content: "Status cicilan berjalan seluruh anggota koperasi." },
      { property: "og:title", content: "Rekap Angsuran Anggota — Casheva" },
      { property: "og:description", content: "Status cicilan berjalan seluruh anggota koperasi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Rekap Angsuran Anggota" description="Status cicilan berjalan seluruh anggota koperasi." />
      <RekapAngsuranTable />
    </div>
  );
}
