import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/page-header";
import { AccQueue } from "@/components/widgets/role-widgets";

export const Route = createFileRoute("/acc")({
  head: () => ({
    meta: [
      { title: "Persetujuan Akhir Keprim — Casheva Koperasi TNI AD" },
      { name: "description", content: "Otorisasi akhir dan pencairan pinjaman anggota koperasi." },
      { property: "og:title", content: "Persetujuan Akhir Keprim — Casheva" },
      { property: "og:description", content: "Otorisasi akhir dan pencairan pinjaman anggota koperasi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Persetujuan Akhir Keprim" description="Otorisasi akhir dan pencairan pinjaman anggota koperasi." />
      <AccQueue />
    </div>
  );
}
