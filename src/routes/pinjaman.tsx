import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { useSession } from "@/components/session-context";
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
import { formatRp, loanStatusTone, backendStatusToFrontend } from "@/lib/casheva-data";
import { canAccessPath } from "@/lib/rbac";
import { apiPinjaman } from "@/lib/api";

export const Route = createFileRoute("/pinjaman")({
  head: () => ({
    meta: [
      { title: "Riwayat Pinjaman — Casheva" },
      {
        name: "description",
        content:
          "Daftar seluruh pengajuan pinjaman anggota koperasi TNI AD beserta status persetujuan berjenjang.",
      },
      { property: "og:title", content: "Riwayat Pinjaman — Casheva" },
      {
        property: "og:description",
        content: "Pantau seluruh pengajuan pinjaman anggota koperasi TNI AD.",
      },
    ],
  }),
  component: PinjamanPage,
});

function PinjamanPage() {
  const { role } = useSession();
  const monitorOnly = role === "Pimpinan / Dan / Ka" || role === "Kaprim";
  const [q, setQ] = useState("");

  const { data: loanList = [], isLoading } = useQuery({
    queryKey: ["pinjaman-list"],
    queryFn: () => apiPinjaman.findAll(),
  });

  const rows = loanList.filter((l) => {
    const nama = l.anggota?.nama || "";
    const nrp = l.anggota?.nrpNip || "";
    const id = l.id || "";
    return (
      nama.toLowerCase().includes(q.toLowerCase()) ||
      nrp.includes(q) ||
      id.toLowerCase().includes(q.toLowerCase())
    );
  });

  const detailTo = canAccessPath(role, "/rekomendasi")
    ? "/rekomendasi"
    : canAccessPath(role, "/verifikasi")
      ? "/verifikasi"
      : "/pinjaman";

  return (
    <div className="space-y-6">
      <PageHeader
        title={monitorOnly ? "Riwayat Pinjaman Satuan" : "Pengajuan & Riwayat Pinjaman"}
        description={
          monitorOnly
            ? "Monitoring seluruh pengajuan pinjaman anggota satuan (tanpa mengubah status)."
            : "Seluruh pengajuan pinjaman anggota pada tahun buku berjalan (Database Terintegrasi)"
        }
        actions={
          <div className="flex items-center gap-2">
            {monitorOnly ? (
              <Badge variant="outline" className="border-primary/25 bg-primary-soft text-primary">
                Mode monitoring
              </Badge>
            ) : (
              <Button asChild>
                <Link to="/pengajuan">
                  <Plus className="mr-2 size-4" /> Ajukan Pinjaman Baru
                </Link>
              </Button>
            )}
          </div>
        }
      />

      <Card className="shadow-card">
        <CardContent className="py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nomor pengajuan, nama anggota, atau NRP…"
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
                <TableHead>Pangkat / Korps</TableHead>
                <TableHead>Satminkal</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead className="text-center">Tenor</TableHead>
                <TableHead className="text-right">Angsuran / bln</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-6 animate-spin mb-2" />
                    Memuat data pinjaman...
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((l) => {
                  const uiStatus = backendStatusToFrontend(l.status);
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {l.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{l.anggota?.nama || "Anggota"}</p>
                        <p className="text-xs text-muted-foreground">
                          NRP {l.anggota?.nrpNip || "-"}
                        </p>
                      </TableCell>
                      <TableCell>
                        {l.anggota?.pangkat?.nama || "-"}{" "}
                        {l.anggota?.korps?.nama ? `(${l.anggota.korps.nama})` : ""}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {l.anggota?.satminkal?.nama || "Disinfolahtad"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatRp(Number(l.nominal))}
                      </TableCell>
                      <TableCell className="text-center">{l.tenorBulan} bln</TableCell>
                      <TableCell className="text-right text-xs font-medium">
                        {formatRp(Number(l.totalAngsuranBulanan || (Number(l.nominal) * 1.12) / l.tenorBulan))}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={loanStatusTone[uiStatus] || ""}>
                          {uiStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" asChild>
                          <Link to={detailTo as "/"}>{monitorOnly ? "Lihat" : "Tinjau"}</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
              {!isLoading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    Tidak ada riwayat pinjaman ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
