import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { InventoriWidget } from "@/components/widgets/inventori-widget";

export const Route = createFileRoute("/inventori")({
  head: () => ({
    meta: [
      { title: "Katalog & Stok Barang Toko — Casheva Koperasi TNI AD" },
      { name: "description", content: "Manajemen inventori barang, multi-satuan Box ke Pcs, HPP modal, dan stock opname." },
      { property: "og:title", content: "Katalog & Stok Barang Toko — Casheva" },
      { property: "og:description", content: "Manajemen inventori barang toko koperasi." },
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
        title="Katalog & Inventori Barang Toko"
        description="Kelola stok fisik, konversi multi-satuan Box ke Pcs, penetapan harga jual & HPP, serta stock opname berkala."
      />
      <InventoriWidget />
    </div>
  );
}
