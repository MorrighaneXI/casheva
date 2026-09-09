import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { TransaksiWidget } from "@/components/widgets/transaksi-widget";

export const Route = createFileRoute("/transaksi")({
  head: () => ({
    meta: [
      { title: "Rekapitulasi Semua Transaksi & Ekspor Excel — Casheva Koperasi TNI AD" },
      {
        name: "description",
        content:
          "Pencatatan konsolidasi seluruh transaksi simpanan, pinjaman, angsuran, belanja kasir toko, dan unit gadai dengan kemampuan ekspor ke Excel.",
      },
      { property: "og:title", content: "Semua Transaksi — Casheva" },
      {
        property: "og:description",
        content: "Rekapitulasi transaksi keuangan dan unit usaha Koperasi TNI AD Casheva.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TransaksiPage,
});

function TransaksiPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekapitulasi Semua Transaksi"
        description="Pencatatan menyeluruh seluruh aktivitas transaksi keuangan, simpan pinjam, penjualan kasir POS toko, dan unit usaha koperasi dengan fitur ekspor ke Excel."
      />
      <TransaksiWidget />
    </div>
  );
}
