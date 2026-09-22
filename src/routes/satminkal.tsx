import React, { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Plus,
  Edit,
  Eye,
  Search,
  CheckCircle2,
  AlertCircle,
  Users,
  Shield,
  KeyRound,
  FileText,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSession } from "@/components/session-context";
import { apiKotama, type CreateKotamaSatminkalDto, type KotamaSatminkalStat } from "@/lib/api";
import { formatRp } from "@/lib/casheva-data";

export const Route = createFileRoute("/satminkal")({
  head: () => ({
    meta: [
      { title: "Kelola Satminkal — SISKOPAD Sistem Koperasi TNI AD" },
      {
        name: "description",
        content: "Manajemen data Satminkal dan koperasi primer binaan Kotama.",
      },
    ],
  }),
  component: SatminkalPage,
});

function SatminkalPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isKotamaAdmin, kotama, kotamaId, startMonitoring, isGuestMode } = useSession();
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSatminkal, setSelectedSatminkal] = useState<KotamaSatminkalStat | null>(null);

  // Form states for create
  const [formData, setFormData] = useState({
    kode: "",
    nama: "",
    adminUsername: "",
    adminPassword: "",
    adminNamaLengkap: "",
    adminNrpNip: "",
  });

  // Form states for edit
  const [editFormData, setEditFormData] = useState({
    kode: "",
    nama: "",
  });

  const {
    data: satminkalList = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["kotama-satminkal-list", kotamaId],
    queryFn: () => apiKotama.getSatminkalList(kotamaId),
  });

  // Create Satminkal Mutation
  const createMutation = useMutation({
    mutationFn: (dto: CreateKotamaSatminkalDto) => apiKotama.createSatminkal(dto),
    onSuccess: (res) => {
      toast.success("Satminkal Berhasil Ditambahkan", {
        description: `Satminkal ${res.satminkal?.nama || res.satminkal?.kode || "baru"} dan akun Admin Koperasi berhasil dibuat.`,
      });
      setCreateDialogOpen(false);
      setFormData({
        kode: "",
        nama: "",
        adminUsername: "",
        adminPassword: "",
        adminNamaLengkap: "",
        adminNrpNip: "",
      });
      queryClient.invalidateQueries({ queryKey: ["kotama-satminkal-list"] });
      queryClient.invalidateQueries({ queryKey: ["kotama-summary"] });
    },
    onError: (err: any) => {
      toast.error("Gagal Menambahkan Satminkal", {
        description: err.message || "Terjadi kesalahan pada server",
      });
    },
  });

  // Update Satminkal Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => apiKotama.updateSatminkal(id, dto),
    onSuccess: (res) => {
      toast.success("Satminkal Berhasil Diperbarui", {
        description: `Data Satminkal ${res.satminkal?.nama || res.satminkal?.kode || ""} telah diperbarui.`,
      });
      setEditDialogOpen(false);
      setSelectedSatminkal(null);
      queryClient.invalidateQueries({ queryKey: ["kotama-satminkal-list"] });
    },
    onError: (err: any) => {
      toast.error("Gagal Memperbarui Satminkal", {
        description: err.message || "Terjadi kesalahan pada server",
      });
    },
  });

  const handleOpenEdit = (sat: KotamaSatminkalStat) => {
    setSelectedSatminkal(sat);
    setEditFormData({
      kode: sat.kode,
      nama: sat.nama,
    });
    setEditDialogOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kode || !formData.nama) {
      toast.warning("Mohon lengkapi kode dan nama satminkal");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSatminkal) return;
    updateMutation.mutate({
      id: selectedSatminkal.id,
      dto: editFormData,
    });
  };

  const handleStartMonitoring = async (sat: KotamaSatminkalStat) => {
    try {
      await startMonitoring({
        id: sat.id,
        kode: sat.kode,
        nama: sat.nama,
      });
      toast.success(`Mode Monitoring Aktif`, {
        description: `Sedang mengamati Satminkal ${sat.nama} (Mode Tamu / Read-Only)`,
      });
      navigate({ to: "/simpanan" });
    } catch (e: any) {
      toast.error("Gagal memulai monitoring", {
        description: e.message || "Terjadi kesalahan pada server",
      });
    }
  };

  const filtered = satminkalList.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      s.nama.toLowerCase().includes(q) ||
      s.kode.toLowerCase().includes(q) ||
      (s.admin?.namaLengkap && s.admin.namaLengkap.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Koperasi Satminkal Jajaran"
        description={`Daftar Koperasi Primer & Satminkal Terintegrasi di Lingkungan ${kotama}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-xs h-9"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Perbarui
            </Button>
            <Button
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
              disabled={isGuestMode}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-9 shadow-sm disabled:opacity-50"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Satminkal Baru
            </Button>
          </div>
        }
      />

      {/* Filter & Summary Card */}
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-80">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari satminkal, kode, atau admin..."
                className="h-9 pl-9 text-xs rounded-lg"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="font-mono">
              Total {satminkalList.length} Satminkal Terdaftar
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Table of Satminkals */}
      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            Daftar Satminkal &amp; Akses Monitoring
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Akses langsung ke buku pembukuan, mutasi simpan pinjam, dan laporan keuangan masing-masing koperasi primer.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-12 text-center text-xs font-bold">No</TableHead>
                  <TableHead className="text-xs font-bold">Kode &amp; Satminkal</TableHead>
                  <TableHead className="text-xs font-bold">Admin Satminkal</TableHead>
                  <TableHead className="text-right text-xs font-bold">Anggota</TableHead>
                  <TableHead className="text-right text-xs font-bold">Total Simpanan</TableHead>
                  <TableHead className="text-right text-xs font-bold">Pinjaman Aktif</TableHead>
                  <TableHead className="text-center text-xs font-bold">Status</TableHead>
                  <TableHead className="text-center text-xs font-bold">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                      {isLoading ? "Memuat data..." : "Tidak ada satminkal ditemukan."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((sat, idx) => (
                    <TableRow key={sat.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-center text-xs text-muted-foreground font-mono">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="font-bold text-sm text-foreground">{sat.nama}</div>
                          <div className="text-[11px] text-muted-foreground font-mono">
                            Kode: <span className="text-foreground font-semibold">{sat.kode}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5 text-xs">
                          <div className="font-semibold text-foreground">{sat.admin?.namaLengkap || "-"}</div>
                          <div className="text-[11px] text-muted-foreground font-mono">
                            @{sat.admin?.username || `admin_${sat.kode.toLowerCase().replace(/[^a-z0-9]/g, "")}`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold">
                        {sat.totalAnggota ?? 0} Org
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatRp(sat.totalSimpanan ?? 0)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
                        {formatRp(sat.pinjamanBerjalan ?? sat.totalPinjaman ?? 0)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-semibold">
                          AKTIF
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {isGuestMode ? (
                          <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">
                            Read-Only (Tamu)
                          </Badge>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleStartMonitoring(sat)}
                              className="h-7 px-2.5 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold"
                              title="Masuk Mode Monitoring (Read-Only)"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              Monitoring
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenEdit(sat)}
                              className="h-7 px-2 text-xs"
                              title="Edit Satminkal"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog: Tambah Satminkal Baru */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              Tambah Satminkal Baru
            </DialogTitle>
            <DialogDescription className="text-xs">
              Daftarkan satuan/satminkal baru di bawah naungan <strong>{kotama}</strong> beserta akun Admin Koperasi awalnya.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Kode Satminkal *</Label>
                <Input
                  required
                  placeholder="Contoh: KODIM 0733/KS"
                  value={formData.kode}
                  onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Nama Lengkap Satminkal *</Label>
                <Input
                  required
                  placeholder="Contoh: KODIM 0733/KOTA SEMARANG"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="border-t border-border pt-3 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Inisialisasi Akun Admin Koperasi Satminkal</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px]">Username Admin *</Label>
                  <Input
                    placeholder="admin_kodim0733"
                    value={formData.adminUsername}
                    onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Password Awal</Label>
                  <Input
                    type="password"
                    placeholder="Default: Admin123!"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]">Nama Lengkap Admin</Label>
                <Input
                  placeholder="PNS Joko (Admin Koperasi)"
                  value={formData.adminNamaLengkap}
                  onChange={(e) => setFormData({ ...formData, adminNamaLengkap: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]">NRP / NIP Admin</Label>
                <Input
                  placeholder="198501012010121001"
                  value={formData.adminNrpNip}
                  onChange={(e) => setFormData({ ...formData, adminNrpNip: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateDialogOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                {createMutation.isPending ? "Menyimpan..." : "Simpan Satminkal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Edit Satminkal */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Edit Satminkal
            </DialogTitle>
            <DialogDescription className="text-xs">
              Ubah rincian kode atau nama Satminkal {selectedSatminkal?.nama}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Kode Satminkal *</Label>
                <Input
                  required
                  value={editFormData.kode}
                  onChange={(e) => setEditFormData({ ...editFormData, kode: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Nama Satminkal *</Label>
                <Input
                  required
                  value={editFormData.nama}
                  onChange={(e) => setEditFormData({ ...editFormData, nama: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditDialogOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={updateMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold"
              >
                {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
