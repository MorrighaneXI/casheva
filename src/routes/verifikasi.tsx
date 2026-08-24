import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  FileText,
  UploadCloud,
  X,
  CircleDot,
  Calculator,
  ArrowLeft,
  AlertTriangle,
  Eye,
  Loader2,
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
import { formatRp, workflowSteps, backendStatusToFrontend, loanStatusTone, formatNamaLengkapDinas, formatPangkatKorps } from "@/lib/casheva-data";
import { cn } from "@/lib/utils";
import { apiPinjaman, type Pinjaman } from "@/lib/api";

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
  "Surat Permohonan Usipa",
  "Rekomendasi Juru Bayar",
  "Slip Gaji 3 Bulan Terakhir",
  "Fotokopi KTA / KTP",
  "Surat Pernyataan Potong Gaji",
];

function VerificationCenter() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: loans = [], isLoading } = useQuery({
    queryKey: ["pinjaman-list"],
    queryFn: () => apiPinjaman.findAll(),
  });

  const antreanVerifikasi = loans.filter((l) =>
    ["DIAJUKAN", "VERIFIKASI_PRIMKOP", "VERIFIKASI_JURU_BAYAR"].includes(l.status),
  );

  const selected = loans.find((r) => r.id === selectedId) ?? null;

  if (!selected) {
    return (
      <JuyarPersonList
        antrean={antreanVerifikasi}
        isLoading={isLoading}
        onOpen={setSelectedId}
      />
    );
  }

  return (
    <JuyarDetail
      item={selected}
      onBack={() => setSelectedId(null)}
    />
  );
}

