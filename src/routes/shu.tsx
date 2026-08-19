import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calculator,
  Loader2,
  PieChart,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Shield,
  FileSpreadsheet,
  Printer,
  DollarSign,
  Users,
  Building,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
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
import { formatRp, shuDistribusi } from "@/lib/casheva-data";
import { apiKeuangan, apiReports } from "@/lib/api";

export const Route = createFileRoute("/shu")({
  head: () => ({
    meta: [
      { title: "Pengawasan SHU — Casheva Koperasi TNI AD" },
      {
        name: "description",
        content:
          "Pengawasan, kalkulator, dan breakdown pembagian Sisa Hasil Usaha (SHU) Koperasi TNI AD.",
      },
      { property: "og:title", content: "Pengawasan SHU — Casheva" },
      {
        property: "og:description",
        content:
          "Dashboard pengawasan Sisa Hasil Usaha (SHU) sesuai AD/ART Juknis Koperasi TNI AD 2026.",
      },
    ],
  }),
  component: ShuPage,
});

const PIE_COLORS = ["#1b4332", "#2d6a4f", "#d4a373", "#e76f51", "#264653"];

function ShuPage() {
  const queryClient = useQueryClient();
  const currentYear = 2026;
  const [activeTab, setActiveTab] = useState("distribusi");

  // Queries
  const {
    data: ringkasan,
    isLoading: loadingRingkasan,
    refetch: refetchRingkasan,
  } = useQuery({
    queryKey: ["keuangan-ringkasan", currentYear],
    queryFn: () => apiKeuangan.getRingkasan(currentYear),
  });

  const {
    data: reportShu,
    isLoading: loadingReport,
    isError: errorReport,
    refetch: refetchShu,
  } = useQuery({
    queryKey: ["reports-shu-anggota", currentYear],
    queryFn: () => apiReports.getShuAnggota(currentYear),
    retry: 1,
  });

  const { data: pendapatanList = [] } = useQuery({
    queryKey: ["keuangan-pendapatan", currentYear],
    queryFn: () => apiKeuangan.getPendapatan(currentYear),
  });

  const { data: biayaList = [] } = useQuery({
    queryKey: ["keuangan-biaya", currentYear],
    queryFn: () => apiKeuangan.getBiaya(currentYear),
  });

  // Hitung SHU Mutation
  const hitungMutation = useMutation({
    mutationFn: () => apiKeuangan.hitungShu({ tahun: currentYear }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["keuangan-ringkasan", currentYear] });
      queryClient.invalidateQueries({ queryKey: ["reports-shu-anggota", currentYear] });
      toast.success("Kalkulasi & Distribusi SHU Berhasil Disimpan!", {
        description: res.message || "Distribusi Jasa Modal 20% & Jasa Usaha 30% telah dibagikan.",
      });
      refetchRingkasan();
      refetchShu();
    },
    onError: (err: any) => {
      toast.error("Gagal Menghitung SHU", { description: err.message });
    },
  });

  const totalPendapatan = Number(ringkasan?.totalPendapatan ?? 70_000_000);
  const totalBeban = Number(ringkasan?.totalBeban ?? 20_000_000);
  const shuBersih = Number(ringkasan?.shuBersih ?? 50_000_000);

  const shuList = reportShu?.data || [];
  const totalJasaModal = shuList.reduce((s, r) => s + Number(r.jasaModal || 0), 0);
  const totalJasaUsaha = shuList.reduce((s, r) => s + Number(r.jasaUsaha || 0), 0);
  const grandTotalShu = shuList.reduce((s, r) => s + Number(r.totalShu || 0), 0);

  // Pie chart distribution data
  const pieData = shuDistribusi.map((d) => ({
    name: d.pos,
    value: (shuBersih * d.persen) / 100,
    persen: d.persen,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengawasan Sisa Hasil Usaha (SHU)"
        description="Monitoring alokasi dan pembagian SHU Tahun Buku 2026 sesuai Petunjuk Teknis Koperasi TNI AD"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              disabled={hitungMutation.isPending}
              onClick={() => hitungMutation.mutate()}
            >
              {hitungMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 size-4" />
              )}
              Hitung Ulang SHU {currentYear}
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="mr-2 size-4" /> Cetak Laporan
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total Pendapatan Bunga &amp; Jasa</span>
              <TrendingUp className="size-4 text-success" />
            </div>
            <p className="text-2xl font-extrabold text-foreground">{formatRp(totalPendapatan)}</p>
            <p className="text-xs text-muted-foreground">Tahun Buku {currentYear}</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Biaya &amp; Beban Operasional</span>
              <TrendingDown className="size-4 text-destructive" />
            </div>
            <p className="text-2xl font-extrabold text-destructive">{formatRp(totalBeban)}</p>
            <p className="text-xs text-muted-foreground">Termasuk beban organisasi</p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-primary/30 bg-primary-soft/40">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center justify-between text-xs text-primary font-medium">
              <span>SHU Bersih Tahun Berjalan</span>
              <DollarSign className="size-4 text-primary" />
            </div>
            <p className="text-2xl font-extrabold text-primary">{formatRp(shuBersih)}</p>
            <p className="text-xs text-muted-foreground">Pendapatan dikurangi Biaya</p>
          </CardContent>
        </Card>

        <Card className="shadow-card bg-success/10 border-success/30">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center justify-between text-xs text-success font-medium">
              <span>Bagian Anggota (50%)</span>
              <Users className="size-4 text-success" />
            </div>
            <p className="text-2xl font-extrabold text-success">{formatRp(shuBersih * 0.5)}</p>
            <p className="text-xs text-muted-foreground">Jasa Modal 20% + Jasa Usaha 30%</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap w-full">
          <TabsTrigger value="distribusi">
            <PieChart className="mr-1 size-4" /> Distribusi Alokasi AD/ART
          </TabsTrigger>
          <TabsTrigger value="anggota">
            <Users className="mr-1 size-4" /> Rincian Pembagian per Anggota
          </TabsTrigger>
          <TabsTrigger value="pendapatan">
            <TrendingUp className="mr-1 size-4" /> Pos Pendapatan
          </TabsTrigger>
          <TabsTrigger value="biaya">
            <TrendingDown className="mr-1 size-4" /> Pos Biaya Operasional
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Distribusi Alokasi */}
        <TabsContent value="distribusi" className="mt-4 space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* 5 Pos Cards */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Persentase &amp; Nominal Alokasi SHU</CardTitle>
                  <CardDescription>
                    Ketentuan pembagian Sisa Hasil Usaha berdasarkan Anggaran Dasar / Anggaran Rumah Tangga Koperasi TNI AD
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {shuDistribusi.map((d, i) => {
                    const nominal = (shuBersih * d.persen) / 100;
                    return (
                      <div
                        key={d.pos}
                        className="rounded-xl border border-border p-4 bg-card shadow-sm space-y-1"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-muted-foreground">{d.pos}</span>
                          <Badge variant="outline" className="font-bold text-xs">
                            {d.persen}%
                          </Badge>
                        </div>
                        <p className="text-lg font-extrabold text-foreground">{formatRp(nominal)}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {d.pos.includes("Modal")
                            ? "Dibagikan proporsional sesuai simpanan anggota"
                            : d.pos.includes("Usaha")
                              ? "Dibagikan proporsional sesuai volume pinjaman anggota"
                              : d.pos.includes("Cadangan")
                                ? "Memperkuat struktur permodalan koperasi"
                                : "Pengembangan SDM, pengurus & dana sosial"}
                        </p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Pie Chart Card */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base">Grafik Alokasi SHU</CardTitle>
                <CardDescription>Proporsi pembagian 100%</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={3}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => formatRp(Number(val))}
                      contentStyle={{
                        background: "var(--color-popover)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 10,
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </RePieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: Rincian Pembagian per Anggota */}
        <TabsContent value="anggota" className="mt-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Rincian Pembagian SHU per Anggota</CardTitle>
                <CardDescription>
                  Formula: Jasa Modal (20%) + Jasa Usaha (30%) dihitung dari aktivitas riil simpan pinjam
                </CardDescription>
              </div>
              <Button
                size="sm"
                disabled={hitungMutation.isPending}
                onClick={() => hitungMutation.mutate()}
              >
                {hitungMutation.isPending ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <Calculator className="mr-1.5 size-3.5" />
                )}
                Hitung &amp; Simpan SHU Anggota
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">No</TableHead>
                    <TableHead>Nama Anggota</TableHead>
                    <TableHead>Pangkat / Korps / NRP</TableHead>
                    <TableHead className="text-right">Jasa Modal (20%)</TableHead>
                    <TableHead className="text-right">Jasa Usaha (30%)</TableHead>
                    <TableHead className="text-right font-bold">Total SHU Diterima</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingReport ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        <Loader2 className="mx-auto size-6 animate-spin mb-2" />
                        Memuat rincian SHU anggota...
                      </TableCell>
                    </TableRow>
                  ) : (
                    shuList.map((r, i) => (
                      <TableRow key={r.no || i} className="hover:bg-muted/30">
                        <TableCell className="text-center font-medium">{r.no || i + 1}</TableCell>
                        <TableCell className="font-semibold text-foreground">{r.nama}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.pktCrpNrp}</TableCell>
                        <TableCell className="text-right font-medium text-primary">
                          {formatRp(Number(r.jasaModal))}
                        </TableCell>
                        <TableCell className="text-right font-medium text-success">
                          {formatRp(Number(r.jasaUsaha))}
                        </TableCell>
                        <TableCell className="text-right font-extrabold text-foreground">
                          {formatRp(Number(r.totalShu))}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {!loadingReport && shuList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        Data SHU anggota belum dihitung. Klik tombol &quot;Hitung &amp; Simpan SHU Anggota&quot; di atas untuk memproses.
                      </TableCell>
                    </TableRow>
                  )}
                  {shuList.length > 0 && (
                    <TableRow className="bg-muted/80 font-bold">
                      <td className="border border-border p-3 text-center" colSpan={3}>
                        TOTAL DIBAGIKAN KE ANGGOTA
                      </td>
                      <td className="border border-border p-3 text-right text-primary">
                        {formatRp(totalJasaModal)}
                      </td>
                      <td className="border border-border p-3 text-right text-success">
                        {formatRp(totalJasaUsaha)}
                      </td>
                      <td className="border border-border p-3 text-right text-primary font-extrabold text-base">
                        {formatRp(grandTotalShu)}
                      </td>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Pos Pendapatan */}
        <TabsContent value="pendapatan" className="mt-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Rincian Pos Pendapatan Kas Koperasi</CardTitle>
              <CardDescription>Penerimaan bunga pinjaman dan provisi/administrasi</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jenis Pendapatan</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendapatanList.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.jenis}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {p.tanggal ? new Date(p.tanggal).toLocaleDateString("id-ID") : "-"}
                      </TableCell>
                      <TableCell className="text-xs">{p.keterangan || "-"}</TableCell>
                      <TableCell className="text-right font-bold text-success">
                        {formatRp(Number(p.nominal))}
                      </TableCell>
                    </TableRow>
                  ))}
                  {pendapatanList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        Belum ada pencatatan pos pendapatan manual. Pendapatan bunga dihitung otomatis dari cicilan pinjaman.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: Pos Biaya Operasional */}
        <TabsContent value="biaya" className="mt-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Rincian Biaya &amp; Beban Operasional</CardTitle>
              <CardDescription>Pengeluaran rutin dan operasional kantor koperasi</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jenis Biaya</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {biayaList.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.jenis}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {b.tanggal ? new Date(b.tanggal).toLocaleDateString("id-ID") : "-"}
                      </TableCell>
                      <TableCell className="text-xs">{b.keterangan || "-"}</TableCell>
                      <TableCell className="text-right font-bold text-destructive">
                        {formatRp(Number(b.nominal))}
                      </TableCell>
                    </TableRow>
                  ))}
                  {biayaList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        Belum ada pengeluaran beban tercatat.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
