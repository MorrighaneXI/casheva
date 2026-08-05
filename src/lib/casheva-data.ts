export type Role = "Juru Bayar" | "Dan/Ka" | "Kaprim" | "Bendahara";

export const ROLES: Role[] = ["Juru Bayar", "Dan/Ka", "Kaprim", "Bendahara"];

export type RoleProfile = {
  nama: string;
  pangkat: string;
  nrp: string;
  jabatan: string;
  landing: string;
  username: string;
};

export const ROLE_PROFILES: Record<Role, RoleProfile> = {
  "Juru Bayar": {
    nama: "Serma Budi Santoso",
    pangkat: "Serma Chb",
    nrp: "21980045",
    jabatan: "Juru Bayar Satminkal",
    landing: "Jurbay Financial Screening Center",
    username: "jurbay.disinfolahtad",
  },
  "Dan/Ka": {
    nama: "Letkol Cba Dedi Kurnia",
    pangkat: "Letkol Cba",
    nrp: "11020033",
    jabatan: "Dan/Ka Satuan",
    landing: "Pimpinan Approval & Unit Monitoring",
    username: "danka.disinfolahtad",
  },
  Kaprim: {
    nama: "Kolonel Cba Arif Setiawan",
    pangkat: "Kolonel Cba",
    nrp: "11110234",
    jabatan: "Ketua Primer Koperasi",
    landing: "Executive Kaprim Dashboard",
    username: "kaprim.mabesad",
    },
  Bendahara: {
    nama: "Kapten Cba Rina Marlina",
    pangkat: "Kapten Cba",
    nrp: "11170455",
    jabatan: "Bendahara Koperasi",
    landing: "Bendahara Financial & Document Management",
    username: "bendahara.primkop",
  },
};

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
  "Verified Jurbay": "bg-blue-500/12 text-blue-600 border-blue-500/30",
  "Approved Dan": "bg-gold-soft text-accent-foreground border-gold/40",
  "ACC Kaprim": "bg-primary-soft text-primary border-primary/25",
  Disbursed: "bg-success/15 text-success border-success/30",
  Rejected: "bg-destructive/12 text-destructive border-destructive/30",
};

export const workflowSteps = [
  "Pengajuan",
  "Verifikasi Jurbay",
  "Rekomendasi Dan/Ka",
  "ACC Kaprim",
  "Upload Berkas",
  "Pencairan",
];

/** 1 = Pengajuan … 6 = Pencairan, 7 = selesai/dicairkan */
export type LoanStage = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const stageStatus = (stage: LoanStage, rejected: boolean): LoanStatus => {
  if (rejected) return "Rejected";
  if (stage >= 7) return "Disbursed";
  if (stage >= 5) return "ACC Kaprim";
  if (stage >= 4) return "Approved Dan";
  if (stage >= 3) return "Verified Jurbay";
  return "Pending";
};

export const REQUIRED_DOCS = [
  "Surat Permohonan",
  "Rekomendasi Jurbay",
  "Rekomendasi Dan/Ka",
  "Akad Kredit",
  "Fotokopi KTA / KTP",
  "Slip Gaji 3 Bulan",
];

export type LoanApp = {
  id: string;
  nrp: string;
  nama: string;
  pangkat: string;
  satminkal: string;
  tujuan: string;
  jumlah: number;
  tenor: number;
  tanggal: string;
  gajiPokok: number;
  ulp: number;
  tunkin: number;
  potonganLain: number;
  pinjamanBerjalan: number;
  stage: LoanStage;
  rejected: boolean;
  catatanJurbay?: string;
  catatanPimpinan?: string;
  catatanKaprim?: string;
  docs: string[];
  invoice?: string;
};

