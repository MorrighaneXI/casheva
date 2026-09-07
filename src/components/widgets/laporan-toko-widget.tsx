import { useState } from "react";
import {
  FileBarChart,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  Boxes,
  CreditCard,
  Building2,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";

import {
  formatRp,
  masterProdukList,
} from "@/lib/casheva-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function LaporanTokoWidget() {
  const [periode, setPeriode] = useState("BULAN_INI");

  const ringkasan = {
    totalPenjualan: 48500000,
    totalHpp: 39800000,
    labaKotor: 8700000,
    marginPersen: 17.9,
    totalTransaksi: 342,
    piutangKreditBarang: 6450000,
    hutangSupplier: 21050000,
  };

  const produkTerlaris = [
    { nama: "Beras Premium Koperasi 5 Kg", kategori: "Sembako", terjual: 145, omset: 10730000, laba: 870000 },
    { nama: "Minyak Goreng Sawit 2 Liter", kategori: "Sembako", terjual: 210, omset: 7350000, laba: 735000 },
    { nama: "Kopi Hitam Prajurit Sachet", kategori: "Fast Consume", terjual: 380, omset: 5700000, laba: 1140000 },
    { nama: "Mie Instan Goreng (Dus)", kategori: "Fast Consume", terjual: 42, omset: 5040000, laba: 504000 },
    { nama: "Kaos Dalam Loreng TNI AD", kategori: "Kaporlap", terjual: 65, omset: 3120000, laba: 650000 },
  ];

  const handleExport = () => {
    toast.success("Laporan Keuangan Toko & HPP berhasil diunduh dalam format Excel (.xlsx)!");
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-card flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
            <FileBarChart className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Rekapitulasi Penjualan, HPP & Laba Kotor Toko</h3>
            <p className="text-[11px] text-muted-foreground">Analisis performa unit usaha koperasi</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
            className="h-9 text-xs rounded-xl bg-background border border-border px-2.5 font-medium"
          >
            <option value="HARI_INI">Hari Ini (Real-Time)</option>
            <option value="BULAN_INI">Bulan Berjalan (Agustus 2026)</option>
            <option value="TAHUN_INI">Tahun Buku 2026</option>
          </select>

          <Button
            onClick={handleExport}
            className="h-9 text-xs font-bold rounded-xl bg-primary text-primary-foreground gap-1.5 shadow-sm"
          >
            <Download className="size-3.5" /> Export Excel
          </Button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-card">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Penjualan Kotor</span>
          <p className="text-2xl font-black text-foreground font-mono mt-1">{formatRp(ringkasan.totalPenjualan)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">{ringkasan.totalTransaksi} struk transaksi</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-card">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Modal Pokok Terjual (HPP)</span>
          <p className="text-2xl font-black text-muted-foreground font-mono mt-1">{formatRp(ringkasan.totalHpp)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Biaya pengadaan barang dagang</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-card">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="size-3.5" /> Laba Kotor Unit Toko
          </span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">{formatRp(ringkasan.labaKotor)}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Margin Profit: {ringkasan.marginPersen}%</p>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-card">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Piutang Kredit Belanja</span>
          <p className="text-2xl font-black text-primary font-mono mt-1">{formatRp(ringkasan.piutangKreditBarang)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Tagihan cicilan potong gaji aktif</p>
        </div>
      </div>

      {/* Top Selling Products Table */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-card space-y-4">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Package className="size-4 text-primary" /> 5 Produk Terlaris & Kontribusi Margin Laba
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted text-muted-foreground font-bold">
              <tr>
                <th className="p-3">Nama Produk</th>
                <th className="p-3">Kategori</th>
                <th className="p-3 text-center">Volume Terjual</th>
                <th className="p-3 text-right">Total Omset</th>
                <th className="p-3 text-right">Kontribusi Laba Bersih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {produkTerlaris.map((p, idx) => (
                <tr key={idx} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-bold text-foreground">{p.nama}</td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-[10px]">
                      {p.kategori}
                    </Badge>
                  </td>
                  <td className="p-3 text-center font-bold font-mono">{p.terjual} Pcs</td>
                  <td className="p-3 text-right font-mono font-bold">{formatRp(p.omset)}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    +{formatRp(p.laba)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
