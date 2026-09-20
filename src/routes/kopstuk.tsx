import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Save, Loader2, Upload, RotateCcw, Image as ImageIcon, Check, Info, FileText, MapPin } from "lucide-react";
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

const DEFAULT_LAMPIRAN_KOPSTUK: Record<string, { line1: string; line2: string }> = {
  lampiran2: { line1: "Lampiran II", line2: "Lomba Rekayasa Teknologi Informasi TA 2026" },
  lampiran3: { line1: "Lampiran III", line2: "Lomba Rekayasa Teknologi Informasi TA 2026" },
  lampiran4: { line1: "Lampiran IV", line2: "Lomba Rekayasa Teknologi Informasi TA 2026" },
  lampiran5: { line1: "Lampiran V", line2: "Lomba Rekayasa Teknologi Informasi TA 2026" },
  lampiran6: { line1: "Lampiran VI", line2: "Lomba Rekayasa Teknologi Informasi TA 2026" },
  lampiran7: { line1: "Lampiran VII", line2: "Lomba Rekayasa Teknologi Informasi TA 2026" },
  lampiran8: { line1: "Lampiran VIII", line2: "Lomba Rekayasa Teknologi Informasi TA 2026" },
  lampiran9: { line1: "Lampiran IX", line2: "Lomba Rekayasa Teknologi Informasi TA 2026" },
};

function KopstukPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [baris1, setBaris1] = useState("MARKAS BESAR ANGKATAN DARAT");
  const [baris2, setBaris2] = useState("DINAS INFORMASI DAN PENGOLAHAN DATA");
  const [baris3, setBaris3] = useState("Jl. Perintis Kemerdekaan, Watugong, Semarang");
  const [garisGanda, setGarisGanda] = useState(true);
  const [showLogo, setShowLogo] = useState(true);
  const [selectedLogo, setSelectedLogo] = useState<string>(primkopKartika);
  const [activePresetId, setActivePresetId] = useState<string | null>("primkop");

  // Per-Lampiran Kopstuk Configuration (Independent)
  const [lampiranKopstuk, setLampiranKopstuk] = useState<Record<string, { line1: string; line2: string }>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("casheva_lampiran_kopstuk_map");
      if (saved) {
        try {
          return { ...DEFAULT_LAMPIRAN_KOPSTUK, ...JSON.parse(saved) };
        } catch {
          // fallback
        }
      }
    }
    return DEFAULT_LAMPIRAN_KOPSTUK;
  });

  // Kwitansi Location & Position Setting
  const [lokasiKwitansi, setLokasiKwitansi] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("casheva_lokasi_kwitansi") || "Jakarta, 15-06-2026";
    }
    return "Jakarta, 15-06-2026";
  });
  const [jabatanKwitansi, setJabatanKwitansi] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("casheva_jabatan_kwitansi") || "Kaprimkopad,";
    }
    return "Kaprimkopad,";
  });

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
      if (kopstuk.baris1 || kopstuk.namaSatuan) setBaris1(kopstuk.baris1 || kopstuk.namaSatuan);
      if (kopstuk.baris2 || kopstuk.namaBalak) setBaris2(kopstuk.baris2 || kopstuk.namaBalak);
      if (kopstuk.baris3 || kopstuk.alamat) setBaris3(kopstuk.baris3 || kopstuk.alamat);
      if (typeof kopstuk.garisGanda === "boolean") setGarisGanda(kopstuk.garisGanda);
      if (kopstuk.logoUrl && !savedLogo) {
        setSelectedLogo(kopstuk.logoUrl);
      }
    }
  }, [kopstuk]);

  const handleUpdateLampiranKopstuk = (key: string, field: "line1" | "line2", value: string) => {
    const updated = {
      ...lampiranKopstuk,
      [key]: {
        ...(lampiranKopstuk[key] || DEFAULT_LAMPIRAN_KOPSTUK[key] || { line1: "", line2: "" }),
        [field]: value,
      },
    };
    setLampiranKopstuk(updated);
  };

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
      localStorage.setItem("casheva_lampiran_kopstuk_map", JSON.stringify(lampiranKopstuk));
      localStorage.setItem("casheva_lokasi_kwitansi", lokasiKwitansi);
      localStorage.setItem("casheva_jabatan_kwitansi", jabatanKwitansi);

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
      toast.success("Pengaturan Kopstuk & Seluruh Lampiran Berhasil Disimpan!");
    },
    onError: (err: any) => {
      toast.error("Gagal Menyimpan Kopstuk", { description: err.message });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Kopstuk Satuan &amp; Lampiran"
        description="Konfigurasi kop surat satuan dinamis, kopstuk kanan per-lampiran (II s.d IX), dan preferensi cetak resmi"
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

      <div className="grid gap-6 md:grid-cols-12 lg:grid-cols-12">
        {/* PANEL KIRI: FORM PENGATURAN KOP & LOGO (7 COLS) */}
        <div className="md:col-span-7 lg:col-span-7 space-y-6">
          {/* Card Identitas Satuan / Kopstuk Kiri */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="size-4 text-primary" /> Kopstuk Kiri — Identitas Satuan &amp; Balak
              </CardTitle>
              <CardDescription>Teks kepala surat dinamis di sisi kiri seluruh dokumen cetak lampiran</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Baris 1 — Komando Atas / Markas Besar</Label>
                <Input value={baris1} onChange={(e) => setBaris1(e.target.value)} placeholder="Contoh: MARKAS BESAR ANGKATAN DARAT" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Baris 2 — Badan Pelaksana Pusat / Dinas</Label>
                <Input value={baris2} onChange={(e) => setBaris2(e.target.value)} placeholder="Contoh: DINAS INFORMASI DAN PENGOLAHAN DATA" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Baris 3 — Kedudukan / Alamat Satuan</Label>
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

          {/* Card Pengaturan Kopstuk Kanan Per Lampiran */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="size-4 text-primary" /> Kopstuk Kanan Masing-Masing Lampiran (Independen)
              </CardTitle>
              <CardDescription>
                Setiap lampiran memiliki judul kopstuk kanan tersendiri tanpa saling menimpa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(DEFAULT_LAMPIRAN_KOPSTUK).map((lampKey) => {
                const cfg = lampiranKopstuk[lampKey] || DEFAULT_LAMPIRAN_KOPSTUK[lampKey];
                const label = lampKey.replace("lampiran", "Lampiran ");
                return (
                  <div key={lampKey} className="p-3 bg-muted/20 rounded-xl border border-border space-y-2">
                    <p className="text-xs font-bold uppercase text-primary">{label}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[11px]">Baris 1:</Label>
                        <Input
                          value={cfg.line1}
                          onChange={(e) => handleUpdateLampiranKopstuk(lampKey, "line1", e.target.value)}
                          className="h-8 text-xs font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px]">Baris 2:</Label>
                        <Input
                          value={cfg.line2}
                          onChange={(e) => handleUpdateLampiranKopstuk(lampKey, "line2", e.target.value)}
                          className="h-8 text-xs font-medium"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Card Pengaturan Lokasi Kwitansi (Lampiran VII) */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="size-4 text-primary" /> Pengaturan Lokasi Kwitansi (Lampiran VII)
              </CardTitle>
              <CardDescription>
                Dapat diubah dinamis oleh Keprim, Bendahara, dan Admin koperasi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Tempat &amp; Tanggal:</Label>
                  <Input
                    value={lokasiKwitansi}
                    onChange={(e) => setLokasiKwitansi(e.target.value)}
                    placeholder="Jakarta, 15-06-2026"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Jabatan Pengesah:</Label>
                  <Input
                    value={jabatanKwitansi}
                    onChange={(e) => setJabatanKwitansi(e.target.value)}
                    placeholder="Kaprimkopad,"
                  />
                </div>
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

              {/* Preset Logos */}
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
                  <b>Petunjuk Format:</b> Gunakan file gambar berformat PNG transparan, JPG, atau WebP dengan resolusi tinggi untuk hasil cetak terbaik.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PANEL KANAN: PRATINJAU KOP CETAK REALTIME (5 COLS) */}
        <div className="md:col-span-5 lg:col-span-5">
          <Card className="shadow-card sticky top-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="size-4 text-primary" /> Pratinjau Kop Cetak Resmi
              </CardTitle>
              <CardDescription>Bentuk visual dokumen saat dicetak secara fisik / PDF</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="print-sheet rounded-xl p-6 bg-card border border-border shadow-inner font-sans">
                <div className="flex justify-between items-start text-xs font-bold text-foreground">
                  <div className="text-left space-y-0.5">
                    <p className="uppercase">{baris1}</p>
                    <p className="uppercase">{baris2}</p>
                  </div>
                  <div className="text-left space-y-0.5">
                    <p>{lampiranKopstuk.lampiran2?.line1 || "Lampiran II"}</p>
                    <p>{lampiranKopstuk.lampiran2?.line2 || "Lomba Rekayasa Teknologi Informasi TA 2026"}</p>
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
                    LAMPIRAN DOKUMEN CETAK RESMI
                  </p>
                  <p className="text-[11px] text-muted-foreground italic">
                    (Format kopstuk ini otomatis diterapkan pada Lampiran II s.d IX, Kwitansi, Akad, dan Formulir Pinjaman)
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
