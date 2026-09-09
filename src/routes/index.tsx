import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Wallet,
  HandCoins,
  TrendingUp,
  ArrowUpRight,
  ArrowRight,
  Hourglass,
  BadgeCheck,
  Ban,
  Banknote,
  FilePlus2,
  ListChecks,
  Loader2,
  ShieldCheck,
  ClipboardCheck,
  Calculator,
  Receipt,
  Eye,
  RotateCcw,
  CheckCircle2,
  Clock,
  PiggyBank,
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

import { PageHeader } from "@/components/page-header";
import { useSession } from "@/components/session-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  angsuranData,
  formatRp,
  formatNamaLengkapDinas,
  formatPangkatKorps,
  backendStatusToFrontend,
  loanStatusTone,
  trenData as defaultTrenData,
  ROLES,
  type Role,
} from "@/lib/casheva-data";
import { dashboardCta } from "@/lib/rbac";
import { apiDashboard, apiPinjaman, apiAnggota, type Anggota } from "@/lib/api";
import {
  RekomendasiQueue,
  AccQueue,
  InvoiceGenerator,
  RekapAngsuranTable,
  ShuBreakdown,
  PengajuanSatuanChart,
  LikuiditasChart,
  BatchSimpananBanner,
  ApprovalTrailTimeline,
} from "@/components/widgets/role-widgets";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Casheva Koperasi TNI AD" },
      {
        name: "description",
        content:
          "Dasbor terintegrasi pengelolaan simpanan, pinjaman berjenjang, dan SHU Koperasi Simpan Pinjam TNI AD.",
      },
      { property: "og:title", content: "Dashboard — Casheva" },
      {
        property: "og:description",
        content: "KPI koperasi TNI AD: anggota, simpanan, pinjaman, dan SHU.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { role, isAdmin, setRole } = useSession();

  return (
    <div className="space-y-6">
      {/* Admin Perspective Notice Banner (Only shown if Admin is viewing another role's perspective) */}
      {isAdmin && role !== "Admin Koperasi" && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-primary/30 bg-primary-soft/50 shadow-sm backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Eye className="size-4" />
            </span>
            <div>
              <p className="text-xs font-bold text-primary flex items-center gap-1.5">
                Mode Perspektif Aktif: <span className="text-foreground">{role}</span>
                <Badge variant="secondary" className="text-[10px] bg-primary-soft text-primary font-semibold">
                  Akses Admin Penuh
                </Badge>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Anda login sebagai Admin Koperasi dan saat ini melihat antarmuka perspektif <strong>{role}</strong>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={role}
              onValueChange={(v) => setRole(v as Role)}
            >
              <SelectTrigger className="h-8 w-[160px] text-xs font-semibold bg-background border-primary/25">
                <SelectValue placeholder="Ganti peran" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="text-xs">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRole("Admin Koperasi")}
              className="h-8 text-xs font-semibold"
            >
              <RotateCcw className="size-3.5 mr-1" /> Reset ke Admin
            </Button>
          </div>
        </div>
      )}

      {/* Render Role-Specific Dashboard */}
      {(() => {
        switch (role) {
          case "Admin Koperasi":
            return <AdminDashboard />;
          case "Pimpinan / Dan / Ka":
            return <PimpinanDashboard />;
          case "Keprim":
            return <KeprimDashboard />;
          case "Bendahara":
            return <BendaharaDashboard />;
          case "Juru Bayar":
            return <JuruBayarDashboard />;
          case "Anggota":
            return <AnggotaDashboard />;
          case "Pengawas Koperasi":
            return <PengawasDashboard />;
          default:
            return <AdminDashboard />;
        }
      })()}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   1. ADMIN KOPERASI DASHBOARD
   ───────────────────────────────────────────────────────────────────────────── */

