import type { BackendRole, StatusPinjaman } from './api/types';

export type Role =
  | "Admin Koperasi"
  | "Pimpinan / Dan / Ka"
  | "Keprim"
  | "Bendahara"
  | "Juru Bayar"
  | "Kasir Toko"
  | "Anggota"
  | "Pengawas Koperasi";

export const ROLES: Role[] = [
  "Admin Koperasi",
  "Pimpinan / Dan / Ka",
  "Keprim",
  "Bendahara",
  "Juru Bayar",
  "Kasir Toko",
  "Anggota",
  "Pengawas Koperasi",
];

export const roleShort: Record<Role, string> = {
  "Admin Koperasi": "Admin",
  "Pimpinan / Dan / Ka": "Dan/Ka",
  Keprim: "Keprim",
  Bendahara: "Bendahara",
  "Juru Bayar": "Juyar",
  "Kasir Toko": "Kasir",
  Anggota: "Anggota",
  "Pengawas Koperasi": "Pengawas",
};

export function backendRoleToFrontend(role: BackendRole | string): Role {
  switch (role) {
    case 'ADMIN_KOPERASI':
      return 'Admin Koperasi';
    case 'PIMPINAN':
      return 'Pimpinan / Dan / Ka';
    case 'KEPRIM':
    case 'KAPRIM':
      return 'Keprim';
    case 'BENDAHARA':
      return 'Bendahara';
    case 'PENGAWAS':
      return 'Pengawas Koperasi';
    case 'JURU_BAYAR':
      return 'Juru Bayar';
    case 'KASIR_TOKO':
      return 'Kasir Toko';
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
    case 'Keprim':
    case 'Kaprim':
      return 'KEPRIM';
    case 'Bendahara':
      return 'BENDAHARA';
    case 'Pengawas Koperasi':
      return 'PENGAWAS';
    case 'Juru Bayar':
      return 'JURU_BAYAR';
    case 'Kasir Toko':
      return 'KASIR_TOKO' as BackendRole;
    case 'Anggota':
      return 'ANGGOTA';
    default:
      return 'ADMIN_KOPERASI';
  }
}

export function formatRp(n: number | string | null | undefined): string {
  if (n === null || n === undefined || isNaN(Number(n))) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(n));
}

export const formatRupiah = formatRp;

export function formatPangkatKorps(
  pangkat?: string | null,
  korps?: string | null,
  kategori?: string | null,
): string {
  if (!pangkat || pangkat.trim() === '-' || pangkat.trim() === '') return '-';
  let p = pangkat.trim();
  const c = korps && korps.trim() !== '-' && korps.trim() !== 'NONE' ? korps.trim() : '';
  const kat = (kategori || '').toUpperCase();

  // 1. PATI (Perwira Tinggi) -> Selalu diakhiri "TNI", tidak memakai singkatan korps
  const isPati =
    kat === 'PATI' ||
    ['Brigjen', 'Mayjen', 'Letjen', 'Jenderal', 'Brigadir Jenderal', 'Mayor Jenderal', 'Letnan Jenderal'].some((pat) =>
      p.toLowerCase().startsWith(pat.toLowerCase()),
    );

  if (isPati) {
    p = p.replace(/\s+(Inf|Kav|Arm|Arh|Czi|Cpm|Cba|Ckm|Cpl|Cke|Chk|Caj|Cku|Ctp|Cpn)\b/gi, '').trim();
    if (p.includes('TNI')) return p;
    return `${p} TNI`;
  }

  // 2. PAMEN & PAMA (Perwira Menengah & Pertama) -> Digabungkan dengan Korps (misal: Kolonel Inf, Kapten Czi)
  const isPerwira =
    kat === 'PAMEN' ||
    kat === 'PAMA' ||
    ['Kolonel', 'Letkol', 'Mayor', 'Kapten', 'Lettu', 'Letda', 'Letnan Kolonel', 'Letnan Satu', 'Letnan Dua'].some((per) =>
      p.toLowerCase().startsWith(per.toLowerCase()),
    );

  if (isPerwira) {
    if (!c) return p;
    if (!p.toLowerCase().includes(c.toLowerCase())) {
      return `${p} ${c}`;
    }
    return p;
  }

  // 3. BA / TA / PNS -> HANYA pangkat saja, hilangkan korps jika ada
  p = p.replace(/\s+(Inf|Kav|Arm|Arh|Czi|Cpm|Cba|Ckm|Cpl|Cke|Chk|Caj|Cku|Ctp|Cpn|TNI)\b/gi, '').trim();
  return p;
}

export const potonganSukarela: Record<string, number> = {
  Pamen: 300_000,
  Pama: 250_000,
  "Ba/Ta/ASN": 150_000,
};