export const loanApplications: LoanApp[] = [
  {
    id: "PJM-2026-0184",
    nrp: "21980045",
    nama: "Budi Santoso",
    pangkat: "Serma",
    satminkal: "Disinfolahtad",
    tujuan: "Renovasi rumah dinas",
    jumlah: 15_000_000,
    tenor: 24,
    tanggal: "02 Agu 2026",
    gajiPokok: 4_650_000,
    ulp: 1_250_000,
    tunkin: 3_400_000,
    potonganLain: 850_000,
    pinjamanBerjalan: 0,
    stage: 4,
    rejected: false,
    catatanJurbay: "Rasio angsuran 21% dari THP, memenuhi syarat.",
    docs: ["Surat Permohonan", "Rekomendasi Jurbay"],
  },
  {
    id: "PJM-2026-0183",
    nrp: "11060078",
    nama: "Rahmat Hidayat",
    pangkat: "Kapten Inf",
    satminkal: "Ditkuad",
    tujuan: "Biaya pendidikan anak",
    jumlah: 20_000_000,
    tenor: 36,
    tanggal: "02 Agu 2026",
    gajiPokok: 5_400_000,
    ulp: 1_500_000,
    tunkin: 4_100_000,
    potonganLain: 1_100_000,
    pinjamanBerjalan: 2_400_000,
    stage: 5,
    rejected: false,
    catatanJurbay: "Sisa pinjaman lama tersisa 3 bulan, masih aman.",
    catatanPimpinan: "Direkomendasikan, yang bersangkutan berkinerja baik.",
    docs: ["Surat Permohonan", "Rekomendasi Jurbay", "Rekomendasi Dan/Ka"],
  },
  {
    id: "PJM-2026-0182",
    nrp: "21930112",
    nama: "Agus Wibowo",
    pangkat: "Pelda",
    satminkal: "Mabesad",
    tujuan: "Modal usaha keluarga",
    jumlah: 8_000_000,
    tenor: 18,
    tanggal: "01 Agu 2026",
    gajiPokok: 4_200_000,
    ulp: 1_150_000,
    tunkin: 2_950_000,
    potonganLain: 640_000,
    pinjamanBerjalan: 0,
    stage: 2,
    rejected: false,
    docs: ["Surat Permohonan"],
  },
  {
    id: "PJM-2026-0181",
    nrp: "198504112009",
    nama: "Sri Wahyuni",
    pangkat: "Penata Muda",
    satminkal: "Disinfolahtad",
    tujuan: "Biaya kesehatan keluarga",
    jumlah: 5_000_000,
    tenor: 12,
    tanggal: "01 Agu 2026",
    gajiPokok: 3_100_000,
    ulp: 780_000,
    tunkin: 2_200_000,
    potonganLain: 420_000,
    pinjamanBerjalan: 0,
    stage: 2,
    rejected: false,
    docs: ["Surat Permohonan"],
  },
  {
    id: "PJM-2026-0180",
    nrp: "11020033",
    nama: "Dedi Kurnia",
    pangkat: "Letkol Cba",
    satminkal: "Ditziad",
    tujuan: "Pembelian kendaraan",
    jumlah: 18_000_000,
    tenor: 30,
    tanggal: "31 Jul 2026",
    gajiPokok: 6_100_000,
    ulp: 1_800_000,
    tunkin: 5_200_000,
    potonganLain: 1_350_000,
    pinjamanBerjalan: 0,
    stage: 7,
    rejected: false,
    catatanJurbay: "Kemampuan bayar sangat baik.",
    catatanPimpinan: "Disetujui dan direkomendasikan.",
    catatanKaprim: "Final ACC, cairkan sesuai jadwal.",
    docs: REQUIRED_DOCS,
    invoice: "#INV2506170001",
  },
  {
    id: "PJM-2026-0179",
    nrp: "11150221",
    nama: "Fajar Nugroho",
    pangkat: "Mayor Kav",
    satminkal: "Ditkuad",
    tujuan: "Renovasi rumah pribadi",
    jumlah: 12_500_000,
    tenor: 24,
    tanggal: "30 Jul 2026",
    gajiPokok: 5_800_000,
    ulp: 1_600_000,
    tunkin: 4_500_000,
    potonganLain: 900_000,
    pinjamanBerjalan: 1_200_000,
    stage: 6,
    rejected: false,
    catatanJurbay: "Layak, rasio 19%.",
    catatanPimpinan: "Rekomendasi disetujui.",
    catatanKaprim: "Final ACC.",
    docs: ["Surat Permohonan", "Rekomendasi Jurbay", "Rekomendasi Dan/Ka", "Akad Kredit"],
  },
  {
    id: "PJM-2026-0178",
    nrp: "31770091",
    nama: "Hendra Gunawan",
    pangkat: "Sertu",
    satminkal: "Mabesad",
    tujuan: "Biaya pernikahan",
    jumlah: 10_000_000,
    tenor: 24,
    tanggal: "29 Jul 2026",
    gajiPokok: 3_800_000,
    ulp: 950_000,
    tunkin: 2_400_000,
    potonganLain: 1_650_000,
    pinjamanBerjalan: 4_800_000,
    stage: 2,
    rejected: false,
    docs: ["Surat Permohonan"],
  },
  {
    id: "PJM-2026-0177",
    nrp: "11090154",
    nama: "Wahyu Prasetyo",
    pangkat: "Lettu Chb",
    satminkal: "Disinfolahtad",
    tujuan: "Modal usaha",
    jumlah: 9_000_000,
    tenor: 18,
    tanggal: "28 Jul 2026",
    gajiPokok: 4_900_000,
    ulp: 1_300_000,
    tunkin: 3_100_000,
    potonganLain: 700_000,
    pinjamanBerjalan: 0,
    stage: 3,
    rejected: false,
    catatanJurbay: "Eligible, dokumen lengkap.",
    docs: ["Surat Permohonan", "Rekomendasi Jurbay"],
  },
  {
    id: "PJM-2026-0176",
    nrp: "21870019",
    nama: "Slamet Riyadi",
    pangkat: "Peltu",
    satminkal: "Ditziad",
    tujuan: "Biaya sekolah anak",
    jumlah: 6_500_000,
    tenor: 12,
    tanggal: "27 Jul 2026",
    gajiPokok: 4_400_000,
    ulp: 1_200_000,
    tunkin: 2_800_000,
    potonganLain: 520_000,
    pinjamanBerjalan: 0,
    stage: 3,
    rejected: false,
    catatanJurbay: "Rasio angsuran 8%, sangat aman.",
    docs: ["Surat Permohonan", "Rekomendasi Jurbay"],
  },
  {
    id: "PJM-2026-0175",
    nrp: "11230317",
    nama: "Yoga Pratama",
    pangkat: "Letda Czi",
    satminkal: "Ditkuad",
    tujuan: "Pembelian perlengkapan rumah",
    jumlah: 4_000_000,
    tenor: 10,
    tanggal: "26 Jul 2026",
    gajiPokok: 4_100_000,
    ulp: 1_050_000,
    tunkin: 2_600_000,
    potonganLain: 380_000,
    pinjamanBerjalan: 0,
    stage: 6,
    rejected: false,
    catatanJurbay: "Eligible.",
    catatanPimpinan: "Direkomendasikan.",
    catatanKaprim: "Final ACC.",
    docs: REQUIRED_DOCS.slice(0, 5),
  },
];

