import { useState, useMemo } from "react";
import {
  Boxes,
  Search,
  Plus,
  Edit,
  AlertTriangle,
  Barcode,
  Package,
  CheckCircle2,
  RefreshCw,
  Printer,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";

import {
  masterProdukList,
  kategoriProdukList,
  formatRp,
  formatBoxPcs,
  type Produk,
} from "@/lib/casheva-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function InventoriWidget() {
  const [produkList, setProdukList] = useState<Produk[]>(masterProdukList);
  const [search, setSearch] = useState("");
  const [selectedKategori, setSelectedKategori] = useState<string>("ALL");
  const [filterStokKritis, setFilterStokKritis] = useState(false);

  // Modal Tambah/Edit Produk
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduk, setEditingProduk] = useState<Produk | null>(null);

  // Form State
  const [formBarcode, setFormBarcode] = useState("");
  const [formNama, setFormNama] = useState("");
  const [formKategoriId, setFormKategoriId] = useState("KAT-01");
  const [formSatuanKecil, setFormSatuanKecil] = useState("Pcs");
  const [formSatuanBesar, setFormSatuanBesar] = useState("Dus");
  const [formPcsPerUnit, setFormPcsPerUnit] = useState(12);
  const [formHargaBeli, setFormHargaBeli] = useState(0);
  const [formHargaJual, setFormHargaJual] = useState(0);
  const [formStokFisik, setFormStokFisik] = useState(0);
  const [formStokMinimum, setFormStokMinimum] = useState(5);
  const [formDiskon, setFormDiskon] = useState(0);
  const [formIsPromo, setFormIsPromo] = useState(false);
  const [formIsFastConsume, setFormIsFastConsume] = useState(false);

  // Modal Opname
  const [isOpnameOpen, setIsOpnameOpen] = useState(false);
  const [opnameProduk, setOpnameProduk] = useState<Produk | null>(null);
  const [opnameStokBaru, setOpnameStokBaru] = useState(0);
  const [opnameAlasan, setOpnameAlasan] = useState("");

  const filteredList = useMemo(() => {
    return produkList.filter((p) => {
      const matchCat = selectedKategori === "ALL" || p.kategoriId === selectedKategori;
      const matchSearch =
        p.nama.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.includes(search);
      const matchKritis = !filterStokKritis || p.stokFisik <= p.stokMinimum;
      return matchCat && matchSearch && matchKritis;
    });
  }, [produkList, search, selectedKategori, filterStokKritis]);

  const ringkasanStok = useMemo(() => {
    const totalItem = produkList.length;
    const totalKritis = produkList.filter((p) => p.stokFisik <= p.stokMinimum).length;
    const totalNilaiStok = produkList.reduce((acc, p) => acc + p.hargaBeli * p.stokFisik, 0);
    const totalPotensiOmset = produkList.reduce((acc, p) => acc + p.hargaJual * p.stokFisik, 0);
    return { totalItem, totalKritis, totalNilaiStok, totalPotensiOmset };
  }, [produkList]);

  const handleOpenTambah = () => {
    setEditingProduk(null);
    setFormBarcode(`899${Math.floor(1000000000 + Math.random() * 9000000000)}`);
    setFormNama("");
    setFormKategoriId("KAT-01");
    setFormSatuanKecil("Pcs");
    setFormSatuanBesar("Dus");
    setFormPcsPerUnit(12);
    setFormHargaBeli(0);
    setFormHargaJual(0);
    setFormStokFisik(0);
    setFormStokMinimum(5);
    setFormDiskon(0);
    setFormIsPromo(false);
    setFormIsFastConsume(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: Produk) => {
    setEditingProduk(p);
    setFormBarcode(p.barcode);
    setFormNama(p.nama);
    setFormKategoriId(p.kategoriId);
    setFormSatuanKecil(p.satuanKecil);
    setFormSatuanBesar(p.satuanBesar || "");
    setFormPcsPerUnit(p.pcsPerUnit || 1);
    setFormHargaBeli(p.hargaBeli);
    setFormHargaJual(p.hargaJual);
    setFormStokFisik(p.stokFisik);
    setFormStokMinimum(p.stokMinimum);
    setFormDiskon(p.diskonPersen);
    setFormIsPromo(p.isPromo);
    setFormIsFastConsume(p.isFastConsume);
    setIsFormOpen(true);
  };

  const handleSaveProduk = () => {
    if (!formNama.trim()) {
      toast.error("Nama produk wajib diisi");
      return;
    }

    const kategori = kategoriProdukList.find((k) => k.id === formKategoriId);

    if (editingProduk) {
      setProdukList((prev) =>
        prev.map((p) =>
          p.id === editingProduk.id
            ? {
                ...p,
                barcode: formBarcode,
                nama: formNama,
                kategoriId: formKategoriId,
                kategoriNama: kategori?.nama || "Umum",
                satuanKecil: formSatuanKecil,
                satuanBesar: formSatuanBesar || undefined,
                pcsPerUnit: formPcsPerUnit,
                hargaBeli: formHargaBeli,
                hargaJual: formHargaJual,
                stokFisik: formStokFisik,
                stokMinimum: formStokMinimum,
                diskonPersen: formDiskon,
                isPromo: formIsPromo,
                isFastConsume: formIsFastConsume,
              }
            : p
        )
      );
      toast.success("Produk berhasil diperbarui!");
    } else {
      const newProd: Produk = {
        id: `PRD-${Date.now()}`,
        barcode: formBarcode,
        nama: formNama,
        kategoriId: formKategoriId,
        kategoriNama: kategori?.nama || "Umum",
        satuanKecil: formSatuanKecil,
        satuanBesar: formSatuanBesar || undefined,
        pcsPerUnit: formPcsPerUnit,
        hargaBeli: formHargaBeli,
        hargaJual: formHargaJual,
        stokFisik: formStokFisik,
        stokMinimum: formStokMinimum,
        diskonPersen: formDiskon,
        isPromo: formIsPromo,
        isFastConsume: formIsFastConsume,
        sumber: "Koperasi",
        gambar: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80",
      };
      setProdukList((prev) => [newProd, ...prev]);
      toast.success("Produk baru berhasil ditambahkan!");
    }
    setIsFormOpen(false);
  };

  const handleOpenOpname = (p: Produk) => {
    setOpnameProduk(p);
    setOpnameStokBaru(p.stokFisik);
    setOpnameAlasan("");
    setIsOpnameOpen(true);
  };

  const handleSaveOpname = () => {
    if (!opnameProduk) return;
    if (!opnameAlasan.trim()) {
      toast.error("Alasan penyesuaian opname wajib diisi");
      return;
    }

    setProdukList((prev) =>
      prev.map((p) =>
        p.id === opnameProduk.id ? { ...p, stokFisik: opnameStokBaru } : p
      )
    );
    toast.success(`Stock Opname "${opnameProduk.nama}" berhasil diperbarui ke ${opnameStokBaru} ${opnameProduk.satuanKecil}`);
    setIsOpnameOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-card">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Item Barang</p>
          <p className="text-2xl font-black text-foreground mt-1">{ringkasanStok.totalItem} Produk</p>
          <p className="text-[11px] text-muted-foreground mt-1">Aktif di etalase toko</p>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-card">
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="size-3.5" /> Stok Kritis / Menipis
          </p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{ringkasanStok.totalKritis} Produk</p>
          <p className="text-[11px] text-muted-foreground mt-1">Stok di bawah batas minimum</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-card">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nilai Modal Stok (HPP)</p>
          <p className="text-2xl font-black text-primary font-mono mt-1">{formatRp(ringkasanStok.totalNilaiStok)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Akumulasi modal barang toko</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-card">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Potensi Omset Jual</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">{formatRp(ringkasanStok.totalPotensiOmset)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Estimasi nilai penjualan kotor</p>
        </div>
      </div>

      {/* Filter & Action Bar */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-card space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama produk atau barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-background"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant={filterStokKritis ? "destructive" : "outline"}
              onClick={() => setFilterStokKritis(!filterStokKritis)}
              className="h-10 rounded-xl text-xs font-semibold gap-1.5"
            >
              <AlertTriangle className="size-3.5" />
              Filter Stok Kritis ({ringkasanStok.totalKritis})
            </Button>
            <Button
              onClick={handleOpenTambah}
              className="h-10 rounded-xl bg-primary text-primary-foreground font-bold gap-1.5 shadow-sm"
            >
              <Plus className="size-4" /> Tambah Produk
            </Button>
          </div>
        </div>

        {/* Category filters */}
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
            Semua ({produkList.length})
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

      {/* Table of Products */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 text-muted-foreground font-bold border-b border-border">
              <tr>
                <th className="p-3.5">Barcode & Nama Barang</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5">Konversi Satuan</th>
                <th className="p-3.5">Harga Beli (HPP)</th>
                <th className="p-3.5">Harga Jual</th>
                <th className="p-3.5">Margin Profit</th>
                <th className="p-3.5">Stok Fisik</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredList.map((prod) => {
                const margin = prod.hargaJual - prod.hargaBeli;
                const marginPersen = prod.hargaBeli > 0 ? Math.round((margin / prod.hargaBeli) * 100) : 0;
                const isKritis = prod.stokFisik <= prod.stokMinimum;
                const isHabis = prod.stokFisik <= 0;

                return (
                  <tr key={prod.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="size-10 rounded-lg bg-muted overflow-hidden shrink-0 border border-border">
                          <img src={prod.gambar} alt={prod.nama} className="size-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate">{prod.nama}</p>
                          <p className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
                            <Barcode className="size-3" /> {prod.barcode}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <Badge variant="outline" className="text-[10px] font-medium bg-muted/40">
                        {prod.kategoriNama}
                      </Badge>
                    </td>
                    <td className="p-3.5">
                      <span className="font-medium text-foreground">
                        {prod.satuanBesar ? `1 ${prod.satuanBesar} = ${prod.pcsPerUnit} ${prod.satuanKecil}` : prod.satuanKecil}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-medium text-muted-foreground">
                      {formatRp(prod.hargaBeli)}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-foreground">
                      {formatRp(prod.hargaJual)}
                      {prod.isPromo && (
                        <span className="ml-1 text-[10px] text-destructive">(-{prod.diskonPersen}%)</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      +{formatRp(margin)} ({marginPersen}%)
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <Badge
                          className={`text-[10px] font-bold ${
                            isHabis
                              ? "bg-destructive text-destructive-foreground"
                              : isKritis
                              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30"
                              : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25"
                          }`}
                        >
                          {isHabis ? "Habis (0)" : `${prod.stokFisik} ${prod.satuanKecil}`}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground">
                          {formatBoxPcs(prod.stokFisik, prod.pcsPerUnit, prod.satuanBesar, prod.satuanKecil)}
                        </p>
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenOpname(prod)}
                          title="Stock Opname"
                          className="size-7 text-primary hover:bg-primary/10"
                        >
                          <RefreshCw className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(prod)}
                          title="Edit Produk"
                          className="size-7 text-muted-foreground hover:bg-accent"
                        >
                          <Edit className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIALOG FORM PRODUK */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-xl rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingProduk ? "Edit Produk Toko" : "Tambah Produk Baru"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="font-bold text-foreground">Nama Produk:</label>
              <Input
                value={formNama}
                onChange={(e) => setFormNama(e.target.value)}
                placeholder="Contoh: Beras Premium Koperasi 5 Kg"
                className="h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Kode Barcode / SKU:</label>
              <Input
                value={formBarcode}
                onChange={(e) => setFormBarcode(e.target.value)}
                className="h-10 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Kategori:</label>
              <select
                value={formKategoriId}
                onChange={(e) => setFormKategoriId(e.target.value)}
                className="w-full h-10 text-xs rounded-xl bg-background border border-border px-3 font-medium"
              >
                {kategoriProdukList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* Satuan & Konversi */}
            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Satuan Eceran (Kecil):</label>
              <Input
                value={formSatuanKecil}
                onChange={(e) => setFormSatuanKecil(e.target.value)}
                placeholder="Pcs / Bks / Btl / Sak"
                className="h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Satuan Grosir (Besar):</label>
              <Input
                value={formSatuanBesar}
                onChange={(e) => setFormSatuanBesar(e.target.value)}
                placeholder="Dus / Box / Lusin / Karung"
                className="h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Isi per Satuan Besar (Pcs):</label>
              <Input
                type="number"
                value={formPcsPerUnit}
                onChange={(e) => setFormPcsPerUnit(Number(e.target.value))}
                className="h-10 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Stok Minimum Alert:</label>
              <Input
                type="number"
                value={formStokMinimum}
                onChange={(e) => setFormStokMinimum(Number(e.target.value))}
                className="h-10 text-xs font-mono"
              />
            </div>

            {/* Pricing */}
            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Harga Beli / HPP (Rp):</label>
              <Input
                type="number"
                value={formHargaBeli}
                onChange={(e) => setFormHargaBeli(Number(e.target.value))}
                className="h-10 text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Harga Jual Toko (Rp):</label>
              <Input
                type="number"
                value={formHargaJual}
                onChange={(e) => setFormHargaJual(Number(e.target.value))}
                className="h-10 text-xs font-mono font-bold text-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Stok Fisik Awal ({formSatuanKecil}):</label>
              <Input
                type="number"
                value={formStokFisik}
                onChange={(e) => setFormStokFisik(Number(e.target.value))}
                className="h-10 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5 flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-foreground">
                <input
                  type="checkbox"
                  checked={formIsFastConsume}
                  onChange={(e) => setFormIsFastConsume(e.target.checked)}
                  className="size-4 rounded text-primary"
                />
                Fast Consume (Delivery)
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t border-border mt-2">
            <Button variant="outline" className="w-1/3 rounded-xl" onClick={() => setIsFormOpen(false)}>
              Batal
            </Button>
            <Button className="flex-1 rounded-xl bg-primary text-primary-foreground font-bold" onClick={handleSaveProduk}>
              Simpan Data Produk
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG STOCK OPNAME */}
      <Dialog open={isOpnameOpen} onOpenChange={setIsOpnameOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Penyesuaian Stok (Stock Opname)</DialogTitle>
          </DialogHeader>

          {opnameProduk && (
            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                <p className="font-bold text-foreground text-sm">{opnameProduk.nama}</p>
                <p className="text-muted-foreground font-mono text-[11px]">Barcode: {opnameProduk.barcode}</p>
                <p className="text-primary font-bold">
                  Stok Sistem Saat Ini: {opnameProduk.stokFisik} {opnameProduk.satuanKecil} ({formatBoxPcs(opnameProduk.stokFisik, opnameProduk.pcsPerUnit, opnameProduk.satuanBesar, opnameProduk.satuanKecil)})
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Hasil Hitung Fisik Sebenarnya ({opnameProduk.satuanKecil}):</label>
                <Input
                  type="number"
                  value={opnameStokBaru}
                  onChange={(e) => setOpnameStokBaru(Number(e.target.value))}
                  className="h-11 text-base font-mono font-bold"
                />
                <p className="text-[11px] text-muted-foreground">
                  Selisih:{" "}
                  <span className={opnameStokBaru - opnameProduk.stokFisik >= 0 ? "text-emerald-600 font-bold" : "text-destructive font-bold"}>
                    {opnameStokBaru - opnameProduk.stokFisik > 0 ? `+${opnameStokBaru - opnameProduk.stokFisik}` : opnameStokBaru - opnameProduk.stokFisik} {opnameProduk.satuanKecil}
                  </span>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Alasan Penyesuaian:</label>
                <Input
                  value={opnameAlasan}
                  onChange={(e) => setOpnameAlasan(e.target.value)}
                  placeholder="Contoh: Barang rusak saat display / temuan fisik lebih"
                  className="h-10 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="w-1/3 rounded-xl" onClick={() => setIsOpnameOpen(false)}>
                  Batal
                </Button>
                <Button className="flex-1 rounded-xl bg-primary text-primary-foreground font-bold" onClick={handleSaveOpname}>
                  Perbarui Stok Fisik
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
