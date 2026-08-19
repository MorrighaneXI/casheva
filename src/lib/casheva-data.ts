import type { BackendRole, StatusPinjaman } from './api/types';

export type Role =
  | "Admin Koperasi"
  | "Pimpinan / Dan / Ka"
  | "Kaprim"
  | "Bendahara"
  | "Juru Bayar"
  | "Anggota"
  | "Pengawas Koperasi";

export const ROLES: Role[] = [
  "Admin Koperasi",
  "Pimpinan / Dan / Ka",
  "Kaprim",
  "Bendahara",
  "Juru Bayar",
  "Anggota",
  "Pengawas Koperasi",
];

export const roleShort: Record<Role, string> = {
  "Admin Koperasi": "Admin",
  "Pimpinan / Dan / Ka": "Dan/Ka",
  Kaprim: "Kaprim",
  Bendahara: "Bendahara",
  "Juru Bayar": "Juyar",
  Anggota: "Anggota",
  "Pengawas Koperasi": "Pengawas",
};

export function backendRoleToFrontend(role: BackendRole | string): Role {
  switch (role) {
    case 'ADMIN_KOPERASI':
      return 'Admin Koperasi';
    case 'PIMPINAN':
      return 'Pimpinan / Dan / Ka';
    case 'KAPRIM':
      return 'Kaprim';
    case 'BENDAHARA':
      return 'Bendahara';
    case 'PENGAWAS':
      return 'Pengawas Koperasi';
    case 'JURU_BAYAR':
      return 'Juru Bayar';
    case 'ANGGOTA':
      return 'Anggota';
    default:
      return 'Admin Koperasi';
  }
}

export function frontendRoleToBackend(role: Role | string): BackendRole {
  switch (role) {
    case 'Admin Koperasi':
      return 'ADMIN_KOPERASI';
    case 'Pimpinan / Dan / Ka':
      return 'PIMPINAN';
    case 'Kaprim':
      return 'KAPRIM';
    case 'Bendahara':
      return 'BENDAHARA';
    case 'Pengawas Koperasi':
      return 'PENGAWAS';
    case 'Juru Bayar':
      return 'JURU_BAYAR';
    case 'Anggota':
      return 'ANGGOTA';
    default:
      return 'ADMIN_KOPERASI';
  }
}

export const formatRp = (n: number) =>
  "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);

export type LoanStatus =
  | "Pending"
  | "Verified Primkop"
  | "Verified Jurbay"
  | "Approved Dan"
  | "ACC Kaprim"
  | "Upload Berkas"
  | "Disbursed"
  | "Rejected"
  | "Lunas";

export function backendStatusToFrontend(status: StatusPinjaman | string): LoanStatus {
  switch (status) {
    case 'DIAJUKAN':
      return 'Pending';
    case 'VERIFIKASI_PRIMKOP':
      return 'Verified Primkop';
    case 'VERIFIKASI_JURU_BAYAR':
      return 'Verified Jurbay';
    case 'REKOMENDASI_PIMPINAN':
      return 'Approved Dan';
    case 'SETUJU_KAPRIM':
      return 'ACC Kaprim';
    case 'MENUNGGU_DOKUMEN':
      return 'Upload Berkas';
    case 'DICAIRKAN':
      return 'Disbursed';
    case 'LUNAS':
      return 'Lunas';
    case 'DITOLAK':
      return 'Rejected';
    default:
      return 'Pending';
  }
}

export const loanStatusTone: Record<LoanStatus, string> = {
  Pending: "bg-muted text-muted-foreground border-border",
  "Verified Primkop": "bg-primary-soft text-primary border-primary/20",
  "Verified Jurbay": "bg-accent text-accent-foreground border-gold/30",
  "Approved Dan": "bg-gold-soft text-accent-foreground border-gold/40",
  "ACC Kaprim": "bg-primary-soft text-primary border-primary/25",
  "Upload Berkas": "bg-accent/40 text-foreground border-accent",
  Disbursed: "bg-success/15 text-success border-success/30",
  Rejected: "bg-destructive/12 text-destructive border-destructive/30",
  Lunas: "bg-success/20 text-success border-success/40",
};

