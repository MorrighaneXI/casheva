import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  Filter,
  DollarSign,
  Receipt,
  UserCheck,
  Copy,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Printer,
  Info,
  Clock,
  Sparkles,
  Calculator,
  HelpCircle,
  Check,
  ArrowRight,
  TrendingDown,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { useSession } from "@/components/session-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { formatRp, formatPangkatKorps, formatNamaLengkapDinas, cleanNamaPersonel } from "@/lib/casheva-data";
import { apiPinjaman, apiAnggota, type Pinjaman, type KalkulasiDinamisResponse, type BayarAngsuranDinamisDto } from "@/lib/api";
import { exportToCSV } from "@/lib/export-excel";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";

export const Route = createFileRoute("/angsuran")({
  head: () => ({
    meta: [
      { title: "Rekap Angsuran Bulanan — Casheva Koperasi TNI AD" },
      {
        name: "description",
        content: "Rekapitulasi angsuran pinjaman bulanan dengan rincian pengangsur, tanggal bayar, dan ekspor excel.",
      },
      { property: "og:title", content: "Rekap Angsuran — Casheva" },
      { property: "og:description", content: "Status cicilan berjalan anggota koperasi TNI AD." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Page,
});

const BULAN_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function Page() {
  const queryClient = useQueryClient();
  const { user, role, isAdmin } = useSession();
  const isAnggota = role === "Anggota";
  const isBendaharaOrAdmin = isAdmin || role === "Bendahara" || role === "Admin Koperasi";

  const currentDate = new Date();
  const [selectedBulan, setSelectedBulan] = useState<number>(currentDate.getMonth() + 1);
  const [selectedTahun, setSelectedTahun] = useState<number>(currentDate.getFullYear());
  const [selectedLoan, setSelectedLoan] = useState<Pinjaman | null>(null);

  // States untuk Pembayaran Dinamis & Kwitansi
  const [dinamisLoanId, setDinamisLoanId] = useState<string | null>(null);
  const [nominalBayarInput, setNominalBayarInput] = useState<number>(0);
  const [isPelunasanDipercepat, setIsPelunasanDipercepat] = useState<boolean>(false);
  const [tanggalBayarInput, setTanggalBayarInput] = useState<string>(new Date().toISOString().slice(0, 10));
  const [receiptData, setReceiptData] = useState<any | null>(null);
  const [confirmDinamisOpen, setConfirmDinamisOpen] = useState(false);

  // Ambil data anggota untuk pencocokan akun dinas personel
  const { data: anggotaList = [] } = useQuery({
    queryKey: ["anggota-list-active"],
    queryFn: () => apiAnggota.findAll(true),
  });

  const currentMember = useMemo(() => {
    if (!user) return null;
    let pool = anggotaList || [];
    if (pool.length === 0 && typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("casheva.anggota_cache");
        if (raw) pool = JSON.parse(raw);
      } catch {}
    }

    if (pool.length > 0) {
      const byNrp = pool.find((a) => a.nrpNip?.toLowerCase() === user.username?.toLowerCase());
      if (byNrp) return byNrp;

      const byId = pool.find((a) => a.id === user.id);
      if (byId) return byId;

      if (user.namaLengkap) {
        const cleanUser = cleanNamaPersonel(user.namaLengkap).toLowerCase();
        const byName = pool.find((a) => {
          const cleanA = cleanNamaPersonel(a.nama).toLowerCase();
          return cleanA === cleanUser || (cleanUser.length > 3 && (cleanA.includes(cleanUser) || cleanUser.includes(cleanA)));
        });
        if (byName) return byName;
      }
    }
    return null;
  }, [anggotaList, user]);

  // Queries
  const { data: loanList = [], isLoading: loadingLoans } = useQuery({
    queryKey: ["pinjaman-angsuran-all"],
    queryFn: () => apiPinjaman.findAll(),
  });

  const { data: rekapBulananList = [], isLoading: loadingBulanan } = useQuery({
    queryKey: ["angsuran-rekap-bulanan", selectedBulan, selectedTahun],
    queryFn: () => apiPinjaman.getRekapAngsuranBulanan(selectedBulan, selectedTahun),
  });

  // Query kalkulasi dinamis untuk pinjaman yang sedang dipilih di modal
  const { data: kalkulasiData, isLoading: loadingKalkulasi } = useQuery({
    queryKey: ["kalkulasi-dinamis", dinamisLoanId],
    queryFn: () => (dinamisLoanId ? apiPinjaman.getKalkulasiDinamis(dinamisLoanId) : null),
    enabled: !!dinamisLoanId,
  });

  // Otomatis set default nominal bayar saat kalkulasi dinamis dimuat
  useEffect(() => {
    if (kalkulasiData) {
      if (isPelunasanDipercepat) {
        setNominalBayarInput(kalkulasiData.pelunasanDipercepat.totalBayar);
      } else {
        setNominalBayarInput(kalkulasiData.totalKewajibanBulanIni);
      }
    }
  }, [kalkulasiData, isPelunasanDipercepat]);

  const liveCalculation = useMemo(() => {
    if (!kalkulasiData) return null;
    const nominal = nominalBayarInput || 0;
    const totalBungaWajib = (kalkulasiData.tunggakanBunga || 0) + (kalkulasiData.bungaBulanan || 0);
    const porsiBunga = Math.min(nominal, totalBungaWajib);
    const porsiPokok = Math.max(0, nominal - porsiBunga);
    const sisaPokokBaru = Math.max(0, kalkulasiData.sisaPokok - porsiPokok);
    const sisaBungaTertunggak = Math.max(0, totalBungaWajib - porsiBunga);

    return {
      nominal,
      porsiBunga,
      porsiPokok,
      sisaPokokBaru,
      sisaBungaTertunggak,
      isLunas: isPelunasanDipercepat || sisaPokokBaru === 0,
    };
  }, [kalkulasiData, nominalBayarInput, isPelunasanDipercepat]);

  const activeLoans = loanList.filter((l) =>
    ["DICAIRKAN", "LUNAS"].includes(l.status),
  );

  // Mutations
  const bayarMutation = useMutation({
    mutationFn: (angsuranId: string) => apiPinjaman.bayarAngsuran(angsuranId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["angsuran-rekap-bulanan"] });
      queryClient.invalidateQueries({ queryKey: ["pinjaman-angsuran-all"] });
      queryClient.invalidateQueries({ queryKey: ["pinjaman-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Angsuran Berhasil Dibayar!", {
        description: `Kwitansi & Invoice terbit: ${res.noInvoice || "#KW-AUTO"}`,
      });
      if (selectedLoan) {
        apiPinjaman.findOne(selectedLoan.id).then(setSelectedLoan);
      }
    },
    onError: (err: any) => {
      toast.error("Gagal Memproses Pembayaran", { description: err.message });
    },
  });

  const bayarDinamisMutation = useMutation({
    mutationFn: async (dto: BayarAngsuranDinamisDto) => {
      if (!dinamisLoanId) throw new Error("ID Pinjaman tidak valid");
      return apiPinjaman.bayarDinamis(dinamisLoanId, dto);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["pinjaman-angsuran-all"] });
      queryClient.invalidateQueries({ queryKey: ["angsuran-rekap-bulanan"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["kalkulasi-dinamis"] });
      setReceiptData({
        ...res,
        anggota: kalkulasiData?.anggota,
        tenorBulan: kalkulasiData?.tenorBulan,
      });
      setDinamisLoanId(null);
      toast.success("Pembayaran Angsuran Dinamis Berhasil!", {
        description: `No. Kwitansi: ${res.noInvoice}`,
      });
    },
    onError: (err: any) => {
      toast.error("Gagal Memproses Pembayaran", {
        description: err.message || "Terjadi kesalahan saat memproses pembayaran",
      });
    },
  });

  // Export to Excel / CSV
  const handleExportExcel = () => {
    if (rekapBulananList.length === 0) {
      toast.info("Tidak ada data angsuran pada periode ini.");
      return;
    }

    const headers = [
      "No",
      "Nama Pengangsur",
      "Pangkat",
      "NRP / NIP",
      "Bulan Ke",
      "Angsuran Pokok (Rp)",
      "Bunga Pinjaman (Rp)",
      "Total Tagihan (Rp)",
      "Jatuh Tempo",
      "Tanggal Bayar",
      "No. Kwitansi Invoice",
      "Status Pembayaran",
    ];

    const rows = rekapBulananList.map((item, idx) => {
      const formattedRank = formatPangkatKorps(item.pangkat, item.korps, item.kategoriPangkat);
      return [
        idx + 1,
        item.namaAnggota,
        formattedRank,
        `'${item.nrpNip}`,
        item.bulanKe,
        item.pokok,
        item.bunga,
        item.total,
        item.jatuhTempo ? new Date(item.jatuhTempo).toLocaleDateString("id-ID") : "-",
        item.tanggalBayar ? new Date(item.tanggalBayar).toLocaleDateString("id-ID") : "-",
        item.noInvoice || "-",
        item.dibayar ? "Lunas" : "Belum Bayar",
      ];
    });

    const filename = `Rekap_Angsuran_${BULAN_NAMES[selectedBulan - 1]}_${selectedTahun}`;
    exportToCSV(filename, headers, rows);
    toast.success(`Rekap angsuran berhasil diekspor: ${filename}.csv`);
  };

  const totalTagihanBulan = rekapBulananList.reduce((acc, curr) => acc + curr.total, 0);
  const totalTerbayarBulan = rekapBulananList
    .filter((a) => a.dibayar)
    .reduce((acc, curr) => acc + curr.total, 0);

  if (isAnggota) {
    // ============================
    // TAMPILAN PERSONAL ANGGOTA
    // ============================
    // Saring HANYA pinjaman yang diajukan oleh / milik anggota yang sedang login
    const myLoans = activeLoans.filter((l) => {
      if (currentMember && (l.anggotaId === currentMember.id || l.anggota?.id === currentMember.id)) {
        return true;
      }
      if (user?.username) {
        const cleanUsername = user.username.toLowerCase().trim();
        const nrpAnggota = (l.anggota?.nrpNip || "").toLowerCase().trim();
        if (nrpAnggota === cleanUsername) return true;
      }
      if (user?.id && (l.anggotaId === user.id || l.anggota?.id === user.id)) {
        return true;
      }
      if (user?.namaLengkap && l.anggota?.nama) {
        const cleanUser = cleanNamaPersonel(user.namaLengkap).toLowerCase();
        const cleanA = cleanNamaPersonel(l.anggota.nama).toLowerCase();
        if (cleanA === cleanUser || (cleanUser.length > 3 && (cleanA.includes(cleanUser) || cleanUser.includes(cleanA)))) {
          return true;
        }
      }
      return false;
    });
    const myAngsuranAll = myLoans.flatMap((l) => (l.angsuran || []).map((a: any) => ({ ...a, pinjaman: l })));
    const totalPinjamanSaya = myLoans.reduce((acc, l) => acc + Number(l.nominal || 0), 0);
    const sisaPokokSaya = myLoans.reduce((acc, l) => acc + Number(l.sisaPokok ?? l.nominal ?? 0), 0);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const angsuranBulanIni = myAngsuranAll.find(
      (a) =>
        new Date(a.jatuhTempo).getMonth() === currentMonth &&
        new Date(a.jatuhTempo).getFullYear() === currentYear,
    ) || myAngsuranAll.find((a) => !a.dibayar);
    const tagihanBulanIni = angsuranBulanIni ? Number(angsuranBulanIni.total || 0) : 0;
    const sudahBayarBulanIni = angsuranBulanIni?.dibayar ?? true;

    return (
      <div className="space-y-6">
        <PageHeader
          title="Riwayat Angsuran Saya"
          description="Jadwal cicilan, riwayat pembayaran, dan kwitansi pinjaman USIPA Anda"
        />

        {/* Ringkasan Personal */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardDescription>Total Pinjaman Saya</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              {loadingLoans ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : (
                <p className="text-xl font-extrabold">{formatRp(totalPinjamanSaya)}</p>
              )}
              <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
                <DollarSign className="size-4" />
              </span>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardDescription>Sisa Pokok Pinjaman</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              {loadingLoans ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : (
                <p className="text-xl font-extrabold text-destructive">{formatRp(sisaPokokSaya)}</p>
              )}
              <span className="grid size-9 place-items-center rounded-lg bg-destructive/10 text-destructive">
                <Receipt className="size-4" />
              </span>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardDescription>Tagihan Angsuran Bulan Ini</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              {loadingLoans ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : (
                <p className={`text-xl font-extrabold ${sudahBayarBulanIni ? "text-success" : "text-accent-foreground"}`}>
                  {formatRp(tagihanBulanIni)}
                </p>
              )}
              <span className={`grid size-9 place-items-center rounded-lg ${sudahBayarBulanIni ? "bg-success/15 text-success" : "bg-gold-soft text-accent-foreground"}`}>
                <Calendar className="size-4" />
              </span>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardDescription>Status Pembayaran Bulan Ini</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              <p className={`text-xl font-extrabold ${sudahBayarBulanIni ? "text-success" : "text-destructive"}`}>
                {myLoans.length === 0 ? "Tidak Ada Pinjaman" : sudahBayarBulanIni ? "✓ Sudah Lunas" : "⏳ Belum Bayar"}
              </p>
              <span className={`grid size-9 place-items-center rounded-lg ${sudahBayarBulanIni ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"}`}>
                <CheckCircle2 className="size-4" />
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Jadwal Angsuran Per Pinjaman */}
        {loadingLoans ? (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Loader2 className="mx-auto size-6 animate-spin mb-2 text-primary" />
              Memuat jadwal angsuran...
            </CardContent>
          </Card>
        ) : myLoans.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              Anda belum memiliki pinjaman aktif. Ajukan melalui menu Pengajuan USIPA.
            </CardContent>
          </Card>
        ) : (
          myLoans.map((loan) => {
            const angsuranList = loan.angsuran || [];
            const lunas = angsuranList.filter((a: any) => a.dibayar).length;
            const total = angsuranList.length;
            return (
              <Card key={loan.id} className="shadow-card">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Jadwal Angsuran
                      <span className="font-mono text-sm text-muted-foreground">
                        #{loan.id.slice(0, 8).toUpperCase()}
                      </span>
                    </CardTitle>
                    <CardDescription>
                      Plafon {formatRp(Number(loan.nominal))} · Tenor {loan.tenorBulan} bulan ·{" "}
                      {lunas}/{total} cicilan lunas · Sisa Pokok {formatRp(Number(loan.sisaPokok ?? loan.nominal))}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-9 text-xs border-success/40 bg-success/10 text-success hover:bg-success/20 font-semibold"
                    onClick={() => {
                      const headers = ["Ke-", "Jatuh Tempo", "Pokok", "Bunga", "Total", "Tanggal Bayar", "No. Invoice", "Status"];
                      const rows = angsuranList.map((a: any) => [
                        a.bulanKe || a.angsuranKe,
                        a.jatuhTempo ? new Date(a.jatuhTempo).toLocaleDateString("id-ID") : "-",
                        Number(a.pokok || 0),
                        Number(a.bunga || 0),
                        Number(a.total || 0),
                        a.tanggalBayar ? new Date(a.tanggalBayar).toLocaleDateString("id-ID") : "-",
                        a.noInvoice || "-",
                        a.dibayar ? "Lunas" : "Belum Bayar",
                      ]);
                      exportToCSV(`Angsuran_${loan.id.slice(0, 8).toUpperCase()}`, headers, rows);
                    }}
                  >
                    <FileSpreadsheet className="size-4" /> Ekspor Kwitansi
                  </Button>
                </CardHeader>
                <CardContent className="overflow-x-auto p-0">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="w-12 text-center">Bulan</TableHead>
                        <TableHead>Jatuh Tempo</TableHead>
                        <TableHead className="text-right">Pokok</TableHead>
                        <TableHead className="text-right">Bunga (1%)</TableHead>
                        <TableHead className="text-right">Total Tagihan</TableHead>
                        <TableHead>Tanggal Bayar</TableHead>
                        <TableHead>No. Kwitansi</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {angsuranList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                            Belum ada jadwal angsuran untuk pinjaman ini.
                          </TableCell>
                        </TableRow>
                      ) : (
                        angsuranList.map((item: any) => (
                          <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="font-semibold text-center">{item.bulanKe || item.angsuranKe}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {item.jatuhTempo ? new Date(item.jatuhTempo).toLocaleDateString("id-ID") : "-"}
                            </TableCell>
                            <TableCell className="text-right font-medium">{formatRp(Number(item.pokok || 0))}</TableCell>
                            <TableCell className="text-right font-medium">{formatRp(Number(item.bunga || 0))}</TableCell>
                            <TableCell className="text-right font-bold text-foreground">
                              {formatRp(Number(item.total || 0))}
                            </TableCell>
                            <TableCell className="text-xs">
                              {item.tanggalBayar ? (
                                <span className="text-success font-semibold">
                                  {new Date(item.tanggalBayar).toLocaleDateString("id-ID")}
                                </span>
                              ) : (
                                <span className="text-muted-foreground italic">-</span>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {item.noInvoice || "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.dibayar ? (
                                <Badge variant="outline" className="border-success/30 bg-success/15 text-success text-[11px] font-semibold">
                                  Lunas
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[11px]">
                                  Belum Bayar
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengelolaan Angsuran &amp; Pembayaran Dinamis"
        description="Kelola pembayaran cicilan fleksibel, alokasi prioritas bunga, opsi pelunasan dipercepat (2x bunga), masa toleransi 2 bulan, dan eksekusi potong juru bayar."
      />

      <Tabs defaultValue="rekap" className="space-y-4">
        <TabsList className="bg-muted/80 p-1">
          <TabsTrigger value="rekap" className="gap-2 text-xs">
            <Receipt className="size-4" /> Rekap Bulanan Periode
          </TabsTrigger>
          <TabsTrigger value="berjalan" className="gap-2 text-xs">
            <Calendar className="size-4" /> Daftar Pinjaman Berjalan &amp; Jadwal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rekap" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardDescription>Total Tagihan Periode {BULAN_NAMES[selectedBulan - 1]}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-extrabold text-foreground">{formatRp(totalTagihanBulan)}</p>
                <p className="text-xs text-muted-foreground mt-1">Total {rekapBulananList.length} tagihan</p>
              </CardContent>
            </Card>
            <Card className="shadow-card border-success/20">
              <CardHeader className="pb-2">
                <CardDescription>Sudah Terbayar</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-extrabold text-success">{formatRp(totalTerbayarBulan)}</p>
                <p className="text-xs text-muted-foreground mt-1">{rekapBulananList.filter((a) => a.dibayar).length} lunas</p>
              </CardContent>
            </Card>
            <Card className="shadow-card border-destructive/20">
              <CardHeader className="pb-2">
                <CardDescription>Sisa Belum Dibayar</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-extrabold text-destructive">{formatRp(Math.max(0, totalTagihanBulan - totalTerbayarBulan))}</p>
                <p className="text-xs text-muted-foreground mt-1">{rekapBulananList.filter((a) => !a.dibayar).length} menunggu</p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-card">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
              <div>
                <CardTitle>Daftar Angsuran Masuk Periode {BULAN_NAMES[selectedBulan - 1]} {selectedTahun}</CardTitle>
                <CardDescription>Rincian pengangsur, jatuh tempo, tanggal bayar realisasi, dan aksi bayar dinamis</CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select value={String(selectedBulan)} onValueChange={(v) => setSelectedBulan(Number(v))}>
                  <SelectTrigger className="w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BULAN_NAMES.map((b, i) => <SelectItem key={i+1} value={String(i+1)}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={String(selectedTahun)} onValueChange={(v) => setSelectedTahun(Number(v))}>
                  <SelectTrigger className="w-24 h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[2025, 2026, 2027].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={handleExportExcel} className="h-9 gap-1.5 text-xs border-success/40 text-success"><FileSpreadsheet className="size-4" /> Ekspor</Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-12">No.</TableHead>
                    <TableHead>Nama Pengangsur</TableHead>
                    <TableHead>Pangkat / Gol</TableHead>
                    <TableHead>NRP / NIP</TableHead>
                    <TableHead>Total Angsuran</TableHead>
                    <TableHead className="text-right">Aksi / Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingBulanan ? (
                    <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground"><Loader2 className="mx-auto size-6 animate-spin mb-2 text-primary" />Memuat data...</TableCell></TableRow>
                  ) : rekapBulananList.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs">{idx + 1}</TableCell>
                      <TableCell className="font-semibold">{item.namaAnggota}</TableCell>
                      <TableCell className="text-xs">{formatPangkatKorps(item.pangkat, item.korps, item.kategoriPangkat)}</TableCell>
                      <TableCell className="font-mono text-xs">{item.nrpNip}</TableCell>
                      <TableCell className="font-bold">{formatRp(item.total)}</TableCell>
                      <TableCell className="text-right">
                        {item.dibayar ? (
                          <Badge variant="outline" className="border-success/30 bg-success/15 text-success text-[11px] font-semibold">Lunas</Badge>
                        ) : isBendaharaOrAdmin ? (
                          <Button size="sm" onClick={() => setDinamisLoanId(item.pinjamanId || item.pinjaman?.id)} className="h-8 text-xs bg-primary gap-1"><Calculator className="size-3.5" /> Bayar Dinamis</Button>
                        ) : (
                          <Badge variant="outline" className="text-[11px]">Belum Bayar</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="berjalan" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Daftar Pinjaman Berjalan Seluruh Anggota</CardTitle>
              <CardDescription>Pantau sisa pokok pinjaman, masa toleransi 2 bulan, dan bayar dinamis</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>No. Pinjaman</TableHead>
                    <TableHead>Nama Anggota</TableHead>
                    <TableHead>Sisa Pokok</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeLoans.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-mono text-xs font-semibold">{l.id.slice(0, 8).toUpperCase()}</TableCell>
                      <TableCell className="font-medium">{formatNamaLengkapDinas(l.anggota?.nama, l.anggota?.pangkat?.nama, l.anggota?.korps?.nama, l.anggota?.pangkat?.kategori)}</TableCell>
                      <TableCell className="font-bold text-primary">{formatRp(Number(l.sisaPokok ?? l.nominal))}</TableCell>
                      <TableCell className="text-right flex items-center justify-end gap-1.5">
                        {isBendaharaOrAdmin && l.status !== "LUNAS" && (
                          <Button size="sm" onClick={() => setDinamisLoanId(l.id)} className="h-8 text-xs bg-primary gap-1"><Calculator className="size-3.5" /> Bayar</Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => setSelectedLoan(l)} className="h-8 text-xs"><Calendar className="mr-1 size-3.5" /> Jadwal</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!dinamisLoanId} onOpenChange={(o) => !o && setDinamisLoanId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg"><Calculator className="size-5 text-primary" /> Kelola Pembayaran Angsuran Dinamis</DialogTitle>
            <DialogDescription>Alokasi pembayaran mengutamakan pelunasan bunga/jasa terlebih dahulu, sisanya mengurangi angsuran pokok.</DialogDescription>
          </DialogHeader>

          {loadingKalkulasi ? <div className="py-12 text-center text-muted-foreground"><Loader2 className="mx-auto size-6 animate-spin mb-2" /> Menghitung...</div> : kalkulasiData && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border bg-muted/40 p-3.5">
                <span className="font-bold text-sm">{formatNamaLengkapDinas(kalkulasiData.anggota?.nama, kalkulasiData.anggota?.pangkat, kalkulasiData.anggota?.korps)}</span>
                <span className="text-xs text-muted-foreground font-mono block">NRP: {kalkulasiData.anggota?.nrpNip} · Sisa: {formatRp(kalkulasiData.sisaPokok)}</span>
              </div>
              <Input type="number" value={nominalBayarInput || ""} onChange={(e) => setNominalBayarInput(Number(e.target.value))} placeholder="Masukkan jumlah..." className="h-10 text-base font-bold font-mono" />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setIsPelunasanDipercepat(false); setNominalBayarInput(kalkulasiData.totalKewajibanBulanIni); }}>Normal</Button>
                <Button variant="outline" size="sm" onClick={() => { setIsPelunasanDipercepat(true); setNominalBayarInput(kalkulasiData.pelunasanDipercepat.totalBayar); }}>Pelunasan (2x Bunga)</Button>
              </div>
              {liveCalculation && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between font-bold"><span>Total Bayar:</span><span>{formatRp(nominalBayarInput)}</span></div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 bg-background border">Bunga: {formatRp(liveCalculation.porsiBunga)}</div>
                    <div className="p-2 bg-background border">Pokok: {formatRp(liveCalculation.porsiPokok)}</div>
                  </div>
                </div>
              )}
              <Input type="date" value={tanggalBayarInput} onChange={(e) => setTanggalBayarInput(e.target.value)} />
            </div>
          )}
          <DialogFooter>
            <Button
              disabled={bayarDinamisMutation.isPending || !nominalBayarInput || nominalBayarInput <= 0}
              onClick={() => setConfirmDinamisOpen(true)}
              className="bg-primary gap-2"
            >
              <CheckCircle2 className="size-4" /> Proses Pembayaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* POPUP ALERT KONFIRMASI PEMBAYARAN ANGSURAN DINAMIS */}
      {/* ============================================================== */}
      <ConfirmActionDialog
        open={confirmDinamisOpen}
        onOpenChange={setConfirmDinamisOpen}
        title={isPelunasanDipercepat ? "Konfirmasi Pelunasan Dipercepat (2x Bunga)" : "Konfirmasi Pembayaran Angsuran Dinamis"}
        description={
          isPelunasanDipercepat
            ? "Apakah Anda yakin ingin memproses pelunasan dipercepat? Seluruh sisa kewajiban pinjaman akan ditutup dan status pinjaman otomatis dinyatakan LUNAS."
            : "Pastikan nominal pembayaran dan alokasi dana telah diverifikasi sebelum memproses transaksi debit kas koperasi."
        }
        confirmText={isPelunasanDipercepat ? "Ya, Eksekusi Pelunasan" : "Ya, Proses Pembayaran"}
        cancelText="Batal"
        variant={isPelunasanDipercepat ? "success" : "default"}
        isLoading={bayarDinamisMutation.isPending}
        details={[
          {
            label: "Personel Pengangsur",
            value: kalkulasiData?.anggota ? formatNamaLengkapDinas(kalkulasiData.anggota.nama, kalkulasiData.anggota.pangkat, kalkulasiData.anggota.korps) : "-",
          },
          {
            label: "NRP / NIP",
            value: kalkulasiData?.anggota?.nrpNip || "-",
          },
          {
            label: "Nominal Disetorkan",
            value: formatRp(nominalBayarInput),
          },
          {
            label: "Alokasi Pelunasan Bunga",
            value: formatRp(liveCalculation?.porsiBunga || 0),
          },
          {
            label: "Alokasi Pengurangan Pokok",
            value: formatRp(liveCalculation?.porsiPokok || 0),
          },
          {
            label: "Sisa Pokok Setelah Bayar",
            value: formatRp(liveCalculation?.sisaPokokBaru || 0),
          },
          {
            label: "Tanggal Setoran",
            value: tanggalBayarInput,
          },
        ]}
        onConfirm={async () => {
          setConfirmDinamisOpen(false);
          bayarDinamisMutation.mutate({
            nominalBayar: Number(nominalBayarInput),
            isPelunasanDipercepat,
            tanggalBayar: tanggalBayarInput,
          });
        }}
      />

      <Dialog open={!!receiptData} onOpenChange={(o) => !o && setReceiptData(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Kwitansi Resmi</DialogTitle></DialogHeader>
          {receiptData && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border p-4 space-y-2 text-xs">
                <div className="flex justify-between font-bold"><span>Total Disetor:</span><span>{formatRp(receiptData.nominalBayar)}</span></div>
                <div className="flex justify-between"><span>Sisa Pokok Baru:</span><span>{formatRp(receiptData.alokasi.sisaPokokBaru)}</span></div>
              </div>
            </div>
          )}
          <DialogFooter><Button onClick={() => setReceiptData(null)}>Selesai</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
