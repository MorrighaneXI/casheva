import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { SupplierWidget } from "@/components/widgets/supplier-widget";

export const Route = createFileRoute("/supplier")({
  head: () => ({
    meta: [
      { title: "Supplier & Pengadaan Barang — Casheva Koperasi TNI AD" },
      { name: "description", content: "Manajemen supplier, faktur pembelian barang masuk, retur barang, dan pelunasan hutang dagang." },
      { property: "og:title", content: "Supplier & Pengadaan — Casheva" },
      { property: "og:description", content: "Manajemen supplier dan pengadaan toko koperasi." },
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
        title="Supplier & Pengadaan Barang"
        description="Pencatatan faktur pembelian barang masuk dari supplier, konversi stok grosir, dan pelunasan hutang dagang toko."
      />
      <SupplierWidget />
    </div>
  );
}
