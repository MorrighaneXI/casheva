import { useState } from "react";
import {
  Store,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Package,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import {
  pengajuanMarketplaceList,
  formatRp,
  type PengajuanMarketplace,
} from "@/lib/casheva-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function MarketplaceWidget() {
  const [submissions, setSubmissions] = useState<PengajuanMarketplace[]>(pengajuanMarketplaceList);
  const [activeTab, setActiveTab] = useState<"KATALOG" | "PENGAJUAN" | "VALIDASI">("KATALOG");

  // Form Pengajuan Baru
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formNamaProduk, setFormNamaProduk] = useState("");
  const [formKategori, setFormKategori] = useState("Makanan Ringan");
  const [formHargaUsul, setFormHargaUsul] = useState(25000);
  const [formStokAwal, setFormStokAwal] = useState(20);
  const [formKomisi, setFormKomisi] = useState(5);

  const handleAjukan = () => {
    if (!formNamaProduk.trim()) {
      toast.error("Nama produk wajib diisi");
      return;
    }

    const newSub: PengajuanMarketplace = {
      id: `MKP-REQ-${Date.now().toString().slice(-4)}`,
      anggotaNama: "Sertu Hendra Gunawan",
      anggotaNrp: "31770091",
      namaProduk: formNamaProduk,
      kategori: formKategori,
      hargaUsul: formHargaUsul,
      stokAwal: formStokAwal,
      komisiPersen: formKomisi,
      status: "DIAJUKAN",
      catatan: "Menunggu peninjauan petugas toko koperasi",
      gambar: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&auto=format&fit=crop&q=80",
      tanggal: "Hari Ini",
    };

    setSubmissions((prev) => [newSub, ...prev]);
    toast.success("Pengajuan produk titip jual berhasil dikirim!", {
      description: "Petugas koperasi akan melakukan verifikasi kualitas barang sebelum tayang.",
    });

    setIsFormOpen(false);
    setFormNamaProduk("");
  };

  const handleReview = (id: string, action: "APPROVE" | "REJECT") => {
    setSubmissions((prev) =>
      prev.map((sub) => {
        if (sub.id === id) {
          return {
            ...sub,
            status: action === "APPROVE" ? "DISETUJUI" : "DITOLAK",
            catatan:
              action === "APPROVE"
                ? "Disetujui untuk tayang di e-katalog koperasi"
                : "Belum memenuhi standar pengemasan koperasi",
          };
        }
        return sub;
      })
    );

    toast.success(
      action === "APPROVE"
        ? "Produk UMKM berhasil disetujui dan ditayangkan!"
        : "Pengajuan produk ditolak dengan catatan."
    );
  };

  const approvedList = submissions.filter((s) => s.status === "DISETUJUI");
  const pendingList = submissions.filter((s) => s.status === "DIAJUKAN");

  return (
    <div className="space-y-6">
      {/* Banner Intro */}
      <div className="rounded-3xl bg-gradient-to-r from-sidebar-accent via-card to-sidebar-accent p-6 border border-border shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <Badge className="bg-primary text-primary-foreground font-bold text-xs gap-1">
            <Store className="size-3.5" /> Marketplace UMKM Keluarga Prajurit & PNS
          </Badge>
          <h2 className="text-xl sm:text-2xl font-black text-foreground">
            Pemberdayaan Usaha Mandiri Anggota Koperasi
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Wadah bagi anggota dan keluarga Persit untuk menitipkan produk olahan pangan, kerajinan tangan, dan aksesoris dinas agar dapat dibeli oleh seluruh anggota koperasi.
          </p>
        </div>

        <Button
          onClick={() => setIsFormOpen(true)}
          className="h-11 px-5 rounded-2xl bg-primary text-primary-foreground font-bold gap-2 shadow-sm shrink-0"
        >
          <Plus className="size-4" /> Ajukan Produk Jualan
        </Button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("KATALOG")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "KATALOG"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          Etalase Produk Anggota ({approvedList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("VALIDASI")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "VALIDASI"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          Antrean Review Petugas ({pendingList.length})
          {pendingList.length > 0 && (
            <span className="size-2 rounded-full bg-gold animate-pulse" />
          )}
        </button>
      </div>

      {/* TAB KATALOG PRODUK ANGGOTA */}
      {activeTab === "KATALOG" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {approvedList.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-border/80 bg-card p-4 shadow-card hover:border-primary/40 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="relative aspect-16/10 w-full rounded-xl overflow-hidden bg-muted mb-3">
                  <img src={item.gambar} alt={item.namaProduk} className="size-full object-cover" />
                  <span className="absolute top-2 left-2 rounded-md bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 shadow-sm">
                    Produk Anggota
                  </span>
                </div>

                <div className="space-y-1">
                  <Badge variant="outline" className="text-[10px] font-medium">
                    {item.kategori}
                  </Badge>
                  <h4 className="text-sm font-bold text-foreground">{item.namaProduk}</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Penjual: <b>{item.anggotaNama}</b>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Harga Jual:</span>
                  <span className="text-base font-extrabold text-foreground font-mono">
                    {formatRp(item.hargaUsul)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block">Bagi Hasil Koperasi:</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {item.komisiPersen}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB VALIDASI PENGURUS */}
      {activeTab === "VALIDASI" && (
        <div className="space-y-3">
          {pendingList.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-dashed border-border text-muted-foreground">
              <ShieldCheck className="size-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm font-bold text-foreground">Tidak Ada Antrean Pengajuan</p>
              <p className="text-xs text-muted-foreground mt-1">Semua produk UMKM anggota sudah ditinjau</p>
            </div>
          ) : (
            pendingList.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-gold/30 bg-gold/5 p-4 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="size-16 rounded-xl bg-muted overflow-hidden shrink-0 border">
                    <img src={item.gambar} alt={item.namaProduk} className="size-full object-cover" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gold text-gold-foreground text-[10px] font-bold">
                        Menunggu Review
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground">{item.tanggal}</span>
                    </div>
                    <h4 className="text-sm font-bold text-foreground">{item.namaProduk}</h4>
                    <p className="text-xs text-muted-foreground">
                      Diajukan oleh: <b>{item.anggotaNama}</b> ({item.anggotaNrp}) | Usulan Harga:{" "}
                      <b className="font-mono text-primary">{formatRp(item.hargaUsul)}</b> (Stok Awal: {item.stokAwal} pcs)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReview(item.id, "REJECT")}
                    className="h-9 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10"
                  >
                    <XCircle className="size-3.5 mr-1" /> Tolak
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleReview(item.id, "APPROVE")}
                    className="h-9 rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-sm"
                  >
                    <CheckCircle2 className="size-3.5 mr-1" /> Setujui & Tayangkan
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* DIALOG FORM PENGAJUAN BARU */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Pengajuan Produk Titip Jual Anggota</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Nama Produk / Merek:</label>
              <Input
                value={formNamaProduk}
                onChange={(e) => setFormNamaProduk(e.target.value)}
                placeholder="Contoh: Sambal Bawang Teri Buatan Rumah"
                className="h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Kategori Produk:</label>
              <select
                value={formKategori}
                onChange={(e) => setFormKategori(e.target.value)}
                className="w-full h-10 rounded-xl bg-background border border-border px-3 font-medium text-xs"
              >
                <option value="Makanan Ringan">Makanan Ringan / Snack</option>
                <option value="Kesehatan & Herbal">Kesehatan & Herbal</option>
                <option value="Aksesoris & Kerajinan">Aksesoris & Kerajinan Tangan</option>
                <option value="Pakaian & Tekstil">Pakaian & Tekstil</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Harga Jual Usul (Rp):</label>
                <Input
                  type="number"
                  value={formHargaUsul}
                  onChange={(e) => setFormHargaUsul(Number(e.target.value))}
                  className="h-10 text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Stok Awal Titip (Pcs):</label>
                <Input
                  type="number"
                  value={formStokAwal}
                  onChange={(e) => setFormStokAwal(Number(e.target.value))}
                  className="h-10 text-xs font-mono"
                />
              </div>
            </div>

            <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-1 text-[11px] text-muted-foreground">
              <p className="font-bold text-foreground">Ketentuan Titip Jual:</p>
              <p>Bagi hasil koperasi standar adalah <b>5%</b> dari harga jual untuk jasa operasional kasir & display etalase.</p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="w-1/3 rounded-xl" onClick={() => setIsFormOpen(false)}>
                Batal
              </Button>
              <Button className="flex-1 rounded-xl bg-primary text-primary-foreground font-bold" onClick={handleAjukan}>
                Kirim Pengajuan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
