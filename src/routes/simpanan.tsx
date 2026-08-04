import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { formatRp } from "@/lib/casheva-data";

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

const trx = [
  { id: "TRX-9021", nama: "Serma Budi Santoso", jenis: "Sukarela", tipe: "Setoran", jumlah: 500000, tgl: "03 Agu 2026" },
  { id: "TRX-9020", nama: "Kapten Inf Rahmat Hidayat", jenis: "Wajib", tipe: "Setoran", jumlah: 300000, tgl: "03 Agu 2026" },
  { id: "TRX-9019", nama: "Pelda Agus Wibowo", jenis: "Sukarela", tipe: "Penarikan", jumlah: 1200000, tgl: "02 Agu 2026" },
  { id: "TRX-9018", nama: "Mayor Kav Fajar Nugroho", jenis: "Pokok", tipe: "Setoran", jumlah: 1000000, tgl: "02 Agu 2026" },
  { id: "TRX-9017", nama: "Penata Muda Sri Wahyuni", jenis: "Wajib", tipe: "Setoran", jumlah: 250000, tgl: "01 Agu 2026" },
];

function SimpananPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transaksi Simpanan"
        description="Mutasi simpanan pokok, wajib, dan sukarela anggota"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 size-4" /> Transaksi Baru
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Simpanan Pokok", 742_000_000],
          ["Simpanan Wajib", 5_310_000_000],
          ["Simpanan Sukarela", 10_888_000_000],
        ].map(([label, val]) => (
          <Card key={label as string} className="shadow-card">
            <CardHeader className="pb-2">
              <CardDescription>{label as string}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-extrabold">{formatRp(val as number)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="semua">
        <TabsList>
          <TabsTrigger value="semua">Semua</TabsTrigger>
          <TabsTrigger value="setoran">Setoran</TabsTrigger>
          <TabsTrigger value="penarikan">Penarikan</TabsTrigger>
        </TabsList>
        {["semua", "setoran", "penarikan"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base">Riwayat Transaksi</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Anggota</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead>Tanggal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trx
                      .filter((t) => tab === "semua" || t.tipe.toLowerCase() === tab)
                      .map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-mono text-xs">{t.id}</TableCell>
                          <TableCell className="font-medium">{t.nama}</TableCell>
                          <TableCell>{t.jenis}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                t.tipe === "Setoran"
                                  ? "border-success/30 bg-success/15 text-success"
                                  : "border-destructive/30 bg-destructive/12 text-destructive"
                              }
                            >
                              {t.tipe === "Setoran" ? (
                                <ArrowDownLeft className="mr-1 size-3" />
                              ) : (
                                <ArrowUpRight className="mr-1 size-3" />
                              )}
                              {t.tipe}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatRp(t.jumlah)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{t.tgl}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Transaksi Simpanan Baru</SheetTitle>
            <SheetDescription>Catat setoran atau penarikan simpanan anggota.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4">
            <div className="space-y-2">
              <Label>NRP / Nama Anggota</Label>
              <Input placeholder="21980045 — Serma Budi Santoso" />
            </div>
            <div className="space-y-2">
              <Label>Jenis Simpanan</Label>
              <Input placeholder="Sukarela" />
            </div>
            <div className="space-y-2">
              <Label>Jumlah</Label>
              <Input placeholder="500000" />
            </div>
          </div>
          <SheetFooter>
            <Button
              onClick={() => {
                setOpen(false);
                toast.success("Transaksi simpanan tersimpan");
              }}
            >
              Simpan Transaksi
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
