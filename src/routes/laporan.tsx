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
import { Card } from "@/components/ui/card";
import primkopKartika from "@/assets/primkop-kartika.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  formatRp,
  formatPangkatKorps,
  formatPktCrpNrpFull,
  cleanNamaPersonel,
  sortPersonelByPangkat,
} from "@/lib/casheva-data";
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
  const [kop2, setKop2] = useState("INFORMASI DAN PENGOLAHAN DATA");
  const [kop3, setKop3] = useState("Jl. Perintis Kemerdekaan, Watugong, Semarang");
  const [logoUrl, setLogoUrl] = useState<string>(() => (typeof window !== "undefined" ? localStorage.getItem("casheva_kopstuk_logo") : null) || primkopKartika);

  // Tajuk TTD state
  const [ttdOpen, setTtdOpen] = useState(false);
  const [jabatan, setJabatan] = useState("Kasubdistekinfo Selaku Kalakgiat");
  const [pejabat, setPejabat] = useState("Sigit Suhendro Hadi K., S.T., M.Tr.(Han)");
  const [nrp, setNrp] = useState("11020019460278");
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

  const { data: reportAnggota, isLoading: loadingAnggota } = useQuery({
    queryKey: ["reports-anggota"],
    queryFn: () => apiReports.getAnggota(),
  });

  const { data: reportSimpanan, isLoading: loadingSimpanan } = useQuery({
    queryKey: ["reports-simpanan"],
    queryFn: () => apiReports.getRekapSimpanan(),
    enabled: activeTab === "simpanan",
  });

  const { data: reportPinjaman, isLoading: loadingPinjaman } = useQuery({
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

  const { data: reportBrosur, isLoading: loadingBrosur } = useQuery({
    queryKey: ["reports-brosur"],
    queryFn: () => apiReports.getBrosurPinjaman(),
    enabled: activeTab === "brosur",
  });

  const {
    data: reportKwitansi,
    isLoading: loadingKwitansi,
    refetch: refetchKwitansi,
  } = useQuery({
    queryKey: ["reports-kwitansi-bulanan"],
    queryFn: () => apiReports.getRekapKwitansiBulanan(),
    enabled: activeTab === "kwitansi",
  });

  // Extract arrays with robust fallbacks
  const anggotaList: any[] = Array.isArray(reportAnggota)
    ? reportAnggota
    : (reportAnggota as any)?.data || [];

  const simpananList: any[] = Array.isArray(reportSimpanan)
    ? reportSimpanan
    : (reportSimpanan as any)?.data || [];

  const pinjamanList: any[] = Array.isArray(reportPinjaman)
    ? reportPinjaman
    : (reportPinjaman as any)?.data || [];

  const kwitansiList: any[] = Array.isArray(reportKwitansi)
    ? reportKwitansi
    : (reportKwitansi as any)?.data || [];

  const shuList: any[] = Array.isArray(reportShu)
    ? reportShu
    : (reportShu as any)?.data || [];

  const ringkasan = reportShu?.ringkasanShu;

  // Helper calculation for kwitansi items
  const enrichedKwitansiList = useMemo(() => {
    return kwitansiList.map((k: any, i: number) => {
      const nominalPjm = Number(k.nominalPinjaman ?? k.jumlahPinjaman ?? 0);
      const tenor = Number(k.tenorBulan ?? 12);
      const totalNum = Number(k.total ?? k.jumlahAngsuran ?? k.totalDiterima ?? 0);

      let pokokNum = Number(k.pokok ?? k.angsuranPokok ?? 0);
      if (pokokNum <= 0 && nominalPjm > 0 && tenor > 0) {
        pokokNum = Math.floor(nominalPjm / tenor);
      } else if (pokokNum <= 0 && totalNum > 0) {
        pokokNum = Math.floor(totalNum * (tenor / (tenor + (tenor * 0.01))));
      }

      let bungaNum = Number(k.bunga ?? k.jasa ?? k.jasaUsaha ?? 0);
      if (bungaNum <= 0 && totalNum > pokokNum) {
        bungaNum = totalNum - pokokNum;
      } else if (bungaNum <= 0 && nominalPjm > 0) {
        bungaNum = Math.floor(nominalPjm * 0.01);
      }

      const finalTotalNum = totalNum > 0 ? totalNum : (pokokNum + bungaNum);

      const rawTgl = k.tanggalBayar || k.tglBayar || k.tanggalPembayaran || k.jatuhTempo;
      const tglFormatted = rawTgl && rawTgl !== '-'
        ? (typeof rawTgl === 'string' && (rawTgl.includes('T') || rawTgl.includes('-'))
            ? new Date(rawTgl).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : rawTgl)
        : new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

      return {
        ...k,
        pokokNum,
        bungaNum,
        finalTotalNum,
        tglFormatted,
      };
    });
  }, [kwitansiList]);

  const totalKwitansiPokok = useMemo(() => {
    return enrichedKwitansiList.reduce((acc, curr) => acc + Number(curr.pokokNum || 0), 0);
  }, [enrichedKwitansiList]);

  const totalKwitansiBunga = useMemo(() => {
    return enrichedKwitansiList.reduce((acc, curr) => acc + Number(curr.bungaNum || 0), 0);
  }, [enrichedKwitansiList]);

  const totalKwitansiDiterima = useMemo(() => {
    return enrichedKwitansiList.reduce((acc, curr) => acc + Number(curr.finalTotalNum || 0), 0);
  }, [enrichedKwitansiList]);

  // Hitung SHU Mutation
  const hitungShuMutation = useMutation({
    mutationFn: () => apiKeuangan.hitungShu({ tahun: currentYear }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports-shu-anggota", currentYear] });
      queryClient.invalidateQueries({ queryKey: ["reports-anggota"] });
      queryClient.invalidateQueries({ queryKey: ["keuangan-ringkasan", currentYear] });
      toast.success("Perhitungan SHU Tahun 2026 Berhasil Diterbitkan!");
      refetchShu();
    },
    onError: (err: any) => {
      toast.error("Gagal Menghitung SHU", { description: err.message });
    },
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLogo = localStorage.getItem("casheva_kopstuk_logo");
      if (savedLogo) setLogoUrl(savedLogo);
    }
    if (kopstukData) {
      if (kopstukData.baris1 || kopstukData.namaSatuan) {
        setKop1(kopstukData.baris1 || kopstukData.namaSatuan || "");
      }
      if (kopstukData.baris2 || kopstukData.namaBalak) {
        setKop2(kopstukData.baris2 || kopstukData.namaBalak || "");
      }
      if (kopstukData.baris3 || kopstukData.alamat) {
        setKop3(kopstukData.baris3 || kopstukData.alamat || "");
      }
      if (kopstukData.logoUrl) {
        setLogoUrl(kopstukData.logoUrl);
      }
    }
  }, [kopstukData]);

  useEffect(() => {
    if (tajukData) {
      if (tajukData.jabatan) setJabatan(tajukData.jabatan);
      if (tajukData.namaPejabat) setPejabat(tajukData.namaPejabat);
      if (tajukData.pangkatNrp || tajukData.nrp) {
        setNrp(tajukData.nrp || tajukData.pangkatNrp || "");
      }
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

  // Lookup map for enriched member profile (fallback jika data SHU belum join relasi pangkat)
  const anggotaMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const a of anggotaList) {
      if (a.id) map.set(a.id, a);
      if (a.anggotaId) map.set(a.anggotaId, a);
      if (a.nama) map.set(a.nama.trim().toLowerCase(), a);
    }
    return map;
  }, [anggotaList]);

  // Sort lists by military rank
  const sortedReportAnggota = useMemo(() => {
    return sortPersonelByPangkat(anggotaList);
  }, [anggotaList]);

  const sortedSimpananList = useMemo(() => {
    return sortPersonelByPangkat(simpananList, (s) => {
      const aInfo =
        (s.anggotaId ? anggotaMap.get(s.anggotaId) : null) ||
        (s.id ? anggotaMap.get(s.id) : null) ||
        (s.nama ? anggotaMap.get(s.nama.trim().toLowerCase()) : null);
      return {
        nama: s.nama,
        pangkat: s.pangkat || s.pangkatNama || s.pktCrpNrp || s.pangkatKorpsNrp || aInfo?.pangkat?.nama || aInfo?.pangkat,
        kategoriPangkat: s.kategoriPangkat || aInfo?.kategoriPangkat || aInfo?.pangkat?.kategori,
      };
    });
  }, [simpananList, anggotaMap]);

  // Pinjaman diurutkan berdasarkan urutan pinjaman (siapa yang meminjam duluan / kronologis)
  const chronologicalPinjamanList = useMemo(() => {
    return pinjamanList;
  }, [pinjamanList]);

  const sortedShuList = useMemo(() => {
    return sortPersonelByPangkat(shuList, (r) => {
      const aInfo =
        (r.anggotaId ? anggotaMap.get(r.anggotaId) : null) ||
        (r.id ? anggotaMap.get(r.id) : null) ||
        (r.nama ? anggotaMap.get(r.nama.trim().toLowerCase()) : null);
      return {
        nama: r.nama,
        pangkat: r.pangkat || r.pktCrpNrp || r.pangkatKorpsNrp || aInfo?.pangkat?.nama || aInfo?.pangkat,
        kategoriPangkat: r.kategoriPangkat || aInfo?.pangkat?.kategori || aInfo?.kategoriPangkat,
      };
    });
  }, [shuList, anggotaMap]);

  // Aggregate Totals
  const totalJasaModal = useMemo(() => {
    return shuList.reduce((s, r) => s + Number(r.jasaModal || 0), 0);
  }, [shuList]);

  const totalJasaUsaha = useMemo(() => {
    return shuList.reduce((s, r) => s + Number(r.jasaUsaha || 0), 0);
  }, [shuList]);

  const totalShuKeseluruhan = useMemo(() => {
    return shuList.reduce((s, r) => s + Number(r.totalShu || r.total || 0), 0);
  }, [shuList]);

  const totalSimpananPokok = useMemo(() => {
    return simpananList.reduce((acc, curr) => acc + Number(curr.simpananPokok ?? curr.pokok ?? 0), 0);
  }, [simpananList]);

  const totalSimpananWajib = useMemo(() => {
    return simpananList.reduce((acc, curr) => acc + Number(curr.simpananWajib ?? curr.wajib ?? 0), 0);
  }, [simpananList]);

  const totalSimpananSukarela = useMemo(() => {
    return simpananList.reduce((acc, curr) => acc + Number(curr.simpananSukarela ?? curr.sukarela ?? 0), 0);
  }, [simpananList]);

  const grandTotalSimpanan = useMemo(() => {
    return simpananList.reduce((acc, curr) => acc + Number(curr.totalSimpanan ?? curr.total ?? 0), 0);
  }, [simpananList]);

  const totalPinjamanPlafon = useMemo(() => {
    return pinjamanList.reduce((acc, curr) => acc + Number(curr.jumlahPinjaman ?? curr.nominal ?? 0), 0);
  }, [pinjamanList]);

  const totalSisaPokokPinjaman = useMemo(() => {
    return pinjamanList.reduce((acc, curr) => acc + Number(curr.sisaPokok ?? curr.nominal ?? 0), 0);
  }, [pinjamanList]);

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
            <div className="flex h-16 w-16 shrink-0 items-center justify-center">
              <img src={logoUrl} alt="Logo Satuan" className="max-h-16 max-w-16 object-contain" />
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

            {/* Table or Empty State */}
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
                      sortedShuList.map((r, i) => {
                        const aInfo =
                          (r.anggotaId ? anggotaMap.get(r.anggotaId) : null) ||
                          (r.id ? anggotaMap.get(r.id) : null) ||
                          (r.nama ? anggotaMap.get(r.nama.trim().toLowerCase()) : null);
                        const rawPangkat = r.pangkat || aInfo?.pangkat?.nama || aInfo?.pangkat;
                        const rawKorps = r.korps || aInfo?.korps?.nama || aInfo?.korps;
                        const rawKat = r.kategoriPangkat || aInfo?.pangkat?.kategori || aInfo?.kategoriPangkat;
                        const rawNrp = r.nrpNip || aInfo?.nrpNip;

                        const pktCrpNrpFull = formatPktCrpNrpFull(
                          rawPangkat,
                          rawKorps,
                          rawKat,
                          rawNrp,
                          r.pktCrpNrp || r.pangkatKorpsNrp,
                        );

                        return (
                          <tr key={r.no || r.id || i} className="hover:bg-muted/20">
                            <td className="border border-border p-2 text-center font-medium">
                              {i + 1}
                            </td>
                            <td className="border border-border p-2 font-medium">{cleanNamaPersonel(r.nama)}</td>
                            <td className="border border-border p-2 text-muted-foreground">
                              {pktCrpNrpFull}
                            </td>
                            <td className="border border-border p-2 text-right text-primary font-medium">
                              {formatRp(Number(r.jasaModal || 0))}
                            </td>
                            <td className="border border-border p-2 text-right text-success font-medium">
                              {formatRp(Number(r.jasaUsaha || 0))}
                            </td>
                            <td className="border border-border p-2 text-right font-extrabold text-foreground">
                              {formatRp(Number(r.totalShu || r.total || 0))}
                            </td>
                          </tr>
                        );
                      })
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

          {/* TAB 2: Lampiran II - Anggota (Nama Lengkap HANYA nama & gelar saja) */}
          <TabsContent value="anggota" className="mt-6 space-y-4">
            <div className="text-center">
              <p className="text-base font-bold uppercase underline">DAFTAR ANGGOTA KOPERASI</p>
              <p className="text-xs text-muted-foreground">Status Keanggotaan Aktif Sesuai Database</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/60 text-left font-semibold">
                    <th className="border border-border p-2 text-center w-12">No</th>
                    <th className="border border-border p-2">NRP / NIP</th>
                    <th className="border border-border p-2">Nama Lengkap &amp; Gelar</th>
                    <th className="border border-border p-2">Pangkat / Korps</th>
                    <th className="border border-border p-2">Satminkal / Kotama</th>
                    <th className="border border-border p-2 text-center">Tgl Masuk</th>
                    <th className="border border-border p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingAnggota ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        <Loader2 className="mx-auto size-5 animate-spin mb-1" />
                        Memuat data anggota koperasi...
                      </td>
                    </tr>
                  ) : sortedReportAnggota.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-muted-foreground">
                        Tidak ada data anggota.
                      </td>
                    </tr>
                  ) : (
                    sortedReportAnggota.map((a: any, i: number) => {
                      const pangkatFormatted = formatPangkatKorps(
                        a.pangkat?.nama || a.pangkat,
                        a.korps?.nama || a.korps,
                        a.kategoriPangkat || a.pangkat?.kategori
                      );

                      return (
                        <tr key={a.id || i} className="hover:bg-muted/20">
                          <td className="border border-border p-2 text-center">{i + 1}</td>
                          <td className="border border-border p-2 font-mono">{a.nrpNip}</td>
                          <td className="border border-border p-2 font-medium">
                            {cleanNamaPersonel(a.nama)}
                          </td>
                          <td className="border border-border p-2 font-medium">
                            {pangkatFormatted}
                          </td>
                          <td className="border border-border p-2">{a.kesatuan || a.satminkal?.nama || "INFOLAHTADAM IV/DIPONEGORO"}</td>
                          <td className="border border-border p-2 text-center">
                            {a.tmtAnggota || (a.tanggalMasuk ? (a.tanggalMasuk.includes('T') ? new Date(a.tanggalMasuk).toLocaleDateString("id-ID") : a.tanggalMasuk) : "-")}
                          </td>
                          <td className="border border-border p-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${a.isAktif || a.status === 'AKTIF' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                              {a.status || (a.isAktif ? "AKTIF" : "NONAKTIF")}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                  <tr className="bg-muted/80 font-bold">
                    <td className="border border-border p-2 text-center" colSpan={4}>
                      TOTAL JUMLAH ANGGOTA TERDAFTAR
                    </td>
                    <td className="border border-border p-2 text-right font-extrabold" colSpan={3}>
                      {sortedReportAnggota.length} Anggota
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* TAB 3: Lampiran IV - Simpanan (NRP/NIP database + Kolom Pangkat + Urut Pangkat) */}
          <TabsContent value="simpanan" className="mt-6 space-y-4">
            <div className="text-center">
              <p className="text-base font-bold uppercase underline">
                REKAPITULASI SIMPANAN ANGGOTA (POKOK, WAJIB &amp; SUKARELA)
              </p>
              <p className="text-xs text-muted-foreground">Tahun Buku {currentYear} · Berdasarkan Mutasi Kas Simpanan</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/60 text-left font-semibold">
                    <th className="border border-border p-2 text-center w-12">No</th>
                    <th className="border border-border p-2">NRP / NIP</th>
                    <th className="border border-border p-2">Nama Anggota</th>
                    <th className="border border-border p-2">Pangkat / Korps</th>
                    <th className="border border-border p-2 text-right">Simpanan Pokok</th>
                    <th className="border border-border p-2 text-right">Simpanan Wajib</th>
                    <th className="border border-border p-2 text-right">Simpanan Sukarela</th>
                    <th className="border border-border p-2 text-right font-bold">Total Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingSimpanan ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        <Loader2 className="mx-auto size-5 animate-spin mb-1" />
                        Memuat data simpanan anggota...
                      </td>
                    </tr>
                  ) : sortedSimpananList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-muted-foreground">
                        Tidak ada data simpanan.
                      </td>
                    </tr>
                  ) : (
                    sortedSimpananList.map((s: any, i: number) => {
                      const aInfo =
                        (s.anggotaId ? anggotaMap.get(s.anggotaId) : null) ||
                        (s.id ? anggotaMap.get(s.id) : null) ||
                        (s.nama ? anggotaMap.get(s.nama.trim().toLowerCase()) : null);

                      const rawPangkat = s.pangkat || s.pangkatNama || aInfo?.pangkat?.nama || aInfo?.pangkat;
                      const rawKorps = s.korps || s.korpsNama || aInfo?.korps?.nama || aInfo?.korps;
                      const rawKat = s.kategoriPangkat || aInfo?.kategoriPangkat || aInfo?.pangkat?.kategori;
                      const nrpVal = s.nrpNip || s.nrp || aInfo?.nrpNip || aInfo?.nrp || '-';

                      const pangkatFormatted = formatPangkatKorps(rawPangkat, rawKorps, rawKat);

                      return (
                        <tr key={s.anggotaId || s.id || i} className="hover:bg-muted/20">
                          <td className="border border-border p-2 text-center">{i + 1}</td>
                          <td className="border border-border p-2 font-mono font-medium">{nrpVal}</td>
                          <td className="border border-border p-2 font-medium">
                            {cleanNamaPersonel(s.nama)}
                          </td>
                          <td className="border border-border p-2 font-medium">
                            {pangkatFormatted}
                          </td>
                          <td className="border border-border p-2 text-right">
                            {formatRp(Number(s.simpananPokok ?? s.pokok ?? 0))}
                          </td>
                          <td className="border border-border p-2 text-right">
                            {formatRp(Number(s.simpananWajib ?? s.wajib ?? 0))}
                          </td>
                          <td className="border border-border p-2 text-right">
                            {formatRp(Number(s.simpananSukarela ?? s.sukarela ?? 0))}
                          </td>
                          <td className="border border-border p-2 text-right font-bold text-foreground">
                            {formatRp(Number(s.totalSimpanan ?? s.total ?? 0))}
                          </td>
                        </tr>
                      );
                    })
                  )}
                  <tr className="bg-muted/80 font-bold">
                    <td className="border border-border p-2 text-center" colSpan={4}>
                      TOTAL KESELURUHAN DANA SIMPANAN
                    </td>
                    <td className="border border-border p-2 text-right">
                      {formatRp(totalSimpananPokok)}
                    </td>
                    <td className="border border-border p-2 text-right">
                      {formatRp(totalSimpananWajib)}
                    </td>
                    <td className="border border-border p-2 text-right">
                      {formatRp(totalSimpananSukarela)}
                    </td>
                    <td className="border border-border p-2 text-right text-primary font-extrabold text-sm">
                      {formatRp(grandTotalSimpanan)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* TAB 4: Lampiran V - Pinjaman (Nomor Pinjaman Berdasarkan Siapa Dulu yang Minjam) */}
          <TabsContent value="pinjaman" className="mt-6 space-y-4">
            <div className="text-center">
              <p className="text-base font-bold uppercase underline">
                DAFTAR ANGGOTA MEMINJAM &amp; STATUS ANGSURAN
              </p>
              <p className="text-xs text-muted-foreground">Tahun Buku {currentYear} · Diurutkan Sesuai Kronologis Pengajuan &amp; Pencairan</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/60 text-left font-semibold">
                    <th className="border border-border p-2 text-center w-12">No</th>
                    <th className="border border-border p-2">No. Pinjaman</th>
                    <th className="border border-border p-2">Nama Pemohon</th>
                    <th className="border border-border p-2">Pangkat / Korps</th>
                    <th className="border border-border p-2 text-right">Nominal Pinjaman</th>
                    <th className="border border-border p-2 text-center">Tenor</th>
                    <th className="border border-border p-2 text-right">Sisa Pokok</th>
                    <th className="border border-border p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingPinjaman ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        <Loader2 className="mx-auto size-5 animate-spin mb-1" />
                        Memuat data pinjaman anggota...
                      </td>
                    </tr>
                  ) : chronologicalPinjamanList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-muted-foreground">
                        Tidak ada data pinjaman anggota.
                      </td>
                    </tr>
                  ) : (
                    chronologicalPinjamanList.map((p: any, i: number) => {
                      const aInfo =
                        (p.anggotaId ? anggotaMap.get(p.anggotaId) : null) ||
                        (p.anggota?.id ? anggotaMap.get(p.anggota.id) : null) ||
                        (p.nama ? anggotaMap.get(p.nama.trim().toLowerCase()) : null) ||
                        (p.anggota?.nama ? anggotaMap.get(p.anggota.nama.trim().toLowerCase()) : null);

                      const rawPangkat = p.pangkat || p.anggota?.pangkat?.nama || aInfo?.pangkat?.nama || aInfo?.pangkat;
                      const rawKorps = p.korps || p.anggota?.korps?.nama || aInfo?.korps?.nama || aInfo?.korps;
                      const rawKat = p.kategoriPangkat || p.anggota?.pangkat?.kategori || aInfo?.kategoriPangkat || aInfo?.pangkat?.kategori;

                      const pangkatFormatted = formatPangkatKorps(rawPangkat, rawKorps, rawKat);
                      const noPinjaman = p.noPinjaman || p.id || `PJ-2026/${String(i + 1).padStart(3, '0')}`;

                      return (
                        <tr key={p.rawId || p.id || i} className="hover:bg-muted/20">
                          <td className="border border-border p-2 text-center">{i + 1}</td>
                          <td className="border border-border p-2 font-mono font-semibold text-primary">
                            {noPinjaman}
                          </td>
                          <td className="border border-border p-2 font-medium">
                            {cleanNamaPersonel(p.nama || p.anggota?.nama)}
                          </td>
                          <td className="border border-border p-2">
                            {pangkatFormatted}
                          </td>
                          <td className="border border-border p-2 text-right font-medium">
                            {formatRp(Number(p.jumlahPinjaman ?? p.nominal ?? 0))}
                          </td>
                          <td className="border border-border p-2 text-center">
                            {p.jkaWkt ?? p.tenorBulan ?? 0} Bulan
                          </td>
                          <td className="border border-border p-2 text-right font-semibold text-primary">
                            {formatRp(Number(p.sisaPokok ?? p.nominal ?? 0))}
                          </td>
                          <td className="border border-border p-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${p.status === 'LUNAS' ? 'bg-success/10 text-success' : p.status === 'DICAIRKAN' ? 'bg-primary-soft text-primary' : 'bg-muted text-muted-foreground'}`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                  <tr className="bg-muted/80 font-bold">
                    <td className="border border-border p-2 text-center" colSpan={4}>
                      TOTAL JUMLAH PLAFON &amp; SISA PINJAMAN
                    </td>
                    <td className="border border-border p-2 text-right text-foreground">
                      {formatRp(totalPinjamanPlafon)}
                    </td>
                    <td className="border border-border p-2 text-center">-</td>
                    <td className="border border-border p-2 text-right text-primary font-extrabold">
                      {formatRp(totalSisaPokokPinjaman)}
                    </td>
                    <td className="border border-border p-2 text-center">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
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

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/60 text-left font-semibold">
                    <th className="border border-border p-2">Plafon Pinjaman</th>
                    <th className="border border-border p-2 text-center">6 Bulan</th>
                    <th className="border border-border p-2 text-center">12 Bulan</th>
                    <th className="border border-border p-2 text-center">18 Bulan</th>
                    <th className="border border-border p-2 text-center">24 Bulan</th>
                    <th className="border border-border p-2 text-center">30 Bulan</th>
                    <th className="border border-border p-2 text-center">36 Bulan</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingBrosur ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        <Loader2 className="mx-auto size-5 animate-spin mb-1" />
                        Memuat matriks tabel brosur pinjaman...
                      </td>
                    </tr>
                  ) : (
                    (reportBrosur?.nominalList || [
                      1_000_000, 2_000_000, 3_000_000, 4_000_000, 5_000_000, 6_000_000,
                      7_000_000, 8_000_000, 9_000_000, 10_000_000, 12_000_000, 15_000_000,
                      18_000_000, 20_000_000,
                    ]).map((nom: number) => {
                      const calcBln = (tenor: number) => {
                        const pokok = Math.floor(nom / tenor);
                        const bunga = Math.floor(nom * 0.01);
                        return pokok + bunga;
                      };
                      return (
                        <tr key={nom} className="hover:bg-muted/20">
                          <td className="border border-border p-2 font-bold text-foreground">{formatRp(nom)}</td>
                          <td className="border border-border p-2 text-center font-medium">
                            {formatRp(calcBln(6))}
                          </td>
                          <td className="border border-border p-2 text-center font-medium">
                            {formatRp(calcBln(12))}
                          </td>
                          <td className="border border-border p-2 text-center font-medium">
                            {formatRp(calcBln(18))}
                          </td>
                          <td className="border border-border p-2 text-center font-medium">
                            {formatRp(calcBln(24))}
                          </td>
                          <td className="border border-border p-2 text-center font-medium">
                            {formatRp(calcBln(30))}
                          </td>
                          <td className="border border-border p-2 text-center font-medium text-primary font-semibold">
                            {formatRp(calcBln(36))}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* TAB 6: Lampiran VIII - Rekap Kwitansi (Tgl Bayar Realistis, Rincian Pokok, Jasa & Total Diterima) */}
          <TabsContent value="kwitansi" className="mt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <p className="text-base font-bold uppercase underline">
                  REKAPITULASI PENERIMAAN KWITANSI &amp; INVOICE ANGSURAN
                </p>
                <p className="text-xs text-muted-foreground">Tahun Buku {currentYear} · Bukti Pembayaran Kas Angsuran Realtime</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ["reports-kwitansi-bulanan"] });
                  refetchKwitansi();
                  toast.success("Data Kwitansi Angsuran Berhasil Diperbarui!");
                }}
              >
                <RefreshCw className="mr-1.5 size-3.5" />
                Segarkan Data Kwitansi
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/60 text-left font-semibold">
                    <th className="border border-border p-2 text-center w-12">No</th>
                    <th className="border border-border p-2">No. Kwitansi / Invoice</th>
                    <th className="border border-border p-2 text-center">Tgl Bayar</th>
                    <th className="border border-border p-2">Nama Debitur</th>
                    <th className="border border-border p-2">Pangkat / Korps</th>
                    <th className="border border-border p-2 text-center">Angsuran Ke</th>
                    <th className="border border-border p-2 text-right">Pokok</th>
                    <th className="border border-border p-2 text-right">Bunga (Jasa Usaha)</th>
                    <th className="border border-border p-2 text-right font-bold">Total Diterima</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingKwitansi ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">
                        <Loader2 className="mx-auto size-5 animate-spin mb-1" />
                        Memuat data rekapitulasi kwitansi angsuran...
                      </td>
                    </tr>
                  ) : enrichedKwitansiList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-muted-foreground">
                        Tidak ada transaksi kwitansi angsuran yang lunas.
                      </td>
                    </tr>
                  ) : (
                    enrichedKwitansiList.map((k: any, i: number) => {
                      const aInfo =
                        (k.anggotaId ? anggotaMap.get(k.anggotaId) : null) ||
                        (k.debiturId ? anggotaMap.get(k.debiturId) : null) ||
                        (k.nama ? anggotaMap.get(k.nama.trim().toLowerCase()) : null);

                      const rawPangkat = k.pangkat || aInfo?.pangkat?.nama || aInfo?.pangkat;
                      const rawKorps = k.korps || aInfo?.korps?.nama || aInfo?.korps;
                      const rawKat = k.kategoriPangkat || aInfo?.kategoriPangkat || aInfo?.pangkat?.kategori;
                      const pangkatFormatted = formatPangkatKorps(rawPangkat, rawKorps, rawKat);

                      return (
                        <tr key={k.id || i} className="hover:bg-muted/20">
                          <td className="border border-border p-2 text-center font-medium">{i + 1}</td>
                          <td className="border border-border p-2 font-mono font-medium text-foreground">
                            {k.noInvoice || k.noKwitansi || "-"}
                          </td>
                          <td className="border border-border p-2 text-center text-foreground font-medium">
                            {k.tglFormatted}
                          </td>
                          <td className="border border-border p-2 font-medium">
                            {cleanNamaPersonel(k.nama)}
                          </td>
                          <td className="border border-border p-2">
                            {pangkatFormatted}
                          </td>
                          <td className="border border-border p-2 text-center font-mono">
                            {k.angsuranKeDari || (k.bulanKe && k.tenorBulan ? `${k.bulanKe}/${k.tenorBulan}` : "-")}
                          </td>
                          <td className="border border-border p-2 text-right font-medium">
                            {formatRp(k.pokokNum)}
                          </td>
                          <td className="border border-border p-2 text-right text-success font-medium">
                            {formatRp(k.bungaNum)}
                          </td>
                          <td className="border border-border p-2 text-right font-bold text-foreground">
                            {formatRp(k.finalTotalNum)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                  <tr className="bg-muted/80 font-bold">
                    <td className="border border-border p-2 text-center" colSpan={6}>
                      JUMLAH TOTAL PENERIMAAN ANGSURAN
                    </td>
                    <td className="border border-border p-2 text-right text-foreground">
                      {formatRp(totalKwitansiPokok)}
                    </td>
                    <td className="border border-border p-2 text-right text-success">
                      {formatRp(totalKwitansiBunga)}
                    </td>
                    <td className="border border-border p-2 text-right text-primary font-extrabold text-sm">
                      {formatRp(totalKwitansiDiterima)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Signature / Tajuk Tanda Tangan */}
          <div className="mt-12 flex justify-end">
            <div className="w-80 text-center text-xs space-y-1">
              <p>{tempatTgl}</p>
              <p className="font-semibold uppercase">{jabatan}</p>
              <div className="h-20" />
              <p className="font-bold uppercase underline">{pejabat}</p>
              <p>{nrp ? (nrp.includes("NRP") ? nrp : `NRP ${nrp}`) : ""}</p>
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
