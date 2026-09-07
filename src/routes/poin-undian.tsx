import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { PoinUndianWidget } from "@/components/widgets/poin-undian-widget";

export const Route = createFileRoute("/poin-undian")({
  head: () => ({
    meta: [
      { title: "Loyalty Poin & Undian RAT — Casheva Koperasi TNI AD" },
      { name: "description", content: "Perolehan poin belanja toko, tracking target bulanan, penukaran kupon doorprize RAT, dan simulator pengundian." },
      { property: "og:title", content: "Poin & Undian RAT — Casheva" },
      { property: "og:description", content: "Sistem Poin Belanja & Kupon Undian RAT Koperasi TNI AD." },
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
        title="Loyalty Poin & Undian Doorprize RAT"
        description="Apresiasi keaktifan belanja anggota: kumpulkan poin dari setiap transaksi toko, raih target bulanan, dan tukar kupon doorprize RAT."
      />
      <PoinUndianWidget />
    </div>
  );
}
