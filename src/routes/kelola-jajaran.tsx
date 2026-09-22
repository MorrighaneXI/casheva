import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { SuperAdminMasterDataWidget } from "@/components/widgets/super-admin-master-data";

export const Route = createFileRoute("/kelola-jajaran")({
  head: () => ({
    meta: [
      { title: "Kelola Jajaran — SISKOPAD Sistem Koperasi TNI AD" },
      {
        name: "description",
        content: "Pendaftaran Kotama/Balakpus dan Satminkal baru beserta inisialisasi akun Administrator.",
      },
      { property: "og:title", content: "Kelola Jajaran — SISKOPAD" },
      {
        property: "og:description",
        content: "Kelola pendaftaran Kotama, Balakpus, Satminkal, dan akun Admin jajaran.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: KelolaJajaranPage,
});

function KelolaJajaranPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Jajaran Komando & Satminkal"
        description="Registrasi Komando Utama (Kotama/Balakpus), Satuan Kerja Koperasi (Satminkal), pemetaan hierarki induk, dan inisialisasi akun Administrator."
      />
      <SuperAdminMasterDataWidget />
    </div>
  );
}
