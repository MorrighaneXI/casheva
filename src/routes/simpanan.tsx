import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  RefreshCw,
  CheckCircle2,
  FileSpreadsheet,
  Settings2,
  Save,
  Filter,
  PiggyBank,
  Wallet,
  Coins,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { useSession } from "@/components/session-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea";
import { formatRp, formatPangkatKorps, cleanNamaPersonel, formatNamaLengkapDinas } from "@/lib/casheva-data";
import { apiAnggota, apiSimpanan, type SimpananRekapItem } from "@/lib/api";
import { exportToCSV } from "@/lib/export-excel";

export const Route = createFileRoute("/simpanan")({
  head: () => ({
    meta: [
      { title: "Transaksi & Rekap Simpanan — Casheva Koperasi TNI AD" },
      {
        name: "description",
        content:
          "Kelola simpanan pokok, wajib, sukarela, dan simpanan khusus dengan pengaturan nominal dinamis oleh Bendahara.",
      },
      { property: "og:title", content: "Transaksi Simpanan — Casheva" },
      {
        property: "og:description",
        content: "Mutasi simpanan anggota koperasi TNI AD dan ekspor excel bulanan.",
      },
    ],
  }),
  component: SimpananPage,
});

const BULAN_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function SimpananPage() {
  const queryClient = useQueryClient();
  const { role, isAdmin } = useSession();
  const isBendaharaOrAdmin = isAdmin || role === "Bendahara" || role === "Admin Koperasi";

  const [activeTab, setActiveTab] = useState<"saldo" | "bulanan" | "pengaturan">("saldo");
  const [search, setSearch] = useState("");

  // Filter Rekap Bulanan
  const currentDate = new Date();
  const [selectedBulan, setSelectedBulan] = useState<number>(currentDate.getMonth() + 1);
  const [selectedTahun, setSelectedTahun] = useState<number>(currentDate.getFullYear());

  // Dialog Setor Simpanan Dinamis (Bendahara)
  const [openSetorModal, setOpenSetorModal] = useState(false);
  const [setorAnggotaId, setSetorAnggotaId] = useState("");
  const [setorJenis, setSetorJenis] = useState<"POKOK" | "WAJIB" | "SUKARELA" | "KHUSUS">("WAJIB");
  const [setorNominal, setSetorNominal] = useState(100_000);
  const [setorKeterangan, setSetorKeterangan] = useState("");

  // State Pengaturan Dinamis Simpanan
  const [editPokok, setEditPokok] = useState<number>(50_000);
  const [editWajib, setEditWajib] = useState<number>(100_000);
  const [editKhusus, setEditKhusus] = useState<number>(0);

  // Queries
  const { data: rekapList = [], isLoading: loadingSaldo } = useQuery({
    queryKey: ["simpanan-rekap"],
    queryFn: () => apiSimpanan.getRekap(),
  });

  const { data: anggotaList = [] } = useQuery({
    queryKey: ["anggota-list"],
    queryFn: () => apiAnggota.findAll(true),
  });

  const { data: pengaturanSimpanan } = useQuery({
    queryKey: ["pengaturan-simpanan"],
    queryFn: async () => {
      const res = await apiSimpanan.getPengaturan();
      if (res) {
        setEditPokok(res.nominalSimpananPokok ?? 50_000);
        setEditWajib(res.nominalSimpananWajib ?? 100_000);
        setEditKhusus(res.nominalSimpananKhusus ?? 0);
      }
      return res;
    },
  });

  const { data: rekapBulananList = [], isLoading: loadingBulanan } = useQuery({
    queryKey: ["simpanan-rekap-bulanan", selectedBulan, selectedTahun],
    queryFn: () => apiSimpanan.getRekapBulanan(selectedBulan, selectedTahun),
  });

  // Mutations
  const massalMutation = useMutation({
    mutationFn: () => apiSimpanan.sukarelaMassal(),
    onSuccess: (res) => {
      toast.success("Simpanan Sukarela Massal Berhasil", {
        description: `${res.message} - Total: ${formatRp(res.totalNominal)}`,
      });
      queryClient.invalidateQueries({ queryKey: ["simpanan-rekap"] });
      queryClient.invalidateQueries({ queryKey: ["simpanan-rekap-bulanan"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
    onError: (err: any) => {
      toast.error("Gagal menjalankan potongan massal", { description: err.message });
    },
  });

  const updatePengaturanMutation = useMutation({
    mutationFn: () =>
      apiSimpanan.updatePengaturan({
        nominalPokok: editPokok,
        nominalWajib: editWajib,
        nominalKhusus: editKhusus,
      }),
    onSuccess: () => {
      toast.success("Pengaturan Nominal Simpanan Berhasil Disimpan", {
        description: `Pokok: ${formatRp(editPokok)}, Wajib: ${formatRp(editWajib)}, Khusus: ${formatRp(editKhusus)}`,
      });
      queryClient.invalidateQueries({ queryKey: ["pengaturan-simpanan"] });
    },
    onError: (err: any) => {
      toast.error("Gagal menyimpan pengaturan", { description: err.message });
    },
  });

  const setorDinamisMutation = useMutation({
    mutationFn: () =>
      apiSimpanan.setor({
        anggotaId: setorAnggotaId,
        jenis: setorJenis,
        nominal: setorNominal,
        keterangan: setorKeterangan || `Setoran ${setorJenis.toLowerCase()} oleh Bendahara`,
      }),
    onSuccess: () => {
      toast.success(`Setoran Simpanan ${setorJenis} Berhasil!`, {
        description: `Nominal ${formatRp(setorNominal)} berhasil dicatat ke pembukuan.`,
      });
      queryClient.invalidateQueries({ queryKey: ["simpanan-rekap"] });
      queryClient.invalidateQueries({ queryKey: ["simpanan-rekap-bulanan"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setOpenSetorModal(false);
      setSetorAnggotaId("");
      setSetorKeterangan("");
    },
    onError: (err: any) => {
      toast.error("Gagal mencatat setoran", { description: err.message });
    },
  });

  // Export to Excel / CSV
  const handleExportExcel = () => {
    if (rekapBulananList.length === 0) {
      toast.info("Tidak ada data untuk diekspor pada periode ini.");
      return;
    }

    const headers = [
      "No",
      "Nama Personel",
      "Pangkat",
      "NRP / NIP",
      "Jenis Simpanan",
      "Tipe Transaksi",
      "Nominal (Rp)",
      "Tanggal Transaksi",
      "No. Invoice / Kwitansi",
      "Keterangan",
    ];

    const rows = rekapBulananList.map((item, idx) => {
      const formattedRank = formatPangkatKorps(item.pangkat, item.korps, item.kategoriPangkat);
      return [
        idx + 1,
        item.namaAnggota,
        formattedRank,
        `'${item.nrpNip}`,
        item.jenis,
        item.tipe,
        item.nominal,
        new Date(item.tanggal).toLocaleDateString("id-ID"),
        item.noInvoice || "-",
        item.keterangan || "-",
      ];
    });

    const filename = `Rekap_Simpanan_${BULAN_NAMES[selectedBulan - 1]}_${selectedTahun}`;
    exportToCSV(filename, headers, rows);
    toast.success(`Rekap simpanan berhasil diekspor: ${filename}.csv`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`NRP disalin: ${text}`);
  };

  // Kalkulasi total tanpa NaN
  const totalPokok = useMemo(
    () => rekapList.reduce((acc, row) => acc + Number(row.totalPokok ?? row.simpananPokok ?? 0), 0),
    [rekapList],
  );
  const totalWajib = useMemo(
    () => rekapList.reduce((acc, row) => acc + Number(row.totalWajib ?? row.simpananWajib ?? 0), 0),
    [rekapList],
  );
  const totalSukarela = useMemo(
    () =>
      rekapList.reduce(
        (acc, row) =>
          acc + Number(row.totalSukarela ?? row.simpananSukarela ?? 0) + Number(row.totalKhusus ?? 0),
        0,
      ),
    [rekapList],
  );

  const filteredRekap = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rekapList;
    return rekapList.filter(
      (r) =>
        r.nama.toLowerCase().includes(q) ||
        r.nrpNip.includes(q) ||
        (r.pangkat || "").toLowerCase().includes(q) ||
        (r.korps || "").toLowerCase().includes(q),
    );
  }, [rekapList, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transaksi & Rekap Simpanan Koperasi"
        description="Pengelolaan simpanan pokok, wajib, sukarela, dan khusus dengan pengaturan nominal dinamis oleh Bendahara."
        actions={
          <div className="flex flex-wrap gap-2">
            {isBendaharaOrAdmin && (
              <>
                <Button
                  variant="outline"
                  disabled={massalMutation.isPending}
                  onClick={() => massalMutation.mutate()}
                >
                  {massalMutation.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 size-4" />
                  )}
                  Jalankan Batch Tgl 5 (Sukarela)
                </Button>
                <Button onClick={() => setOpenSetorModal(true)} className="shadow-md">
                  <Plus className="mr-2 size-4" /> Catat Setoran Simpanan
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card card-interactive border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Coins className="size-4 text-primary" /> Total Simpanan Pokok
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-primary">{formatRp(totalPokok)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Nominal aktif: {formatRp(pengaturanSimpanan?.nominalSimpananPokok ?? 50_000)} / anggota
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card card-interactive border-blue-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Wallet className="size-4 text-blue-600" /> Total Simpanan Wajib
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-foreground">{formatRp(totalWajib)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Nominal aktif: {formatRp(pengaturanSimpanan?.nominalSimpananWajib ?? 100_000)} / bulan
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card card-interactive border-success/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <PiggyBank className="size-4 text-success" /> Total Simpanan Sukarela &amp; Khusus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-success">{formatRp(totalSukarela)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Tabungan sukarela potong gaji &amp; simpanan khusus
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="saldo">Rekap Saldo Anggota</TabsTrigger>
          <TabsTrigger value="bulanan">Rekap Mutasi Bulanan</TabsTrigger>
          {isBendaharaOrAdmin && <TabsTrigger value="pengaturan">Pengaturan Dinamis</TabsTrigger>}
        </TabsList>

        {/* ============================================================== */}
        {/* TAB 1: REKAP SALDO ANGGOTA */}
        {/* ============================================================== */}
        <TabsContent value="saldo" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-3">
              <div>
                <CardTitle>Rekap Saldo Simpanan Per Anggota</CardTitle>
                <CardDescription>
                  Akumulasi seluruh simpanan (Pokok, Wajib, Sukarela) yang tersimpan di kas koperasi
                </CardDescription>
              </div>
              <div className="w-full sm:w-64">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari anggota / NRP..."
                />
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-12">No.</TableHead>
                    <TableHead>Nama Anggota</TableHead>
                    <TableHead>Pangkat / Golongan</TableHead>
                    <TableHead>NRP / NIP</TableHead>
                    <TableHead>Satminkal</TableHead>
                    <TableHead className="text-right">Pokok</TableHead>
                    <TableHead className="text-right">Wajib</TableHead>
                    <TableHead className="text-right">Sukarela / Khusus</TableHead>
                    <TableHead className="text-right font-bold">Total Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingSaldo ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                        <Loader2 className="mx-auto size-6 animate-spin mb-2 text-primary" />
                        Memuat data saldo simpanan...
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRekap.map((r, idx) => {
                      const pokok = Number(r.totalPokok ?? r.simpananPokok ?? 0);
                      const wajib = Number(r.totalWajib ?? r.simpananWajib ?? 0);
                      const sukarela =
                        Number(r.totalSukarela ?? r.simpananSukarela ?? 0) + Number(r.totalKhusus ?? 0);
                      const total = Number(r.totalSimpanan ?? (pokok + wajib + sukarela));
                      const formattedPangkat = formatPangkatKorps(r.pangkat, r.korps, r.kategoriPangkat);

                      return (
                        <TableRow key={r.anggotaId || r.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="font-semibold text-foreground">{cleanNamaPersonel(r.nama)}</TableCell>
                          <TableCell className="text-xs font-medium text-foreground">
                            {formattedPangkat}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-semibold">
                            <button
                              onClick={() => copyToClipboard(r.nrpNip)}
                              className="flex items-center gap-1 text-primary hover:underline text-left"
                              title="Klik untuk menyalin NRP"
                            >
                              {r.nrpNip}
                              <Copy className="size-3 opacity-60" />
                            </button>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{r.satminkal || "Disinfolahtad"}</TableCell>
                          <TableCell className="text-right font-medium">{formatRp(pokok)}</TableCell>
                          <TableCell className="text-right font-medium">{formatRp(wajib)}</TableCell>
                          <TableCell className="text-right text-success font-medium">
                            {formatRp(sukarela)}
                          </TableCell>
                          <TableCell className="text-right font-bold text-foreground">
                            {formatRp(total)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                  {!loadingSaldo && filteredRekap.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                        Tidak ada data simpanan ditemukan.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 2: REKAP MUTASI BULANAN & EKSPOR EXCEL */}
        {/* ============================================================== */}
        <TabsContent value="bulanan" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
              <div>
                <CardTitle>Rincian Mutasi Simpanan Bulanan</CardTitle>
                <CardDescription>
                  Daftar transaksi setoran simpanan per bulan beserta rincian penyetor dan tanggal transaksi
                </CardDescription>
              </div>

              {/* Filter Bulan & Tahun + Tombol Ekspor */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Select
                    value={String(selectedBulan)}
                    onValueChange={(v) => setSelectedBulan(Number(v))}
                  >
                    <SelectTrigger className="w-32 h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BULAN_NAMES.map((b, idx) => (
                        <SelectItem key={idx + 1} value={String(idx + 1)}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={String(selectedTahun)}
                    onValueChange={(v) => setSelectedTahun(Number(v))}
                  >
                    <SelectTrigger className="w-24 h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2025, 2026, 2027].map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  onClick={handleExportExcel}
                  className="h-9 gap-1.5 text-xs border-success/40 bg-success/10 text-success hover:bg-success/20 font-semibold"
                >
                  <FileSpreadsheet className="size-4" /> Ekspor ke Excel (.csv)
                </Button>
              </div>
            </CardHeader>

            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-12">No.</TableHead>
                    <TableHead>Nama Personel</TableHead>
                    <TableHead>Pangkat / Golongan</TableHead>
                    <TableHead>NRP / NIP</TableHead>
                    <TableHead>Jenis Simpanan</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                    <TableHead>Tanggal Transaksi</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingBulanan ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                        <Loader2 className="mx-auto size-6 animate-spin mb-2 text-primary" />
                        Memuat mutasi simpanan periode {BULAN_NAMES[selectedBulan - 1]} {selectedTahun}...
                      </TableCell>
                    </TableRow>
                  ) : (
                    rekapBulananList.map((item, idx) => {
                      const formattedRank = formatPangkatKorps(item.pangkat, item.korps, item.kategoriPangkat);
                      return (
                        <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="font-semibold text-foreground">{item.namaAnggota}</TableCell>
                          <TableCell className="text-xs font-medium text-foreground">
                            {formattedRank}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-semibold">
                            <button
                              onClick={() => copyToClipboard(item.nrpNip)}
                              className="flex items-center gap-1 text-primary hover:underline text-left"
                              title="Klik untuk menyalin NRP"
                            >
                              {item.nrpNip}
                              <Copy className="size-3 opacity-60" />
                            </button>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                item.jenis === "POKOK"
                                  ? "border-primary/40 bg-primary/10 text-primary text-[10px]"
                                  : item.jenis === "WAJIB"
                                  ? "border-blue-500/40 bg-blue-500/10 text-blue-600 text-[10px]"
                                  : item.jenis === "KHUSUS"
                                  ? "border-amber-500/40 bg-amber-500/10 text-amber-600 text-[10px]"
                                  : "border-success/40 bg-success/10 text-success text-[10px]"
                              }
                            >
                              {item.jenis}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-foreground">
                            {formatRp(item.nominal)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {new Date(item.tanggal).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                            {item.keterangan || "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                  {!loadingBulanan && rekapBulananList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                        Tidak ada transaksi simpanan pada {BULAN_NAMES[selectedBulan - 1]} {selectedTahun}.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 3: PENGATURAN NOMINAL DINAMIS (BENDAHARA / ADMIN) */}
        {/* ============================================================== */}
        {isBendaharaOrAdmin && (
          <TabsContent value="pengaturan" className="space-y-4">
            <Card className="shadow-card max-w-2xl">
              <CardHeader>
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Settings2 className="size-5" />
                  <CardTitle>Pengaturan Nominal Simpanan Koperasi (Dinamis)</CardTitle>
                </div>
                <CardDescription>
                  Khusus Bendahara &amp; Admin: Ubah nominal standar simpanan pokok dan wajib sewaktu-waktu sesuai keputusan Rapat Anggota Tahunan (RAT) / Kebijakan Pengurus.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Nominal Simpanan Pokok (Sekali saat pendaftaran)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={10_000}
                    value={editPokok}
                    onChange={(e) => setEditPokok(Number(e.target.value) || 0)}
                    className="h-11 font-semibold"
                  />
                  <p className="text-xs text-muted-foreground">
                    Terbilang: <strong>{formatRp(editPokok)}</strong> (Default Juknis: Rp 50.000)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Nominal Simpanan Wajib (Rutin bulanan / awal)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={10_000}
                    value={editWajib}
                    onChange={(e) => setEditWajib(Number(e.target.value) || 0)}
                    className="h-11 font-semibold"
                  />
                  <p className="text-xs text-muted-foreground">
                    Terbilang: <strong>{formatRp(editWajib)}</strong> (Default Juknis: Rp 100.000)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Nominal Acuan Simpanan Khusus (Opsional / Fleksibel)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={50_000}
                    value={editKhusus}
                    onChange={(e) => setEditKhusus(Number(e.target.value) || 0)}
                    className="h-11 font-semibold"
                  />
                  <p className="text-xs text-muted-foreground">
                    Terbilang: <strong>{formatRp(editKhusus)}</strong> (Program Khusus Hari Raya / Qurban)
                  </p>
                </div>

                <Button
                  size="lg"
                  disabled={updatePengaturanMutation.isPending}
                  onClick={() => updatePengaturanMutation.mutate()}
                  className="w-full gap-2 font-semibold shadow-md"
                >
                  {updatePengaturanMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Simpan Perubahan Pengaturan Simpanan
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Dialog Catat Setoran Simpanan Dinamis */}
      <Dialog open={openSetorModal} onOpenChange={setOpenSetorModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Catat Pembayaran / Setoran Simpanan</DialogTitle>
            <DialogDescription>
              Input setoran simpanan pokok, wajib, sukarela, atau khusus untuk anggota secara dinamis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Pilih Anggota</Label>
              <Select value={setorAnggotaId} onValueChange={setSetorAnggotaId}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Pilih Anggota Penyetor --" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {anggotaList.map((a) => {
                    const formatted = formatPangkatKorps(a.pangkat?.nama, a.korps?.nama, a.pangkat?.kategori);
                    return (
                      <SelectItem key={a.id} value={a.id}>
                        {formatNamaLengkapDinas(a.nama, a.pangkat?.nama, a.korps?.nama, a.pangkat?.kategori)} (NRP: {a.nrpNip})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Jenis Simpanan</Label>
              <Select value={setorJenis} onValueChange={(v: any) => setSetorJenis(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POKOK">Simpanan Pokok</SelectItem>
                  <SelectItem value="WAJIB">Simpanan Wajib</SelectItem>
                  <SelectItem value="SUKARELA">Simpanan Sukarela</SelectItem>
                  <SelectItem value="KHUSUS">Simpanan Khusus (Qurban/Hari Raya)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nominal Setoran</Label>
              <Input
                type="number"
                min={10_000}
                step={10_000}
                value={setorNominal}
                onChange={(e) => setSetorNominal(Number(e.target.value) || 0)}
                className="font-semibold"
              />
              <p className="text-xs text-muted-foreground">
                Terbilang: <strong>{formatRp(setorNominal)}</strong>
              </p>
            </div>

            <div className="space-y-2">
              <Label>Keterangan Transaksi</Label>
              <Textarea
                value={setorKeterangan}
                onChange={(e) => setSetorKeterangan(e.target.value)}
                placeholder="Contoh: Setoran tunai bendahara / Potong gaji bulan berjalan"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={!setorAnggotaId || setorNominal <= 0 || setorDinamisMutation.isPending}
              onClick={() => setorDinamisMutation.mutate()}
            >
              {setorDinamisMutation.isPending ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : null}
              Simpan Setoran
            </Button>
            <Button variant="outline" onClick={() => setOpenSetorModal(false)}>
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