export const recentLoans = [
  {
    id: "PJM-2026-0184",
    nama: "Serma Budi Santoso",
    nrp: "21980045",
    satminkal: "Disinfolahtad",
    jumlah: 15000000,
    tenor: 24,
    status: "ACC Kaprim" as LoanStatus,
    tanggal: "02 Agu 2026",
  },
  {
    id: "PJM-2026-0183",
    nama: "Kapten Inf Rahmat Hidayat",
    nrp: "11060078",
    satminkal: "Ditkuad",
    jumlah: 20000000,
    tenor: 36,
    status: "Approved Dan" as LoanStatus,
    tanggal: "02 Agu 2026",
  },
  {
    id: "PJM-2026-0182",
    nama: "Pelda Agus Wibowo",
    nrp: "21930112",
    satminkal: "Mabesad",
    jumlah: 8000000,
    tenor: 18,
    status: "Verified Jurbay" as LoanStatus,
    tanggal: "01 Agu 2026",
  },
  {
    id: "PJM-2026-0181",
    nama: "PNS Sri Wahyuni",
    nrp: "198504112009",
    satminkal: "Disinfolahtad",
    jumlah: 5000000,
    tenor: 12,
    status: "Pending" as LoanStatus,
    tanggal: "01 Agu 2026",
  },
  {
    id: "PJM-2026-0180",
    nama: "Letkol Cba Dedi Kurnia",
    nrp: "11020033",
    satminkal: "Ditziad",
    jumlah: 18000000,
    tenor: 30,
    status: "Disbursed" as LoanStatus,
    tanggal: "31 Jul 2026",
  },
  {
    id: "PJM-2026-0179",
    nama: "Sertu Hendra Gunawan",
    nrp: "31770091",
    satminkal: "Mabesad",
    jumlah: 6000000,
    tenor: 12,
    status: "Rejected" as LoanStatus,
    tanggal: "30 Jul 2026",
  },
  {
    id: "PJM-2026-0178",
    nama: "Mayor Kav Fajar Nugroho",
    nrp: "11150221",
    satminkal: "Ditkuad",
    jumlah: 12000000,
    tenor: 24,
    status: "Pending" as LoanStatus,
    tanggal: "29 Jul 2026",
  },
];

/** Ringkasan status pinjaman untuk dashboard eksekutif */
export function getLoanStatusCounts(loans: typeof recentLoans = recentLoans) {
  const prosesStatuses: LoanStatus[] = ["Pending", "Verified Jurbay", "Approved Dan"];
  const accStatuses: LoanStatus[] = ["ACC Kaprim", "Disbursed"];
  return {
    proses: loans.filter((l) => prosesStatuses.includes(l.status)).length,
    disetujui: loans.filter((l) => accStatuses.includes(l.status)).length,
    ditolak: loans.filter((l) => l.status === "Rejected").length,
  };
}

export const trenData = [
  { bulan: "Jan", simpanan: 820, pinjaman: 540 },
  { bulan: "Feb", simpanan: 880, pinjaman: 610 },
  { bulan: "Mar", simpanan: 940, pinjaman: 700 },
  { bulan: "Apr", simpanan: 1010, pinjaman: 665 },
  { bulan: "Mei", simpanan: 1090, pinjaman: 780 },
  { bulan: "Jun", simpanan: 1180, pinjaman: 820 },
  { bulan: "Jul", simpanan: 1265, pinjaman: 905 },
  { bulan: "Agu", simpanan: 1340, pinjaman: 940 },
  { bulan: "Sep", simpanan: 1420, pinjaman: 1010 },
  { bulan: "Okt", simpanan: 1505, pinjaman: 1080 },
  { bulan: "Nov", simpanan: 1590, pinjaman: 1120 },
  { bulan: "Des", simpanan: 1690, pinjaman: 1195 },
];

export const angsuranData = [
  { bulan: "Jan", target: 320, realisasi: 298 },
  { bulan: "Feb", target: 325, realisasi: 315 },
  { bulan: "Mar", target: 330, realisasi: 322 },
  { bulan: "Apr", target: 340, realisasi: 305 },
  { bulan: "Mei", target: 352, realisasi: 344 },
  { bulan: "Jun", target: 360, realisasi: 358 },
  { bulan: "Jul", target: 371, realisasi: 349 },
  { bulan: "Agu", target: 380, realisasi: 366 },
];

/** Pengajuan pinjaman satuan per bulan (jumlah berkas) */
export const pengajuanSatuanData = [
  { bulan: "Mar", pengajuan: 12, disetujui: 9 },
  { bulan: "Apr", pengajuan: 15, disetujui: 12 },
  { bulan: "Mei", pengajuan: 11, disetujui: 10 },
  { bulan: "Jun", pengajuan: 18, disetujui: 14 },
  { bulan: "Jul", pengajuan: 21, disetujui: 17 },
  { bulan: "Agu", pengajuan: 16, disetujui: 11 },
];

