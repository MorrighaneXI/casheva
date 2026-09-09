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
  UserX,
  CheckCircle2,
  Eye,
  EyeOff,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  formatPangkatKorps,
  cleanNamaPersonel,
  backendRoleToFrontend,
} from "@/lib/casheva-data";
import { apiAnggota, apiMaster, apiSimpanan, type Anggota, type Korps, type Pangkat } from "@/lib/api";
import { exportToExcel } from "@/lib/export-excel";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    nama: "",
    nrpNip: "",
    pangkatId: "",
    korpsId: "",
    role: "ANGGOTA",
    password: "Admin123!",
    tmtAnggota: new Date().toISOString().split("T")[0],
  });

  // CRUD Alert Confirmation States
  const [openConfirmCreate, setOpenConfirmCreate] = useState(false);
  const [openConfirmUpdate, setOpenConfirmUpdate] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [selectedAnggotaAction, setSelectedAnggotaAction] = useState<Anggota | null>(null);
  const [openConfirmMassal, setOpenConfirmMassal] = useState(false);
  const [openConfirmHapus, setOpenConfirmHapus] = useState(false);
  const [selectedHapusAnggota, setSelectedHapusAnggota] = useState<Anggota | null>(null);

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
    const patiPamen = anggotaList.filter((a) => a.pangkat?.kategori && ["PATI", "PAMEN"].includes(a.pangkat.kategori)).length;
    const pamaBa = anggotaList.filter((a) => a.pangkat?.kategori && ["PAMA", "BINTARA", "BATA_ASN"].includes(a.pangkat.kategori)).length;
    const pns = anggotaList.filter((a) => a.pangkat?.kategori === "PNS").length;
    return { total, patiPamen, pamaBa, pns };
  }, [anggotaList]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (dto: typeof formData) =>
      apiAnggota.create({
        nama: dto.nama,
        nrpNip: dto.nrpNip,
        pangkatId: dto.pangkatId,
        korpsId: dto.korpsId,
        tmtAnggota: dto.tmtAnggota,
        role: dto.role as any,
        password: dto.password,
      }),
    onSuccess: (res) => {
      toast.success("Anggota & Akun User Berhasil Dibuat!", {
        description: `Personel ${res.nama} (${res.nrpNip}) otomatis aktif dengan akun login user sistem.`,
      });
      queryClient.invalidateQueries({ queryKey: ["anggota-list"] });
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setIsCreateOpen(false);
      setFormData({
        nama: "",
        nrpNip: "",
        pangkatId: "",
        korpsId: "",
        role: "ANGGOTA",
        password: "Admin123!",
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
      toast.success("Data Anggota & Akun User Berhasil Diperbarui", {
        description: "Perubahan data personel dan hak akses login tersinkronisasi.",
      });
      queryClient.invalidateQueries({ queryKey: ["anggota-list"] });
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
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

  const toggleAktifMutation = useMutation({
    mutationFn: ({ id, isAktif }: { id: string; isAktif: boolean }) =>
      apiAnggota.update(id, { isAktif }),
    onSuccess: (_, variables) => {
      toast.success(
        variables.isAktif ? "Anggota Berhasil Diaktifkan" : "Anggota Berhasil Dinonaktifkan",
        {
          description: "Status keanggotaan dan akun login sistem telah diselaraskan.",
        }
      );
      queryClient.invalidateQueries({ queryKey: ["anggota-list"] });
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
    },
    onError: (err: any) => {
      toast.error("Gagal mengubah status anggota", { description: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiAnggota.remove(id),
    onSuccess: (res) => {
      toast.success("Anggota Berhasil Dihapus Permanen", {
        description: `Data personel ${res?.nama || ""} telah dihapus dari database beserta akun login terkait.`,
      });
      queryClient.invalidateQueries({ queryKey: ["anggota-list"] });
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["simpanan-rekap"] });
    },
    onError: (err: any) => {
      toast.error("Gagal menghapus anggota", { description: err.message });
    },
  });

  const handleExportExcel = () => {
    const filename = `Data_Anggota_Koperasi_${new Date().toISOString().split("T")[0]}`;
    const headers = [
      "No.",
      "Nama Personel",
      "Pangkat",
      "Korps",
      "NRP / NIP",
      "Satminkal",
      "Simpanan Wajib",
      "Simpanan Sukarela",
      "Status",
    ];

    const rows = filteredRows.map((a, idx) => {
      const simp = simpananMap.get(a.id);
      return [
        idx + 1,
        cleanNamaPersonel(a.nama),
        a.pangkat?.nama || "-",
        a.korps?.nama || "-",
        a.nrpNip,
        a.satminkal?.nama || "INFOLAHTADAM IV/DIPONEGORO",
        Number(simp?.simpananWajib ?? 0),
        Number(simp?.simpananSukarela ?? 0),
        a.isAktif ? "Aktif" : "Non-Aktif",
      ];
    });

    exportToExcel({
      filename,
      title: "Daftar Anggota & Rekap Posisi Simpanan Koperasi TNI AD",
      headers,
      rows,
      summary: [
        { label: "Total Personel Anggota Terdaftar", value: `${filteredRows.length} Personel` },
      ],
    });

    toast.success("File Excel Anggota Berhasil Diunduh!", {
      description: `${filteredRows.length} data anggota berhasil diekspor.`,
    });
  };

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
              onClick={handleExportExcel}
              className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100"
            >
              Ekspor ke Excel
            </Button>
            <Button
              variant="outline"
              disabled={massalMutation.isPending}
              onClick={() => setOpenConfirmMassal(true)}
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
                <TableHead>Role Sistem</TableHead>
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
                  <TableCell colSpan={10} className="py-12 text-center text-muted-foreground">
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
                  const memberRole = a.role || a.user?.role || "ANGGOTA";

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
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/20"
                        >
                          {backendRoleToFrontend(memberRole)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {a.satminkal?.nama || "INFOLAHTADAM IV/DIPONEGORO"}
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
                      <TableCell className="text-right space-x-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8"
                          title="Edit Data Personel &amp; Hak Akses"
                          onClick={() => {
                            setEdit(a);
                            setFormData({
                              nama: a.nama,
                              nrpNip: a.nrpNip,
                              pangkatId: a.pangkatId,
                              korpsId: a.korpsId,
                              role: memberRole as any,
                              password: "",
                              tmtAnggota: a.tmtAnggota ? a.tmtAnggota.split("T")[0] : "",
                            });
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8"
                          title={a.isAktif ? "Nonaktifkan Anggota" : "Aktifkan Anggota"}
                          disabled={toggleAktifMutation.isPending}
                          onClick={() => {
                            setSelectedAnggotaAction(a);
                            setOpenConfirmDelete(true);
                          }}
                        >
                          {a.isAktif ? (
                            <UserX className="size-3.5 text-destructive" />
                          ) : (
                            <UserCheck className="size-3.5 text-success" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8"
                          title="Hapus Permanen Anggota"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            setSelectedHapusAnggota(a);
                            setOpenConfirmHapus(true);
                          }}
                        >
                          <Trash2 className="size-3.5 text-destructive" />
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
              <Label>Nama Lengkap (Kunci Utama 1) <span className="text-destructive">*</span></Label>
              <Input
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Contoh: Sigit Widiyanto, S.T., M.Tr.(Han)"
              />
              <p className="text-[10px] text-muted-foreground">Boleh mencantumkan gelar akademik / kehormatan</p>
            </div>

            <div className="space-y-1.5">
              <Label>Pangkat TNI AD (Kunci Utama 2) <span className="text-destructive">*</span></Label>
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
              <Label>NRP / NIP (Kunci Utama 3 / Login ID) <span className="text-destructive">*</span></Label>
              <Input
                value={formData.nrpNip}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 18);
                  setFormData({ ...formData, nrpNip: val });
                }}
                placeholder="Contoh: 11020019460278"
                className="font-mono"
                inputMode="numeric"
                maxLength={18}
              />
              <p className="text-[10px] text-muted-foreground">Hanya angka, maksimal 18 digit</p>
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
                  <SelectItem value="NONE">-- Tanpa Korps / Bintara / Tamtama / PNS --</SelectItem>
                  {korpsList.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.nama} ({k.kode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Role Hak Akses Sistem</Label>
              <Select
                value={formData.role}
                onValueChange={(val) => setFormData({ ...formData, role: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-56 text-xs">
                  <SelectItem value="ANGGOTA">Anggota</SelectItem>
                  <SelectItem value="BENDAHARA">Bendahara</SelectItem>
                  <SelectItem value="KASIR_TOKO">Kasir Toko</SelectItem>
                  <SelectItem value="JURU_BAYAR">Juru Bayar</SelectItem>
                  <SelectItem value="PIMPINAN">Pimpinan / Dan / Ka</SelectItem>
                  <SelectItem value="KEPRIM">Keprim</SelectItem>
                  <SelectItem value="PENGAWAS">Pengawas Koperasi</SelectItem>
                  <SelectItem value="ADMIN_KOPERASI">Admin Koperasi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Kata Sandi Awal <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="misal: Admin1a"
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  title={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {(() => {
                const pw = formData.password;
                const hasUpper = /[A-Z]/.test(pw);
                const hasLower = /[a-z]/.test(pw);
                const hasDigit = /[0-9]/.test(pw);
                const hasMinLen = pw.length >= 6;
                const allValid = hasUpper && hasLower && hasDigit && hasMinLen;
                return (
                  <div className="space-y-0.5 mt-1">
                    <p className={`text-[10px] ${hasMinLen ? "text-success" : "text-muted-foreground"}`}>
                      {hasMinLen ? "✓" : "○"} Minimal 6 karakter
                    </p>
                    <p className={`text-[10px] ${hasUpper ? "text-success" : "text-muted-foreground"}`}>
                      {hasUpper ? "✓" : "○"} Mengandung huruf kapital (A-Z)
                    </p>
                    <p className={`text-[10px] ${hasLower ? "text-success" : "text-muted-foreground"}`}>
                      {hasLower ? "✓" : "○"} Mengandung huruf kecil (a-z)
                    </p>
                    <p className={`text-[10px] ${hasDigit ? "text-success" : "text-muted-foreground"}`}>
                      {hasDigit ? "✓" : "○"} Mengandung angka (0-9)
                    </p>
                    {pw.length > 0 && !allValid && (
                      <p className="text-[10px] text-destructive font-medium mt-0.5">Kata sandi belum memenuhi syarat</p>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="space-y-1.5">
              <Label>Satuan</Label>
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground">
                INFOLAHTADAM IV/DIP
              </div>
              <p className="text-[10px] text-muted-foreground">Satuan tetap — seluruh personel terdaftar di INFOLAHTADAM IV/DIP</p>
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
                <CheckCircle2 className="size-3.5 text-primary" /> Auto-Provisioning Akun User:
              </p>
              <p className="text-[11px] text-muted-foreground">
                Menambahkan anggota otomatis membuat akun login User dengan Username = NRP dan Password yang ditentukan. Data langsung sinkron di <strong>Manajemen User &amp; Anggota</strong>.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={
                !formData.nama.trim() ||
                !formData.pangkatId ||
                !formData.nrpNip ||
                formData.nrpNip.length < 1 ||
                !/[A-Z]/.test(formData.password) ||
                !/[a-z]/.test(formData.password) ||
                !/[0-9]/.test(formData.password) ||
                formData.password.length < 6 ||
                createMutation.isPending
              }
              onClick={() => setOpenConfirmCreate(true)}
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
                placeholder="misal: Sigit Widiyanto, S.T., M.Tr.(Han)"
              />
              <p className="text-[10px] text-muted-foreground">Boleh mencantumkan gelar akademik / kehormatan</p>
            </div>
            <div className="space-y-1.5">
              <Label>NRP / NIP</Label>
              <Input
                value={formData.nrpNip}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 18);
                  setFormData({ ...formData, nrpNip: val });
                }}
                className="font-mono"
                inputMode="numeric"
                maxLength={18}
              />
              <p className="text-[10px] text-muted-foreground">Hanya angka, maksimal 18 digit</p>
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
                  <SelectItem value="NONE">-- Tanpa Korps / Bintara / Tamtama / PNS --</SelectItem>
                  {korpsList.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.nama} ({k.kode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Role Hak Akses Sistem</Label>
              <Select
                value={formData.role}
                onValueChange={(val) => setFormData({ ...formData, role: val as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-56 text-xs">
                  <SelectItem value="ANGGOTA">Anggota</SelectItem>
                  <SelectItem value="BENDAHARA">Bendahara</SelectItem>
                  <SelectItem value="KASIR_TOKO">Kasir Toko</SelectItem>
                  <SelectItem value="JURU_BAYAR">Juru Bayar</SelectItem>
                  <SelectItem value="PIMPINAN">Pimpinan / Dan / Ka</SelectItem>
                  <SelectItem value="KEPRIM">Keprim</SelectItem>
                  <SelectItem value="PENGAWAS">Pengawas Koperasi</SelectItem>
                  <SelectItem value="ADMIN_KOPERASI">Admin Koperasi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Kata Sandi Baru (Opsional)</Label>
              <div className="relative">
                <Input
                  type={showEditPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Kosongkan jika tidak ingin mengubah password"
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  title={showEditPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                >
                  {showEditPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {formData.password && formData.password.length > 0 && (
                <div className="space-y-0.5 mt-1">
                  <p className={`text-[10px] ${formData.password.length >= 6 ? "text-success" : "text-muted-foreground"}`}>
                    {formData.password.length >= 6 ? "✓" : "○"} Minimal 6 karakter
                  </p>
                  <p className={`text-[10px] ${/[A-Z]/.test(formData.password) ? "text-success" : "text-muted-foreground"}`}>
                    {/[A-Z]/.test(formData.password) ? "✓" : "○"} Mengandung huruf kapital (A-Z)
                  </p>
                  <p className={`text-[10px] ${/[a-z]/.test(formData.password) ? "text-success" : "text-muted-foreground"}`}>
                    {/[a-z]/.test(formData.password) ? "✓" : "○"} Mengandung huruf kecil (a-z)
                  </p>
                  <p className={`text-[10px] ${/[0-9]/.test(formData.password) ? "text-success" : "text-muted-foreground"}`}>
                    {/[0-9]/.test(formData.password) ? "✓" : "○"} Mengandung angka (0-9)
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-primary/25 bg-primary-soft/50 p-2.5 space-y-0.5">
              <p className="font-semibold text-foreground flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="size-3.5 text-primary" /> Sinkronisasi 2-Arah Terhubung:
              </p>
              <p className="text-[10px] text-muted-foreground">
                Perubahan data personel, role, atau kata sandi di sini langsung disinkronkan ke <strong>Manajemen User</strong>.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={
                Boolean(
                  updateMutation.isPending ||
                  !formData.nama.trim() ||
                  !formData.nrpNip ||
                  (formData.password && formData.password.length > 0 && (
                    formData.password.length < 6 ||
                    !/[A-Z]/.test(formData.password) ||
                    !/[a-z]/.test(formData.password) ||
                    !/[0-9]/.test(formData.password)
                  ))
                )
              }
              onClick={() => setOpenConfirmUpdate(true)}
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

      {/* Alert Pop-up: Tambah Anggota */}
      <AlertDialog open={openConfirmCreate} onOpenChange={setOpenConfirmCreate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              Anda Yakin ingin menambahkan data ini?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Data personel <strong>{formData.nama}</strong> (NRP/NIP: {formData.nrpNip}) akan ditambahkan sebagai anggota koperasi dan akun login user akan dibuat secara realtime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batalkan</AlertDialogCancel>
            <AlertDialogAction
              disabled={createMutation.isPending}
              onClick={() => {
                createMutation.mutate(formData);
                setOpenConfirmCreate(false);
              }}
            >
              {createMutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Iya, Tambahkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Pop-up: Edit Anggota */}
      <AlertDialog open={openConfirmUpdate} onOpenChange={setOpenConfirmUpdate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              Anda Yakin ingin mengedit data ini?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Perubahan data personel <strong>{formData.nama}</strong> dan hak akses akun login akan disinkronkan ke seluruh sistem secara realtime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batalkan</AlertDialogCancel>
            <AlertDialogAction
              disabled={updateMutation.isPending}
              onClick={() => {
                if (edit) {
                  updateMutation.mutate({ id: edit.id, dto: formData });
                }
                setOpenConfirmUpdate(false);
              }}
            >
              {updateMutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Iya, Simpan Perubahan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Pop-up: Hapus / Nonaktifkan Anggota */}
      <AlertDialog open={openConfirmDelete} onOpenChange={setOpenConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              {selectedAnggotaAction?.isAktif
                ? "Anda Yakin ingin menghapus data ini?"
                : "Anda Yakin ingin mengaktifkan data ini?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAnggotaAction?.isAktif
                ? `Menonaktifkan keanggotaan dan mencabut akses login untuk personel ${selectedAnggotaAction?.nama} (NRP: ${selectedAnggotaAction?.nrpNip}).`
                : `Mengaktifkan kembali keanggotaan dan hak akses login untuk personel ${selectedAnggotaAction?.nama} (NRP: ${selectedAnggotaAction?.nrpNip}).`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batalkan</AlertDialogCancel>
            <AlertDialogAction
              className={selectedAnggotaAction?.isAktif ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              disabled={toggleAktifMutation.isPending}
              onClick={() => {
                if (selectedAnggotaAction) {
                  toggleAktifMutation.mutate({
                    id: selectedAnggotaAction.id,
                    isAktif: !selectedAnggotaAction.isAktif,
                  });
                }
                setOpenConfirmDelete(false);
              }}
            >
              {toggleAktifMutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              {selectedAnggotaAction?.isAktif ? "Iya, Nonaktifkan" : "Iya, Aktifkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Pop-up: Hapus Permanen Anggota */}
      <ConfirmActionDialog
        open={openConfirmHapus}
        onOpenChange={(o) => {
          setOpenConfirmHapus(o);
          if (!o) setSelectedHapusAnggota(null);
        }}
        title="Hapus Permanen Data Anggota?"
        description={
          <>
            Data personel <strong>{selectedHapusAnggota?.nama}</strong> (NRP: {selectedHapusAnggota?.nrpNip}) akan dihapus secara permanen dari database beserta akun login terkait.
            <br />
            <span className="text-destructive font-semibold">Aksi ini tidak dapat dibatalkan!</span>
          </>
        }
        confirmText="Ya, Hapus Permanen"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        details={[
          { label: "Nama", value: selectedHapusAnggota?.nama || "-" },
          { label: "NRP / NIP", value: selectedHapusAnggota?.nrpNip || "-" },
          { label: "Status", value: selectedHapusAnggota?.isAktif ? "Aktif" : "Non-Aktif" },
        ]}
        onConfirm={() => {
          if (selectedHapusAnggota) {
            deleteMutation.mutate(selectedHapusAnggota.id);
          }
          setOpenConfirmHapus(false);
          setSelectedHapusAnggota(null);
        }}
      />

      {/* Alert Pop-up: Simpanan Sukarela Massal */}
      <ConfirmActionDialog
        open={openConfirmMassal}
        onOpenChange={setOpenConfirmMassal}
        title="Generate Simpanan Sukarela Massal?"
        description="Potongan simpanan sukarela bulanan akan dijalankan untuk seluruh anggota aktif berdasarkan kategori pangkat (Pamen, Pama, Ba/Ta/ASN). Pastikan periode yang dipilih sudah benar."
        confirmText="Ya, Jalankan Potongan"
        variant="warning"
        isLoading={massalMutation.isPending}
        onConfirm={() => {
          massalMutation.mutate();
          setOpenConfirmMassal(false);
        }}
      />
    </div>
  );
}
