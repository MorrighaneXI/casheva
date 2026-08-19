import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Search, SlidersHorizontal, Pencil, UserPlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { formatRp } from "@/lib/casheva-data";
import { apiAnggota, apiMaster, apiSimpanan, type Anggota, type Korps, type Pangkat } from "@/lib/api";

export const Route = createFileRoute("/anggota")({
  head: () => ({
    meta: [
      { title: "Data Anggota & Simpanan — Casheva" },
      {
        name: "description",
        content:
          "Master data anggota koperasi TNI AD lengkap dengan NRP, pangkat, korps, satminkal, dan posisi simpanan.",
      },
      { property: "og:title", content: "Data Anggota & Simpanan — Casheva" },
      {
        property: "og:description",
        content: "Kelola master data anggota dan simpanan koperasi TNI AD.",
      },
    ],
  }),
  component: AnggotaPage,
});

function AnggotaPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [gol, setGol] = useState("semua");
  const [edit, setEdit] = useState<Anggota | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    nama: "",
    nrpNip: "",
    pangkatId: "",
    korpsId: "",
    tmtAnggota: new Date().toISOString().split("T")[0],
  });

  // Queries
  const { data: anggotaList = [], isLoading, refetch } = useQuery({
    queryKey: ["anggota-list"],
    queryFn: () => apiAnggota.findAll(),
  });

  const { data: rekapSimpanan = [] } = useQuery({
    queryKey: ["simpanan-rekap"],
    queryFn: () => apiSimpanan.getRekap(),
  });

  const { data: pangkatList = [] } = useQuery({
    queryKey: ["master-pangkat"],
    queryFn: () => apiMaster.getPangkat(),
  });

  const { data: korpsList = [] } = useQuery({
    queryKey: ["master-korps"],
    queryFn: () => apiMaster.getKorps(),
  });

  // Map simpanan per anggota
  const simpananMap = new Map(
    rekapSimpanan.map((s) => [s.anggotaId, s])
  );

  // Mutations
  const createMutation = useMutation({
    mutationFn: (dto: typeof formData) => apiAnggota.create(dto),
    onSuccess: () => {
      toast.success("Anggota berhasil ditambahkan");
      queryClient.invalidateQueries({ queryKey: ["anggota-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setIsCreateOpen(false);
      setFormData({
        nama: "",
        nrpNip: "",
        pangkatId: "",
        korpsId: "",
        tmtAnggota: new Date().toISOString().split("T")[0],
      });
    },
    onError: (err: any) => {
      toast.error("Gagal menambahkan anggota", { description: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => apiAnggota.update(id, dto),
    onSuccess: () => {
      toast.success("Data anggota berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: ["anggota-list"] });
      setEdit(null);
    },
    onError: (err: any) => {
      toast.error("Gagal memperbarui anggota", { description: err.message });
    },
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

  // Filter anggota
  const filteredRows = anggotaList.filter((a) => {
    const match =
      a.nama.toLowerCase().includes(q.toLowerCase()) || a.nrpNip.includes(q);
    const kat = a.pangkat?.kategori;
    const matchGol =
      gol === "semua" ||
      (gol === "Pamen" && kat === "PAMEN") ||
      (gol === "Pama" && kat === "PAMA") ||
      (gol === "Ba/Ta" && kat === "BATA_ASN");
    return match && matchGol;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Data Anggota & Simpanan"
        description={`${anggotaList.length} anggota terdaftar pada Satminkal binaan (Database Terintegrasi)`}
        actions={
          <>
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
              Auto-Generate Simpanan Sukarela
            </Button>
            <Button onClick={() => setIsCreateOpen(true)}>
              <UserPlus className="mr-2 size-4" /> Tambah Anggota
            </Button>
          </>
        }
      />

      <Card className="shadow-card">
        <CardContent className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_200px]">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama atau NRP/NIP…"
              className="pl-9"
            />
          </div>
          <Select value={gol} onValueChange={setGol}>
            <SelectTrigger>
              <SlidersHorizontal className="mr-2 size-4" />
              <SelectValue placeholder="Kategori Pangkat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Kategori</SelectItem>
              <SelectItem value="Pamen">Pamen (Perwira Menengah)</SelectItem>
              <SelectItem value="Pama">Pama (Perwira Pertama)</SelectItem>
              <SelectItem value="Ba/Ta">Ba / Ta / ASN</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="overflow-x-auto py-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NRP / NIP</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Pangkat</TableHead>
                <TableHead>Korps</TableHead>
                <TableHead>Satminkal</TableHead>
                <TableHead className="text-right">Simpanan Wajib</TableHead>
                <TableHead className="text-right">Sukarela</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-6 animate-spin mb-2" />
                    Memuat data anggota dari database...
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((a) => {
                  const simp = simpananMap.get(a.id);
                  const wajib = simp?.simpananWajib ?? 0;
                  const sukarela = simp?.simpananSukarela ?? 0;
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-xs font-semibold">{a.nrpNip}</TableCell>
                      <TableCell className="font-medium">{a.nama}</TableCell>
                      <TableCell>
                        {a.pangkat?.nama || "-"}
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({a.pangkat?.kategori || "-"})
                        </span>
                      </TableCell>
                      <TableCell>{a.korps?.nama || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {a.satminkal?.nama || "Disinfolahtad"}
                      </TableCell>
                      <TableCell className="text-right">{formatRp(Number(wajib))}</TableCell>
                      <TableCell className="text-right">{formatRp(Number(sukarela))}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            a.isAktif
                              ? "bg-success/15 text-success border-success/30"
                              : "bg-muted text-muted-foreground border-border"
                          }
                        >
                          {a.isAktif ? "Aktif" : "Non-Aktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEdit(a);
                            setFormData({
                              nama: a.nama,
                              nrpNip: a.nrpNip,
                              pangkatId: a.pangkatId,
                              korpsId: a.korpsId,
                              tmtAnggota: a.tmtAnggota ? a.tmtAnggota.split("T")[0] : "",
                            });
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
              {!isLoading && filteredRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    Tidak ada anggota yang cocok dengan filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Tambah Anggota */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Anggota Baru</DialogTitle>
            <DialogDescription>
              Masukkan identitas personel sesuai kodifikasi TNI AD.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Contoh: Letkol Inf Sigit"
              />
            </div>
            <div className="space-y-2">
              <Label>NRP / NIP</Label>
              <Input
                value={formData.nrpNip}
                onChange={(e) => setFormData({ ...formData, nrpNip: e.target.value })}
                placeholder="Contoh: 11020019460278"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Pangkat</Label>
                <Select
                  value={formData.pangkatId}
                  onValueChange={(val) => setFormData({ ...formData, pangkatId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Pangkat" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {pangkatList.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nama} ({p.kategori})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Korps</Label>
                <Select
                  value={formData.korpsId}
                  onValueChange={(val) => setFormData({ ...formData, korpsId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Korps" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {korpsList.map((k) => (
                      <SelectItem key={k.id} value={k.id}>
                        {k.nama} ({k.kode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>TMT Anggota</Label>
              <Input
                type="date"
                value={formData.tmtAnggota}
                onChange={(e) => setFormData({ ...formData, tmtAnggota: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={createMutation.isPending}
              onClick={() => {
                if (!formData.nama || !formData.nrpNip || !formData.pangkatId || !formData.korpsId) {
                  toast.error("Lengkapi semua field yang diperlukan");
                  return;
                }
                createMutation.mutate(formData);
              }}
            >
              {createMutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Simpan Anggota
            </Button>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Edit Anggota */}
      <Dialog open={edit !== null} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ubah Data Anggota</DialogTitle>
            <DialogDescription>
              Perbarui identitas keanggotaan personel.
            </DialogDescription>
          </DialogHeader>
          {edit && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>NRP / NIP</Label>
                <Input
                  value={formData.nrpNip}
                  onChange={(e) => setFormData({ ...formData, nrpNip: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Pangkat</Label>
                  <Select
                    value={formData.pangkatId}
                    onValueChange={(val) => setFormData({ ...formData, pangkatId: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Pangkat" />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {pangkatList.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nama} ({p.kategori})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Korps</Label>
                  <Select
                    value={formData.korpsId}
                    onValueChange={(val) => setFormData({ ...formData, korpsId: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Korps" />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {korpsList.map((k) => (
                        <SelectItem key={k.id} value={k.id}>
                          {k.nama} ({k.kode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              disabled={updateMutation.isPending}
              onClick={() => {
                if (!edit) return;
                updateMutation.mutate({ id: edit.id, dto: formData });
              }}
            >
              {updateMutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Simpan Perubahan
            </Button>
            <Button variant="outline" onClick={() => setEdit(null)}>
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
