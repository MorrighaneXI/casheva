import { createFileRoute, Link } from "@tanstack/react-router";
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
  angsuranData,
  anggotaAngsuranSaya,
  anggotaGajiProfile,
  formatRp,
  getLoanStatusCounts,
  loanStatusTone,
  recentLoans,
  trenData,
} from "@/lib/casheva-data";
import { canAccessPath, dashboardCta } from "@/lib/rbac";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard Eksekutif — Casheva Koperasi TNI AD" },
      {
        name: "description",
        content:
          "Ringkasan anggota aktif, kas simpanan, pinjaman berjalan, dan estimasi SHU koperasi TNI AD.",
      },
      { property: "og:title", content: "Dashboard Eksekutif — Casheva" },
      {
        property: "og:description",
        content: "KPI koperasi TNI AD: anggota, simpanan, pinjaman, dan SHU.",
      },
    ],
  }),
  component: Dashboard,
});

const kpis = [
  {
    label: "Total Anggota Aktif",
    value: "1.482",
    delta: "+3,4% dari bulan lalu",
    icon: Users,
  },
  {
    label: "Total Kas & Simpanan",
    value: formatRp(16_940_000_000),
    delta: "+6,2% YoY",
    icon: Wallet,
  },
  {
    label: "Total Pinjaman Berjalan",
    value: formatRp(11_950_000_000),
    delta: "+4,8% YoY",
    icon: HandCoins,
  },
  {
    label: "Estimasi SHU Tahun Berjalan",
    value: formatRp(1_284_500_000),
    delta: "+9,1% proyeksi",
    icon: TrendingUp,
  },
];

function Dashboard() {
  const { role } = useSession();
  const isAnggota = role === "Anggota";

  if (isAnggota) {
    return <AnggotaDashboard />;
  }

  return <ExecutiveDashboard />;
}

