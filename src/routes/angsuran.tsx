import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/page-header";
import { useSession } from "@/components/session-context";
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
import { RekapAngsuranTable } from "@/components/widgets/role-widgets";
import { anggotaAngsuranSaya, formatRp } from "@/lib/casheva-data";

export const Route = createFileRoute("/angsuran")({
  head: () => ({
    meta: [
      { title: "Rekap Angsuran — Casheva Koperasi TNI AD" },
      { name: "description", content: "Status cicilan berjalan anggota koperasi." },
      { property: "og:title", content: "Rekap Angsuran — Casheva" },
      { property: "og:description", content: "Status cicilan berjalan anggota koperasi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { role } = useSession();
  const isAnggota = role === "Anggota";

  if (isAnggota) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Riwayat Angsuran Saya"
          description="Jumlah angsuran, sisa kewajiban, dan progress pembayaran pinjaman Anda"
        />
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Pinjaman Berjalan</CardTitle>
            <CardDescription>Ringkasan kewajiban angsuran anggota</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Pinjaman</TableHead>
                  <TableHead className="text-right">Pokok</TableHead>
                  <TableHead className="text-center">Angsuran ke-</TableHead>
                  <TableHead className="text-right">Angsuran / bln</TableHead>
                  <TableHead className="text-right">Sisa</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anggotaAngsuranSaya.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.id}</TableCell>
                    <TableCell className="text-right">{formatRp(r.pokok)}</TableCell>
                    <TableCell className="text-center">
                      {r.angsuranKe} / {r.totalAngsuran}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatRp(r.angsuranBulanan)}
                    </TableCell>
                    <TableCell className="text-right">{formatRp(r.sisa)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-success/30 bg-success/15 text-success"
                      >
                        {r.status}
                      </Badge>
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekap Angsuran Anggota"
        description="Status cicilan berjalan seluruh anggota koperasi."
      />
      <RekapAngsuranTable />
    </div>
  );
}
