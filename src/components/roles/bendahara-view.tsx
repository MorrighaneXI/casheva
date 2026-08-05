import { useState } from "react";
import { UploadCloud, Banknote, FileCheck2, Paperclip, Receipt } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { useSession } from "@/components/session-context";
import {
  REQUIRED_DOCS,
  formatRp,
  hitungAngsuran,
  loanStatusTone,
  stageStatus,
} from "@/lib/casheva-data";
import { cn } from "@/lib/utils";

export function BendaharaView() {
  const { loans, toggleDoc, disburse } = useSession();
  const antrean = loans.filter((l) => !l.rejected && (l.stage === 5 || l.stage === 6));
  const cair = loans.filter((l) => l.stage === 7);
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = loans.find((l) => l.id === activeId) ?? antrean[0] ?? null;
  const [dragOver, setDragOver] = useState<string | null>(null);

  const lengkap = active ? active.docs.length === REQUIRED_DOCS.length : false;

  const handleDisburse = () => {
    if (!active) return;
    if (!lengkap) {
      toast.error("Lengkapi seluruh berkas sebelum pencairan");
      return;
    }
    const inv = disburse(active.id);
    toast.success(`Dana dicairkan — Kwitansi ${inv}`);
    setActiveId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Bendahara Financial & Document Management"
        description="Kelengkapan berkas fisik dan pencairan dana pinjaman yang telah di-ACC Kaprim"
        actions={
          <Badge variant="outline" className="bg-gold-soft text-accent-foreground">
            {antrean.length} antre pencairan
          </Badge>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="shadow-card lg:sticky lg:top-24 lg:self-start">
          <CardHeader>
            <CardTitle className="text-base">Antrean Pencairan</CardTitle>
            <CardDescription>Disetujui Kaprim</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {antrean.length === 0 && (
              <p className="text-sm text-muted-foreground">Tidak ada antrean pencairan.</p>
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
                  {formatRp(l.jumlah)} · berkas {l.docs.length}/{REQUIRED_DOCS.length}
                </p>
                <Progress
                  className="mt-2 h-1.5"
                  value={(l.docs.length / REQUIRED_DOCS.length) * 100}
                />
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {active ? (
            <>
              <Card className="shadow-card">
                <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base">
                      {active.id} — {active.pangkat} {active.nama}
                    </CardTitle>
                    <CardDescription>
                      {active.satminkal} · {formatRp(active.jumlah)} · {active.tenor} bln ·
                      angsuran {formatRp(hitungAngsuran(active.jumlah, active.tenor).angsuran)}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={loanStatusTone[stageStatus(active.stage, active.rejected)]}
                  >
                    {stageStatus(active.stage, active.rejected)}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <LoanStepper stage={active.stage} rejected={active.rejected} />
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base">Unggah Berkas Fisik Bertanda Tangan</CardTitle>
                    <CardDescription>
                      Seret berkas ke kotak atau klik untuk menandai terunggah
                    </CardDescription>
                  </div>
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                    <UploadCloud className="size-4" />
                  </span>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {REQUIRED_DOCS.map((doc) => {
                    const done = active.docs.includes(doc);
                    return (
                      <button
                        key={doc}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOver(doc);
                        }}
                        onDragLeave={() => setDragOver(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOver(null);
                          if (!done) toggleDoc(active.id, doc);
                          toast.success(`${doc} terunggah`);
                        }}
                        onClick={() => {
                          toggleDoc(active.id, doc);
                          toast[done ? "warning" : "success"](
                            done ? `${doc} dihapus` : `${doc} terunggah`,
                          );
                        }}
                        className={cn(
                          "rounded-xl border-2 border-dashed p-4 text-left transition-all",
                          done
                            ? "border-success/50 bg-success/10"
                            : "border-border hover:border-primary/40 hover:bg-muted",
                          dragOver === doc && "scale-[1.02] border-gold bg-gold-soft",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {done ? (
                            <FileCheck2 className="size-4 shrink-0 text-success" />
                          ) : (
                            <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                          )}
                          <span className="truncate text-sm font-medium">{doc}</span>
                        </div>
                        <p className="mt-1 truncate text-[11px] text-muted-foreground">
                          {done
                            ? `${doc.toLowerCase().replace(/\s+/g, "-")}.pdf`
                            : "Belum ada berkas · PDF/JPG maks 5 MB"}
                        </p>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardContent className="grid gap-3 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      Kelengkapan berkas {active.docs.length}/{REQUIRED_DOCS.length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Nomor kwitansi otomatis dibuat saat pencairan.
                    </p>
                  </div>
                  <Button onClick={handleDisburse} disabled={!lengkap} className="shrink-0">
                    <Banknote className="mr-2 size-4" /> Cairkan Dana
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="shadow-card">
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                Pilih berkas dari antrean pencairan.
              </CardContent>
            </Card>
          )}

          <Card className="shadow-card">
            <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
              <div className="min-w-0">
                <CardTitle className="text-base">Riwayat Pencairan</CardTitle>
                <CardDescription>Invoice / kwitansi terbit otomatis</CardDescription>
              </div>
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-success/15 text-success">
                <Receipt className="size-4" />
              </span>
            </CardHeader>
            <CardContent className="space-y-2">
              {cair.length === 0 && (
                <p className="text-sm text-muted-foreground">Belum ada pencairan.</p>
              )}
              {cair.map((l) => (
                <div
                  key={l.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {l.pangkat} {l.nama} · {l.id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRp(l.jumlah)} · {l.tenor} bln
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 font-mono text-[11px]">
                    {l.invoice ?? "#INV—"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
