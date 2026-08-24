import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RefreshCw,
  Search,
  SlidersHorizontal,
  Pencil,
  UserPlus,
  Loader2,
  Trash2,
  Copy,
  Users,
  Shield,
  Award,
  UserCheck,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatRp, formatPangkatKorps, cleanNamaPersonel } from "@/lib/casheva-data";
import { apiAnggota, apiMaster, apiSimpanan, type Anggota, type Korps, type Pangkat } from "@/lib/api";

export const Route = createFileRoute("/anggota")({
  head: () => ({
    meta: [
      { title: "Data Anggota & Simpanan — Casheva Koperasi TNI AD" },
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

type CategoryFilter = "ALL" | "PATI" | "PAMEN" | "PAMA" | "BINTARA" | "PNS";

function AnggotaPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
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
  const { data: anggotaList = [], isLoading } = useQuery({
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
  const simpananMap = useMemo(
    () => new Map(rekapSimpanan.map((s) => [s.anggotaId, s])),
    [rekapSimpanan],
  );

  // Filter anggota dengan useMemo
  const filteredRows = useMemo(() => {
    const query = q.toLowerCase().trim();
    return anggotaList.filter((a) => {
      const matchSearch =
        !query ||
        a.nama.toLowerCase().includes(query) ||
        a.nrpNip.includes(query) ||
        (a.pangkat?.nama || "").toLowerCase().includes(query) ||
        (a.korps?.nama || "").toLowerCase().includes(query);

      if (!matchSearch) return false;

      const kat = a.pangkat?.kategori;
      if (categoryFilter === "ALL") return true;
      if (categoryFilter === "PATI") return kat === "PATI";
      if (categoryFilter === "PAMEN") return kat === "PAMEN";
      if (categoryFilter === "PAMA") return kat === "PAMA";
      if (categoryFilter === "BINTARA") return kat === "BINTARA" || kat === "BATA_ASN";
      if (categoryFilter === "PNS") return kat === "PNS";

      return true;
    });
  }, [anggotaList, q, categoryFilter]);

  // Statistik Ringkas
  const stats = useMemo(() => {
    const total = anggotaList.length;
    const patiPamen = anggotaList.filter((a) => ["PATI", "PAMEN"].includes(a.pangkat?.kategori)).length;
    const pamaBa = anggotaList.filter((a) => ["PAMA", "BINTARA", "BATA_ASN"].includes(a.pangkat?.kategori)).length;
    const pns = anggotaList.filter((a) => a.pangkat?.kategori === "PNS").length;
    return { total, patiPamen, pamaBa, pns };
  }, [anggotaList]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (dto: typeof formData) => apiAnggota.create(dto),
    onSuccess: () => {
      toast.success("Anggota Baru & Akun Login Berhasil Dibuat!", {
        description: "Akun login otomatis diaktifkan dengan Username = NRP dan Password awal = Admin123!",
      });
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`NRP disalin: ${text}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Data Anggota Koperasi"
        description={`${anggotaList.length} personel terdaftar pada Satminkal binaan (3 Kunci Utama: Nama, Pangkat, NRP).`}
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
              Auto-Generate Simpanan Sukarela
            </Button>
            <Button onClick={() => setIsCreateOpen(true)} className="shadow-md">
              <UserPlus className="mr-2 size-4" /> Tambah Anggota Baru
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card card-interactive border-primary/20">
          <CardHeader className="pb-1">
            <CardDescription className="flex items-center justify-between">
              <span>Total Personel</span>
              <Users className="size-4 text-primary" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Personel anggota aktif</p>
          </CardContent>
        </Card>

        <Card className="shadow-card card-interactive border-gold/20">
          <CardHeader className="pb-1">
            <CardDescription className="flex items-center justify-between">
              <span>Pati &amp; Pamen</span>
              <Award className="size-4 text-gold" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-gold">{stats.patiPamen}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Perwira Tinggi &amp; Menengah</p>
          </CardContent>
        </Card>

        <Card className="shadow-card card-interactive border-blue-500/20">
          <CardHeader className="pb-1">
            <CardDescription className="flex items-center justify-between">
              <span>Pama &amp; Bintara</span>
              <Shield className="size-4 text-blue-500" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{stats.pamaBa}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Perwira Pertama &amp; Bintara</p>
          </CardContent>
        </Card>

        <Card className="shadow-card card-interactive border-success/20">
          <CardHeader className="pb-1">
            <CardDescription className="flex items-center justify-between">
              <span>PNS / ASN</span>
              <UserCheck className="size-4 text-success" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-success">{stats.pns}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pegawai Negeri Sipil TNI AD</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="shadow-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari nama anggota, NRP, pangkat, atau korps…"
                className="pl-9 h-10"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Rank Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
              {[
                { key: "ALL", label: "Semua" },
                { key: "PATI", label: "Pati" },
                { key: "PAMEN", label: "Pamen" },
                { key: "PAMA", label: "Pama" },
                { key: "BINTARA", label: "Bintara/Ta" },
                { key: "PNS", label: "PNS / ASN" },
              ].map((tab) => (
                <Button
                  key={tab.key}
                  variant={categoryFilter === tab.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter(tab.key as CategoryFilter)}
                  className={`h-8 text-xs px-2.5 transition-all ${
                    categoryFilter === tab.key ? "shadow-sm font-semibold" : "text-muted-foreground"
                  }`}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Data */}
      <Card className="shadow-card">
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-12">No.</TableHead>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>Pangkat / Golongan</TableHead>
                <TableHead>NRP / NIP</TableHead>
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
                  <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-6 animate-spin mb-2 text-primary" />
                    Memuat data anggota dari database...
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((a, idx) => {
                  const simp = simpananMap.get(a.id);
                  const wajib = simp?.simpananWajib ?? 0;
                  const sukarela = simp?.simpananSukarela ?? 0;
                  const formattedPangkat = formatPangkatKorps(
                    a.pangkat?.nama,
                    a.korps?.nama,
                    a.pangkat?.kategori,
                  );

                  return (
                    <TableRow key={a.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-semibold text-foreground">{cleanNamaPersonel(a.nama)}</TableCell>
                      <TableCell className="text-xs font-medium text-foreground">
                        {formattedPangkat}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold">
                        <button
                          onClick={() => copyToClipboard(a.nrpNip)}
                          className="flex items-center gap-1 text-primary hover:underline text-left"
                          title="Klik untuk menyalin NRP"
                        >
                          {a.nrpNip}
                          <Copy className="size-3 opacity-60" />
                        </button>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {a.satminkal?.nama || "Disinfolahtad"}
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatRp(Number(wajib))}</TableCell>
                      <TableCell className="text-right text-success font-medium">
                        {formatRp(Number(sukarela))}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            a.isAktif
                              ? "bg-success/15 text-success border-success/30 text-[10px]"
                              : "bg-muted text-muted-foreground border-border text-[10px]"
                          }
                        >
                          {a.isAktif ? "Aktif" : "Non-Aktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8"
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
                          <Pencil className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
              {!isLoading && filteredRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-12 text-center text-muted-foreground">
                    Tidak ada data anggota yang cocok dengan pencarian.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Tambah Anggota Baru */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Anggota Koperasi Baru</DialogTitle>
            <DialogDescription>
              Input 3 Kunci Utama: Nama Lengkap, Pangkat TNI AD, dan NRP/NIP sebagai kredensial login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label>Nama Lengkap (Kunci Utama 1)</Label>
              <Input
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Contoh: Sigit Suhendro"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Pangkat TNI AD (Kunci Utama 2)</Label>
              <Select
                value={formData.pangkatId}
                onValueChange={(val) => setFormData({ ...formData, pangkatId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="-- Pilih Pangkat TNI AD --" />
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

            <div className="space-y-1.5">
              <Label>NRP / NIP (Kunci Utama 3 / Login ID)</Label>
              <Input
                value={formData.nrpNip}
                onChange={(e) => setFormData({ ...formData, nrpNip: e.target.value })}
                placeholder="Contoh: 1102123401"
                className="font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Korps</Label>
              <Select
                value={formData.korpsId}
                onValueChange={(val) => setFormData({ ...formData, korpsId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="-- Pilih Korps --" />
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

            <div className="space-y-1.5">
              <Label>TMT Menjadi Anggota</Label>
              <Input
                type="date"
                value={formData.tmtAnggota}
                onChange={(e) => setFormData({ ...formData, tmtAnggota: e.target.value })}
              />
            </div>

            <div className="rounded-lg border border-primary/25 bg-primary-soft/50 p-3 space-y-1">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-primary" /> Auto-Provisioning Akun:
              </p>
              <p className="text-[11px] text-muted-foreground">
                Akun login anggota otomatis dibuat dengan Username = NRP dan Password awal = <strong>Admin123!</strong>.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={!formData.nama || !formData.pangkatId || !formData.nrpNip || createMutation.isPending}
              onClick={() => createMutation.mutate(formData)}
            >
              {createMutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Simpan &amp; Aktifkan Akun
            </Button>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Edit Anggota */}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Data Anggota</DialogTitle>
            <DialogDescription>Perbarui data personel anggota koperasi</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label>Nama Lengkap</Label>
              <Input
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>NRP / NIP</Label>
              <Input
                value={formData.nrpNip}
                onChange={(e) => setFormData({ ...formData, nrpNip: e.target.value })}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Pangkat TNI AD</Label>
              <Select
                value={formData.pangkatId}
                onValueChange={(val) => setFormData({ ...formData, pangkatId: val })}
              >
                <SelectTrigger>
                  <SelectValue />
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
            <div className="space-y-1.5">
              <Label>Korps</Label>
              <Select
                value={formData.korpsId}
                onValueChange={(val) => setFormData({ ...formData, korpsId: val })}
              >
                <SelectTrigger>
                  <SelectValue />
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
          <DialogFooter>
            <Button
              disabled={updateMutation.isPending}
              onClick={() => {
                if (edit) {
                  updateMutation.mutate({ id: edit.id, dto: formData });
                }
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
