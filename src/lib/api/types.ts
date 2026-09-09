// ==========================================
// TIPE ENTITAS DARI BACKEND CASHEVADB
// ==========================================

export type BackendRole =
  | 'ADMIN_KOPERASI'
  | 'PIMPINAN'
  | 'KEPRIM'
  | 'KAPRIM'
  | 'BENDAHARA'
  | 'PENGAWAS'
  | 'ANGGOTA'
  | 'JURU_BAYAR';

export type KategoriPangkat =
  | 'PATI'
  | 'PAMEN'
  | 'PAMA'
  | 'BINTARA'
  | 'BATA_ASN'
  | 'PNS';

export type StatusPinjaman =
  | 'DIAJUKAN'
  | 'VERIFIKASI_PRIMKOP'
  | 'VERIFIKASI_JURU_BAYAR'
  | 'REKOMENDASI_PIMPINAN'
  | 'SETUJU_KEPRIM'
  | 'SETUJU_KAPRIM'
  | 'MENUNGGU_DOKUMEN'
  | 'DICAIRKAN'
  | 'LUNAS'
  | 'DITOLAK';

export type JenisSimpanan = 'POKOK' | 'WAJIB' | 'SUKARELA' | 'KHUSUS';
export type JenisTransaksiSimpanan = 'SETOR' | 'TARIK';

export type JenisPendapatan =
  | 'BUNGA_PINJAMAN'
  | 'ADMINISTRASI_PINJAMAN'
  | 'PROVISI'
  | 'BUNGA_BANK'
  | 'BUNGA_DEPOSITO'
  | 'LAIN_LAIN';

export type JenisBiayaOperasional =
  | 'HONOR_PENGURUS'
  | 'OPERASIONAL_KANTOR'
  | 'RAPAT_DAN_RAT'
  | 'PENDIDIKAN_DAN_SOSIAL'
  | 'PEMELIHARAAN'
  | 'LAIN_LAIN';

export interface Kotama {
  id: string;
  kode: string;
  nama: string;
}

export interface Satminkal {
  id: string;
  kode: string;
  nama: string;
  kotamaId: string;
  kotama?: Kotama;
}

export interface Pangkat {
  id: string;
  kodePkt: number;
  kode?: string | number | undefined;
  nama: string;
  kategori: KategoriPangkat;
}

export interface Korps {
  id: string;
  kode: string;
  nama: string;
}

export interface Anggota {
  id: string;
  nrpNip: string;
  nama: string;
  pangkatId: string;
  pangkat?: Pangkat;
  korpsId: string;
  korps?: Korps;
  satminkalId: string;
  satminkal?: Satminkal;
  tmtAnggota: string;
  isAktif: boolean;
  createdAt: string;
  updatedAt: string;
  totalSimpanan?: number;
  simpananPokok?: number;
  simpananWajib?: number;
  simpananSukarela?: number;
  role?: BackendRole;
  user?: UserItem | null;
}

export interface UserItem {
  id: string;
  username: string;
  namaLengkap?: string | undefined;
  nama?: string | undefined;
  role: BackendRole;
  kotamaId?: string | undefined;
  kotama?: Kotama | undefined;
  satminkalId?: string | undefined;
  satminkal?: Satminkal | undefined;
  isActive: boolean;
  isAktif?: boolean | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
  lastActiveAt?: string | undefined;
}

export interface SimpananRecord {
  id: string;
  anggotaId: string;
  jenis: JenisSimpanan;
  tipe: JenisTransaksiSimpanan;
  nominal: number;
  tanggal: string;
  keterangan?: string;
}

export interface SimpananRekapItem {
  id?: string;
  anggotaId: string;
  nama: string;
  nrpNip: string;
  pangkat?: string;
  kategoriPangkat?: string;
  korps?: string;
  satminkal?: string;
  simpananPokok?: number;
  simpananWajib?: number;
  simpananSukarela?: number;
  totalPokok?: number;
  totalWajib?: number;
  totalSukarela?: number;
  totalKhusus?: number;
  totalSimpanan: number;
}

