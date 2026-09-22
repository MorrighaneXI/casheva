import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Database,
  Users,
  Wallet,
  PiggyBank,
  HandCoins,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Search,
  Activity,
  Layers,
  FileBarChart,
  ShieldCheck,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-context";
import { useNavigate } from "@tanstack/react-router";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { apiKotama, apiMaster, type KotamaSummaryResponse } from "@/lib/api";
import { formatRp, backendRoleToFrontend } from "@/lib/casheva-data";

export const Route = createFileRoute("/monitoring-kotama")({
  head: () => ({
    meta: [
      { title: "Monitoring Kotama — Super Admin SISKOPAD TNI AD" },
      {
        name: "description",
        content: "Monitoring agregat performa seluruh Komando Utama (Kotama/Balakpus) TNI AD.",
      },
    ],
  }),
  component: MonitoringKotamaPage,
});

function MonitoringKotamaPage() {
  const [searchSatminkal, setSearchSatminkal] = useState("");
  const { startMonitoringKotama } = useSession();
  const navigate = useNavigate();

  // 1. Fetch all Kotamas for Sub-menu / Tab selector
  const { data: kotamaList = [], isLoading: loadingKotama } = useQuery({
    queryKey: ["master-kotama"],
    queryFn: () => apiMaster.getKotama(),
  });

  const [selectedKotamaId, setSelectedKotamaId] = useState<string>("");

  // Set default selected Kotama once loaded
  const activeKotamaId = selectedKotamaId || kotamaList[0]?.id || "";
  const activeKotama = kotamaList.find((k: any) => k.id === activeKotamaId) || kotamaList[0];

  const handleStartKotamaMonitoring = async () => {
    if (!activeKotama) return;
    try {
      await startMonitoringKotama({
        id: activeKotama.id,
        kode: activeKotama.kode,
        nama: activeKotama.nama,
      });
      toast.success("Mode Monitoring Aktif", {
        description: `Sedang mengamati Komando Utama ${activeKotama.nama} (Mode Tamu / Read-Only)`,
      });
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error("Gagal memulai monitoring", {
        description: err.message || "Terjadi kesalahan sistem",
      });
    }
  };

  // 2. Fetch Kotama Aggregate Summary for the selected Kotama
  const {
    data: summaryData,
    isLoading: loadingSummary,
    isFetching: fetchingSummary,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ["superadmin-kotama-summary", activeKotamaId],
    queryFn: () => apiKotama.getSummary(activeKotamaId || undefined),
    enabled: !!activeKotamaId,
  });

  // 3. Fetch Kotama Monthly Charts for the selected Kotama
  const { data: chartsData, isLoading: loadingCharts } = useQuery({
    queryKey: ["superadmin-kotama-charts", activeKotamaId],
    queryFn: () => apiKotama.getCharts(new Date().getFullYear(), activeKotamaId || undefined),
    enabled: !!activeKotamaId,
  });

  const kpi = summaryData?.kpi;
  const satminkals = summaryData?.satminkals || [];

  const filteredSatminkals = useMemo(() => {
    const q = searchSatminkal.toLowerCase().trim();
    if (!q) return satminkals;
    return satminkals.filter(
      (s: any) =>
        (s.nama || "").toLowerCase().includes(q) ||
        (s.kode || "").toLowerCase().includes(q) ||
        (s.admin?.namaLengkap || "").toLowerCase().includes(q) ||
        (s.admin?.username || "").toLowerCase().includes(q)
    );
  }, [satminkals, searchSatminkal]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoring Komando Utama (Kotama / Balakpus)"
        description="Pengawasan terpusat (Read-Only) seluruh komando utama dan satker binaan se-TNI AD"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchSummary()}
              disabled={fetchingSummary}
              className="text-xs gap-1.5 shadow-sm"
            >
              <RefreshCw className={`size-3.5 ${fetchingSummary ? "animate-spin" : ""}`} />
              Segarkan Data
            </Button>
          </div>
        }
      />

      {/* READ-ONLY SECURITY POLICY BANNER */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-sm">
        <ShieldCheck className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-sm">Mode Monitoring Eksekutif Super Admin (Read-Only)</p>
          <p className="leading-relaxed">
            Sesuai kebijakan pengawasan komando TNI AD, Super Admin berwenang memantau performa agregat seluruh Kotama/Balakpus secara objektif. Pengawasan dibatasi pada level Komando Utama tanpa hak mutasi atau intervensi langsung ke transaksi Satminkal primer.
          </p>
        </div>
      </div>

      {/* KOTAMA SUB-MENU / SELECTOR TABS */}
      <Card className="shadow-card border-primary/20">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Building2 className="size-4 text-primary" />
            Pilih Komando Utama / Balakpus (Sub-Menu Pengawasan)
          </CardTitle>
          <CardDescription className="text-xs">
            Klik pada salah satu Kotama di bawah untuk memantau ringkasan performa dan satminkal binaannya.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {loadingKotama ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
              <Loader2 className="size-4 animate-spin text-primary" /> Memuat daftar Kotama...
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {kotamaList.map((k: any) => {
                const isSelected = k.id === activeKotamaId;
                return (
                  <Button
                    key={k.id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedKotamaId(k.id)}
                    className={`h-9 text-xs font-semibold gap-1.5 transition-all ${
                      isSelected
                        ? "shadow-md shadow-primary/20"
                        : "hover:border-primary/50 text-foreground"
                    }`}
                  >
                    <Building2 className="size-3.5" />
                    {k.nama}
                    {isSelected && <CheckCircle2 className="size-3.5 ml-1" />}
                  </Button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ACTIVE KOTAMA TITLE BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-4 rounded-xl border border-border/70">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
            SEDANG DIPANTAU
          </span>
          <h2 className="text-lg font-extrabold text-foreground">
            {activeKotama?.nama || "KOMANDO UTAMA TNI AD"}
          </h2>
          <p className="text-xs text-muted-foreground">
            Kode Registrasi: <span className="font-mono font-semibold">{activeKotama?.kode || "-"}</span> · Tipe: <span className="font-semibold">{(activeKotama as any)?.tipe || "KOTAMA"}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-xs font-semibold px-2.5 py-1">
            Status: Aktif &amp; Terintegrasi
          </Badge>
          <Button
            size="sm"
            onClick={handleStartKotamaMonitoring}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-8 shadow-sm gap-1.5"
            title="Masuk ke perspektif Admin Kotama ini dalam Mode Tamu (Read-Only)"
          >
            <Eye className="size-3.5" />
            Masuk Mode Monitoring (Read-Only)
          </Button>
        </div>
      </div>

      {/* KPI STATS FOR THIS KOTAMA */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Total Anggota */}
        <Card className="shadow-card border-primary/20">
          <CardHeader className="pb-1">
            <CardDescription className="flex items-center justify-between text-xs font-semibold">
              <span>Total Personel Anggota</span>
              <Users className="size-4 text-primary" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-foreground">
              {loadingSummary ? <Loader2 className="size-5 animate-spin" /> : kpi?.totalAnggotaAktif ?? 0}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Seluruh Satminkal Binaan</p>
          </CardContent>
        </Card>

        {/* KPI 2: Total Simpanan */}
        <Card className="shadow-card border-blue-500/20">
          <CardHeader className="pb-1">
            <CardDescription className="flex items-center justify-between text-xs font-semibold">
              <span>Akumulasi Simpanan</span>
              <PiggyBank className="size-4 text-blue-500" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
              {loadingSummary ? <Loader2 className="size-5 animate-spin" /> : formatRp(kpi?.totalSimpanan ?? 0)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Pokok, Wajib &amp; Sukarela</p>
          </CardContent>
        </Card>

        {/* KPI 3: Pinjaman Berjalan */}
        <Card className="shadow-card border-amber-500/20">
          <CardHeader className="pb-1">
            <CardDescription className="flex items-center justify-between text-xs font-semibold">
              <span>Pinjaman Berjalan</span>
              <HandCoins className="size-4 text-amber-500" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {loadingSummary ? <Loader2 className="size-5 animate-spin" /> : formatRp(kpi?.pinjamanBerjalan ?? 0)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {kpi?.countPinjamanBerjalan ?? 0} Akad Pinjaman Aktif
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Kas Koperasi & SHU */}
        <Card className="shadow-card border-emerald-500/20">
          <CardHeader className="pb-1">
            <CardDescription className="flex items-center justify-between text-xs font-semibold">
              <span>Likuiditas Kas / SHU</span>
              <Wallet className="size-4 text-emerald-500" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {loadingSummary ? <Loader2 className="size-5 animate-spin" /> : formatRp(kpi?.totalKas ?? 0)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Estimasi SHU: {formatRp(kpi?.estimasiShuKotama ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* MONTHLY CHARTS FOR THIS KOTAMA */}
      <Card className="shadow-card">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <FileBarChart className="size-4 text-primary" />
            Tren Agregat Keuangan Bulanan ({activeKotama?.nama} — TA {new Date().getFullYear()})
          </CardTitle>
          <CardDescription className="text-xs">
            Pertumbuhan akumulasi simpanan, pencairan pinjaman, dan angsuran bulanan
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {loadingCharts ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-xs">
              <Loader2 className="size-6 animate-spin text-primary mr-2" /> Memuat grafik...
            </div>
          ) : !chartsData?.data || chartsData.data.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Data grafik belum tersedia untuk periode tahun ini.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartsData.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSimpananSuper" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPinjamanSuper" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAngsuranSuper" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val) => `${(val / 1_000_000).toFixed(0)}Jt`}
                  />
                  <Tooltip formatter={(value: any) => formatRp(Number(value))} />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                  <Area
                    type="monotone"
                    dataKey="simpanan"
                    name="Simpanan"
                    stroke="#2563eb"
                    fillOpacity={1}
                    fill="url(#colorSimpananSuper)"
                  />
                  <Area
                    type="monotone"
                    dataKey="pinjaman"
                    name="Pencairan Pinjaman"
                    stroke="#d97706"
                    fillOpacity={1}
                    fill="url(#colorPinjamanSuper)"
                  />
                  <Area
                    type="monotone"
                    dataKey="angsuran"
                    name="Penerimaan Angsuran"
                    stroke="#16a34a"
                    fillOpacity={1}
                    fill="url(#colorAngsuranSuper)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TABLE: SATMINKAL BINAAN KOTAMA */}
      <Card className="shadow-card">
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Database className="size-4 text-primary" />
                Daftar Satminkal Binaan {activeKotama?.nama}
              </CardTitle>
              <CardDescription className="text-xs">
                Status operasional dan akumulasi keuangan seluruh Satker Koperasi Primer (Read-Only)
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchSatminkal}
                onChange={(e) => setSearchSatminkal(e.target.value)}
                placeholder="Cari satminkal / admin..."
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {loadingSummary ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-primary mx-auto mb-2" />
              Mengambil data satminkal...
            </div>
          ) : filteredSatminkals.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground">
              Tidak ada data satminkal ditemukan.
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="text-xs">
                    <TableHead className="w-10">No</TableHead>
                    <TableHead>Kode &amp; Nama Satminkal</TableHead>
                    <TableHead>Admin Satker</TableHead>
                    <TableHead className="text-right">Total Anggota</TableHead>
                    <TableHead className="text-right">Total Simpanan</TableHead>
                    <TableHead className="text-right">Pinjaman Berjalan</TableHead>
                    <TableHead className="text-right">Kas Koperasi</TableHead>
                    <TableHead className="text-center">Status Operasional</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSatminkals.map((sat: any, idx: number) => {
                    const admin = sat.admin;
                    const isOnline = admin?.isOnline ?? false;
                    const isIdle = admin?.isIdle ?? false;

                    return (
                      <TableRow key={sat.id} className="text-xs hover:bg-muted/40 transition-colors">
                        <TableCell className="text-muted-foreground font-medium">
                          {idx + 1}
                        </TableCell>
                        <TableCell>
                          <p className="font-bold text-foreground">{sat.nama}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">Kode: {sat.kode}</p>
                        </TableCell>
                        <TableCell>
                          {admin ? (
                            <div>
                              <p className="font-semibold text-foreground">{admin.namaLengkap}</p>
                              <p className="text-[10px] font-mono text-primary">@{admin.username}</p>
                              {isOnline ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold mt-0.5">
                                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Online
                                </span>
                              ) : isIdle ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-medium mt-0.5">
                                  <span className="size-1.5 rounded-full bg-amber-500" />
                                  Idle
                                </span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground mt-0.5 block">Offline</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">- Belum ada admin -</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {sat.totalAnggota ?? 0} Org
                        </TableCell>
                        <TableCell className="text-right font-medium text-blue-600 dark:text-blue-400">
                          {formatRp(sat.totalSimpanan ?? 0)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-amber-600 dark:text-amber-400">
                          {formatRp(sat.pinjamanBerjalan ?? 0)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                          {formatRp(sat.kasKoperasi ?? 0)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={
                              sat.status
                                ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px]"
                                : "bg-destructive/15 text-destructive border-destructive/30 text-[10px]"
                            }
                          >
                            {sat.status ? "Aktif" : "Non-Aktif"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
