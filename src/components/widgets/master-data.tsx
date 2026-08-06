import { toast } from "sonner";
import { Building2, Medal, Percent } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatRp,
  kotamaList,
  pangkatKorps,
  tabelPinjaman,
} from "@/lib/casheva-data";

export function MasterDataWidget() {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Master Data Management</CardTitle>
        <CardDescription>
          Referensi organisasi TNI AD dan parameter pinjaman koperasi
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="kotama">
          <TabsList className="flex w-full flex-wrap">
            <TabsTrigger value="kotama">
              <Building2 className="mr-1 size-4" /> Kotama &amp; Satminkal
            </TabsTrigger>
            <TabsTrigger value="pangkat">
              <Medal className="mr-1 size-4" /> Pangkat &amp; Korps
            </TabsTrigger>
            <TabsTrigger value="pinjaman">
              <Percent className="mr-1 size-4" /> Tabel Pinjaman
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kotama" className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kotama</TableHead>
                  <TableHead>Satminkal</TableHead>
                  <TableHead className="text-right">Anggota</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kotamaList.map((k) => (
                  <TableRow key={k.kotama}>
                    <TableCell className="font-medium">{k.kotama}</TableCell>
                    <TableCell className="flex flex-wrap gap-1">
                      {k.satminkal.map((s) => (
                        <Badge key={s} variant="outline">{s}</Badge>
                      ))}
                    </TableCell>
                    <TableCell className="text-right">{k.anggota}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="pangkat" className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Golongan</TableHead>
                  <TableHead>Pangkat</TableHead>
                  <TableHead>Korps</TableHead>
                  <TableHead className="text-right">Potongan Sukarela</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pangkatKorps.map((p) => (
                  <TableRow key={p.golongan}>
                    <TableCell className="font-medium">{p.golongan}</TableCell>
                    <TableCell className="text-muted-foreground">{p.pangkat}</TableCell>
                    <TableCell className="text-muted-foreground">{p.korps}</TableCell>
                    <TableCell className="text-right font-semibold">{formatRp(p.potongan)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="pinjaman" className="mt-4 space-y-3 overflow-x-auto">
            <p className="text-sm text-muted-foreground">
              Plafon Rp 1.000.000 – Rp 20.000.000 · Bunga 12% p.a (flat)
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plafon</TableHead>
                  <TableHead className="text-center">Tenor</TableHead>
                  <TableHead className="text-center">Bunga</TableHead>
                  <TableHead className="text-right">Estimasi Angsuran</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tabelPinjaman.map((t) => (
                  <TableRow key={t.plafon}>
                    <TableCell className="font-medium">{formatRp(t.plafon)}</TableCell>
                    <TableCell className="text-center">{t.tenor} bln</TableCell>
                    <TableCell className="text-center">{t.bunga}% p.a</TableCell>
                    <TableCell className="text-right font-semibold">{formatRp(t.angsuran)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={() => toast.success("Master data tersinkronisasi 100%")}>
            Sinkronkan Master Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
