import { formatRp } from "@/lib/casheva-data";

export type Kotama = {
  kotama: string;
  satminkal: string[];
};

export type PangkatGrade = "Pamen" | "Pama" | "Ba/Ta" | "PNS";

export type PangkatRow = {
  grade: PangkatGrade;
  pangkat: string[];
  potonganSukarela: number;
};

export type KorpsRow = {
  code: string;
  nama: string;
  gradeAllowed: PangkatGrade[];
};

export type DokumenKelompok = {
  key: string;
  label: string;
  wajib: boolean;
};

export type PengurusRow = {
  id: string;
  nama: string;
  pangkat: string;
  nrp: string;
  jabatan: string;
  periode: string;
};

export const kotamaMaster: Kotama[] = [
  { kotama: "KODAM IV/DIPONEGORO", satminkal: ["INFOLAHTADAM IV/DIPONEGORO"] },
];

export const satminkalMaster = kotamaMaster.flatMap((k) =>
  k.satminkal.map((satminkal) => ({ kotama: k.kotama, satminkal })),
);

export const pangkatMaster: PangkatRow[] = [
  { grade: "Pamen", pangkat: ["Kolonel", "Letkol", "Mayor"], potonganSukarela: 300_000 },
  { grade: "Pama", pangkat: ["Kapten", "Lettu", "Letda"], potonganSukarela: 250_000 },
  { grade: "Ba/Ta", pangkat: ["Pelda", "Peltu", "Serma", "Serka", "Sertu", "Serda", "Kopka", "Koptu", "Kopda", "Praka", "Pratu", "Prada"], potonganSukarela: 150_000 },
  { grade: "PNS", pangkat: ["Pembina", "Penata", "Pengatur"], potonganSukarela: 150_000 },
];

export const korpsMaster: KorpsRow[] = [
  { code: "INF", nama: "Infanteri", gradeAllowed: ["Pamen", "Pama", "Ba/Ta"] },
  { code: "KAV", nama: "Kavaleri", gradeAllowed: ["Pamen", "Pama", "Ba/Ta"] },
  { code: "CBA", nama: "Perbekalan/Peralatan", gradeAllowed: ["Pamen", "Pama", "Ba/Ta"] },
  { code: "CZI", nama: "Zeni", gradeAllowed: ["Pamen", "Pama", "Ba/Ta"] },
  { code: "CHB", nama: "Perhubungan", gradeAllowed: ["Pamen", "Pama", "Ba/Ta"] },
  { code: "PNS", nama: "Pegawai Negeri Sipil TNI AD", gradeAllowed: ["PNS"] },
];

export const dokumenKelompokMaster: DokumenKelompok[] = [
  { key: "ktp", label: "KTP Anggota", wajib: true },
  { key: "kta", label: "KTA / Karpeg", wajib: true },
  { key: "slip-gaji", label: "Slip Gaji Terakhir", wajib: true },
  { key: "rekomendasi", label: "Rekomendasi Dan/Ka", wajib: true },
  { key: "akad", label: "Draft Akad Kredit", wajib: true },
  { key: "rekening", label: "Fotokopi Buku Rekening", wajib: true },
  { key: "kwitansi", label: "Kwitansi Pencairan", wajib: true },
];

export const pengurusMaster: PengurusRow[] = [
  { id: "PGS-01", nama: "Letkol Cba Dedi Kurnia", pangkat: "Letkol Cba", nrp: "11020033", jabatan: "Ketua Primkop", periode: "2025-2028" },
  { id: "PGS-02", nama: "Serma Budi Santoso", pangkat: "Serma", nrp: "21980045", jabatan: "Bendahara", periode: "2025-2028" },
  { id: "PGS-03", nama: "Kapten Inf Rahmat Hidayat", pangkat: "Kapten Inf", nrp: "11060078", jabatan: "Pengawas", periode: "2025-2028" },
];

export const pinjamanMaster = [
  { id: "P-10-12", plafon: 10_000_000, tenor: 12, angsuranPokok: 833_333, bunga: 100_000, label: `${formatRp(10_000_000)} • 12 bulan` },
  { id: "P-25-24", plafon: 25_000_000, tenor: 24, angsuranPokok: 1_041_667, bunga: 250_000, label: `${formatRp(25_000_000)} • 24 bulan` },
  { id: "P-50-36", plafon: 50_000_000, tenor: 36, angsuranPokok: 1_388_889, bunga: 500_000, label: `${formatRp(50_000_000)} • 36 bulan` },
];
