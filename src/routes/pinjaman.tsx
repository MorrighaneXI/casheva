import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, FilePlus2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRp, loanStatusTone, recentLoans } from "@/lib/casheva-data";

export const Route = createFileRoute("/pinjaman")({
  head: () => ({
    meta: [
      { title: "Pengajuan Pinjaman — Casheva" },
      {
        name: "description",
        content:
          "Daftar seluruh pengajuan pinjaman anggota koperasi TNI AD beserta status persetujuan berjenjang.",
      },
      { property: "og:title", content: "Pengajuan Pinjaman — Casheva" },
      {
        property: "og:description",
        content: "Pantau seluruh pengajuan pinjaman anggota koperasi TNI AD.",
      },
    ],
  }),
  component: PinjamanPage,
});

function PinjamanPage() {
  const [q, setQ] = useState("");
  const rows = recentLoans.filter(
    (l) =>
      l.nama.toLowerCase().includes(q.toLowerCase()) ||
      l.id.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengajuan Pinjaman"
        description="Seluruh pengajuan pinjaman anggota pada tahun buku berjalan"
        actions={
          <Button onClick={() => toast("Formulir pengajuan baru dibuka")}>
            <FilePlus2 className="mr-2 size-4" /> Pengajuan Baru
          </Button>
        }
      />

      <Card className="shadow-card">
        <CardContent className="py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nomor pengajuan atau nama anggota…"
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="overflow-x-auto py-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Pengajuan</TableHead>
                <TableHead>Anggota</TableHead>
                <TableHead>Satminkal</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead className="text-center">Tenor</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono text-xs">{l.id}</TableCell>
                  <TableCell>
                    <p className="font-medium">{l.nama}</p>
                    <p className="text-xs text-muted-foreground">NRP {l.nrp}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{l.satminkal}</TableCell>
                  <TableCell className="text-right font-semibold">{formatRp(l.jumlah)}</TableCell>
                  <TableCell className="text-center">{l.tenor} bln</TableCell>
                  <TableCell className="text-muted-foreground">{l.tanggal}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={loanStatusTone[l.status]}>
                      {l.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" asChild>
                      <Link to="/verifikasi">Tinjau</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
