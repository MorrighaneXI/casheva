import { toast } from "sonner";
import { Building2, FolderKanban, Medal, Percent, UsersRound } from "lucide-react";

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
} from "@/lib/casheva-data";
import {
  dokumenKelompokMaster,
  korpsMaster,
  kotamaMaster,
  pangkatMaster,
  pengurusMaster,
  pinjamanMaster,
} from "@/lib/master-data";

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
            <TabsTrigger value="dokumen">
              <FolderKanban className="mr-1 size-4" /> Kelompok Dokumen
            </TabsTrigger>
            <TabsTrigger value="pengurus">
              <UsersRound className="mr-1 size-4" /> Data Pengurus
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kotama" className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kotama</TableHead>
                  <TableHead>Satminkal</TableHead>
                  <TableHead className="text-right">Jml Satminkal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kotamaMaster.map((k) => (
                  <TableRow key={k.kotama}>
                    <TableCell className="font-medium">{k.kotama}</TableCell>
                    <TableCell className="flex flex-wrap gap-1">
                      {k.satminkal.map((s) => (
                        <Badge key={s} variant="outline">{s}</Badge>
                      ))}
                    </TableCell>
                    <TableCell className="text-right">{k.satminkal.length}</TableCell>
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
                {pangkatMaster.map((p) => (
                  <TableRow key={p.grade}>
                    <TableCell className="font-medium">{p.grade}</TableCell>
                    <TableCell className="text-muted-foreground">{p.pangkat.join(", ")}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {korpsMaster
                        .filter((k) => k.gradeAllowed.includes(p.grade))
                        .map((k) => k.code)
                        .join(", ")}
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatRp(p.potonganSukarela)}</TableCell>
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
                {pinjamanMaster.map((t) => (
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

          <TabsContent value="dokumen" className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Dokumen</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dokumenKelompokMaster.map((d) => (
                  <TableRow key={d.key}>
                    <TableCell className="font-mono text-xs">{d.key}</TableCell>
                    <TableCell className="font-medium">{d.label}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">
                        {d.wajib ? "Wajib" : "Opsional"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="pengurus" className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Jabatan</TableHead>
                  <TableHead>Periode</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pengurusMaster.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.id}</TableCell>
                    <TableCell>
                      <p className="font-medium">{p.nama}</p>
                      <p className="text-xs text-muted-foreground">{p.pangkat} · NRP {p.nrp}</p>
                    </TableCell>
                    <TableCell>{p.jabatan}</TableCell>
                    <TableCell>{p.periode}</TableCell>
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
