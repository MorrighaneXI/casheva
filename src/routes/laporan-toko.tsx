import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { LaporanTokoWidget } from "@/components/widgets/laporan-toko-widget";

export const Route = createFileRoute("/laporan-toko")({
  head: () => ({
    meta: [
      { title: "Laporan Keuangan Toko — Casheva Koperasi TNI AD" },
      { name: "description", content: "Analisis omset, HPP, laba kotor, dan performa penjualan unit toko koperasi TNI AD." },
      { property: "og:title", content: "Laporan Toko — Casheva" },
      { property: "og:description", content: "Laporan Laba Rugi & Penjualan Unit Toko Koperasi TNI AD." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Penjualan & Laba Unit Toko"
        description="Pantau performa finansial unit usaha toko: omset harian/bulanan, Harga Pokok Penjualan (HPP), marjin laba kotor, dan 5 produk terlaris."
      />
      <LaporanTokoWidget />
    </div>
  );
}
