import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Pencil, Plus, Search, Loader2, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";

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
import { ROLES, backendRoleToFrontend, frontendRoleToBackend } from "@/lib/casheva-data";
import { apiUsers, apiMaster, type UserItem } from "@/lib/api";

export function UserManagementWidget() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("Semua");
  const [openNew, setOpenNew] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [resetPassUser, setResetPassUser] = useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = useState("Admin123!");

  // New User Form State
  const [newNamaLengkap, setNewNamaLengkap] = useState("");
  const [newPangkatId, setNewPangkatId] = useState("");
  const [newKorpsId, setNewKorpsId] = useState("");
  const [newNrpNip, setNewNrpNip] = useState("");
  const [newRole, setNewRole] = useState("ADMIN_KOPERASI");
  const [newPasswordInput, setNewPasswordInput] = useState("Admin123!");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newSatminkalId, setNewSatminkalId] = useState("");

  const { data: userList = [], isLoading } = useQuery({
    queryKey: ["users-list"],
    queryFn: () => apiUsers.findAll(),
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
        email: newEmail || undefined,
        phone: newPhone || undefined,
        satminkalId: newSatminkalId || satminkalList[0]?.id || "",
      }),
    onSuccess: (res) => {
      toast.success(`User @${res.username} (${res.namaLengkap}) Berhasil Dibuat`);
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      queryClient.invalidateQueries({ queryKey: ["anggota-list"] });
      setOpenNew(false);
      setNewNamaLengkap("");
      setNewPangkatId("");
      setNewKorpsId("");
      setNewNrpNip("");
      setNewEmail("");
      setNewPhone("");
    },
    onError: (err: any) => toast.error("Gagal Membuat User", { description: err.message }),
  });

  const toggleAktifMutation = useMutation({
    mutationFn: (id: string) => apiUsers.toggleAktif(id),
    onSuccess: (res: any) => {
      toast.success(`Status user @${res?.username || ""} diperbarui: ${res?.isAktif || res?.isActive ? "Aktif" : "Nonaktif"}`);
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
    },
    onError: (err: any) => toast.error("Gagal", { description: err.message }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () =>
      apiUsers.resetPassword(resetPassUser!.id, { newPassword }),
    onSuccess: (res: any) => {
      toast.success(res?.message || "Password berhasil di-reset");
      setResetPassUser(null);
      setNewPassword("Admin123!");
    },
    onError: (err: any) => toast.error("Gagal Reset Password", { description: err.message }),
  });

  const rows = userList.filter((u) => {
    const uiRole = backendRoleToFrontend(u.role);
    const matchRole = roleFilter === "Semua" || uiRole === roleFilter;
    const matchSearch =
      u.username.toLowerCase().includes(q.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(q.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>Manajemen Akun User &amp; Hak Akses</CardTitle>
          <CardDescription>
            Pengelolaan akun berjenjang berbasis Role (RBAC) &amp; Satminkal TNI AD
          </CardDescription>
        </div>
        <Button onClick={() => setOpenNew(true)}>
          <Plus className="mr-1 size-4" /> Tambah User Baru
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari username / email..."
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Semua">Semua Role</SelectItem>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role Akses</TableHead>
                <TableHead>Satminkal / Kotama</TableHead>
                <TableHead>Kontak (Email / Telp)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-6 animate-spin mb-2" />
                    Memuat data user...
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((u) => {
                  const uiRole = backendRoleToFrontend(u.role);
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-semibold text-primary">
                        @{u.username}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-primary/25 bg-primary-soft text-primary">
                          {uiRole}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {u.satminkal?.nama || "Disinfolahtad"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.email || "-"} {u.phone ? `· ${u.phone}` : ""}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            u.isAktif
                              ? "border-success/30 bg-success/15 text-success"
                              : "border-destructive/30 bg-destructive/10 text-destructive"
                          }
                        >
                          {u.isAktif ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Reset Password"
                          onClick={() => setResetPassUser(u)}
                        >
                          <KeyRound className="size-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title={u.isAktif ? "Nonaktifkan" : "Aktifkan"}
                          onClick={() => toggleAktifMutation.mutate(u.id)}
                        >
                          {u.isAktif ? (
                            <UserX className="size-3.5 text-destructive" />
                          ) : (
                            <UserCheck className="size-3.5 text-success" />
                          )}
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

      {/* Sheet Tambah User Baru */}
      <Sheet open={openNew} onOpenChange={setOpenNew}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Tambah Akun User Baru</SheetTitle>
            <SheetDescription>
              Buat akun dengan hak akses (RBAC) sesuai fungsi dinas
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4 py-4">
            <div className="space-y-2">
              <Label>Nama Lengkap (Tanpa Pangkat/Korps) <span className="text-destructive">*</span></Label>
              <Input
                value={newNamaLengkap}
                onChange={(e) => setNewNamaLengkap(e.target.value)}
                placeholder="misal: Sigit Widiyanto"
              />
              <p className="text-[11px] text-muted-foreground">
                Cukup masukkan nama orangnya saja, pangkat &amp; korps akan digabung otomatis oleh sistem.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Pangkat TNI AD <span className="text-destructive">*</span></Label>
              <Select value={newPangkatId} onValueChange={setNewPangkatId}>
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
              <Label>Korps TNI AD (Opsional / Perwira)</Label>
              <Select value={newKorpsId} onValueChange={setNewKorpsId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Korps (Inf, Kav, Arm, Arh, Czi, Cba, dll.)" />
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
              <p className="text-[11px] text-muted-foreground">
                Pilih korps untuk Perwira (Pama/Pamen) agar pangkat tampil lengkap (contoh: Kapten Inf, Kolonel Czi).
              </p>
            </div>
            <div className="space-y-2">
              <Label>NRP / NIP (Kunci Utama Login) <span className="text-destructive">*</span></Label>
              <Input
                value={newNrpNip}
                onChange={(e) => setNewNrpNip(e.target.value)}
                placeholder="misal: 11020019460278"
              />
              <p className="text-[11px] text-muted-foreground">
                NRP/NIP ini akan digunakan anggota/user sebagai kredensial utama saat login.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Password Awal</Label>
              <Input
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="Admin123!"
              />
            </div>
            <div className="space-y-2">
              <Label>Role Hak Akses</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN_KOPERASI">Admin Koperasi</SelectItem>
                  <SelectItem value="PIMPINAN">Pimpinan / Dan / Ka</SelectItem>
                  <SelectItem value="KEPRIM">Keprim</SelectItem>
                  <SelectItem value="BENDAHARA">Bendahara</SelectItem>
                  <SelectItem value="PENGAWAS">Pengawas Koperasi</SelectItem>
                  <SelectItem value="JURU_BAYAR">Juru Bayar</SelectItem>
                  <SelectItem value="ANGGOTA">Anggota</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Satminkal</Label>
              <Select
                value={newSatminkalId || satminkalList[0]?.id || ""}
                onValueChange={setNewSatminkalId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Satminkal" />
                </SelectTrigger>
                <SelectContent>
                  {satminkalList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nama} ({s.kode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Email (Opsional)</Label>
              <Input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="user@koperasi.tni-ad.mil.id"
              />
            </div>
            <div className="space-y-2">
              <Label>No. Telepon / WA (Opsional)</Label>
              <Input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="08123456789"
              />
            </div>
            <Button
              className="w-full mt-4"
              disabled={!newNamaLengkap || !newNrpNip || createUserMutation.isPending}
              onClick={() => createUserMutation.mutate()}
            >
              {createUserMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Simpan User Baru
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog Reset Password */}
      <Dialog
        open={!!resetPassUser}
        onOpenChange={(o) => !o && setResetPassUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password @{resetPassUser?.username}</DialogTitle>
            <DialogDescription>
              Masukkan password baru untuk akun pengguna ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Password Baru</Label>
            <Input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Admin123!"
            />
          </div>
          <DialogFooter>
            <Button
              disabled={resetPasswordMutation.isPending}
              onClick={() => resetPasswordMutation.mutate()}
            >
              {resetPasswordMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Simpan Password Baru
            </Button>
            <Button variant="outline" onClick={() => setResetPassUser(null)}>
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export function ActiveSessionsWidget() {
  const queryClient = useQueryClient();

  const { data: activeSessions = [], isLoading } = useQuery({
    queryKey: ["active-sessions"],
    queryFn: async () => {
      const res = await apiUsers.list();
      return res.filter((u: any) => u.isActive);
    },
    refetchInterval: 10000,
  });

  const terminateMutation = useMutation({
    mutationFn: (userId: string) => apiUsers.deactivate(userId),
    onSuccess: () => {
      toast.success("Sesi akun berhasil diakhiri");
      queryClient.invalidateQueries({ queryKey: ["active-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal mengakhiri sesi");
    },
  });

  return (
    <Card className="shadow-card mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Monitoring Sesi Aktif Perangkat (Single Device Enforcement)
            </CardTitle>
            <CardDescription>
              Pantau pengguna yang sedang aktif di sistem. Pengguna hanya dapat login di 1 perangkat secara bersamaan.
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono">
            {activeSessions.length} Pengguna Aktif
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : activeSessions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Tidak ada akun aktif saat ini.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pengguna</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status Koperasi</TableHead>
                <TableHead className="text-right">Tindakan Monitoring</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeSessions.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <p className="font-semibold text-sm">{s.namaLengkap}</p>
                    <p className="text-xs text-muted-foreground">@{s.username}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{backendRoleToFrontend(s.role)}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                      <span className="size-2 rounded-full bg-emerald-500" /> Sesi Terverifikasi (Single Device)
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={terminateMutation.isPending}
                      onClick={() => terminateMutation.mutate(s.id)}
                    >
                      Akhiri Sesi (Logout Force)
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
