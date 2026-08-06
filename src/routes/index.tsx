import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  Users,
  Wallet,
  HandCoins,
  TrendingUp,
  ArrowUpRight,
  ArrowRight,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  formatRp,
  loanStatusTone,
  recentLoans,
  trenData,
} from "@/lib/casheva-data";

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
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Eksekutif"
        description="Ringkasan kinerja koperasi periode Januari – Desember 2026"
        actions={
          <Button asChild>
            <Link to="/verifikasi">
              Buka Verification Center <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="shadow-card">
            <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 pb-2">
              <CardDescription className="min-w-0 truncate">
                {kpi.label}
              </CardDescription>
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                <kpi.icon className="size-4" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-extrabold tracking-tight break-words">
                {kpi.value}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-success">
                <ArrowUpRight className="size-3.5" />
                {kpi.delta}
              </p>
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

      <Card className="shadow-card">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>Pengajuan Pinjaman Terbaru</CardTitle>
            <CardDescription>Status alur persetujuan berjenjang</CardDescription>
          </div>
          <Button variant="outline" asChild>
            <Link to="/pinjaman">Lihat semua</Link>
          </Button>
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
                  <TableCell className="text-right font-semibold">
                    {formatRp(l.jumlah)}
                  </TableCell>
                  <TableCell className="text-center">{l.tenor} bln</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={loanStatusTone[l.status]}>
                      {l.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" asChild>
                      <Link to="/verifikasi">Tinjau</Link>
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
