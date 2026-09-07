import { useState } from "react";
import {
  Search,
  Receipt,
  Printer,
  Calendar,
  Filter,
  DollarSign,
  TrendingUp,
  CreditCard,
  ShoppingBag,
  Clock,
  Eye,
  X,
  FileSpreadsheet,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRupiah } from "@/lib/casheva-data";

interface TransaksiItem {
  id: string;
  nomorStruk: string;
  tanggal: string;
  kasir: string;
  pelanggan: string;
  tipePelanggan: "Anggota" | "Umum";
  items: { nama: string; qty: number; satuan: string; harga: number; subtotal: number }[];
  totalItem: number;
  totalBelanja: number;
  diskon: number;
  totalAkhir: number;
  metodeBayar: "TUNAI" | "QRIS" | "POTONG_GAJI" | "KREDIT_TEMPO";
  bayar: number;
  kembalian: number;
  status: "LUNAS" | "TEMPO" | "BATAL";
}

const DEMO_TRANSAKSI: TransaksiItem[] = [
  {
    id: "TRX-001",
    nomorStruk: "STR-20260907-001",
    tanggal: "2026-09-07 09:30:15",
    kasir: "Kopda Hendra S.",
    pelanggan: "Serka Bambang Prasetyo",
    tipePelanggan: "Anggota",
    items: [
      { nama: "Beras Rojolele Super 5kg", qty: 2, satuan: "Sak", harga: 72000, subtotal: 144000 },
      { nama: "Minyak Goreng Bimoli 2L", qty: 2, satuan: "Pouch", harga: 38000, subtotal: 76000 },
      { nama: "Gula Pasir Gulaku 1kg", qty: 3, satuan: "Bungkus", harga: 17500, subtotal: 52500 },
    ],
    totalItem: 7,
    totalBelanja: 272500,
    diskon: 0,
    totalAkhir: 272500,
    metodeBayar: "POTONG_GAJI",
    bayar: 272500,
    kembalian: 0,
    status: "LUNAS",
  },
  {
    id: "TRX-002",
    nomorStruk: "STR-20260907-002",
    tanggal: "2026-09-07 09:45:00",
    kasir: "Kopda Hendra S.",
    pelanggan: "Praka Eko Susanto",
    tipePelanggan: "Anggota",
    items: [
      { nama: "Sepatu PDL Loreng Jatah", qty: 1, satuan: "Pasang", harga: 385000, subtotal: 385000 },
      { nama: "Kaus Kaki Hitam Tebal TNI", qty: 3, satuan: "Pasang", harga: 18000, subtotal: 54000 },
    ],
    totalItem: 4,
    totalBelanja: 439000,
    diskon: 20000,
    totalAkhir: 419000,
    metodeBayar: "KREDIT_TEMPO",
    bayar: 419000,
    kembalian: 0,
    status: "TEMPO",
  },
  {
    id: "TRX-003",
    nomorStruk: "STR-20260907-003",
    tanggal: "2026-09-07 10:05:42",
    kasir: "Kopda Hendra S.",
    pelanggan: "Ibu Nurul (Persit)",
    tipePelanggan: "Anggota",
    items: [
      { nama: "Indomie Goreng Special", qty: 10, satuan: "Pcs", harga: 3100, subtotal: 31000 },
      { nama: "Susu Kental Manis Frisian Flag", qty: 2, satuan: "Kaleng", harga: 13500, subtotal: 27000 },
      { nama: "Teh Celup Sosro 30s", qty: 2, satuan: "Kotak", harga: 8500, subtotal: 17000 },
    ],
    totalItem: 14,
    totalBelanja: 75000,
    diskon: 0,
    totalAkhir: 75000,
    metodeBayar: "QRIS",
    bayar: 75000,
    kembalian: 0,
    status: "LUNAS",
  },
  {
    id: "TRX-004",
    nomorStruk: "STR-20260907-004",
    tanggal: "2026-09-07 10:18:20",
    kasir: "Kopda Hendra S.",
    pelanggan: "Warga Komplek / Umum",
    tipePelanggan: "Umum",
    items: [
      { nama: "Minyak Goreng Bimoli 2L", qty: 1, satuan: "Pouch", harga: 38000, subtotal: 38000 },
      { nama: "Kopi Kapal Api Special Mix 10s", qty: 2, satuan: "Renteng", harga: 16000, subtotal: 32000 },
    ],
    totalItem: 3,
    totalBelanja: 70000,
    diskon: 0,
    totalAkhir: 70000,
    metodeBayar: "TUNAI",
    bayar: 100000,
    kembalian: 30000,
    status: "LUNAS",
  },
];