export const shuDistribusi = [
  { pos: "Jasa Modal Anggota", persen: 20 },
  { pos: "Jasa Usaha / Transaksi Anggota", persen: 30 },
  { pos: "Dana Cadangan Koperasi", persen: 20 },
  { pos: "Dana Pengurus & Pengawas", persen: 10 },
  { pos: "Dana Pendidikan Koperasi", persen: 5 },
  { pos: "Dana Sosial & Pembinaan Satuan", persen: 10 },
  { pos: "Dana Karyawan / Staf", persen: 5 },
];

export const formatPangkatTniAd = formatPangkatKorps;

export function cleanNamaPersonel(nama?: string | null): string {
  if (!nama) return '';
  let n = nama.trim();

  const rankPrefixRegex = /^(?:(?:Jenderal|Letnan\s+Jenderal|Letjen|Mayor\s+Jenderal|Mayjen|Brigadir\s+Jenderal|Brigjen|Kolonel|Letnan\s+Kolonel|Letkol|Mayor|Kapten|Letnan\s+Satu|Lettu|Letnan\s+Dua|Letda|Pembantu\s+Letnan\s+Satu|Peltu|Pembantu\s+Letnan\s+Dua|Pelda|Sersan\s+Mayor|Serma|Sersan\s+Kepala|Serka|Sersan\s+Satu|Sertu|Sersan\s+Dua|Serda|Kopral\s+Kepala|Kopka|Kopral\s+Satu|Koptu|Kopral\s+Dua|Kopda|Prajurit\s+Kepala|Praka|Prajurit\s+Satu|Pratu|Prajurit\s+Dua|Prada|PNS(?:\s+(?:IV|III|II|I)\/[A-Ea-e])?|PPPK)\s*(?:(?:TNI\s*AD|TNI|Inf|Kav|Arm|Arh|Czi|Cpm|Cba|Ckm|Cpl|Cke|Chk|Caj|Cku|Ctp|Cpn)\b)?\s*)+/i;

  n = n.replace(rankPrefixRegex, '').trim();
  return n || (nama?.trim() ?? '');
}

export function formatNamaLengkapDinas(
  nama?: string | null,
  pangkat?: string | null,
  korps?: string | null,
  kategori?: string | null,
): string {
  let cleanNama = cleanNamaPersonel(nama);
  if (!cleanNama) return '-';

  if (cleanNama.toLowerCase() === 'anggota koperasi') {
    cleanNama = 'Personel TNI AD';
  }

  const pkt = formatPangkatKorps(pangkat, korps, kategori);
  if (!pkt || pkt === '-') return cleanNama;

  if (cleanNama.toLowerCase().startsWith(pkt.toLowerCase())) {
    return cleanNama;
  }

  return `${pkt} ${cleanNama}`.trim();
}

export type LoanStatus =
  | "Pending"
  | "Verified Primkop"
  | "Verified Jurbay"
  | "Approved Dan"
  | "ACC Keprim"
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
    case 'SETUJU_KEPRIM':
    case 'SETUJU_KAPRIM':
      return 'ACC Keprim';
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
  "ACC Keprim": "bg-primary-soft text-primary border-primary/25",
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
    satminkal: "INFOLAHTADAM IV/DIPONEGORO",
    jumlah: 15000000,
    tenor: 24,
    status: "ACC Keprim" as LoanStatus,
    tanggal: "02 Agu 2026",
  },
  {
    id: "PJM-2026-0183",
    nama: "Kapten Inf Rahmat Hidayat",
    nrp: "11060078",
    satminkal: "INFOLAHTADAM IV/DIPONEGORO",
    jumlah: 20000000,
    tenor: 36,
    status: "Approved Dan" as LoanStatus,
    tanggal: "02 Agu 2026",
  },
  {
    id: "PJM-2026-0182",
    nama: "Pelda Agus Wibowo",
    nrp: "21930112",
    satminkal: "INFOLAHTADAM IV/DIPONEGORO",
    jumlah: 8000000,
    tenor: 18,
    status: "Verified Jurbay" as LoanStatus,
    tanggal: "01 Agu 2026",
  },
  {
    id: "PJM-2026-0181",
    nama: "PNS Sri Wahyuni",
    nrp: "198504112009",
    satminkal: "INFOLAHTADAM IV/DIPONEGORO",
    jumlah: 5000000,
    tenor: 12,
    status: "Pending" as LoanStatus,
    tanggal: "01 Agu 2026",
  },
  {
    id: "PJM-2026-0180",
    nama: "Letkol Cba Dedi Kurnia",
    nrp: "11020033",
    satminkal: "INFOLAHTADAM IV/DIPONEGORO",
    jumlah: 18000000,
    tenor: 30,
    status: "Disbursed" as LoanStatus,
    tanggal: "31 Jul 2026",
  },
  {
    id: "PJM-2026-0179",
    nama: "Sertu Hendra Gunawan",
    nrp: "31770091",
    satminkal: "INFOLAHTADAM IV/DIPONEGORO",
    jumlah: 6000000,
    tenor: 12,
    status: "Rejected" as LoanStatus,
    tanggal: "30 Jul 2026",
  },
  {
    id: "PJM-2026-0178",
    nama: "Mayor Kav Fajar Nugroho",
    nrp: "11150221",
    satminkal: "INFOLAHTADAM IV/DIPONEGORO",
    jumlah: 12000000,
    tenor: 24,
    status: "Pending" as LoanStatus,
    tanggal: "29 Jul 2026",
  },
];