/** Likuiditas kas vs pencairan (juta rupiah) */
export const likuiditasData = [
  { bulan: "Mar", kas: 4200, pencairan: 980 },
  { bulan: "Apr", kas: 4380, pencairan: 1120 },
  { bulan: "Mei", kas: 4510, pencairan: 1040 },
  { bulan: "Jun", kas: 4290, pencairan: 1380 },
  { bulan: "Jul", kas: 4620, pencairan: 1210 },
  { bulan: "Agu", kas: 4805, pencairan: 1150 },
];

export type Anggota = {
  nrp: string;
  nama: string;
  pangkat: string;
  golongan: "Pamen" | "Pama" | "Ba/Ta" | "PNS";
  korps: string;
  satminkal: string;
  simpananWajib: number;
  simpananSukarela: number;
  status: "Aktif" | "Cuti" | "Non-Aktif";
};

export const anggotaList: Anggota[] = [
  { nrp: "11020033", nama: "Dedi Kurnia", pangkat: "Letkol Cba", golongan: "Pamen", korps: "Cba", satminkal: "Ditziad", simpananWajib: 4800000, simpananSukarela: 12500000, status: "Aktif" },
  { nrp: "11060078", nama: "Rahmat Hidayat", pangkat: "Kapten Inf", golongan: "Pama", korps: "Inf", satminkal: "Ditkuad", simpananWajib: 3600000, simpananSukarela: 7250000, status: "Aktif" },
  { nrp: "21980045", nama: "Budi Santoso", pangkat: "Serma", golongan: "Ba/Ta", korps: "Chb", satminkal: "Disinfolahtad", simpananWajib: 2400000, simpananSukarela: 4100000, status: "Aktif" },
  { nrp: "21930112", nama: "Agus Wibowo", pangkat: "Pelda", golongan: "Ba/Ta", korps: "Czi", satminkal: "Mabesad", simpananWajib: 2700000, simpananSukarela: 5300000, status: "Cuti" },
  { nrp: "198504112009", nama: "Sri Wahyuni", pangkat: "Penata Muda", golongan: "PNS", korps: "PNS", satminkal: "Disinfolahtad", simpananWajib: 1800000, simpananSukarela: 2900000, status: "Aktif" },
  { nrp: "11150221", nama: "Fajar Nugroho", pangkat: "Mayor Kav", golongan: "Pamen", korps: "Kav", satminkal: "Ditkuad", simpananWajib: 4200000, simpananSukarela: 9800000, status: "Aktif" },
  { nrp: "31770091", nama: "Hendra Gunawan", pangkat: "Sertu", golongan: "Ba/Ta", korps: "Inf", satminkal: "Mabesad", simpananWajib: 1500000, simpananSukarela: 1750000, status: "Aktif" },
  { nrp: "11090154", nama: "Wahyu Prasetyo", pangkat: "Lettu Chb", golongan: "Pama", korps: "Chb", satminkal: "Disinfolahtad", simpananWajib: 3000000, simpananSukarela: 6400000, status: "Non-Aktif" },
];

export const shuRows = [
  { nrp: "11020033", nama: "Letkol Cba Dedi Kurnia", modal: 17300000, transaksi: 24500000 },
  { nrp: "11060078", nama: "Kapten Inf Rahmat Hidayat", modal: 10850000, transaksi: 18200000 },
  { nrp: "21980045", nama: "Serma Budi Santoso", modal: 6500000, transaksi: 9400000 },
  { nrp: "21930112", nama: "Pelda Agus Wibowo", modal: 8000000, transaksi: 11200000 },
  { nrp: "198504112009", nama: "Penata Muda Sri Wahyuni", modal: 4700000, transaksi: 6100000 },
  { nrp: "11150221", nama: "Mayor Kav Fajar Nugroho", modal: 14000000, transaksi: 15800000 },
];

export const workflowSteps = [
  "Pengajuan",
  "Verifikasi Jurbay",
  "Rekomendasi Dan/Ka",
  "ACC Kaprim",
  "Upload Berkas",
  "Pencairan",
];

/* ───────────────────────── RBAC & master data ───────────────────────── */

