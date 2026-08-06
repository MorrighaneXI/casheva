import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/page-header";
import { RekomendasiQueue } from "@/components/widgets/role-widgets";

export const Route = createFileRoute("/rekomendasi")({
  head: () => ({
    meta: [
      { title: "Antrean Rekomendasi Dan/Ka — Casheva Koperasi TNI AD" },
      { name: "description", content: "Pengajuan pinjaman anggota satuan yang menunggu rekomendasi komandan." },
      { property: "og:title", content: "Antrean Rekomendasi Dan/Ka — Casheva" },
      { property: "og:description", content: "Pengajuan pinjaman anggota satuan yang menunggu rekomendasi komandan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Antrean Rekomendasi Dan/Ka" description="Pengajuan pinjaman anggota satuan yang menunggu rekomendasi komandan." />
      <RekomendasiQueue />
    </div>
  );
}
