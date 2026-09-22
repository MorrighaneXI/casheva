import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/page-header";
import { MasterDataWidget } from "@/components/widgets/master-data";

export const Route = createFileRoute("/master-data")({
  head: () => ({
    meta: [
      { title: "Master Data TNI AD — SISKOPAD Sistem Koperasi TNI AD" },
      { name: "description", content: "Data Kotama, Satminkal, pangkat, korps, dan parameter pinjaman." },
      { property: "og:title", content: "Master Data TNI AD — SISKOPAD" },
      { property: "og:description", content: "Data Kotama, Satminkal, pangkat, korps, dan parameter pinjaman." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Master Data TNI AD" description="Data Kotama, Satminkal, pangkat, korps, dan parameter pinjaman." />
      <MasterDataWidget />
    </div>
  );
}
