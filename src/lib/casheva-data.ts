export type Role =
  | "Admin Koperasi"
  | "Pimpinan/Dan/Ka"
  | "Kaprim"
  | "Pengurus"
  | "Pengawas";

export const ROLES: Role[] = [
  "Admin Koperasi",
  "Pimpinan/Dan/Ka",
  "Kaprim",
  "Pengurus",
  "Pengawas",
];

export const formatRp = (n: number) =>
  "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);

export type LoanStatus =
  | "Pending"
  | "Verified Jurbay"
  | "Approved Dan"
  | "ACC Kaprim"
  | "Disbursed"
  | "Rejected";

export const loanStatusTone: Record<LoanStatus, string> = {
  Pending: "bg-muted text-muted-foreground border-border",
  "Verified Jurbay": "bg-accent text-accent-foreground border-gold/30",
  "Approved Dan": "bg-gold-soft text-accent-foreground border-gold/40",
  "ACC Kaprim": "bg-primary-soft text-primary border-primary/25",
  Disbursed: "bg-success/15 text-success border-success/30",
  Rejected: "bg-destructive/12 text-destructive border-destructive/30",
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
];

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
