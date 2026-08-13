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
  ArrowLeft,
  AlertTriangle,
  Eye,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { antreanJuyar, formatRp, workflowSteps } from "@/lib/casheva-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/verifikasi")({
  head: () => ({
    meta: [
      { title: "Antrean Verifikasi Juru Bayar — Casheva" },
      {
        name: "description",
        content:
          "Verifikasi kelayakan gaji anggota sebelum pengajuan pinjaman diteruskan ke Dan/Ka.",
      },
      { property: "og:title", content: "Antrean Verifikasi — Casheva" },
      {
        property: "og:description",
        content: "Verifikasi berjenjang pengajuan pinjaman koperasi TNI AD.",
      },
    ],
  }),
  component: VerificationCenter,
});

const docs = [
  "Surat Permohonan",
  "Rekomendasi Jurbay",
  "Slip Gaji 3 Bulan",
  "Fotokopi KTA / KTP",
  "Surat Pernyataan Potong Gaji",
];

type JuyarItem = (typeof antreanJuyar)[number];

function VerificationCenter() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = antreanJuyar.find((r) => r.id === selectedId) ?? null;

  if (!selected) {
    return <JuyarPersonList onOpen={setSelectedId} />;
  }

  return (
    <JuyarDetail
      item={selected}
      onBack={() => setSelectedId(null)}
    />
  );
}

function JuyarPersonList({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Antrean Verifikasi"
        description="Daftar pemohon menunggu verifikasi kelayakan gaji oleh Juru Bayar"
        actions={
          <Badge variant="outline" className="border-gold/40 bg-gold-soft text-accent-foreground">
            {antreanJuyar.length} antrean
          </Badge>
        }
      />

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Pemohon per Orang</CardTitle>
          <CardDescription>
            Pilih anggota lalu buka detail untuk mengecek kelayakan dan berkas
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pemohon</TableHead>
                <TableHead>Satminkal</TableHead>
                <TableHead className="text-right">Plafon</TableHead>
                <TableHead className="text-center">Tenor</TableHead>
                <TableHead>Kelayakan Sistem</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {antreanJuyar.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="font-medium">
                      {r.pangkat} {r.nama}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {r.id} · NRP {r.nrp}
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.satminkal}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatRp(r.plafon)}
                  </TableCell>
                  <TableCell className="text-center">{r.tenor} bln</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        r.layak
                          ? "border-success/30 bg-success/15 text-success"
                          : "border-destructive/30 bg-destructive/10 text-destructive"
                      }
                    >
                      {r.layak ? "Direkomendasikan" : "Tidak direkomendasikan"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => onOpen(r.id)}>
                      <Eye className="mr-1 size-3.5" /> Selengkapnya
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

function JuyarDetail({ item, onBack }: { item: JuyarItem; onBack: () => void }) {
  const [current, setCurrent] = useState(1);
  const [amount, setAmount] = useState(item.plafon);
  const [tenor, setTenor] = useState(item.tenor);
  const [uploaded, setUploaded] = useState<Record<string, string>>({
    "Surat Permohonan": "surat-permohonan.pdf",
    "Slip Gaji 3 Bulan": "slip-gaji.pdf",
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
    const rasio = item.sisaGaji > 0 ? angsuran / item.sisaGaji : 1;
    return { bunga, total, angsuran, adminFee, net: amount - adminFee, rasio };
  }, [amount, tenor, item.sisaGaji]);

  const submit = () => {
    if (dialog === "approve") {
      setCurrent((c) => Math.min(c + 1, workflowSteps.length));
      toast.success("Lolos verifikasi Juru Bayar", {
        description: `${item.id} diteruskan ke Dan/Ka untuk rekomendasi.`,
      });
    } else {
      toast.error("Tidak direkomendasikan", {
        description: note ? `Catatan: ${note}` : item.catatan,
      });
    }
    setDialog(null);
    setNote("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detail Verifikasi"
        description={`${item.id} · ${item.pangkat} ${item.nama} · ${item.satminkal}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-1 size-4" /> Kembali ke antrean
            </Button>
            <Badge
              variant="outline"
              className={
                item.layak
                  ? "border-success/30 bg-success/15 text-success"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              }
            >
              {item.layak ? "Sistem: Layak" : "Sistem: Tidak layak"}
            </Badge>
          </div>
        }
      />

      {!item.layak ? (
        <Card className="border-destructive/30 bg-destructive/5 shadow-card">
          <CardContent className="flex flex-wrap items-start justify-between gap-4 py-5">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-destructive/15 text-destructive">
                <AlertTriangle className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-destructive">Peringatan: tidak direkomendasikan</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.catatan}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Rasio angsuran terhadap sisa gaji: {(calc.rasio * 100).toFixed(1)}% (ambang 40%)
                </p>
              </div>
            </div>
            <Button variant="destructive" onClick={() => setDialog("reject")}>
              <X className="mr-1 size-4" /> Tidak Direkomendasikan
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Evaluasi Gaji &amp; Potongan</CardTitle>
          <CardDescription>Perhitungan kelayakan sebelum lanjut ke Dan/Ka</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          {[
            ["Gaji pokok", formatRp(item.gaji)],
            ["Tunkin", formatRp(item.tunkin)],
            ["Potongan berjalan", formatRp(item.potongan)],
            ["Sisa gaji", formatRp(item.sisaGaji)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">{k}</p>
              <p className="mt-1 font-semibold">{v}</p>
            </div>
          ))}
        </CardContent>
      </Card>

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
              <CardTitle>Unggah / Cek Dokumen</CardTitle>
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
              Menunggu keputusan Juru Bayar — lanjut ke Dan/Ka jika lolos
            </span>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="destructive" onClick={() => setDialog("reject")}>
              <X className="mr-1 size-4" /> Tidak Direkomendasikan
            </Button>
            <Button onClick={() => setDialog("approve")} disabled={!item.layak && calc.rasio > 0.4}>
              <Check className="mr-1 size-4" /> Lolos Verifikasi
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === "approve" ? "Loloskan ke Dan/Ka" : "Tidak Direkomendasikan"}
            </DialogTitle>
            <DialogDescription>
              Catatan peninjau akan tercatat pada riwayat persetujuan {item.id}.
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
