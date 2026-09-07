import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { PesananAntarWidget } from "@/components/widgets/pesanan-antar-widget";

export const Route = createFileRoute("/pesanan-antar")({
  head: () => ({
    meta: [
      { title: "Pesanan Antar & Piket — Casheva Koperasi TNI AD" },
      { name: "description", content: "Monitoring pengantaran pesanan fast delivery barak/rumdis dan serah terima titip piket pos jaga." },
      { property: "og:title", content: "Pesanan Antar & Piket — Casheva" },
      { property: "og:description", content: "Layanan Fast Delivery & Titip Piket Hari Libur Koperasi TNI AD." },
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
        title="Pesanan Antar & Layanan Piket"
        description="Pantau SLA fast delivery ke mess/rumdis, verifikasi serah terima paket titip di pos jaga piket hari libur, dan kompensasi otomatis."
      />
      <PesananAntarWidget />
    </div>
  );
}
