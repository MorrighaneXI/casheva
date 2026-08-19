import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, ArrowDownLeft, ArrowUpRight, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { formatRp } from "@/lib/casheva-data";
import { apiAnggota, apiSimpanan, type SimpananRekapItem } from "@/lib/api";

export const Route = createFileRoute("/simpanan")({
  head: () => ({
    meta: [
      { title: "Transaksi Simpanan — Casheva" },
      {
        name: "description",
        content:
          "Catat setoran dan penarikan simpanan pokok, wajib, dan sukarela anggota koperasi TNI AD.",
      },
      { property: "og:title", content: "Transaksi Simpanan — Casheva" },
      {
        property: "og:description",
        content: "Mutasi simpanan anggota koperasi TNI AD secara real time.",
      },
    ],
  }),
  component: SimpananPage,
});

function SimpananPage() {
  const queryClient = useQueryClient();
  const [openPokokWajib, setOpenPokokWajib] = useState(false);
  const [selectedAnggotaId, setSelectedAnggotaId] = useState("");
  const [search, setSearch] = useState("");

  const { data: rekapList = [], isLoading } = useQuery({
    queryKey: ["simpanan-rekap"],
    queryFn: () => apiSimpanan.getRekap(),
  });

  const { data: anggotaList = [] } = useQuery({
    queryKey: ["anggota-list"],
    queryFn: () => apiAnggota.findAll(true),
  });

  const massalMutation = useMutation({
    mutationFn: () => apiSimpanan.sukarelaMassal(),
    onSuccess: (res) => {
      toast.success("Simpanan Sukarela Massal Berhasil", {
        description: `${res.message} - Total: ${formatRp(res.totalNominal)}`,
      });
      queryClient.invalidateQueries({ queryKey: ["simpanan-rekap"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
    onError: (err: any) => {
      toast.error("Gagal menjalankan potongan massal", { description: err.message });
    },
  });

  const pokokWajibMutation = useMutation({
    mutationFn: (anggotaId: string) => apiSimpanan.setPokokWajib(anggotaId),
    onSuccess: (res) => {
      toast.success("Simpanan Awal Berhasil Dicatat", {
        description: res.message || "Simpanan Pokok (Rp 50.000) & Wajib (Rp 100.000) tersimpan.",
      });
      queryClient.invalidateQueries({ queryKey: ["simpanan-rekap"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setOpenPokokWajib(false);
      setSelectedAnggotaId("");
    },
    onError: (err: any) => {
      toast.error("Gagal mencatat simpanan awal", { description: err.message });
    },
  });

  const totalPokok = rekapList.reduce((acc, row) => acc + Number(row.simpananPokok || 0), 0);
  const totalWajib = rekapList.reduce((acc, row) => acc + Number(row.simpananWajib || 0), 0);
  const totalSukarela = rekapList.reduce((acc, row) => acc + Number(row.simpananSukarela || 0), 0);

  const filteredRekap = rekapList.filter(
    (r) =>
      r.nama.toLowerCase().includes(search.toLowerCase()) ||
      r.nrpNip.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transaksi & Rekap Simpanan"
        description="Pengelolaan simpanan pokok, wajib, dan simpanan sukarela bulanan anggota"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={massalMutation.isPending}
              onClick={() => massalMutation.mutate()}
            >
              {massalMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 size-4" />
              )}
              Jalankan Batch Tgl 5 (Sukarela)
            </Button>
            <Button onClick={() => setOpenPokokWajib(true)}>
              <Plus className="mr-2 size-4" /> Setor Pokok & Wajib Awal
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Total Simpanan Pokok (Rp 50.000/org)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-extrabold text-primary">{formatRp(totalPokok)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Total Simpanan Wajib (Rp 100.000/org)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-extrabold text-foreground">{formatRp(totalWajib)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Total Simpanan Sukarela (Potongan Juru Bayar)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-extrabold text-success">{formatRp(totalSukarela)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-3">
          <div>
            <CardTitle>Rekap Saldo Simpanan Per Anggota</CardTitle>
            <CardDescription>
              Tercatat otomatis berdasarkan grade: Pamen Rp 300rb, Pama Rp 250rb, Ba/Ta/ASN Rp 150rb
            </CardDescription>
          </div>
          <div className="w-full sm:w-64">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari anggota / NRP..."
            />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Nama Anggota</TableHead>
                <TableHead>Pangkat / Korps / NRP</TableHead>
                <TableHead>Satminkal</TableHead>
                <TableHead className="text-right">Pokok</TableHead>
                <TableHead className="text-right">Wajib</TableHead>
                <TableHead className="text-right">Sukarela</TableHead>
                <TableHead className="text-right font-bold">Total Simpanan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-6 animate-spin mb-2" />
                    Memuat data simpanan anggota...
                  </TableCell>
                </TableRow>
              ) : (
                filteredRekap.map((r, idx) => (
                  <TableRow key={r.anggotaId}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-medium">{r.nama}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {r.pangkat} {r.korps ? `(${r.korps})` : ""} / {r.nrpNip}
                    </TableCell>
                    <TableCell>{r.satminkal}</TableCell>
                    <TableCell className="text-right">{formatRp(Number(r.simpananPokok))}</TableCell>
                    <TableCell className="text-right">{formatRp(Number(r.simpananWajib))}</TableCell>
                    <TableCell className="text-right text-success font-medium">
                      {formatRp(Number(r.simpananSukarela))}
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground">
                      {formatRp(Number(r.totalSimpanan))}
                    </TableCell>
                  </TableRow>
                ))
              )}
              {!isLoading && filteredRekap.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    Tidak ada data simpanan ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Setor Pokok & Wajib Awal */}
      <Dialog open={openPokokWajib} onOpenChange={setOpenPokokWajib}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Setor Simpanan Pokok & Wajib Awal</DialogTitle>
            <DialogDescription>
              Mencatat setoran pertama kali saat personel terdaftar (Pokok: Rp 50.000, Wajib: Rp 100.000).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Pilih Anggota</Label>
              <Select value={selectedAnggotaId} onValueChange={setSelectedAnggotaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih anggota yang baru bergabung" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {anggotaList.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nama} ({a.pangkat?.nama || ""} - {a.nrpNip})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg bg-muted/60 p-3 text-xs space-y-1">
              <p className="font-semibold text-foreground">Ketentuan Juknis TNI AD 2026:</p>
              <p>• Simpanan Pokok: Rp 50.000,- (Sekali saat masuk)</p>
              <p>• Simpanan Wajib: Rp 100.000,- (Pertama kali masuk)</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={!selectedAnggotaId || pokokWajibMutation.isPending}
              onClick={() => {
                if (selectedAnggotaId) pokokWajibMutation.mutate(selectedAnggotaId);
              }}
            >
              {pokokWajibMutation.isPending ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : null}
              Proses Setoran
            </Button>
            <Button variant="outline" onClick={() => setOpenPokokWajib(false)}>
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
