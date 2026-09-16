import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Save, Loader2, Upload, RotateCcw, Image as ImageIcon, Check, Info } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { apiKopstuk } from "@/lib/api";

import logoKoperasi from "@/assets/logo-koperasi.png";
import primkopKartika from "@/assets/primkop-kartika.png";
import cashevaEmblem from "@/assets/casheva-emblem.png";

export const Route = createFileRoute("/kopstuk")({
  head: () => ({
    meta: [
      { title: "Pengaturan Kopstuk — Casheva" },
      {
        name: "description",
        content:
          "Atur kop surat satuan, logo kustom, dan preferensi cetak dokumen resmi koperasi TNI AD.",
      },
      { property: "og:title", content: "Pengaturan Kopstuk — Casheva" },
      {
        property: "og:description",
        content: "Konfigurasi kop surat, logo dinamis, dan preferensi cetak dokumen koperasi TNI AD.",
      },
    ],
  }),
  component: KopstukPage,
});

const PRESET_LOGOS = [
  {
    id: "primkop",
    label: "Primkop Kartika",
    subLabel: "Lambang Resmi Primkop Kartika TNI AD",
    src: primkopKartika,
  },
  {
    id: "casheva",
    label: "Emblem Casheva",
    subLabel: "Lambang Modern Casheva Diponegoro",
    src: cashevaEmblem,
  },
];

function KopstukPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [baris1, setBaris1] = useState("KOMANDO DAERAH MILITER IV/DIPONEGORO");
  const [baris2, setBaris2] = useState("PRIMER KOPERASI KARTIKA INFOLAHTADAM IV/DIPONEGORO");
  const [baris3, setBaris3] = useState("Jl. Perintis Kemerdekaan, Watugong, Semarang");
  const [garisGanda, setGarisGanda] = useState(true);
  const [showLogo, setShowLogo] = useState(true);
  const [selectedLogo, setSelectedLogo] = useState<string>(primkopKartika);
  const [activePresetId, setActivePresetId] = useState<string | null>("primkop");

  const { data: kopstuk } = useQuery({
    queryKey: ["kopstuk-active"],
    queryFn: () => apiKopstuk.get(),
  });

  useEffect(() => {
    // Load from localStorage or API
    const savedLogo = localStorage.getItem("casheva_kopstuk_logo");
    const savedPreset = localStorage.getItem("casheva_kopstuk_preset_id");
    const savedShowLogo = localStorage.getItem("casheva_kopstuk_show_logo");
    const savedGaris = localStorage.getItem("casheva_kopstuk_garis_ganda");

    if (savedLogo) {
      setSelectedLogo(savedLogo);
      setActivePresetId(savedPreset || (savedLogo.startsWith("data:") ? "custom" : null));
    }
    if (savedShowLogo !== null) {
      setShowLogo(savedShowLogo === "true");
    }
    if (savedGaris !== null) {
      setGarisGanda(savedGaris === "true");
    }

    if (kopstuk) {
      if (kopstuk.baris1) setBaris1(kopstuk.baris1);
      if (kopstuk.baris2) setBaris2(kopstuk.baris2);
      if (kopstuk.baris3) setBaris3(kopstuk.baris3);
      if (typeof kopstuk.garisGanda === "boolean") setGarisGanda(kopstuk.garisGanda);
      if (kopstuk.logoUrl && !savedLogo) {
        setSelectedLogo(kopstuk.logoUrl);
      }
    }
  }, [kopstuk]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berformat gambar (PNG, JPG, SVG, atau WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file logo terlalu besar. Maksimal 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setSelectedLogo(base64);
        setActivePresetId("custom");
        toast.success("Logo kustom berhasil diunggah dan dimuat ke pratinjau!");
      }
    };
    reader.readAsDataURL(file);
    // Reset file input value so user can re-upload same file if needed
    e.target.value = "";
  };

  const handleSelectPreset = (preset: (typeof PRESET_LOGOS)[0]) => {
    setSelectedLogo(preset.src);
    setActivePresetId(preset.id);
    toast.info(`Logo diubah ke "${preset.label}"`);
  };

  const handleResetLogo = () => {
    setSelectedLogo(primkopKartika);
    setActivePresetId("primkop");
    toast.info("Logo dikembalikan ke lambang resmi Primkop Kartika.");
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Simpan ke localStorage untuk akses instan cepat di seluruh aplikasi
      localStorage.setItem("casheva_kopstuk_logo", selectedLogo);
      localStorage.setItem("casheva_kopstuk_preset_id", activePresetId || "custom");
      localStorage.setItem("casheva_kopstuk_show_logo", String(showLogo));
      localStorage.setItem("casheva_kopstuk_garis_ganda", String(garisGanda));
      localStorage.setItem("casheva_kopstuk_baris1", baris1);
      localStorage.setItem("casheva_kopstuk_baris2", baris2);
      localStorage.setItem("casheva_kopstuk_baris3", baris3);

      return apiKopstuk.upsert({
        baris1,
        baris2,
        baris3,
        garisGanda,
        showLogo,
        logoUrl: selectedLogo,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kopstuk-active"] });
      toast.success("Pengaturan Kopstuk & Logo Satuan Berhasil Disimpan!");
    },
    onError: (err: any) => {
      toast.error("Gagal Menyimpan Kopstuk", { description: err.message });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Kopstuk Satuan"
        description="Konfigurasi kop surat satuan, kustomisasi logo dinamis, dan preferensi cetak resmi (Lampiran I s.d IX)"
        actions={
          <Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()} className="font-bold">
            {saveMutation.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            Simpan Perubahan
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* PANEL KIRI: FORM PENGATURAN KOP & LOGO (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card Identitas Satuan */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="size-4 text-primary" /> Identitas Satuan &amp; Koperasi
              </CardTitle>
              <CardDescription>Teks yang tampil pada kepala surat dokumen cetak kedinasan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Baris 1 — Komando Atas (Kotama)</Label>
                <Input value={baris1} onChange={(e) => setBaris1(e.target.value)} placeholder="Contoh: KOMANDO DAERAH MILITER IV/DIPONEGORO" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Baris 2 — Nama Koperasi Primer</Label>
                <Input value={baris2} onChange={(e) => setBaris2(e.target.value)} placeholder="Contoh: PRIMER KOPERASI KARTIKA INFOLAHTADAM IV/DIPONEGORO" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Baris 3 — Alamat / Kedudukan Satuan</Label>
                <Input value={baris3} onChange={(e) => setBaris3(e.target.value)} placeholder="Contoh: Jl. Perintis Kemerdekaan, Watugong, Semarang" />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Tampilkan logo satuan / Kartika</p>
                  <p className="text-xs text-muted-foreground">Logo di sisi kiri kepala kopstuk</p>
                </div>
                <Switch checked={showLogo} onCheckedChange={setShowLogo} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Garis pemisah ganda dinas</p>
                  <p className="text-xs text-muted-foreground">Garis tebal ganda standar tata naskah TNI AD</p>
                </div>
                <Switch checked={garisGanda} onCheckedChange={setGarisGanda} />
              </div>
            </CardContent>
          </Card>

          {/* Card Pengaturan Logo Dinamis */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ImageIcon className="size-4 text-primary" /> Pengaturan Logo Kop Surat
                </span>
                <Badge variant={activePresetId === "custom" ? "default" : "secondary"} className="text-[11px]">
                  {activePresetId === "custom" ? "Logo Kustom" : "Preset Resmi"}
                </Badge>
              </CardTitle>
              <CardDescription>
                Pilih logo resmi atau unggah lambang kesatuan/koperasi kustom secara dinamis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Active Logo Visual & Action */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-dashed border-border bg-muted/20">
                <div className="relative flex size-20 shrink-0 items-center justify-center rounded-xl bg-muted/40 p-1">
                  <img src={selectedLogo} alt="Logo Kopstuk" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="flex-1 space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <p className="text-sm font-bold text-foreground">
                      {activePresetId === "custom"
                        ? "Logo Unggahan Kustom"
                        : PRESET_LOGOS.find((p) => p.id === activePresetId)?.label || "Logo Kop Surat"}
                    </p>
                    {activePresetId === "custom" && (
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] py-0">Aktif</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Logo ini akan otomatis dicetak pada seluruh lampiran laporan resmi dan dokumen kasir.
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 text-xs font-semibold rounded-lg"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="size-3.5 text-primary" /> Unggah Logo Baru
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg"
                      onClick={handleResetLogo}
                    >
                      <RotateCcw className="size-3.5" /> Reset Default
                    </Button>
                  </div>
                </div>
              </div>

              {/* Preset Logos Section */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Pilihan Lambang Resmi Bawaan:
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRESET_LOGOS.map((preset) => {
                    const isSelected = activePresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                            : "border-border bg-card hover:bg-muted/50 hover:border-primary/40"
                        }`}
                      >
                        <div className="size-10 shrink-0 rounded-lg border border-border/60 bg-card p-1 flex items-center justify-center">
                          <img src={preset.src} alt={preset.label} className="size-full object-contain" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate text-foreground">{preset.label}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{preset.subLabel}</p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <Check className="size-2.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/40 text-[11px] text-muted-foreground">
                <Info className="size-4 shrink-0 text-primary mt-0.5" />
                <span>
                  <b>Petunjuk Format:</b> Gunakan file gambar berformat PNG transparan, JPG, atau WebP dengan resolusi tinggi (rekomendasi rasio 1:1, maks. 5MB) untuk hasil cetak dokumen naskah dinas terbaik.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PANEL KANAN: PRATINJAU KOP CETAK REALTIME (5 COLS) */}
        <div className="lg:col-span-5">
          <Card className="shadow-card sticky top-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="size-4 text-primary" /> Pratinjau Kop Cetak Resmi
              </CardTitle>
              <CardDescription>Bentuk visual dokumen saat dicetak secara fisik / PDF</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="print-sheet rounded-xl p-6 bg-card border border-border shadow-inner font-sans">
                <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
                  {showLogo && (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center">
                      <img src={selectedLogo} alt="Logo Satuan" className="max-h-16 max-w-16 object-contain" />
                    </div>
                  )}
                  <div className="min-w-0 text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{baris1}</p>
                    <p className="text-sm sm:text-base font-extrabold uppercase text-foreground leading-tight">{baris2}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{baris3}</p>
                  </div>
                </div>

                <div
                  className={
                    garisGanda
                      ? "mt-4 border-b-4 border-double border-foreground"
                      : "mt-4 border-b border-foreground"
                  }
                />

                <div className="mt-8 pt-4 border-t border-dashed border-border/60 text-center space-y-1">
                  <p className="text-xs font-bold text-foreground">
                    LAMPIRAN DOKUMEN CETAK RESMI PRIMKOPKAR
                  </p>
                  <p className="text-[11px] text-muted-foreground italic">
                    (Format kopstuk ini otomatis diterapkan pada Lampiran I s.d IX, Kwitansi, Akad, dan Formulir Pinjaman)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
