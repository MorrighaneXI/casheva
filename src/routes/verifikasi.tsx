import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Check,
  FileText,
  UploadCloud,
  X,
  CircleDot,
  Paperclip,
  Calculator,
} from "lucide-react";
import { toast } from "sonner";

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
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatRp, workflowSteps } from "@/lib/casheva-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/verifikasi")({
  head: () => ({
    meta: [
      { title: "Verification Center — Casheva Koperasi TNI AD" },
      {
        name: "description",
        content:
          "Alur verifikasi pengajuan pinjaman berjenjang: Jurbay, Dan/Ka, Kaprim, unggah berkas, hingga pencairan.",
      },
      { property: "og:title", content: "Verification Center — Casheva" },
      {
        property: "og:description",
        content: "Kelola persetujuan pinjaman koperasi TNI AD secara berjenjang.",
      },
    ],
  }),
  component: VerificationCenter,
});

const docs = [
  "Surat Permohonan",
  "Rekomendasi Jurbay",
  "Rekomendasi Dan/Ka",
  "Slip Gaji 3 Bulan",
  "Fotokopi KTA / KTP",
  "Surat Pernyataan Potong Gaji",
];

function VerificationCenter() {
  const [current, setCurrent] = useState(3);
  const [amount, setAmount] = useState(15_000_000);
  const [tenor, setTenor] = useState(24);
  const [uploaded, setUploaded] = useState<Record<string, string>>({
    "Surat Permohonan": "surat-permohonan.pdf",
    "Rekomendasi Jurbay": "rekomendasi-jurbay.pdf",
  });
  const [dialog, setDialog] = useState<null | "approve" | "reject">(null);
  const [note, setNote] = useState("");
  const [dragOver, setDragOver] = useState<string | null>(null);

  const calc = useMemo(() => {
    const rate = 0.12;
    const bunga = amount * rate * (tenor / 12);
    const total = amount + bunga;
    const angsuran = total / tenor;
    const adminFee = amount * 0.01;
    return { bunga, total, angsuran, adminFee, net: amount - adminFee };
  }, [amount, tenor]);

  const submit = () => {
    if (dialog === "approve") {
      setCurrent((c) => Math.min(c + 1, workflowSteps.length));
      toast.success("Pengajuan disetujui", {
        description: `Tahap lanjut: ${workflowSteps[Math.min(current, workflowSteps.length - 1)]}`,
      });
    } else {
      toast.error("Pengajuan ditolak", {
        description: note ? `Catatan: ${note}` : "Tanpa catatan peninjau",
      });
    }
    setDialog(null);
    setNote("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verification Center"
        description="PJM-2026-0184 · Serma Budi Santoso · Satminkal Disinfolahtad"
        actions={
          <Badge variant="outline" className="border-gold/40 bg-gold-soft text-accent-foreground">
            Menunggu ACC Kaprim
          </Badge>
        }
      />

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Alur Persetujuan</CardTitle>
          <CardDescription>Progres pengajuan pinjaman berjenjang</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="flex gap-2 overflow-x-auto pb-2">
            {workflowSteps.map((step, i) => {
              const idx = i + 1;
              const done = idx < current;
              const active = idx === current;
              return (
                <li key={step} className="flex min-w-[150px] flex-1 items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        "h-1.5 rounded-full transition-colors",
                        done ? "bg-primary" : active ? "bg-gold" : "bg-muted",
                      )}
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={cn(
                          "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                          done
                            ? "bg-primary text-primary-foreground"
                            : active
                              ? "bg-gold text-gold-foreground"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        {done ? <Check className="size-3.5" /> : idx}
                      </span>
                      <span
                        className={cn(
                          "truncate text-xs font-medium",
                          active ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {step}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      <Tabs defaultValue="kalkulator">
        <TabsList>
          <TabsTrigger value="kalkulator">
            <Calculator className="mr-2 size-4" /> Kalkulator Pinjaman
          </TabsTrigger>
          <TabsTrigger value="berkas">
            <Paperclip className="mr-2 size-4" /> Berkas Persyaratan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kalkulator" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="shadow-card lg:col-span-3">
              <CardHeader>
                <CardTitle>Simulasi Pinjaman</CardTitle>
                <CardDescription>Bunga menurun tetap 12% per tahun</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label>Jumlah Pinjaman</Label>
                    <Input
                      value={amount}
                      onChange={(e) =>
                        setAmount(
                          Math.min(20_000_000, Math.max(1_000_000, Number(e.target.value) || 0)),
                        )
                      }
                      className="h-9 w-44 text-right font-semibold"
                    />
                  </div>
                  <Slider
                    value={[amount]}
                    min={1_000_000}
                    max={20_000_000}
                    step={500_000}
                    onValueChange={([v]) => setAmount(v ?? amount)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatRp(1_000_000)}</span>
                    <span>{formatRp(20_000_000)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label>Tenor</Label>
                    <span className="text-sm font-semibold">{tenor} bulan</span>
                  </div>
                  <Slider
                    value={[tenor]}
                    min={1}
                    max={36}
                    step={1}
                    onValueChange={([v]) => setTenor(v ?? tenor)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 bulan</span>
                    <span>36 bulan</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card lg:col-span-2">
              <CardHeader>
                <CardTitle>Rincian Perhitungan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  ["Pokok pinjaman", formatRp(amount)],
                  ["Bunga 12% p.a.", formatRp(calc.bunga)],
                  ["Total kewajiban", formatRp(calc.total)],
                  ["Biaya administrasi 1%", formatRp(calc.adminFee)],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
                <Separator />
                <div className="rounded-xl bg-primary-soft p-3">
                  <p className="text-xs text-primary">Angsuran per bulan</p>
                  <p className="text-xl font-extrabold text-primary">
                    {formatRp(calc.angsuran)}
                  </p>
                </div>
                <div className="rounded-xl bg-gold-soft p-3">
                  <p className="text-xs text-accent-foreground">Dana diterima bersih</p>
                  <p className="text-xl font-extrabold text-accent-foreground">
                    {formatRp(calc.net)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="berkas" className="mt-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Unggah Dokumen</CardTitle>
              <CardDescription>Format PDF, JPG, atau PNG maksimal 5 MB per berkas</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {docs.map((d) => {
                const file = uploaded[d];
                return (
                  <div
                    key={d}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(d);
                    }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(null);
                      const f = e.dataTransfer.files?.[0];
                      setUploaded((u) => ({ ...u, [d]: f ? f.name : "berkas-terunggah.pdf" }));
                      toast.success(`${d} berhasil diunggah`);
                    }}
                    className={cn(
                      "rounded-xl border-2 border-dashed p-4 transition-colors",
                      dragOver === d
                        ? "border-gold bg-gold-soft"
                        : file
                          ? "border-success/40 bg-success/10"
                          : "border-border bg-muted/40",
                    )}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-card text-muted-foreground">
                        {file ? (
                          <FileText className="size-4 text-success" />
                        ) : (
                          <UploadCloud className="size-4" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{d}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {file ?? "Tarik & lepas berkas ke sini, atau pilih manual"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={file ? "ghost" : "outline"}
                        className="shrink-0"
                        onClick={() => {
                          if (file) {
                            setUploaded((u) => {
                              const n = { ...u };
                              delete n[d];
                              return n;
                            });
                            toast("Berkas dihapus");
                          } else {
                            setUploaded((u) => ({ ...u, [d]: "berkas-terunggah.pdf" }));
                            toast.success(`${d} berhasil diunggah`);
                          }
                        }}
                      >
                        {file ? "Hapus" : "Pilih"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="shadow-card">
        <CardContent className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-5 sm:flex sm:justify-between">
          <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            <CircleDot className="size-4 shrink-0 text-gold" />
            <span className="truncate">
              Menunggu keputusan tahap {current}: {workflowSteps[current - 1]}
            </span>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="destructive" onClick={() => setDialog("reject")}>
              <X className="mr-1 size-4" /> Tolak
            </Button>
            <Button onClick={() => setDialog("approve")}>
              <Check className="mr-1 size-4" /> Setujui
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === "approve" ? "Setujui Pengajuan" : "Tolak Pengajuan"}
            </DialogTitle>
            <DialogDescription>
              Catatan peninjau akan tercatat pada riwayat persetujuan PJM-2026-0184.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tulis catatan peninjau…"
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Batal
            </Button>
            <Button
              variant={dialog === "reject" ? "destructive" : "default"}
              onClick={submit}
            >
              Kirim Keputusan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