export type SystemUser = {
  id: string;
  nama: string;
  nrp: string;
  role: Role;
  satminkal: string;
  status: "Aktif" | "Nonaktif";
  lastLogin: string;
};

export const systemUsers: SystemUser[] = [
  { id: "USR-001", nama: "Mayor Cba Arif Setiawan", nrp: "11110234", role: "Admin Koperasi", satminkal: "Disinfolahtad", status: "Aktif", lastLogin: "06 Agu 2026 06:10" },
  { id: "USR-002", nama: "Kolonel Inf Bagus Prayitno", nrp: "10980017", role: "Pimpinan / Dan / Ka", satminkal: "Disinfolahtad", status: "Aktif", lastLogin: "05 Agu 2026 16:42" },
  { id: "USR-003", nama: "Letkol Cba Dedi Kurnia", nrp: "11020033", role: "Kaprim", satminkal: "Ditziad", status: "Aktif", lastLogin: "05 Agu 2026 14:20" },
  { id: "USR-004", nama: "Serma Budi Santoso", nrp: "21980045", role: "Bendahara", satminkal: "Disinfolahtad", status: "Aktif", lastLogin: "06 Agu 2026 05:55" },
  { id: "USR-005", nama: "Kapten Inf Rahmat Hidayat", nrp: "11060078", role: "Pengawas Koperasi", satminkal: "Ditkuad", status: "Aktif", lastLogin: "04 Agu 2026 09:31" },
  { id: "USR-006", nama: "Penata Muda Sri Wahyuni", nrp: "198504112009", role: "Bendahara", satminkal: "Disinfolahtad", status: "Nonaktif", lastLogin: "21 Jul 2026 11:04" },
  { id: "USR-007", nama: "Pelda Agus Wibowo", nrp: "21930112", role: "Juru Bayar", satminkal: "Mabesad", status: "Aktif", lastLogin: "05 Agu 2026 08:12" },
  { id: "USR-008", nama: "Sertu Hendra Gunawan", nrp: "31770091", role: "Anggota", satminkal: "Mabesad", status: "Aktif", lastLogin: "06 Agu 2026 07:05" },
];

/** Antrean verifikasi Juru Bayar (sebelum lanjut ke Dan/Ka) */
export const antreanJuyar = [
  {
    id: "PJM-2026-0187",
    nama: "Sertu Hendra Gunawan",
    pangkat: "Sertu Inf",
    nrp: "31770091",
    satminkal: "Mabesad",
    plafon: 6000000,
    tenor: 12,
    gaji: 5400000,
    tunkin: 2100000,
    potongan: 1450000,
    sisaGaji: 6050000,
    layak: true,
    catatan: "Sisa gaji memenuhi ketentuan minimal",
  },
  {
    id: "PJM-2026-0181",
    nama: "Penata Muda Sri Wahyuni",
    pangkat: "Penata Muda",
    nrp: "198504112009",
    satminkal: "Disinfolahtad",
    plafon: 5000000,
    tenor: 12,
    gaji: 4800000,
    tunkin: 900000,
    potongan: 2200000,
    sisaGaji: 3500000,
    layak: true,
    catatan: "Dokumen lengkap, potongan masih dalam batas aman",
  },
  {
    id: "PJM-2026-0178",
    nama: "Mayor Kav Fajar Nugroho",
    pangkat: "Mayor Kav",
    nrp: "11150221",
    satminkal: "Ditkuad",
    plafon: 12000000,
    tenor: 24,
    gaji: 9100000,
    tunkin: 4800000,
    potongan: 5200000,
    sisaGaji: 8700000,
    layak: false,
    catatan: "Rasio angsuran terhadap sisa gaji di atas ambang 40%",
  },
];

/** Profil gaji anggota (demo role Anggota) */
export const anggotaGajiProfile = {
  nama: "Sertu Hendra Gunawan",
  nrp: "31770091",
  pangkat: "Sertu Inf",
  satminkal: "Mabesad",
  gajiPokok: 5400000,
  tunkin: 2100000,
  tunjanganLain: 350000,
  potongan: [
    { nama: "Simpanan Wajib", jumlah: 150000 },
    { nama: "Simpanan Sukarela", jumlah: 150000 },
    { nama: "Angsuran Pinjaman PJM-2026-0175", jumlah: 625000 },
    { nama: "Iuran Koperasi", jumlah: 25000 },
    { nama: "Asuransi", jumlah: 500000 },
  ],
};