function AnggotaDashboard() {
  const cta = dashboardCta("Anggota");
  const p = anggotaGajiProfile;
  const bruto = p.gajiPokok + p.tunkin + p.tunjanganLain;
  const totalPotongan = p.potongan.reduce((sum, row) => sum + row.jumlah, 0);
  const netto = bruto - totalPotongan;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Anggota"
        description={`${p.pangkat} ${p.nama} · NRP ${p.nrp} · ${p.satminkal}`}
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

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Total Gaji Bruto</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <p className="text-xl font-extrabold">{formatRp(bruto)}</p>
            <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
              <Banknote className="size-4" />
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Total Potongan Gaji</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <p className="text-xl font-extrabold">{formatRp(totalPotongan)}</p>
            <span className="grid size-9 place-items-center rounded-lg bg-destructive/10 text-destructive">
              <Ban className="size-4" />
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Gaji Bersih Diterima</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <p className="text-xl font-extrabold text-success">{formatRp(netto)}</p>
            <span className="grid size-9 place-items-center rounded-lg bg-success/15 text-success">
              <TrendingUp className="size-4" />
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Rincian Potongan Gaji</CardTitle>
            <CardDescription>Potongan koperasi dan kewajiban berjalan</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jenis Potongan</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {p.potongan.map((row) => (
                  <TableRow key={row.nama}>
                    <TableCell>{row.nama}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatRp(row.jumlah)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Angsuran Pinjaman Saya</CardTitle>
            <CardDescription>Progress pembayaran angsuran berjalan</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Pinjaman</TableHead>
                  <TableHead className="text-center">Angsuran ke-</TableHead>
                  <TableHead className="text-right">Angsuran / bln</TableHead>
                  <TableHead className="text-right">Sisa</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anggotaAngsuranSaya.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.id}</TableCell>
                    <TableCell className="text-center">
                      {r.angsuranKe} / {r.totalAngsuran}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatRp(r.angsuranBulanan)}
                    </TableCell>
                    <TableCell className="text-right">{formatRp(r.sisa)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-success/30 bg-success/15 text-success"
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Button asChild variant="outline" className="h-auto justify-start gap-3 p-4">
          <Link to="/pengajuan">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
              <FilePlus2 className="size-5" />
            </span>
            <span className="text-left">
              <span className="block font-semibold">Ajukan Pinjaman / Simpanan</span>
              <span className="text-xs text-muted-foreground">
                Unggah berkas & kalkulasi otomatis
              </span>
            </span>
            <ArrowRight className="ml-auto size-4 text-muted-foreground" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto justify-start gap-3 p-4">
          <Link to="/angsuran">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-success/15 text-success">
              <ListChecks className="size-5" />
            </span>
            <span className="text-left">
              <span className="block font-semibold">Riwayat Angsuran</span>
              <span className="text-xs text-muted-foreground">
                Lihat sisa kewajiban dan progress pembayaran
              </span>
            </span>
            <ArrowRight className="ml-auto size-4 text-muted-foreground" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function ExecutiveDashboard() {
  const { role } = useSession();
  const cta = dashboardCta(role);
  const counts = getLoanStatusCounts();
  const canPinjaman = canAccessPath(role, "/pinjaman");
  const canVerifikasi = canAccessPath(role, "/verifikasi");
  const canRekomendasi = canAccessPath(role, "/rekomendasi");
  const reviewTo = canVerifikasi
    ? "/verifikasi"
    : canRekomendasi
      ? "/rekomendasi"
      : canPinjaman
        ? "/pinjaman"
        : "/";

  const statusKpis = [
    {
      label: "Pinjaman Dalam Proses",
      value: String(counts.proses),
      hint: "Pending · Verified · Approved Dan",
      icon: Hourglass,
      tone: "text-accent-foreground bg-gold-soft",
    },
    {
      label: "Pinjaman Disetujui (ACC)",
      value: String(counts.disetujui),
      hint: "ACC Kaprim · Sudah dicairkan",
      icon: BadgeCheck,
      tone: "text-primary bg-primary-soft",
    },
    {
      label: "Pinjaman Ditolak",
      value: String(counts.ditolak),
      hint: "Tidak lolos alur berjenjang",
      icon: Ban,
      tone: "text-destructive bg-destructive/10",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Eksekutif"
        description="Ringkasan kinerja koperasi periode Januari – Desember 2026"
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="shadow-card">
            <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 pb-2">
              <CardDescription className="min-w-0 truncate">{kpi.label}</CardDescription>
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                <kpi.icon className="size-4" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-extrabold tracking-tight break-words">{kpi.value}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-success">
                <ArrowUpRight className="size-3.5" />
                {kpi.delta}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {statusKpis.map((kpi) => (
          <Card key={kpi.label} className="shadow-card">
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

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="shadow-card lg:col-span-3">
          <CardHeader>
            <CardTitle>Tren Simpanan vs Pinjaman</CardTitle>
            <CardDescription>Dalam juta rupiah, Jan – Des 2026</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trenData} margin={{ left: -18, right: 8, top: 8 }}>
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
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
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
                  name="Simpanan"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2.5}
                  fill="url(#gSimpanan)"
                />
                <Area
                  type="monotone"
                  dataKey="pinjaman"
                  name="Pinjaman"
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
              <BarChart data={angsuranData} margin={{ left: -18, right: 8, top: 8 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
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
                <Bar
                  dataKey="target"
                  name="Target"
                  fill="var(--color-muted-foreground)"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="realisasi"
                  name="Realisasi"
                  fill="var(--color-chart-1)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>Pengajuan Pinjaman Terbaru</CardTitle>
            <CardDescription>Status alur persetujuan berjenjang</CardDescription>
          </div>
          {canPinjaman ? (
            <Button variant="outline" asChild>
              <Link to="/pinjaman">Lihat semua</Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Pengajuan</TableHead>
                <TableHead>Anggota</TableHead>
                <TableHead>Satminkal</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead className="text-center">Tenor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLoans.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono text-xs">{l.id}</TableCell>
                  <TableCell>
                    <p className="font-medium">{l.nama}</p>
                    <p className="text-xs text-muted-foreground">NRP {l.nrp}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{l.satminkal}</TableCell>
                  <TableCell className="text-right font-semibold">{formatRp(l.jumlah)}</TableCell>
                  <TableCell className="text-center">{l.tenor} bln</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={loanStatusTone[l.status]}>
                      {l.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" asChild>
                      <Link to={reviewTo as "/"}>Tinjau</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
