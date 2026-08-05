import { useState } from "react";
import {
  Wallet,
  HandCoins,
  TrendingUp,
  Users,
  BadgeCheck,
  Undo2,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "@/components/page-header";
import { LoanStepper } from "@/components/loan-stepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/components/session-context";
import { formatRp, hitungAngsuran, trenData } from "@/lib/casheva-data";
import { cn } from "@/lib/utils";

const kpis = [
  { label: "Total Kas Koperasi", value: formatRp(4_820_000_000), delta: "+5,1% MoM", icon: Wallet },
  { label: "Total Simpanan Anggota", value: formatRp(16_940_000_000), delta: "+6,2% YoY", icon: Users },
  { label: "Total Pinjaman Berjalan", value: formatRp(11_950_000_000), delta: "+4,8% YoY", icon: HandCoins },
  { label: "Estimasi SHU 2026", value: formatRp(1_284_500_000), delta: "+9,1% proyeksi", icon: TrendingUp },
];

export function KaprimView() {
  const { loans, finalApprove } = useSession();
  const antrean = loans.filter((l) => !l.rejected && l.stage === 4);
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = loans.find((l) => l.id === activeId) ?? antrean[0] ?? null;
  const [note, setNote] = useState("");

  const submit = (approve: boolean) => {
    if (!active) return;
    finalApprove(active.id, approve, note.trim() || "—");
    toast[approve ? "success" : "warning"](
      approve
        ? `Final ACC ${active.id} — diteruskan ke Bendahara`
        : `${active.id} dikembalikan ke Dan/Ka`,
    );
    setNote("");
    setActiveId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Executive Kaprim Dashboard"
        description="Persetujuan final pinjaman dan ringkasan kinerja koperasi"
        actions={
          <Badge variant="outline" className="bg-gold-soft text-accent-foreground">
            {antrean.length} menunggu Final ACC
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="shadow-card transition-transform hover:-translate-y-0.5">
            <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 pb-2">
              <CardDescription className="min-w-0 truncate">{kpi.label}</CardDescription>
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                <kpi.icon className="size-4" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-extrabold tracking-tight break-words">{kpi.value}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-success">
                <ArrowUpRight className="size-3.5" /> {kpi.delta}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="shadow-card lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Tren Simpanan vs Pinjaman</CardTitle>
            <CardDescription>Dalam juta rupiah, Jan – Des 2026</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trenData} margin={{ left: -18, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="kSimpanan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="kPinjaman" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="simpanan" name="Simpanan" stroke="var(--color-chart-1)" strokeWidth={2.5} fill="url(#kSimpanan)" />
                <Area type="monotone" dataKey="pinjaman" name="Pinjaman" stroke="var(--color-chart-2)" strokeWidth={2.5} fill="url(#kPinjaman)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Widget Persetujuan Final</CardTitle>
            <CardDescription>Prioritas berkas rekomendasi Dan/Ka</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {antrean.length === 0 && (
              <p className="text-sm text-muted-foreground">Tidak ada berkas menunggu ACC.</p>
            )}
            {antrean.map((l) => (
              <button
                key={l.id}
                onClick={() => setActiveId(l.id)}
                className={cn(
                  "w-full rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted",
                  active?.id === l.id && "border-primary/40 bg-primary-soft/60",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">
                    {l.pangkat} {l.nama}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                    {l.id}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatRp(l.jumlah)} · {l.tenor} bln ·{" "}
                  {formatRp(hitungAngsuran(l.jumlah, l.tenor).angsuran)}/bln
                </p>
                <p className="mt-1 line-clamp-2 text-xs italic text-muted-foreground">
                  “{l.catatanPimpinan ?? "Belum ada catatan pimpinan"}”
                </p>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {active && (
        <Card className="shadow-card animate-fade-in">
          <CardHeader>
            <CardTitle className="text-base">Keputusan Final — {active.id}</CardTitle>
            <CardDescription>
              {active.pangkat} {active.nama} · {active.satminkal} · {active.tujuan}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LoanStepper stage={active.stage} rejected={active.rejected} />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-muted p-3 text-sm">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Catatan Juru Bayar
                </p>
                <p className="mt-1">{active.catatanJurbay ?? "—"}</p>
              </div>
              <div className="rounded-xl bg-gold-soft p-3 text-sm">
                <p className="text-[11px] uppercase tracking-wide text-accent-foreground/80">
                  Catatan Pimpinan
                </p>
                <p className="mt-1">{active.catatanPimpinan ?? "—"}</p>
              </div>
            </div>
            <Textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan Kaprim (opsional)"
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => submit(true)}>
                <BadgeCheck className="mr-2 size-4" /> Final ACC (Setujui Pinjaman)
              </Button>
              <Button variant="outline" onClick={() => submit(false)}>
                <Undo2 className="mr-2 size-4" /> Kembalikan / Tolak
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
