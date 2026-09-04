import type { Role } from "@/lib/casheva-data";
import { roleNav } from "@/lib/role-nav";

/** Paths that every authenticated role may open */
const SHARED_PATHS = new Set(["/", "/login"]);

/** Extra paths granted beyond sidebar nav (deep links / shared tools) */
const EXTRA_ACCESS: Partial<Record<Role, string[]>> = {
  "Admin Koperasi": [
    "/users",
    "/master-data",
    "/kopstuk",
    "/audit",
    "/rekomendasi",
    "/anggota",
    "/pinjaman",
    "/acc",
    "/likuiditas",
    "/laporan",
    "/verifikasi",
    "/simpanan",
    "/pencairan",
    "/angsuran",
    "/pengajuan",
    "/gaji",
    "/shu",
    "/audit-flow",
  ],
  Keprim: ["/rekomendasi", "/acc", "/likuiditas", "/laporan", "/pinjaman", "/anggota"],
  Bendahara: ["/pengajuan", "/simpanan", "/pencairan", "/angsuran", "/rekomendasi"],
  "Juru Bayar": ["/verifikasi", "/pencairan", "/angsuran"],
  Anggota: ["/gaji", "/pengajuan", "/angsuran", "/simpanan"],
  "Pimpinan / Dan / Ka": ["/rekomendasi", "/anggota", "/pinjaman"],
  "Pengawas Koperasi": ["/shu", "/audit-flow", "/laporan"],
};

function navPathsFor(role: Role): string[] {
  return (roleNav[role] ?? []).map((item) => item.url);
}

export function allowedPathsFor(role: Role): Set<string> {
  const paths = new Set<string>([
    ...SHARED_PATHS,
    ...navPathsFor(role),
    ...(EXTRA_ACCESS[role] ?? []),
  ]);
  return paths;
}

export function canAccessPath(role: Role, pathname: string, originalRole?: Role): boolean {
  if (SHARED_PATHS.has(pathname)) return true;
  // Admin has full access to all paths
  if (originalRole === "Admin Koperasi" || role === "Admin Koperasi") return true;
  const effectiveRole = originalRole || role;
  const allowed = allowedPathsFor(effectiveRole);
  if (allowed.has(pathname)) return true;
  return false;
}

export function homePathFor(_role: Role): string {
  return "/";
}

/** Primary CTA on dashboard per role */
export function dashboardCta(role: Role): { to: string; label: string } | null {
  switch (role) {
    case "Juru Bayar":
      return { to: "/verifikasi", label: "Buka Antrean Verifikasi" };
    case "Pimpinan / Dan / Ka":
      return { to: "/rekomendasi", label: "Buka Antrean Rekomendasi" };
    case "Keprim":
      return { to: "/acc", label: "Buka Persetujuan ACC" };
    case "Bendahara":
      return { to: "/pengajuan", label: "Ajukan Pinjaman" };
    case "Anggota":
      return { to: "/gaji", label: "Lihat Rincian Gaji" };
    case "Admin Koperasi":
      return { to: "/users", label: "Kelola Pengguna" };
    case "Pengawas Koperasi":
      return { to: "/shu", label: "Buka Pengawasan SHU" };
    default:
      return null;
  }
}