export const recentLoans = loanApplications.slice(0, 5).map((l) => ({
  id: l.id,
  nama: `${l.pangkat} ${l.nama}`,
  nrp: l.nrp,
  satminkal: l.satminkal,
  jumlah: l.jumlah,
  tenor: l.tenor,
  status: stageStatus(l.stage, l.rejected),
  tanggal: l.tanggal,
}));

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

/** Rekap transaksi bulanan Jan 2024 – Jun 2026 (juta rupiah) untuk uji SHU */
export const shuTimeline = (() => {
  const bulanNama = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];
  const rows: {
    periode: string;
    tahun: number;
    simpanan: number;
    pinjaman: number;
    jasa: number;
  }[] = [];
  let i = 0;
  for (const tahun of [2024, 2025, 2026]) {
    const batas = tahun === 2026 ? 6 : 12;
    for (let m = 0; m < batas; m++) {
      const simpanan = 640 + i * 32 + (m % 3) * 12;
      const pinjaman = 430 + i * 24 + (m % 4) * 9;
      rows.push({
        periode: `${bulanNama[m]} ${tahun}`,
        tahun,
        simpanan,
        pinjaman,
        jasa: Math.round(pinjaman * 0.01 * 100) / 100,
      });
      i++;
    }
  }
  return rows;
})();