function JuyarPersonList({
  antrean,
  isLoading,
  onOpen,
}: {
  antrean: Pinjaman[];
  isLoading: boolean;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Antrean Verifikasi Juru Bayar"
        description="Daftar pemohon menunggu verifikasi kelayakan gaji oleh Juru Bayar Satuan"
        actions={
          <Badge variant="outline" className="border-gold/40 bg-gold-soft text-accent-foreground">
            {antrean.length} berkas antrean
          </Badge>
        }
      />

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Daftar Pengajuan Masuk</CardTitle>
          <CardDescription>
            Pilih berkas anggota lalu buka detail untuk mengecek kelayakan gaji dan dokumen
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pemohon</TableHead>
                <TableHead>Pangkat / Korps</TableHead>
                <TableHead>Satminkal</TableHead>
                <TableHead className="text-right">Plafon</TableHead>
                <TableHead className="text-center">Tenor</TableHead>
                <TableHead>Status Alur</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-6 animate-spin mb-2" />
                    Memuat antrean verifikasi...
                  </TableCell>
                </TableRow>
              ) : (
                antrean.map((r) => {
                  const uiStatus = backendStatusToFrontend(r.status);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <p className="font-medium">{formatNamaLengkapDinas(r.anggota?.nama, r.anggota?.pangkat?.nama, r.anggota?.korps?.nama, r.anggota?.pangkat?.kategori)}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {r.id.slice(0, 8).toUpperCase()} · NRP {r.anggota?.nrpNip || "-"}
                        </p>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-foreground">
                        {formatPangkatKorps(r.anggota?.pangkat?.nama, r.anggota?.korps?.nama, r.anggota?.pangkat?.kategori)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.anggota?.satminkal?.nama || "Disinfolahtad"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatRp(Number(r.nominal))}
                      </TableCell>
                      <TableCell className="text-center">{r.tenorBulan} bln</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={loanStatusTone[uiStatus] || ""}>
                          {uiStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => onOpen(r.id)}>
                          <Eye className="mr-1 size-3.5" /> Verifikasi Berkas
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
              {!isLoading && antrean.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Tidak ada antrean verifikasi Juru Bayar saat ini. Semua pengajuan telah diproses.
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

function JuyarDetail({ item, onBack }: { item: Pinjaman; onBack: () => void }) {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<null | "approve" | "reject">(null);
  const [note, setNote] = useState("");

  const nominal = Number(item.nominal);
  const tenor = item.tenorBulan;

  // Estimasi simulasi gaji standar TNI AD
  const estimasiGajiPokok = 5_800_000;
  const estimasiTunkin = 2_900_000;
  const estimasiPotonganLain = 1_450_000;
  const angsuran = Math.floor(nominal / tenor) + Math.floor(nominal * 0.01);
  const sisaGaji = estimasiGajiPokok + estimasiTunkin - estimasiPotonganLain - angsuran;
  const rasio = (angsuran / (estimasiGajiPokok + estimasiTunkin)) * 100;
  const isLayak = rasio <= 40;

  const updateStatusMutation = useMutation({
    mutationFn: (dto: { status: any; catatan?: string; alasanPenolakan?: string }) =>
      apiPinjaman.updateStatus(item.id, dto),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["pinjaman-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      if (dialog === "approve") {
        toast.success("Lolos Verifikasi Juru Bayar", {
          description: `Pengajuan ${item.id.slice(0, 8).toUpperCase()} diteruskan ke Dan/Ka untuk rekomendasi pimpinan.`,
        });
      } else {
        toast.error("Pengajuan Ditolak", {
          description: `Pengajuan ${item.id.slice(0, 8).toUpperCase()} dikembalikan kepada pemohon.`,
        });
      }
      setDialog(null);
      onBack();
    },
    onError: (err: any) => {
      toast.error("Gagal Memperbarui Status", { description: err.message });
    },
  });

  const handleAction = () => {
    if (dialog === "approve") {
      updateStatusMutation.mutate({
        status: "REKOMENDASI_PIMPINAN",
        catatan: note || "Lolos verifikasi administrasi & kemampuan bayar Juru Bayar",
      });
    } else if (dialog === "reject") {
      updateStatusMutation.mutate({
        status: "DITOLAK",
        alasanPenolakan: note || "Sisa gaji tidak mencukupi atau berkas tidak memenuhi syarat",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detail Verifikasi Berkas Pinjaman"
        description={`${item.id.slice(0, 8).toUpperCase()} · ${formatNamaLengkapDinas(item.anggota?.nama, item.anggota?.pangkat?.nama, item.anggota?.korps?.nama, item.anggota?.pangkat?.kategori)} · ${item.anggota?.satminkal?.nama || "Disinfolahtad"}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-1 size-4" /> Kembali ke antrean
            </Button>
            <Badge
              variant="outline"
              className={
                isLayak
                  ? "border-success/30 bg-success/15 text-success"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              }
            >
              {isLayak ? "Evaluasi: Layak (Rasio < 40%)" : "Evaluasi: Melebihi Batas Aman"}
            </Badge>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <div className="rounded-xl border border-border p-4 bg-card shadow-card">
          <p className="text-xs text-muted-foreground">Plafon Pinjaman</p>
          <p className="mt-1 text-lg font-bold text-primary">{formatRp(nominal)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Tenor {tenor} Bulan</p>
        </div>
        <div className="rounded-xl border border-border p-4 bg-card shadow-card">
          <p className="text-xs text-muted-foreground">Angsuran per Bulan</p>
          <p className="mt-1 text-lg font-bold text-foreground">{formatRp(angsuran)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Pokok + Bunga 1% / bln</p>
        </div>
        <div className="rounded-xl border border-border p-4 bg-card shadow-card">
          <p className="text-xs text-muted-foreground">Sisa Gaji Setelah Angsuran</p>
          <p className="mt-1 text-lg font-bold text-success">{formatRp(sisaGaji)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Penghasilan Bersih</p>
        </div>
        <div className="rounded-xl border border-border p-4 bg-card shadow-card">
          <p className="text-xs text-muted-foreground">Rasio Angsuran / Gaji</p>
          <p className="mt-1 text-lg font-bold text-foreground">{rasio.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground mt-0.5">Batas maksimal: 40%</p>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Pemeriksaan Dokumen Persyaratan (Lampiran Juknis)</CardTitle>
          <CardDescription>Periksa kelengkapan berkas fisik & tanda tangan hierarki</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {docs.map((d) => (
              <div
                key={d}
                className="flex items-center justify-between gap-3 rounded-xl border border-border p-3.5 bg-muted/30"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="size-4 text-primary shrink-0" />
                  <span className="text-sm font-medium truncate">{d}</span>
                </div>
                <Badge variant="outline" className="border-success/30 bg-success/10 text-success text-xs">
                  Terverifikasi
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card border-primary/30">
        <CardHeader>
          <CardTitle>Keputusan Juru Bayar Satuan</CardTitle>
          <CardDescription>
            Tentukan apakah permohonan pinjaman memenuhi syarat administrasi dan kemampuan bayar
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Teruskan rekomendasi kepada Komandan / Ka Bagian</p>
            <p className="text-xs text-muted-foreground">
              Pengajuan yang disetujui akan langsung masuk ke antrean Rekomendasi Dan/Ka
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={() => setDialog("reject")}>
              <X className="mr-1.5 size-4" /> Tolak Pengajuan
            </Button>
            <Button onClick={() => setDialog("approve")}>
              <Check className="mr-1.5 size-4" /> Setujui &amp; Rekomendasikan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Konfirmasi */}
      <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialog === "approve"
                ? "Konfirmasi Rekomendasi Juru Bayar"
                : "Tolak Pengajuan Pinjaman"}
            </DialogTitle>
            <DialogDescription>
              {dialog === "approve"
                ? `Teruskan berkas pinjaman ${formatNamaLengkapDinas(item.anggota?.nama, item.anggota?.pangkat?.nama, item.anggota?.korps?.nama, item.anggota?.pangkat?.kategori)} senilai ${formatRp(nominal)} ke Dan/Ka?`
                : `Pengajuan ${formatNamaLengkapDinas(item.anggota?.nama, item.anggota?.pangkat?.nama, item.anggota?.korps?.nama, item.anggota?.pangkat?.kategori)} akan ditolak dan dikembalikan.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Catatan Evaluasi Juru Bayar</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                dialog === "approve"
                  ? "Sisa gaji memenuhi syarat dan potongan dalam batas aman..."
                  : "Rasio angsuran melebihi 40% dari sisa gaji..."
              }
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant={dialog === "approve" ? "default" : "destructive"}
              disabled={updateStatusMutation.isPending}
              onClick={handleAction}
            >
              {updateStatusMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              {dialog === "approve" ? "Ya, Rekomendasikan" : "Tolak Pengajuan"}
            </Button>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
