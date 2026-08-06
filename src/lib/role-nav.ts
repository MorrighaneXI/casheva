import {
  LayoutDashboard,
  Users,
  Database,
  Stamp,
  ScrollText,
  ClipboardCheck,
  UsersRound,
  History,
  BadgeCheck,
  Wallet,
  FileBarChart,
  ShieldCheck,
  PiggyBank,
  Receipt,
  ListChecks,
  Calculator,
  GitBranch,
  Coins,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/casheva-data";

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: string;
};

export const roleNav: Record<Role, NavItem[]> = {
  "Admin Koperasi": [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Manajemen User", url: "/users", icon: Users, badge: "7" },
    { title: "Master Data TNI AD", url: "/master-data", icon: Database },
    { title: "Kopstuk & TTD", url: "/kopstuk", icon: Stamp },
    { title: "Audit Logs", url: "/audit", icon: ScrollText },
  ],
  "Pimpinan / Dan / Ka": [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Antrean Rekomendasi", url: "/rekomendasi", icon: ClipboardCheck, badge: "4" },
    { title: "Data Anggota Satuan", url: "/anggota", icon: UsersRound },
    { title: "Riwayat Pinjaman Satuan", url: "/pinjaman", icon: History },
  ],
  Kaprim: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Persetujuan Akhir (ACC)", url: "/acc", icon: BadgeCheck, badge: "3" },
    { title: "Likuiditas Kas", url: "/likuiditas", icon: Wallet },
    { title: "Laporan Keuangan", url: "/laporan", icon: FileBarChart },
  ],
  "Pengurus Koperasi": [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Verifikasi Jurbay", url: "/verifikasi", icon: ShieldCheck, badge: "7" },
    { title: "Simpanan Anggota", url: "/simpanan", icon: PiggyBank },
    { title: "Pencairan & Invoice", url: "/pencairan", icon: Receipt },
    { title: "Rekap Angsuran", url: "/angsuran", icon: ListChecks },
  ],
  "Pengawas Koperasi": [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Pengawasan SHU", url: "/shu", icon: Calculator },
    { title: "Audit Flow Approval", url: "/audit-flow", icon: GitBranch },
    { title: "Laporan Pendapatan & Biaya", url: "/laporan", icon: Coins },
  ],
};
