import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { MarketplaceWidget } from "@/components/widgets/marketplace-widget";

export const Route = createFileRoute("/marketplace-anggota")({
  head: () => ({
    meta: [
      { title: "Marketplace UMKM Anggota & Persit — Casheva Koperasi TNI AD" },
      { name: "description", content: "Etalase produk UMKM prajurit dan Persit dengan sistem kurasi serta validasi pengurus koperasi." },
      { property: "og:title", content: "Marketplace Anggota — Casheva" },
      { property: "og:description", content: "Marketplace Titip Jual Produk UMKM Anggota & Persit Koperasi TNI AD." },
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
        title="Marketplace UMKM Anggota & Persit"
        description="Pemberdayaan ekonomi keluarga prajurit: titip jual produk kuliner, kriya, dan fashion dengan kurasi mutu dan bagi hasil transparan."
      />
      <MarketplaceWidget />
    </div>
  );
}
