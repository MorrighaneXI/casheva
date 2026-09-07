import { useState, useMemo } from "react";
import {
  Truck,
  Plus,
  FileText,
  RotateCcw,
  CreditCard,
  Building2,
  Phone,
  MapPin,
  CheckCircle2,
  Calendar,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

import {
  masterSupplierList,
  masterProdukList,
  formatRp,
  type Supplier,
} from "@/lib/casheva-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type PurchaseItem = {
  produkId: string;
  namaProduk: string;
  jumlahDus: number;
  isiPerDus: number;
  totalPcs: number;
  hargaBeliPerPcs: number;
  subtotal: number;
};

export function SupplierWidget() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(masterSupplierList);
  const [activeTab, setActiveTab] = useState<"SUPPLIER" | "PEMBELIAN" | "RETUR">("SUPPLIER");

  // Modal Supplier Baru
  const [isSupplierOpen, setIsSupplierOpen] = useState(false);
  const [supNama, setSupNama] = useState("");
  const [supKontak, setSupKontak] = useState("");
  const [supTelepon, setSupTelepon] = useState("");
  const [supAlamat, setSupAlamat] = useState("");

  // Modal Faktur Pembelian Baru
  const [isPembelianOpen, setIsPembelianOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [nomorNota, setNomorNota] = useState("");
  const [metodeBayarBeli, setMetodeBayarBeli] = useState<"TUNAI" | "KREDIT">("KREDIT");
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);

  // Item input
  const [selectedProdId, setSelectedProdId] = useState(masterProdukList[0]?.id || "");
  const [inputDus, setInputDus] = useState(5);
  const [inputIsiPerDus, setInputIsiPerDus] = useState(12);
  const [inputHargaBeliPcs, setInputHargaBeliPcs] = useState(25000);

  // Modal Bayar Hutang
  const [isBayarHutangOpen, setIsBayarHutangOpen] = useState(false);
  const [payingSupplier, setPayingSupplier] = useState<Supplier | null>(null);
  const [nominalBayarHutang, setNominalBayarHutang] = useState(0);

  const totalHutangSemua = useMemo(() => {
    return suppliers.reduce((acc, s) => acc + s.totalHutang, 0);
  }, [suppliers]);

  const handleSaveSupplier = () => {
    if (!supNama.trim()) {
      toast.error("Nama supplier wajib diisi");
      return;
    }
    const newSup: Supplier = {
      id: `SUP-${Date.now()}`,
      kode: `SUP-${String(suppliers.length + 1).padStart(3, "0")}`,
      nama: supNama,
      kontak: supKontak || "-",
      telepon: supTelepon || "-",
      alamat: supAlamat || "-",
      totalHutang: 0,
    };
    setSuppliers((prev) => [...prev, newSup]);
    toast.success(`Supplier "${supNama}" berhasil ditambahkan`);
    setIsSupplierOpen(false);
    setSupNama("");
    setSupKontak("");
    setSupTelepon("");
    setSupAlamat("");
  };

  const handleAddItemToPurchase = () => {
    const prod = masterProdukList.find((p) => p.id === selectedProdId);
    if (!prod) return;

    const totalPcs = inputDus * inputIsiPerDus;
    const subtotal = totalPcs * inputHargaBeliPcs;

    const item: PurchaseItem = {
      produkId: prod.id,
      namaProduk: prod.nama,
      jumlahDus: inputDus,
      isiPerDus: inputIsiPerDus,
      totalPcs,
      hargaBeliPerPcs: inputHargaBeliPcs,
      subtotal,
    };

    setPurchaseItems((prev) => [...prev, item]);
    toast.success(`+ ${prod.nama} (${inputDus} Dus / ${totalPcs} Pcs) ditambahkan ke faktur`);
  };

  const handleSavePembelian = () => {
    if (!selectedSupplierId) {
      toast.error("Pilih supplier terlebih dahulu");
      return;
    }
    if (!nomorNota.trim()) {
      toast.error("Nomor nota faktur wajib diisi");
      return;
    }
    if (purchaseItems.length === 0) {
      toast.error("Tambahkan minimal 1 item barang");
      return;
    }

    const totalFaktur = purchaseItems.reduce((acc, it) => acc + it.subtotal, 0);

    if (metodeBayarBeli === "KREDIT") {
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === selectedSupplierId
            ? { ...s, totalHutang: s.totalHutang + totalFaktur }
            : s
        )
      );
    }

    toast.success(`Faktur Pembelian ${nomorNota} Berhasil Disimpan!`, {
      description: `Total: ${formatRp(totalFaktur)} | Metode: ${metodeBayarBeli}`,
    });

    setIsPembelianOpen(false);
    setPurchaseItems([]);
    setNomorNota("");
  };

  const handleOpenBayarHutang = (sup: Supplier) => {
    setPayingSupplier(sup);
    setNominalBayarHutang(sup.totalHutang);
    setIsBayarHutangOpen(true);
  };

  const handleProsesBayarHutang = () => {
    if (!payingSupplier) return;
    if (nominalBayarHutang <= 0 || nominalBayarHutang > payingSupplier.totalHutang) {
      toast.error("Nominal pembayaran tidak valid");
      return;
    }

    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === payingSupplier.id
          ? { ...s, totalHutang: Math.max(0, s.totalHutang - nominalBayarHutang) }
          : s
      )
    );

    toast.success(`Pembayaran Hutang Rp ${formatRp(nominalBayarHutang)} ke ${payingSupplier.nama} Berhasil!`);
    setIsBayarHutangOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-card">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Mitra Supplier</p>
          <p className="text-2xl font-black text-foreground mt-1">{suppliers.length} Supplier</p>
          <p className="text-[11px] text-muted-foreground mt-1">Pemasok resmi toko koperasi</p>
        </div>

        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 shadow-card">
          <p className="text-xs font-semibold text-destructive uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard className="size-3.5" /> Total Hutang Dagang Supplier
          </p>
          <p className="text-2xl font-black text-destructive font-mono mt-1">{formatRp(totalHutangSemua)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Saldo kewajiban faktur kredit</p>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-card flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Aksi Cepat Pengadaan</p>
            <p className="text-xs text-muted-foreground mt-1">Input faktur stok barang masuk atau bayar hutang supplier</p>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              onClick={() => {
                setNomorNota(`INV-SUP-${Date.now().toString().slice(-6)}`);
                setSelectedSupplierId(suppliers[0]?.id || "");
                setIsPembelianOpen(true);
              }}
              className="flex-1 h-9 rounded-xl text-xs bg-primary text-primary-foreground font-bold gap-1"
            >
              <Plus className="size-3.5" /> Faktur Pembelian
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsSupplierOpen(true)}
              className="h-9 rounded-xl text-xs font-semibold"
            >
              + Supplier
            </Button>
          </div>
        </div>
      </div>

      {/* Directory of Suppliers */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Building2 className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Daftar Mitra Supplier & Hutang Dagang</h3>
              <p className="text-[11px] text-muted-foreground">Kelola data pemasok dan pelunasan faktur pembelian</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {suppliers.map((sup) => {
            const hasHutang = sup.totalHutang > 0;
            return (
              <div
                key={sup.id}
                className="rounded-xl border border-border p-4 bg-muted/20 hover:border-primary/40 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {sup.kode}
                    </Badge>
                    <Badge
                      className={`text-[10px] font-bold ${
                        hasHutang
                          ? "bg-destructive/15 text-destructive border-destructive/20"
                          : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      }`}
                    >
                      {hasHutang ? "Ada Hutang" : "Lunas"}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-bold text-foreground">{sup.nama}</h4>
                  <div className="text-[11px] text-muted-foreground space-y-0.5 pt-1">
                    <p className="flex items-center gap-1.5">
                      <Phone className="size-3 text-primary" /> {sup.kontak} ({sup.telepon})
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="size-3 text-muted-foreground" /> {sup.alamat}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Saldo Hutang:</span>
                    <span className={`text-sm font-bold font-mono ${hasHutang ? "text-destructive" : "text-emerald-600"}`}>
                      {formatRp(sup.totalHutang)}
                    </span>
                  </div>
                  {hasHutang && (
                    <Button
                      size="sm"
                      onClick={() => handleOpenBayarHutang(sup)}
                      className="h-8 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold gap-1"
                    >
                      Bayar Hutang
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DIALOG TAMBAH SUPPLIER */}
      <Dialog open={isSupplierOpen} onOpenChange={setIsSupplierOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Tambah Mitra Supplier Baru</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Nama Perusahaan / Supplier:</label>
              <Input
                value={supNama}
                onChange={(e) => setSupNama(e.target.value)}
                placeholder="Contoh: PT Sumber Pangan Makmur"
                className="h-10 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Nama Kontak Person (PIC):</label>
              <Input
                value={supKontak}
                onChange={(e) => setSupKontak(e.target.value)}
                placeholder="Contoh: Bpk. Gunawan"
                className="h-10 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Nomor Telepon / WA:</label>
              <Input
                value={supTelepon}
                onChange={(e) => setSupTelepon(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="h-10 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Alamat Kantor / Gudang:</label>
              <Input
                value={supAlamat}
                onChange={(e) => setSupAlamat(e.target.value)}
                placeholder="Contoh: Jl. Industri Kaligawe No. 45 Semarang"
                className="h-10 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-3">
              <Button variant="outline" className="w-1/3 rounded-xl" onClick={() => setIsSupplierOpen(false)}>
                Batal
              </Button>
              <Button className="flex-1 rounded-xl bg-primary text-primary-foreground font-bold" onClick={handleSaveSupplier}>
                Simpan Supplier
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG FAKTUR PEMBELIAN MULTI-ITEM */}
      <Dialog open={isPembelianOpen} onOpenChange={setIsPembelianOpen}>
        <DialogContent className="max-w-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Input Faktur Pembelian Stok dari Supplier</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            {/* Header Form */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-muted/40 rounded-xl border border-border">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Pilih Supplier:</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full h-9 rounded-lg bg-background border border-border px-2 font-medium text-xs"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Nomor Nota Faktur:</label>
                <Input
                  value={nomorNota}
                  onChange={(e) => setNomorNota(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Metode Bayar:</label>
                <select
                  value={metodeBayarBeli}
                  onChange={(e) => setMetodeBayarBeli(e.target.value as any)}
                  className="w-full h-9 rounded-lg bg-background border border-border px-2 font-medium text-xs"
                >
                  <option value="KREDIT">Kredit Tempo (Hutang)</option>
                  <option value="TUNAI">Tunai (Lunas)</option>
                </select>
              </div>
            </div>

            {/* Item Input Box */}
            <div className="p-3.5 bg-primary/5 rounded-xl border border-primary/20 space-y-3">
              <p className="font-bold text-primary flex items-center gap-1.5">
                <Plus className="size-4" /> Tambah Item Barang ke Faktur:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Pilih Produk:</label>
                  <select
                    value={selectedProdId}
                    onChange={(e) => {
                      setSelectedProdId(e.target.value);
                      const p = masterProdukList.find((x) => x.id === e.target.value);
                      if (p) {
                        setInputIsiPerDus(p.pcsPerUnit || 1);
                        setInputHargaBeliPcs(p.hargaBeli);
                      }
                    }}
                    className="w-full h-9 rounded-lg bg-background border border-border px-2 font-medium text-xs"
                  >
                    {masterProdukList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama} ({p.satuanBesar || "Box"})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Jumlah Satuan Besar:</label>
                  <Input
                    type="number"
                    value={inputDus}
                    onChange={(e) => setInputDus(Number(e.target.value))}
                    className="h-9 text-xs font-mono"
                    placeholder="Contoh: 5 Dus"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Isi per Dus (Pcs):</label>
                  <Input
                    type="number"
                    value={inputIsiPerDus}
                    onChange={(e) => setInputIsiPerDus(Number(e.target.value))}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Harga Beli HPP per Pcs (Rp):</label>
                  <Input
                    type="number"
                    value={inputHargaBeliPcs}
                    onChange={(e) => setInputHargaBeliPcs(Number(e.target.value))}
                    className="h-9 text-xs font-mono font-bold"
                  />
                </div>

                <div className="sm:col-span-2 flex items-end">
                  <Button
                    onClick={handleAddItemToPurchase}
                    className="w-full h-9 bg-primary text-primary-foreground text-xs font-bold rounded-lg"
                  >
                    + Masukkan Barang ({inputDus * inputIsiPerDus} Pcs)
                  </Button>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted text-muted-foreground font-bold">
                  <tr>
                    <th className="p-2.5">Nama Produk</th>
                    <th className="p-2.5 text-center">Satuan Besar</th>
                    <th className="p-2.5 text-center">Total Fisik</th>
                    <th className="p-2.5 text-right">HPP / Pcs</th>
                    <th className="p-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {purchaseItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">
                        Belum ada item barang yang dimasukkan
                      </td>
                    </tr>
                  ) : (
                    purchaseItems.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-bold">{it.namaProduk}</td>
                        <td className="p-2.5 text-center">{it.jumlahDus} Dus (@{it.isiPerDus})</td>
                        <td className="p-2.5 text-center font-bold text-primary">{it.totalPcs} Pcs</td>
                        <td className="p-2.5 text-right font-mono">{formatRp(it.hargaBeliPerPcs)}</td>
                        <td className="p-2.5 text-right font-mono font-bold">{formatRp(it.subtotal)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="flex justify-between items-baseline pt-2 border-t border-border">
              <span className="font-bold text-sm">Total Nilai Faktur:</span>
              <span className="text-xl font-extrabold text-primary font-mono">
                {formatRp(purchaseItems.reduce((acc, it) => acc + it.subtotal, 0))}
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="w-1/3 rounded-xl" onClick={() => setIsPembelianOpen(false)}>
                Batal
              </Button>
              <Button
                disabled={purchaseItems.length === 0}
                className="flex-1 rounded-xl bg-primary text-primary-foreground font-bold"
                onClick={handleSavePembelian}
              >
                Simpan Faktur & Update Stok
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG BAYAR HUTANG SUPPLIER */}
      <Dialog open={isBayarHutangOpen} onOpenChange={setIsBayarHutangOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Pelunasan Hutang Dagang Supplier</DialogTitle>
          </DialogHeader>

          {payingSupplier && (
            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-1">
                <p className="font-bold text-foreground text-sm">{payingSupplier.nama}</p>
                <p className="text-muted-foreground text-[11px]">PIC: {payingSupplier.kontak} ({payingSupplier.telepon})</p>
                <p className="text-destructive font-bold text-sm pt-1">
                  Total Sisa Hutang: {formatRp(payingSupplier.totalHutang)}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Nominal Pembayaran (Rp):</label>
                <Input
                  type="number"
                  value={nominalBayarHutang}
                  onChange={(e) => setNominalBayarHutang(Number(e.target.value))}
                  className="h-11 text-base font-mono font-bold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="w-1/3 rounded-xl" onClick={() => setIsBayarHutangOpen(false)}>
                  Batal
                </Button>
                <Button className="flex-1 rounded-xl bg-destructive text-destructive-foreground font-bold" onClick={handleProsesBayarHutang}>
                  Bayar ({formatRp(nominalBayarHutang)})
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
