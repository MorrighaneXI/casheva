import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { TokoTransaksiWidget } from "@/components/widgets/toko-transaksi-widget";

export const Route = createFileRoute("/toko-transaksi")({
  head: () => ({
    meta: [
      { title: "Riwayat Transaksi Toko & Struk — Casheva Koperasi TNI AD" },
      { name: "description", content: "Daftar histori transaksi penjualan kasir POS, filter metode bayar, dan cetak ulang struk thermal." },
      { property: "og:title", content: "Riwayat Transaksi Toko — Casheva" },
      { property: "og:description", content: "Histori Transaksi Kasir POS Koperasi TNI AD." },
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
        title="Riwayat Transaksi Kasir POS"
        description="Rekapitulasi seluruh transaksi penjualan kasir toko koperasi, status pelunasan tempo kredit, dan cetak ulang struk thermal 58mm/80mm."
      />
      <TokoTransaksiWidget />
    </div>
  );
}
