import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/page-header";
import { UserManagementWidget, ActiveSessionsWidget } from "@/components/widgets/user-management";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "Manajemen User & Data Anggota — Casheva Koperasi TNI AD" },
      { name: "description", content: "Pengelolaan terpadu akun login pengguna, data personel anggota, peran dinamis, dan aktivitas realtime." },
      { property: "og:title", content: "Manajemen User & Data Anggota — Casheva" },
      { property: "og:description", content: "Kelola akun, peran dinamis, dan status realtime pengguna Casheva." },
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
        title="Manajemen User & Data Anggota"
        description="Pengelolaan akun login terpadu, data personel anggota koperasi, peran dinamis (RBAC), dan pemantauan status aktivitas realtime."
      />
      <UserManagementWidget />
      <ActiveSessionsWidget />
    </div>
  );
}
