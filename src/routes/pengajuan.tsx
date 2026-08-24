import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FilePlus2,
  UploadCloud,
  FileText,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Wallet,
  PiggyBank,
  Info,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { useSession } from "@/components/session-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRp, formatNamaLengkapDinas, formatPangkatKorps } from "@/lib/casheva-data";
import { api, apiAnggota, apiPinjaman, apiSimpanan } from "@/lib/api";

export const Route = createFileRoute("/pengajuan")({
  head: () => ({
    meta: [
      { title: "Pengajuan Pinjaman & Simpanan — Casheva Koperasi TNI AD" },
      {
        name: "description",
        content:
          "Ajukan pinjaman dan simpanan khusus/sukarela dengan validasi plafond kategori pangkat TNI AD.",
      },
      { property: "og:title", content: "Pengajuan — Casheva" },
      {
        property: "og:description",
        content: "Formulir pengajuan pinjaman dan simpanan koperasi TNI AD.",
      },
    ],
  }),
  component: PengajuanPage,
});

const loanDocs = [
  "Surat Permohonan Usipa",
  "Rekomendasi Juru Bayar",
  "Surat Rekomendasi Dan/Ka/Bagian",
  "Surat Perjanjian Akad Kredit",
  "Fotokopi KTP / KTA",
  "Rincian Gaji, ULP & Tunkin",
];

function PengajuanPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role } = useSession();

  const [activeTab, setActiveTab] = useState<"pinjaman" | "simpanan">("pinjaman");
  const [selectedAnggotaId, setSelectedAnggotaId] = useState("");
  const [amount, setAmount] = useState(10_000_000);
  const [tenor, setTenor] = useState(24);
  const [note, setNote] = useState("");
  const [loanFiles, setLoanFiles] = useState<Record<string, string>>({});

  // Form Simpanan Khusus/Sukarela
  const [jenisSimpanan, setJenisSimpanan] = useState<"SUKARELA" | "KHUSUS">("SUKARELA");
  const [nominalSimpanan, setNominalSimpanan] = useState(500_000);
  const [keteranganSimpanan, setKeteranganSimpanan] = useState("");

  const { data: anggotaList = [], isLoading: loadingAnggota } = useQuery({
    queryKey: ["anggota-list-active"],
    queryFn: () => apiAnggota.findAll(true),
  });

  const { data: bungaData } = useQuery({
    queryKey: ["pengaturan-bunga"],
    queryFn: () => api.get("/pinjaman/pengaturan-bunga"),
  });

  // Query info plafond real-time untuk anggota yang dipilih
  const { data: plafondInfo, isLoading: loadingPlafond } = useQuery({
    queryKey: ["plafond-info", selectedAnggotaId],
    queryFn: () => apiPinjaman.getPlafond(selectedAnggotaId),
    enabled: !!selectedAnggotaId,
  });

  const activeBungaPersenTahun = bungaData?.bungaPersenTahun ?? 12;
  const activeBungaPersenBulan = activeBungaPersenTahun / 12;

  const selectedAnggota = anggotaList.find((a) => a.id === selectedAnggotaId);

  // Batas Plafond dinamis berdasarkan kategori pangkat
  const maxPlafond = plafondInfo?.maksPlafond ?? 50_000_000;
  const pinjamanAktif = plafondInfo?.totalPinjamanAktif ?? 0;
  const sisaKuota = plafondInfo?.sisaKuota ?? maxPlafond;
  const totalAkumulasi = pinjamanAktif + amount;
  const isPlafondExceeded = totalAkumulasi > maxPlafond;

  // Sesuaikan nilai default amount saat anggota berubah
  useEffect(() => {
    if (plafondInfo) {
      if (amount > maxPlafond) {
        setAmount(maxPlafond);
      }
    }
  }, [plafondInfo]);

  // Kalkulasi angsuran flat sesuai Juknis
  const calc = useMemo(() => {
    const bungaTahunanRate = activeBungaPersenTahun / 100;
    const bungaBulananRate = activeBungaPersenBulan / 100;
    const angsuranPokok = Math.floor(amount / tenor);
    const bungaBulanan = Math.floor(amount * bungaBulananRate);
    const totalAngsuran = angsuranPokok + bungaBulanan;
    const totalPengembalian = amount + bungaBulanan * tenor;
    return {
      bungaTahunanRate,
      bungaBulananRate,
      angsuranPokok,
      bungaBulanan,
      totalAngsuran,
      totalPengembalian,
    };
  }, [amount, tenor, activeBungaPersenTahun, activeBungaPersenBulan]);

  const createLoanMutation = useMutation({
    mutationFn: () =>
      apiPinjaman.create({
        anggotaId: selectedAnggotaId,
        nominal: amount,
        tenorBulan: tenor,
        catatan: note,
      }),
    onSuccess: (res) => {
      toast.success("Pengajuan Pinjaman Berhasil Dikirim", {
        description: `Nomor Berkas: ${res.id.slice(0, 8).toUpperCase()} — Diteruskan ke Juru Bayar untuk verifikasi gaji.`,
      });
      queryClient.invalidateQueries({ queryKey: ["pinjaman-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["plafond-info"] });
      navigate({ to: "/pinjaman" });
    },
    onError: (err: any) => {
      toast.error("Gagal Mengajukan Pinjaman", {
        description: err.message || "Pastikan pengajuan tidak melebihi batas plafond.",
      });
    },
  });

  const setorSimpananMutation = useMutation({
    mutationFn: () =>
      apiSimpanan.setor({
        anggotaId: selectedAnggotaId,
        jenis: jenisSimpanan,
        nominal: nominalSimpanan,
        keterangan: keteranganSimpanan || `Pengajuan simpanan ${jenisSimpanan.toLowerCase()}`,
      }),
    onSuccess: () => {
      toast.success(`Pengajuan Simpanan ${jenisSimpanan} Berhasil`, {
        description: `Setoran sebesar ${formatRp(nominalSimpanan)} berhasil dicatat.`,
      });
      queryClient.invalidateQueries({ queryKey: ["simpanan-rekap"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      navigate({ to: "/simpanan" });
    },
    onError: (err: any) => {
      toast.error("Gagal Mengajukan Simpanan", {
        description: err.message || "Terjadi kesalahan sistem.",
      });
    },
  });

  const handleSubmitPinjaman = () => {
    if (!selectedAnggotaId) {
      toast.error("Pilih Anggota", {
        description: "Silakan pilih anggota pemohon pinjaman terlebih dahulu.",
      });
      return;
    }
    if (isPlafondExceeded) {
      toast.error("Batas Plafond Terlampaui!", {
        description: `Akumulasi pinjaman (${formatRp(totalAkumulasi)}) melebihi batas maksimal (${formatRp(maxPlafond)}). Maksimal sisa kuota yang dapat diajukan: ${formatRp(sisaKuota)}.`,
      });
      return;
    }
    if (amount < 1_000_000 || amount > maxPlafond) {
      toast.error("Plafon tidak valid", {
        description: `Pinjaman minimal Rp 1.000.000 dan maksimal ${formatRp(maxPlafond)}.`,
      });
      return;
    }
    if (tenor < 1 || tenor > 36) {
      toast.error("Tenor tidak valid", {
        description: "Jangka waktu pinjaman maksimal 36 bulan.",
      });
      return;
    }

    createLoanMutation.mutate();
  };

  const handleSubmitSimpanan = () => {
    if (!selectedAnggotaId) {
      toast.error("Pilih Anggota", {
        description: "Silakan pilih anggota yang menyetor simpanan.",
      });
      return;
    }
    if (nominalSimpanan < 10_000) {
      toast.error("Nominal minimal Rp 10.000", {
        description: "Masukkan nominal setoran yang valid.",
      });
      return;
    }
    setorSimpananMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengajuan Koperasi TNI AD"
        description="Layanan pengajuan pinjaman dengan validasi plafond kategori pangkat serta setoran simpanan khusus/sukarela."
      />

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pinjaman" className="gap-2">
            <Wallet className="size-4" /> Pengajuan Pinjaman
          </TabsTrigger>
          <TabsTrigger value="simpanan" className="gap-2">
            <PiggyBank className="size-4" /> Simpanan Khusus / Sukarela
          </TabsTrigger>
        </TabsList>

        {/* ============================================================== */}
        {/* TAB 1: PENGAJUAN PINJAMAN */}
        {/* ============================================================== */}
        <TabsContent value="pinjaman" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left 2 Cols: Form Input */}
            <div className="space-y-6 lg:col-span-2">
              {/* 1. Pilih Anggota */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>1. Data Personel Pemohon</CardTitle>
                  <CardDescription>
                    Pilih personel anggota yang mengajukan permohonan pinjaman
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Pilih Anggota Koperasi</Label>
                    <Select value={selectedAnggotaId} onValueChange={setSelectedAnggotaId}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="-- Pilih Personel Pemohon --" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {anggotaList.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {formatNamaLengkapDinas(a.nama, a.pangkat?.nama, a.korps?.nama, a.pangkat?.kategori)} (NRP: {a.nrpNip})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedAnggota && (
                    <div className="rounded-xl border border-primary/25 bg-primary-soft/50 p-4 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nama &amp; Pangkat:</span>
                        <span className="font-semibold text-foreground">
                          {formatNamaLengkapDinas(selectedAnggota.nama, selectedAnggota.pangkat?.nama, selectedAnggota.korps?.nama, selectedAnggota.pangkat?.kategori)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">NRP / NIP:</span>
                        <span className="font-mono font-medium">{selectedAnggota.nrpNip}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Kesatuan / Satminkal:</span>
                        <span>{selectedAnggota.satminkal?.nama || "Disinfolahtad"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Kategori Pangkat:</span>
                        <Badge variant="outline" className="font-semibold">
                          {plafondInfo?.label || selectedAnggota.pangkat?.kategori || "Bintara/PNS"}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Ringkasan Status Plafond Anggota */}
                  {selectedAnggotaId && plafondInfo && (
                    <div className="rounded-xl border p-4 text-xs space-y-3 bg-muted/30">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="flex items-center gap-1.5 text-foreground">
                          <Info className="size-4 text-primary" /> Status Kuota Plafon Koperasi:
                        </span>
                        <span className="font-mono text-primary font-bold">
                          Maks. {formatRp(maxPlafond)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-lg bg-background border">
                          <div className="text-muted-foreground text-[10px]">Pinjaman Aktif</div>
                          <div className="font-bold text-foreground mt-0.5">{formatRp(pinjamanAktif)}</div>
                        </div>
                        <div className="p-2 rounded-lg bg-background border">
                          <div className="text-muted-foreground text-[10px]">Sisa Kuota Plafon</div>
                          <div className={`font-bold mt-0.5 ${sisaKuota > 0 ? "text-success" : "text-destructive"}`}>
                            {formatRp(sisaKuota)}
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-background border col-span-2 sm:col-span-1">
                          <div className="text-muted-foreground text-[10px]">Total Setelah Pengajuan</div>
                          <div className={`font-bold mt-0.5 ${isPlafondExceeded ? "text-destructive" : "text-primary"}`}>
                            {formatRp(totalAkumulasi)}
                          </div>
                        </div>
                      </div>

                      {/* WARNING CARD JIKA MELEBIHI PLAFOND */}
                      {isPlafondExceeded && (
                        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3.5 text-destructive space-y-1 animate-pulse">
                          <div className="flex items-center gap-2 font-bold text-sm">
                            <AlertTriangle className="size-5 shrink-0 text-destructive" />
                            <span>Peringatan: Pengajuan Melebihi Batas Plafon!</span>
                          </div>
                          <p className="text-[11px] leading-relaxed">
                            Personel ini memiliki pinjaman aktif berjalan sebesar <strong>{formatRp(pinjamanAktif)}</strong>.
                            Pengajuan baru sebesar <strong>{formatRp(amount)}</strong> akan menghasilkan akumulasi pinjaman sebesar <strong>{formatRp(totalAkumulasi)}</strong>,
                            melebihi batas maksimal <strong>{formatRp(maxPlafond)}</strong> untuk kategori {plafondInfo?.kategoriPangkat === "PAMEN" || plafondInfo?.kategoriPangkat === "PAMA" || plafondInfo?.kategoriPangkat === "PATI" ? "Perwira" : "Bintara / PNS"}.
                          </p>
                          <p className="text-[11px] font-semibold text-destructive">
                            👉 Maksimal nominal pinjaman baru yang dapat disetujui saat ini: <strong>{formatRp(sisaKuota)}</strong>.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 2. Plafon & Tenor */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>2. Plafon & Tenor Pinjaman</CardTitle>
                  <CardDescription>
                    Ketentuan Juknis: Ba/PNS maks. Rp 50 Jt, Perwira maks. Rp 100 Jt. Bunga aktif: {activeBungaPersenTahun}% p.a ({activeBungaPersenBulan.toFixed(2).replace(/\.00$/, '')}% p.m flat)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Nominal Pengajuan Pinjaman</Label>
                      <span className={`text-xl font-bold ${isPlafondExceeded ? "text-destructive" : "text-primary"}`}>
                        {formatRp(amount)}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min={1_000_000}
                        max={maxPlafond}
                        step={500_000}
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value) || 1_000_000)}
                        className="h-10 text-base font-semibold"
                      />
                    </div>

                    <Slider
                      value={[amount]}
                      min={1_000_000}
                      max={maxPlafond}
                      step={500_000}
                      onValueChange={(val) => setAmount(val[0] || 1_000_000)}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Min: Rp 1.000.000</span>
                      <span className="font-semibold text-primary">Batas Kategori: {formatRp(maxPlafond)}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Jangka Waktu (Tenor)</Label>
                      <span className="text-xl font-bold text-foreground">{tenor} Bulan</span>
                    </div>
                    <Slider
                      value={[tenor]}
                      min={6}
                      max={36}
                      step={1}
                      onValueChange={(val) => setTenor(val[0] || 12)}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>6 Bulan</span>
                      <span>12 Bulan</span>
                      <span>24 Bulan</span>
                      <span>Maks: 36 Bulan</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Catatan / Keperluan Pinjaman</Label>
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Contoh: Keperluan renovasi rumah dinas / biaya pendidikan putra-putri"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 3. Berkas Persyaratan */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>3. Dokumen Persyaratan Pinjaman (Lampiran Juknis)</CardTitle>
                  <CardDescription>
                    Kelengkapan dokumen fisik / digital untuk verifikasi berjenjang
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {loanDocs.map((doc) => (
                      <div
                        key={doc}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="size-4 text-primary shrink-0" />
                          <span className="truncate font-medium">{doc}</span>
                        </div>
                        <label className="cursor-pointer shrink-0">
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setLoanFiles((prev) => ({
                                  ...prev,
                                  [doc]: file.name,
                                }));
                                toast.success(`${doc} dipilih`);
                              }
                            }}
                          />
                          <Badge
                            variant={loanFiles[doc] ? "default" : "outline"}
                            className="cursor-pointer text-[10px]"
                          >
                            {loanFiles[doc] ? "Terunggah" : "Pilih Berkas"}
                          </Badge>
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right 1 Col: Resume Simulation */}
            <div className="space-y-6">
              <Card className={`shadow-card sticky top-20 ${isPlafondExceeded ? "border-destructive/60" : "border-primary/30"}`}>
                <CardHeader className={`${isPlafondExceeded ? "bg-destructive/10" : "bg-primary/5"} pb-4`}>
                  <CardTitle className={`text-base ${isPlafondExceeded ? "text-destructive" : "text-primary"}`}>
                    Resume Simulasi Angsuran
                  </CardTitle>
                  <CardDescription>
                    Bunga {activeBungaPersenBulan.toFixed(2).replace(/\.00$/, '')}% / bulan (Flat Juknis)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plafon Pokok:</span>
                      <span className="font-semibold">{formatRp(amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Jangka Waktu:</span>
                      <span className="font-semibold">{tenor} Bulan</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Suku Bunga (Flat):</span>
                      <span className="font-semibold text-success">
                        {activeBungaPersenTahun}% / thn ({activeBungaPersenBulan.toFixed(2).replace(/\.00$/, '')}% / bln)
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Angsuran Pokok:</span>
                      <span>{formatRp(calc.angsuranPokok)} / bln</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Bunga Pinjaman:</span>
                      <span>{formatRp(calc.bungaBulanan)} / bln</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center rounded-xl bg-primary-soft p-3">
                      <span className="font-bold text-primary text-xs">Total Angsuran / Bulan:</span>
                      <span className="text-lg font-extrabold text-primary">
                        {formatRp(calc.totalAngsuran)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Total Pengembalian:</span>
                      <span className="font-medium text-foreground">{formatRp(calc.totalPengembalian)}</span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted/60 p-3 text-[11px] text-muted-foreground space-y-1">
                    <p className="font-semibold text-foreground">Alur Verifikasi Hierarki:</p>
                    <p>1. Verifikasi Juru Bayar (Kemampuan Gaji)</p>
                    <p>2. Rekomendasi Dan / Ka / Bagian</p>
                    <p>3. ACC Kepala Primkopad (Keprim)</p>
                    <p>4. Pencairan Dana oleh Bendahara</p>
                  </div>

                  <Button
                    size="lg"
                    disabled={!selectedAnggotaId || isPlafondExceeded || createLoanMutation.isPending}
                    onClick={handleSubmitPinjaman}
                    className={`w-full font-semibold shadow-md ${isPlafondExceeded ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}`}
                  >
                    {createLoanMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" /> Mengirimkan...
                      </>
                    ) : isPlafondExceeded ? (
                      <>
                        <ShieldAlert className="mr-2 size-4" /> Plafon Terlampaui (Tidak Dapat Dikirim)
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 size-4" /> Kirim Pengajuan Pinjaman
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 2: PENGAJUAN SIMPANAN KHUSUS & SUKARELA */}
        {/* ============================================================== */}
        <TabsContent value="simpanan" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Formulir Simpanan Khusus & Sukarela</CardTitle>
                  <CardDescription>
                    Simpanan Khusus (Hari Raya / Qurban / Kegiatan Khusus) dan Simpanan Sukarela bersifat opsional berdasarkan persetujuan Bendahara dan Anggota.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label>Pilih Anggota Penyetor</Label>
                    <Select value={selectedAnggotaId} onValueChange={setSelectedAnggotaId}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="-- Pilih Anggota Penyetor --" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {anggotaList.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {formatNamaLengkapDinas(a.nama, a.pangkat?.nama, a.korps?.nama, a.pangkat?.kategori)} (NRP: {a.nrpNip})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Jenis Simpanan</Label>
                    <Select value={jenisSimpanan} onValueChange={(v: any) => setJenisSimpanan(v)}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUKARELA">Simpanan Sukarela (Tabungan Bebas)</SelectItem>
                        <SelectItem value="KHUSUS">Simpanan Khusus (Qurban / Hari Raya / Kegiatan Khusus)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Nominal Setoran</Label>
                    <Input
                      type="number"
                      min={10_000}
                      step={50_000}
                      value={nominalSimpanan}
                      onChange={(e) => setNominalSimpanan(Number(e.target.value) || 0)}
                      className="h-11 text-base font-semibold"
                    />
                    <p className="text-xs text-muted-foreground">
                      Terbilang: {formatRp(nominalSimpanan)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Keterangan / Keperluan Simpanan</Label>
                    <Textarea
                      value={keteranganSimpanan}
                      onChange={(e) => setKeteranganSimpanan(e.target.value)}
                      placeholder="Contoh: Tabungan Qurban 1448 H / Simpanan Idul Fitri / Sukarela Tambahan"
                      rows={3}
                    />
                  </div>

                  <Button
                    size="lg"
                    disabled={!selectedAnggotaId || setorSimpananMutation.isPending}
                    onClick={handleSubmitSimpanan}
                    className="w-full font-semibold"
                  >
                    {setorSimpananMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" /> Menyimpan...
                      </>
                    ) : (
                      <>
                        <PiggyBank className="mr-2 size-4" /> Setor Simpanan
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="shadow-card border-primary/20">
                <CardHeader className="bg-primary/5 pb-4">
                  <CardTitle className="text-base text-primary">Informasi Jenis Simpanan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4 text-xs text-muted-foreground leading-relaxed">
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Simpanan Pokok</h4>
                    <p>Dibayarkan sekali saat awal menjadi anggota koperasi (nominal dinamis diatur oleh Bendahara).</p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Simpanan Wajib</h4>
                    <p>Dibayarkan rutin per bulan atau saat pendaftaran awal anggota.</p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Simpanan Sukarela</h4>
                    <p>Tabungan bebas yang dapat disetor maupun ditarik sewaktu-waktu sesuai saldo.</p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Simpanan Khusus</h4>
                    <p>Simpanan dengan tujuan khusus (misal Qurban, Hari Raya, Wisata) berdasarkan kesepakatan bersama.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
