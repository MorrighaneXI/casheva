import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  KeyRound,
  Pencil,
  Plus,
  Search,
  Loader2,
  UserCheck,
  UserX,
  Trash2,
  ShieldAlert,
  Shield,
  Activity,
  LogOut,
  Radio,
  CheckCircle2,
  RefreshCw,
  Users,
  Award,
  ChevronRight,
  Filter,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  ROLES,
  backendRoleToFrontend,
  frontendRoleToBackend,
  formatPangkatKorps,
  cleanNamaPersonel,
  sortPersonelByPangkat,
  type Role,
} from "@/lib/casheva-data";
import { apiUsers, apiMaster, apiAnggota, type UserItem } from "@/lib/api";

export function UserManagementWidget() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [openNew, setOpenNew] = useState(false);

  // Modal dialog states
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [roleChangeUser, setRoleChangeUser] = useState<UserItem | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<Role>("Anggota");
  const [resetPassUser, setResetPassUser] = useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = useState("Admin123!");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [toggleStatusUser, setToggleStatusUser] = useState<UserItem | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserItem | null>(null);
  const [openConfirmDeleteUser, setOpenConfirmDeleteUser] = useState(false);

  // New User Form State
  const [newNamaLengkap, setNewNamaLengkap] = useState("");
  const [newPangkatId, setNewPangkatId] = useState("");
  const [newKorpsId, setNewKorpsId] = useState("");
  const [newNrpNip, setNewNrpNip] = useState("");
  const [newRole, setNewRole] = useState("ANGGOTA");
  const [newPasswordInput, setNewPasswordInput] = useState("Admin123!");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newSatminkalId, setNewSatminkalId] = useState("");

  // Edit User Form State
  const [editNama, setEditNama] = useState("");
  const [editNrp, setEditNrp] = useState("");
  const [editPangkatId, setEditPangkatId] = useState("");
  const [editKorpsId, setEditKorpsId] = useState("");

  // CRUD Alert Confirmation States
  const [openConfirmCreate, setOpenConfirmCreate] = useState(false);
  const [openConfirmUpdateUser, setOpenConfirmUpdateUser] = useState(false);
  const [openConfirmUpdateRole, setOpenConfirmUpdateRole] = useState(false);

  // Queries (Auto-refetch every 5 seconds for live status)
  const { data: userList = [], isLoading, isFetching } = useQuery({
    queryKey: ["users-list"],
    queryFn: () => apiUsers.findAll(),
    refetchInterval: 5000,
  });

  const { data: satminkalList = [] } = useQuery({
    queryKey: ["master-satminkal"],
    queryFn: () => apiMaster.getSatminkal(),
  });

  const { data: pangkatList = [] } = useQuery({
    queryKey: ["master-pangkat"],
    queryFn: () => apiMaster.getPangkat(),
  });

  const { data: korpsList = [] } = useQuery({
    queryKey: ["master-korps"],
    queryFn: () => apiMaster.getKorps(),
  });

  // MUTATIONS with Alert Pop-ups
  const createUserMutation = useMutation({
    mutationFn: () =>
      apiUsers.create({
        username: newNrpNip.trim(),
        nrpNip: newNrpNip.trim(),
        namaLengkap: newNamaLengkap.trim(),
        pangkatId: newPangkatId || undefined,
        korpsId: newKorpsId && newKorpsId !== "NONE" ? newKorpsId : undefined,
        password: newPasswordInput,
        role: newRole as any,
        satminkalId:
          satminkalList.find((s) => s.nama.toUpperCase().includes("INFOLAHTA"))?.id ||
          satminkalList[0]?.id ||
          "",
      }),
    onSuccess: (res) => {
      toast.success("User & Anggota Berhasil Dibuat!", {
        description: `Akun @${res.username} (${res.namaLengkap}) dengan role '${backendRoleToFrontend(
          res.role
        )}' aktif di sistem.`,
      });
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      queryClient.invalidateQueries({ queryKey: ["anggota-list"] });
      setOpenNew(false);
      setNewNamaLengkap("");
      setNewPangkatId("");
      setNewKorpsId("");
      setNewNrpNip("");
      setNewPasswordInput("Admin123!");
    },
    onError: (err: any) =>
      toast.error("Gagal Membuat User", {
        description: err.message || "Terjadi kesalahan pada server saat membuat akun.",
      }),
  });

  const updateRoleMutation = useMutation({
    mutationFn: () => {
      if (!roleChangeUser) throw new Error("User tidak ditemukan");
      const backendRole = frontendRoleToBackend(selectedNewRole);
      return apiUsers.updateRole(roleChangeUser.id, backendRole as any);
    },
    onSuccess: (res) => {
      toast.success("Role Akses Berhasil Diubah!", {
        description: `Hak akses @${res.username} (${res.namaLengkap}) kini menjadi '${backendRoleToFrontend(
          res.role
        )}'.`,
      });
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      setRoleChangeUser(null);
    },
    onError: (err: any) =>
      toast.error("Gagal Mengubah Role", {
        description: err.message || "Gagal memperbarui role akun.",
      }),
  });

  const updateUserMutation = useMutation({
    mutationFn: () => {
      if (!editUser) throw new Error("User tidak valid");
      return apiUsers.update(editUser.id, {
        namaLengkap: editNama.trim(),
        username: editNrp.trim(),
        pangkatId: editPangkatId || undefined,
        korpsId: editKorpsId && editKorpsId !== "NONE" ? editKorpsId : undefined,
      });
    },
    onSuccess: (res) => {
      toast.success("Data Personel Berhasil Diperbarui", {
        description: `Profil @${res.username} (${res.namaLengkap}) berhasil disinkronkan ke database.`,
      });
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      queryClient.invalidateQueries({ queryKey: ["anggota-list"] });
      setEditUser(null);
    },
    onError: (err: any) =>
      toast.error("Gagal Memperbarui Personel", { description: err.message }),
  });

  const toggleAktifMutation = useMutation({
    mutationFn: (user: UserItem) => apiUsers.update(user.id, { isActive: !user.isActive }),
    onSuccess: (res: any) => {
      const isNowActive = res?.isActive ?? res?.isAktif;
      toast.success(
        isNowActive ? "Akun Berhasil Diaktifkan" : "Akun Berhasil Dinonaktifkan",
        {
          description: `Status akun @${res?.username || ""} sekarang: ${
            isNowActive ? "AKTIF" : "NONAKTIF"
          }`,
        }
      );
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      setToggleStatusUser(null);
    },
    onError: (err: any) =>
      toast.error("Gagal Mengubah Status Akun", { description: err.message }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () =>
      apiUsers.update(resetPassUser!.id, { password: newPassword }),
    onSuccess: (res: any) => {
      toast.success("Password Berhasil Direset!", {
        description: `Kredensial login @${resetPassUser?.username} telah diperbarui dengan kata sandi baru.`,
      });
      setResetPassUser(null);
      setNewPassword("Admin123!");
    },
    onError: (err: any) =>
      toast.error("Gagal Reset Password", { description: err.message }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => apiUsers.remove(id),
    onSuccess: (res: any) => {
      toast.success("User & Personel Berhasil Dihapus", {
        description: `Data personel dan akun login @${deleteUser?.username || ""} (${deleteUser?.namaLengkap || ""}) berhasil dihapus dari sistem.`,
      });
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      queryClient.invalidateQueries({ queryKey: ["anggota-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setDeleteUser(null);
      setOpenConfirmDeleteUser(false);
    },
    onError: (err: any) => {
      toast.error("Gagal Menghapus User", {
        description: err.message || "Terjadi kesalahan saat menghapus pengguna dari database.",
      });
    },
  });

  // Filtered rows
  const rows = useMemo(() => {
    const filtered = userList.filter((u) => {
      const uiRole = backendRoleToFrontend(u.role);
      const matchRole = roleFilter === "Semua" || uiRole === roleFilter;

      let matchStatus = true;
      if (statusFilter === "Aktif") matchStatus = Boolean(u.isActive ?? u.isAktif);
      else if (statusFilter === "Nonaktif") matchStatus = !Boolean(u.isActive ?? u.isAktif);
      else if (statusFilter === "Online") matchStatus = (u as any).isOnline === true;

      const qLower = q.toLowerCase().trim();
      const matchSearch =
        !qLower ||
        (u.username || "").toLowerCase().includes(qLower) ||
        (u.namaLengkap || "").toLowerCase().includes(qLower) ||
        uiRole.toLowerCase().includes(qLower);

      return matchRole && matchStatus && matchSearch;
    });

    return sortPersonelByPangkat(filtered, (u: any) => ({
      nama: u.namaLengkap,
      pangkat: u.anggota?.pangkat || u.pangkat,
      kategori: u.anggota?.pangkat?.kategori || u.pangkat?.kategori,
    }));
  }, [userList, roleFilter, statusFilter, q]);

  // Statistics
  const stats = useMemo(() => {
    const total = userList.length;
    const online = userList.filter((u: any) => u.isOnline).length;
    const aktif = userList.filter((u) => u.isActive || u.isAktif).length;
    const nonaktif = total - aktif;
    return { total, online, aktif, nonaktif };
  }, [userList]);

  return (
    <div className="space-y-6">
      {/* Realtime KPI Overview */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card border-primary/20 bg-card">
          <CardHeader className="pb-1">
            <CardDescription className="flex items-center justify-between text-xs">
              <span>Total Personel &amp; User</span>
              <Users className="size-4 text-primary" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-foreground">{stats.total}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Tersinkronisasi 100% User &amp; Anggota</p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-emerald-500/30 bg-card">
          <CardHeader className="pb-1">
            <CardDescription className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                Status Realtime Online
              </span>
              <Activity className="size-4 text-emerald-500" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {stats.online} Pengguna
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Aktif dalam 5 menit terakhir</p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-blue-500/20 bg-card">
          <CardHeader className="pb-1">
            <CardDescription className="flex items-center justify-between text-xs">
              <span>Akun Aktif</span>
              <UserCheck className="size-4 text-blue-500" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
              {stats.aktif}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Diizinkan login sistem</p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-destructive/20 bg-card">
          <CardHeader className="pb-1">
            <CardDescription className="flex items-center justify-between text-xs">
              <span>Akun Non-Aktif</span>
              <UserX className="size-4 text-destructive" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-destructive">{stats.nonaktif}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Dinonaktifkan / Mutasi</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold">
                Manajemen Personel &amp; Hak Akses (User &amp; Anggota)
              </CardTitle>
              {isFetching && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                  <RefreshCw className="size-3 animate-spin text-primary" /> Live
                </span>
              )}
            </div>
            <CardDescription className="text-xs mt-0.5">
              Kelola data personel, hak akses berjenjang (Role Dinamis), dan status aktivitas realtime.
            </CardDescription>
          </div>
          <Button onClick={() => setOpenNew(true)} className="shadow-sm">
            <Plus className="mr-1.5 size-4" /> Tambah Personel / User Baru
          </Button>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* Search and Filters */}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari nama, NRP, role..."
                className="pl-9 h-9 text-xs"
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

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-9 text-xs">
                <Shield className="size-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Filter Role" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="Semua">Semua Role</SelectItem>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 text-xs">
                <Filter className="size-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Status Akun" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="Semua">Semua Status</SelectItem>
                <SelectItem value="Aktif">Status Aktif</SelectItem>
                <SelectItem value="Online">Sedang Online</SelectItem>
                <SelectItem value="Nonaktif">Non-Aktif</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center justify-end text-xs text-muted-foreground">
              <span>Menampilkan <strong>{rows.length}</strong> dari {userList.length} personel</span>
            </div>
          </div>

          {/* Table Data */}
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-10">No.</TableHead>
                  <TableHead>Nama Personel / Anggota</TableHead>
                  <TableHead>NRP / Username</TableHead>
                  <TableHead>Role Hak Akses</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Aktivitas Realtime</TableHead>
                  <TableHead>Status Akun</TableHead>
                  <TableHead className="text-right">Aksi Admin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                      <Loader2 className="mx-auto size-6 animate-spin mb-2 text-primary" />
                      Memuat data personel &amp; hak akses...
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                      Tidak ada personel yang sesuai dengan pencarian.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((u: any, idx) => {
                    const uiRole = backendRoleToFrontend(u.role);
                    const isOnline = u.isOnline;
                    const isIdle = u.isIdle;
                    const isAccountActive = u.isActive || u.isAktif;

                    return (
                      <TableRow key={u.id} className="hover:bg-muted/50 transition-colors text-xs">
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="font-semibold text-foreground">
                            {cleanNamaPersonel(u.namaLengkap)}
                          </div>
                          {u.anggota?.pangkat && (
                            <div className="text-[11px] text-muted-foreground font-medium">
                              {formatPangkatKorps(
                                u.anggota.pangkat.nama,
                                u.anggota.korps?.nama,
                                u.anggota.pangkat.kategori
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono font-semibold text-primary">
                          @{u.username}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRoleChangeUser(u);
                              setSelectedNewRole(uiRole);
                            }}
                            className="h-7 text-[11px] gap-1 px-2 border-primary/30 bg-primary-soft/50 text-primary hover:bg-primary/20 font-semibold"
                            title="Klik untuk mengubah role pengguna ini"
                          >
                            <Shield className="size-3" />
                            {uiRole}
                            <ChevronRight className="size-3 opacity-60 ml-0.5" />
                          </Button>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-[11px]">
                          {u.satminkal?.nama || "INFOLAHTADAM IV/DIPONEGORO"}
                        </TableCell>
                        <TableCell>
                          {isOnline ? (
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] gap-1 px-2 py-0.5 font-semibold"
                            >
                              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Online (Aktif)
                            </Badge>
                          ) : isIdle ? (
                            <Badge
                              variant="outline"
                              className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px] gap-1 px-2 py-0.5 font-medium"
                            >
                              <span className="size-1.5 rounded-full bg-amber-500" />
                              Idle (&lt; 30 mnt)
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-muted text-muted-foreground border-border text-[10px] px-2 py-0.5"
                            >
                              Offline
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              isAccountActive
                                ? "bg-success/15 text-success border-success/30 text-[10px]"
                                : "bg-destructive/15 text-destructive border-destructive/30 text-[10px]"
                            }
                          >
                            {isAccountActive ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            title="Edit Data Personel"
                            onClick={() => {
                              setEditUser(u);
                              setEditNama(u.namaLengkap);
                              setEditNrp(u.username);
                              setEditPangkatId(u.anggota?.pangkat?.id || "");
                              setEditKorpsId(u.anggota?.korps?.id || "");
                            }}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            title="Reset Password"
                            onClick={() => {
                              setResetPassUser(u);
                              setNewPassword("Admin123!");
                            }}
                          >
                            <KeyRound className="size-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            title={isAccountActive ? "Nonaktifkan Akun" : "Aktifkan Akun"}
                            onClick={() => setToggleStatusUser(u)}
                          >
                            {isAccountActive ? (
                              <UserX className="size-3.5 text-destructive" />
                            ) : (
                              <UserCheck className="size-3.5 text-success" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Hapus Permanen User"
                            disabled={deleteUserMutation.isPending}
                            onClick={() => {
                              setDeleteUser(u);
                              setOpenConfirmDeleteUser(true);
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL 1: UBAH ROLE DINAMIS OLEH ADMIN */}
      <Dialog open={!!roleChangeUser} onOpenChange={(o) => !o && setRoleChangeUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              Ubah Role Hak Akses Dinamis
            </DialogTitle>
            <DialogDescription>
              Atur hak akses dan fungsi dinas pengguna dalam sistem Koperasi TNI AD Casheva
            </DialogDescription>
          </DialogHeader>
          {roleChangeUser && (
            <div className="space-y-4 py-2 text-xs">
              <div className="rounded-xl border p-3 bg-muted/40 space-y-1">
                <p className="font-bold text-foreground text-sm">{roleChangeUser.namaLengkap}</p>
                <p className="text-muted-foreground font-mono">NRP / User: @{roleChangeUser.username}</p>
                <p className="text-muted-foreground">
                  Role Saat Ini:{" "}
                  <Badge variant="outline" className="font-semibold text-primary ml-1">
                    {backendRoleToFrontend(roleChangeUser.role)}
                  </Badge>
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Pilih Role Baru untuk Personel Ini:</Label>
                <Select
                  value={selectedNewRole}
                  onValueChange={(val) => setSelectedNewRole(val as Role)}
                >
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs max-h-56">
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="text-xs">
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Perubahan role akan langsung aktif saat pengguna melakukan navigasi atau login berikutnya.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              disabled={updateRoleMutation.isPending}
              onClick={() => setOpenConfirmUpdateRole(true)}
              className="font-semibold shadow-sm"
            >
              {updateRoleMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Simpan Role Baru
            </Button>
            <Button variant="outline" onClick={() => setRoleChangeUser(null)}>
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: EDIT DATA PERSONEL */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="size-4 text-primary" /> Edit Data Personel
            </DialogTitle>
            <DialogDescription>
              Perbarui identitas personel yang tersinkronisasi pada akun User &amp; Anggota
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label>Nama Lengkap</Label>
              <Input
                value={editNama}
                onChange={(e) => setEditNama(e.target.value)}
                placeholder="misal: Sigit Widiyanto, S.T., M.Tr.(Han)"
              />
              <p className="text-[10px] text-muted-foreground">Boleh mencantumkan gelar</p>
            </div>
            <div className="space-y-1">
              <Label>NRP / NIP</Label>
              <Input
                value={editNrp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 18);
                  setEditNrp(val);
                }}
                className="font-mono"
                inputMode="numeric"
                maxLength={18}
              />
              <p className="text-[10px] text-muted-foreground">Hanya angka, maksimal 18 digit</p>
            </div>
            <div className="space-y-1">
              <Label>Pangkat TNI AD</Label>
              <Select value={editPangkatId} onValueChange={setEditPangkatId}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Pilih Pangkat --" />
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
            <div className="space-y-1">
              <Label>Korps</Label>
              <Select value={editKorpsId} onValueChange={setEditKorpsId}>
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
          </div>
          <DialogFooter>
            <Button
              disabled={updateUserMutation.isPending}
              onClick={() => setOpenConfirmUpdateUser(true)}
            >
              {updateUserMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Simpan Perubahan
            </Button>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: RESET PASSWORD */}
      <Dialog open={!!resetPassUser} onOpenChange={(o) => !o && setResetPassUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="size-5 text-primary" />
              Reset Password @{resetPassUser?.username}
            </DialogTitle>
            <DialogDescription>
              Masukkan kata sandi baru untuk personel <strong>{resetPassUser?.namaLengkap}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <Label>Kata Sandi Baru</Label>
            <div className="relative">
              <Input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Admin123!"
                type={showResetPassword ? "text" : "password"}
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShowResetPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                title={showResetPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
              >
                {showResetPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>

            {(() => {
              const pw = newPassword;
              const hasUpper = /[A-Z]/.test(pw);
              const hasLower = /[a-z]/.test(pw);
              const hasDigit = /[0-9]/.test(pw);
              const hasMinLen = pw.length >= 6;
              const allValid = hasUpper && hasLower && hasDigit && hasMinLen;
              return (
                <div className="space-y-1 rounded-lg border bg-muted/30 p-2.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span>Syarat Keamanan Password:</span>
                    <span className={allValid ? "text-success font-bold" : "text-amber-500 font-bold"}>
                      {allValid ? "Kuat & Valid" : "Belum Memenuhi"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 mt-1 text-[10px]">
                    <span className={hasMinLen ? "text-success font-medium" : "text-muted-foreground"}>
                      {hasMinLen ? "✓" : "○"} Min. 6 Karakter
                    </span>
                    <span className={hasUpper ? "text-success font-medium" : "text-muted-foreground"}>
                      {hasUpper ? "✓" : "○"} Huruf Besar (A-Z)
                    </span>
                    <span className={hasLower ? "text-success font-medium" : "text-muted-foreground"}>
                      {hasLower ? "✓" : "○"} Huruf Kecil (a-z)
                    </span>
                    <span className={hasDigit ? "text-success font-medium" : "text-muted-foreground"}>
                      {hasDigit ? "✓" : "○"} Angka (0-9)
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/80 mt-1 border-t pt-1">
                    * Sistem menolak password yang pernah digunakan sebelumnya (Riwayat Password).
                  </p>
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button
              disabled={
                resetPasswordMutation.isPending ||
                !/[A-Z]/.test(newPassword) ||
                !/[a-z]/.test(newPassword) ||
                !/[0-9]/.test(newPassword) ||
                newPassword.length < 6
              }
              onClick={() => resetPasswordMutation.mutate()}
            >
              {resetPasswordMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Simpan Password Baru
            </Button>
            <Button variant="outline" onClick={() => setResetPassUser(null)}>
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ALERT DIALOG: KONFIRMASI AKTIF / NONAKTIF */}
      <AlertDialog
        open={!!toggleStatusUser}
        onOpenChange={(o) => !o && setToggleStatusUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-destructive" />
              {toggleStatusUser?.isActive || (toggleStatusUser as any)?.isAktif
                ? "Anda Yakin ingin menghapus data ini?"
                : "Anda Yakin ingin mengaktifkan data ini?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleStatusUser?.isActive || (toggleStatusUser as any)?.isAktif
                ? `Menonaktifkan status aktif dan akses login untuk akun @${toggleStatusUser?.username} (${toggleStatusUser?.namaLengkap}).`
                : `Mengaktifkan kembali status akun dan akses login untuk @${toggleStatusUser?.username} (${toggleStatusUser?.namaLengkap}).`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batalkan</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toggleStatusUser) toggleAktifMutation.mutate(toggleStatusUser);
              }}
              className={
                toggleStatusUser?.isActive || (toggleStatusUser as any)?.isAktif
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-success text-success-foreground hover:bg-success/90"
              }
            >
              {toggleStatusUser?.isActive || (toggleStatusUser as any)?.isAktif
                ? "Iya, Nonaktifkan"
                : "Iya, Aktifkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* SHEET: TAMBAH USER / PERSONEL BARU */}
      <Sheet open={openNew} onOpenChange={setOpenNew}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Plus className="size-5 text-primary" /> Tambah Personel &amp; Akun Login
            </SheetTitle>
            <SheetDescription>
              Buat akun terintegrasi yang otomatis menyinkronkan data Anggota dan User login
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4 py-4 text-xs">
            <div className="space-y-1.5">
              <Label>Nama Lengkap <span className="text-destructive">*</span></Label>
              <Input
                value={newNamaLengkap}
                onChange={(e) => setNewNamaLengkap(e.target.value)}
                placeholder="misal: Sigit Widiyanto, S.T., M.Tr.(Han)"
              />
              <p className="text-[10px] text-muted-foreground">Boleh mencantumkan gelar akademik / kehormatan</p>
            </div>
            <div className="space-y-1.5">
              <Label>Pangkat TNI AD <span className="text-destructive">*</span></Label>
              <Select value={newPangkatId} onValueChange={setNewPangkatId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Pangkat" />
                </SelectTrigger>
                <SelectContent className="max-h-56 text-xs">
                  {pangkatList.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nama} ({p.kategori})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Korps TNI AD (Opsional / Perwira)</Label>
              <Select value={newKorpsId} onValueChange={setNewKorpsId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Korps" />
                </SelectTrigger>
                <SelectContent className="max-h-56 text-xs">
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
              <Label>NRP / NIP (Kunci Login Utama) <span className="text-destructive">*</span></Label>
              <Input
                value={newNrpNip}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 18);
                  setNewNrpNip(val);
                }}
                placeholder="misal: 11020019460278"
                className="font-mono"
                inputMode="numeric"
                maxLength={18}
              />
              <p className="text-[10px] text-muted-foreground">Hanya angka, maksimal 18 digit</p>
              {newNrpNip && newNrpNip.length < 1 && (
                <p className="text-[10px] text-destructive">NRP/NIP wajib diisi</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Role Hak Akses Sistem <span className="text-destructive">*</span></Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs max-h-56">
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
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="misal: Admin1a"
                  type={showNewPassword ? "text" : "password"}
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  title={showNewPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                >
                  {showNewPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {(() => {
                const pw = newPasswordInput;
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
              <div className="rounded-md border bg-muted/40 px-3 py-2.5 text-xs font-semibold text-foreground">
                INFOLAHTADAM IV/DIP
              </div>
              <p className="text-[10px] text-muted-foreground">Satuan tetap — seluruh personel terdaftar di INFOLAHTADAM IV/DIP</p>
            </div>

            <Button
              className="w-full mt-4"
              disabled={
                !newNamaLengkap.trim() ||
                !newNrpNip ||
                newNrpNip.length < 1 ||
                !/[A-Z]/.test(newPasswordInput) ||
                !/[a-z]/.test(newPasswordInput) ||
                !/[0-9]/.test(newPasswordInput) ||
                newPasswordInput.length < 6 ||
                createUserMutation.isPending
              }
              onClick={() => setOpenConfirmCreate(true)}
            >
              {createUserMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Simpan Personel &amp; Buat Akun
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Alert Pop-up: Tambah User / Personel */}
      <AlertDialog open={openConfirmCreate} onOpenChange={setOpenConfirmCreate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              Anda Yakin ingin menambahkan data ini?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Akun login dan data anggota personel <strong>{newNamaLengkap}</strong> (NRP: {newNrpNip}) akan dibuat dan disinkronkan secara realtime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batalkan</AlertDialogCancel>
            <AlertDialogAction
              disabled={createUserMutation.isPending}
              onClick={() => {
                createUserMutation.mutate();
                setOpenConfirmCreate(false);
              }}
            >
              {createUserMutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Iya, Tambahkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Pop-up: Edit Data Personel */}
      <AlertDialog open={openConfirmUpdateUser} onOpenChange={setOpenConfirmUpdateUser}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              Anda Yakin ingin mengedit data ini?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Perubahan identitas personel <strong>{editNama}</strong> (NRP: {editNrp}) akan diperbarui di akun User dan Anggota.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batalkan</AlertDialogCancel>
            <AlertDialogAction
              disabled={updateUserMutation.isPending}
              onClick={() => {
                updateUserMutation.mutate();
                setOpenConfirmUpdateUser(false);
              }}
            >
              {updateUserMutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Iya, Simpan Perubahan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Pop-up: Edit Role User */}
      <AlertDialog open={openConfirmUpdateRole} onOpenChange={setOpenConfirmUpdateRole}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              Anda Yakin ingin mengedit data ini?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Hak akses role untuk pengguna @{roleChangeUser?.username} ({roleChangeUser?.namaLengkap}) akan dialihkan ke <strong>{selectedNewRole}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batalkan</AlertDialogCancel>
            <AlertDialogAction
              disabled={updateRoleMutation.isPending}
              onClick={() => {
                updateRoleMutation.mutate();
                setOpenConfirmUpdateRole(false);
              }}
            >
              {updateRoleMutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Iya, Simpan Perubahan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Pop-up: Hapus Permanen User & Personel */}
      <ConfirmActionDialog
        open={openConfirmDeleteUser}
        onOpenChange={(o) => {
          setOpenConfirmDeleteUser(o);
          if (!o) setDeleteUser(null);
        }}
        title="Hapus Permanen User & Personel?"
        description={
          <>
            Akun login pengguna <strong>@{deleteUser?.username}</strong> ({deleteUser?.namaLengkap}) dan data personel terkait akan dihapus secara permanen dari sistem database.
            <br />
            <span className="text-destructive font-semibold">Tindakan ini tidak dapat dibatalkan!</span>
          </>
        }
        confirmText="Ya, Hapus Permanen"
        variant="destructive"
        isLoading={deleteUserMutation.isPending}
        details={[
          { label: "NRP / Username", value: `@${deleteUser?.username || "-"}` },
          { label: "Nama Personel", value: deleteUser?.namaLengkap || "-" },
          { label: "Role Sistem", value: deleteUser ? backendRoleToFrontend(deleteUser.role) : "-" },
          { label: "Status Akun", value: deleteUser?.isActive || (deleteUser as any)?.isAktif ? "Aktif" : "Non-Aktif" },
        ]}
        onConfirm={() => {
          if (deleteUser) {
            deleteUserMutation.mutate(deleteUser.id);
          }
        }}
      />
    </div>
  );
}

export function ActiveSessionsWidget() {
  const queryClient = useQueryClient();
  const [terminatingId, setTerminatingId] = useState<string | null>(null);

  const { data: activeSessions = [], isLoading, isFetching } = useQuery({
    queryKey: ["active-sessions"],
    queryFn: async () => {
      const res = await apiUsers.getActiveSessions();
      return res;
    },
    refetchInterval: 5000,
  });

  const terminateMutation = useMutation({
    mutationFn: (userId: string) => apiUsers.terminateSession(userId),
    onSuccess: () => {
      toast.success("Sesi Akun Berhasil Diakhiri", {
        description: "Pengguna telah dipaksa logout dari perangkat yang terhubung.",
      });
      queryClient.invalidateQueries({ queryKey: ["active-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      setTerminatingId(null);
    },
    onError: (err: any) => {
      toast.error("Gagal Mengakhiri Sesi", { description: err.message });
      setTerminatingId(null);
    },
  });

  return (
    <Card className="shadow-card mt-6">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Monitoring Sesi Aktif Perangkat (Single Device Enforcement)
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Pantau pengguna yang sedang terautentikasi di sistem secara realtime. Sistem menerapkan 1 perangkat aktif per akun.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {activeSessions.length} Sesi Terbuka
            </Badge>
            {isFetching && (
              <RefreshCw className="size-3.5 animate-spin text-primary" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : activeSessions.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">
            Tidak ada sesi aktif perangkat saat ini.
          </p>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Pengguna / Personel</TableHead>
                  <TableHead>Role Hak Akses</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Status Sesi Perangkat</TableHead>
                  <TableHead className="text-right">Tindakan Admin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeSessions.map((s: any) => (
                  <TableRow key={s.id} className="text-xs">
                    <TableCell>
                      <p className="font-semibold text-foreground">{s.namaLengkap}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">@{s.username}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {backendRoleToFrontend(s.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-[11px]">
                      {s.satminkal || "-"}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        Sesi Terautentikasi (Live)
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={terminateMutation.isPending && terminatingId === s.id}
                        onClick={() => {
                          setTerminatingId(s.id);
                          terminateMutation.mutate(s.id);
                        }}
                      >
                        {terminateMutation.isPending && terminatingId === s.id && (
                          <Loader2 className="mr-1.5 size-3 animate-spin" />
                        )}
                        <LogOut className="mr-1 size-3" /> Force Logout
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
