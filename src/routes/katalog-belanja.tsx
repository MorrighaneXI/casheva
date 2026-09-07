import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { KatalogBelanjaWidget } from "@/components/widgets/katalog-belanja-widget";

export const Route = createFileRoute("/katalog-belanja")({
  head: () => ({
    meta: [
      { title: "Katalog Belanja Anggota & Fast Consume — Casheva Koperasi TNI AD" },
      { name: "description", content: "Katalog belanja anggota dengan opsi titip piket hari libur dan delivery fast consume." },
      { property: "og:title", content: "Katalog Belanja Anggota — Casheva" },
      { property: "og:description", content: "Katalog belanja anggota koperasi TNI AD." },
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
        title="Katalog Belanja Anggota"
        description="Belanja kebutuhan harian anggota: sembako, fast consume barak, opsi titip meja piket hari libur, dan simulasi cicilan."
      />
      <KatalogBelanjaWidget />
    </div>
  );
}
