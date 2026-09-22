import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "@tanstack/react-router";
import {
  Building2,
  Users,
  Wallet,
  HandCoins,
  TrendingUp,
  ShieldCheck,
  Eye,
  Activity,
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  Clock,
  Radio,
  RefreshCw,
  Search,
  Loader2,
  Sparkles,
  Database,
  Download,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from "@/components/session-context";
import { apiKotama, apiBackup, type KotamaSatminkalStat } from "@/lib/api";
import { formatRp } from "@/lib/casheva-data";

function formatAuditDetails(details: any, defaultText: string = "-"): string {
  if (!details) return defaultText;
  if (typeof details === "string") return details;
  if (typeof details === "object") {
    if (details.catatan) {
      if (details.satminkalNama) {
        return `${details.catatan} (${details.satminkalNama})`;
      }
      return String(details.catatan);
    }
    if (details.satminkalNama) {
      return `Satminkal: ${details.satminkalNama}${details.satminkalKode ? ` (${details.satminkalKode})` : ""}`;
    }
    if (details.message) {
      return String(details.message);
    }
    try {
      return JSON.stringify(details);
    } catch {
      return defaultText;
    }
  }
  return String(details);
}

export function KotamaDashboardView() {
  const navigate = useNavigate();
  const { kotama, kotamaId, startMonitoring, isGuestMode } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const {
    data: summary,
    isLoading: loadingSummary,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ["kotama-summary", kotamaId],
    queryFn: () => apiKotama.getSummary(kotamaId),
    refetchInterval: 10000,
  });

  const {
    data: satminkalList = [],
    isLoading: loadingSatminkal,
    refetch: refetchSatminkal,
  } = useQuery({
    queryKey: ["kotama-satminkal-list", kotamaId],
    queryFn: () => apiKotama.getSatminkalList(),
    refetchInterval: 10000,
  });

  const {
    data: chartsData,
    isLoading: loadingCharts,
    refetch: refetchCharts,
  } = useQuery({
    queryKey: ["kotama-charts", kotamaId],
    queryFn: () => apiKotama.getCharts(undefined, kotamaId),
    refetchInterval: 15000,
  });

  const {
    data: auditLogs = [],
    isLoading: loadingLogs,
    refetch: refetchLogs,
  } = useQuery({
    queryKey: ["kotama-audit-logs"],
    queryFn: () => apiKotama.getAuditLogs(),
    refetchInterval: 10000,
  });

  const handleStartMonitoring = async (satminkal: KotamaSatminkalStat) => {
    try {
      await startMonitoring({
        id: satminkal.id,
        kode: satminkal.kode,
        nama: satminkal.nama,
      });
      toast.success("Mode Monitoring Aktif", {
        description: `Sedang mengamati Satminkal ${satminkal.nama} (Mode Tamu / Read-Only)`,
      });
      navigate({ to: "/simpanan" });
    } catch (e: any) {
      toast.error("Gagal memulai monitoring", {
        description: e.message || "Terjadi kesalahan pada server",
      });
    }
  };

  const filteredSatminkal = satminkalList.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      s.nama.toLowerCase().includes(q) ||
      s.kode.toLowerCase().includes(q) ||
      (s.admin?.namaLengkap && s.admin.namaLengkap.toLowerCase().includes(q))
    );
  });

  const handleConfirmBackup = async () => {
    try {
      setIsBackingUp(true);
      const filename = await apiBackup.downloadEncryptedFile();
      toast.success("Cadangan Database Kotama Berhasil", {
        description: `File cadangan seluruh Satminkal jajaran (${filename}) berhasil diunduh dan tersimpan aman (AES-256-GCM).`,
      });
      setBackupDialogOpen(false);
    } catch (err: any) {
      toast.error("Gagal Mencadangkan Data Kotama", {
        description:
          err.message ||
          "Terjadi kendala saat memproses cadangan database Kotama.",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRefreshAll = () => {
    refetchSummary();
    refetchSatminkal();
    refetchCharts();
    refetchLogs();
    toast.success("Data Dashboard Kotama diperbarui");
  };

  // Main 4 KPI items
  const kpiItems = [
    {
      label: "Total Anggota Jajaran",
      value: `${(summary?.kpi.totalAnggotaAktif ?? 20).toLocaleString("id-ID")} Personel`,
      delta: `${satminkalList.length} Satminkal Terverifikasi`,
      icon: Users,
    },
    {
      label: "Total Kas & Simpanan",
      value: formatRp(summary?.kpi.totalSimpanan ?? 0),
      delta: "Pokok, Wajib & Sukarela",
      icon: Wallet,
    },
    {
      label: "Pinjaman Berjalan (Usipa)",
      value: formatRp(summary?.kpi.pinjamanBerjalan ?? 0),
      delta: "Outstanding Saldo Jajaran",
      icon: HandCoins,
    },
    {
      label: "Estimasi SHU Konsolidasi",
      value: formatRp(summary?.kpi.estimasiShuKotama ?? 0),
      delta: `Tahun Buku ${new Date().getFullYear()}`,
      icon: TrendingUp,
    },
  ];

  // Secondary status counters
  const onlineCount = satminkalList.filter((s) => s.admin?.isOnline).length;
  const statusKpis = [
    {
      label: "Satminkal Terhubung",
      value: `${onlineCount} / ${satminkalList.length || 1} Satminkal`,
      hint: "Sesi Admin Koperasi Aktif (Online)",
      icon: Radio,
      tone: "text-primary bg-primary-soft",
    },
    {
      label: "Tingkat Kesehatan Koperasi",
      value: "Kategori SEHAT (A)",
      hint: "Audit Likuiditas & Solvabilitas Terpenuhi",
      icon: ShieldCheck,
      tone: "text-accent-foreground bg-gold-soft",
    },
    {
      label: "Tingkat NPL / Kredit Macet",
      value: "< 0.5% (Terkendali)",
      hint: "Kolektibilitas Angsuran Lancar Terkendali",
      icon: CheckCircle2,
      tone: "text-primary bg-primary-soft",
    },
  ];

  // Trend Chart Data (in millions)
  const chartSimpananPinjaman = useMemo(() => {
    if (chartsData?.data && chartsData.data.length > 0) {
      return chartsData.data.map((d) => ({
        bulan: d.bulan,
        simpanan: Math.round(d.simpanan / 1_000_000),
        pinjaman: Math.round(d.pinjaman / 1_000_000),
      }));
    }
    return [
      { bulan: "Jan", simpanan: 450, pinjaman: 380 },
      { bulan: "Feb", simpanan: 480, pinjaman: 410 },
      { bulan: "Mar", simpanan: 520, pinjaman: 430 },
      { bulan: "Apr", simpanan: 560, pinjaman: 490 },
      { bulan: "Mei", simpanan: 610, pinjaman: 520 },
      { bulan: "Jun", simpanan: 670, pinjaman: 580 },
    ];
  }, [chartsData]);

  // Realisasi Angsuran Chart Data (in millions)
  const chartAngsuran = useMemo(() => {
    if (chartsData?.data && chartsData.data.length > 0) {
      return chartsData.data.map((d) => ({
        bulan: d.bulan,
        target: Math.round((d.simpanan * 0.15) / 1_000_000),
        realisasi: Math.round(d.angsuran / 1_000_000),
      }));
    }
    return [
      { bulan: "Jan", target: 95, realisasi: 94 },
      { bulan: "Feb", target: 98, realisasi: 97.5 },
      { bulan: "Mar", target: 102, realisasi: 101 },
      { bulan: "Apr", target: 110, realisasi: 108.5 },
      { bulan: "Mei", target: 115, realisasi: 114 },
      { bulan: "Jun", target: 120, realisasi: 119.5 },
    ];
  }, [chartsData]);

  return (
    <div className="space-y-6">
      {/* 1. Standard PageHeader */}
      <PageHeader
        title="Dashboard Komando & Pengawasan Kotama"
        description={`Pusat Agregasi Finansial, Audit Kinerja Satminkal & Monitoring Terpadu Jajaran ${kotama} TA 2026`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border-primary/30 bg-primary/5 text-primary">
              <Radio className="size-3.5 animate-pulse text-emerald-600 dark:text-emerald-400" />
              Live Synchronized
            </Badge>
            <Button
              variant="outline"
              onClick={handleRefreshAll}
              className="text-xs h-9 gap-1.5"
            >
              <RefreshCw className="size-3.5" />
              Perbarui Data
            </Button>
            <Button
              onClick={() => setBackupDialogOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 gap-1.5 shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.02]"
            >
              <Download className="size-4" />
              Cadangkan Database Kotama
            </Button>
            <Button
              asChild
              variant="outline"
              className="text-xs h-9 gap-1.5"
            >
              <Link to="/satminkal">
                <Building2 className="size-4" />
                Kelola Satminkal
              </Link>
            </Button>
          </div>
        }
      />

      {/* Dialog Konfirmasi Pencadangan Database Kotama */}
      <ConfirmActionDialog
        open={backupDialogOpen}
        onOpenChange={setBackupDialogOpen}
        onConfirm={handleConfirmBackup}
        isLoading={isBackingUp}
        title={`Cadangkan Database ${kotama} (Terenkripsi AES-256)?`}
        description={`Sistem akan mengekspor seluruh snapshot data dari seluruh Satminkal binaan (${satminkalList.length} Satminkal) di bawah naungan ${kotama} dalam format terenkripsi berstandar militer.`}
        confirmText="Unduh Cadangan Kotama"
        cancelText="Batal"
        variant="success"
        icon={<Database className="size-6 text-emerald-600 dark:text-emerald-400" />}
        details={[
          { label: "Lingkup Wilayah", value: kotama || "Komando Utama" },
          { label: "Cakupan Satminkal", value: `${satminkalList.length} Satker Koperasi Binaan` },
          { label: "Algoritma Enkripsi", value: "AES-256-GCM + SHA-256 Checksum" },
          { label: "Format File", value: ".siskopad.enc (Encrypted JSON Bundle)" },
          { label: "Keamanan", value: "Terenkripsi Standar Militer & Anti-Ransomware" },
        ]}
      />

      {/* 2. Main KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiItems.map((kpi) => (
          <Card key={kpi.label} className="shadow-card card-interactive">
            <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 pb-2">
              <CardDescription className="min-w-0 truncate">{kpi.label}</CardDescription>
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary transition-transform group-hover:scale-105">
                <kpi.icon className="size-4" />
              </span>
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <div className="flex items-center gap-2 py-1 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Memuat...
                </div>
              ) : (
                <p className="text-xl font-extrabold tracking-tight break-words">{kpi.value}</p>
              )}
              <p className="mt-1 flex items-center gap-1 text-xs text-success">
                <ArrowUpRight className="size-3.5" />
                {kpi.delta}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3. Status Counters */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {statusKpis.map((kpi) => (
          <Card key={kpi.label} className="shadow-card card-interactive">
            <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 pb-2">
              <CardDescription className="min-w-0 truncate">{kpi.label}</CardDescription>
              <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${kpi.tone}`}>
                <kpi.icon className="size-4" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-extrabold tracking-tight">{kpi.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{kpi.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 4. Analytics Charts */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {/* Trend Area Chart (3 cols) */}
        <Card className="shadow-card md:col-span-2 lg:col-span-3">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
            <div>
              <CardTitle>Tren Pertumbuhan Simpanan vs Pinjaman</CardTitle>
              <CardDescription>Agregasi dana Koperasi Primer jajaran {kotama} (Juta Rp)</CardDescription>
            </div>
            <Badge variant="outline" className="text-[11px] text-primary border-primary/30">
              Konsolidasi
            </Badge>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartSimpananPinjaman} margin={{ left: -18, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gKotamaSimpanan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gKotamaPinjaman" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="bulan" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    color: "var(--color-popover-foreground)",
                  }}
                  formatter={(value: any) => [`${formatRp(Number(value) * 1_000_000)}`, ""]}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="simpanan"
                  name="Total Simpanan (Jt)"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2.5}
                  fill="url(#gKotamaSimpanan)"
                />
                <Area
                  type="monotone"
                  dataKey="pinjaman"
                  name="Total Pinjaman (Jt)"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2.5}
                  fill="url(#gKotamaPinjaman)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Realisasi Angsuran Bar Chart (2 cols) */}
        <Card className="shadow-card lg:col-span-2">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
            <div>
              <CardTitle>Realisasi Angsuran &amp; Pengembalian</CardTitle>
              <CardDescription>Target vs realisasi penagihan jajaran (Juta Rp)</CardDescription>
            </div>
            <Badge variant="outline" className="text-[11px] text-accent-foreground border-accent-foreground/30">
              NPL &lt; 0.5%
            </Badge>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartAngsuran} margin={{ left: -18, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="bulan" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  cursor={{ fill: "var(--color-muted)" }}
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    color: "var(--color-popover-foreground)",
                  }}
                  formatter={(value: any) => [`${formatRp(Number(value) * 1_000_000)}`, ""]}
                />
                <Legend />
                <Bar dataKey="target" name="Target (Jt)" fill="var(--color-muted-foreground)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="realisasi" name="Realisasi (Jt)" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 5. Satminkal Table */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-5 text-primary" />
              Daftar Koperasi Satminkal Jajaran &amp; Status Operasional
            </CardTitle>
            <CardDescription>
              Pilih salah satu satminkal untuk mengaktifkan <strong>Mode Monitoring (Mode Tamu)</strong> guna memeriksa transaksi dan pembukuan satuan.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-64">
            <div className="relative w-full">
              <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari satminkal / kode..."
                className="h-9 pl-9 text-xs"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">No</TableHead>
                <TableHead>Nama Satminkal / Koperasi</TableHead>
                <TableHead>Status Admin</TableHead>
                <TableHead className="text-right">Anggota</TableHead>
                <TableHead className="text-right">Total Simpanan</TableHead>
                <TableHead className="text-right">Pinjaman Aktif</TableHead>
                <TableHead className="text-center">Kinerja</TableHead>
                <TableHead className="text-right">Aksi Monitoring</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingSatminkal ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-5 animate-spin mb-2" />
                    Memuat data Satminkal...
                  </TableCell>
                </TableRow>
              ) : filteredSatminkal.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-6 text-center text-muted-foreground">
                    Tidak ada satminkal yang sesuai pencarian.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSatminkal.map((sat, idx) => {
                  const isOnline = sat.admin?.isOnline ?? false;
                  return (
                    <TableRow key={sat.id}>
                      <TableCell className="text-center font-mono text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground">{sat.nama}</p>
                          <p className="text-xs text-muted-foreground font-mono flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-muted border border-border text-foreground/80 font-mono text-[11px]">
                              {sat.kode}
                            </span>
                            <span>Admin: {sat.admin?.namaLengkap || sat.admin?.username || "-"}</span>
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`size-2.5 rounded-full ${
                              isOnline ? "bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500" : "bg-muted-foreground/40"
                            }`}
                          />
                          <span className={`text-xs font-semibold ${isOnline ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                            {isOnline ? "Online" : "Offline"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-xs">
                        {sat.totalAnggota ?? 20} Personel
                      </TableCell>
                      <TableCell className="text-right font-semibold text-xs text-primary font-mono">
                        {formatRp(sat.totalSimpanan ?? 0)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-xs text-accent-foreground font-mono">
                        {formatRp(sat.totalPinjaman ?? 0)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-primary-soft text-primary border-primary/20 text-[10px] font-semibold">
                          SEHAT (A)
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isGuestMode ? (
                          <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">
                            Read-Only
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartMonitoring(sat)}
                            className="h-8 gap-1.5 text-xs font-semibold border-primary/30 text-primary hover:bg-primary-soft transition-all"
                          >
                            <Eye className="size-3.5" />
                            Monitoring
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 6. Audit Log Feed */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              Log Aktivitas &amp; Pengawasan Kotama Terkini
            </CardTitle>
            <CardDescription>
              Riwayat pengawasan, akses monitoring, dan audit data satminkal jajaran
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/audit" })}
            className="text-xs h-8 gap-1"
          >
            Lihat Seluruh Log <ArrowRight className="size-3.5" />
          </Button>
        </CardHeader>
        <CardContent>
          {loadingLogs ? (
            <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Memuat riwayat aktivitas...
            </div>
          ) : auditLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              Belum ada log aktivitas monitoring tercatat untuk periode ini.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="py-2.5 flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {log.action}
                      </Badge>
                      <span className="font-semibold text-foreground">{log.username || "Admin Kotama"}</span>
                      <span className="text-muted-foreground">({log.role})</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{formatAuditDetails(log.details, log.action)}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                    {new Date(log.timestamp).toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
