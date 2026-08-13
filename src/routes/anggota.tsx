import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { RefreshCw, Search, SlidersHorizontal, Pencil, UserPlus } from "lucide-react";
import { notify as toast } from "@/lib/notify";

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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
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
import { anggotaList, formatRp, type Anggota } from "@/lib/casheva-data";

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

const statusTone: Record<Anggota["status"], string> = {
  Aktif: "bg-success/15 text-success border-success/30",
  Cuti: "bg-gold-soft text-accent-foreground border-gold/40",
  "Non-Aktif": "bg-muted text-muted-foreground border-border",
};

function AnggotaPage() {
  const [q, setQ] = useState("");
  const [gol, setGol] = useState("semua");
  const [sat, setSat] = useState("semua");
  const [edit, setEdit] = useState<Anggota | null>(null);

  const satminkals = useMemo(
    () => Array.from(new Set(anggotaList.map((a) => a.satminkal))),
    [],
  );

  const rows = anggotaList.filter((a) => {
    const match =
      a.nama.toLowerCase().includes(q.toLowerCase()) || a.nrp.includes(q);
    return (
      match &&
      (gol === "semua" || a.golongan === gol) &&
      (sat === "semua" || a.satminkal === sat)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Data Anggota & Simpanan"
        description={`${anggotaList.length} anggota terdaftar pada satminkal binaan`}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() =>
                toast.success("Auto-generate simpanan sukarela dijalankan", {
                  description: "Terjadwal otomatis setiap tanggal 5 setiap bulan.",
                })
              }
            >
              <RefreshCw className="mr-2 size-4" />
              Auto-Generate Simpanan Sukarela
            </Button>
            <Button onClick={() => toast("Form tambah anggota dibuka")}>
              <UserPlus className="mr-2 size-4" /> Tambah Anggota
            </Button>
          </>
        }
      />

      <Card className="shadow-card">
        <CardContent className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_180px_200px]">
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
              <SelectValue placeholder="Pangkat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Pangkat</SelectItem>
              <SelectItem value="Pamen">Pamen</SelectItem>
              <SelectItem value="Pama">Pama</SelectItem>
              <SelectItem value="Ba/Ta">Ba/Ta</SelectItem>
              <SelectItem value="PNS">PNS</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sat} onValueChange={setSat}>
            <SelectTrigger>
              <SelectValue placeholder="Satminkal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Satminkal</SelectItem>
              {satminkals.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
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
              {rows.map((a) => (
                <TableRow key={a.nrp}>
                  <TableCell className="font-mono text-xs">{a.nrp}</TableCell>
                  <TableCell className="font-medium">{a.nama}</TableCell>
                  <TableCell>
                    {a.pangkat}
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({a.golongan})
                    </span>
                  </TableCell>
                  <TableCell>{a.korps}</TableCell>
                  <TableCell className="text-muted-foreground">{a.satminkal}</TableCell>
                  <TableCell className="text-right">{formatRp(a.simpananWajib)}</TableCell>
                  <TableCell className="text-right">{formatRp(a.simpananSukarela)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusTone[a.status]}>
                      {a.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => setEdit(a)}>
                      <Pencil className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
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

      <Sheet open={edit !== null} onOpenChange={(o) => !o && setEdit(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Ubah Data Anggota</SheetTitle>
            <SheetDescription>
              Perbarui data keanggotaan dan posisi simpanan.
            </SheetDescription>
          </SheetHeader>
          {edit && (
            <div className="space-y-4 px-4">
              <div className="space-y-2">
                <Label>Nama</Label>
                <Input defaultValue={edit.nama} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>NRP / NIP</Label>
                  <Input defaultValue={edit.nrp} />
                </div>
                <div className="space-y-2">
                  <Label>Pangkat</Label>
                  <Input defaultValue={edit.pangkat} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Korps</Label>
                  <Input defaultValue={edit.korps} />
                </div>
                <div className="space-y-2">
                  <Label>Satminkal</Label>
                  <Input defaultValue={edit.satminkal} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Simpanan Wajib</Label>
                  <Input defaultValue={edit.simpananWajib} />
                </div>
                <div className="space-y-2">
                  <Label>Simpanan Sukarela</Label>
                  <Input defaultValue={edit.simpananSukarela} />
                </div>
              </div>
            </div>
          )}
          <SheetFooter>
            <Button
              onClick={() => {
                toast.success("Data anggota diperbarui");
                setEdit(null);
              }}
            >
              Simpan Perubahan
            </Button>
            <Button variant="outline" onClick={() => setEdit(null)}>
              Batal
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
