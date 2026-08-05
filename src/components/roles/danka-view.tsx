import { useState } from "react";
import { ThumbsUp, ThumbsDown, Eye, Users } from "lucide-react";
import { toast } from "sonner";

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
  anggotaList,
  formatRp,
  hitungAngsuran,
  loanStatusTone,
  stageStatus,
} from "@/lib/casheva-data";
import { cn } from "@/lib/utils";

export function DanKaView() {
  const { loans, recommendLoan } = useSession();
  const antrean = loans.filter((l) => !l.rejected && l.stage === 3);
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = loans.find((l) => l.id === activeId) ?? antrean[0] ?? null;
  const [note, setNote] = useState("");

  const submit = (approve: boolean) => {
    if (!active) return;
    if (!note.trim()) {
      toast.error("Catatan Pimpinan wajib diisi");
      return;
    }
    recommendLoan(active.id, approve, note.trim());
    toast[approve ? "success" : "warning"](
      approve
        ? `Rekomendasi dikirim — notifikasi masuk ke dasbor Kaprim`
        : `${active.id} ditolak pimpinan`,
    );
    setNote("");
    setActiveId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Pimpinan Approval & Unit Monitoring"
        description="Pantau pinjaman aktif prajurit di bawah komando dan berikan rekomendasi"
        actions={
          <Badge variant="outline" className="bg-gold-soft text-accent-foreground">
            {antrean.length} menunggu rekomendasi
          </Badge>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="shadow-card">
          <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
            <div className="min-w-0">
              <CardTitle className="text-base">Monitoring Pinjaman Satuan</CardTitle>
              <CardDescription>Mode baca-saja · tanpa hak ubah data</CardDescription>
            </div>
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
              <Eye className="size-4" />
            </span>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prajurit</TableHead>
                  <TableHead>Satminkal</TableHead>
                  <TableHead className="text-right">Simpanan</TableHead>
                  <TableHead className="text-right">Pinjaman Aktif</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anggotaList.slice(0, 14).map((a) => (
                  <TableRow key={a.nrp}>
                    <TableCell>
                      <p className="font-medium">
                        {a.pangkat} {a.nama}
                      </p>
                      <p className="text-xs text-muted-foreground">NRP {a.nrp}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{a.satminkal}</TableCell>
                    <TableCell className="text-right">
                      {formatRp(a.simpananWajib + a.simpananSukarela)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-semibold",
                        a.pinjamanAktif > 0 ? "text-gold" : "text-muted-foreground",
                      )}
                    >
                      {a.pinjamanAktif > 0 ? formatRp(a.pinjamanAktif) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{a.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
              <div className="min-w-0">
                <CardTitle className="text-base">Antrean Rekomendasi</CardTitle>
                <CardDescription>Lolos screening Juru Bayar</CardDescription>
              </div>
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-gold-soft text-accent-foreground">
                <Users className="size-4" />
              </span>
            </CardHeader>
            <CardContent className="space-y-2">
              {antrean.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Tidak ada berkas menunggu rekomendasi.
                </p>
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
                </button>
              ))}
            </CardContent>
          </Card>

          {active && (
            <Card className="shadow-card animate-fade-in">
              <CardHeader>
                <CardTitle className="text-base">Panel Rekomendasi {active.id}</CardTitle>
                <CardDescription>
                  {active.pangkat} {active.nama} · {active.tujuan}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <LoanStepper stage={active.stage} rejected={active.rejected} />
                <div className="rounded-xl bg-muted p-3 text-sm">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Catatan Juru Bayar
                  </p>
                  <p className="mt-1">{active.catatanJurbay ?? "—"}</p>
                </div>
                <Badge
                  variant="outline"
                  className={loanStatusTone[stageStatus(active.stage, active.rejected)]}
                >
                  {stageStatus(active.stage, active.rejected)}
                </Badge>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Catatan Pimpinan (wajib)</p>
                  <Textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Contoh: yang bersangkutan berkelakuan baik dan layak dibantu."
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button className="flex-1" onClick={() => submit(true)}>
                    <ThumbsUp className="mr-2 size-4" /> Rekomendasikan
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => submit(false)}
                  >
                    <ThumbsDown className="mr-2 size-4" /> Tolak
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
