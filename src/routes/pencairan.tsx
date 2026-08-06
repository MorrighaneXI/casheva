import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/page-header";
import { InvoiceGenerator } from "@/components/widgets/role-widgets";

export const Route = createFileRoute("/pencairan")({
  head: () => ({
    meta: [
      { title: "Pencairan & Invoice — Casheva Koperasi TNI AD" },
      { name: "description", content: "Generator kwitansi dan penomoran invoice otomatis." },
      { property: "og:title", content: "Pencairan & Invoice — Casheva" },
      { property: "og:description", content: "Generator kwitansi dan penomoran invoice otomatis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Pencairan & Invoice" description="Generator kwitansi dan penomoran invoice otomatis." />
      <InvoiceGenerator />
    </div>
  );
}
