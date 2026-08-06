import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/page-header";
import { ShuBreakdown } from "@/components/widgets/role-widgets";

export const Route = createFileRoute("/shu")({
  head: () => ({
    meta: [
      { title: "Pengawasan SHU — Casheva Koperasi TNI AD" },
      { name: "description", content: "Kalkulator dan breakdown distribusi Sisa Hasil Usaha." },
      { property: "og:title", content: "Pengawasan SHU — Casheva" },
      { property: "og:description", content: "Kalkulator dan breakdown distribusi Sisa Hasil Usaha." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Pengawasan SHU" description="Kalkulator dan breakdown distribusi Sisa Hasil Usaha." />
      <ShuBreakdown />
    </div>
  );
}
