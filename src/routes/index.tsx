import { createFileRoute } from "@tanstack/react-router";

import { useSession } from "@/components/session-context";
import { JurbayView } from "@/components/roles/jurbay-view";
import { DanKaView } from "@/components/roles/danka-view";
import { KaprimView } from "@/components/roles/kaprim-view";
import { BendaharaView } from "@/components/roles/bendahara-view";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard Peran — Casheva Koperasi TNI AD" },
      {
        name: "description",
        content:
          "Dasbor dinamis Casheva sesuai peran: screening Juru Bayar, rekomendasi Dan/Ka, ACC Kaprim, hingga pencairan Bendahara.",
      },
      { property: "og:title", content: "Dashboard Peran — Casheva" },
      {
        property: "og:description",
        content:
          "Alur kerja koperasi simpan pinjam TNI AD berbasis peran dalam satu dasbor terpadu.",
      },
    ],
  }),
  component: RoleDashboard,
});

function RoleDashboard() {
  const { role } = useSession();

  if (role === "Juru Bayar") return <JurbayView />;
  if (role === "Dan/Ka") return <DanKaView />;
  if (role === "Kaprim") return <KaprimView />;
  return <BendaharaView />;
}
