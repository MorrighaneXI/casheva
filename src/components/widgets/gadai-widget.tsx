import { useState, useMemo } from "react";
import {
  Gem,
  Plus,
  Calculator,
  FileCheck2,
  Tag,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Gavel,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

import {
  gadaiList,
  anggotaList,
  formatRp,
  type GadaiItem,
} from "@/lib/casheva-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function GadaiWidget() {
  const [activeTab, setActiveTab] = useState<"SIMULATOR" | "AKTIF" | "LELANG">("SIMULATOR");
  const [pawnItems, setPawnItems] = useState<GadaiItem[]>(gadaiList);

  // Appraisal Calculator State
  const [kategoriSimulasi, setKategoriSimulasi] = useState<"EMAS_PERHIASAN" | "ELEKTRONIK_GADGET">("EMAS_PERHIASAN");
  const [beratEmas, setBeratEmas] = useState(8.5);
  const [kadarKarat, setKadarKarat] = useState(22);
  const [hargaPasarElektronik, setHargaPasarElektronik] = useState(6000000);
  const [kondisiPersen, setKondisiPersen] = useState(85);

  // Form Pengajuan Gadai
  const [isAjukanOpen, setIsAjukanOpen] = useState(false);
  const [selectedAnggotaNrp, setSelectedAnggotaNrp] = useState("31770091");
  const [namaBarangForm, setNamaBarangForm] = useState("Kalung Emas 22K 8.5 Gram");

  // Perhitungan Taksiran Simpanan
  const estimasiTaksiran = useMemo(() => {
    let nilaiTaksiran = 0;
    let plafonPinjaman = 0;

    if (kategoriSimulasi === "EMAS_PERHIASAN") {
      const hargaEmasMurni = 1350000;
      const kadar = kadarKarat / 24;
      nilaiTaksiran = beratEmas * hargaEmasMurni * kadar;
      plafonPinjaman = nilaiTaksiran * 0.85; // 85% LTV
    } else {
      nilaiTaksiran = hargaPasarElektronik * (kondisiPersen / 100);
      plafonPinjaman = nilaiTaksiran * 0.7; // 70% LTV
    }

    const jasaTitipBulan = (plafonPinjaman * 1.5) / 100;
    const biayaAdmin = 25000;

    return {
      nilaiTaksiran: Math.round(nilaiTaksiran),
      plafonPinjaman: Math.round(plafonPinjaman),
      jasaTitipBulan: Math.round(jasaTitipBulan),
      biayaAdmin,
    };
  }, [kategoriSimulasi, beratEmas, kadarKarat, hargaPasarElektronik, kondisiPersen]);

  const handleAjukanGadai = () => {
    const anggota = anggotaList.find((a) => a.nrp === selectedAnggotaNrp);
    if (!anggota) return;

    const newGadai: GadaiItem = {
      id: `GD-${Date.now()}`,
      nomorSbg: `SBG-${Date.now().toString().slice(-8)}`,
      anggotaNama: `${anggota.pangkat} ${anggota.nama}`,
      anggotaNrp: anggota.nrp,
      kategori: kategoriSimulasi,
      namaBarang: namaBarangForm,
      spesifikasi:
        kategoriSimulasi === "EMAS_PERHIASAN"
          ? `Berat ${beratEmas}g, Kadar ${kadarKarat}K`
          : `Kondisi ${kondisiPersen}%, Fungsi Normal`,
      nilaiTaksiran: estimasiTaksiran.nilaiTaksiran,
      uangPinjaman: estimasiTaksiran.plafonPinjaman,
      jasaTitipBulan: estimasiTaksiran.jasaTitipBulan,
      tanggalGadai: "Hari Ini",
      jatuhTempo: "120 Hari Lagi",
      status: "AKTIF_BERJALAN",
      foto:
        kategoriSimulasi === "EMAS_PERHIASAN"
          ? "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&auto=format&fit=crop&q=80"
          : "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&auto=format&fit=crop&q=80",
    };

    setPawnItems((prev) => [newGadai, ...prev]);
    toast.success("Pengajuan Gadai Berhasil Diproses!", {
      description: `Surat Bukti Gadai ${newGadai.nomorSbg} diterbitkan. Dana ${formatRp(newGadai.uangPinjaman)} siap dicairkan.`,
    });
    setIsAjukanOpen(false);
  };

  const handleTebus = (id: string) => {
    setPawnItems((prev) =>
      prev.map((g) => (g.id === id ? { ...g, status: "DITEBUS_LUNAS" } : g))
    );
    toast.success("Barang gadai berhasil ditebus lunas!");
  };

  const handleBeliLelang = (item: GadaiItem) => {
    setPawnItems((prev) =>
      prev.map((g) =>
        g.id === item.id
          ? ({
              ...g,
              status: "BARANG_TERJUAL_LELANG",
              hargaLelangTerjual: g.hargaLelangBuka ?? 0,
            } as GadaiItem)
          : g
      )
    );
    toast.success(`Pembelian Barang Lelang "${item.namaBarang}" Berhasil!`, {
      description: `Total: ${formatRp(item.hargaLelangBuka || 0)}. Kuitansi lelang diterbitkan.`,
    });
  };

  const activeGadai = pawnItems.filter((g) => g.status === "AKTIF_BERJALAN");
  const lelangGadai = pawnItems.filter(
    (g) => g.status === "JATUH_TEMPO_LELANG" || g.status === "BARANG_TERJUAL_LELANG"
  );

  return (
    <div className="space-y-6">
      {/* Banner Intro */}
      <div className="rounded-3xl bg-gradient-to-r from-sidebar via-card to-sidebar p-6 border border-sidebar-border shadow-card text-foreground flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <Badge className="bg-gold text-gold-foreground font-bold text-xs gap-1">
            <Gem className="size-3.5" /> Unit Usaha Gadai Koperasi & Etalase Lelang
          </Badge>
          <h2 className="text-xl sm:text-2xl font-black text-foreground">
            Solusi Dana Cepat Agunan Emas & Elektronik
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Layanan gadai terpercaya bagi anggota koperasi dengan penaksiran standar harga Antam/pasar resmi, bunga jasa titip rendah <b>1.5%/bulan</b>, serta penjualan lelang barang jatuh tempo bergaransi.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setActiveTab("SIMULATOR")}
            className="h-11 px-4 rounded-2xl bg-primary text-primary-foreground font-bold text-xs gap-1.5 shadow-sm"
          >
            <Calculator className="size-4" /> Hitung Taksiran
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsAjukanOpen(true)}
            className="h-11 px-4 rounded-2xl text-xs font-bold gap-1.5 border-gold/40 text-gold-foreground bg-gold/10"
          >
            <Plus className="size-4 text-gold" /> Ajukan Gadai Baru
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("SIMULATOR")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "SIMULATOR"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          Kalkulator Taksiran Nilai
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("AKTIF")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "AKTIF"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          Surat Bukti Gadai Aktif ({activeGadai.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("LELANG")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "LELANG"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          <Gavel className="size-3.5" /> Etalase Lelang Barang Sita ({lelangGadai.length})
        </button>
      </div>

      {/* TAB 1: KALKULATOR TAKSIRAN */}
      {activeTab === "SIMULATOR" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 rounded-2xl border border-border bg-card p-5 shadow-card space-y-4 text-xs">
            <h3 className="text-sm font-bold text-foreground">Parameter Simulasi Penaksiran</h3>

            {/* Kategori Toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setKategoriSimulasi("EMAS_PERHIASAN")}
                className={`p-3 rounded-xl border text-center font-bold transition-all flex items-center justify-center gap-2 ${
                  kategoriSimulasi === "EMAS_PERHIASAN"
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <Gem className="size-4" /> Emas & Logam Mulia
              </button>
              <button
                type="button"
                onClick={() => setKategoriSimulasi("ELEKTRONIK_GADGET")}
                className={`p-3 rounded-xl border text-center font-bold transition-all flex items-center justify-center gap-2 ${
                  kategoriSimulasi === "ELEKTRONIK_GADGET"
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <Tag className="size-4" /> Laptop & Gadget Elektronik
              </button>
            </div>

            {kategoriSimulasi === "EMAS_PERHIASAN" ? (
              <div className="space-y-3.5 pt-2">
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold">
                    <span>Berat Emas (Gram):</span>
                    <span className="font-mono text-primary text-sm">{beratEmas} gram</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="0.5"
                    value={beratEmas}
                    onChange={(e) => setBeratEmas(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold">
                    <span>Kadar Kemurnian (Karat):</span>
                    <span className="font-mono text-primary text-sm">{kadarKarat} Karat ({Math.round((kadarKarat / 24) * 100)}%)</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[18, 20, 22, 24].map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setKadarKarat(k)}
                        className={`py-2 rounded-lg border font-bold text-xs ${
                          kadarKarat === k
                            ? "bg-gold text-gold-foreground border-gold"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {k} Karat
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 pt-2">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Harga Pasar Baru / Normal (Rp):</label>
                  <Input
                    type="number"
                    value={hargaPasarElektronik}
                    onChange={(e) => setHargaPasarElektronik(Number(e.target.value))}
                    className="h-10 text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold">
                    <span>Kelengkapan & Kondisi Fisik (%):</span>
                    <span className="font-mono text-primary">{kondisiPersen}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={kondisiPersen}
                    onChange={(e) => setKondisiPersen(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Result Card */}
          <div className="lg:col-span-5 rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-primary/20">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Hasil Taksiran Resmi</span>
              <Badge className="bg-emerald-600 text-white text-[10px] font-bold">LTV 70-85%</Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-baseline">
                <span className="text-muted-foreground">Nilai Taksiran Agunan:</span>
                <span className="text-base font-bold text-foreground font-mono">
                  {formatRp(estimasiTaksiran.nilaiTaksiran)}
                </span>
              </div>

              <div className="p-4 bg-card rounded-xl border border-primary/30 space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">Maksimal Pinjaman Cair:</span>
                <p className="text-3xl font-black text-primary font-mono">
                  {formatRp(estimasiTaksiran.plafonPinjaman)}
                </p>
              </div>

              <div className="space-y-1.5 pt-1 text-[11px] text-muted-foreground">
                <div className="flex justify-between">
                  <span>Jasa Titip / Pemeliharaan:</span>
                  <span className="font-bold text-foreground font-mono">
                    {formatRp(estimasiTaksiran.jasaTitipBulan)} / bulan (1.5%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Biaya Administrasi:</span>
                  <span className="font-bold text-foreground font-mono">
                    {formatRp(estimasiTaksiran.biayaAdmin)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Jangka Waktu Gadai:</span>
                  <span className="font-bold text-foreground">120 Hari (Dapat Diperpanjang)</span>
                </div>
              </div>

              <Button
                onClick={() => setIsAjukanOpen(true)}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold gap-2 mt-2"
              >
                Ajukan Gadai dengan Taksiran Ini
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SURAT BUKTI GADAI AKTIF */}
      {activeTab === "AKTIF" && (
        <div className="space-y-3">
          {activeGadai.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-border/80 bg-card p-4 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="size-16 rounded-xl bg-muted overflow-hidden shrink-0 border">
                  <img src={item.foto} alt={item.namaBarang} className="size-full object-cover" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs font-bold text-primary">
                      {item.nomorSbg}
                    </Badge>
                    <Badge className="bg-primary/10 text-primary text-[10px] font-bold">
                      {item.kategori.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-bold text-foreground">{item.namaBarang}</h4>
                  <p className="text-xs text-muted-foreground">
                    Penggadai: <b>{item.anggotaNama}</b> ({item.anggotaNrp}) | Jatuh Tempo: <b>{item.jatuhTempo}</b>
                  </p>
                  <p className="text-[11px] text-muted-foreground">{item.spesifikasi}</p>
                </div>
              </div>

              <div className="flex flex-col md:items-end justify-between gap-2 shrink-0">
                <div className="md:text-right">
                  <span className="text-[10px] text-muted-foreground block">Plafon Pinjaman Gadai:</span>
                  <span className="text-lg font-black text-primary font-mono">
                    {formatRp(item.uangPinjaman)}
                  </span>
                  <p className="text-[10px] text-muted-foreground">Jasa Titip: {formatRp(item.jasaTitipBulan)}/bln</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleTebus(item.id)}
                    className="h-8 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                  >
                    <CheckCircle2 className="size-3.5 mr-1" /> Tebus Barang
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: ETALASE LELANG BARANG SITA */}
      {activeTab === "LELANG" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lelangGadai.map((item) => {
            const isSold = item.status === "BARANG_TERJUAL_LELANG";
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-border/80 bg-card p-4 shadow-card hover:border-gold/50 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="relative aspect-16/10 w-full rounded-xl overflow-hidden bg-muted mb-3">
                    <img src={item.foto} alt={item.namaBarang} className="size-full object-cover" />
                    <span
                      className={`absolute top-2 left-2 rounded-md text-white text-[10px] font-bold px-2 py-0.5 shadow-sm flex items-center gap-1 ${
                        isSold ? "bg-muted-foreground" : "bg-gold text-gold-foreground font-black"
                      }`}
                    >
                      <Gavel className="size-3" /> {isSold ? "Sudah Terjual" : "Lelang Terbuka"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {item.nomorSbg}
                    </Badge>
                    <h4 className="text-sm font-bold text-foreground">{item.namaBarang}</h4>
                    <p className="text-[11px] text-muted-foreground">{item.spesifikasi}</p>
                    <p className="text-[10px] text-muted-foreground pt-1">
                      Taksiran Awal: {formatRp(item.nilaiTaksiran)}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-muted-foreground font-medium">Harga Pembukaan:</span>
                    <span className="text-lg font-black text-foreground font-mono">
                      {formatRp(item.hargaLelangBuka || 0)}
                    </span>
                  </div>

                  {!isSold ? (
                    <Button
                      size="sm"
                      onClick={() => handleBeliLelang(item)}
                      className="w-full h-9 rounded-xl bg-gold text-gold-foreground font-bold text-xs gap-1.5 shadow-sm"
                    >
                      <Gavel className="size-3.5" /> Beli Barang Lelang Ini
                    </Button>
                  ) : (
                    <Button size="sm" disabled className="w-full h-9 rounded-xl text-xs">
                      Terjual Lunas
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DIALOG PENGAJUAN GADAI BARU */}
      <Dialog open={isAjukanOpen} onOpenChange={setIsAjukanOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Penerbitan Surat Bukti Gadai (SBG)</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Pilih Anggota Penggadai:</label>
              <select
                value={selectedAnggotaNrp}
                onChange={(e) => setSelectedAnggotaNrp(e.target.value)}
                className="w-full h-10 rounded-xl bg-background border border-border px-3 font-medium text-xs"
              >
                {anggotaList.map((a) => (
                  <option key={a.nrp} value={a.nrp}>
                    {a.pangkat} {a.nama} ({a.nrp})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Deskripsi Barang Agunan:</label>
              <Input
                value={namaBarangForm}
                onChange={(e) => setNamaBarangForm(e.target.value)}
                placeholder="Contoh: Kalung Emas Kuning 22 Karat 10g"
                className="h-10 text-xs"
              />
            </div>

            <div className="p-3.5 bg-primary/10 rounded-xl border border-primary/20 space-y-1 font-mono">
              <div className="flex justify-between text-xs">
                <span>Nilai Taksiran:</span>
                <span className="font-bold">{formatRp(estimasiTaksiran.nilaiTaksiran)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-primary pt-1 border-t border-primary/20">
                <span>Plafon Cair:</span>
                <span>{formatRp(estimasiTaksiran.plafonPinjaman)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="w-1/3 rounded-xl" onClick={() => setIsAjukanOpen(false)}>
                Batal
              </Button>
              <Button className="flex-1 rounded-xl bg-primary text-primary-foreground font-bold" onClick={handleAjukanGadai}>
                Cairkan Dana & Terbitkan SBG
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
