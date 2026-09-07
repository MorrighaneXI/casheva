import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { PosWidget } from "@/components/widgets/pos-widget";

export const Route = createFileRoute("/pos")({
  head: () => ({
    meta: [
      { title: "Kasir POS Toko — Casheva Koperasi TNI AD" },
      { name: "description", content: "Point of Sale Kasir Toko Koperasi TNI AD dengan barcode scanner dan kalkulator kembalian." },
      { property: "og:title", content: "Kasir POS Toko — Casheva" },
      { property: "og:description", content: "Point of Sale Kasir Toko Koperasi TNI AD." },
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
        title="Kasir POS Toko Koperasi"
        description="Point of Sale modern: scan barcode cepat, diskon promo, struk thermal, dan transaksi kredit tempo anggota."
      />
      <PosWidget />
    </div>
  );
}
