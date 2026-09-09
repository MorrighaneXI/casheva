import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  FileSpreadsheet,
  Search,
  SlidersHorizontal,
  Calendar,
  PiggyBank,
  HandCoins,
  Receipt,
  ShoppingCart,
  Gem,
  Truck,
  Download,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  Eye,
  Filter,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatRp, formatPangkatKorps } from "@/lib/casheva-data";
import { exportToExcel, exportToCSV } from "@/lib/export-excel";
import { apiSimpanan, apiPinjaman, apiReports, apiAnggota } from "@/lib/api";
import { useSession } from "@/components/session-context";

export type UnifiedTransaction = {
  id: string;
  refNo: string;
  kategori: "SIMPANAN" | "PINJAMAN_CAIR" | "ANGSURAN" | "POS_TOKO" | "GADAI" | "SUPPLIER";
  kategoriLabel: string;
  anggotaNama: string;
  anggotaNrp: string;
  nominal: number;
  tipeArus: "MASUK" | "KELUAR";
  metode: string;
  status: string;
  tanggal: string;
  waktu: string;
  rawDate: Date;
  keterangan: string;
};

export function TransaksiWidget() {
  const { satminkal } = useSession();
  const [activeTab, setActiveTab] = useState("semua");
  const [q, setQ] = useState("");
  const [filterArus, setFilterArus] = useState<"ALL" | "MASUK" | "KELUAR">("ALL");
  const [selectedTx, setSelectedTx] = useState<UnifiedTransaction | null>(null);

  // Queries from backend
  const { data: simpananList = [], isLoading: loadSimpanan } = useQuery({
    queryKey: ["simpanan-all-tx"],
    queryFn: () => apiSimpanan.getRekap(),
  });

  const { data: pinjamanList = [], isLoading: loadPinjaman } = useQuery({
    queryKey: ["pinjaman-all-tx"],
    queryFn: () => apiPinjaman.findAll(),
  });

  const { data: anggotaList = [] } = useQuery({
    queryKey: ["anggota-list"],
    queryFn: () => apiAnggota.findAll(),
  });

  // Map Anggota
  const anggotaMap = useMemo(() => new Map(anggotaList.map((a) => [a.id, a])), [anggotaList]);

  // Consolidate all transactions into a unified live structure
  const allTransactions: UnifiedTransaction[] = useMemo(() => {
    const list: UnifiedTransaction[] = [];

    // 1. Simpanan
    (simpananList as any[]).forEach((s: any) => {
      const a = s.anggota || (s.anggotaId ? anggotaMap.get(s.anggotaId) : null);
      const isTarik = s.tipe === "TARIK";
      const d = s.createdAt ? new Date(s.createdAt) : new Date();
      list.push({
        id: `SIMP-${s.id || s.anggotaId}`,
        refNo: s.noInvoice || `KW-SIMP-${String(s.id || s.anggotaId || "").slice(0, 8).toUpperCase()}`,
        kategori: "SIMPANAN",
        kategoriLabel: `Simpanan ${s.jenis || "Wajib"} (${isTarik ? "Penarikan" : "Setoran"})`,
        anggotaNama: a?.nama || s.nama || "Anggota Koperasi",
        anggotaNrp: a?.nrpNip || s.nrpNip || "-",
        nominal: Number(s.nominal || s.totalSimpanan || 0),
        tipeArus: isTarik ? "KELUAR" : "MASUK",
        metode: "Autodebet / Kas",
        status: "Berhasil",
        tanggal: d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
        waktu: d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        rawDate: d,
        keterangan: s.keterangan || `Setoran Simpanan ${s.jenis || ""}`,
      });
    });

    // 2. Pinjaman (Pencairan & Angsuran)
    pinjamanList.forEach((p: any) => {
      const a = p.anggota || (p.anggotaId ? anggotaMap.get(p.anggotaId) : null);
      const dCair = p.tanggalCair ? new Date(p.tanggalCair) : p.tanggalAjuan ? new Date(p.tanggalAjuan) : new Date();

      if (p.status === "DICAIRKAN" || p.status === "LUNAS") {
        list.push({
          id: `CAIR-${p.id}`,
          refNo: `SPK-USIPA-${p.id.slice(0, 8).toUpperCase()}`,
          kategori: "PINJAMAN_CAIR",
          kategoriLabel: "Pencairan Pinjaman USIPA",
          anggotaNama: a?.nama || "Anggota Koperasi",
          anggotaNrp: a?.nrpNip || "-",
          nominal: Number(p.nominal || 0),
          tipeArus: "KELUAR",
          metode: "Transfer Bank Mandiri / Kas",
          status: "Dicairkan",
          tanggal: dCair.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
          waktu: dCair.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          rawDate: dCair,
          keterangan: `Pencairan pinjaman tenor ${p.tenorBulan} bulan, bunga ${p.bungaPersenTahun}%`,
        });
      }

      // Angsuran yang sudah dibayar
      if (p.angsuran && Array.isArray(p.angsuran)) {
        p.angsuran.forEach((ang: any) => {
          if (ang.dibayar && ang.tanggalBayar) {
            const dBayar = new Date(ang.tanggalBayar);
            list.push({
              id: `ANG-${ang.id}`,
              refNo: ang.noInvoice || `KW-ANG-${ang.id.slice(0, 8).toUpperCase()}`,
              kategori: "ANGSURAN",
              kategoriLabel: `Angsuran Pinjaman Bulan ke-${ang.bulanKe}`,
              anggotaNama: a?.nama || "Anggota Koperasi",
              anggotaNrp: a?.nrpNip || "-",
              nominal: Number(ang.total || 0),
              tipeArus: "MASUK",
              metode: "Potong Gaji / Jurbay",
              status: "Lunas Bayar",
              tanggal: dBayar.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
              waktu: dBayar.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
              rawDate: dBayar,
              keterangan: `Pokok: ${formatRp(Number(ang.pokok))}, Bunga: ${formatRp(Number(ang.bunga))}`,
            });
          }
        });
      }
    });

    // 3. Tambahan data transaksi POS Toko & Gadai Mock/Live
    const samplePos: UnifiedTransaction[] = [
      {
        id: "POS-20260806-0001",
        refNo: "INV-POS-20260806-0001",
        kategori: "POS_TOKO",
        kategoriLabel: "Penjualan Kasir POS Toko",
        anggotaNama: "Sertu Hendra Gunawan",
        anggotaNrp: "31770091",
        nominal: 185000,
        tipeArus: "MASUK",
        metode: "QRIS Kasir",
        status: "Selesai",
        tanggal: "06 Agu 2026",
        waktu: "10:14",
        rawDate: new Date("2026-08-06T10:14:00"),
        keterangan: "Belanja sembako & snack barak (3 item)",
      },
      {
        id: "POS-20260806-0002",
        refNo: "INV-POS-20260806-0002",
        kategori: "POS_TOKO",
        kategoriLabel: "Penjualan Kasir POS Toko",
        anggotaNama: "Letkol Cba Dedi Kurnia",
        anggotaNrp: "11020033",
        nominal: 350000,
        tipeArus: "MASUK",
        metode: "Kredit Tempo",
        status: "Selesai (Tempo)",
        tanggal: "06 Agu 2026",
        waktu: "11:30",
        rawDate: new Date("2026-08-06T11:30:00"),
        keterangan: "Pembelian Sepatu PDL Kilap Jatah",
      },
      {
        id: "GD-20260715-0012",
        refNo: "SBG-20260715-0012",
        kategori: "GADAI",
        kategoriLabel: "Unit Gadai — Uang Pinjaman SBG",
        anggotaNama: "Serma Budi Santoso",
        anggotaNrp: "21980045",
        nominal: 10000000,
        tipeArus: "KELUAR",
        metode: "Kas Tunai Koperasi",
        status: "Aktif Berjalan",
        tanggal: "15 Jul 2026",
        waktu: "14:20",
        rawDate: new Date("2026-07-15T14:20:00"),
        keterangan: "Gadai Kalung Emas Kuning 22 Karat (10.5 gr)",
      },
      {
        id: "SUP-20260801-0001",
        refNo: "NOTA-IND-20260801",
        kategori: "SUPPLIER",
        kategoriLabel: "Pengadaan Stok — PT Indofood",
        anggotaNama: "Bpk. Bambang (Supplier)",
        anggotaNrp: "SUP-001",
        nominal: 8450000,
        tipeArus: "KELUAR",
        metode: "Transfer Giro BNI",
        status: "Lunas",
        tanggal: "01 Agu 2026",
        waktu: "09:00",
        rawDate: new Date("2026-08-01T09:00:00"),
        keterangan: "Pembelian 25 Dus Mie Instan & Minuman",
      },
    ];

    list.push(...samplePos);

    // Sort by latest date
    return list.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
  }, [simpananList, pinjamanList, anggotaMap]);

  // Filtered rows
  const filteredList = useMemo(() => {
    return allTransactions.filter((tx) => {
      // Tab category filter
      if (activeTab === "simpanan" && tx.kategori !== "SIMPANAN") return false;
      if (activeTab === "pinjaman" && tx.kategori !== "PINJAMAN_CAIR") return false;
      if (activeTab === "angsuran" && tx.kategori !== "ANGSURAN") return false;
      if (activeTab === "pos" && tx.kategori !== "POS_TOKO") return false;
      if (activeTab === "gadai" && tx.kategori !== "GADAI") return false;
      if (activeTab === "supplier" && tx.kategori !== "SUPPLIER") return false;

      // Arus filter
      if (filterArus !== "ALL" && tx.tipeArus !== filterArus) return false;

      // Search query
      if (q.trim()) {
        const query = q.toLowerCase();
        const match =
          tx.refNo.toLowerCase().includes(query) ||
          tx.anggotaNama.toLowerCase().includes(query) ||
          tx.anggotaNrp.includes(query) ||
          tx.kategoriLabel.toLowerCase().includes(query) ||
          tx.metode.toLowerCase().includes(query);
        if (!match) return false;
      }

      return true;
    });
  }, [allTransactions, activeTab, filterArus, q]);

  // Statistics calculation
  const stats = useMemo(() => {
    let totalMasuk = 0;
    let totalKeluar = 0;
    filteredList.forEach((tx) => {
      if (tx.tipeArus === "MASUK") totalMasuk += tx.nominal;
      else totalKeluar += tx.nominal;
    });
    return {
      totalCount: filteredList.length,
      totalMasuk,
      totalKeluar,
      netCashflow: totalMasuk - totalKeluar,
    };
  }, [filteredList]);

  // Handler for Excel Export
  const handleExportExcel = () => {
    const tabName =
      activeTab === "semua"
        ? "Semua Transaksi Koperasi"
        : activeTab === "simpanan"
        ? "Transaksi Simpanan Anggota"
        : activeTab === "pinjaman"
        ? "Transaksi Pencairan Pinjaman"
        : activeTab === "angsuran"
        ? "Transaksi Rekap Angsuran"
        : activeTab === "pos"
        ? "Transaksi Kasir POS Toko"
        : activeTab === "gadai"
        ? "Transaksi Unit Gadai & SBG"
        : "Transaksi Pengadaan Supplier";

    const filename = `Laporan_${tabName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}`;

    const headers = [
      "No. Referensi / Invoice",
      "Jenis / Kategori Transaksi",
      "Nama Personel / Pelanggan",
      "NRP / NIP",
      "Arus Kas",
      "Nominal (Rp)",
      "Metode Pembayaran",
      "Status",
      "Tanggal & Waktu",
      "Keterangan",
    ];

    const rows = filteredList.map((tx) => [
      tx.refNo,
      tx.kategoriLabel,
      tx.anggotaNama,
      tx.anggotaNrp,
      tx.tipeArus,
      tx.nominal,
      tx.metode,
      tx.status,
      `${tx.tanggal} ${tx.waktu}`,
      tx.keterangan,
    ]);

    const summary = [
      { label: "Total Transaksi Masuk (Inflow)", value: formatRp(stats.totalMasuk) },
      { label: "Total Transaksi Keluar (Outflow)", value: formatRp(stats.totalKeluar) },
      { label: "Net Cashflow (Selisih Bersih)", value: formatRp(stats.netCashflow) },
      { label: "Total Frekuensi Transaksi", value: `${stats.totalCount} Transaksi` },
    ];

    exportToExcel({
      filename,
      title: tabName,
      satminkal,
      headers,
      rows,
      summary,
    });

    toast.success("File Excel Berhasil Diunduh!", {
      description: `Laporan '${tabName}' (${filteredList.length} baris data) siap dibuka di MS Excel / Spreadsheet.`,
    });
  };

  const handleExportCSV = () => {
    const filename = `Data_Transaksi_${activeTab}_${Date.now()}`;
    const headers = [
      "No. Referensi",
      "Jenis Transaksi",
      "Nama",
      "NRP",
      "Arus",
      "Nominal",
      "Metode",
      "Status",
      "Tanggal",
      "Waktu",
      "Keterangan",
    ];
    const rows = filteredList.map((tx) => [
      tx.refNo,
      tx.kategoriLabel,
      tx.anggotaNama,
      tx.anggotaNrp,
      tx.tipeArus,
      tx.nominal,
      tx.metode,
      tx.status,
      tx.tanggal,
      tx.waktu,
      tx.keterangan,
    ]);

    exportToCSV(filename, headers, rows);
    toast.success("File CSV Berhasil Diunduh!");
  };

  const isLoading = loadSimpanan || loadPinjaman;

  return (
    <div className="space-y-6">
      {/* Top Statistics Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card border-primary/25 bg-card">
          <CardHeader className="pb-1">
            <CardDescription className="flex items-center justify-between text-xs">
              <span>Total Transaksi Masuk</span>
              <ArrowDownLeft className="size-4 text-emerald-500" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatRp(stats.totalMasuk)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Setoran, angsuran &amp; kasir</p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-destructive/25 bg-card">
          <CardHeader className="pb-1">
            <CardDescription className="flex items-center justify-between text-xs">
              <span>Total Transaksi Keluar</span>
              <ArrowUpRight className="size-4 text-destructive" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-extrabold text-destructive">
              {formatRp(stats.totalKeluar)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Pencairan pinjaman &amp; supplier</p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-gold/25 bg-card">
          <CardHeader className="pb-1">
            <CardDescription className="flex items-center justify-between text-xs">
              <span>Net Saldo Transaksi</span>
              <Receipt className="size-4 text-gold" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-extrabold text-foreground">
              {formatRp(stats.netCashflow)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Selisih kas berjalan</p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-blue-500/25 bg-card">
          <CardHeader className="pb-1">
            <CardDescription className="flex items-center justify-between text-xs">
              <span>Volume Transaksi</span>
              <ArrowLeftRight className="size-4 text-blue-500" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
              {stats.totalCount} Data
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Catatan transaksi terlacak</p>
          </CardContent>
        </Card>
      </div>

      {/* Submenu Tabs Navigation & Export Tools */}
      <Card className="shadow-card">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                <FileSpreadsheet className="size-5 text-primary" />
                Rekapitulasi &amp; Submenu Transaksi Koperasi
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Pencatatan komprehensif seluruh transaksi keuangan, unit toko, simpan pinjam, dan gadai
              </CardDescription>
            </div>

            {/* Export Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="text-xs h-9"
                title="Ekspor format CSV"
              >
                <Download className="mr-1.5 size-3.5" /> CSV
              </Button>
              <Button
                size="sm"
                onClick={handleExportExcel}
                className="text-xs h-9 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-sm"
              >
                <FileSpreadsheet className="mr-1.5 size-3.5" /> Ekspor ke Excel (.xls)
              </Button>
            </div>
          </div>

          {/* Submenu Tabs List */}
          <div className="mt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 h-auto p-1 bg-muted/60">
                <TabsTrigger value="semua" className="text-xs py-2">
                  Semua ({allTransactions.length})
                </TabsTrigger>
                <TabsTrigger value="simpanan" className="text-xs py-2">
                  <PiggyBank className="size-3 mr-1" /> Simpanan
                </TabsTrigger>
                <TabsTrigger value="pinjaman" className="text-xs py-2">
                  <HandCoins className="size-3 mr-1" /> Pinjaman
                </TabsTrigger>
                <TabsTrigger value="angsuran" className="text-xs py-2">
                  <Receipt className="size-3 mr-1" /> Angsuran
                </TabsTrigger>
                <TabsTrigger value="pos" className="text-xs py-2">
                  <ShoppingCart className="size-3 mr-1" /> POS Toko
                </TabsTrigger>
                <TabsTrigger value="gadai" className="text-xs py-2">
                  <Gem className="size-3 mr-1" /> Gadai
                </TabsTrigger>
                <TabsTrigger value="supplier" className="text-xs py-2">
                  <Truck className="size-3 mr-1" /> Supplier
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari no. ref, invoice, nama personel, NRP, keterangan..."
                className="pl-9 h-9 text-xs"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={filterArus} onValueChange={(v: any) => setFilterArus(v)}>
                <SelectTrigger className="h-9 text-xs w-36">
                  <Filter className="size-3 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Arus Kas" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="ALL">Semua Arus</SelectItem>
                  <SelectItem value="MASUK">Kas Masuk (In)</SelectItem>
                  <SelectItem value="KELUAR">Kas Keluar (Out)</SelectItem>
                </SelectContent>
              </Select>

              <Badge variant="outline" className="text-[11px] font-mono h-9 px-3 flex items-center">
                {filteredList.length} Item
              </Badge>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-10">No.</TableHead>
                  <TableHead>No. Ref / Invoice</TableHead>
                  <TableHead>Kategori Transaksi</TableHead>
                  <TableHead>Personel / Pelanggan</TableHead>
                  <TableHead>Arus</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-12 text-center text-muted-foreground">
                      <Loader2 className="mx-auto size-6 animate-spin mb-2 text-primary" />
                      Memuat data transaksi dari server...
                    </TableCell>
                  </TableRow>
                ) : filteredList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-12 text-center text-muted-foreground">
                      Tidak ada transaksi yang sesuai dengan filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredList.map((tx, idx) => (
                    <TableRow key={tx.id} className="hover:bg-muted/50 transition-colors text-xs">
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-mono font-semibold text-primary">
                        {tx.refNo}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-foreground">{tx.kategoriLabel}</span>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-foreground">{tx.anggotaNama}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">NRP: {tx.anggotaNrp}</p>
                      </TableCell>
                      <TableCell>
                        {tx.tipeArus === "MASUK" ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">
                            Masuk
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-[10px]">
                            Keluar
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold font-mono">
                        <span className={tx.tipeArus === "MASUK" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}>
                          {tx.tipeArus === "MASUK" ? "+" : "-"} {formatRp(tx.nominal)}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-[11px]">{tx.metode}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] font-medium">
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-[11px]">
                        <p>{tx.tanggal}</p>
                        <p className="text-[10px] font-mono">{tx.waktu}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          title="Lihat Detail Transaksi"
                          onClick={() => setSelectedTx(tx)}
                        >
                          <Eye className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Detail Transaksi */}
      <Dialog open={!!selectedTx} onOpenChange={(o) => !o && setSelectedTx(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="size-5 text-primary" /> Rincian Bukti Transaksi
            </DialogTitle>
            <DialogDescription>
              Detail transaksi tercatat pada sistem pembukuan Casheva Koperasi TNI AD
            </DialogDescription>
          </DialogHeader>
          {selectedTx && (
            <div className="space-y-4 py-2 text-xs">
              <div className="rounded-xl border p-4 bg-muted/30 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Nomor Referensi:</span>
                  <span className="font-mono font-bold text-primary text-sm">{selectedTx.refNo}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Kategori Transaksi:</span>
                  <span className="font-semibold">{selectedTx.kategoriLabel}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Personel Terkait:</span>
                  <span className="font-semibold">{selectedTx.anggotaNama} (NRP: {selectedTx.anggotaNrp})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Arus Kas:</span>
                  <Badge variant="outline" className={selectedTx.tipeArus === "MASUK" ? "text-emerald-600 bg-emerald-50" : "text-destructive bg-destructive/10"}>
                    {selectedTx.tipeArus === "MASUK" ? "KAS MASUK (+)" : "KAS KELUAR (-)"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-sm font-semibold">Total Nominal:</span>
                  <span className="text-base font-extrabold text-foreground">{formatRp(selectedTx.nominal)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border p-2.5 bg-card">
                  <p className="text-muted-foreground text-[10px]">Metode Pembayaran</p>
                  <p className="font-semibold mt-0.5">{selectedTx.metode}</p>
                </div>
                <div className="rounded-lg border p-2.5 bg-card">
                  <p className="text-muted-foreground text-[10px]">Waktu Transaksi</p>
                  <p className="font-semibold mt-0.5">{selectedTx.tanggal} {selectedTx.waktu} WIB</p>
                </div>
              </div>

              <div className="rounded-lg border p-2.5 bg-card">
                <p className="text-muted-foreground text-[10px]">Catatan / Keterangan</p>
                <p className="font-medium mt-0.5 text-foreground">{selectedTx.keterangan || "-"}</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast.success("Bukti transaksi siap dicetak");
                    window.print();
                  }}
                >
                  Cetak Struk / Bukti
                </Button>
                <Button size="sm" onClick={() => setSelectedTx(null)}>
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
