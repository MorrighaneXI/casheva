import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Printer,
  FileSpreadsheet,
  PenLine,
  Shield,
  Loader2,
  FileText,
  Users,
  CreditCard,
  PieChart,
  Receipt,
  BookOpen,
  Calculator,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRp, formatNamaLengkapDinas, formatPangkatKorps, sortPersonelByPangkat } from "@/lib/casheva-data";
import {
  apiReports,
  apiKopstuk,
  apiTajukTtd,
  apiKeuangan,
} from "@/lib/api";

export const Route = createFileRoute("/laporan")({
  head: () => ({
    meta: [
      { title: "Laporan & Cetakan Resmi Lampiran — Casheva" },
      {
        name: "description",
        content:
          "Pusat cetak laporan resmi Lampiran I s.d IX sesuai Petunjuk Teknis Koperasi TNI AD 2026.",
      },
      { property: "og:title", content: "Laporan & Cetakan Resmi — Casheva" },
      {
        property: "og:description",
        content: "Cetak dokumen resmi koperasi TNI AD dengan kopstuk dan tajuk tanda tangan dinamis.",
      },
    ],
  }),
  component: LaporanPage,
});

function LaporanPage() {
  const queryClient = useQueryClient();
  const currentYear = 2026;
  const [activeTab, setActiveTab] = useState("shu");

  // Kopstuk state
  const [kop1, setKop1] = useState("KOMANDO DAERAH MILITER IV/DIPONEGORO");
  const [kop2, setKop2] = useState("PRIMER KOPERASI KARTIKA INFOLAHTADAM IV/DIPONEGORO");
  const [kop3, setKop3] = useState("Jl. Perintis Kemerdekaan, Watugong, Semarang");

  // Tajuk TTD state
  const [ttdOpen, setTtdOpen] = useState(false);
  const [jabatan, setJabatan] = useState("Ketua Primkop Kartika");
  const [pejabat, setPejabat] = useState("Letkol Cba Dedi Kurnia");
  const [nrp, setNrp] = useState("11020033");
  const [tempatTgl, setTempatTgl] = useState("Semarang, 4 Agustus 2026");

  // Queries
  const { data: kopstukData } = useQuery({
    queryKey: ["kopstuk-active"],
    queryFn: () => apiKopstuk.get(),
  });

  const { data: tajukData } = useQuery({
    queryKey: ["tajuk-ttd-active"],
    queryFn: () => apiTajukTtd.get(),
  });

  const { data: reportAnggota = [], isLoading: loadingAnggota } = useQuery({
    queryKey: ["reports-anggota"],
    queryFn: () => apiReports.getAnggota(),
    enabled: activeTab === "anggota",
  });

  const { data: reportSimpanan = [], isLoading: loadingSimpanan } = useQuery({
    queryKey: ["reports-simpanan"],
    queryFn: () => apiReports.getRekapSimpanan(),
    enabled: activeTab === "simpanan",
  });

  const { data: reportPinjaman = [], isLoading: loadingPinjaman } = useQuery({
    queryKey: ["reports-pinjaman"],
    queryFn: () => apiReports.getPinjamanAnggota(),
    enabled: activeTab === "pinjaman",
  });

  const {
    data: reportShu,
    isLoading: loadingShu,
    isError: errorShu,
    refetch: refetchShu,
  } = useQuery({
    queryKey: ["reports-shu-anggota", currentYear],
    queryFn: () => apiReports.getShuAnggota(currentYear),
    enabled: activeTab === "shu",
    retry: 1,
  });

  const { data: reportBrosur = [] } = useQuery({
    queryKey: ["reports-brosur"],
    queryFn: () => apiReports.getBrosurPinjaman(),
    enabled: activeTab === "brosur",
  });

  const { data: reportKwitansi } = useQuery({
    queryKey: ["reports-kwitansi-bulanan"],
    queryFn: () => apiReports.getRekapKwitansiBulanan(),
    enabled: activeTab === "kwitansi",
  });

  const simpananList: any[] = Array.isArray(reportSimpanan)
    ? reportSimpanan
    : (reportSimpanan as any)?.data || [];
  const pinjamanList: any[] = Array.isArray(reportPinjaman)
    ? reportPinjaman
    : (reportPinjaman as any)?.data || [];
  const kwitansiList: any[] = Array.isArray(reportKwitansi)
    ? reportKwitansi
    : (reportKwitansi as any)?.data || [];

  // Hitung SHU Mutation
  const hitungShuMutation = useMutation({
    mutationFn: () => apiKeuangan.hitungShu({ tahun: currentYear }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports-shu-anggota", currentYear] });
      queryClient.invalidateQueries({ queryKey: ["keuangan-ringkasan", currentYear] });
      toast.success("Perhitungan SHU Tahun 2026 Berhasil Diterbitkan!");
      refetchShu();
    },
    onError: (err: any) => {
      toast.error("Gagal Menghitung SHU", { description: err.message });
    },
  });

  useEffect(() => {
    if (kopstukData) {
      if (kopstukData.baris1) setKop1(kopstukData.baris1);
      if (kopstukData.baris2) setKop2(kopstukData.baris2);
      if (kopstukData.baris3) setKop3(kopstukData.baris3);
    }
  }, [kopstukData]);

  useEffect(() => {
    if (tajukData) {
      if (tajukData.jabatan) setJabatan(tajukData.jabatan);
      if (tajukData.namaPejabat) setPejabat(tajukData.namaPejabat);
      if (tajukData.pangkatNrp) setNrp(tajukData.pangkatNrp);
      if (tajukData.tempatTanggal) setTempatTgl(tajukData.tempatTanggal);
    }
  }, [tajukData]);

  const saveTajukMutation = useMutation({
    mutationFn: () =>
      apiTajukTtd.upsert({
        jabatan,
        namaPejabat: pejabat,
        pangkatNrp: nrp,
        tempatTanggal: tempatTgl,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tajuk-ttd-active"] });
      toast.success("Tajuk Tanda Tangan Berhasil Disimpan");
      setTtdOpen(false);
    },
    onError: (err: any) => toast.error("Gagal", { description: err.message }),
  });

  const shuList = reportShu?.data || [];
  const ringkasan = reportShu?.ringkasanShu;

  const sortedReportAnggota = useMemo(() => {
    return sortPersonelByPangkat(reportAnggota);
  }, [reportAnggota]);

  const sortedSimpananList = useMemo(() => {
    return sortPersonelByPangkat(simpananList);
  }, [simpananList]);

  const sortedPinjamanList = useMemo(() => {
    return sortPersonelByPangkat(pinjamanList, (p) => p.anggota);
  }, [pinjamanList]);

  const sortedShuList = useMemo(() => {
    return sortPersonelByPangkat(shuList, (r) => ({
      nama: r.nama,
      pangkat: r.pktCrpNrp,
    }));
  }, [shuList]);

  const totalJasaModal = shuList.reduce((s, r) => s + Number(r.jasaModal || 0), 0);
  const totalJasaUsaha = shuList.reduce((s, r) => s + Number(r.jasaUsaha || 0), 0);
  const totalShuKeseluruhan = shuList.reduce((s, r) => s + Number(r.totalShu || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan &amp; Cetakan Resmi Koperasi"
        description="Format cetak dokumen resmi Lampiran Petunjuk Teknis Lomba RTI Koperasi TNI AD 2026"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setTtdOpen(true)}>
              <PenLine className="mr-2 size-4" /> Sesuaikan Pejabat TTD
            </Button>
            <Button variant="outline" onClick={() => toast.success("Format data Excel disiapkan")}>
              <FileSpreadsheet className="mr-2 size-4" /> Export Data
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 size-4" /> Cetak / Unduh PDF
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap w-full">
          <TabsTrigger value="shu">
            <PieChart className="mr-1 size-4" /> Lampiran IX (Rekap SHU Anggota)
          </TabsTrigger>
          <TabsTrigger value="anggota">
            <Users className="mr-1 size-4" /> Lampiran II (Daftar Anggota)
          </TabsTrigger>
          <TabsTrigger value="simpanan">
            <BookOpen className="mr-1 size-4" /> Lampiran IV (Rekap Simpanan)
          </TabsTrigger>
          <TabsTrigger value="pinjaman">
            <CreditCard className="mr-1 size-4" /> Lampiran V (Pinjaman Anggota)
          </TabsTrigger>
          <TabsTrigger value="brosur">
            <FileText className="mr-1 size-4" /> Lampiran III (Brosur Pinjaman)
          </TabsTrigger>
          <TabsTrigger value="kwitansi">
            <Receipt className="mr-1 size-4" /> Lampiran VIII (Rekap Kwitansi)
          </TabsTrigger>
        </TabsList>

        <Card className="mt-4 p-6 print-sheet shadow-card">
          {/* Official Military Header / Kopstuk */}
          <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 border-b-4 border-double border-foreground pb-4">
            <div className="grid size-16 shrink-0 place-items-center rounded-full border-2 border-foreground">
              <Shield className="size-8 text-primary" />
            </div>
            <div className="min-w-0 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{kop1}</p>
              <p className="text-base font-extrabold uppercase text-foreground">{kop2}</p>
              <p className="text-[11px] text-muted-foreground">{kop3}</p>
            </div>
          </header>

          {/* TAB 1: Lampiran IX - SHU */}
          <TabsContent value="shu" className="mt-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <p className="text-base font-bold uppercase underline">
                  REKAPITULASI PEMBAGIAN SISA HASIL USAHA (SHU) ANGGOTA
                </p>
                <p className="text-xs text-muted-foreground">
                  Tahun Buku {currentYear} · Jasa Modal (Simpanan) 20% · Jasa Usaha (Pinjaman) 30%
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={hitungShuMutation.isPending}
                onClick={() => hitungShuMutation.mutate()}
              >
                {hitungShuMutation.isPending ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1.5 size-3.5" />
                )}
                Hitung Ulang SHU {currentYear}
              </Button>
            </div>

            {/* Ringkasan Finansial SHU */}
            {ringkasan && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                <div className="rounded-xl border border-border p-3 bg-muted/30">
                  <p className="text-muted-foreground">Total Pendapatan</p>
                  <p className="mt-1 text-sm font-bold text-primary">
                    {formatRp(Number(ringkasan.totalPendapatan))}
                  </p>
                </div>
                <div className="rounded-xl border border-border p-3 bg-muted/30">
                  <p className="text-muted-foreground">Total Beban Operasional</p>
                  <p className="mt-1 text-sm font-bold text-destructive">
                    {formatRp(Number(ringkasan.totalBeban))}
                  </p>
                </div>
                <div className="rounded-xl border border-border p-3 bg-primary-soft">
                  <p className="text-muted-foreground font-medium">SHU Bersih Tahun Berjalan</p>
                  <p className="mt-1 text-base font-extrabold text-primary">
                    {formatRp(Number(ringkasan.shuBersih))}
                  </p>
                </div>
                <div className="rounded-xl border border-border p-3 bg-success/10">
                  <p className="text-muted-foreground font-medium">Jasa Anggota (50%)</p>
                  <p className="mt-1 text-sm font-bold text-success">
                    {formatRp(Number(ringkasan.jasaModal) + Number(ringkasan.jasaUsaha))}
                  </p>
                </div>
              </div>
            )}

            {/* Error or Empty State with Auto-Generate Action */}
            {(errorShu || shuList.length === 0) && !loadingShu ? (
              <div className="rounded-xl border border-dashed border-primary/40 bg-primary-soft/40 p-8 text-center space-y-3">
                <p className="text-sm font-semibold text-foreground">
                  Data SHU Anggota Tahun {currentYear} Belum Diterbitkan
                </p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Sistem akan mengkalkulasi simpanan dan transaksi pinjaman seluruh anggota secara otomatis sesuai ketentuan Juknis TNI AD TA 2026.
                </p>
                <Button
                  disabled={hitungShuMutation.isPending}
                  onClick={() => hitungShuMutation.mutate()}
                >
                  {hitungShuMutation.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Calculator className="mr-2 size-4" />
                  )}
                  Hitung &amp; Terbitkan SHU Tahun {currentYear}
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/60 text-left font-semibold">
                      <th className="border border-border p-2 text-center w-12">No</th>
                      <th className="border border-border p-2">Nama Anggota</th>
                      <th className="border border-border p-2">Pangkat / Korps / NRP</th>
                      <th className="border border-border p-2 text-right">Jasa Modal (20%)</th>
                      <th className="border border-border p-2 text-right">Jasa Usaha (30%)</th>
                      <th className="border border-border p-2 text-right font-bold">Total SHU Diterima</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingShu ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          <Loader2 className="mx-auto size-5 animate-spin mb-1" />
                          Memuat data SHU...
                        </td>
                      </tr>
                    ) : (
                      sortedShuList.map((r, i) => (
                        <tr key={r.no || i} className="hover:bg-muted/20">
                          <td className="border border-border p-2 text-center font-medium">
                            {i + 1}
                          </td>
                          <td className="border border-border p-2 font-medium">{r.nama}</td>
                          <td className="border border-border p-2 text-muted-foreground">
                            {r.pktCrpNrp}
                          </td>
                          <td className="border border-border p-2 text-right text-primary font-medium">
                            {formatRp(Number(r.jasaModal))}
                          </td>
                          <td className="border border-border p-2 text-right text-success font-medium">
                            {formatRp(Number(r.jasaUsaha))}
                          </td>
                          <td className="border border-border p-2 text-right font-extrabold text-foreground">
                            {formatRp(Number(r.totalShu))}
                          </td>
                        </tr>
                      ))
                    )}
                    <tr className="bg-muted/80 font-bold">
                      <td className="border border-border p-2 text-center" colSpan={3}>
                        JUMLAH TOTAL PEMBAGIAN SHU ANGGOTA
                      </td>
                      <td className="border border-border p-2 text-right text-primary">
                        {formatRp(totalJasaModal)}
                      </td>
                      <td className="border border-border p-2 text-right text-success">
                        {formatRp(totalJasaUsaha)}
                      </td>
                      <td className="border border-border p-2 text-right text-primary font-extrabold text-sm">
                        {formatRp(totalShuKeseluruhan)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* TAB 2: Lampiran II - Anggota */}
          <TabsContent value="anggota" className="mt-6 space-y-4">
            <div className="text-center">
              <p className="text-base font-bold uppercase underline">DAFTAR ANGGOTA KOPERASI</p>
              <p className="text-xs text-muted-foreground">Status Keanggotaan Aktif</p>
            </div>

            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-muted/60 text-left font-semibold">
                  <th className="border border-border p-2 text-center">No</th>
                  <th className="border border-border p-2">NRP / NIP</th>
                  <th className="border border-border p-2">Nama Lengkap</th>
                  <th className="border border-border p-2">Pangkat / Korps</th>
                  <th className="border border-border p-2">Satminkal / Kotama</th>
                  <th className="border border-border p-2 text-center">Tgl Masuk</th>
                  <th className="border border-border p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedReportAnggota.map((a: any, i: number) => (
                  <tr key={a.id}>
                    <td className="border border-border p-2 text-center">{i + 1}</td>
                    <td className="border border-border p-2 font-mono">{a.nrpNip}</td>
                    <td className="border border-border p-2 font-medium">{formatNamaLengkapDinas(a.nama, a.pangkat?.nama, a.korps?.nama, a.pangkat?.kategori)}</td>
                    <td className="border border-border p-2">
                      {formatPangkatKorps(a.pangkat?.nama, a.korps?.nama, a.pangkat?.kategori)}
                    </td>
                    <td className="border border-border p-2">{a.satminkal?.nama || "INFOLAHTADAM IV/DIPONEGORO"}</td>
                    <td className="border border-border p-2 text-center">
                      {a.tmtAnggota || (a.tanggalMasuk ? new Date(a.tanggalMasuk).toLocaleDateString("id-ID") : "-")}
                    </td>
                    <td className="border border-border p-2 text-center">
                      {a.isAktif ? "Aktif" : "Nonaktif"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>

          {/* TAB 3: Lampiran IV - Simpanan */}
          <TabsContent value="simpanan" className="mt-6 space-y-4">
            <div className="text-center">
              <p className="text-base font-bold uppercase underline">
                REKAPITULASI SIMPANAN ANGGOTA (POKOK, WAJIB &amp; SUKARELA)
              </p>
              <p className="text-xs text-muted-foreground">Tahun Buku {currentYear}</p>
            </div>

            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-muted/60 text-left font-semibold">
                  <th className="border border-border p-2 text-center">No</th>
                  <th className="border border-border p-2">NRP / NIP</th>
                  <th className="border border-border p-2">Nama Anggota</th>
                  <th className="border border-border p-2 text-right">Simpanan Pokok</th>
                  <th className="border border-border p-2 text-right">Simpanan Wajib</th>
                  <th className="border border-border p-2 text-right">Simpanan Sukarela</th>
                  <th className="border border-border p-2 text-right font-bold">Total Saldo</th>
                </tr>
              </thead>
              <tbody>
                {sortedSimpananList.map((s: any, i: number) => (
                  <tr key={s.anggotaId || i}>
                    <td className="border border-border p-2 text-center">{i + 1}</td>
                    <td className="border border-border p-2 font-mono">{s.nrpNip}</td>
                    <td className="border border-border p-2 font-medium">{formatNamaLengkapDinas(s.nama, s.pangkat, s.korps, s.kategoriPangkat)}</td>
                    <td className="border border-border p-2 text-right">{formatRp(Number(s.pokok || 0))}</td>
                    <td className="border border-border p-2 text-right">{formatRp(Number(s.wajib || 0))}</td>
                    <td className="border border-border p-2 text-right">{formatRp(Number(s.sukarela || 0))}</td>
                    <td className="border border-border p-2 text-right font-bold text-foreground">
                      {formatRp(Number(s.total || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>

          {/* TAB 4: Lampiran V - Pinjaman */}
          <TabsContent value="pinjaman" className="mt-6 space-y-4">
            <div className="text-center">
              <p className="text-base font-bold uppercase underline">
                DAFTAR ANGGOTA MEMINJAM &amp; STATUS ANGSURAN
              </p>
              <p className="text-xs text-muted-foreground">Tahun Buku {currentYear}</p>
            </div>

            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-muted/60 text-left font-semibold">
                  <th className="border border-border p-2 text-center">No</th>
                  <th className="border border-border p-2">No. Pinjaman</th>
                  <th className="border border-border p-2">Nama Pemohon</th>
                  <th className="border border-border p-2 text-right">Nominal Pinjaman</th>
                  <th className="border border-border p-2 text-center">Tenor</th>
                  <th className="border border-border p-2 text-right">Sisa Pokok</th>
                  <th className="border border-border p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedPinjamanList.map((p: any, i: number) => (
                  <tr key={p.id || i}>
                    <td className="border border-border p-2 text-center">{i + 1}</td>
                    <td className="border border-border p-2 font-mono">{p.id?.slice(0, 8).toUpperCase()}</td>
                    <td className="border border-border p-2 font-medium">{formatNamaLengkapDinas(p.anggota?.nama, p.anggota?.pangkat?.nama, p.anggota?.korps?.nama, p.anggota?.pangkat?.kategori)}</td>
                    <td className="border border-border p-2 text-right">{formatRp(Number(p.nominal))}</td>
                    <td className="border border-border p-2 text-center">{p.tenorBulan} Bulan</td>
                    <td className="border border-border p-2 text-right font-semibold">
                      {formatRp(Number(p.sisaPokok || p.nominal))}
                    </td>
                    <td className="border border-border p-2 text-center">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>

          {/* TAB 5: Lampiran III - Brosur Pinjaman */}
          <TabsContent value="brosur" className="mt-6 space-y-4">
            <div className="text-center">
              <p className="text-base font-bold uppercase underline">
                TABEL ANGSURAN PINJAMAN KOPERASI (BROSUR RESMI)
              </p>
              <p className="text-xs text-muted-foreground">
                Suku Bunga 12% per Tahun (Flat 1% per Bulan) · Plafon Rp 1.000.000 s.d Rp 20.000.000
              </p>
            </div>

            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-muted/60 text-left font-semibold">
                  <th className="border border-border p-2">Plafon Pinjaman</th>
                  <th className="border border-border p-2 text-center">12 Bulan</th>
                  <th className="border border-border p-2 text-center">24 Bulan</th>
                  <th className="border border-border p-2 text-center">36 Bulan</th>
                </tr>
              </thead>
              <tbody>
                {[1_000_000, 2_000_000, 3_000_000, 5_000_000, 10_000_000, 15_000_000, 20_000_000].map(
                  (nom) => (
                    <tr key={nom}>
                      <td className="border border-border p-2 font-bold">{formatRp(nom)}</td>
                      <td className="border border-border p-2 text-center">
                        {formatRp(Math.floor(nom / 12) + Math.floor(nom * 0.01))} / bln
                      </td>
                      <td className="border border-border p-2 text-center">
                        {formatRp(Math.floor(nom / 24) + Math.floor(nom * 0.01))} / bln
                      </td>
                      <td className="border border-border p-2 text-center">
                        {formatRp(Math.floor(nom / 36) + Math.floor(nom * 0.01))} / bln
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </TabsContent>

          {/* TAB 6: Lampiran VIII - Rekap Kwitansi */}
          <TabsContent value="kwitansi" className="mt-6 space-y-4">
            <div className="text-center">
              <p className="text-base font-bold uppercase underline">
                REKAPITULASI PENERIMAAN KWITANSI &amp; INVOICE ANGSURAN
              </p>
              <p className="text-xs text-muted-foreground">Tahun Buku {currentYear}</p>
            </div>

            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-muted/60 text-left font-semibold">
                  <th className="border border-border p-2 text-center">No</th>
                  <th className="border border-border p-2">No. Invoice</th>
                  <th className="border border-border p-2">Tgl Bayar</th>
                  <th className="border border-border p-2 text-right">Pokok</th>
                  <th className="border border-border p-2 text-right">Bunga (Jasa Usaha)</th>
                  <th className="border border-border p-2 text-right font-bold">Total Diterima</th>
                </tr>
              </thead>
              <tbody>
                {kwitansiList.map((k: any, i: number) => (
                  <tr key={k.id || i}>
                    <td className="border border-border p-2 text-center">{i + 1}</td>
                    <td className="border border-border p-2 font-mono">{k.noInvoice || "-"}</td>
                    <td className="border border-border p-2">
                      {k.tanggalBayar ? new Date(k.tanggalBayar).toLocaleDateString("id-ID") : "-"}
                    </td>
                    <td className="border border-border p-2 text-right">{formatRp(Number(k.pokok || 0))}</td>
                    <td className="border border-border p-2 text-right">{formatRp(Number(k.bunga || 0))}</td>
                    <td className="border border-border p-2 text-right font-bold">
                      {formatRp(Number(k.total || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>

          {/* Signature / Tajuk Tanda Tangan */}
          <div className="mt-12 flex justify-end">
            <div className="w-80 text-center text-xs space-y-1">
              <p>{tempatTgl}</p>
              <p className="font-semibold uppercase">{jabatan}</p>
              <div className="h-20" />
              <p className="font-bold uppercase underline">{pejabat}</p>
              <p>NRP {nrp}</p>
            </div>
          </div>
        </Card>
      </Tabs>

      {/* Sheet Sesuaikan Pejabat TTD */}
      <Sheet open={ttdOpen} onOpenChange={setTtdOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Tajuk Tanda Tangan Dokumen Cetak</SheetTitle>
            <SheetDescription>
              Sesuaikan data pejabat penandatangan laporan dinas koperasi TNI AD
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4 py-4">
            <div className="space-y-2">
              <Label>Tempat &amp; Tanggal Dokumen</Label>
              <Input value={tempatTgl} onChange={(e) => setTempatTgl(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Jabatan Penandatangan</Label>
              <Input value={jabatan} onChange={(e) => setJabatan(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nama Lengkap &amp; Gelar</Label>
              <Input value={pejabat} onChange={(e) => setPejabat(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Pangkat &amp; NRP</Label>
              <Input value={nrp} onChange={(e) => setNrp(e.target.value)} />
            </div>
            <Button
              className="w-full mt-4"
              disabled={saveTajukMutation.isPending}
              onClick={() => saveTajukMutation.mutate()}
            >
              {saveTajukMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Terapkan &amp; Simpan Tajuk TTD
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
