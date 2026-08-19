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
  const [newUsername, setNewUsername] = useState("");
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

  const createUserMutation = useMutation({
    mutationFn: () =>
      apiUsers.create({
        username: newUsername,
        password: newPasswordInput,
        role: newRole as any,
        email: newEmail || undefined,
        phone: newPhone || undefined,
        satminkalId: newSatminkalId || satminkalList[0]?.id || "",
      }),
    onSuccess: (res) => {
      toast.success(`User @${res.username} Berhasil Dibuat`);
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      setOpenNew(false);
      setNewUsername("");
      setNewEmail("");
      setNewPhone("");
    },
    onError: (err: any) => toast.error("Gagal Membuat User", { description: err.message }),
  });

  const toggleAktifMutation = useMutation({
    mutationFn: (id: string) => apiUsers.toggleAktif(id),
    onSuccess: (res) => {
      toast.success(`Status user @${res.username} diperbarui: ${res.isAktif ? "Aktif" : "Nonaktif"}`);
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
    },
    onError: (err: any) => toast.error("Gagal", { description: err.message }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () =>
      apiUsers.resetPassword(resetPassUser!.id, { newPassword }),
    onSuccess: (res) => {
      toast.success(res.message || "Password berhasil di-reset");
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
              <Label>Username</Label>
              <Input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="misal: bendahara2"
              />
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
                  <SelectItem value="KAPRIM">Kaprim</SelectItem>
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
              <Label>No. Telepon / WA</Label>
              <Input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="08123456789"
              />
            </div>
            <Button
              className="w-full mt-4"
              disabled={!newUsername || createUserMutation.isPending}
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
