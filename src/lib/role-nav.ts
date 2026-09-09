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
  ShoppingCart,
  Boxes,
  Truck,
  Store,
  Gem,
  Gift,
  Clock,
  ShoppingBag,
  ArrowLeftRight,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/casheva-data";

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: string;
};

export type NavGroup = {
  groupTitle: string;
  items: NavItem[];
};

export const roleNavGrouped: Record<Role, NavGroup[]> = {
  "Admin Koperasi": [
    {
      groupTitle: "Utama",
      items: [
        { title: "Dashboard", url: "/", icon: LayoutDashboard },
      ],
    },
    {
      groupTitle: "Simpan Pinjam (USIPA)",
      items: [
        { title: "Pengajuan Pinjaman", url: "/pengajuan", icon: FilePlus2 },
        { title: "Simpanan Anggota", url: "/simpanan", icon: PiggyBank },
        { title: "Pencairan & Invoice", url: "/pencairan", icon: Receipt },
        { title: "Rekap Angsuran", url: "/angsuran", icon: ListChecks },
      ],
    },
    {
      groupTitle: "Unit Toko & Usaha",
      items: [
        { title: "Kasir POS Toko", url: "/pos", icon: ShoppingCart },
        { title: "Katalog & Stok Barang", url: "/inventori", icon: Boxes },
        { title: "Supplier & Pengadaan", url: "/supplier", icon: Truck },
        { title: "Pesanan Antar & Piket", url: "/pesanan-antar", icon: Clock },
        { title: "Marketplace Anggota", url: "/marketplace-anggota", icon: Store },
        { title: "Unit Gadai & Lelang", url: "/gadai", icon: Gem },
        { title: "Poin & Undian RAT", url: "/poin-undian", icon: Gift },
      ],
    },
    {
      groupTitle: "Rekap Transaksi",
      items: [
        { title: "Semua Transaksi", url: "/transaksi", icon: ArrowLeftRight },
        { title: "Riwayat Transaksi Toko", url: "/toko-transaksi", icon: ShoppingBag },
        { title: "Laporan Keuangan Toko", url: "/laporan-toko", icon: FileBarChart },
      ],
    },
    {
      groupTitle: "Approval & Pengawasan",
      items: [
        { title: "Antrean Verifikasi (Jurbay)", url: "/verifikasi", icon: ShieldCheck },
        { title: "Antrean Rekomendasi (Dan/Ka)", url: "/rekomendasi", icon: ClipboardCheck },
        { title: "Persetujuan ACC (Keprim)", url: "/acc", icon: BadgeCheck },
        { title: "Likuiditas Kas", url: "/likuiditas", icon: Wallet },
        { title: "Pengawasan SHU", url: "/shu", icon: Calculator },
        { title: "Laporan Keuangan", url: "/laporan", icon: FileBarChart },
        { title: "Audit Flow Approval", url: "/audit-flow", icon: GitBranch },
        { title: "Audit Logs", url: "/audit", icon: ScrollText },
      ],
    },
    {
      groupTitle: "Master & Pengaturan",
      items: [
        { title: "Manajemen User & Anggota", url: "/users", icon: Users },
        { title: "Data Anggota Koperasi", url: "/anggota", icon: UsersRound },
        { title: "Master Data TNI AD", url: "/master-data", icon: Database },
        { title: "Kopstuk & TTD", url: "/kopstuk", icon: Stamp },
      ],
    },
  ],

  "Kasir Toko": [
    {
      groupTitle: "Utama",
      items: [
        { title: "Dashboard Kasir", url: "/", icon: LayoutDashboard },
      ],
    },
    {
      groupTitle: "Unit Toko & Kasir",
      items: [
        { title: "Kasir POS Toko", url: "/pos", icon: ShoppingCart },
        { title: "Katalog & Stok Barang", url: "/inventori", icon: Boxes },
        { title: "Pesanan Antar & Piket", url: "/pesanan-antar", icon: Clock },
        { title: "Poin & Undian RAT", url: "/poin-undian", icon: Gift },
        { title: "Unit Gadai & Lelang", url: "/gadai", icon: Gem },
      ],
    },
    {
      groupTitle: "Transaksi & Laporan",
      items: [
        { title: "Semua Transaksi", url: "/transaksi", icon: ArrowLeftRight },
        { title: "Riwayat Transaksi Toko", url: "/toko-transaksi", icon: ShoppingBag },
        { title: "Laporan Penjualan Toko", url: "/laporan-toko", icon: FileBarChart },
      ],
    },
  ],

  "Pimpinan / Dan / Ka": [
    {
      groupTitle: "Utama",
      items: [
        { title: "Dashboard Komando", url: "/", icon: LayoutDashboard },
      ],
    },
    {
      groupTitle: "Approval & Personel",
      items: [
        { title: "Antrean Rekomendasi", url: "/rekomendasi", icon: ClipboardCheck },
        { title: "Data Anggota Satuan", url: "/anggota", icon: UsersRound },
        { title: "Riwayat Pinjaman Satuan", url: "/pinjaman", icon: History },
      ],
    },
    {
      groupTitle: "Transaksi & Belanja",
      items: [
        { title: "Semua Transaksi", url: "/transaksi", icon: ArrowLeftRight },
        { title: "Katalog Belanja Toko", url: "/katalog-belanja", icon: ShoppingBag },
      ],
    },
  ],

  Keprim: [
    {
      groupTitle: "Utama",
      items: [
        { title: "Dashboard Keprim", url: "/", icon: LayoutDashboard },
      ],
    },
    {
      groupTitle: "Approval Otorisasi",
      items: [
        { title: "Antrean Rekomendasi", url: "/rekomendasi", icon: ClipboardCheck },
        { title: "Persetujuan Akhir (ACC)", url: "/acc", icon: BadgeCheck },
      ],
    },
    {
      groupTitle: "Transaksi & Keuangan",
      items: [
        { title: "Semua Transaksi", url: "/transaksi", icon: ArrowLeftRight },
        { title: "Likuiditas Kas", url: "/likuiditas", icon: Wallet },
        { title: "Laporan Keuangan Toko", url: "/laporan-toko", icon: ShoppingBag },
        { title: "Laporan Keuangan", url: "/laporan", icon: FileBarChart },
      ],
    },
  ],

  Bendahara: [
    {
      groupTitle: "Utama",
      items: [
        { title: "Dashboard Bendahara", url: "/", icon: LayoutDashboard },
      ],
    },
    {
      groupTitle: "Simpan Pinjam (USIPA)",
      items: [
        { title: "Pengajuan Pinjaman", url: "/pengajuan", icon: FilePlus2 },
        { title: "Antrean Rekomendasi", url: "/rekomendasi", icon: ClipboardCheck },
        { title: "Simpanan Anggota", url: "/simpanan", icon: PiggyBank },
        { title: "Pencairan & Invoice", url: "/pencairan", icon: Receipt },
        { title: "Rekap Angsuran", url: "/angsuran", icon: ListChecks },
      ],
    },
    {
      groupTitle: "Rekap Transaksi & Laporan",
      items: [
        { title: "Semua Transaksi", url: "/transaksi", icon: ArrowLeftRight },
        { title: "Laporan Keuangan Toko", url: "/laporan-toko", icon: FileBarChart },
        { title: "Laporan Keuangan Koperasi", url: "/laporan", icon: FileBarChart },
      ],
    },
  ],

  "Juru Bayar": [
    {
      groupTitle: "Utama",
      items: [
        { title: "Dashboard Juru Bayar", url: "/", icon: LayoutDashboard },
      ],
    },
    {
      groupTitle: "Verifikasi & Pembayaran",
      items: [
        { title: "Antrean Verifikasi", url: "/verifikasi", icon: ShieldCheck },
        { title: "Pencairan & Invoice", url: "/pencairan", icon: Receipt },
        { title: "Rekap Angsuran", url: "/angsuran", icon: ListChecks },
        { title: "Semua Transaksi", url: "/transaksi", icon: ArrowLeftRight },
      ],
    },
  ],

  Anggota: [
    {
      groupTitle: "Utama",
      items: [
        { title: "Dashboard Anggota", url: "/", icon: LayoutDashboard },
      ],
    },
    {
      groupTitle: "Simpan Pinjam Saya",
      items: [
        { title: "Pengajuan USIPA", url: "/pengajuan", icon: FilePlus2 },
        { title: "Simpanan Saya", url: "/simpanan", icon: PiggyBank },
        { title: "Riwayat Angsuran Saya", url: "/angsuran", icon: ListChecks },
        { title: "Rincian Gaji & Potongan", url: "/gaji", icon: Banknote },
      ],
    },
    {
      groupTitle: "Toko & Layanan",
      items: [
        { title: "Katalog Belanja Toko", url: "/katalog-belanja", icon: ShoppingBag },
        { title: "Pesanan Saya & Piket", url: "/pesanan-antar", icon: Clock },
        { title: "Poin & Undian RAT", url: "/poin-undian", icon: Gift },
        { title: "Marketplace UMKM", url: "/marketplace-anggota", icon: Store },
        { title: "Layanan Gadai & Lelang", url: "/gadai", icon: Gem },
      ],
    },
  ],

  "Pengawas Koperasi": [
    {
      groupTitle: "Utama",
      items: [
        { title: "Dashboard Pengawas", url: "/", icon: LayoutDashboard },
      ],
    },
    {
      groupTitle: "Pengawasan & Audit",
      items: [
        { title: "Pengawasan SHU", url: "/shu", icon: Calculator },
        { title: "Semua Transaksi", url: "/transaksi", icon: ArrowLeftRight },
        { title: "Laporan Keuangan Toko", url: "/laporan-toko", icon: ShoppingBag },
        { title: "Laporan Pendapatan & Biaya", url: "/laporan", icon: Coins },
        { title: "Audit Flow Approval", url: "/audit-flow", icon: GitBranch },
      ],
    },
  ],
};

// Flat fallback for backward compatibility
export const roleNav: Record<Role, NavItem[]> = Object.fromEntries(
  Object.entries(roleNavGrouped).map(([r, groups]) => [
    r,
    groups.flatMap((g) => g.items),
  ])
) as Record<Role, NavItem[]>;
