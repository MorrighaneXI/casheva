import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/page-header";
import { useSession } from "@/components/session-context";
import { RekomendasiQueue } from "@/components/widgets/role-widgets";

export const Route = createFileRoute("/rekomendasi")({
  head: () => ({
    meta: [
      { title: "Antrean Rekomendasi — Casheva Koperasi TNI AD" },
      {
        name: "description",
        content: "Pengajuan pinjaman anggota satuan yang menunggu rekomendasi komandan.",
      },
      { property: "og:title", content: "Antrean Rekomendasi — Casheva" },
      {
        property: "og:description",
        content: "Pengajuan pinjaman anggota satuan yang menunggu rekomendasi komandan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { role } = useSession();
  const canAct = role === "Pimpinan / Dan / Ka";

  return (
    <div className="space-y-6">
      <PageHeader
        title={canAct ? "Antrean Rekomendasi Dan/Ka" : "Monitoring Antrean Rekomendasi"}
        description={
          canAct
            ? "ACC atau tolak pengajuan — jika disetujui akan diteruskan ke Kaprim."
            : "Pantau progres antrean rekomendasi tanpa mengubah keputusan Dan/Ka."
        }
      />
      <RekomendasiQueue monitorOnly={!canAct} />
    </div>
  );
}
