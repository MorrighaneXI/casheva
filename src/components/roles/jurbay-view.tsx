import { useState } from "react";
import { ShieldCheck, XCircle, Wallet, TrendingDown } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { LoanStepper } from "@/components/loan-stepper";
import { LoanCalculator } from "@/components/loan-calculator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from "@/components/session-context";
import {
  formatRp,
  hitungAngsuran,
  loanStatusTone,
  stageStatus,
} from "@/lib/casheva-data";
import { cn } from "@/lib/utils";

export function JurbayView() {
  const { loans, screenLoan } = useSession();
  const antrean = loans.filter((l) => !l.rejected && l.stage <= 2);
  const [activeId, setActiveId] = useState<string | null>(antrean[0]?.id ?? null);
  const active = loans.find((l) => l.id === activeId) ?? antrean[0] ?? loans[0];
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState(active?.jumlah ?? 10_000_000);
  const [tenor, setTenor] = useState(active?.tenor ?? 24);

  if (!active) return null;

  const thp = active.gajiPokok + active.ulp + active.tunkin;
  const ang = hitungAngsuran(active.jumlah, active.tenor).angsuran;
  const rasio = ((ang + active.potonganLain) / thp) * 100;
  const eligible = rasio <= 40;

  const submit = (isEligible: boolean) => {
    if (!note.trim()) {
      toast.error("Catatan Juru Bayar wajib diisi");
      return;
    }
    screenLoan(active.id, isEligible, note.trim());
    toast[isEligible ? "success" : "warning"](
      isEligible
        ? `${active.id} diteruskan ke Dan/Ka`
        : `${active.id} ditandai tidak layak`,
    );
    setNote("");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Jurbay Financial Screening Center"
        description="Penilaian kelayakan finansial pemohon sebelum diteruskan ke Dan/Ka"
        actions={
          <Badge variant="outline" className="bg-gold-soft text-accent-foreground">
            {antrean.length} berkas menunggu screening
          </Badge>
        }
      />

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Antrean Pengajuan Anggota</CardTitle>
          <CardDescription>Pilih pemohon untuk membuka panel evaluasi</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Pengajuan</TableHead>
                <TableHead>Pemohon</TableHead>
                <TableHead>Keperluan</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead className="text-center">Tenor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans
                .filter((l) => l.stage <= 3)
                .map((l) => (
                  <TableRow
                    key={l.id}
                    onClick={() => {
                      setActiveId(l.id);
                      setAmount(l.jumlah);
                      setTenor(l.tenor);
                    }}
                    className={cn(
                      "cursor-pointer transition-colors",
                      l.id === active.id && "bg-primary-soft/60",
                    )}
                  >
                    <TableCell className="font-mono text-xs">{l.id}</TableCell>
                    <TableCell>
                      <p className="font-medium">
                        {l.pangkat} {l.nama}
                      </p>
                      <p className="text-xs text-muted-foreground">NRP {l.nrp}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{l.tujuan}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatRp(l.jumlah)}
                    </TableCell>
                    <TableCell className="text-center">{l.tenor} bln</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={loanStatusTone[stageStatus(l.stage, l.rejected)]}
                      >
                        {stageStatus(l.stage, l.rejected)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Alur Berkas {active.id}</CardTitle>
        </CardHeader>
        <CardContent>
          <LoanStepper stage={active.stage} rejected={active.rejected} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="shadow-card">
          <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
            <div className="min-w-0">
              <CardTitle className="text-base">
                Panel Evaluasi Finansial — {active.pangkat} {active.nama}
              </CardTitle>
              <CardDescription>
                {active.satminkal} · NRP {active.nrp}
              </CardDescription>
            </div>
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
              <Wallet className="size-4" />
            </span>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Gaji Pokok", active.gajiPokok],
                ["ULP", active.ulp],
                ["Tunkin", active.tunkin],
                ["Potongan Lain", active.potonganLain],
              ].map(([k, v]) => (
                <div key={k as string} className="rounded-xl border border-border p-3">
                  <p className="text-[11px] text-muted-foreground">{k as string}</p>
                  <p className="mt-1 text-sm font-bold break-words">
                    {formatRp(v as number)}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-muted p-3">
                <p className="text-[11px] text-muted-foreground">Take Home Pay</p>
                <p className="text-sm font-bold break-words">{formatRp(thp)}</p>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <p className="text-[11px] text-muted-foreground">Angsuran Diajukan</p>
                <p className="text-sm font-bold break-words">{formatRp(ang)}</p>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <p className="text-[11px] text-muted-foreground">Pinjaman Berjalan</p>
                <p className="text-sm font-bold break-words">
                  {formatRp(active.pinjamanBerjalan)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <TrendingDown className="size-4" /> Rasio Potongan terhadap THP
                </span>
                <span
                  className={cn(
                    "font-bold",
                    eligible ? "text-success" : "text-destructive",
                  )}
                >
                  {rasio.toFixed(1)}% / maks 40%
                </span>
              </div>
              <Progress value={Math.min(rasio, 100)} />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Catatan Juru Bayar (wajib)</p>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contoh: rasio angsuran aman, dokumen lengkap, layak diteruskan."
                rows={3}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => submit(true)} className="flex-1 sm:flex-none">
                <ShieldCheck className="mr-2 size-4" /> ELIGIBLE — Teruskan ke Dan/Ka
              </Button>
              <Button
                variant="destructive"
                onClick={() => submit(false)}
                className="flex-1 sm:flex-none"
              >
                <XCircle className="mr-2 size-4" /> NOT ELIGIBLE — Tolak
              </Button>
            </div>
          </CardContent>
        </Card>

        <LoanCalculator
          amount={amount}
          tenor={tenor}
          onAmount={setAmount}
          onTenor={setTenor}
        />
      </div>
    </div>
  );
}