export const anggotaAngsuranSaya = [
  {
    id: "PJM-2026-0175",
    pokok: 7500000,
    angsuranKe: 5,
    totalAngsuran: 18,
    angsuranBulanan: 625000,
    sisa: 8125000,
    status: "Lancar" as const,
  },
];

export const kotamaList = [
  { kotama: "Mabesad", satminkal: ["Disinfolahtad", "Ditkuad", "Ditziad"], anggota: 842 },
  { kotama: "Kodam Jaya", satminkal: ["Denma Kodam", "Kesdam Jaya"], anggota: 361 },
  { kotama: "Kostrad", satminkal: ["Divif 1", "Divif 2"], anggota: 279 },
];

export const pangkatKorps = [
  { golongan: "Pamen", pangkat: "Kolonel, Letkol, Mayor", korps: "Inf, Kav, Cba, Chb, Czi", potongan: 300000 },
  { golongan: "Pama", pangkat: "Kapten, Lettu, Letda", korps: "Inf, Kav, Cba, Chb, Czi", potongan: 250000 },
  { golongan: "Ba/Ta", pangkat: "Pelda s.d. Prada", korps: "Inf, Chb, Czi, Cpm", potongan: 150000 },
  { golongan: "ASN", pangkat: "Penata s.d. Pengatur", korps: "PNS TNI AD", potongan: 150000 },
];

export const tabelPinjaman = [
  { plafon: 1000000, tenor: 12, bunga: 12, angsuran: 88849 },
  { plafon: 5000000, tenor: 18, bunga: 12, angsuran: 305556 },
  { plafon: 10000000, tenor: 24, bunga: 12, angsuran: 516667 },
  { plafon: 15000000, tenor: 30, bunga: 12, angsuran: 650000 },
  { plafon: 20000000, tenor: 36, bunga: 12, angsuran: 755556 },
];

export const auditLogs = [
  { waktu: "06 Agu 2026 06:12", user: "Mayor Cba Arif Setiawan", aksi: "Update Kopstuk Satuan", modul: "Pengaturan", ip: "10.12.4.21" },
  { waktu: "06 Agu 2026 05:58", user: "Serma Budi Santoso", aksi: "Verifikasi Jurbay PJM-2026-0184", modul: "Pinjaman", ip: "10.12.4.66" },
  { waktu: "05 Agu 2026 16:44", user: "Kolonel Inf Bagus Prayitno", aksi: "Rekomendasi Dan/Ka PJM-2026-0183", modul: "Pinjaman", ip: "10.12.4.10" },
  { waktu: "05 Agu 2026 14:22", user: "Letkol Cba Dedi Kurnia", aksi: "ACC Kaprim PJM-2026-0180", modul: "Pinjaman", ip: "10.12.4.02" },
  { waktu: "05 Agu 2026 08:15", user: "Pelda Agus Wibowo", aksi: "Batch Simpanan Sukarela Juli", modul: "Simpanan", ip: "10.12.4.77" },
];

/** Antrean rekomendasi Dan/Ka */
export const antreanRekomendasi = [
  { id: "PJM-2026-0186", nama: "Serda Yoga Pratama", pangkat: "Serda Inf", nrp: "31800142", plafon: 10000000, tenor: 24, gaji: 6200000, tunkin: 3100000, potongan: 1850000, jurbay: "Lolos Verifikasi" },
  { id: "PJM-2026-0185", nama: "Lettu Chb Wahyu Prasetyo", pangkat: "Lettu Chb", nrp: "11090154", plafon: 15000000, tenor: 30, gaji: 8100000, tunkin: 4400000, potongan: 2600000, jurbay: "Lolos Verifikasi" },
  { id: "PJM-2026-0183", nama: "Kapten Inf Rahmat Hidayat", pangkat: "Kapten Inf", nrp: "11060078", plafon: 20000000, tenor: 36, gaji: 9400000, tunkin: 5200000, potongan: 3100000, jurbay: "Lolos Verifikasi" },
  { id: "PJM-2026-0182", nama: "Pelda Agus Wibowo", pangkat: "Pelda Czi", nrp: "21930112", plafon: 8000000, tenor: 18, gaji: 5800000, tunkin: 2700000, potongan: 1600000, jurbay: "Catatan: sisa gaji tipis" },
];