export function getLoanStatusCounts(loans: typeof recentLoans = recentLoans) {
  const prosesStatuses: LoanStatus[] = ["Pending", "Verified Jurbay", "Approved Dan"];
  const accStatuses: LoanStatus[] = ["ACC Keprim", "Disbursed"];
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

export const pengajuanSatuanData = [
  { bulan: "Mar", pengajuan: 12, disetujui: 9 },
  { bulan: "Apr", pengajuan: 15, disetujui: 12 },
  { bulan: "Mei", pengajuan: 11, disetujui: 10 },
  { bulan: "Jun", pengajuan: 18, disetujui: 14 },
  { bulan: "Jul", pengajuan: 21, disetujui: 17 },
  { bulan: "Agu", pengajuan: 16, disetujui: 11 },
];

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
  creditLimit?: number;
  tipeAnggota?: "ORGANIK" | "NON_ORGANIK";
  status: "Aktif" | "Cuti" | "Non-Aktif";
};

export const anggotaList: Anggota[] = [
  { nrp: "11020033", nama: "Dedi Kurnia", pangkat: "Letkol Cba", golongan: "Pamen", korps: "Cba", satminkal: "INFOLAHTADAM IV/DIPONEGORO", simpananWajib: 4800000, simpananSukarela: 12500000, creditLimit: 10000000, tipeAnggota: "ORGANIK", status: "Aktif" },
  { nrp: "11060078", nama: "Rahmat Hidayat", pangkat: "Kapten Inf", golongan: "Pama", korps: "Inf", satminkal: "INFOLAHTADAM IV/DIPONEGORO", simpananWajib: 3600000, simpananSukarela: 7250000, creditLimit: 7500000, tipeAnggota: "ORGANIK", status: "Aktif" },
  { nrp: "21980045", nama: "Budi Santoso", pangkat: "Serma", golongan: "Ba/Ta", korps: "Chb", satminkal: "INFOLAHTADAM IV/DIPONEGORO", simpananWajib: 2400000, simpananSukarela: 4100000, creditLimit: 5000000, tipeAnggota: "ORGANIK", status: "Aktif" },
  { nrp: "21930112", nama: "Agus Wibowo", pangkat: "Pelda", golongan: "Ba/Ta", korps: "Czi", satminkal: "INFOLAHTADAM IV/DIPONEGORO", simpananWajib: 2700000, simpananSukarela: 5300000, creditLimit: 5000000, tipeAnggota: "ORGANIK", status: "Cuti" },
  { nrp: "198504112009", nama: "Sri Wahyuni", pangkat: "Penata Muda", golongan: "PNS", korps: "PNS", satminkal: "INFOLAHTADAM IV/DIPONEGORO", simpananWajib: 1800000, simpananSukarela: 2900000, creditLimit: 4000000, tipeAnggota: "ORGANIK", status: "Aktif" },
  { nrp: "11150221", nama: "Fajar Nugroho", pangkat: "Mayor Kav", golongan: "Pamen", korps: "Kav", satminkal: "INFOLAHTADAM IV/DIPONEGORO", simpananWajib: 4200000, simpananSukarela: 9800000, creditLimit: 8000000, tipeAnggota: "ORGANIK", status: "Aktif" },
  { nrp: "31770091", nama: "Hendra Gunawan", pangkat: "Sertu", golongan: "Ba/Ta", korps: "Inf", satminkal: "INFOLAHTADAM IV/DIPONEGORO", simpananWajib: 1500000, simpananSukarela: 1750000, creditLimit: 3500000, tipeAnggota: "ORGANIK", status: "Aktif" },
  { nrp: "11090154", nama: "Wahyu Prasetyo", pangkat: "Lettu Chb", golongan: "Pama", korps: "Chb", satminkal: "INFOLAHTADAM IV/DIPONEGORO", simpananWajib: 3000000, simpananSukarela: 6400000, creditLimit: 6000000, tipeAnggota: "ORGANIK", status: "Non-Aktif" },
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
  "ACC Keprim",
  "Upload Berkas",
  "Pencairan",
];

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
  { id: "USR-001", nama: "Mayor Cba Arif Setiawan", nrp: "11110234", role: "Admin Koperasi", satminkal: "INFOLAHTADAM IV/DIPONEGORO", status: "Aktif", lastLogin: "06 Agu 2026 06:10" },
  { id: "USR-002", nama: "Kolonel Inf Bagus Prayitno", nrp: "10980017", role: "Pimpinan / Dan / Ka", satminkal: "INFOLAHTADAM IV/DIPONEGORO", status: "Aktif", lastLogin: "05 Agu 2026 16:42" },
  { id: "USR-003", nama: "Letkol Cba Dedi Kurnia", nrp: "11020033", role: "Keprim", satminkal: "INFOLAHTADAM IV/DIPONEGORO", status: "Aktif", lastLogin: "05 Agu 2026 14:20" },
  { id: "USR-004", nama: "Serma Budi Santoso", nrp: "21980045", role: "Bendahara", satminkal: "INFOLAHTADAM IV/DIPONEGORO", status: "Aktif", lastLogin: "06 Agu 2026 05:55" },
  { id: "USR-005", nama: "Kapten Inf Rahmat Hidayat", nrp: "11060078", role: "Pengawas Koperasi", satminkal: "INFOLAHTADAM IV/DIPONEGORO", status: "Aktif", lastLogin: "04 Agu 2026 09:31" },
  { id: "USR-006", nama: "Penata Muda Sri Wahyuni", nrp: "198504112009", role: "Bendahara", satminkal: "INFOLAHTADAM IV/DIPONEGORO", status: "Nonaktif", lastLogin: "21 Jul 2026 11:04" },
  { id: "USR-007", nama: "Pelda Agus Wibowo", nrp: "21930112", role: "Juru Bayar", satminkal: "INFOLAHTADAM IV/DIPONEGORO", status: "Aktif", lastLogin: "05 Agu 2026 08:12" },
  { id: "USR-008", nama: "Sertu Hendra Gunawan", nrp: "31770091", role: "Anggota", satminkal: "INFOLAHTADAM IV/DIPONEGORO", status: "Aktif", lastLogin: "06 Agu 2026 07:05" },
  { id: "USR-009", nama: "Serda Yoga Pratama", nrp: "31800142", role: "Kasir Toko", satminkal: "INFOLAHTADAM IV/DIPONEGORO", status: "Aktif", lastLogin: "06 Agu 2026 08:00" },
];

