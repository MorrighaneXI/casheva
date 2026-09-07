import { useState, useMemo } from "react";
import {
  ShoppingBag,
  Search,
  Zap,
  Truck,
  Clock,
  Shield,
  Plus,
  Minus,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  Calculator,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

import {
  masterProdukList,
  kategoriProdukList,
  formatRp,
  hitungCicilanBarang,
  type Produk,
} from "@/lib/casheva-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type CartItem = {
  produk: Produk;
  jumlah: number;
};

export function KatalogBelanjaWidget() {
  const [search, setSearch] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("ALL");
  const [filterFastConsume, setFilterFastConsume] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Modal Simulasi Cicilan
  const [isSimulasiOpen, setIsSimulasiOpen] = useState(false);
  const [simulasiProduk, setSimulasiProduk] = useState<Produk | null>(null);
  const [simulasiTenor, setSimulasiTenor] = useState(3);

  // Modal Checkout Pemesanan Online
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [tipePengambilan, setTipePengambilan] = useState<"AMBIL_SENDIRI" | "TITIP_PIKET_SATUAN" | "DELIVERY_CEPAT">("DELIVERY_CEPAT");
  const [lokasiBarak, setLokasiBarak] = useState("Barak Remaja Batalyon B - Lt. 2");
  const [petugasPiket, setPetugasPiket] = useState("Serda Yoga Pratama (Piket Jaga)");
  const [noHp, setNoHp] = useState("081398765432");
  const [metodeBayar, setMetodeBayar] = useState<"TUNAI" | "QRIS" | "KREDIT_TEMPO">("KREDIT_TEMPO");

  const filteredProduk = useMemo(() => {
    return masterProdukList.filter((p) => {
      const matchCat = selectedKategori === "ALL" || p.kategoriId === selectedKategori;
      const matchSearch = p.nama.toLowerCase().includes(search.toLowerCase());
      const matchFast = !filterFastConsume || p.isFastConsume;
      return matchCat && matchSearch && matchFast;
    });
  }, [search, selectedKategori, filterFastConsume]);

  const totalBelanja = useMemo(() => {
    return cart.reduce((acc, item) => {
      const disc = item.produk.isPromo
        ? (item.produk.hargaJual * item.produk.diskonPersen) / 100
        : 0;
      return acc + (item.produk.hargaJual - disc) * item.jumlah;
    }, 0);
  }, [cart]);

  const ongkir = tipePengambilan === "DELIVERY_CEPAT" ? 5000 : 0;
  const totalTagihan = totalBelanja + ongkir;

  const addToCart = (produk: Produk) => {
    if (produk.stokFisik <= 0) {
      toast.error("Stok barang habis");
      return;
    }
    setCart((prev) => {
      const exist = prev.find((item) => item.produk.id === produk.id);
      if (exist) {
        return prev.map((item) =>
          item.produk.id === produk.id ? { ...item, jumlah: item.jumlah + 1 } : item
        );
      }
      return [...prev, { produk, jumlah: 1 }];
    });
    toast.success(`+1 ${produk.nama} dimasukkan ke keranjang`);
  };

  const updateJumlah = (produkId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.produk.id === produkId ? { ...item, jumlah: item.jumlah + delta } : item
        )
        .filter((item) => item.jumlah > 0)
    );
  };

  const handleOpenSimulasi = (p: Produk) => {
    setSimulasiProduk(p);
    setSimulasiTenor(3);
    setIsSimulasiOpen(true);
  };

  const handleBuatPesanan = () => {
    if (cart.length === 0) return;

    const nomorPesanan = `ORD-${Date.now().toString().slice(-8)}`;

    toast.success(`Pesanan ${nomorPesanan} Berhasil Dibuat!`, {
      description:
        tipePengambilan === "TITIP_PIKET_SATUAN"
          ? `Pesanan akan dititipkan di meja piket: ${petugasPiket}`
          : tipePengambilan === "DELIVERY_CEPAT"
          ? `Estimasi pengantaran ke ${lokasiBarak} dalam 30 menit (Garansi SLA)`
          : "Silakan ambil pesanan di meja kasir koperasi",
    });

    setIsCheckoutOpen(false);
    setCart([]);
  };

  return (
    <div className="space-y-6">
      {/* Banner Promo & Info Layanan Hari Libur */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-primary to-emerald-800 p-6 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-2.5">
          <div className="inline-flex items-center gap-2 rounded-full bg-gold/20 px-3 py-1 text-xs font-bold text-gold border border-gold/40">
            <Sparkles className="size-3.5" /> Layanan Belanja Koperasi Terpadu
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Katalog Belanja Satuan & Fast Consume
          </h2>
          <p className="text-sm text-emerald-100/90 leading-relaxed">
            Belanja sembako, makanan barak, kaporlap, dan produk UMKM Persit. 
            <b> Tetap melayani pada hari libur via dititipkan di Meja Piket Penjagaan Satuan</b> atau pesan antar cepat dengan estimasi 30 menit!
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <div className="flex items-center gap-1.5 text-xs bg-black/25 px-3 py-1.5 rounded-lg border border-white/10">
              <Clock className="size-4 text-gold" /> Layanan Piket 24 Jam
            </div>
            <div className="flex items-center gap-1.5 text-xs bg-black/25 px-3 py-1.5 rounded-lg border border-white/10">
              <Truck className="size-4 text-emerald-300" /> Fast Delivery + Garansi SLA
            </div>
            <div className="flex items-center gap-1.5 text-xs bg-black/25 px-3 py-1.5 rounded-lg border border-white/10">
              <Calendar className="size-4 text-amber-300" /> Kredit Tempo Potong Gaji
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-12 -top-12 size-64 rounded-full bg-gold/15 blur-3xl" />
        <div className="absolute -right-6 -bottom-6 size-48 rounded-full bg-emerald-400/20 blur-2xl" />
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-card space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari makanan, sembako, kaporlap..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-background text-xs"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant={filterFastConsume ? "default" : "outline"}
              onClick={() => setFilterFastConsume(!filterFastConsume)}
              className={`h-10 rounded-xl text-xs font-semibold gap-1.5 ${
                filterFastConsume ? "bg-emerald-600 text-white" : ""
              }`}
            >
              <Zap className="size-3.5 text-amber-400" />
              Fast Consume (Makanan/Minuman Cepat)
            </Button>
            {cart.length > 0 && (
              <Button
                onClick={() => setIsCheckoutOpen(true)}
                className="h-10 rounded-xl bg-primary text-primary-foreground font-bold gap-1.5 shadow-sm"
              >
                <ShoppingBag className="size-4" /> Keranjang ({cart.reduce((s, i) => s + i.jumlah, 0)})
              </Button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedKategori("ALL")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedKategori === "ALL"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            Semua ({masterProdukList.length})
          </button>
          {kategoriProdukList.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setSelectedKategori(k.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedKategori === k.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {k.nama}
            </button>
          ))}
        </div>
      </div>

      {/* Product Catalog Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProduk.map((prod) => {
          const hargaDiskon = prod.isPromo
            ? prod.hargaJual - (prod.hargaJual * prod.diskonPersen) / 100
            : prod.hargaJual;
          const isStokHabis = prod.stokFisik <= 0;

          return (
            <div
              key={prod.id}
              className="group rounded-2xl border border-border/80 bg-card p-3.5 shadow-card hover:border-primary/40 hover:shadow-card-hover transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-muted mb-3">
                  <img
                    src={prod.gambar}
                    alt={prod.nama}
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {prod.isFastConsume && (
                    <span className="absolute top-2 left-2 rounded-md bg-emerald-700 text-white text-[9px] font-bold px-2 py-0.5 shadow-sm flex items-center gap-1">
                      <Zap className="size-2.5 text-amber-300" /> Fast Consume
                    </span>
                  )}
                  {prod.isPromo && (
                    <span className="absolute top-2 right-2 rounded-md bg-destructive text-white text-[9px] font-bold px-1.5 py-0.5 shadow-sm">
                      -{prod.diskonPersen}%
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-medium block">
                    {prod.kategoriNama}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {prod.nama}
                  </h4>
                  {prod.penjualNama && (
                    <p className="text-[10px] text-primary font-medium">Oleh: {prod.penjualNama}</p>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-border/60 space-y-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-extrabold text-foreground font-mono">
                    {formatRp(hargaDiskon)}
                  </span>
                  {prod.isPromo && (
                    <span className="text-[11px] text-muted-foreground line-through font-mono">
                      {formatRp(prod.hargaJual)}
                    </span>
                  )}
                </div>

                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenSimulasi(prod)}
                    className="h-8 flex-1 rounded-lg text-[10px] font-semibold gap-1 px-1.5"
                  >
                    <Calculator className="size-3" /> Simulasi Cicilan
                  </Button>
                  <Button
                    size="sm"
                    disabled={isStokHabis}
                    onClick={() => addToCart(prod)}
                    className="h-8 rounded-lg bg-primary text-primary-foreground font-bold text-[11px] px-3 gap-1"
                  >
                    <Plus className="size-3.5" /> Beli
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DIALOG SIMULASI CICILAN BARANG */}
      <Dialog open={isSimulasiOpen} onOpenChange={setIsSimulasiOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Calculator className="size-4 text-primary" /> Simulasi Cicilan Kredit Toko
            </DialogTitle>
          </DialogHeader>

          {simulasiProduk && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="p-3 bg-muted/40 rounded-xl border border-border flex items-center gap-3">
                <div className="size-12 rounded-lg bg-muted overflow-hidden shrink-0 border">
                  <img src={simulasiProduk.gambar} alt={simulasiProduk.nama} className="size-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-foreground text-sm truncate">{simulasiProduk.nama}</p>
                  <p className="text-primary font-bold font-mono text-sm">{formatRp(simulasiProduk.hargaJual)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-foreground block">Pilihan Tenor Cicilan:</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 6, 12].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSimulasiTenor(t)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        simulasiTenor === t
                          ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                          : "border-border hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      <p className="text-xs font-bold">{t} Bulan</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculation Result */}
              {(() => {
                const cicil = hitungCicilanBarang(simulasiProduk.hargaJual, simulasiTenor);
                return (
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="font-semibold text-muted-foreground">Angsuran per Bulan:</span>
                      <span className="text-xl font-black text-primary font-mono">
                        {formatRp(cicil.angsuranBulanan)} / bln
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground pt-1 border-t border-primary/15">
                      <span>Total Biaya ({simulasiTenor}x):</span>
                      <span className="font-bold font-mono text-foreground">{formatRp(cicil.totalBayar)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>Skema Pembayaran:</span>
                      <span className="font-bold text-foreground">Potong Gaji Bulanan</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="w-1/3 rounded-xl" onClick={() => setIsSimulasiOpen(false)}>
                  Tutup
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-primary text-primary-foreground font-bold"
                  onClick={() => {
                    addToCart(simulasiProduk);
                    setIsSimulasiOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                >
                  Ajukan Kredit Barang Ini
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG CHECKOUT PESANAN ONLINE & TITIP PIKET */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Konfirmasi Pesanan & Layanan Pengantaran</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            {/* Opsi Tipe Pengambilan */}
            <div className="space-y-2">
              <label className="font-bold text-foreground block">Pilih Cara Pengambilan / Pengantaran:</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTipePengambilan("DELIVERY_CEPAT")}
                  className={`p-3 rounded-xl border text-left transition-all space-y-1 ${
                    tipePengambilan === "DELIVERY_CEPAT"
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                      : "border-border hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <p className="font-bold text-xs flex items-center gap-1.5">
                    <Truck className="size-3.5" /> Antar ke Barak
                  </p>
                  <p className="text-[10px] font-normal leading-tight">Fast delivery SLA 30 mnt (+Rp 5.000)</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTipePengambilan("TITIP_PIKET_SATUAN")}
                  className={`p-3 rounded-xl border text-left transition-all space-y-1 ${
                    tipePengambilan === "TITIP_PIKET_SATUAN"
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                      : "border-border hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <p className="font-bold text-xs flex items-center gap-1.5">
                    <Shield className="size-3.5" /> Titip di Meja Piket
                  </p>
                  <p className="text-[10px] font-normal leading-tight">Layanan hari libur / pos jaga satuan</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTipePengambilan("AMBIL_SENDIRI")}
                  className={`p-3 rounded-xl border text-left transition-all space-y-1 ${
                    tipePengambilan === "AMBIL_SENDIRI"
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                      : "border-border hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <p className="font-bold text-xs flex items-center gap-1.5">
                    <ShoppingBag className="size-3.5" /> Ambil di Toko
                  </p>
                  <p className="text-[10px] font-normal leading-tight">Ambil langsung di kasir toko</p>
                </button>
              </div>
            </div>

            {/* Destination / Piket Info Form */}
            {tipePengambilan === "DELIVERY_CEPAT" && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2.5">
                <p className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Clock className="size-3.5" /> Garansi Layanan Cepat (SLA 30 Menit)
                </p>
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Lokasi Pengantaran (Barak / Satuan):</label>
                  <Input
                    value={lokasiBarak}
                    onChange={(e) => setLokasiBarak(e.target.value)}
                    placeholder="Contoh: Barak Batalyon C, Kamar 12"
                    className="h-9 text-xs bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Nomor Telepon / WA Pemesan:</label>
                  <Input
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    className="h-9 text-xs bg-background"
                  />
                </div>
              </div>
            )}

            {tipePengambilan === "TITIP_PIKET_SATUAN" && (
              <div className="p-3.5 bg-accent/30 border border-gold/30 rounded-xl space-y-2.5">
                <p className="font-bold text-accent-foreground flex items-center gap-1.5">
                  <Shield className="size-3.5" /> Layanan Hari Libur: Penitipan di Meja Piket
                </p>
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Petugas Jaga Piket Penerima:</label>
                  <Input
                    value={petugasPiket}
                    onChange={(e) => setPetugasPiket(e.target.value)}
                    placeholder="Contoh: Serda Yoga Pratama (Piket Jaga)"
                    className="h-9 text-xs bg-background"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Barang akan diserahkan oleh petugas toko ke pos piket jaga. Anggota dapat mengambil barang kapan saja dengan menunjukkan NRP/identitas.
                </p>
              </div>
            )}

            {/* Metode Bayar */}
            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Metode Pembayaran:</label>
              <select
                value={metodeBayar}
                onChange={(e) => setMetodeBayar(e.target.value as any)}
                className="w-full h-10 rounded-xl bg-background border border-border px-3 font-medium text-xs"
              >
                <option value="KREDIT_TEMPO">Kredit Tempo (Potong Gaji Bulan Depan)</option>
                <option value="QRIS">QRIS Dinamis Koperasi</option>
                <option value="TUNAI">Tunai saat Barang Diterima (COD)</option>
              </select>
            </div>

            {/* Price Summary */}
            <div className="p-3.5 bg-muted/40 rounded-xl border border-border space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span>Subtotal Barang:</span>
                <span className="font-mono font-bold">{formatRp(totalBelanja)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ongkos Kirim:</span>
                <span className="font-mono font-bold">{ongkir === 0 ? "GRATIS" : formatRp(ongkir)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-border">
                <span>Total Tagihan:</span>
                <span className="font-mono text-primary font-black">{formatRp(totalTagihan)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="w-1/3 rounded-xl" onClick={() => setIsCheckoutOpen(false)}>
                Batal
              </Button>
              <Button
                className="flex-1 rounded-xl bg-primary text-primary-foreground font-bold"
                onClick={handleBuatPesanan}
              >
                Konfirmasi & Kirim Pesanan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