export const SHU_ALOKASI = [
  { pos: "Cadangan Koperasi", persen: 40 },
  { pos: "Jasa Modal (Simpanan)", persen: 20 },
  { pos: "Jasa Usaha (Transaksi)", persen: 30 },
  { pos: "Dana Pengurus & Pengawas", persen: 5 },
  { pos: "Dana Sosial (Dansos)", persen: 5 },
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
  pinjamanAktif: number;
  status: "Aktif" | "Cuti" | "Non-Aktif";
};

export const anggotaList: Anggota[] = [
  { nrp: "11020033", nama: "Dedi Kurnia", pangkat: "Letkol Cba", golongan: "Pamen", korps: "Cba", satminkal: "Ditziad", simpananWajib: 4800000, simpananSukarela: 12500000, pinjamanAktif: 18000000, status: "Aktif" },
  { nrp: "11060078", nama: "Rahmat Hidayat", pangkat: "Kapten Inf", golongan: "Pama", korps: "Inf", satminkal: "Ditkuad", simpananWajib: 3600000, simpananSukarela: 7250000, pinjamanAktif: 2400000, status: "Aktif" },
  { nrp: "21980045", nama: "Budi Santoso", pangkat: "Serma", golongan: "Ba/Ta", korps: "Chb", satminkal: "Disinfolahtad", simpananWajib: 2400000, simpananSukarela: 4100000, pinjamanAktif: 0, status: "Aktif" },
  { nrp: "21930112", nama: "Agus Wibowo", pangkat: "Pelda", golongan: "Ba/Ta", korps: "Czi", satminkal: "Mabesad", simpananWajib: 2700000, simpananSukarela: 5300000, pinjamanAktif: 0, status: "Cuti" },
  { nrp: "198504112009", nama: "Sri Wahyuni", pangkat: "Penata Muda", golongan: "PNS", korps: "PNS", satminkal: "Disinfolahtad", simpananWajib: 1800000, simpananSukarela: 2900000, pinjamanAktif: 0, status: "Aktif" },
  { nrp: "11150221", nama: "Fajar Nugroho", pangkat: "Mayor Kav", golongan: "Pamen", korps: "Kav", satminkal: "Ditkuad", simpananWajib: 4200000, simpananSukarela: 9800000, pinjamanAktif: 1200000, status: "Aktif" },
  { nrp: "31770091", nama: "Hendra Gunawan", pangkat: "Sertu", golongan: "Ba/Ta", korps: "Inf", satminkal: "Mabesad", simpananWajib: 1500000, simpananSukarela: 1750000, pinjamanAktif: 4800000, status: "Aktif" },
  { nrp: "11090154", nama: "Wahyu Prasetyo", pangkat: "Lettu Chb", golongan: "Pama", korps: "Chb", satminkal: "Disinfolahtad", simpananWajib: 3000000, simpananSukarela: 6400000, pinjamanAktif: 0, status: "Non-Aktif" },
  { nrp: "21870019", nama: "Slamet Riyadi", pangkat: "Peltu", golongan: "Ba/Ta", korps: "Czi", satminkal: "Ditziad", simpananWajib: 3100000, simpananSukarela: 5900000, pinjamanAktif: 0, status: "Aktif" },
  { nrp: "11230317", nama: "Yoga Pratama", pangkat: "Letda Czi", golongan: "Pama", korps: "Czi", satminkal: "Ditkuad", simpananWajib: 1200000, simpananSukarela: 2100000, pinjamanAktif: 4000000, status: "Aktif" },
  { nrp: "11110234", nama: "Arif Setiawan", pangkat: "Kolonel Cba", golongan: "Pamen", korps: "Cba", satminkal: "Mabesad", simpananWajib: 6200000, simpananSukarela: 18500000, pinjamanAktif: 0, status: "Aktif" },
  { nrp: "11170455", nama: "Rina Marlina", pangkat: "Kapten Cba", golongan: "Pama", korps: "Cba", satminkal: "Mabesad", simpananWajib: 3400000, simpananSukarela: 8100000, pinjamanAktif: 0, status: "Aktif" },
  { nrp: "21960088", nama: "Bambang Susilo", pangkat: "Serka", golongan: "Ba/Ta", korps: "Inf", satminkal: "Disinfolahtad", simpananWajib: 2200000, simpananSukarela: 3400000, pinjamanAktif: 3500000, status: "Aktif" },
  { nrp: "21910077", nama: "Iwan Setiadi", pangkat: "Pelda", golongan: "Ba/Ta", korps: "Cba", satminkal: "Ditkuad", simpananWajib: 2900000, simpananSukarela: 4700000, pinjamanAktif: 0, status: "Aktif" },
  { nrp: "11050062", nama: "Doni Saputra", pangkat: "Mayor Inf", golongan: "Pamen", korps: "Inf", satminkal: "Ditziad", simpananWajib: 4500000, simpananSukarela: 10200000, pinjamanAktif: 7500000, status: "Aktif" },
  { nrp: "31820045", nama: "Andi Firmansyah", pangkat: "Kopka", golongan: "Ba/Ta", korps: "Kav", satminkal: "Mabesad", simpananWajib: 1400000, simpananSukarela: 1900000, pinjamanAktif: 2000000, status: "Aktif" },
  { nrp: "199002152012", nama: "Nur Aisyah", pangkat: "Penata", golongan: "PNS", korps: "PNS", satminkal: "Ditkuad", simpananWajib: 2100000, simpananSukarela: 3600000, pinjamanAktif: 0, status: "Aktif" },
  { nrp: "198811032011", nama: "Tri Handoko", pangkat: "Penata Muda Tk. I", golongan: "PNS", korps: "PNS", satminkal: "Disinfolahtad", simpananWajib: 1900000, simpananSukarela: 2750000, pinjamanAktif: 1500000, status: "Cuti" },
  { nrp: "11190288", nama: "Galih Ramadhan", pangkat: "Lettu Inf", golongan: "Pama", korps: "Inf", satminkal: "Ditziad", simpananWajib: 2600000, simpananSukarela: 4300000, pinjamanAktif: 0, status: "Aktif" },
  { nrp: "21990133", nama: "Eko Purnomo", pangkat: "Serma", golongan: "Ba/Ta", korps: "Czi", satminkal: "Ditkuad", simpananWajib: 2500000, simpananSukarela: 4050000, pinjamanAktif: 6000000, status: "Aktif" },
  { nrp: "31750022", nama: "Marwan Hidayat", pangkat: "Praka", golongan: "Ba/Ta", korps: "Inf", satminkal: "Mabesad", simpananWajib: 1100000, simpananSukarela: 1450000, pinjamanAktif: 0, status: "Aktif" },
  { nrp: "11080101", nama: "Surya Dharma", pangkat: "Kapten Kav", golongan: "Pama", korps: "Kav", satminkal: "Disinfolahtad", simpananWajib: 3300000, simpananSukarela: 6900000, pinjamanAktif: 3200000, status: "Aktif" },
  { nrp: "21940205", nama: "Joko Prabowo", pangkat: "Peltu", golongan: "Ba/Ta", korps: "Cba", satminkal: "Ditziad", simpananWajib: 3050000, simpananSukarela: 5100000, pinjamanAktif: 0, status: "Non-Aktif" },
  { nrp: "199305202015", nama: "Dewi Kartika", pangkat: "Penata Muda", golongan: "PNS", korps: "PNS", satminkal: "Mabesad", simpananWajib: 1650000, simpananSukarela: 2350000, pinjamanAktif: 900000, status: "Aktif" },
];

export const shuRows = anggotaList.slice(0, 10).map((a) => ({
  nrp: a.nrp,
  nama: `${a.pangkat} ${a.nama}`,
  modal: a.simpananWajib + a.simpananSukarela,
  transaksi: Math.round((a.simpananWajib + a.simpananSukarela) * 1.35 + a.pinjamanAktif * 0.4),
}));

export function hitungAngsuran(jumlah: number, tenor: number) {
  const bungaBulanan = 0.01; // 12% per tahun
  const pokok = jumlah / tenor;
  const bunga = jumlah * bungaBulanan;
  const angsuran = pokok + bunga;
  const adminFee = Math.round(jumlah * 0.005);
  return {
    pokok,
    bunga,
    angsuran,
    totalBunga: bunga * tenor,
    totalBayar: angsuran * tenor,
    netPayout: jumlah - adminFee,
    adminFee,
  };
}
