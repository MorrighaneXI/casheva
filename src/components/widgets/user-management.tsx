import { useState } from "react";
import { KeyRound, Pencil, Plus, Search } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROLES, systemUsers, type SystemUser } from "@/lib/casheva-data";

const satminkals = ["Semua", "Disinfolahtad", "Ditkuad", "Ditziad", "Mabesad"];

export function UserManagementWidget() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("Semua");
  const [sat, setSat] = useState("Semua");
  const [status, setStatus] = useState("Semua");
  const [edit, setEdit] = useState<SystemUser | null>(null);
  const [openNew, setOpenNew] = useState(false);

  const rows = systemUsers.filter(
    (u) =>
      (role === "Semua" || u.role === role) &&
      (sat === "Semua" || u.satminkal === sat) &&
      (status === "Semua" || u.status === status) &&
      (u.nama.toLowerCase().includes(q.toLowerCase()) || u.nrp.includes(q)),
  );

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>Manajemen User &amp; Hak Akses</CardTitle>
          <CardDescription>
            Akun dibuat dan dikelola oleh Admin Koperasi — tidak ada registrasi publik
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
              placeholder="Cari nama / NRP"
              className="pl-9"
            />
          </div>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Semua">Semua Role</SelectItem>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sat} onValueChange={setSat}>
            <SelectTrigger><SelectValue placeholder="Satminkal" /></SelectTrigger>
            <SelectContent>
              {satminkals.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Semua">Semua Status</SelectItem>
              <SelectItem value="Aktif">Aktif</SelectItem>
              <SelectItem value="Nonaktif">Nonaktif</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Satminkal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Login Terakhir</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <p className="font-medium">{u.nama}</p>
                    <p className="text-xs text-muted-foreground">NRP {u.nrp}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{u.role}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.satminkal}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        u.status === "Aktif"
                          ? "border-success/30 bg-success/15 text-success"
                          : "border-border bg-muted text-muted-foreground"
                      }
                    >
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.lastLogin}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button size="sm" variant="ghost" onClick={() => setEdit(u)}>
                      <Pencil className="mr-1 size-3.5" /> Edit Role
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toast.success(`Password ${u.nama} direset & dikirim ke Jurbay`)}
                    >
                      <KeyRound className="mr-1 size-3.5" /> Reset
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Tidak ada user sesuai filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Sheet open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit Hak Akses</SheetTitle>
            <SheetDescription>{edit?.nama}</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-6">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select defaultValue={edit?.role ?? "Bendahara"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Satminkal</Label>
              <Input defaultValue={edit?.satminkal} />
            </div>
            <Button
              className="w-full"
              onClick={() => {
                toast.success("Hak akses diperbarui");
                setEdit(null);
              }}
            >
              Simpan Perubahan
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={openNew} onOpenChange={setOpenNew}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Tambah User Baru</SheetTitle>
            <SheetDescription>Akun dibuat manual oleh Admin Koperasi</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-6">
            <div className="space-y-1.5"><Label>Nama &amp; Pangkat</Label><Input placeholder="Serma Budi Santoso" /></div>
            <div className="space-y-1.5"><Label>NRP / NIP</Label><Input placeholder="21980045" /></div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select defaultValue="Bendahara">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Satminkal</Label><Input placeholder="Disinfolahtad" /></div>
            <Button
              className="w-full"
              onClick={() => {
                toast.success("User baru dibuat, kredensial awal dikirim ke Satminkal");
                setOpenNew(false);
              }}
            >
              Simpan User
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