export const antreanJuyar = [
  {
    id: "PJM-2026-0187",
    nama: "Sertu Hendra Gunawan",
    pangkat: "Sertu Inf",
    nrp: "31770091",
    satminkal: "INFOLAHTADAM IV/DIPONEGORO",
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
    satminkal: "INFOLAHTADAM IV/DIPONEGORO",
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
    satminkal: "INFOLAHTADAM IV/DIPONEGORO",
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

export const anggotaGajiProfile = {
  nama: "Hendra Gunawan",
  nrp: "31770091",
  pangkat: "Sertu",
  korps: "",
  kategori: "BINTARA",
  satminkal: "INFOLAHTADAM IV/DIPONEGORO",
  gajiPokok: 5400000,
  tunkin: 2100000,
  tunjanganLain: 350000,
  potongan: [
    { nama: "Simpanan Wajib", jumlah: 150000 },
    { nama: "Simpanan Sukarela", jumlah: 150000 },
    { nama: "Angsuran Pinjaman PJM-2026-0175", jumlah: 625000 },
    { nama: "Cicilan Belanja Toko (Kredit POS)", jumlah: 185000 },
    { nama: "Iuran Koperasi", jumlah: 25000 },
    { nama: "Asuransi", jumlah: 500000 },
  ],
};

export const anggotaAngsuranSaya = [
  {
    id: "PJM-2026-0175",
    jenis: "USIPA (Uang)",
    pokok: 7500000,
    angsuranKe: 5,
    totalAngsuran: 18,
    angsuranBulanan: 625000,
    sisa: 8125000,
    status: "Lancar" as const,
  },
  {
    id: "KRD-2026-0042",
    jenis: "Kredit Toko (Barang)",
    pokok: 555000,
    angsuranKe: 1,
    totalAngsuran: 3,
    angsuranBulanan: 185000,
    sisa: 370000,
    status: "Lancar" as const,
  },
];

/* =========================================================================
   MASTER DATA UNIT TOKO, POS, SUPPLIER, GADAI, PESANAN & LOYALTY (NEW)
   ========================================================================= */

export type KategoriProduk = {
  id: string;
  nama: string;
  icon: string;
};

export const kategoriProdukList: KategoriProduk[] = [
  { id: "KAT-01", nama: "Sembako & Kebutuhan Pokok", icon: "Package" },
  { id: "KAT-02", nama: "Makanan & Minuman (Fast Consume)", icon: "UtensilsCrossed" },
  { id: "KAT-03", nama: "Kaporlap & Atribut TNI AD", icon: "Shield" },
  { id: "KAT-04", nama: "Elektronik & Gadget", icon: "Tv" },
  { id: "KAT-05", nama: "Produk UMKM Anggota", icon: "Store" },
];

export type Produk = {
  id: string;
  barcode: string;
  nama: string;
  kategoriId: string;
  kategoriNama: string;
  satuanKecil: string;
  satuanBesar?: string | undefined;
  pcsPerUnit: number;
  hargaBeli: number;
  hargaJual: number;
  stokFisik: number;
  stokMinimum: number;
  diskonPersen: number;
  isPromo: boolean;
  isFastConsume: boolean;
  sumber: "Koperasi" | "UMKM Anggota";
  penjualNama?: string | undefined;
  gambar: string;
};

export const masterProdukList: Produk[] = [
  {
    id: "PRD-001",
    barcode: "8992753123456",
    nama: "Beras Premium Koperasi 5 Kg",
    kategoriId: "KAT-01",
    kategoriNama: "Sembako & Kebutuhan Pokok",
    satuanKecil: "Sak",
    satuanBesar: "Karung",
    pcsPerUnit: 10,
    hargaBeli: 68000,
    hargaJual: 74000,
    stokFisik: 45,
    stokMinimum: 10,
    diskonPersen: 0,
    isPromo: false,
    isFastConsume: false,
    sumber: "Koperasi",
    gambar: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "PRD-002",
    barcode: "8991001123456",
    nama: "Minyak Goreng Sawit 2 Liter",
    kategoriId: "KAT-01",
    kategoriNama: "Sembako & Kebutuhan Pokok",
    satuanKecil: "Pcs",
    satuanBesar: "Dus",
    pcsPerUnit: 6,
    hargaBeli: 31500,
    hargaJual: 35000,
    stokFisik: 84,
    stokMinimum: 12,
    diskonPersen: 5,
    isPromo: true,
    isFastConsume: false,
    sumber: "Koperasi",
    gambar: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "PRD-003",
    barcode: "8993175123456",
    nama: "Kopi Hitam Prajurit Sachet (Pak)",
    kategoriId: "KAT-02",
    kategoriNama: "Makanan & Minuman (Fast Consume)",
    satuanKecil: "Renceng",
    satuanBesar: "Dus",
    pcsPerUnit: 20,
    hargaBeli: 12000,
    hargaJual: 15000,
    stokFisik: 120,
    stokMinimum: 20,
    diskonPersen: 0,
    isPromo: false,
    isFastConsume: true,
    sumber: "Koperasi",
    gambar: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "PRD-004",
    barcode: "8999999123456",
    nama: "Mie Instan Goreng Rasa Spesial (Dus)",
    kategoriId: "KAT-02",
    kategoriNama: "Makanan & Minuman (Fast Consume)",
    satuanKecil: "Bks",
    satuanBesar: "Dus",
    pcsPerUnit: 40,
    hargaBeli: 108000,
    hargaJual: 120000,
    stokFisik: 38,
    stokMinimum: 10,
    diskonPersen: 0,
    isPromo: false,
    isFastConsume: true,
    sumber: "Koperasi",
    gambar: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "PRD-005",
    barcode: "TNI-KPL-00123",
    nama: "Kaos Dalam Loreng Malvinas TNI AD",
    kategoriId: "KAT-03",
    kategoriNama: "Kaporlap & Atribut TNI AD",
    satuanKecil: "Pcs",
    satuanBesar: "Lusin",
    pcsPerUnit: 12,
    hargaBeli: 38000,
    hargaJual: 48000,
    stokFisik: 60,
    stokMinimum: 15,
    diskonPersen: 10,
    isPromo: true,
    isFastConsume: false,
    sumber: "Koperasi",
    gambar: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "PRD-006",
    barcode: "TNI-KPL-00124",
    nama: "Sepatu PDL Kulit Kilap Jatah",
    kategoriId: "KAT-03",
    kategoriNama: "Kaporlap & Atribut TNI AD",
    satuanKecil: "Pasang",
    satuanBesar: "Karton",
    pcsPerUnit: 10,
    hargaBeli: 285000,
    hargaJual: 350000,
    stokFisik: 8,
    stokMinimum: 5,
    diskonPersen: 0,
    isPromo: false,
    isFastConsume: false,
    sumber: "Koperasi",
    gambar: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "PRD-007",
    barcode: "MKP-000001",
    nama: "[UMKM] Keripik Tempe Renyah Buatan Persit",
    kategoriId: "KAT-05",
    kategoriNama: "Produk UMKM Anggota",
    satuanKecil: "Bks",
    satuanBesar: "Paket",
    pcsPerUnit: 5,
    hargaBeli: 12000,
    hargaJual: 15000,
    stokFisik: 25,
    stokMinimum: 5,
    diskonPersen: 0,
    isPromo: false,
    isFastConsume: true,
    sumber: "UMKM Anggota",
    penjualNama: "Ny. Sri Wahyuni",
    gambar: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "PRD-008",
    barcode: "MKP-000002",
    nama: "[UMKM] Sambal Bawang Teri Barak",
    kategoriId: "KAT-05",
    kategoriNama: "Produk UMKM Anggota",
    satuanKecil: "Btl",
    satuanBesar: "Lusin",
    pcsPerUnit: 12,
    hargaBeli: 20000,
    hargaJual: 25000,
    stokFisik: 18,
    stokMinimum: 5,
    diskonPersen: 0,
    isPromo: false,
    isFastConsume: true,
    sumber: "UMKM Anggota",
    penjualNama: "Serma Budi Santoso",
    gambar: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&auto=format&fit=crop&q=80",
  },
];

export function formatBoxPcs(
  totalPcs: number,
  pcsPerUnit = 1,
  satuanBesar?: string | null,
  satuanKecil = "Pcs",
): string {
  if (!satuanBesar || pcsPerUnit <= 1) {
    return `${totalPcs} ${satuanKecil}`;
  }
  const box = Math.floor(totalPcs / pcsPerUnit);
  const sisaPcs = totalPcs % pcsPerUnit;
  if (box === 0) return `${sisaPcs} ${satuanKecil}`;
  if (sisaPcs === 0) return `${box} ${satuanBesar}`;
  return `${box} ${satuanBesar}, ${sisaPcs} ${satuanKecil}`;
}

export function hitungCicilanBarang(nominal: number, tenorBulan: number) {
  const angsuranPokok = Math.ceil(nominal / tenorBulan);
  return {
    nominal,
    tenorBulan,
    angsuranBulanan: angsuranPokok,
    totalBayar: angsuranPokok * tenorBulan,
  };
}

export type Supplier = {
  id: string;
  kode: string;
  nama: string;
  kontak: string;
  telepon: string;
  alamat: string;
  totalHutang: number;
};

export const masterSupplierList: Supplier[] = [
  { id: "SUP-001", kode: "SUP-001", nama: "PT Indofood Sukses Makmur", kontak: "Bpk. Bambang", telepon: "081234567890", alamat: "Kawasan Industri Candi Semarang", totalHutang: 8450000 },
  { id: "SUP-002", kode: "SUP-002", nama: "CV Kaporlap Jaya Abadi", kontak: "Ibu Ratna", telepon: "081987654321", alamat: "Jl. Pemuda No. 88 Bandung", totalHutang: 12600000 },
  { id: "SUP-003", kode: "SUP-003", nama: "Perum BULOG Kanwil Jateng", kontak: "Bpk. Irwan", telepon: "082145678912", alamat: "Jl. Menteri Supeno No. 1 Semarang", totalHutang: 0 },
];

export type PesananOnline = {
  id: string;
  nomorPesanan: string;
  anggotaNama: string;
  anggotaNrp: string;
  tipe: "AMBIL_SENDIRI" | "TITIP_PIKET_SATUAN" | "DELIVERY_CEPAT";
  lokasi: string;
  petugasPiket?: string;
  noHp: string;
  totalBelanja: number;
  ongkir: number;
  totalTagihan: number;
  status: "MENUNGGU_KONFIRMASI" | "DIPROSES_PETUGAS" | "SEDANG_DIANTAR" | "TITIP_DI_PIKET" | "SELESAI";
  estimasiMenit: number;
  menitBerjalan: number;
  isTerlambatSla: boolean;
  kompensasiDiskon: number;
  items: Array<{ nama: string; jumlah: number; harga: number }>;
  waktuPesan: string;
};

export const pesananOnlineList: PesananOnline[] = [
  {
    id: "ORD-001",
    nomorPesanan: "ORD-20260806-0001",
    anggotaNama: "Sertu Hendra Gunawan",
    anggotaNrp: "31770091",
    tipe: "DELIVERY_CEPAT",
    lokasi: "Barak Remaja Batalyon B - Lt. 2",
    noHp: "081398765432",
    totalBelanja: 65000,
    ongkir: 5000,
    totalTagihan: 70000,
    status: "SEDANG_DIANTAR",
    estimasiMenit: 30,
    menitBerjalan: 18,
    isTerlambatSla: false,
    kompensasiDiskon: 0,
    items: [
      { nama: "Kopi Hitam Prajurit Sachet", jumlah: 2, harga: 15000 },
      { nama: "Mie Instan Goreng Rasa Spesial", jumlah: 5, harga: 3000 },
      { nama: "[UMKM] Keripik Tempe Renyah", jumlah: 1, harga: 15000 },
    ],
    waktuPesan: "06 Agu 2026 14:15",
  },
  {
    id: "ORD-002",
    nomorPesanan: "ORD-20260806-0002",
    anggotaNama: "Kapten Inf Rahmat Hidayat",
    anggotaNrp: "11060078",
    tipe: "TITIP_PIKET_SATUAN",
    lokasi: "Meja Piket Penjagaan Utama",
    petugasPiket: "Serda Yoga Pratama (Piket Jaga)",
    noHp: "081245678901",
    totalBelanja: 158000,
    ongkir: 0,
    totalTagihan: 158000,
    status: "TITIP_DI_PIKET",
    estimasiMenit: 45,
    menitBerjalan: 35,
    isTerlambatSla: false,
    kompensasiDiskon: 0,
    items: [
      { nama: "Beras Premium Koperasi 5 Kg", jumlah: 1, harga: 74000 },
      { nama: "Minyak Goreng Sawit 2 Liter", jumlah: 2, harga: 35000 },
      { nama: "[UMKM] Sambal Bawang Teri", jumlah: 1, harga: 25000 },
    ],
    waktuPesan: "06 Agu 2026 13:30",
  },
  {
    id: "ORD-003",
    nomorPesanan: "ORD-20260806-0003",
    anggotaNama: "Pelda Agus Wibowo",
    anggotaNrp: "21930112",
    tipe: "DELIVERY_CEPAT",
    lokasi: "Rumah Dinas Blok C No. 14",
    noHp: "085234567890",
    totalBelanja: 85000,
    ongkir: 5000,
    totalTagihan: 77250, // kena kompensasi diskon 15% karena telat
    status: "SELESAI",
    estimasiMenit: 30,
    menitBerjalan: 42,
    isTerlambatSla: true,
    kompensasiDiskon: 12750,
    items: [
      { nama: "Minyak Goreng Sawit 2 Liter", jumlah: 2, harga: 35000 },
      { nama: "Kopi Hitam Prajurit Sachet", jumlah: 1, harga: 15000 },
    ],
    waktuPesan: "06 Agu 2026 11:20",
  },
];

export type PengajuanMarketplace = {
  id: string;
  anggotaNama: string;
  anggotaNrp: string;
  namaProduk: string;
  kategori: string;
  hargaUsul: number;
  stokAwal: number;
  komisiPersen: number;
  status: "DIAJUKAN" | "DISETUJUI" | "DITOLAK";
  catatan?: string;
  gambar: string;
  tanggal: string;
};

export const pengajuanMarketplaceList: PengajuanMarketplace[] = [
  {
    id: "MKP-REQ-001",
    anggotaNama: "Ny. Sri Wahyuni (Persit)",
    anggotaNrp: "198504112009",
    namaProduk: "Keripik Tempe Renyah Gurih",
    kategori: "Makanan Ringan",
    hargaUsul: 15000,
    stokAwal: 30,
    komisiPersen: 5,
    status: "DISETUJUI",
    catatan: "Kualitas kemasan bagus, higienis, layak jual di etalase koperasi",
    gambar: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&auto=format&fit=crop&q=80",
    tanggal: "02 Agu 2026",
  },
  {
    id: "MKP-REQ-002",
    anggotaNama: "Serma Budi Santoso",
    anggotaNrp: "21980045",
    namaProduk: "Madu Hutan Asli Murni 500ml",
    kategori: "Kesehatan & Herbal",
    hargaUsul: 85000,
    stokAwal: 15,
    komisiPersen: 7.5,
    status: "DIAJUKAN",
    catatan: "Menunggu pengecekan segel kemasan oleh bendahara toko",
    gambar: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&auto=format&fit=crop&q=80",
    tanggal: "05 Agu 2026",
  },
  {
    id: "MKP-REQ-003",
    anggotaNama: "Sertu Hendra Gunawan",
    anggotaNrp: "31770091",
    namaProduk: "Gantungan Kunci Paracord Handmade",
    kategori: "Aksesoris & Kerajinan",
    hargaUsul: 20000,
    stokAwal: 20,
    komisiPersen: 5,
    status: "DISETUJUI",
    catatan: "Produk kerajinan prajurit sangat rapi dan diminati",
    gambar: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&auto=format&fit=crop&q=80",
    tanggal: "04 Agu 2026",
  },
];

export type GadaiItem = {
  id: string;
  nomorSbg: string;
  anggotaNama: string;
  anggotaNrp: string;
  kategori: "EMAS_PERHIASAN" | "ELEKTRONIK_GADGET" | "KENDARAAN_BERMOTOR";
  namaBarang: string;
  spesifikasi: string;
  nilaiTaksiran: number;
  uangPinjaman: number;
  jasaTitipBulan: number;
  tanggalGadai: string;
  jatuhTempo: string;
  status: "AKTIF_BERJALAN" | "DITEBUS_LUNAS" | "JATUH_TEMPO_LELANG" | "BARANG_TERJUAL_LELANG";
  hargaLelangBuka?: number;
  hargaLelangTerjual?: number;
  foto: string;
};

export const gadaiList: GadaiItem[] = [
  {
    id: "GD-001",
    nomorSbg: "SBG-20260715-0012",
    anggotaNama: "Serma Budi Santoso",
    anggotaNrp: "21980045",
    kategori: "EMAS_PERHIASAN",
    namaBarang: "Kalung Emas Kuning 22 Karat",
    spesifikasi: "Berat 10.5 gram, kadar 87.5%, kondisi mulus + surat toko",
    nilaiTaksiran: 12500000,
    uangPinjaman: 10000000,
    jasaTitipBulan: 150000,
    tanggalGadai: "15 Jul 2026",
    jatuhTempo: "15 Nov 2026",
    status: "AKTIF_BERJALAN",
    foto: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "GD-002",
    nomorSbg: "SBG-20260410-0004",
    anggotaNama: "PNS Sri Wahyuni",
    anggotaNrp: "198504112009",
    kategori: "ELEKTRONIK_GADGET",
    namaBarang: "Laptop Asus Vivobook 14 Core i5",
    spesifikasi: "RAM 8GB, SSD 512GB, Charger Ori, Box Lengkap",
    nilaiTaksiran: 6500000,
    uangPinjaman: 4500000,
    jasaTitipBulan: 67500,
    tanggalGadai: "10 Apr 2026",
    jatuhTempo: "10 Agu 2026",
    status: "JATUH_TEMPO_LELANG",
    hargaLelangBuka: 4800000,
    foto: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "GD-003",
    nomorSbg: "SBG-20260305-0002",
    anggotaNama: "Pelda Agus Wibowo",
    anggotaNrp: "21930112",
    kategori: "EMAS_PERHIASAN",
    namaBarang: "Cincin Emas Putih Berlian 18 Karat",
    spesifikasi: "Berat 4.2 gram, sertifikat keaslian lengkap",
    nilaiTaksiran: 5800000,
    uangPinjaman: 4500000,
    jasaTitipBulan: 67500,
    tanggalGadai: "05 Mar 2026",
    jatuhTempo: "05 Jul 2026",
    status: "BARANG_TERJUAL_LELANG",
    hargaLelangBuka: 4900000,
    hargaLelangTerjual: 5100000,
    foto: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&auto=format&fit=crop&q=80",
  },
];

export type PoinDanUndian = {
  totalPoin: number;
  totalPoinKlaim: number;
  kuponSaya: string[];
  targetBelanjaNominal: number;
  belanjaBulanIni: number;
  bonusPoinTarget: number;
  eventAktif: {
    id: string;
    nama: string;
    hadiahUtama: string;
    poinPerKupon: number;
    tanggalUndi: string;
    totalKuponTerdaftar: number;
  };
};

export const poinUndianDemo: PoinDanUndian = {
  totalPoin: 185,
  totalPoinKlaim: 100,
  kuponSaya: ["KP-000142", "KP-000143"],
  targetBelanjaNominal: 500000,
  belanjaBulanIni: 385000,
  bonusPoinTarget: 100,
  eventAktif: {
    id: "EVT-2026-01",
    nama: "Undian Doorprize RAT Koperasi Tahun Buku 2026",
    hadiahUtama: "Sepeda Motor Honda Beat CBS & Logam Mulia 5 Gram",
    poinPerKupon: 50,
    tanggalUndi: "20 Des 2026",
    totalKuponTerdaftar: 428,
  },
};

