import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/page-header";
import { LikuiditasChart } from "@/components/widgets/role-widgets";

export const Route = createFileRoute("/likuiditas")({
  head: () => ({
    meta: [
      { title: "Monitoring Likuiditas Kas — Casheva Koperasi TNI AD" },
      { name: "description", content: "Pemantauan kas tersedia terhadap pencairan pinjaman." },
      { property: "og:title", content: "Monitoring Likuiditas Kas — Casheva" },
      { property: "og:description", content: "Pemantauan kas tersedia terhadap pencairan pinjaman." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Monitoring Likuiditas Kas" description="Pemantauan kas tersedia terhadap pencairan pinjaman." />
      <LikuiditasChart />
    </div>
  );
}
