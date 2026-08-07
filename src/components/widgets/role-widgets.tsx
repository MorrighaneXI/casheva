import { useState } from "react";
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
import { Check, FileCheck2, Printer, ThumbsDown, ThumbsUp, Zap } from "lucide-react";

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
  anggotaList,
  antreanAcc,
  antreanRekomendasi,
  approvalTrail,
  auditLogs,
  formatRp,
  keuanganRingkas,
  likuiditasData,
  pencairanQueue,
  pengajuanSatuanData,
  potonganSukarela,
  rekapAngsuran,
  shuDistribusi,
  shuRows,
} from "@/lib/casheva-data";
import { nextInvoiceFromList } from "@/lib/invoice";
import { generateSukarelaBatch } from "@/lib/savings";

const chartTooltip = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  color: "var(--color-popover-foreground)",
};

/* ── Pimpinan ── */

export function RekomendasiQueue({ monitorOnly = false }: { monitorOnly?: boolean }) {
  const [reject, setReject] = useState<string | null>(null);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>
          {monitorOnly
            ? "Monitoring Antrean Rekomendasi"
            : "Antrean Rekomendasi Pinjaman Dan/Ka"}
        </CardTitle>
        <CardDescription>
          {monitorOnly
            ? "Pantau progres pengajuan yang menunggu / sudah direkomendasi Dan/Ka"
            : "Pengajuan yang telah diteruskan Juru Bayar dan menunggu rekomendasi komandan"}
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Pemohon</TableHead>
              <TableHead>Pangkat / NRP</TableHead>
              <TableHead className="text-right">Plafon</TableHead>
              <TableHead className="text-center">Tenor</TableHead>
              <TableHead>Evaluasi Gaji / Tunkin</TableHead>
              <TableHead>Status Jurbay</TableHead>
              <TableHead className="text-right">{monitorOnly ? "Status" : "Aksi"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {antreanRekomendasi.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <p className="font-medium">{r.nama}</p>
                  <p className="font-mono text-xs text-muted-foreground">{r.id}</p>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {r.pangkat}
                  <br />
                  <span className="text-xs">NRP {r.nrp}</span>
                </TableCell>
                <TableCell className="text-right font-semibold">{formatRp(r.plafon)}</TableCell>
                <TableCell className="text-center">{r.tenor} bln</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  Gaji {formatRp(r.gaji)} · Tunkin {formatRp(r.tunkin)}
                  <br />
                  Potongan berjalan {formatRp(r.potongan)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-gold/40 bg-gold-soft text-accent-foreground">
                    {r.jurbay}
                  </Badge>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {monitorOnly ? (
                    <Badge variant="outline" className="border-primary/25 bg-primary-soft text-primary">
                      Menunggu Dan/Ka
                    </Badge>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        className="bg-success text-success-foreground hover:bg-success/90"
                        onClick={() =>
                          toast.success(`Rekomendasi diberikan untuk ${r.id}`, {
                            description: "Diteruskan ke Kaprim untuk ACC akhir.",
                          })
                        }
                      >
                        <ThumbsUp className="mr-1 size-3.5" /> Beri Rekomendasi
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="ml-2"
                        onClick={() => setReject(r.id)}
                      >
                        <ThumbsDown className="mr-1 size-3.5" /> Tidak
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {!monitorOnly ? (
        <Dialog open={!!reject} onOpenChange={(o) => !o && setReject(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tidak Direkomendasikan</DialogTitle>
              <DialogDescription>
                Catatan alasan untuk pengajuan {reject} akan tercatat pada audit trail.
              </DialogDescription>
            </DialogHeader>
            <Textarea placeholder="Contoh: sisa gaji bersih di bawah ketentuan minimal." rows={4} />
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() => {
                  toast.error(`${reject} ditolak dengan catatan`);
                  setReject(null);
                }}
              >
                Kirim Penolakan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </Card>
  );
}

export function PengajuanSatuanChart() {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Visualisasi Pengajuan Pinjaman Satuan</CardTitle>
        <CardDescription>Tren bulanan pengajuan vs disetujui</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={pengajuanSatuanData} margin={{ left: -18, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="bulan" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} fontSize={12} />
            <Tooltip contentStyle={chartTooltip} />
            <Legend />
            <Line type="monotone" dataKey="pengajuan" name="Pengajuan" stroke="var(--color-chart-1)" strokeWidth={2.5} />
            <Line type="monotone" dataKey="disetujui" name="Disetujui" stroke="var(--color-chart-2)" strokeWidth={2.5} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/* ── Kaprim ── */

export function AccQueue() {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Persetujuan Akhir (ACC Kaprim) &amp; Otorisasi Pencairan</CardTitle>
        <CardDescription>
          Berkas telah direkomendasikan Dan/Ka dan diverifikasi Juru Bayar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {antreanAcc.map((a) => {
          const lengkap = Object.values(a.dokumen).every(Boolean);
          return (
            <div key={a.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{a.nama}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.id} · NRP {a.nrp} · {a.satminkal}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatRp(a.plafon)}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.tenor} bulan · bunga {a.bunga}% p.a
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(a.dokumen).map(([doc, ok]) => (
                  <Badge
                    key={doc}
                    variant="outline"
                    className={
                      ok
                        ? "border-success/30 bg-success/15 text-success"
                        : "border-destructive/30 bg-destructive/10 text-destructive"
                    }
                  >
                    <FileCheck2 className="mr-1 size-3" /> {doc}
                  </Badge>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  disabled={!lengkap}
                  onClick={() => toast.success(`${a.id} di-ACC & diteruskan ke Bendahara`)}
                >
                  <Check className="mr-1 size-4" /> ACC &amp; Teruskan ke Bendahara
                </Button>
              </div>
            </div>
          );
        })}
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
          <AreaChart data={likuiditasData} margin={{ left: -18, right: 8, top: 8 }}>
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
            <Area type="monotone" dataKey="kas" name="Kas Tersedia" stroke="var(--color-chart-1)" strokeWidth={2.5} fill="url(#gKas)" />
            <Area type="monotone" dataKey="pencairan" name="Pencairan" stroke="var(--color-chart-2)" strokeWidth={2.5} fill="url(#gCair)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/* ── Pengurus ── */

export function BatchSimpananBanner() {
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
          onClick={() => {
            const batch = generateSukarelaBatch(anggotaList);
            const total = batch.reduce((sum, row) => sum + row.jumlah, 0);
            toast.success(`Batch berjalan: ${batch.length} transaksi (${formatRp(total)})`);
          }}
        >
          Jalankan Potongan Otomatis Tanggal 5
        </Button>
      </CardContent>
    </Card>
  );
}

export function InvoiceGenerator() {
  const [rows, setRows] = useState(pencairanQueue);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Pencairan &amp; Generator Kwitansi / Invoice</CardTitle>
        <CardDescription>Penomoran invoice otomatis berurutan (#INVYYMMDDNNNN)</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="mb-3 flex justify-end">
          <Button
            variant="outline"
            onClick={() => {
              if (!rows.length) return;
              const newest = rows[0];
              if (!newest) return;
              const nextInvoice = nextInvoiceFromList(rows.map((r) => r.invoice));
              setRows((prev) => [
                {
                  ...newest,
                  id: `PJM-${new Date().getFullYear()}-AUTO`,
                  invoice: nextInvoice,
                  tanggal: new Date().toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }),
                },
                ...prev,
              ]);
              toast.success(`Invoice baru dibuat: ${nextInvoice}`);
            }}
          >
            Generate Invoice Berikutnya
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Invoice</TableHead>
              <TableHead>Pengajuan</TableHead>
              <TableHead>Anggota</TableHead>
              <TableHead className="text-right">Nilai Cair</TableHead>
              <TableHead className="text-right">Biaya Adm</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.invoice}>
                <TableCell className="font-mono text-xs">{p.invoice}</TableCell>
                <TableCell className="font-mono text-xs">{p.id}</TableCell>
                <TableCell>{p.nama}</TableCell>
                <TableCell className="text-right font-semibold">{formatRp(p.jumlah)}</TableCell>
                <TableCell className="text-right">{formatRp(p.biaya)}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => toast.success(`Kwitansi ${p.invoice} dicetak`)}>
                    <Printer className="mr-1 size-3.5" /> Cetak Kwitansi
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function RekapAngsuranTable() {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Rekap Angsuran Anggota</CardTitle>
        <CardDescription>Pemantauan status cicilan berjalan</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Anggota</TableHead>
              <TableHead className="text-right">Pokok</TableHead>
              <TableHead className="text-center">Angsuran ke-</TableHead>
              <TableHead className="text-right">Sisa</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rekapAngsuran.map((r) => (
              <TableRow key={r.nrp}>
                <TableCell>
                  <p className="font-medium">{r.nama}</p>
                  <p className="text-xs text-muted-foreground">NRP {r.nrp}</p>
                </TableCell>
                <TableCell className="text-right">{formatRp(r.pokok)}</TableCell>
                <TableCell className="text-center">{r.angsuranKe}</TableCell>
                <TableCell className="text-right font-semibold">{formatRp(r.sisa)}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      r.status === "Lancar"
                        ? "border-success/30 bg-success/15 text-success"
                        : "border-destructive/30 bg-destructive/10 text-destructive"
                    }
                  >
                    {r.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/* ── Pengawas ── */

export function ShuBreakdown() {
  const [shu, setShu] = useState(keuanganRingkas.shu);
  const totalModal = shuRows.reduce((a, r) => a + r.modal, 0);
  const totalTransaksi = shuRows.reduce((a, r) => a + r.transaksi, 0);
  const jasaModalPool = shu * 0.2;
  const jasaUsahaPool = shu * 0.3;

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Kalkulator &amp; Breakdown Distribusi SHU</CardTitle>
        <CardDescription>Alokasi sesuai AD/ART koperasi</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>SHU Bersih Tahun Berjalan</Label>
            <Input
              type="number"
              value={shu}
              onChange={(e) => setShu(Number(e.target.value) || 0)}
            />
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
            <p className="font-semibold">Formula Perhitungan Anggota</p>
            <p className="mt-1 text-muted-foreground">
              Jasa Modal = (Modal Anggota / Total Modal) × SHU Jasa Modal
            </p>
            <p className="text-muted-foreground">
              Jasa Usaha = (Vol Pinjaman Anggota / Total Vol Pinjaman) × SHU Jasa Usaha
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {shuDistribusi.map((d) => (
            <div key={d.pos} className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">{d.pos}</p>
              <p className="mt-1 text-lg font-extrabold">{d.persen}%</p>
              <p className="text-xs text-muted-foreground">{formatRp((shu * d.persen) / 100)}</p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Anggota</TableHead>
                <TableHead className="text-right">Modal</TableHead>
                <TableHead className="text-right">Vol. Pinjaman</TableHead>
                <TableHead className="text-right">Jasa Modal</TableHead>
                <TableHead className="text-right">Jasa Usaha</TableHead>
                <TableHead className="text-right">Total SHU</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shuRows.map((r) => {
                const jm = (r.modal / totalModal) * jasaModalPool;
                const ju = (r.transaksi / totalTransaksi) * jasaUsahaPool;
                return (
                  <TableRow key={r.nrp}>
                    <TableCell className="font-medium">{r.nama}</TableCell>
                    <TableCell className="text-right">{formatRp(r.modal)}</TableCell>
                    <TableCell className="text-right">{formatRp(r.transaksi)}</TableCell>
                    <TableCell className="text-right">{formatRp(jm)}</TableCell>
                    <TableCell className="text-right">{formatRp(ju)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatRp(jm + ju)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function ApprovalTrailTimeline() {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Audit Log Transparansi Approval Trail</CardTitle>
        <CardDescription>Pengajuan → Jurbay → Dan/Ka → Kaprim → Pencairan</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-6 border-l border-border pl-6">
          {approvalTrail.map((t) => (
            <li key={t.tahap} className="relative">
              <span className="absolute -left-[31px] top-1 grid size-4 place-items-center rounded-full border-2 border-primary bg-background" />
              <p className="text-sm font-semibold">{t.tahap}</p>
              <p className="text-xs text-muted-foreground">
                {t.waktu} · {t.aktor}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{t.ket}</p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

export function AuditLogTable() {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Audit Logs Sistem</CardTitle>
        <CardDescription>Jejak aktivitas pengguna hari ini</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Aksi</TableHead>
              <TableHead>Modul</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.map((l) => (
              <TableRow key={l.waktu + l.aksi}>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{l.waktu}</TableCell>
                <TableCell className="font-medium">{l.user}</TableCell>
                <TableCell>{l.aksi}</TableCell>
                <TableCell>
                  <Badge variant="outline">{l.modul}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{l.ip}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
