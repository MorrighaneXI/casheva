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
  FilePlus2,
  Banknote,
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
    { title: "Manajemen User", url: "/users", icon: Users, badge: "8" },
    { title: "Data Anggota", url: "/anggota", icon: UsersRound },
    { title: "Pengajuan Pinjaman", url: "/pengajuan", icon: FilePlus2 },
    { title: "Simpanan Anggota", url: "/simpanan", icon: PiggyBank },
    { title: "Pencairan & Invoice", url: "/pencairan", icon: Receipt },
    { title: "Rekap Angsuran", url: "/angsuran", icon: ListChecks },
    { title: "Antrean Verifikasi (Jurbay)", url: "/verifikasi", icon: ShieldCheck, badge: "3" },
    { title: "Antrean Rekomendasi (Dan/Ka)", url: "/rekomendasi", icon: ClipboardCheck, badge: "4" },
    { title: "Persetujuan ACC (Keprim)", url: "/acc", icon: BadgeCheck, badge: "3" },
    { title: "Likuiditas Kas", url: "/likuiditas", icon: Wallet },
    { title: "Pengawasan SHU", url: "/shu", icon: Calculator },
    { title: "Laporan Keuangan", url: "/laporan", icon: FileBarChart },
    { title: "Master Data TNI AD", url: "/master-data", icon: Database },
    { title: "Kopstuk & TTD", url: "/kopstuk", icon: Stamp },
    { title: "Audit Logs", url: "/audit", icon: ScrollText },
    { title: "Audit Flow Approval", url: "/audit-flow", icon: GitBranch },
  ],
  "Pimpinan / Dan / Ka": [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Antrean Rekomendasi", url: "/rekomendasi", icon: ClipboardCheck, badge: "4" },
    { title: "Data Anggota Satuan", url: "/anggota", icon: UsersRound },
    { title: "Riwayat Pinjaman Satuan", url: "/pinjaman", icon: History },
  ],
  Keprim: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Antrean Rekomendasi", url: "/rekomendasi", icon: ClipboardCheck, badge: "4" },
    { title: "Persetujuan Akhir (ACC)", url: "/acc", icon: BadgeCheck, badge: "3" },
    { title: "Likuiditas Kas", url: "/likuiditas", icon: Wallet },
    { title: "Laporan Keuangan", url: "/laporan", icon: FileBarChart },
  ],
  Bendahara: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Pengajuan Pinjaman", url: "/pengajuan", icon: FilePlus2 },
    { title: "Antrean Rekomendasi", url: "/rekomendasi", icon: ClipboardCheck, badge: "4" },
    { title: "Simpanan Anggota", url: "/simpanan", icon: PiggyBank },
    { title: "Pencairan & Invoice", url: "/pencairan", icon: Receipt },
    { title: "Rekap Angsuran", url: "/angsuran", icon: ListChecks },
  ],
  "Juru Bayar": [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Antrean Verifikasi", url: "/verifikasi", icon: ShieldCheck, badge: "3" },
    { title: "Pencairan & Invoice", url: "/pencairan", icon: Receipt },
    { title: "Rekap Angsuran", url: "/angsuran", icon: ListChecks },
  ],
  Anggota: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Rincian Gaji", url: "/gaji", icon: Banknote },
    { title: "Pengajuan", url: "/pengajuan", icon: FilePlus2 },
    { title: "Simpanan Saya", url: "/simpanan", icon: PiggyBank },
    { title: "Riwayat Angsuran", url: "/angsuran", icon: ListChecks },
  ],
  "Pengawas Koperasi": [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Pengawasan SHU", url: "/shu", icon: Calculator },
    { title: "Audit Flow Approval", url: "/audit-flow", icon: GitBranch },
    { title: "Laporan Pendapatan & Biaya", url: "/laporan", icon: Coins },
  ],
};
