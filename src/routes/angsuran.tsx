import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  Filter,
  DollarSign,
  Receipt,
  UserCheck,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { useSession } from "@/components/session-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatRp, formatPangkatKorps, formatNamaLengkapDinas } from "@/lib/casheva-data";
import { apiPinjaman, type Pinjaman } from "@/lib/api";
import { exportToCSV } from "@/lib/export-excel";

export const Route = createFileRoute("/angsuran")({
  head: () => ({
    meta: [
      { title: "Rekap Angsuran Bulanan — Casheva Koperasi TNI AD" },
      {
        name: "description",
        content: "Rekapitulasi angsuran pinjaman bulanan dengan rincian pengangsur, tanggal bayar, dan ekspor excel.",
      },
      { property: "og:title", content: "Rekap Angsuran — Casheva" },
      { property: "og:description", content: "Status cicilan berjalan anggota koperasi TNI AD." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Page,
});

const BULAN_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function Page() {
  const queryClient = useQueryClient();
  const { role, isAdmin } = useSession();
  const isAnggota = role === "Anggota";
  const isBendaharaOrAdmin = isAdmin || role === "Bendahara" || role === "Admin Koperasi";

  const currentDate = new Date();
  const [selectedBulan, setSelectedBulan] = useState<number>(currentDate.getMonth() + 1);
  const [selectedTahun, setSelectedTahun] = useState<number>(currentDate.getFullYear());
  const [selectedLoan, setSelectedLoan] = useState<Pinjaman | null>(null);

  // Queries
  const { data: loanList = [], isLoading: loadingLoans } = useQuery({
    queryKey: ["pinjaman-angsuran-all"],
    queryFn: () => apiPinjaman.findAll(),
  });

  const { data: rekapBulananList = [], isLoading: loadingBulanan } = useQuery({
    queryKey: ["angsuran-rekap-bulanan", selectedBulan, selectedTahun],
    queryFn: () => apiPinjaman.getRekapAngsuranBulanan(selectedBulan, selectedTahun),
  });

  const activeLoans = loanList.filter((l) =>
    ["DICAIRKAN", "LUNAS"].includes(l.status),
  );

  // Mutations
  const bayarMutation = useMutation({
    mutationFn: (angsuranId: string) => apiPinjaman.bayarAngsuran(angsuranId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["angsuran-rekap-bulanan"] });
      queryClient.invalidateQueries({ queryKey: ["pinjaman-angsuran-all"] });
      queryClient.invalidateQueries({ queryKey: ["pinjaman-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Angsuran Berhasil Dibayar!", {
        description: `Kwitansi & Invoice terbit: ${res.noInvoice || "#KW-AUTO"}`,
      });
      if (selectedLoan) {
        apiPinjaman.findOne(selectedLoan.id).then(setSelectedLoan);
      }
    },
    onError: (err: any) => {
      toast.error("Gagal Memproses Pembayaran", { description: err.message });
    },
  });

  // Export to Excel / CSV
  const handleExportExcel = () => {
    if (rekapBulananList.length === 0) {
      toast.info("Tidak ada data angsuran pada periode ini.");
      return;
    }

    const headers = [
      "No",
      "Nama Pengangsur",
      "Pangkat",
      "NRP / NIP",
      "Bulan Ke",
      "Angsuran Pokok (Rp)",
      "Bunga Pinjaman (Rp)",
      "Total Tagihan (Rp)",
      "Jatuh Tempo",
      "Tanggal Bayar",
      "No. Kwitansi Invoice",
      "Status Pembayaran",
    ];

    const rows = rekapBulananList.map((item, idx) => {
      const formattedRank = formatPangkatKorps(item.pangkat, item.korps, item.kategoriPangkat);
      return [
        idx + 1,
        item.namaAnggota,
        formattedRank,
        `'${item.nrpNip}`,
        item.bulanKe,
        item.pokok,
        item.bunga,
        item.total,
        item.jatuhTempo ? new Date(item.jatuhTempo).toLocaleDateString("id-ID") : "-",
        item.tanggalBayar ? new Date(item.tanggalBayar).toLocaleDateString("id-ID") : "-",
        item.noInvoice || "-",
        item.dibayar ? "Lunas" : "Belum Bayar",
      ];
    });

    const filename = `Rekap_Angsuran_${BULAN_NAMES[selectedBulan - 1]}_${selectedTahun}`;
    exportToCSV(filename, headers, rows);
    toast.success(`Rekap angsuran berhasil diekspor: ${filename}.csv`);
  };

  const totalTagihanBulan = rekapBulananList.reduce((acc, curr) => acc + curr.total, 0);
  const totalTerbayarBulan = rekapBulananList
    .filter((a) => a.dibayar)
    .reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekap Angsuran Pinjaman Anggota"
        description="Rincian pembayaran angsuran bulanan, pencatatan transaksi oleh Bendahara, dan ekspor excel."
      />

      <Tabs defaultValue="bulanan" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="bulanan">Rekap Angsuran Bulanan</TabsTrigger>
          <TabsTrigger value="berjalan">Pinjaman Berjalan</TabsTrigger>
        </TabsList>

        {/* ============================================================== */}
        {/* TAB 1: REKAP ANGSURAN BULANAN (RINCIAN SIAPA & TANGGAL & EXCEL) */}
        {/* ============================================================== */}
        <TabsContent value="bulanan" className="space-y-6">
          {/* Summary Row */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="shadow-card border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>Total Tagihan Periode {BULAN_NAMES[selectedBulan - 1]}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-extrabold text-foreground">{formatRp(totalTagihanBulan)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total {rekapBulananList.length} tagihan angsuran
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-card border-success/20">
              <CardHeader className="pb-2">
                <CardDescription>Sudah Terbayar / Masuk Kas</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-extrabold text-success">{formatRp(totalTerbayarBulan)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {rekapBulananList.filter((a) => a.dibayar).length} dari {rekapBulananList.length} orang lunas
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-card border-destructive/20">
              <CardHeader className="pb-2">
                <CardDescription>Sisa Belum Dibayar</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-extrabold text-destructive">
                  {formatRp(Math.max(0, totalTagihanBulan - totalTerbayarBulan))}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {rekapBulananList.filter((a) => !a.dibayar).length} tagihan menunggu pembayaran
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-card">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
              <div>
                <CardTitle>Daftar Angsuran Masuk Periode {BULAN_NAMES[selectedBulan - 1]} {selectedTahun}</CardTitle>
                <CardDescription>
                  Rincian pengangsur, jatuh tempo, tanggal bayar realisasi, dan status pelunasan
                </CardDescription>
              </div>

              {/* Filter Bulan & Tahun + Tombol Ekspor */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Select
                    value={String(selectedBulan)}
                    onValueChange={(v) => setSelectedBulan(Number(v))}
                  >
                    <SelectTrigger className="w-32 h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BULAN_NAMES.map((b, idx) => (
                        <SelectItem key={idx + 1} value={String(idx + 1)}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={String(selectedTahun)}
                    onValueChange={(v) => setSelectedTahun(Number(v))}
                  >
                    <SelectTrigger className="w-24 h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2025, 2026, 2027].map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  onClick={handleExportExcel}
                  className="h-9 gap-1.5 text-xs border-success/40 bg-success/10 text-success hover:bg-success/20 font-semibold"
                >
                  <FileSpreadsheet className="size-4" /> Ekspor ke Excel (.csv)
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-12">No.</TableHead>
                    <TableHead>Nama Pengangsur</TableHead>
                    <TableHead>Pangkat / Golongan</TableHead>
                    <TableHead>NRP / NIP</TableHead>
                    <TableHead className="text-center">Bulan Ke</TableHead>
                    <TableHead className="text-right">Pokok</TableHead>
                    <TableHead className="text-right">Bunga (1%)</TableHead>
                    <TableHead className="text-right">Total Angsuran</TableHead>
                    <TableHead>Jatuh Tempo</TableHead>
                    <TableHead>Tanggal Bayar</TableHead>
                    <TableHead>No. Kwitansi</TableHead>
                    <TableHead className="text-right">Aksi / Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingBulanan ? (
                    <TableRow>
                      <TableCell colSpan={12} className="py-12 text-center text-muted-foreground">
                        <Loader2 className="mx-auto size-6 animate-spin mb-2 text-primary" />
                        Memuat data angsuran bulanan...
                      </TableCell>
                    </TableRow>
                  ) : (
                    rekapBulananList.map((item, idx) => {
                      const formattedPangkat = formatPangkatKorps(item.pangkat, item.korps, item.kategoriPangkat);
                      return (
                        <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="font-semibold text-foreground">{item.namaAnggota}</TableCell>
                          <TableCell className="text-xs font-medium text-foreground">
                            {formattedPangkat}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-semibold">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(item.nrpNip);
                                toast.success(`NRP disalin: ${item.nrpNip}`);
                              }}
                              className="flex items-center gap-1 text-primary hover:underline text-left"
                              title="Klik untuk menyalin NRP"
                            >
                              {item.nrpNip}
                              <Copy className="size-3 opacity-60" />
                            </button>
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs font-medium">{item.bulanKe}</TableCell>
                          <TableCell className="text-right font-medium">{formatRp(item.pokok)}</TableCell>
                          <TableCell className="text-right font-medium">{formatRp(item.bunga)}</TableCell>
                          <TableCell className="text-right font-bold text-foreground">
                            {formatRp(item.total)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {item.jatuhTempo ? new Date(item.jatuhTempo).toLocaleDateString("id-ID") : "-"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {item.tanggalBayar ? (
                              <span className="text-success font-semibold">
                                {new Date(item.tanggalBayar).toLocaleDateString("id-ID", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic">-</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {item.noInvoice || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.dibayar ? (
                              <Badge
                                variant="outline"
                                className="border-success/30 bg-success/15 text-success text-[11px] font-semibold"
                              >
                                Lunas
                              </Badge>
                            ) : isBendaharaOrAdmin ? (
                              <Button
                                size="sm"
                                disabled={bayarMutation.isPending}
                                onClick={() => bayarMutation.mutate(item.id)}
                                className="h-8 text-xs font-semibold bg-primary hover:bg-primary/90"
                              >
                                {bayarMutation.isPending ? (
                                  <Loader2 className="size-3 animate-spin mr-1" />
                                ) : null}
                                Catat Bayar
                              </Button>
                            ) : (
                              <Badge variant="outline" className="text-[11px] text-muted-foreground">
                                Belum Bayar
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                  {!loadingBulanan && rekapBulananList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={12} className="py-12 text-center text-muted-foreground">
                        Tidak ada catatan angsuran pada periode {BULAN_NAMES[selectedBulan - 1]} {selectedTahun}.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 2: DAFTAR PINJAMAN BERJALAN & DETAIL JADWAL */}
        {/* ============================================================== */}
        <TabsContent value="berjalan" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Daftar Pinjaman Berjalan Seluruh Anggota</CardTitle>
              <CardDescription>
                Pantau sisa pokok pinjaman, tenor, dan riwayat cicilan lengkap per personel
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Pinjaman</TableHead>
                    <TableHead>Nama Anggota</TableHead>
                    <TableHead>Pangkat / NRP</TableHead>
                    <TableHead className="text-right">Plafon Awal</TableHead>
                    <TableHead className="text-right">Sisa Pokok</TableHead>
                    <TableHead className="text-center">Tenor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingLoans ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                        <Loader2 className="mx-auto size-6 animate-spin mb-2" />
                        Memuat daftar pinjaman...
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeLoans.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-mono text-xs font-semibold">
                          {l.id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell className="font-medium">{formatNamaLengkapDinas(l.anggota?.nama, l.anggota?.pangkat?.nama, l.anggota?.korps?.nama, l.anggota?.pangkat?.kategori)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          NRP {l.anggota?.nrpNip || "-"}
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
                            <Calendar className="mr-1 size-3.5" /> Jadwal &amp; Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Jadwal Angsuran & Pembayaran Detail */}
      <Dialog open={!!selectedLoan} onOpenChange={(o) => !o && setSelectedLoan(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Jadwal &amp; Pembayaran Angsuran</DialogTitle>
            <DialogDescription>
              {formatNamaLengkapDinas(selectedLoan?.anggota?.nama, selectedLoan?.anggota?.pangkat?.nama, selectedLoan?.anggota?.korps?.nama, selectedLoan?.anggota?.pangkat?.kategori)} · Plafon {formatRp(Number(selectedLoan?.nominal || 0))} · Sisa Pokok{" "}
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
                  <TableHead className="text-right">Bunga</TableHead>
                  <TableHead className="text-right">Total Tagihan</TableHead>
                  <TableHead>Tanggal Bayar</TableHead>
                  <TableHead>No. Invoice</TableHead>
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
                    <TableCell className="text-right">{formatRp(Number(ang.pokok || 0))}</TableCell>
                    <TableCell className="text-right">{formatRp(Number(ang.bunga || 0))}</TableCell>
                    <TableCell className="text-right font-bold text-foreground">
                      {formatRp(Number(ang.total || 0))}
                    </TableCell>
                    <TableCell className="text-xs">
                      {ang.tanggalBayar ? (
                        <span className="text-success font-medium">
                          {new Date(ang.tanggalBayar).toLocaleDateString("id-ID")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {ang.noInvoice || "-"}
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
                        <Badge variant="outline" className="border-success/30 bg-success/15 text-success text-[10px]">
                          Lunas
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
