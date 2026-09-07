import { useState, useMemo } from "react";
import {
  Search,
  Barcode,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  Printer,
  CreditCard,
  QrCode,
  Banknote,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

import {
  masterProdukList,
  anggotaList,
  kategoriProdukList,
  formatRp,
  hitungCicilanBarang,
  type Produk,
  type Anggota,
} from "@/lib/casheva-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type CartItem = {
  produk: Produk;
  jumlah: number;
};

export function PosWidget() {
  const [search, setSearch] = useState("");
  const [selectedKategori, setSelectedKategori] = useState<string>("ALL");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedAnggotaNrp, setSelectedAnggotaNrp] = useState<string>("");
  const [namaPembeliUmum, setNamaPembeliUmum] = useState<string>("");

  // Payment Modal States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [metodeBayar, setMetodeBayar] = useState<"TUNAI" | "QRIS" | "KREDIT_TEMPO">("TUNAI");
  const [nominalBayarTunai, setNominalBayarTunai] = useState<number>(0);
  const [tenorKredit, setTenorKredit] = useState<number>(3);
  const [lastInvoice, setLastInvoice] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const selectedAnggota = useMemo(
    () => anggotaList.find((a) => a.nrp === selectedAnggotaNrp),
    [selectedAnggotaNrp]
  );

  const filteredProduk = useMemo(() => {
    return masterProdukList.filter((p) => {
      const matchCat = selectedKategori === "ALL" || p.kategoriId === selectedKategori;
      const matchSearch =
        p.nama.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.includes(search);
      return matchCat && matchSearch;
    });
  }, [search, selectedKategori]);

  const totalBelanja = useMemo(() => {
    return cart.reduce((acc, item) => {
      const disc = item.produk.isPromo
        ? (item.produk.hargaJual * item.produk.diskonPersen) / 100
        : 0;
      return acc + (item.produk.hargaJual - disc) * item.jumlah;
    }, 0);
  }, [cart]);

  const totalDiskon = useMemo(() => {
    return cart.reduce((acc, item) => {
      const disc = item.produk.isPromo
        ? (item.produk.hargaJual * item.produk.diskonPersen) / 100
        : 0;
      return acc + disc * item.jumlah;
    }, 0);
  }, [cart]);

  const totalPoinDidapat = Math.floor(totalBelanja / 10000);

  const addToCart = (produk: Produk) => {
    if (produk.stokFisik <= 0) {
      toast.error(`Stok "${produk.nama}" habis!`);
      return;
    }
    setCart((prev) => {
      const exist = prev.find((item) => item.produk.id === produk.id);
      if (exist) {
        if (exist.jumlah >= produk.stokFisik) {
          toast.error(`Jumlah melebihi stok fisik (${produk.stokFisik})`);
          return prev;
        }
        return prev.map((item) =>
          item.produk.id === produk.id ? { ...item, jumlah: item.jumlah + 1 } : item
        );
      }
      return [...prev, { produk, jumlah: 1 }];
    });
    toast.success(`+1 ${produk.nama} dimasukkan ke keranjang`);
  };

  const updateJumlah = (produkId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.produk.id === produkId) {
            const next = item.jumlah + delta;
            if (next > item.produk.stokFisik) {
              toast.error(`Stok tidak mencukupi (Maks: ${item.produk.stokFisik})`);
              return item;
            }
            return { ...item, jumlah: next };
          }
          return item;
        })
        .filter((item) => item.jumlah > 0);
    });
  };

  const removeFromCart = (produkId: string) => {
    setCart((prev) => prev.filter((item) => item.produk.id !== produkId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedAnggotaNrp("");
    setNamaPembeliUmum("");
  };

  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && search.trim()) {
      const found = masterProdukList.find(
        (p) => p.barcode === search.trim() || p.nama.toLowerCase().includes(search.toLowerCase())
      );
      if (found) {
        addToCart(found);
        setSearch("");
      } else {
        toast.error(`Barcode / Produk "${search}" tidak ditemukan`);
      }
    }
  };

  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      toast.error("Keranjang belanja masih kosong");
      return;
    }
    setNominalBayarTunai(totalBelanja);
    setIsCheckoutOpen(true);
  };

  const handleProsesPembayaran = () => {
    if (metodeBayar === "KREDIT_TEMPO") {
      if (!selectedAnggota) {
        toast.error("Metode Kredit Tempo wajib memilih Anggota Koperasi");
        return;
      }
      if (selectedAnggota.tipeAnggota === "NON_ORGANIK") {
        toast.error("Anggota Non-Organik tidak memiliki akses kredit tempo toko");
        return;
      }
      const limit = selectedAnggota.creditLimit || 5000000;
      if (totalBelanja > limit) {
        toast.error(`Total belanja (${formatRp(totalBelanja)}) melebihi limit kredit (${formatRp(limit)})`);
        return;
      }
    }

    if (metodeBayar === "TUNAI" && nominalBayarTunai < totalBelanja) {
      toast.error(`Uang tunai kurang ${formatRp(totalBelanja - nominalBayarTunai)}`);
      return;
    }

    const now = new Date();
    const invoiceNumber = `POS-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;

    const inv = {
      nomorInvoice: invoiceNumber,
      tanggal: now.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      kasirNama: "Serda Yoga Pratama",
      pelangganNama: selectedAnggota ? `${selectedAnggota.pangkat} ${selectedAnggota.nama}` : (namaPembeliUmum || "Pembeli Umum"),
      pelangganNrp: selectedAnggota?.nrp || "-",
      metodeBayar,
      items: [...cart],
      totalBelanja,
      totalDiskon,
      bayarTunai: metodeBayar === "TUNAI" ? nominalBayarTunai : totalBelanja,
      kembalian: metodeBayar === "TUNAI" ? Math.max(0, nominalBayarTunai - totalBelanja) : 0,
      tenorKredit: metodeBayar === "KREDIT_TEMPO" ? tenorKredit : 0,
      angsuranBulanan: metodeBayar === "KREDIT_TEMPO" ? Math.ceil(totalBelanja / tenorKredit) : 0,
      poinDidapat: totalPoinDidapat,
    };

    setLastInvoice(inv);
    setIsCheckoutOpen(false);
    setIsReceiptOpen(true);
    clearCart();

    toast.success("Transaksi Kasir POS Berhasil Diproses!", {
      description: `Invoice ${invoiceNumber} | Poin +${totalPoinDidapat}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* KOLOM KIRI: GRID KATALOG & SCANNER (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Header Barcode Search Bar */}
          <div className="rounded-2xl border border-sidebar-border/80 bg-card p-4 shadow-card">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Ketik nama produk atau scan barcode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleBarcodeScan}
                  className="pl-10 pr-10 h-11 bg-background rounded-xl border-border/80 text-sm focus-visible:ring-primary"
                />
                <Barcode className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-primary/70" />
              </div>
              <Button
                variant="outline"
                className="h-11 px-4 border-gold/40 text-gold-foreground bg-gold/10 hover:bg-gold/20 font-semibold gap-2 shrink-0 rounded-xl"
                onClick={() => {
                  toast.info("Mode Barcode Scanner Siap. Arahkan scanner ke produk.");
                }}
              >
                <Barcode className="size-4 text-gold" />
                Scan Barcode
              </Button>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedKategori("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedKategori === "ALL"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                Semua Produk ({masterProdukList.length})
              </button>
              {kategoriProdukList.map((kat) => (
                <button
                  key={kat.id}
                  type="button"
                  onClick={() => setSelectedKategori(kat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedKategori === kat.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {kat.nama}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredProduk.map((prod) => {
              const hargaDiskon = prod.isPromo
                ? prod.hargaJual - (prod.hargaJual * prod.diskonPersen) / 100
                : prod.hargaJual;
              const isStokHabis = prod.stokFisik <= 0;
              const isStokMenipis = prod.stokFisik > 0 && prod.stokFisik <= prod.stokMinimum;

              return (
                <div
                  key={prod.id}
                  onClick={() => !isStokHabis && addToCart(prod)}
                  className={`group relative flex flex-col justify-between rounded-xl border p-3 transition-all duration-200 cursor-pointer overflow-hidden ${
                    isStokHabis
                      ? "border-destructive/30 bg-muted/40 opacity-60 cursor-not-allowed"
                      : "border-border/80 bg-card hover:border-primary/50 hover:shadow-card-hover hover:-translate-y-0.5"
                  }`}
                >
                  {/* Badges top */}
                  <div className="flex items-center justify-between gap-1 mb-2 z-10">
                    <span className="text-[10px] font-mono text-muted-foreground/80 truncate">
                      {prod.barcode}
                    </span>
                    {prod.isPromo && (
                      <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0">
                        -{prod.diskonPersen}%
                      </Badge>
                    )}
                  </div>

                  {/* Thumbnail */}
                  <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-muted/50 mb-2.5">
                    <img
                      src={prod.gambar}
                      alt={prod.nama}
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {prod.isFastConsume && (
                      <span className="absolute bottom-1.5 left-1.5 rounded-md bg-emerald-700/90 text-white text-[9px] font-bold px-1.5 py-0.5 shadow-sm">
                        Fast Consume
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-1">
                    <p className="line-clamp-2 text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      {prod.nama}
                    </p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-extrabold text-foreground">
                        {formatRp(hargaDiskon)}
                      </span>
                      {prod.isPromo && (
                        <span className="text-[10px] text-muted-foreground line-through">
                          {formatRp(prod.hargaJual)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Stock & Unit */}
                  <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                    <span
                      className={`font-medium ${
                        isStokHabis
                          ? "text-destructive"
                          : isStokMenipis
                          ? "text-amber-500 font-semibold"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {isStokHabis
                        ? "Habis"
                        : `Stok: ${prod.stokFisik} ${prod.satuanKecil}`}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {prod.satuanBesar ? `1 ${prod.satuanBesar} = ${prod.pcsPerUnit}` : prod.satuanKecil}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* KOLOM KANAN: KERANJANG & CHECKOUT (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-sidebar-border/80 bg-card p-4 shadow-card flex flex-col h-full min-h-[580px]">
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <ShoppingCart className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Keranjang Kasir</h3>
                  <p className="text-[11px] text-muted-foreground">
                    {cart.reduce((s, i) => s + i.jumlah, 0)} item belanja
                  </p>
                </div>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-destructive hover:underline font-semibold flex items-center gap-1"
                >
                  <RotateCcw className="size-3" /> Reset
                </button>
              )}
            </div>

            {/* Member Selector */}
            <div className="mt-3.5 space-y-2 rounded-xl bg-muted/40 p-3 border border-border/80">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Identitas Pembeli
              </label>
              <select
                value={selectedAnggotaNrp}
                onChange={(e) => setSelectedAnggotaNrp(e.target.value)}
                className="w-full h-9 text-xs rounded-lg bg-background border border-border px-2.5 font-medium text-foreground focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Pembeli Umum / Non-Anggota --</option>
                {anggotaList.map((a) => (
                  <option key={a.nrp} value={a.nrp}>
                    {a.pangkat} {a.nama} ({a.nrp})
                  </option>
                ))}
              </select>

              {selectedAnggota ? (
                <div className="mt-2 text-[11px] flex items-center justify-between bg-primary/5 p-2 rounded-lg border border-primary/15">
                  <span className="text-primary font-semibold">
                    Limit Kredit Toko:
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {formatRp(selectedAnggota.creditLimit || 5000000)}
                  </span>
                </div>
              ) : (
                <Input
                  placeholder="Nama pembeli umum (opsional)..."
                  value={namaPembeliUmum}
                  onChange={(e) => setNamaPembeliUmum(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto max-h-[300px] my-3 divide-y divide-border/60 scrollbar-thin">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                  <ShoppingCart className="size-10 text-muted-foreground/30 mb-2" />
                  <p className="text-xs font-medium">Keranjang masih kosong</p>
                  <p className="text-[11px] text-muted-foreground/80">
                    Klik produk atau scan barcode untuk menambah
                  </p>
                </div>
              ) : (
                cart.map((item) => {
                  const hargaDiskon = item.produk.isPromo
                    ? item.produk.hargaJual - (item.produk.hargaJual * item.produk.diskonPersen) / 100
                    : item.produk.hargaJual;
                  const subtotal = hargaDiskon * item.jumlah;

                  return (
                    <div key={item.produk.id} className="py-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">
                          {item.produk.nama}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          {formatRp(hargaDiskon)} x {item.jumlah} {item.produk.satuanKecil}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => updateJumlah(item.produk.id, -1)}
                          className="size-6 rounded-md bg-muted hover:bg-accent text-foreground flex items-center justify-center text-xs font-bold"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold font-mono">
                          {item.jumlah}
                        </span>
                        <button
                          onClick={() => updateJumlah(item.produk.id, 1)}
                          className="size-6 rounded-md bg-muted hover:bg-accent text-foreground flex items-center justify-center text-xs font-bold"
                        >
                          <Plus className="size-3" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.produk.id)}
                          className="size-6 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center justify-center ml-1"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>

                      <div className="text-right shrink-0 min-w-[70px]">
                        <span className="text-xs font-bold text-foreground font-mono">
                          {formatRp(subtotal)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Summary & Checkout Button */}
            <div className="pt-3 border-t border-border space-y-2">
              {totalDiskon > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Hemat Diskon Promo:</span>
                  <span>-{formatRp(totalDiskon)}</span>
                </div>
              )}
              {selectedAnggota && totalPoinDidapat > 0 && (
                <div className="flex items-center justify-between text-[11px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10 px-2 py-1 rounded-md">
                  <span className="flex items-center gap-1">
                    <Sparkles className="size-3 text-gold" /> Poin Belanja:
                  </span>
                  <span>+{totalPoinDidapat} Poin</span>
                </div>
              )}
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-sm font-bold text-foreground">Total Tagihan:</span>
                <span className="text-xl font-extrabold text-primary font-mono">
                  {formatRp(totalBelanja)}
                </span>
              </div>

              <Button
                onClick={handleOpenCheckout}
                disabled={cart.length === 0}
                className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-xl shadow-sm hover:bg-primary/90 gap-2 mt-2"
              >
                Proses Bayar ({formatRp(totalBelanja)})
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* DIALOG PEMBAYARAN */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Pilih Metode Pembayaran</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Total Display */}
            <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-center">
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                Total yang Harus Dibayar
              </span>
              <p className="text-3xl font-black text-primary font-mono mt-1">
                {formatRp(totalBelanja)}
              </p>
              {selectedAnggota && (
                <p className="text-xs font-semibold text-foreground/80 mt-1">
                  Pelanggan: {selectedAnggota.pangkat} {selectedAnggota.nama} ({selectedAnggota.nrp})
                </p>
              )}
            </div>

            {/* Metode Bayar Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMetodeBayar("TUNAI")}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  metodeBayar === "TUNAI"
                    ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                    : "border-border hover:bg-muted text-muted-foreground font-medium"
                }`}
              >
                <Banknote className="size-5" />
                <span className="text-xs">Tunai (Cash)</span>
              </button>
              <button
                type="button"
                onClick={() => setMetodeBayar("QRIS")}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  metodeBayar === "QRIS"
                    ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                    : "border-border hover:bg-muted text-muted-foreground font-medium"
                }`}
              >
                <QrCode className="size-5" />
                <span className="text-xs">QRIS Dinamis</span>
              </button>
              <button
                type="button"
                onClick={() => setMetodeBayar("KREDIT_TEMPO")}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  metodeBayar === "KREDIT_TEMPO"
                    ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                    : "border-border hover:bg-muted text-muted-foreground font-medium"
                }`}
              >
                <CreditCard className="size-5" />
                <span className="text-xs">Kredit Tempo</span>
              </button>
            </div>

            {/* TUNAI Option */}
            {metodeBayar === "TUNAI" && (
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Nominal Uang Diterima:</label>
                  <Input
                    type="number"
                    value={nominalBayarTunai}
                    onChange={(e) => setNominalBayarTunai(Number(e.target.value))}
                    className="text-lg font-mono font-bold h-11"
                  />
                </div>
                {/* Quick Cash Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {[totalBelanja, 50000, 100000, 200000, 500000].map((nominal) => (
                    <button
                      key={nominal}
                      type="button"
                      onClick={() => setNominalBayarTunai(nominal)}
                      className="px-2.5 py-1 text-xs rounded-lg border border-border bg-muted/60 hover:bg-accent font-semibold font-mono"
                    >
                      {formatRp(nominal)}
                    </button>
                  ))}
                </div>
                {nominalBayarTunai >= totalBelanja && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-emerald-700 dark:text-emerald-300 font-bold">
                    <span>Kembalian:</span>
                    <span className="text-lg font-mono">
                      {formatRp(nominalBayarTunai - totalBelanja)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* QRIS Option */}
            {metodeBayar === "QRIS" && (
              <div className="text-center p-4 bg-muted/30 rounded-xl border border-border flex flex-col items-center">
                <div className="size-44 bg-white p-2 rounded-xl shadow-sm flex items-center justify-center border">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=CASHEVA-KOPERASI-TNI-AD-QRIS-DEMO"
                    alt="QRIS Demo"
                    className="size-full object-contain"
                  />
                </div>
                <p className="text-xs font-bold text-foreground mt-3">Scan QRIS Koperasi Satuan</p>
                <p className="text-[11px] text-muted-foreground">BCA, Mandiri, BRI, BNI, Dana, Gopay, Ovo</p>
              </div>
            )}

            {/* KREDIT TEMPO Option */}
            {metodeBayar === "KREDIT_TEMPO" && (
              <div className="space-y-3 pt-2">
                {!selectedAnggota ? (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                    <ShieldAlert className="size-4 shrink-0" />
                    <span>Wajib memilih anggota sebelum menggunakan kredit tempo!</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Pilih Tenor Cicilan:</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 3, 6].map((t) => {
                          const cicil = hitungCicilanBarang(totalBelanja, t);
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setTenorKredit(t)}
                              className={`p-2.5 rounded-xl border text-center transition-all ${
                                tenorKredit === t
                                  ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                                  : "border-border hover:bg-muted text-muted-foreground"
                              }`}
                            >
                              <p className="text-xs font-bold">{t} Bulan</p>
                              <p className="text-[11px] font-mono mt-0.5">{formatRp(cicil.angsuranBulanan)}/bln</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="p-3 bg-accent/40 border border-gold/30 rounded-xl text-xs space-y-1 text-foreground/90">
                      <p className="font-bold flex items-center gap-1.5 text-accent-foreground">
                        <Calendar className="size-3.5" /> Skema Pemotongan Gaji:
                      </p>
                      <p className="text-[11px]">
                        Angsuran sebesar <b>{formatRp(Math.ceil(totalBelanja / tenorKredit))}</b> / bulan akan otomatis tercatat pada daftar potongan gaji anggota selama {tenorKredit} bulan.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="w-1/3 rounded-xl"
                onClick={() => setIsCheckoutOpen(false)}
              >
                Batal
              </Button>
              <Button
                className="flex-1 rounded-xl bg-primary text-primary-foreground font-bold"
                onClick={handleProsesPembayaran}
              >
                Konfirmasi & Cetak Struk
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL STRUK THERMAL CETAK */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-sm rounded-2xl p-6 font-mono text-xs">
          <DialogHeader>
            <DialogTitle className="text-center font-bold text-sm">STRUK BELANJA KASIR</DialogTitle>
          </DialogHeader>

          {lastInvoice && (
            <div className="space-y-3 pt-2 text-foreground/90">
              <div className="text-center space-y-0.5 border-b border-dashed border-border pb-2.5">
                <p className="font-extrabold text-sm uppercase">PRIMKOPAD INFOLAHTADAM IV</p>
                <p className="text-[10px] text-muted-foreground">Jl. Perintis Kemerdekaan No. 1, Semarang</p>
                <p className="text-[10px] text-muted-foreground">Telp: (024) 747-1234</p>
              </div>

              <div className="text-[11px] space-y-0.5 border-b border-dashed border-border pb-2.5">
                <div className="flex justify-between">
                  <span>No. Nota:</span>
                  <span className="font-bold">{lastInvoice.nomorInvoice}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu:</span>
                  <span>{lastInvoice.tanggal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span>{lastInvoice.kasirNama}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span className="font-bold">{lastInvoice.pelangganNama}</span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1.5 border-b border-dashed border-border pb-2.5 max-h-48 overflow-y-auto">
                {lastInvoice.items.map((it: CartItem, idx: number) => {
                  const hargaDiskon = it.produk.isPromo
                    ? it.produk.hargaJual - (it.produk.hargaJual * it.produk.diskonPersen) / 100
                    : it.produk.hargaJual;
                  return (
                    <div key={idx} className="space-y-0.5">
                      <p className="font-bold text-[11px]">{it.produk.nama}</p>
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{it.jumlah} x {formatRp(hargaDiskon)}</span>
                        <span className="text-foreground font-bold">{formatRp(hargaDiskon * it.jumlah)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-border pb-2.5">
                {lastInvoice.totalDiskon > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Diskon:</span>
                    <span>-{formatRp(lastInvoice.totalDiskon)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm">
                  <span>TOTAL:</span>
                  <span>{formatRp(lastInvoice.totalBelanja)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Metode Bayar:</span>
                  <span className="font-bold uppercase">{lastInvoice.metodeBayar}</span>
                </div>
                {lastInvoice.metodeBayar === "TUNAI" && (
                  <>
                    <div className="flex justify-between">
                      <span>Tunai:</span>
                      <span>{formatRp(lastInvoice.bayarTunai)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Kembali:</span>
                      <span>{formatRp(lastInvoice.kembalian)}</span>
                    </div>
                  </>
                )}
                {lastInvoice.metodeBayar === "KREDIT_TEMPO" && (
                  <div className="flex justify-between text-primary font-bold">
                    <span>Cicilan ({lastInvoice.tenorKredit} bln):</span>
                    <span>{formatRp(lastInvoice.angsuranBulanan)}/bln</span>
                  </div>
                )}
              </div>

              <div className="text-center text-[10px] text-muted-foreground pt-1 space-y-0.5">
                <p className="font-bold text-foreground">Terima kasih atas kunjungan Anda!</p>
                <p>Barang yang sudah dibeli dapat ditukar max 1x24 jam.</p>
                {lastInvoice.poinDidapat > 0 && (
                  <p className="text-gold font-bold">⭐ Anda mendapatkan +{lastInvoice.poinDidapat} Poin Belanja</p>
                )}
              </div>

              <div className="flex gap-2 pt-3">
                <Button
                  className="w-full bg-primary text-primary-foreground rounded-xl font-bold gap-2"
                  onClick={() => {
                    window.print();
                  }}
                >
                  <Printer className="size-4" /> Cetak Struk Thermal
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