export function TokoTransaksiWidget() {
  const [transaksiList] = useState<TransaksiItem[]>(DEMO_TRANSAKSI);
  const [search, setSearch] = useState("");
  const [filterMetode, setFilterMetode] = useState<string>("ALL");
  const [selectedTrx, setSelectedTrx] = useState<TransaksiItem | null>(null);
  const [isStrukOpen, setIsStrukOpen] = useState(false);

  const filtered = transaksiList.filter((t) => {
    const matchSearch =
      t.nomorStruk.toLowerCase().includes(search.toLowerCase()) ||
      t.pelanggan.toLowerCase().includes(search.toLowerCase()) ||
      t.kasir.toLowerCase().includes(search.toLowerCase());
    const matchMetode =
      filterMetode === "ALL" || t.metodeBayar === filterMetode;
    return matchSearch && matchMetode;
  });

  const totalOmset = transaksiList.reduce((acc, t) => acc + t.totalAkhir, 0);
  const totalItemTerjual = transaksiList.reduce((acc, t) => acc + t.totalItem, 0);

  const handlePrintStruk = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Omset Transaksi
            </CardTitle>
            <DollarSign className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatRupiah(totalOmset)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="size-3 text-emerald-500 inline" /> Transaksi Kasir Hari Ini
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transaksi
            </CardTitle>
            <Receipt className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {transaksiList.length} Struk
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {transaksiList.filter((t) => t.status === "LUNAS").length} Lunas,{" "}
              {transaksiList.filter((t) => t.status === "TEMPO").length} Tempo Kredit
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Item Terjual
            </CardTitle>
            <ShoppingBag className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalItemTerjual} Unit/Pcs
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Multi-kategori Toko Koperasi
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Metode Potong Gaji
            </CardTitle>
            <CreditCard className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatRupiah(
                transaksiList
                  .filter((t) => t.metodeBayar === "POTONG_GAJI")
                  .reduce((acc, t) => acc + t.totalAkhir, 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Terintegrasi dengan payroll simpan pinjam
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="size-5 text-primary" /> Riwayat Struk Kasir & Transaksi POS
              </CardTitle>
              <CardDescription>
                Daftar rekaman struk kasir, status pelunasan, dan opsi cetak ulang struk thermal.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <FileSpreadsheet className="size-4 text-emerald-600" /> Export Excel
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari No. Struk, Nama Anggota, atau Kasir..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="w-full sm:w-[200px]">
              <Select value={filterMetode} onValueChange={setFilterMetode}>
                <SelectTrigger>
                  <Filter className="size-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Metode Bayar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Metode</SelectItem>
                  <SelectItem value="TUNAI">Tunai (Cash)</SelectItem>
                  <SelectItem value="QRIS">QRIS Statis/Dinamis</SelectItem>
                  <SelectItem value="POTONG_GAJI">Potong Gaji</SelectItem>
                  <SelectItem value="KREDIT_TEMPO">Kredit Toko (Tempo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 font-semibold">
                  <TableHead>No. Struk</TableHead>
                  <TableHead>Waktu Transaksi</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Kasir</TableHead>
                  <TableHead>Total Item</TableHead>
                  <TableHead>Metode Bayar</TableHead>
                  <TableHead className="text-right">Total Tagihan</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      Tidak ada data transaksi yang sesuai filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((trx) => (
                    <TableRow key={trx.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs font-semibold text-primary">
                        {trx.nomorStruk}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {trx.tanggal}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{trx.pelanggan}</div>
                        <Badge
                          variant="outline"
                          className={
                            trx.tipePelanggan === "Anggota"
                              ? "text-xs border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
                              : "text-xs text-muted-foreground"
                          }
                        >
                          {trx.tipePelanggan}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{trx.kasir}</TableCell>
                      <TableCell className="text-sm">{trx.totalItem} pcs</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-medium text-xs">
                          {trx.metodeBayar.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm">
                        {formatRupiah(trx.totalAkhir)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            trx.status === "LUNAS"
                              ? "default"
                              : trx.status === "TEMPO"
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-xs"
                        >
                          {trx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => {
                            setSelectedTrx(trx);
                            setIsStrukOpen(true);
                          }}
                        >
                          <Eye className="size-3.5" /> Struk
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

      {/* Struk Thermal Dialog */}
      <Dialog open={isStrukOpen} onOpenChange={setIsStrukOpen}>
        <DialogContent className="max-w-sm sm:max-w-md p-6 bg-background">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between border-b pb-2">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Receipt className="size-4 text-primary" /> Cetak Ulang Struk Kasir
              </span>
            </DialogTitle>
          </DialogHeader>

          {selectedTrx && (
            <div className="space-y-4">
              {/* Thermal Receipt Paper Layout */}
              <div className="rounded-md border border-dashed p-4 font-mono text-xs bg-muted/20 space-y-2">
                <div className="text-center space-y-0.5 border-b border-dashed pb-2">
                  <div className="font-bold text-sm">PRIMKOPPOL / KOPERASI TNI AD</div>
                  <div className="text-[10px] text-muted-foreground">KODIM 0733 / BS SEMARANG</div>
                  <div className="text-[10px] text-muted-foreground">Jl. Pemuda No. 123, Semarang</div>
                  <div className="text-[10px] text-muted-foreground">Telp: (024) 8412345</div>
                </div>

                <div className="flex justify-between text-[11px]">
                  <span>No. Struk:</span>
                  <span className="font-bold">{selectedTrx.nomorStruk}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Waktu:</span>
                  <span>{selectedTrx.tanggal}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Kasir:</span>
                  <span>{selectedTrx.kasir}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Pelanggan:</span>
                  <span className="font-bold">{selectedTrx.pelanggan}</span>
                </div>

                <div className="border-b border-dashed my-2" />

                {/* Items */}
                <div className="space-y-1.5">
                  {selectedTrx.items.map((it, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="font-semibold text-[11px]">{it.nama}</div>
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>
                          {it.qty} {it.satuan} x {formatRupiah(it.harga)}
                        </span>
                        <span className="text-foreground font-medium">
                          {formatRupiah(it.subtotal)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-b border-dashed my-2" />

                {/* Calculation */}
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatRupiah(selectedTrx.totalBelanja)}</span>
                  </div>
                  {selectedTrx.diskon > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Diskon Promo</span>
                      <span>-{formatRupiah(selectedTrx.diskon)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-xs pt-1 border-t border-dashed">
                    <span>TOTAL AKHIR</span>
                    <span>{formatRupiah(selectedTrx.totalAkhir)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] pt-1">
                    <span>Metode Bayar:</span>
                    <span className="font-semibold">{selectedTrx.metodeBayar.replace("_", " ")}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Bayar:</span>
                    <span>{formatRupiah(selectedTrx.bayar)}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Kembalian:</span>
                    <span>{formatRupiah(selectedTrx.kembalian)}</span>
                  </div>
                </div>

                <div className="border-b border-dashed my-2" />

                <div className="text-center text-[10px] text-muted-foreground pt-1 space-y-0.5">
                  <p>Terima kasih atas kunjungan Anda</p>
                  <p>Belanja di Koperasi, Membangun Kesejahteraan Prajurit</p>
                  <p className="font-semibold text-[9px]">BARANG YANG SUDAH DIBELI DAPAT DITUKAR MAKS 1X24 JAM</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button className="w-full gap-2" onClick={handlePrintStruk}>
                  <Printer className="size-4" /> Cetak ke Thermal Printer (58/80mm)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsStrukOpen(false)}
                >
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