export interface Angsuran {
  id: string;
  pinjamanId: string;
  angsuranKe: number;
  tanggalJatuhTempo: string;
  angsuranPokok: number;
  angsuranBunga: number;
  total: number;
  sisaPokok: number;
  dibayar: boolean;
  tanggalBayar?: string;
  noInvoice?: string;
  keterangan?: string;
}

export interface DokumenPinjaman {
  id: string;
  pinjamanId: string;
  jenis: string;
  filePath: string;
  namaDokumen?: string;
  urlDokumen?: string;
  jenisDokumen?: string;
  uploadedAt: string;
}

export interface Pinjaman {
  id: string;
  anggotaId: string;
  anggota?: Anggota;
  nominal: number;
  tenorBulan: number;
  bungaPersenTahun: number;
  angsuranPokokBulanan: number;
  bungaBulanan: number;
  totalAngsuranBulanan: number;
  sisaPokok: number;
  status: StatusPinjaman;
  tanggalPengajuan: string;
  tanggalPencairan?: string;
  alasanPenolakan?: string;
  catatan?: string;
  catatanJurbay?: string;
  catatanDan?: string;
  catatanKaprim?: string;
  angsuran?: Angsuran[];
  dokumen?: DokumenPinjaman[];
}

export interface DashboardSummary {
  totalAnggota: number;
  totalSimpanan: number;
  totalPinjaman: number;
  totalPinjamanBerjalan: number;
  countPinjamanBerjalan: number;
  kasKoperasi: number;
  shuTahunBerjalan: number;
  tahun: number;
  // Anggota-specific personal KPI fields (hanya ada saat role = Anggota)
  totalSimpananPokok?: number;
  totalSimpananWajib?: number;
  totalSimpananSukarela?: number;
  angsuranBulanIni?: number;
  statusAngsuranBulanIni?: boolean;
  anggota?: {
    id: string;
    nama: string;
    nrpNip: string;
    pangkat?: string;
    korps?: string;
    satminkal?: string;
  };
}

export interface DashboardCharts {
  tahun: number;
  simpananBulanan: { bulan: number; namaBulan: string; total: number }[];
  pinjamanBulanan: { bulan: number; namaBulan: string; total: number }[];
  angsuranBulanan: { bulan: number; namaBulan: string; total: number }[];
}

export interface Kopstuk {
  id?: string;
  satminkalId?: string;
  namaSatuan: string;
  namaBalak: string;
  alamat: string;
  nomorTelepon: string;
  logoUrl?: string;
}

export interface TajukTtd {
  id: string;
  jabatan: string;
  namaPejabat: string;
  pangkat: string;
  nrp: string;
  isAktif: boolean;
  kategori: string;
}

export interface Pendapatan {
  id: string;
  satminkalId: string;
  jenis: JenisPendapatan;
  nominal: number;
  tanggal: string;
  keterangan?: string;
  tahun: number;
}

export interface BiayaOperasional {
  id: string;
  jenis: JenisBiayaOperasional;
  nominal: number;
  tanggal: string;
  keterangan?: string;
  tahun: number;
}

export interface RingkasanKeuangan {
  tahun: number;
  totalPendapatan: number;
  totalBiaya?: number | undefined;
  totalBeban?: number | undefined;
  shuBersih?: number | undefined;
  shuKotor?: number | undefined;
  cadanganKoperasi?: number | undefined;
  jasaModal?: number | undefined;
  jasaUsaha?: number | undefined;
  pengurusPengawas?: number | undefined;
  sosialPendidikan?: number | undefined;
  totalModalSimpanan?: number | undefined;
  totalVolPinjaman?: number | undefined;
}

export interface ShuAnggotaItem {
  no: number;
  nama: string;
  pktCrpNrp: string;
  jasaModal: number;
  jasaUsaha: number;
  totalShu: number;
}

export interface RingkasanShuPeriode {
  tahun: number;
  totalPendapatan: number;
  totalBeban: number;
  shuBersih: number;
  cadangan: number;
  jasaModal: number;
  jasaUsaha: number;
  pengurus: number;
  sosialPendidikan: number;
}

export interface ReportShuAnggotaResponse {
  title: string;
  kopstuk: Kopstuk | null;
  tajukTtd: TajukTtd | null;
  ringkasanShu?: RingkasanShuPeriode;
  data: ShuAnggotaItem[];
}
