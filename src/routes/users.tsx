import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/page-header";
import { UserManagementWidget } from "@/components/widgets/user-management";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "Manajemen User & Hak Akses — Casheva Koperasi TNI AD" },
      { name: "description", content: "Kelola akun, peran, dan hak akses pengguna Casheva." },
      { property: "og:title", content: "Manajemen User & Hak Akses — Casheva" },
      { property: "og:description", content: "Kelola akun, peran, dan hak akses pengguna Casheva." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Manajemen User & Hak Akses" description="Kelola akun, peran, dan hak akses pengguna Casheva." />
      <UserManagementWidget />
    </div>
  );
}