/** Antrean ACC Kaprim (sudah direkomendasi Dan/Ka) */
export const antreanAcc = [
  {
    id: "PJM-2026-0184",
    nama: "Serma Budi Santoso",
    nrp: "21980045",
    satminkal: "Disinfolahtad",
    plafon: 15000000,
    tenor: 24,
    bunga: 12,
    dokumen: { KTP: true, "Slip Gaji": true, "Rekomendasi Dan/Ka": true, "Akad Kredit": true },
  },
  {
    id: "PJM-2026-0183",
    nama: "Kapten Inf Rahmat Hidayat",
    nrp: "11060078",
    satminkal: "Ditkuad",
    plafon: 20000000,
    tenor: 36,
    bunga: 12,
    dokumen: { KTP: true, "Slip Gaji": true, "Rekomendasi Dan/Ka": true, "Akad Kredit": false },
  },
  {
    id: "PJM-2026-0181",
    nama: "Penata Muda Sri Wahyuni",
    nrp: "198504112009",
    satminkal: "Disinfolahtad",
    plafon: 5000000,
    tenor: 12,
    bunga: 12,
    dokumen: { KTP: true, "Slip Gaji": true, "Rekomendasi Dan/Ka": true, "Akad Kredit": true },
  },
];

export const potonganSukarela = {
  Pamen: 300000,
  Pama: 250000,
  "Ba/Ta/ASN": 150000,
} as const;

export const shuDistribusi = [
  { pos: "Cadangan Koperasi", persen: 40 },
  { pos: "Jasa Modal (Simpanan)", persen: 20 },
  { pos: "Jasa Usaha (Pinjaman)", persen: 30 },
  { pos: "Pengurus / Pengawas", persen: 5 },
  { pos: "Dana Sosial & Pendidikan", persen: 5 },
];

export const keuanganRingkas = {
  pendapatan: 2_145_000_000,
  biaya: 860_500_000,
  shu: 1_284_500_000,
  kas: 4_805_000_000,
  pinjamanBerjalan: 11_950_000_000,
};

export const approvalTrail = [
  { tahap: "Pengajuan Anggota", waktu: "28 Jul 2026 09:12", aktor: "Serma Budi Santoso", ket: "Plafon Rp 15.000.000 / tenor 24 bulan" },
  { tahap: "Verifikasi Juru Bayar", waktu: "29 Jul 2026 10:40", aktor: "Pelda Agus Wibowo", ket: "Sisa gaji memenuhi syarat, dokumen lengkap" },
  { tahap: "Rekomendasi Dan/Ka", waktu: "31 Jul 2026 14:05", aktor: "Kolonel Inf Bagus Prayitno", ket: "Direkomendasikan tanpa catatan" },
  { tahap: "ACC Kaprim", waktu: "02 Agu 2026 08:30", aktor: "Letkol Cba Dedi Kurnia", ket: "Disetujui, diteruskan ke Bendahara" },
  { tahap: "Pencairan", waktu: "03 Agu 2026 11:15", aktor: "Bendahara Koperasi", ket: "Kwitansi #INV2608030001 diterbitkan" },
];

export const pencairanQueue = [
  { invoice: "#INV2608060001", id: "PJM-2026-0184", nama: "Serma Budi Santoso", jumlah: 15000000, biaya: 150000, tanggal: "06 Agu 2026" },
  { invoice: "#INV2608060002", id: "PJM-2026-0181", nama: "Penata Muda Sri Wahyuni", jumlah: 5000000, biaya: 50000, tanggal: "06 Agu 2026" },
  { invoice: "#INV2608050004", id: "PJM-2026-0180", nama: "Letkol Cba Dedi Kurnia", jumlah: 18000000, biaya: 180000, tanggal: "05 Agu 2026" },
];

export const rekapAngsuran = [
  { nrp: "11020033", nama: "Letkol Cba Dedi Kurnia", pokok: 18000000, angsuranKe: 6, sisa: 14400000, status: "Lancar" },
  { nrp: "21980045", nama: "Serma Budi Santoso", pokok: 15000000, angsuranKe: 2, sisa: 13750000, status: "Lancar" },
  { nrp: "11060078", nama: "Kapten Inf Rahmat Hidayat", pokok: 20000000, angsuranKe: 9, sisa: 15000000, status: "Lancar" },
  { nrp: "21930112", nama: "Pelda Agus Wibowo", pokok: 8000000, angsuranKe: 4, sisa: 5600000, status: "Terlambat" },
];
