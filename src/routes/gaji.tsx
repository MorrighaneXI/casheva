import { createFileRoute } from "@tanstack/react-router";
import { Banknote, MinusCircle, Wallet } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { anggotaGajiProfile, formatRp } from "@/lib/casheva-data";

export const Route = createFileRoute("/gaji")({
  head: () => ({
    meta: [
      { title: "Rincian Gaji — Casheva Koperasi TNI AD" },
      {
        name: "description",
        content: "Rincian gaji pokok, tunjangan, dan potongan anggota koperasi TNI AD.",
      },
      { property: "og:title", content: "Rincian Gaji — Casheva" },
      {
        property: "og:description",
        content: "Pantau komponen gaji dan potongan koperasi Anda.",
      },
    ],
  }),
  component: GajiPage,
});

function GajiPage() {
  const p = anggotaGajiProfile;
  const bruto = p.gajiPokok + p.tunkin + p.tunjanganLain;
  const totalPotongan = p.potongan.reduce((sum, row) => sum + row.jumlah, 0);
  const netto = bruto - totalPotongan;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rincian Gaji"
        description={`${p.pangkat} ${p.nama} · NRP ${p.nrp} · ${p.satminkal}`}
        actions={
          <Badge variant="outline" className="border-primary/30 bg-primary-soft text-primary">
            Slip bulan berjalan
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Gaji Bruto</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <p className="text-xl font-extrabold">{formatRp(bruto)}</p>
            <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
              <Wallet className="size-4" />
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Total Potongan</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <p className="text-xl font-extrabold">{formatRp(totalPotongan)}</p>
            <span className="grid size-9 place-items-center rounded-lg bg-destructive/10 text-destructive">
              <MinusCircle className="size-4" />
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Gaji Bersih Diterima</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <p className="text-xl font-extrabold text-success">{formatRp(netto)}</p>
            <span className="grid size-9 place-items-center rounded-lg bg-success/15 text-success">
              <Banknote className="size-4" />
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Komponen Pendapatan</CardTitle>
            <CardDescription>Gaji pokok dan tunjangan bulan ini</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              ["Gaji pokok", p.gajiPokok],
              ["Tunjangan kinerja (Tunkin)", p.tunkin],
              ["Tunjangan lain", p.tunjanganLain],
            ].map(([label, amount]) => (
              <div key={String(label)} className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold">{formatRp(Number(amount))}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Rincian Potongan</CardTitle>
            <CardDescription>Potongan koperasi dan kewajiban berjalan</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jenis Potongan</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {p.potongan.map((row) => (
                  <TableRow key={row.nama}>
                    <TableCell>{row.nama}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatRp(row.jumlah)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
