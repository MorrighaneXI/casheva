import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
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
  UserCheck,
  Download,
  Printer,
  Eye,
  Layers,
  ArrowRight,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatRp,
  formatNamaLengkapDinas,
  formatPangkatKorps,
  cleanNamaPersonel,
} from "@/lib/casheva-data";
import { api, apiAnggota, apiPinjaman, apiSimpanan, apiDokumen } from "@/lib/api";
import { DokumenViewerModal } from "@/components/dokumen-viewer-modal";
import { Cloud, X } from "lucide-react";

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
  { id: "usipa", name: "Surat Permohonan Usipa" },
  { id: "jurbay", name: "Rekomendasi Juru Bayar" },
  { id: "slip", name: "Rincian Gaji, ULP & Tunkin (Slip 3 Bulan)" },
  { id: "potong_gaji", name: "Surat Perjanjian Akad Kredit & Kuasa Potong Gaji" },
  { id: "kta", name: "Fotokopi KTP / KTA" },
];

function PengajuanPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role, user, isAdmin } = useSession();

  // Role bendahara (atau admin) dapat memilih anggota lain
  // Role anggota HANYA dapat mengajukan untuk dirinya sendiri tanpa fitur dropdown pilih anggota
  const canSelectAnggota = role === "Bendahara" || role === "Admin Koperasi";

  const [activeTab, setActiveTab] = useState<"pinjaman" | "simpanan">("pinjaman");
  const [selectedAnggotaId, setSelectedAnggotaId] = useState("");
  const [amount, setAmount] = useState(10_000_000);
  const [tenor, setTenor] = useState(24);
  const [note, setNote] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [isUploadingDocs, setIsUploadingDocs] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");

  // Dialog Notifikasi Sukses Pengajuan & Viewer Dokumen
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [createdLoanRes, setCreatedLoanRes] = useState<any>(null);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState("usipa");

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

  // Cari anggota yang sesuai dengan sesi user saat ini (untuk role Anggota)
  const currentMember = useMemo(() => {
    if (!anggotaList || anggotaList.length === 0) return null;

    // 1. Cocokkan berdasarkan NRP/NIP (user.username)
    const byNrp = anggotaList.find((a) => a.nrpNip === user?.username);
    if (byNrp) return byNrp;

    // 2. Cocokkan berdasarkan ID akun
    const byId = anggotaList.find((a) => a.id === user?.id);
    if (byId) return byId;

    // 3. Cocokkan berdasarkan nama lengkap (membersihkan format gelar pangkat)
    if (user?.namaLengkap) {
      const cleanUser = cleanNamaPersonel(user.namaLengkap).toLowerCase();
      const byName = anggotaList.find((a) => {
        const cleanA = cleanNamaPersonel(a.nama).toLowerCase();
        return cleanA === cleanUser || cleanA.includes(cleanUser) || cleanUser.includes(cleanA);
      });
      if (byName) return byName;
    }

    // 4. Default fallback jika tidak ada yang cocok langsung
    return anggotaList[0];
  }, [anggotaList, user]);

  // Otomatis lock ke akun anggota sendiri jika role bukan Bendahara/Admin
  useEffect(() => {
    if (!canSelectAnggota && currentMember) {
      setSelectedAnggotaId(currentMember.id);
    }
  }, [canSelectAnggota, currentMember]);

  const activeTargetAnggotaId = canSelectAnggota
    ? selectedAnggotaId
    : (selectedAnggotaId || currentMember?.id || "");

  // Query info plafond real-time untuk anggota yang dipilih / aktif
  const { data: plafondInfo, isLoading: loadingPlafond } = useQuery({
    queryKey: ["plafond-info", activeTargetAnggotaId],
    queryFn: () => apiPinjaman.getPlafond(activeTargetAnggotaId),
    enabled: !!activeTargetAnggotaId,
  });

  const activeBungaPersenTahun = bungaData?.bungaPersenTahun ?? 12;
  const activeBungaPersenBulan = activeBungaPersenTahun / 12;

  const selectedAnggota = anggotaList.find((a) => a.id === activeTargetAnggotaId) || (!canSelectAnggota ? currentMember : null);

  // Batas Plafond dinamis berdasarkan kategori pangkat
  const maxPlafond = plafondInfo?.maksPlafond ?? 50_000_000;
  const pinjamanAktif = plafondInfo?.totalPinjamanAktif ?? 0;
  const sisaKuota = plafondInfo?.sisaKuota ?? maxPlafond;
  const totalAkumulasi = pinjamanAktif + amount;
  const isPlafondExceeded = totalAkumulasi > maxPlafond;

  // Sesuaikan nilai default amount saat info plafond tersedia
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
    mutationFn: async () => {
      // 1. Create Pinjaman in PostgreSQL NeonDB
      const res = await apiPinjaman.create({
        anggotaId: activeTargetAnggotaId,
        nominal: amount,
        tenorBulan: tenor,
        catatan: note,
      });

      // 2. Upload selected files to Cloudinary & DokumenPinjaman
      const fileEntries = Object.entries(selectedFiles);
      const uploadedDocsList: any[] = [];
      const failedUploads: string[] = [];

      if (fileEntries.length > 0) {
        setIsUploadingDocs(true);
        let currentIdx = 0;
        for (const [docId, file] of fileEntries) {
          currentIdx++;
          const docDef = loanDocs.find((d) => d.id === docId);
          const docName = docDef?.name || docId;
          setUploadProgressText(`Mengunggah berkas ${docName} ke Cloudinary (${currentIdx}/${fileEntries.length})...`);
          try {
            const up = await apiDokumen.upload(file, res.id, docName);
            uploadedDocsList.push(up);
          } catch (e: any) {
            console.error("Gagal unggah dokumen:", e);
            failedUploads.push(`${docName}`);
          }
        }
      }

      return {
        ...res,
        dokumen: uploadedDocsList,
        failedUploads,
      };
    },
    onSuccess: (res) => {
      setIsUploadingDocs(false);
      setUploadProgressText("");
      setCreatedLoanRes({
        id: res.id,
        nominal: amount,
        tenorBulan: tenor,
        catatan: note,
        bungaPersenTahun: activeBungaPersenTahun,
        anggota: selectedAnggota,
        dokumen: res.dokumen || [],
      });
      setSuccessModalOpen(true);
      setSelectedFiles({});

      if (res.failedUploads && res.failedUploads.length > 0) {
        toast.warning("Pengajuan Terkirim — Sebagian Berkas Belum Masuk", {
          description: `Pinjaman #${res.id.slice(0, 8).toUpperCase()} terkirim. ${res.dokumen.length} berkas tersimpan di Cloudinary, namun ${res.failedUploads.length} berkas gagal: ${res.failedUploads.join(", ")}. Anda dapat mengunggah ulang di modal berkas.`,
          duration: 8000,
        });
      } else if (res.dokumen && res.dokumen.length > 0) {
        toast.success("Pengajuan Pinjaman & Berkas Berhasil!", {
          description: `Nomor Berkas: #${res.id.slice(0, 8).toUpperCase()} — ${res.dokumen.length} berkas berhasil tersimpan di Cloudinary & Database.`,
          duration: 6000,
        });
      } else {
        toast.success("Pengajuan Pinjaman Berhasil Dikirim!", {
          description: `Nomor Berkas: #${res.id.slice(0, 8).toUpperCase()} — Diteruskan ke Juru Bayar.`,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["pinjaman-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["plafond-info"] });
    },
    onError: (err: any) => {
      setIsUploadingDocs(false);
      setUploadProgressText("");
      toast.error("Gagal Mengajukan Pinjaman", {
        description: err.message || "Pastikan pengajuan tidak melebihi batas plafond.",
      });
    },
  });

  const setorSimpananMutation = useMutation({
    mutationFn: () =>
      apiSimpanan.setor({
        anggotaId: activeTargetAnggotaId,
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
    if (!activeTargetAnggotaId) {
      toast.error(canSelectAnggota ? "Pilih Anggota" : "Data Anggota Tidak Ditemukan", {
        description: canSelectAnggota
          ? "Silakan pilih anggota pemohon pinjaman terlebih dahulu."
          : "Data keanggotaan Anda belum terdaftar aktif di sistem.",
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
    if (!activeTargetAnggotaId) {
      toast.error(canSelectAnggota ? "Pilih Anggota" : "Data Anggota Tidak Ditemukan", {
        description: canSelectAnggota
          ? "Silakan pilih anggota yang menyetor simpanan."
          : "Data keanggotaan Anda belum terdaftar aktif di sistem.",
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

  const openDocViewer = (docId: string = "usipa") => {
    setSelectedDocId(docId);
    setDocModalOpen(true);
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
              {/* 1. Data Personel Pemohon */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="size-5 text-primary" />
                    {canSelectAnggota
                      ? "1. Data Personel Pemohon (Pilih Anggota)"
                      : "1. Data Personel Pemohon (Identitas Terverifikasi)"}
                  </CardTitle>
                  <CardDescription>
                    {canSelectAnggota
                      ? "Pilih personel anggota yang mengajukan permohonan pinjaman"
                      : "Pengajuan pinjaman diproses langsung atas nama akun dinas terverifikasi Anda"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Pilihan dropdown HANYA tampil untuk role Bendahara atau Admin Koperasi */}
                  {canSelectAnggota && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 font-semibold">
                        Pilih Anggota Koperasi
                      </Label>
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
                  )}

                  {/* Detail Personel Pemohon */}
                  {selectedAnggota ? (
                    <div className="rounded-xl border border-primary/25 bg-primary-soft/40 p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground font-bold shadow-sm shrink-0">
                            <UserCheck className="size-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-foreground">
                                {formatNamaLengkapDinas(
                                  selectedAnggota.nama,
                                  selectedAnggota.pangkat?.nama,
                                  selectedAnggota.korps?.nama,
                                  selectedAnggota.pangkat?.kategori
                                )}
                              </span>
                              {!canSelectAnggota ? (
                                <Badge variant="outline" className="border-success/40 bg-success/10 text-success text-[10px] font-semibold">
                                  Akun Terverifikasi
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-[10px] font-semibold">
                                  Pemohon Terpilih
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">
                              NRP / NIP: {selectedAnggota.nrpNip}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="w-fit font-semibold text-xs shrink-0">
                          {plafondInfo?.label || selectedAnggota.pangkat?.kategori || "Bintara/PNS"}
                        </Badge>
                      </div>

                      <Separator className="bg-primary/15" />

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground text-[11px] block">Pangkat &amp; Korps</span>
                          <span className="font-semibold text-foreground">
                            {formatPangkatKorps(selectedAnggota.pangkat?.nama, selectedAnggota.korps?.nama, selectedAnggota.pangkat?.kategori)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[11px] block">Kesatuan / Satminkal</span>
                          <span className="font-semibold text-foreground truncate block">
                            {selectedAnggota.satminkal?.nama || user?.satminkal || "INFOLAHTADAM IV/DIPONEGORO"}
                          </span>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <span className="text-muted-foreground text-[11px] block">Tipe Pengajuan</span>
                          <span className="font-semibold text-primary">
                            {canSelectAnggota ? "Didaftarkan Pengurus" : "Pengajuan Mandiri"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : loadingAnggota ? (
                    <div className="flex items-center gap-2 p-4 text-xs text-muted-foreground rounded-xl border border-dashed">
                      <Loader2 className="size-4 animate-spin text-primary" /> Memuat data personel...
                    </div>
                  ) : null}

                  {/* Ringkasan Status Plafond Anggota */}
                  {activeTargetAnggotaId && plafondInfo && (
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
                  <CardTitle>2. Plafon &amp; Tenor Pinjaman</CardTitle>
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
              <Card className="shadow-card border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="size-5 text-primary" />
                      3. Dokumen Persyaratan Pinjaman (Lampiran Juknis)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Unggah berkas fisik/digital (PDF/JPG/PNG/DOC) untuk disimpan ke Cloudinary &amp; Database, atau gunakan format standar resmi TNI AD.
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openDocViewer("usipa")}
                    className="gap-1.5 text-xs shrink-0 shadow-sm border-primary/30"
                  >
                    <Layers className="size-3.5 text-primary" /> Buka Arsip Lengkap
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {loanDocs.map((doc) => {
                      const file = selectedFiles[doc.id];
                      const fileSizeFormatted = file
                        ? file.size > 1024 * 1024
                          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                          : `${Math.round(file.size / 1024)} KB`
                        : null;

                      return (
                        <div
                          key={doc.id}
                          className={`rounded-xl border p-3 text-xs transition-all ${
                            file
                              ? "bg-success/5 border-success/40 shadow-xs"
                              : "bg-muted/20 hover:bg-muted/40 border-border"
                          }`}
                        >
                          {/* Hidden File Input */}
                          <input
                            id={`file-input-${doc.id}`}
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                            onChange={(e) => {
                              const chosen = e.target.files?.[0];
                              if (chosen) {
                                setSelectedFiles((prev) => ({
                                  ...prev,
                                  [doc.id]: chosen,
                                }));
                                toast.success(`Berkas ${chosen.name} dipilih untuk ${doc.name}`);
                              }
                            }}
                          />

                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                              <FileText className={`size-4 mt-0.5 shrink-0 ${file ? "text-success" : "text-primary"}`} />
                              <div className="min-w-0 flex-1">
                                <span className="font-semibold text-foreground block truncate">{doc.name}</span>
                                {file ? (
                                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground font-mono">
                                    <span className="truncate text-success font-medium max-w-[150px]">{file.name}</span>
                                    <span>({fileSizeFormatted})</span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                                    Format Juknis TNI AD (Opsional unggah scan)
                                  </span>
                                )}
                              </div>
                            </div>

                            {file && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-success/40 bg-success/15 text-success font-semibold shrink-0 gap-1">
                                <Cloud className="size-2.5" /> Siap Diunggah
                              </Badge>
                            )}
                          </div>

                          <Separator className="my-2.5 bg-border/60" />

                          <div className="flex items-center justify-between gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-[11px] gap-1 hover:bg-primary/10 hover:text-primary"
                              onClick={() => openDocViewer(doc.id)}
                              title={`Lihat format / cetak ${doc.name}`}
                            >
                              <Eye className="size-3.5" /> Lihat Format
                            </Button>

                            <div className="flex items-center gap-1">
                              {file ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-[11px] gap-1 border-primary/30"
                                    onClick={() => document.getElementById(`file-input-${doc.id}`)?.click()}
                                  >
                                    <UploadCloud className="size-3" /> Ganti
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-[11px] text-destructive hover:bg-destructive/10"
                                    onClick={() => {
                                      setSelectedFiles((prev) => {
                                        const copy = { ...prev };
                                        delete copy[doc.id];
                                        return copy;
                                      });
                                    }}
                                    title="Hapus berkas"
                                  >
                                    <X className="size-3.5" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2.5 text-[11px] gap-1 border-primary/40 font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                                  onClick={() => document.getElementById(`file-input-${doc.id}`)?.click()}
                                >
                                  <UploadCloud className="size-3.5" /> Unggah Berkas
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
                    disabled={!activeTargetAnggotaId || isPlafondExceeded || createLoanMutation.isPending}
                    onClick={handleSubmitPinjaman}
                    className={`w-full font-semibold shadow-md ${isPlafondExceeded ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}`}
                  >
                    {createLoanMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        {uploadProgressText || "Mengirimkan & Mengunggah Berkas..."}
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
                  <CardTitle className="flex items-center gap-2">
                    <PiggyBank className="size-5 text-primary" />
                    Formulir Simpanan Khusus &amp; Sukarela
                  </CardTitle>
                  <CardDescription>
                    Simpanan Khusus (Hari Raya / Qurban / Kegiatan Khusus) dan Simpanan Sukarela bersifat opsional berdasarkan persetujuan Bendahara dan Anggota.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {canSelectAnggota ? (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 font-semibold">
                        Pilih Anggota Penyetor
                      </Label>
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
                  ) : selectedAnggota ? (
                    <div className="rounded-xl border border-primary/25 bg-primary-soft/40 p-3.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="grid size-9 place-items-center rounded-lg bg-primary/20 text-primary shrink-0">
                          <UserCheck className="size-4" />
                        </div>
                        <div>
                          <div className="font-bold text-foreground">
                            {formatNamaLengkapDinas(
                              selectedAnggota.nama,
                              selectedAnggota.pangkat?.nama,
                              selectedAnggota.korps?.nama,
                              selectedAnggota.pangkat?.kategori
                            )}
                          </div>
                          <div className="text-muted-foreground font-mono text-[11px]">
                            NRP: {selectedAnggota.nrpNip} · {selectedAnggota.satminkal?.nama || user?.satminkal || "INFOLAHTADAM IV/DIPONEGORO"}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-success/40 bg-success/10 text-success text-[10px] font-semibold shrink-0">
                        Penyetor Mandiri
                      </Badge>
                    </div>
                  ) : null}

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
                    disabled={!activeTargetAnggotaId || setorSimpananMutation.isPending}
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

      {/* ============================================================== */}
      {/* POP-UP MODAL NOTIFIKASI SUKSES PENGAJUAN PINJAMAN */}
      {/* ============================================================== */}
      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent className="sm:max-w-lg p-6">
          <DialogHeader className="text-center sm:text-left space-y-2">
            <div className="mx-auto sm:mx-0 grid size-12 place-items-center rounded-2xl bg-success/15 text-success border border-success/30">
              <CheckCircle2 className="size-7" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Pengajuan Pinjaman Berhasil Dikirim!
            </DialogTitle>
            <DialogDescription className="text-xs">
              Permohonan pinjaman USIPA telah tersimpan dalam sistem dan otomatis diteruskan ke antrean <strong>Verifikasi Juru Bayar</strong>.
            </DialogDescription>
          </DialogHeader>

          {createdLoanRes && (
            <div className="space-y-3 my-2 text-xs">
              {/* Box Rincian Berkas */}
              <div className="rounded-xl border border-primary/25 bg-primary-soft/30 p-3.5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Nomor Registrasi Berkas:</span>
                  <Badge variant="outline" className="font-mono font-bold border-primary/40 bg-background text-primary">
                    #USIPA-{createdLoanRes.id.slice(0, 8).toUpperCase()}
                  </Badge>
                </div>
                <Separator className="bg-primary/15" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pemohon:</span>
                  <span className="font-semibold text-foreground">
                    {formatNamaLengkapDinas(
                      createdLoanRes.anggota?.nama || selectedAnggota?.nama,
                      createdLoanRes.anggota?.pangkat?.nama || selectedAnggota?.pangkat?.nama,
                      createdLoanRes.anggota?.korps?.nama || selectedAnggota?.korps?.nama,
                      createdLoanRes.anggota?.pangkat?.kategori || selectedAnggota?.pangkat?.kategori
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nominal Plafon Diajukan:</span>
                  <span className="font-bold text-primary">{formatRp(createdLoanRes.nominal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jangka Waktu (Tenor):</span>
                  <span className="font-medium">{createdLoanRes.tenorBulan} Bulan</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimasi Angsuran / Bulan:</span>
                  <span className="font-bold text-foreground">{formatRp(calc.totalAngsuran)}</span>
                </div>
                {createdLoanRes.catatan && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Keperluan:</span>
                    <span className="italic text-foreground">{createdLoanRes.catatan}</span>
                  </div>
                )}
              </div>

              {/* Status Alur 4 Pintu */}
              <div className="rounded-xl border bg-muted/40 p-3 space-y-1.5 text-[11px]">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Layers className="size-3.5 text-primary" /> Tahap Alur Verifikasi Hierarki:
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="p-1.5 rounded bg-background border border-primary/40 text-primary font-medium flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                    1. Juru Bayar (Aktif)
                  </div>
                  <div className="p-1.5 rounded bg-background border text-muted-foreground flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                    2. Dan / Ka
                  </div>
                  <div className="p-1.5 rounded bg-background border text-muted-foreground flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                    3. Keprim
                  </div>
                  <div className="p-1.5 rounded bg-background border text-muted-foreground flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                    4. Pencairan Bendahara
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => openDocViewer("usipa")}
              className="w-full sm:w-auto gap-1.5 text-xs font-semibold shadow-sm border-primary/40"
            >
              <FileText className="size-4 text-primary" />
              Lihat &amp; Unduh Berkas Persyaratan
            </Button>
            <Button
              onClick={() => {
                setSuccessModalOpen(false);
                navigate({ to: "/pinjaman" });
              }}
              className="w-full sm:w-auto gap-1.5 text-xs font-semibold"
            >
              Pantau Riwayat Pinjaman <ArrowRight className="size-3.5" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL PEMERIKSAAN DOKUMEN & ARSIP DIGITAL */}
      {/* ============================================================== */}
      <DokumenViewerModal
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        customData={{
          id: createdLoanRes?.id || "USIPA-" + new Date().getFullYear(),
          nama: selectedAnggota?.nama ?? undefined,
          pangkat: selectedAnggota?.pangkat?.nama ?? undefined,
          korps: selectedAnggota?.korps?.nama ?? undefined,
          kategoriPangkat: (selectedAnggota?.pangkat?.kategori as string) ?? undefined,
          nrpNip: selectedAnggota?.nrpNip ?? undefined,
          satminkal: selectedAnggota?.satminkal?.nama || user?.satminkal || undefined,
          nominal: amount,
          tenorBulan: tenor,
          catatan: note,
          bungaPersenTahun: activeBungaPersenTahun,
          dokumen: createdLoanRes?.dokumen || undefined,
        }}
        initialDocId={selectedDocId}
      />
    </div>
  );
}
