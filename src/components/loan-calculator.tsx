import { Calculator } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { formatRp, hitungAngsuran } from "@/lib/casheva-data";

export function LoanCalculator({
  amount,
  tenor,
  onAmount,
  onTenor,
}: {
  amount: number;
  tenor: number;
  onAmount: (v: number) => void;
  onTenor: (v: number) => void;
}) {
  const c = hitungAngsuran(amount, tenor);

  const rows = [
    ["Angsuran pokok / bulan", formatRp(c.pokok)],
    ["Jasa / bunga 1% / bulan", formatRp(c.bunga)],
    ["Total bunga (tenor penuh)", formatRp(c.totalBunga)],
    ["Biaya administrasi 0,5%", formatRp(c.adminFee)],
  ] as const;

  return (
    <Card className="shadow-card">
      <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <div className="min-w-0">
          <CardTitle className="text-base">Simulasi Pinjaman</CardTitle>
          <CardDescription>Bunga 12% p.a. (1% flat per bulan)</CardDescription>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-gold-soft text-accent-foreground">
          <Calculator className="size-4" />
        </span>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label>Jumlah Pinjaman</Label>
            <span className="text-sm font-bold">{formatRp(amount)}</span>
          </div>
          <Slider
            value={[amount]}
            min={1_000_000}
            max={20_000_000}
            step={500_000}
            onValueChange={([v]) => onAmount(v ?? amount)}
          />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>Rp 1 jt</span>
            <span>Rp 20 jt</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label>Tenor</Label>
            <span className="text-sm font-bold">{tenor} bulan</span>
          </div>
          <Slider
            value={[tenor]}
            min={1}
            max={36}
            step={1}
            onValueChange={([v]) => onTenor(v ?? tenor)}
          />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>1 bln</span>
            <span>36 bln</span>
          </div>
        </div>

        <Separator />

        <div className="space-y-2 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-3">
              <span className="min-w-0 text-muted-foreground">{k}</span>
              <span className="shrink-0 font-medium">{v}</span>
            </div>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl bg-primary-soft p-3">
            <p className="text-[11px] text-primary">Angsuran per bulan</p>
            <p className="text-lg font-extrabold text-primary break-words">
              {formatRp(c.angsuran)}
            </p>
          </div>
          <div className="rounded-xl bg-gold-soft p-3">
            <p className="text-[11px] text-accent-foreground">Dana diterima (net)</p>
            <p className="text-lg font-extrabold text-accent-foreground break-words">
              {formatRp(c.netPayout)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
