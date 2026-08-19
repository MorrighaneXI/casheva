import { useQuery } from "@tanstack/react-query";
import { Building2, FolderKanban, Medal, Percent, UsersRound, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import { formatRp } from "@/lib/casheva-data";
import { apiMaster } from "@/lib/api";

export function MasterDataWidget() {
  const { data: kotamaList = [], isLoading: loadKotama } = useQuery({
    queryKey: ["master-kotama"],
    queryFn: () => apiMaster.getKotama(),
  });

  const { data: satminkalList = [] } = useQuery({
    queryKey: ["master-satminkal"],
    queryFn: () => apiMaster.getSatminkal(),
  });

  const { data: pangkatList = [], isLoading: loadPangkat } = useQuery({
    queryKey: ["master-pangkat"],
    queryFn: () => apiMaster.getPangkat(),
  });

  const { data: korpsList = [] } = useQuery({
    queryKey: ["master-korps"],
    queryFn: () => apiMaster.getKorps(),
  });

  const { data: dokumenList = [] } = useQuery({
    queryKey: ["master-dokumen"],
    queryFn: () => apiMaster.getKelompokDokumen(),
  });

  const { data: pengurusList = [] } = useQuery({
    queryKey: ["master-pengurus"],
    queryFn: () => apiMaster.getPengurus(),
  });

  // Parameter pinjaman standar Juknis TNI AD
  const pinjamanMatrix = [
    { nominal: 1_000_000, tenor: 12, angsuran: 93_333, bunga: 10_000, total: 103_333 },
    { nominal: 3_000_000, tenor: 12, angsuran: 250_000, bunga: 30_000, total: 280_000 },
    { nominal: 5_000_000, tenor: 24, angsuran: 208_333, bunga: 50_000, total: 258_333 },
    { nominal: 10_000_000, tenor: 24, angsuran: 416_666, bunga: 100_000, total: 516_666 },
    { nominal: 15_000_000, tenor: 36, angsuran: 416_666, bunga: 150_000, total: 566_666 },
    { nominal: 20_000_000, tenor: 36, angsuran: 555_555, bunga: 200_000, total: 755_555 },
  ];

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Master Data Referensi Kodifikasi TNI AD</CardTitle>
        <CardDescription>
          Data Kotama, Satminkal, Kepangkatan, Korps, Kelompok Dokumen, dan Parameter Pinjaman
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
              <Percent className="mr-1 size-4" /> Matriks Pinjaman
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
                  <TableHead>Kode</TableHead>
                  <TableHead>Komando Utama (Kotama)</TableHead>
                  <TableHead>Daftar Satminkal Terkait</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadKotama ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                      <Loader2 className="mx-auto size-5 animate-spin mb-1" />
                      Memuat master Kotama...
                    </TableCell>
                  </TableRow>
                ) : (
                  kotamaList.map((k) => {
                    const relatedSatminkal = satminkalList.filter((s) => s.kotamaId === k.id);
                    return (
                      <TableRow key={k.id}>
                        <TableCell className="font-mono text-xs font-semibold">{k.kode}</TableCell>
                        <TableCell className="font-medium">{k.nama}</TableCell>
                        <TableCell className="flex flex-wrap gap-1">
                          {relatedSatminkal.map((s) => (
                            <Badge key={s.id} variant="outline" className="text-xs">
                              {s.nama} ({s.kode})
                            </Badge>
                          ))}
                          {relatedSatminkal.length === 0 && (
                            <span className="text-xs text-muted-foreground">Disinfolahtad</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="pangkat" className="mt-4 overflow-x-auto space-y-6">
            <div>
              <h4 className="text-sm font-semibold mb-2">Daftar Pangkat &amp; Ketentuan Simpanan Sukarela Otomatis</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kategori / Golongan</TableHead>
                    <TableHead>Nama Pangkat</TableHead>
                    <TableHead>Kode</TableHead>
                    <TableHead className="text-right">Potongan Sukarela / Bulan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pangkatList.map((p) => {
                    const nominalSukarela =
                      p.kategori === "PAMEN"
                        ? 300_000
                        : p.kategori === "PAMA"
                          ? 250_000
                          : 150_000;
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {p.kategori}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{p.nama}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {p.kode}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {formatRp(nominalSukarela)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Daftar Korps TNI AD</h4>
              <div className="flex flex-wrap gap-2">
                {korpsList.map((c) => (
                  <Badge key={c.id} variant="secondary" className="px-3 py-1 text-xs">
                    {c.kode} — {c.nama}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pinjaman" className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plafon Pinjaman</TableHead>
                  <TableHead className="text-center">Tenor</TableHead>
                  <TableHead className="text-right">Angsuran Pokok</TableHead>
                  <TableHead className="text-right">Bunga 1% (Flat)</TableHead>
                  <TableHead className="text-right font-bold">Total Angsuran/Bulan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pinjamanMatrix.map((m) => (
                  <TableRow key={`${m.nominal}-${m.tenor}`}>
                    <TableCell className="font-semibold">{formatRp(m.nominal)}</TableCell>
                    <TableCell className="text-center">{m.tenor} Bulan</TableCell>
                    <TableCell className="text-right">{formatRp(m.angsuran)}</TableCell>
                    <TableCell className="text-right text-success">{formatRp(m.bunga)}</TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {formatRp(m.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="dokumen" className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kelompok Dokumen</TableHead>
                  <TableHead>Keterangan / Persyaratan</TableHead>
                  <TableHead>Status Wajib</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dokumenList.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.nama}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {d.keterangan || "Berkas persyaratan administrasi pinjaman"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-primary/30 text-primary text-xs">
                        Wajib
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
                  <TableHead>Jabatan Pengurus</TableHead>
                  <TableHead>Nama Pejabat</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pengurusList.map((peng) => (
                  <TableRow key={peng.id}>
                    <TableCell className="font-medium">{peng.jabatan}</TableCell>
                    <TableCell>{peng.nama}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{peng.periode}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          peng.isAktif
                            ? "border-success/30 bg-success/15 text-success"
                            : "border-muted text-muted-foreground"
                        }
                      >
                        {peng.isAktif ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