function AdminDashboard() {
  const { satminkal, setRole } = useSession();
  const cta = dashboardCta("Admin Koperasi");

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: apiDashboard.getSummary,
  });

  const { data: chartsData } = useQuery({
    queryKey: ["dashboard-charts"],
    queryFn: () => apiDashboard.getCharts(),
  });

  const { data: loansList = [], isLoading: loadingLoans } = useQuery({
    queryKey: ["pinjaman-recent"],
    queryFn: () => apiPinjaman.findAll(),
  });

  const countPending = loansList.filter((l) =>
    ["DIAJUKAN", "DIVERIFIKASI_JURUBAYAR", "DIREKOMENDASIKAN", "VERIFIKASI_PRIMKOP", "VERIFIKASI_JURU_BAYAR"].includes(l.status),
  ).length;
  const countAcc = loansList.filter((l) =>
    ["DISETUJUI_KEPRIM", "DISETUJUI_KAPRIM", "SETUJU_KEPRIM", "SETUJU_KAPRIM", "DICAIRKAN", "LUNAS"].includes(l.status),
  ).length;
  const countDitolak = loansList.filter((l) => l.status === "DITOLAK").length;

  const totalAnggotaVal = summary?.totalAnggota ?? 20;
  const totalSimpananVal = summary?.totalSimpanan ?? 130500000;
  const totalPinjamanBerjalanVal = summary?.totalPinjamanBerjalan ?? 34583333;
  const shuTahunBerjalanVal = summary?.shuTahunBerjalan ?? 50000000;

  const kpiItems = [
    {
      label: "Total Anggota Aktif",
      value: `${totalAnggotaVal} Personel`,
      delta: "Data Terverifikasi",
      icon: Users,
    },
    {
      label: "Total Kas & Simpanan",
      value: formatRp(totalSimpananVal),
      delta: "Pokok, Wajib & Sukarela",
      icon: Wallet,
    },
    {
      label: "Pinjaman Berjalan",
      value: formatRp(totalPinjamanBerjalanVal),
      delta: `${summary?.countPinjamanBerjalan ?? (loansList.filter((l) => l.status === "DICAIRKAN").length || 4)} Berkas Aktif`,
      icon: HandCoins,
    },
    {
      label: "Estimasi SHU Tahun Berjalan",
      value: formatRp(shuTahunBerjalanVal),
      delta: `Tahun Buku ${summary?.tahun ?? 2026}`,
      icon: TrendingUp,
    },
  ];

  const statusKpis = [
    {
      label: "Pinjaman Dalam Proses",
      value: String(countPending || 3),
      hint: "Pending · Verified · Approved Dan",
      icon: Hourglass,
      tone: "text-accent-foreground bg-gold-soft",
    },
    {
      label: "Pinjaman Disetujui (ACC)",
      value: String(countAcc || 6),
      hint: "ACC Keprim · Siap/Sudah Cair",
      icon: BadgeCheck,
      tone: "text-primary bg-primary-soft",
    },
    {
      label: "Pinjaman Ditolak",
      value: String(countDitolak || 1),
      hint: "Tidak lolos alur berjenjang",
      icon: Ban,
      tone: "text-destructive bg-destructive/10",
    },
  ];

  const chartSimpananPinjaman =
    chartsData?.simpananBulanan?.map((s, idx) => ({
      bulan: s.namaBulan.slice(0, 3),
      simpanan: Math.round(s.total / 1_000_000),
      pinjaman: Math.round((chartsData.pinjamanBulanan[idx]?.total ?? 0) / 1_000_000),
    })) || defaultTrenData;

  const chartAngsuran =
    chartsData?.angsuranBulanan?.map((a) => ({
      bulan: a.namaBulan.slice(0, 3),
      target: Math.round((a.total * 1.05) / 1_000_000) || 50,
      realisasi: Math.round(a.total / 1_000_000),
    })) || angsuranData;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Eksekutif Admin"
        description={`Pusat Kendali Utama Koperasi Simpan Pinjam ${satminkal} TA 2026`}
        actions={
          cta ? (
            <Button asChild>
              <Link to={cta.to as "/"}>
                {cta.label} <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          ) : null
        }
      />

      {/* Quick Perspective Switching Bar */}
      <Card className="border-primary/20 bg-card/60 backdrop-blur-sm shadow-card">
        <CardContent className="py-3 px-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-md bg-primary/10 text-primary">
              <Eye className="size-4" />
            </span>
            <span className="text-xs font-semibold text-foreground">
              Akses Cepat Perspektif Peran:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {ROLES.filter((r) => r !== "Admin Koperasi").map((r) => (
              <Button
                key={r}
                size="sm"
                variant="outline"
                onClick={() => setRole(r)}
                className="h-7 text-[11px] px-2.5 font-medium hover:bg-primary-soft hover:text-primary transition-colors"
              >
                {r}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      {/* Status Counters */}
      <div className="grid gap-4 sm:grid-cols-3">
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

      {/* Analytics Charts */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="shadow-card lg:col-span-3">
          <CardHeader>
            <CardTitle>Tren Simpanan vs Pinjaman</CardTitle>
            <CardDescription>Dalam juta rupiah, Jan – Des 2026</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartSimpananPinjaman} margin={{ left: -18, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gSimpanan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gPinjaman" x1="0" y1="0" x2="0" y2="1">
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
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="simpanan"
                  name="Simpanan (Jt)"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2.5}
                  fill="url(#gSimpanan)"
                />
                <Area
                  type="monotone"
                  dataKey="pinjaman"
                  name="Pinjaman (Jt)"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2.5}
                  fill="url(#gPinjaman)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Realisasi Angsuran Bulanan</CardTitle>
            <CardDescription>Target vs realisasi (juta rupiah)</CardDescription>
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
                />
                <Legend />
                <Bar dataKey="target" name="Target" fill="var(--color-muted-foreground)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="realisasi" name="Realisasi" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Loans Overview */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Pengajuan Pinjaman Terbaru</CardTitle>
            <CardDescription>Status alur persetujuan berjenjang dari sistem database</CardDescription>
          </div>
          <Button variant="outline" asChild>
            <Link to="/pinjaman">Lihat Semua Pinjaman</Link>
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Pengajuan</TableHead>
                <TableHead>Anggota</TableHead>
                <TableHead>Pangkat / Korps</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead className="text-center">Tenor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingLoans ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-5 animate-spin mb-2" />
                    Memuat data pengajuan...
                  </TableCell>
                </TableRow>
              ) : (
                loansList.slice(0, 6).map((l) => {
                  const uiStatus = backendStatusToFrontend(l.status);
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="font-mono text-xs font-medium">
                        {l.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{formatNamaLengkapDinas(l.anggota?.nama, l.anggota?.pangkat?.nama, l.anggota?.korps?.nama, l.anggota?.pangkat?.kategori)}</p>
                        <p className="text-xs text-muted-foreground">
                          NRP {l.anggota?.nrpNip || "-"} · {l.anggota?.satminkal?.nama || satminkal}
                        </p>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatPangkatKorps(l.anggota?.pangkat?.nama, l.anggota?.korps?.nama)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatRp(Number(l.nominal))}
                      </TableCell>
                      <TableCell className="text-center">{l.tenorBulan} bln</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={loanStatusTone[uiStatus] || ""}>
                          {uiStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" asChild>
                          <Link to="/pinjaman">Tinjau</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
              {!loadingLoans && loansList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    Belum ada data pengajuan pinjaman
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   2. PIMPINAN / DAN / KA DASHBOARD
   ───────────────────────────────────────────────────────────────────────────── */

function PimpinanDashboard() {
  const { satminkal } = useSession();
  const { data: loanList = [] } = useQuery({
    queryKey: ["pinjaman-pimpinan"],
    queryFn: () => apiPinjaman.findAll(),
  });

  const antreanCount = loanList.filter((l) =>
    ["VERIFIKASI_JURU_BAYAR", "VERIFIKASI_PRIMKOP", "DIAJUKAN"].includes(l.status),
  ).length;
  const pinjamanSatuanCount = loanList.filter((l) =>
    ["REKOMENDASI_PIMPINAN", "SETUJU_KEPRIM", "SETUJU_KAPRIM", "DICAIRKAN"].includes(l.status),
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Komandan / Ka Bagian"
        description={`Otorisasi Rekomendasi Pinjaman & Monitoring Anggota Satuan ${satminkal}`}
        actions={
          <Button asChild>
            <Link to="/rekomendasi">
              <ClipboardCheck className="mr-1.5 size-4" /> Buka Antrean Rekomendasi
            </Link>
          </Button>
        }
      />

      {/* Pimpinan KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Menunggu Rekomendasi Dan/Ka</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-extrabold text-accent-foreground">{antreanCount}</p>
            <span className="grid size-9 place-items-center rounded-lg bg-gold-soft text-accent-foreground">
              <Clock className="size-4" />
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Pinjaman Berjalan Satuan</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-extrabold text-primary">{pinjamanSatuanCount}</p>
            <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
              <CheckCircle2 className="size-4" />
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Plafon Pinjaman Maksimal</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-extrabold text-success">Rp 30.000.000</p>
            <span className="grid size-9 place-items-center rounded-lg bg-success/15 text-success">
              <HandCoins className="size-4" />
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Rekomendasi Queue Component */}
      <RekomendasiQueue monitorOnly={false} />

      {/* Satuan Trends */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PengajuanSatuanChart />
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Pintasan Komandan Satuan</CardTitle>
            <CardDescription>Akses data anggota dan riwayat dinas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start gap-3 p-4 h-auto">
              <Link to="/anggota">
                <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Users className="size-4" />
                </span>
                <div className="text-left">
                  <p className="font-semibold text-sm">Data Personel Satuan</p>
                  <p className="text-xs text-muted-foreground">Lihat daftar anggota, pangkat, dan korps</p>
                </div>
                <ArrowRight className="ml-auto size-4 text-muted-foreground" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start gap-3 p-4 h-auto">
              <Link to="/pinjaman">
                <span className="grid size-9 place-items-center rounded-lg bg-gold-soft text-accent-foreground">
                  <HandCoins className="size-4" />
                </span>
                <div className="text-left">
                  <p className="font-semibold text-sm">Riwayat Pinjaman Satuan</p>
                  <p className="text-xs text-muted-foreground">Rekap status persetujuan berkas pinjaman anggota</p>
                </div>
                <ArrowRight className="ml-auto size-4 text-muted-foreground" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   3. KEPRIM (KAPRIM) DASHBOARD
   ───────────────────────────────────────────────────────────────────────────── */

function KeprimDashboard() {
  const { satminkal } = useSession();
  const { data: loanList = [] } = useQuery({
    queryKey: ["pinjaman-acc"],
    queryFn: () => apiPinjaman.findAll(),
  });

  const antreanAccCount = loanList.filter((l) => l.status === "REKOMENDASI_PIMPINAN").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Kepala Primkopad (Keprim)"
        description={`Otorisasi Keputusan Akhir (ACC Kredit) & Likuiditas Kas ${satminkal}`}
        actions={
          <Button asChild>
            <Link to="/acc">
              <BadgeCheck className="mr-1.5 size-4" /> Buka Persetujuan ACC
            </Link>
          </Button>
        }
      />

      {/* Keprim KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Berkas Menunggu ACC Keprim</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-extrabold text-primary">{antreanAccCount}</p>
            <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
              <BadgeCheck className="size-4" />
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Suku Bunga Koperasi Aktif</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-extrabold text-success">1.0% / bulan</p>
            <span className="grid size-9 place-items-center rounded-lg bg-success/15 text-success">
              <TrendingUp className="size-4" />
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Rasio Likuiditas Kas</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-extrabold text-foreground">84.5% (Sehat)</p>
            <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
              <Wallet className="size-4" />
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Acc Queue Widget */}
      <AccQueue />

      {/* Likuiditas Chart */}
      <LikuiditasChart />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   4. BENDAHARA DASHBOARD
   ───────────────────────────────────────────────────────────────────────────── */

function BendaharaDashboard() {
  const { satminkal } = useSession();
  const { data: loanList = [] } = useQuery({
    queryKey: ["pinjaman-pencairan"],
    queryFn: () => apiPinjaman.findAll(),
  });

  const siapCairCount = loanList.filter((l) =>
    ["SETUJU_KAPRIM", "SETUJU_KEPRIM", "MENUNGGU_DOKUMEN"].includes(l.status),
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Bendahara Koperasi"
        description={`Pencairan Pinjaman, Rekap Angsuran, & Penagihan Simpanan ${satminkal}`}
        actions={
          <Button asChild>
            <Link to="/pengajuan">
              <FilePlus2 className="mr-1.5 size-4" /> Buat Pengajuan Pinjaman
            </Link>
          </Button>
        }
      />

      {/* Bendahara KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Pinjaman Siap Dicairkan</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-extrabold text-primary">{siapCairCount} Berkas</p>
            <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
              <Receipt className="size-4" />
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Simpanan Wajib Bulanan</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-extrabold text-success">Rp 100.000 / bln</p>
            <span className="grid size-9 place-items-center rounded-lg bg-success/15 text-success">
              <Wallet className="size-4" />
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Jadwal Potong Gaji</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-extrabold text-accent-foreground">Tgl 5 / Bulan</p>
            <span className="grid size-9 place-items-center rounded-lg bg-gold-soft text-accent-foreground">
              <Clock className="size-4" />
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Batch Simpanan Tanggal 5 Banner */}
      <BatchSimpananBanner />

      {/* Pencairan Dana Widget */}
      <InvoiceGenerator />

      {/* Rekap Angsuran Table */}
      <RekapAngsuranTable />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   5. JURU BAYAR DASHBOARD
   ───────────────────────────────────────────────────────────────────────────── */

function JuruBayarDashboard() {
  const { satminkal } = useSession();
  const { data: loanList = [], isLoading } = useQuery({
    queryKey: ["pinjaman-jurubayar"],
    queryFn: () => apiPinjaman.findAll(),
  });

  const antreanVerif = loanList.filter((l) =>
    ["DIAJUKAN", "VERIFIKASI_PRIMKOP", "VERIFIKASI_JURU_BAYAR"].includes(l.status),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Juru Bayar (Juyar)"
        description={`Verifikasi Kelayakan Gaji & Potongan Kedinasan Personel ${satminkal}`}
        actions={
          <Button asChild>
            <Link to="/verifikasi">
              <ShieldCheck className="mr-1.5 size-4" /> Buka Antrean Verifikasi
            </Link>
          </Button>
        }
      />

      {/* Juyar KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Menunggu Verifikasi Gaji</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-extrabold text-accent-foreground">{antreanVerif.length}</p>
            <span className="grid size-9 place-items-center rounded-lg bg-gold-soft text-accent-foreground">
              <ShieldCheck className="size-4" />
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Batas Maksimum Angsuran</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-extrabold text-primary">40% Gaji Netto</p>
            <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
              <Banknote className="size-4" />
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Status Rekonsiliasi Gaji</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-extrabold text-success">Sinkron (Aktif)</p>
            <span className="grid size-9 place-items-center rounded-lg bg-success/15 text-success">
              <CheckCircle2 className="size-4" />
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Antrean Verifikasi Table */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Antrean Verifikasi Kelayakan Gaji &amp; Berkas Usipa</CardTitle>
            <CardDescription>Pengajuan anggota yang menunggu validasi Juru Bayar sebelum ke Dan/Ka</CardDescription>
          </div>
          <Button asChild size="sm">
            <Link to="/verifikasi">Proses Verifikasi</Link>
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Pengajuan</TableHead>
                <TableHead>Nama Anggota</TableHead>
                <TableHead>Pangkat / NRP</TableHead>
                <TableHead className="text-right">Nominal Pengajuan</TableHead>
                <TableHead className="text-center">Tenor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-5 animate-spin mb-2" />
                    Memuat antrean verifikasi...
                  </TableCell>
                </TableRow>
              ) : (
                antreanVerif.map((l) => {
                  const uiStatus = backendStatusToFrontend(l.status);
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {l.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="font-medium">{l.anggota?.nama || "Anggota"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {l.anggota?.pangkat?.nama || ""} / NRP {l.anggota?.nrpNip || "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatRp(Number(l.nominal))}
                      </TableCell>
                      <TableCell className="text-center">{l.tenorBulan} bln</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={loanStatusTone[uiStatus] || ""}>
                          {uiStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" asChild>
                          <Link to="/verifikasi">Validasi Gaji</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
              {!isLoading && antreanVerif.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Tidak ada pengajuan yang menunggu verifikasi Juru Bayar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Shortcuts */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Button asChild variant="outline" className="h-auto justify-start gap-3 p-4">
          <Link to="/pencairan">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
              <Receipt className="size-5" />
            </span>
            <div className="text-left">
              <p className="font-semibold">Monitoring Pencairan Dana</p>
              <p className="text-xs text-muted-foreground">Lihat berkas yang telah disetujui untuk pencairan</p>
            </div>
            <ArrowRight className="ml-auto size-4 text-muted-foreground" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto justify-start gap-3 p-4">
          <Link to="/angsuran">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-success/15 text-success">
              <ListChecks className="size-5" />
            </span>
            <div className="text-left">
              <p className="font-semibold">Rekap Potongan Angsuran</p>
              <p className="text-xs text-muted-foreground">Daftar cicilan bulanan yang dipotong dari gaji</p>
            </div>
            <ArrowRight className="ml-auto size-4 text-muted-foreground" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   6. ANGGOTA DASHBOARD
   ───────────────────────────────────────────────────────────────────────────── */

function AnggotaDashboard() {
  const { user } = useSession();

  // Fetch personal dashboard summary dari backend
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: apiDashboard.getSummary,
  });

  // Fetch daftar pinjaman milik anggota (difilter di backend)
  const { data: loanList = [], isLoading: loadingLoans } = useQuery({
    queryKey: ["pinjaman-anggota-saya"],
    queryFn: () => apiPinjaman.findAll(),
  });

  // Fetch daftar anggota untuk resolve nama dinas resmi (pangkat + korps + nama)
  const { data: anggotaList = [] } = useQuery({
    queryKey: ["anggota-list-active"],
    queryFn: () => apiAnggota.findAll(true),
    staleTime: 1000 * 60 * 5,
  });

  const matchedAnggota = useMemo(() => {
    if (summary?.anggota && summary.anggota.pangkat && summary.anggota.pangkat !== "-") {
      return summary.anggota;
    }
    const fromList = anggotaList.find((a: Anggota) => a.nrpNip === user?.username || a.id === user?.id);
    if (fromList) {
      return {
        id: fromList.id,
        nama: fromList.nama,
        nrpNip: fromList.nrpNip,
        pangkat: fromList.pangkat?.nama || "-",
        korps: fromList.korps?.nama || "-",
        satminkal: fromList.satminkal?.nama || user?.satminkal || "INFOLAHTADAM IV/DIPONEGORO",
      };
    }
    return summary?.anggota;
  }, [summary, anggotaList, user]);

  const officialDisplayName = useMemo(() => {
    if (matchedAnggota) {
      const pNama = (matchedAnggota.pangkat && matchedAnggota.pangkat !== "-") ? `${matchedAnggota.pangkat} ` : "";
      const kNama = (matchedAnggota.korps && matchedAnggota.korps !== "-") ? `${matchedAnggota.korps} ` : "";
      const rawNama = matchedAnggota.nama || user?.namaLengkap || "Anggota Koperasi";
      return rawNama.toLowerCase().startsWith(pNama.trim().toLowerCase())
        ? rawNama
        : `${pNama}${kNama}${rawNama}`.trim();
    }
    if (user?.namaLengkap && !user.namaLengkap.startsWith("Personel (")) {
      return user.namaLengkap;
    }
    return user?.namaLengkap || "Anggota Koperasi";
  }, [matchedAnggota, user]);

  const nrpDisplay = matchedAnggota?.nrpNip || user?.username || "-";
  const satminkalDisplay = matchedAnggota?.satminkal || user?.satminkal || "INFOLAHTADAM IV/DIPONEGORO";

  // KPI finansial personal dari backend
  const totalSimpanan = summary?.totalSimpanan ?? 0;
  const totalSimpananPokok = summary?.totalSimpananPokok ?? 0;
  const totalSimpananWajib = summary?.totalSimpananWajib ?? 0;
  const totalSimpananSukarela = summary?.totalSimpananSukarela ?? 0;
  const totalPinjamanBerjalan = summary?.totalPinjamanBerjalan ?? 0;
  const angsuranBulanIni = summary?.angsuranBulanIni ?? 0;
  const statusAngsuranBulanIni = summary?.statusAngsuranBulanIni ?? true;
  const shuTahunBerjalan = summary?.shuTahunBerjalan ?? 0;

  // Pinjaman berjalan (diajukan & dicairkan)
  const pinjamanAktif = loanList.filter((l) =>
    ["DIAJUKAN", "DIVERIFIKASI_JURUBAYAR", "DIREKOMENDASIKAN", "VERIFIKASI_PRIMKOP",
      "VERIFIKASI_JURU_BAYAR", "REKOMENDASI_PIMPINAN", "SETUJU_KEPRIM", "SETUJU_KAPRIM",
      "MENUNGGU_DOKUMEN", "DICAIRKAN"].includes(l.status)
  );

  const kpiItems = [
    {
      label: "Total Simpanan Saya",
      value: formatRp(totalSimpanan),
      sub: `Pokok ${formatRp(totalSimpananPokok)} · Wajib ${formatRp(totalSimpananWajib)} · Lainnya ${formatRp(totalSimpananSukarela)}`,
      icon: PiggyBank,
      tone: "bg-primary-soft text-primary",
    },
    {
      label: "Sisa Pinjaman Berjalan",
      value: formatRp(totalPinjamanBerjalan),
      sub: `${summary?.countPinjamanBerjalan ?? 0} berkas aktif`,
      icon: HandCoins,
      tone: "bg-destructive/10 text-destructive",
    },
    {
      label: "Tagihan Angsuran Bulan Ini",
      value: formatRp(angsuranBulanIni),
      sub: statusAngsuranBulanIni ? "✓ Sudah Terbayar" : "⏳ Belum Dibayar",
      icon: Banknote,
      tone: statusAngsuranBulanIni ? "bg-success/15 text-success" : "bg-gold-soft text-accent-foreground",
    },
    {
      label: "Estimasi SHU Saya",
      value: formatRp(shuTahunBerjalan),
      sub: `Tahun Buku ${summary?.tahun ?? new Date().getFullYear()}`,
      icon: TrendingUp,
      tone: "bg-success/15 text-success",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Identitas Personel */}
      <PageHeader
        title="Dashboard Anggota Koperasi"
        description={
          loadingSummary && !officialDisplayName
            ? "Memuat data personel..."
            : `${officialDisplayName} · NRP ${nrpDisplay} · ${satminkalDisplay}`
        }
        actions={
          <Button asChild>
            <Link to="/pengajuan">
              <FilePlus2 className="mr-1.5 size-4" /> Ajukan Pinjaman
            </Link>
          </Button>
        }
      />

      {/* KPI Finansial Personal */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiItems.map((kpi) => (
          <Card key={kpi.label} className="shadow-card card-interactive">
            <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 pb-2">
              <CardDescription className="min-w-0 truncate">{kpi.label}</CardDescription>
              <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${kpi.tone}`}>
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
              <p className="mt-1 text-xs text-muted-foreground">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rincian Simpanan Saya */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Simpanan Pokok", value: totalSimpananPokok, color: "text-primary" },
          { label: "Simpanan Wajib", value: totalSimpananWajib, color: "text-success" },
          { label: "Simpanan Sukarela & Khusus", value: totalSimpananSukarela, color: "text-foreground" },
          { label: "Total Tersimpan", value: totalSimpanan, color: "text-primary font-extrabold" },
        ].map((item) => (
          <Card key={item.label} className="shadow-card">
            <CardHeader className="pb-2">
              <CardDescription>{item.label}</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : (
                <p className={`text-lg font-bold ${item.color}`}>{formatRp(item.value)}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Pengajuan Pinjaman Saya */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Status Pengajuan Pinjaman Saya</CardTitle>
            <CardDescription>Alur persetujuan berjenjang dari pengajuan hingga pencairan</CardDescription>
          </div>
          <Button variant="outline" asChild size="sm">
            <Link to="/pengajuan">Lihat Semua &amp; Ajukan Baru</Link>
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Pengajuan</TableHead>
                <TableHead className="text-right">Nominal</TableHead>
                <TableHead className="text-center">Tenor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal Ajukan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingLoans ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-5 animate-spin mb-2" />
                    Memuat data pengajuan...
                  </TableCell>
                </TableRow>
              ) : pinjamanAktif.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Belum ada pengajuan pinjaman. Klik tombol "Ajukan Pinjaman" untuk mulai.
                  </TableCell>
                </TableRow>
              ) : (
                pinjamanAktif.slice(0, 5).map((l) => {
                  const uiStatus = backendStatusToFrontend(l.status);
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="font-mono text-xs font-semibold">
                        #{l.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatRp(Number(l.nominal))}
                      </TableCell>
                      <TableCell className="text-center">{l.tenorBulan} bln</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={loanStatusTone[uiStatus] || ""}>
                          {uiStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {l.tanggalPengajuan ? new Date(l.tanggalPengajuan).toLocaleDateString("id-ID", {
                          day: "2-digit", month: "short", year: "numeric"
                        }) : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Action Buttons */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Button asChild variant="outline" className="h-auto justify-start gap-3 p-4">
          <Link to="/pengajuan">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
              <FilePlus2 className="size-5" />
            </span>
            <div className="text-left">
              <p className="font-semibold">Pengajuan USIPA</p>
              <p className="text-xs text-muted-foreground">Ajukan pinjaman &amp; unggah berkas</p>
            </div>
            <ArrowRight className="ml-auto size-4 text-muted-foreground" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto justify-start gap-3 p-4">
          <Link to="/simpanan">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-success/15 text-success">
              <PiggyBank className="size-5" />
            </span>
            <div className="text-left">
              <p className="font-semibold">Simpanan Saya</p>
              <p className="text-xs text-muted-foreground">Saldo pokok, wajib &amp; sukarela</p>
            </div>
            <ArrowRight className="ml-auto size-4 text-muted-foreground" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto justify-start gap-3 p-4">
          <Link to="/angsuran">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-gold-soft text-accent-foreground">
              <Banknote className="size-5" />
            </span>
            <div className="text-left">
              <p className="font-semibold">Riwayat Angsuran</p>
              <p className="text-xs text-muted-foreground">Jadwal cicilan &amp; kwitansi pembayaran</p>
            </div>
            <ArrowRight className="ml-auto size-4 text-muted-foreground" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   7. PENGAWAS KOPERASI DASHBOARD
   ───────────────────────────────────────────────────────────────────────────── */

function PengawasDashboard() {
  const { satminkal } = useSession();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Pengawas Koperasi"
        description={`Audit Transparansi, Pengawasan Distribusi SHU, & Akuntabilitas ${satminkal}`}
        actions={
          <Button asChild>
            <Link to="/shu">
              <Calculator className="mr-1.5 size-4" /> Buka Pengawasan SHU
            </Link>
          </Button>
        }
      />

      {/* Pengawas KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Alokasi Cadangan Koperasi</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-primary">40%</p>
            <p className="text-xs text-muted-foreground mt-1">Sesuai AD/ART Juknis TNI AD</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Jasa Usaha Anggota</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-success">30%</p>
            <p className="text-xs text-muted-foreground mt-1">Proporsional aktivitas belanja/pinjaman</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Jasa Modal Anggota</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-foreground">20%</p>
            <p className="text-xs text-muted-foreground mt-1">Proporsional simpanan pokok &amp; wajib</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Dana Pengurus &amp; Sosial</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-accent-foreground">10%</p>
            <p className="text-xs text-muted-foreground mt-1">5% Pengurus · 5% Sosial Pendidikan</p>
          </CardContent>
        </Card>
      </div>

      {/* SHU Breakdown Calculator */}
      <ShuBreakdown />

      {/* Approval Trail Timeline */}
      <ApprovalTrailTimeline />
    </div>
  );
}

