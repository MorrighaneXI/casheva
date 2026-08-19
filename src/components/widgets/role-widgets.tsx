import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Check,
  FileCheck2,
  Printer,
  ThumbsDown,
  ThumbsUp,
  Zap,
  Loader2,
  Banknote,
  Calendar,
  CreditCard,
  History,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  formatRp,
  potonganSukarela,
  shuDistribusi,
  backendStatusToFrontend,
  loanStatusTone,
} from "@/lib/casheva-data";
import {
  apiPinjaman,
  apiSimpanan,
  apiKeuangan,
  apiReports,
  type Pinjaman,
  type Angsuran,
} from "@/lib/api";

const chartTooltip = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  color: "var(--color-popover-foreground)",
};

/* ───────────────────────── 1. Rekomendasi Dan/Ka ───────────────────────── */

export function RekomendasiQueue({ monitorOnly = false }: { monitorOnly?: boolean }) {
  const queryClient = useQueryClient();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const { data: loanList = [], isLoading } = useQuery({
    queryKey: ["pinjaman-rekomendasi"],
    queryFn: () => apiPinjaman.findAll(),
  });

  const antrean = loanList.filter((l) =>
    ["VERIFIKASI_JURU_BAYAR", "VERIFIKASI_PRIMKOP", "DIAJUKAN"].includes(l.status),
  );

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => apiPinjaman.updateStatus(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pinjaman-rekomendasi"] });
      queryClient.invalidateQueries({ queryKey: ["pinjaman-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      if (variables.dto.status === "REKOMENDASI_PIMPINAN") {
        toast.success("Rekomendasi Dan/Ka Diberikan", {
          description: "Pengajuan diteruskan ke Kepala Primer (Kaprim) untuk ACC akhir.",
        });
      } else {
        toast.error("Pengajuan Tidak Direkomendasikan", {
          description: "Pengajuan ditolak dan proses dihentikan.",
        });
      }
      setRejectId(null);
      setRejectNote("");
    },
    onError: (err: any) => {
      toast.error("Gagal Memproses Rekomendasi", { description: err.message });
    },
  });

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>
          {monitorOnly
            ? "Monitoring Antrean Rekomendasi"
            : "Antrean Rekomendasi Pinjaman Komandan / Ka Bagian"}
        </CardTitle>
        <CardDescription>
          {monitorOnly
            ? "Pantau progres pengajuan yang menunggu / sudah direkomendasi Dan/Ka"
            : "Pengajuan yang telah lolos verifikasi Juru Bayar dan menunggu rekomendasi pimpinan satuan"}
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Pemohon</TableHead>
              <TableHead>Pangkat / NRP</TableHead>
              <TableHead>Satminkal</TableHead>
              <TableHead className="text-right">Plafon</TableHead>
              <TableHead className="text-center">Tenor</TableHead>
              <TableHead className="text-right">Angsuran/bln</TableHead>
              <TableHead className="text-right">{monitorOnly ? "Status" : "Keputusan"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  <Loader2 className="mx-auto size-6 animate-spin mb-2" />
                  Memuat antrean rekomendasi...
                </TableCell>
              </TableRow>
            ) : (
              antrean.map((r) => {
                const uiStatus = backendStatusToFrontend(r.status);
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="font-medium">{r.anggota?.nama || "Anggota"}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {r.id.slice(0, 8).toUpperCase()}
                      </p>
                    </TableCell>
                    <TableCell>
                      {r.anggota?.pangkat?.nama || "-"}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        NRP {r.anggota?.nrpNip || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.anggota?.satminkal?.nama || "Disinfolahtad"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatRp(Number(r.nominal))}
                    </TableCell>
                    <TableCell className="text-center">{r.tenorBulan} bln</TableCell>
                    <TableCell className="text-right font-medium text-xs">
                      {formatRp(Number(r.totalAngsuranBulanan || (Number(r.nominal) * 1.12) / r.tenorBulan))}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {monitorOnly ? (
                        <Badge variant="outline" className={loanStatusTone[uiStatus] || ""}>
                          {uiStatus}
                        </Badge>
                      ) : (
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            disabled={updateStatusMutation.isPending}
                            className="bg-success text-success-foreground hover:bg-success/90"
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: r.id,
                                dto: {
                                  status: "REKOMENDASI_PIMPINAN",
                                  catatan: "Direkomendasikan oleh Komandan / Ka Bagian",
                                },
                              })
                            }
                          >
                            <ThumbsUp className="mr-1 size-3.5" /> Rekomendasikan
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={updateStatusMutation.isPending}
                            onClick={() => setRejectId(r.id)}
                          >
                            <ThumbsDown className="mr-1 size-3.5" /> Tidak
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
            {!isLoading && antrean.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Tidak ada antrean rekomendasi pimpinan saat ini.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={!!rejectId} onOpenChange={(o) => !o && setRejectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tidak Direkomendasikan</DialogTitle>
            <DialogDescription>
              Catatan alasan penolakan pimpinan akan dicatat pada sistem.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Contoh: Belum memenuhi syarat dinas / rekomendasi pimpinan ditolak..."
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="destructive"
              disabled={updateStatusMutation.isPending}
              onClick={() => {
                if (rejectId) {
                  updateStatusMutation.mutate({
                    id: rejectId,
                    dto: {
                      status: "DITOLAK",
                      alasanPenolakan: rejectNote || "Tidak direkomendasikan oleh Komandan/Ka",
                    },
                  });
                }
              }}
            >
              Kirim Penolakan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ───────────────────────── 2. ACC Kaprim ───────────────────────── */

export function AccQueue() {
  const queryClient = useQueryClient();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const { data: loanList = [], isLoading } = useQuery({
    queryKey: ["pinjaman-acc"],
    queryFn: () => apiPinjaman.findAll(),
  });

  const antrean = loanList.filter((l) => l.status === "REKOMENDASI_PIMPINAN");

  const accMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => apiPinjaman.updateStatus(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pinjaman-acc"] });
      queryClient.invalidateQueries({ queryKey: ["pinjaman-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      if (variables.dto.status === "SETUJU_KAPRIM") {
        toast.success("Persetujuan ACC Kaprim Berhasil", {
          description: "Berkas disetujui dan diteruskan ke Bendahara untuk tahap pencairan dana.",
        });
      } else {
        toast.error("Pengajuan Ditolak Kaprim");
      }
      setRejectId(null);
      setRejectNote("");
    },
    onError: (err: any) => {
      toast.error("Gagal Memproses ACC Kaprim", { description: err.message });
    },
  });

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Persetujuan Akhir (ACC Kaprim) &amp; Otorisasi Pinjaman</CardTitle>
        <CardDescription>
          Berkas yang telah direkomendasikan Dan/Ka dan diverifikasi Juru Bayar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            <Loader2 className="mx-auto size-6 animate-spin mb-2" />
            Memuat antrean ACC Kaprim...
          </div>
        ) : (
          antrean.map((a) => (
            <div key={a.id} className="rounded-xl border border-border p-5 bg-card shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-semibold">{a.anggota?.nama || "Anggota"}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.id.slice(0, 8).toUpperCase()} · {a.anggota?.pangkat?.nama || ""} (NRP:{" "}
                    {a.anggota?.nrpNip || "-"}) · {a.anggota?.satminkal?.nama || "Disinfolahtad"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{formatRp(Number(a.nominal))}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.tenorBulan} bulan · Bunga 12% p.a (1% / bln)
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="border-success/30 bg-success/15 text-success text-xs">
                  <FileCheck2 className="mr-1 size-3" /> Surat Permohonan Usipa
                </Badge>
                <Badge variant="outline" className="border-success/30 bg-success/15 text-success text-xs">
                  <FileCheck2 className="mr-1 size-3" /> Rekomendasi Juru Bayar
                </Badge>
                <Badge variant="outline" className="border-success/30 bg-success/15 text-success text-xs">
                  <FileCheck2 className="mr-1 size-3" /> Rekomendasi Dan/Ka
                </Badge>
                <Badge variant="outline" className="border-success/30 bg-success/15 text-success text-xs">
                  <FileCheck2 className="mr-1 size-3" /> Slip Gaji Terlampir
                </Badge>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={accMutation.isPending}
                  onClick={() => setRejectId(a.id)}
                >
                  <ThumbsDown className="mr-1 size-4" /> Tolak
                </Button>
                <Button
                  size="sm"
                  disabled={accMutation.isPending}
                  onClick={() =>
                    accMutation.mutate({
                      id: a.id,
                      dto: {
                        status: "SETUJU_KAPRIM",
                        catatan: "Disetujui dan di-ACC oleh Kepala Primer (Kaprim)",
                      },
                    })
                  }
                >
                  <Check className="mr-1 size-4" /> ACC &amp; Teruskan ke Bendahara
                </Button>
              </div>
            </div>
          ))
        )}
        {!isLoading && antrean.length === 0 && (
          <div className="py-10 text-center text-muted-foreground">
            Tidak ada berkas yang menunggu persetujuan Kaprim saat ini.
          </div>
        )}
      </CardContent>

      <Dialog open={!!rejectId} onOpenChange={(o) => !o && setRejectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Persetujuan Kaprim</DialogTitle>
            <DialogDescription>
              Masukkan alasan penolakan untuk arsip evaluasi Primkopad.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Alasan penolakan..."
            rows={3}
          />
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => {
                if (rejectId) {
                  accMutation.mutate({
                    id: rejectId,
                    dto: {
                      status: "DITOLAK",
                      alasanPenolakan: rejectNote || "Ditolak oleh Kepala Primkopad (Kaprim)",
                    },
                  });
                }
              }}
            >
              Kirim Penolakan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ───────────────────────── 3. Pencairan Dana (Bendahara) ───────────────────────── */

export function InvoiceGenerator() {
  const queryClient = useQueryClient();

  const { data: loanList = [], isLoading } = useQuery({
    queryKey: ["pinjaman-pencairan"],
    queryFn: () => apiPinjaman.findAll(),
  });

  const antreanPencairan = loanList.filter((l) =>
    ["SETUJU_KAPRIM", "MENUNGGU_DOKUMEN", "DICAIRKAN"].includes(l.status),
  );

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => apiPinjaman.updateStatus(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pinjaman-pencairan"] });
      queryClient.invalidateQueries({ queryKey: ["pinjaman-list"] });
      toast.success("Dokumen Diunggah, Siap Dicairkan");
    },
    onError: (err: any) => toast.error("Gagal", { description: err.message }),
  });

  const cairkanMutation = useMutation({
    mutationFn: (id: string) => apiPinjaman.cairkan(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["pinjaman-pencairan"] });
      queryClient.invalidateQueries({ queryKey: ["pinjaman-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Dana Pinjaman Berhasil Dicairkan!", {
        description: `Jadwal ${res.tenorBulan} angsuran otomatis dibentuk di sistem.`,
      });
    },
    onError: (err: any) => {
      toast.error("Gagal Mencairkan Pinjaman", { description: err.message });
    },
  });

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Pencairan Pinjaman &amp; Penerbitan Jadwal Angsuran</CardTitle>
        <CardDescription>
          Tahap akhir penyaluran dana pinjaman anggota oleh Bendahara Koperasi
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Pengajuan</TableHead>
              <TableHead>Nama Anggota</TableHead>
              <TableHead>Pangkat / Satminkal</TableHead>
              <TableHead className="text-right">Nominal Plafon</TableHead>
              <TableHead className="text-center">Tenor</TableHead>
              <TableHead>Status Berkas</TableHead>
              <TableHead className="text-right">Aksi Bendahara</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  <Loader2 className="mx-auto size-6 animate-spin mb-2" />
                  Memuat antrean pencairan...
                </TableCell>
              </TableRow>
            ) : (
              antreanPencairan.map((p) => {
                const uiStatus = backendStatusToFrontend(p.status);
                const isReadyToCair = p.status === "MENUNGGU_DOKUMEN";
                const isDisbursed = p.status === "DICAIRKAN";

                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs font-semibold">
                      {p.id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell className="font-medium">{p.anggota?.nama || "Anggota"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.anggota?.pangkat?.nama || ""} / {p.anggota?.satminkal?.nama || "Disinfolahtad"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatRp(Number(p.nominal))}
                    </TableCell>
                    <TableCell className="text-center">{p.tenorBulan} bln</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={loanStatusTone[uiStatus] || ""}>
                        {uiStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {p.status === "SETUJU_KAPRIM" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updateStatusMutation.isPending}
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: p.id,
                              dto: {
                                status: "MENUNGGU_DOKUMEN",
                                catatan: "Dokumen tanda tangan hierarki lengkap diunggah",
                              },
                            })
                          }
                        >
                          Verifikasi Dokumen
                        </Button>
                      ) : isReadyToCair ? (
                        <Button
                          size="sm"
                          disabled={cairkanMutation.isPending}
                          className="bg-success text-success-foreground hover:bg-success/90"
                          onClick={() => cairkanMutation.mutate(p.id)}
                        >
                          {cairkanMutation.isPending ? (
                            <Loader2 className="size-3.5 animate-spin mr-1" />
                          ) : (
                            <Banknote className="size-3.5 mr-1" />
                          )}
                          Cairkan Dana
                        </Button>
                      ) : isDisbursed ? (
                        <Badge
                          variant="outline"
                          className="border-success/30 bg-success/15 text-success"
                        >
                          Telah Dicairkan
                        </Badge>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
            {!isLoading && antreanPencairan.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Tidak ada antrean pencairan dana pinjaman.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/* ───────────────────────── 4. Rekap Angsuran & Bayar Cicilan ───────────────────────── */

export function RekapAngsuranTable() {
  const queryClient = useQueryClient();
  const [selectedLoan, setSelectedLoan] = useState<Pinjaman | null>(null);

  const { data: loanList = [], isLoading } = useQuery({
    queryKey: ["pinjaman-angsuran-all"],
    queryFn: () => apiPinjaman.findAll(),
  });

  const activeLoans = loanList.filter((l) =>
    ["DICAIRKAN", "LUNAS"].includes(l.status),
  );

  const bayarMutation = useMutation({
    mutationFn: (angsuranId: string) => apiPinjaman.bayarAngsuran(angsuranId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["pinjaman-angsuran-all"] });
      queryClient.invalidateQueries({ queryKey: ["pinjaman-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Angsuran Berhasil Dibayar!", {
        description: `Kwitansi & Invoice terbit: ${res.angsuran?.noInvoice || "#INV-AUTO"}`,
      });
      // Refresh detail modal
      if (selectedLoan) {
        apiPinjaman.findOne(selectedLoan.id).then(setSelectedLoan);
      }
    },
    onError: (err: any) => {
      toast.error("Gagal Memproses Pembayaran", { description: err.message });
    },
  });

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Rekap Angsuran &amp; Pembayaran Pinjaman Anggota</CardTitle>
        <CardDescription>
          Pantau sisa pokok pinjaman, jadwal cicilan, dan proses pembayaran angsuran dengan kwitansi otomatis
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Pinjaman</TableHead>
              <TableHead>Anggota</TableHead>
              <TableHead>Pangkat / NRP</TableHead>
              <TableHead className="text-right">Plafon Awal</TableHead>
              <TableHead className="text-right">Sisa Pokok</TableHead>
              <TableHead className="text-center">Tenor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  <Loader2 className="mx-auto size-6 animate-spin mb-2" />
                  Memuat data angsuran pinjaman...
                </TableCell>
              </TableRow>
            ) : (
              activeLoans.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono text-xs font-semibold">
                    {l.id.slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell className="font-medium">{l.anggota?.nama || "Anggota"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {l.anggota?.pangkat?.nama || ""} / NRP {l.anggota?.nrpNip || "-"}
                  </TableCell>
                  <TableCell className="text-right">{formatRp(Number(l.nominal))}</TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {formatRp(Number(l.sisaPokok ?? l.nominal))}
                  </TableCell>
                  <TableCell className="text-center">{l.tenorBulan} bln</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        l.status === "LUNAS"
                          ? "border-success/30 bg-success/15 text-success"
                          : "border-primary/30 bg-primary-soft text-primary"
                      }
                    >
                      {l.status === "LUNAS" ? "Lunas" : "Berjalan"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setSelectedLoan(l)}>
                      <Calendar className="mr-1 size-3.5" /> Jadwal &amp; Bayar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
            {!isLoading && activeLoans.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  Belum ada pinjaman yang dicairkan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Dialog Jadwal Angsuran & Pembayaran */}
      <Dialog open={!!selectedLoan} onOpenChange={(o) => !o && setSelectedLoan(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Jadwal &amp; Pembayaran Angsuran</DialogTitle>
            <DialogDescription>
              {selectedLoan?.anggota?.nama} · Plafon {formatRp(Number(selectedLoan?.nominal || 0))} · Sisa Pokok{" "}
              {formatRp(Number(selectedLoan?.sisaPokok || 0))}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ke-</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead className="text-right">Pokok</TableHead>
                  <TableHead className="text-right">Bunga (1%)</TableHead>
                  <TableHead className="text-right">Total Tagihan</TableHead>
                  <TableHead>Status / Invoice</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedLoan?.angsuran?.map((ang: any) => (
                  <TableRow key={ang.id}>
                    <TableCell className="font-semibold">{ang.bulanKe || ang.angsuranKe}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {ang.jatuhTempo ? new Date(ang.jatuhTempo).toLocaleDateString("id-ID") : "-"}
                    </TableCell>
                    <TableCell className="text-right">{formatRp(Number(ang.pokok || ang.angsuranPokok || 0))}</TableCell>
                    <TableCell className="text-right">{formatRp(Number(ang.bunga || ang.angsuranBunga || 0))}</TableCell>
                    <TableCell className="text-right font-bold text-foreground">
                      {formatRp(Number(ang.total || 0))}
                    </TableCell>
                    <TableCell>
                      {ang.dibayar ? (
                        <div className="space-y-0.5">
                          <Badge
                            variant="outline"
                            className="border-success/30 bg-success/15 text-success text-[10px]"
                          >
                            Lunas
                          </Badge>
                          {ang.noInvoice && (
                            <p className="font-mono text-[10px] text-muted-foreground">
                              {ang.noInvoice}
                            </p>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                          Belum Bayar
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!ang.dibayar ? (
                        <Button
                          size="sm"
                          disabled={bayarMutation.isPending}
                          className="bg-primary text-xs"
                          onClick={() => bayarMutation.mutate(ang.id)}
                        >
                          Bayar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toast.success(`Kwitansi ${ang.noInvoice || ""} siap dicetak`)}
                        >
                          <Printer className="size-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLoan(null)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ───────────────────────── 5. Pengawasan SHU (Pengawas & Anggota) ───────────────────────── */

export function ShuBreakdown() {
  const queryClient = useQueryClient();
  const currentYear = 2026;

  const { data: ringkasan, isLoading: loadingRingkasan } = useQuery({
    queryKey: ["keuangan-ringkasan", currentYear],
    queryFn: () => apiKeuangan.getRingkasan(currentYear),
  });

  const { data: reportShu, isLoading: loadingReport } = useQuery({
    queryKey: ["reports-shu-anggota", currentYear],
    queryFn: () => apiReports.getShuAnggota(currentYear),
  });

  const hitungMutation = useMutation({
    mutationFn: () => apiKeuangan.hitungShu({ tahun: currentYear }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["keuangan-ringkasan", currentYear] });
      queryClient.invalidateQueries({ queryKey: ["reports-shu-anggota", currentYear] });
      toast.success("Kalkulasi SHU Berhasil Disimpan!", {
        description: res.message || "Distribusi Jasa Modal 20% & Jasa Usaha 30% telah dibagikan.",
      });
    },
    onError: (err: any) => {
      toast.error("Gagal Menghitung SHU", { description: err.message });
    },
  });

  const shuKotor = ringkasan?.shuKotor ?? 50_000_000;
  const shuList = reportShu?.data || [];

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>Kalkulator &amp; Distribusi Pembagian Sisa Hasil Usaha (SHU)</CardTitle>
          <CardDescription>
            Sesuai AD/ART Juknis TNI AD 2026: Cadangan 40%, Jasa Modal 20%, Jasa Usaha 30%, Pengurus 5%, Sosial 5%
          </CardDescription>
        </div>
        <Button
          disabled={hitungMutation.isPending}
          onClick={() => hitungMutation.mutate()}
        >
          {hitungMutation.isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Calculator className="mr-2 size-4" />
          )}
          Hitung &amp; Simpan SHU Anggota
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border p-4 bg-muted/30">
            <p className="text-xs text-muted-foreground">Total Pendapatan Bunga &amp; Jasa</p>
            <p className="mt-1 text-xl font-extrabold text-primary">
              {formatRp(ringkasan?.totalPendapatan ?? 85_000_000)}
            </p>
          </div>
          <div className="rounded-xl border border-border p-4 bg-muted/30">
            <p className="text-xs text-muted-foreground">Biaya Operasional &amp; Beban</p>
            <p className="mt-1 text-xl font-extrabold text-destructive">
              {formatRp(ringkasan?.totalBiaya ?? 35_000_000)}
            </p>
          </div>
          <div className="rounded-xl border border-border p-4 bg-primary-soft">
            <p className="text-xs text-muted-foreground">SHU Bersih Tahun Berjalan</p>
            <p className="mt-1 text-2xl font-extrabold text-primary">{formatRp(shuKotor)}</p>
          </div>
          <div className="rounded-xl border border-border p-4 bg-success/10">
            <p className="text-xs text-muted-foreground">Dana Dibagi ke Anggota (50%)</p>
            <p className="mt-1 text-xl font-extrabold text-success">{formatRp(shuKotor * 0.5)}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {shuDistribusi.map((d) => (
            <div key={d.pos} className="rounded-xl border border-border p-3.5 bg-card">
              <p className="text-xs text-muted-foreground">{d.pos}</p>
              <p className="mt-1 text-xl font-extrabold">{d.persen}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatRp((shuKotor * d.persen) / 100)}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h4 className="text-base font-semibold">Tabel Rincian Pembagian SHU per Anggota</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">No</TableHead>
                <TableHead>Nama Anggota</TableHead>
                <TableHead>Pangkat / Korps / NRP</TableHead>
                <TableHead className="text-right">Jasa Modal (20%)</TableHead>
                <TableHead className="text-right">Jasa Usaha (30%)</TableHead>
                <TableHead className="text-right font-bold">Total SHU Diterima</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingReport ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-6 animate-spin mb-2" />
                    Memuat rincian SHU anggota...
                  </TableCell>
                </TableRow>
              ) : (
                shuList.map((r, i) => (
                  <TableRow key={r.no || i}>
                    <TableCell className="text-center font-medium">{r.no || i + 1}</TableCell>
                    <TableCell className="font-medium">{r.nama}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.pktCrpNrp}
                    </TableCell>
                    <TableCell className="text-right text-primary font-medium">
                      {formatRp(Number(r.jasaModal))}
                    </TableCell>
                    <TableCell className="text-right text-success font-medium">
                      {formatRp(Number(r.jasaUsaha))}
                    </TableCell>
                    <TableCell className="text-right font-extrabold text-foreground">
                      {formatRp(Number(r.totalShu))}
                    </TableCell>
                  </TableRow>
                ))
              )}
              {!loadingReport && shuList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Data SHU anggota belum dihitung. Klik &apos;Hitung &amp; Simpan SHU Anggota&apos; untuk memproses.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

/* ───────────────────────── Helper Charts ───────────────────────── */

export function PengajuanSatuanChart() {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Visualisasi Pengajuan Pinjaman Satuan</CardTitle>
        <CardDescription>Tren bulanan pengajuan vs disetujui</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={[
              { bulan: "Jan", pengajuan: 12, disetujui: 9 },
              { bulan: "Feb", pengajuan: 15, disetujui: 12 },
              { bulan: "Mar", pengajuan: 11, disetujui: 10 },
              { bulan: "Apr", pengajuan: 18, disetujui: 14 },
              { bulan: "Mei", pengajuan: 21, disetujui: 17 },
              { bulan: "Jun", pengajuan: 16, disetujui: 11 },
            ]}
            margin={{ left: -18, right: 8, top: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="bulan" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} fontSize={12} />
            <Tooltip contentStyle={chartTooltip} />
            <Legend />
            <Line
              type="monotone"
              dataKey="pengajuan"
              name="Pengajuan"
              stroke="var(--color-chart-1)"
              strokeWidth={2.5}
            />
            <Line
              type="monotone"
              dataKey="disetujui"
              name="Disetujui"
              stroke="var(--color-chart-2)"
              strokeWidth={2.5}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function LikuiditasChart() {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Monitoring Likuiditas Kas Koperasi</CardTitle>
        <CardDescription>Cadangan kas vs pencairan pinjaman (juta rupiah)</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={[
              { bulan: "Jan", kas: 4200, pencairan: 980 },
              { bulan: "Feb", kas: 4380, pencairan: 1120 },
              { bulan: "Mar", kas: 4510, pencairan: 1040 },
              { bulan: "Apr", kas: 4290, pencairan: 1380 },
              { bulan: "Mei", kas: 4620, pencairan: 1210 },
              { bulan: "Jun", kas: 4805, pencairan: 1150 },
            ]}
            margin={{ left: -18, right: 8, top: 8 }}
          >
            <defs>
              <linearGradient id="gKas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gCair" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="bulan" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} fontSize={12} />
            <Tooltip contentStyle={chartTooltip} />
            <Legend />
            <Area
              type="monotone"
              dataKey="kas"
              name="Kas Tersedia"
              stroke="var(--color-chart-1)"
              strokeWidth={2.5}
              fill="url(#gKas)"
            />
            <Area
              type="monotone"
              dataKey="pencairan"
              name="Pencairan"
              stroke="var(--color-chart-2)"
              strokeWidth={2.5}
              fill="url(#gCair)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function BatchSimpananBanner() {
  const queryClient = useQueryClient();
  const massalMutation = useMutation({
    mutationFn: () => apiSimpanan.sukarelaMassal(),
    onSuccess: (res) => {
      toast.success("Simpanan Sukarela Massal Berhasil", {
        description: `${res.message} - Total: ${formatRp(res.totalNominal)}`,
      });
      queryClient.invalidateQueries({ queryKey: ["simpanan-rekap"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
    onError: (err: any) => toast.error("Gagal", { description: err.message }),
  });

  return (
    <Card className="border-gold/40 bg-gold-soft shadow-card">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-bold text-accent-foreground">
            <Zap className="size-4" /> Batch Auto-Generate Simpanan Sukarela Bulanan
          </p>
          <p className="mt-1 text-sm text-accent-foreground/80">
            Jadwal potongan otomatis tanggal 5 setiap bulan · Pamen{" "}
            {formatRp(potonganSukarela.Pamen)} · Pama {formatRp(potonganSukarela.Pama)} ·
            Ba/Ta/ASN {formatRp(potonganSukarela["Ba/Ta/ASN"])}
          </p>
        </div>
        <Button
          disabled={massalMutation.isPending}
          onClick={() => massalMutation.mutate()}
        >
          {massalMutation.isPending ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : null}
          Jalankan Potongan Otomatis Tanggal 5
        </Button>
      </CardContent>
    </Card>
  );
}

/* ───────────────────────── 6. Audit Trail & Timeline ───────────────────────── */

export function AuditLogTable() {
  const dummyLogs = [
    {
      id: "LOG-001",
      waktu: "18 Agu 2026 09:15",
      user: "admin",
      role: "Admin Koperasi",
      aksi: "LOGIN_SUCCESS",
      detail: "Login ke sistem dari IP 192.168.1.10",
    },
    {
      id: "LOG-002",
      waktu: "18 Agu 2026 09:30",
      user: "jurubayar",
      role: "Juru Bayar",
      aksi: "VERIFIKASI_PINJAMAN",
      detail: "Verifikasi kelayakan pinjaman PJM-2026-001 (Mayor Inf Agus)",
    },
    {
      id: "LOG-003",
      waktu: "18 Agu 2026 10:05",
      user: "pimpinan",
      role: "Pimpinan / Dan / Ka",
      aksi: "REKOMENDASI_PINJAMAN",
      detail: "Pemberian rekomendasi komandan untuk PJM-2026-001",
    },
    {
      id: "LOG-004",
      waktu: "18 Agu 2026 10:45",
      user: "kaprim",
      role: "Kaprim",
      aksi: "ACC_PINJAMAN",
      detail: "Persetujuan akhir Kaprim dan otorisasi pencairan dana",
    },
    {
      id: "LOG-005",
      waktu: "18 Agu 2026 11:10",
      user: "bendahara",
      role: "Bendahara",
      aksi: "CAIRKAN_PINJAMAN",
      detail: "Pencairan dana Rp 15.000.000 & pembuatan jadwal angsuran",
    },
  ];

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Log Aktivitas Sistem &amp; Keamanan</CardTitle>
        <CardDescription>
          Catatan kronologis seluruh interaksi pengguna, perubahan data, dan transaksi keuangan
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>Pengguna</TableHead>
              <TableHead>Peran</TableHead>
              <TableHead>Aksi</TableHead>
              <TableHead>Keterangan &amp; Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dummyLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                  {log.waktu}
                </TableCell>
                <TableCell className="font-semibold text-primary">@{log.user}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {log.role}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs font-medium text-foreground">
                  {log.aksi}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{log.detail}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function ApprovalTrailTimeline() {
  const steps = [
    {
      role: "Anggota",
      title: "1. Pengajuan Permohonan",
      desc: "Anggota mengisi formulir permohonan pinjaman Usipa dan melampirkan berkas persyaratan.",
      status: "Selesai",
    },
    {
      role: "Juru Bayar",
      title: "2. Verifikasi Kelayakan Gaji",
      desc: "Juru Bayar memvalidasi sisa gaji, ULP, Tunkin, dan batasan rasio angsuran maksimal 40%.",
      status: "Selesai",
    },
    {
      role: "Pimpinan / Dan / Ka",
      title: "3. Rekomendasi Komandan",
      desc: "Komandan / Kepala Bagian memberikan persetujuan rekomendasi dinas kedinasan.",
      status: "Selesai",
    },
    {
      role: "Kaprim",
      title: "4. Persetujuan Akhir (ACC)",
      desc: "Kepala Primer Koperasi (Kaprim) melakukan otorisasi akhir persetujuan kredit.",
      status: "Selesai",
    },
    {
      role: "Bendahara",
      title: "5. Pencairan & Jadwal Angsuran",
      desc: "Bendahara menyalurkan dana pinjaman dan membentuk jadwal angsuran bulanan otomatis.",
      status: "Aktif",
    },
  ];

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Alur Persetujuan Berjenjang (Hierarki Militer)</CardTitle>
        <CardDescription>
          Transparansi tahapan persetujuan pengajuan pinjaman sesuai Petunjuk Teknis TNI AD
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {steps.map((step, idx) => (
            <div key={step.title} className="flex items-start gap-4">
              <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                {idx + 1}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground text-sm">{step.title}</h4>
                  <Badge variant="outline" className="border-primary/25 bg-primary-soft text-primary text-xs">
                    {step.role}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
