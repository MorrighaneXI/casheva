import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FilePlus2, UploadCloud, FileText, Send, Loader2, CheckCircle2 } from "lucide-react";
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
import { formatRp } from "@/lib/casheva-data";
import { apiAnggota, apiPinjaman } from "@/lib/api";

export const Route = createFileRoute("/pengajuan")({
  head: () => ({
    meta: [
      { title: "Pengajuan Pinjaman & Simpanan — Casheva" },
      {
        name: "description",
        content:
          "Ajukan pinjaman atau simpanan dengan unggah berkas dan kalkulasi angsuran otomatis.",
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

  const [selectedAnggotaId, setSelectedAnggotaId] = useState("");
  const [amount, setAmount] = useState(10_000_000);
  const [tenor, setTenor] = useState(24);
  const [note, setNote] = useState("");
  const [loanFiles, setLoanFiles] = useState<Record<string, string>>({});

  const { data: anggotaList = [], isLoading: loadingAnggota } = useQuery({
    queryKey: ["anggota-list-active"],
    queryFn: () => apiAnggota.findAll(true),
  });

  const selectedAnggota = anggotaList.find((a) => a.id === selectedAnggotaId);

  // Kalkulasi sesuai Juknis TNI AD: Bunga 12% per tahun (1% per bulan flat)
  const calc = useMemo(() => {
    const bungaTahunan = 0.12;
    const angsuranPokok = Math.floor(amount / tenor);
    const bungaBulanan = Math.floor(amount * 0.01);
    const totalAngsuran = angsuranPokok + bungaBulanan;
    const totalPengembalian = amount + bungaBulanan * tenor;
    return {
      angsuranPokok,
      bungaBulanan,
      totalAngsuran,
      totalPengembalian,
    };
  }, [amount, tenor]);

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
      navigate({ to: "/pinjaman" });
    },
    onError: (err: any) => {
      toast.error("Gagal Mengajukan Pinjaman", {
        description: err.message || "Pastikan anggota tidak memiliki pinjaman aktif.",
      });
    },
  });

  const handleSubmit = () => {
    if (!selectedAnggotaId) {
      toast.error("Pilih Anggota", {
        description: "Silakan pilih anggota pemohon pinjaman terlebih dahulu.",
      });
      return;
    }
    if (amount < 1_000_000 || amount > 20_000_000) {
      toast.error("Plafon tidak valid", {
        description: "Pinjaman minimal Rp 1.000.000 dan maksimal Rp 20.000.000.",
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengajuan Pinjaman Koperasi"
        description="Formulir permohonan pinjaman sesuai Juknis Lomba RTI Koperasi TNI AD 2026 (Plafon Rp 1jt - 20jt, Tenor max 36 bln, Bunga 12% p.a)"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Form Input */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>1. Data Pemohon Pinjaman</CardTitle>
              <CardDescription>
                Pilih personel anggota koperasi yang mengajukan pinjaman
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Pilih Anggota Koperasi</Label>
                <Select value={selectedAnggotaId} onValueChange={setSelectedAnggotaId}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="-- Pilih Anggota Pemohon --" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {anggotaList.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.nama} ({a.pangkat?.nama || ""} {a.korps?.nama ? `(${a.korps.nama})` : ""} - NRP: {a.nrpNip})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAnggota && (
                <div className="rounded-xl border border-primary/25 bg-primary-soft/50 p-4 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nama & Pangkat:</span>
                    <span className="font-semibold text-foreground">
                      {selectedAnggota.pangkat?.nama} {selectedAnggota.nama}
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
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>2. Plafon & Tenor Pinjaman</CardTitle>
              <CardDescription>
                Bunga pinjaman 12% per tahun (1% per bulan flat) sesuai ketentuan Juknis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Nominal Plafon Pinjaman</Label>
                  <span className="text-xl font-bold text-primary">{formatRp(amount)}</span>
                </div>
                <Slider
                  value={[amount]}
                  min={1_000_000}
                  max={20_000_000}
                  step={500_000}
                  onValueChange={(val) => setAmount(val[0] || 1_000_000)}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Min: Rp 1.000.000</span>
                  <span>Maks: Rp 20.000.000</span>
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
                  placeholder="Contoh: Keperluan renovasi rumah dinas / pendidikan anak"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>3. Dokumen Persyaratan Pinjaman (Lampiran Juknis)</CardTitle>
              <CardDescription>
                Daftar kelengkapan dokumen yang wajib dilampirkan sebelum persetujuan berjenjang
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
                          if (e.target.files?.[0]) {
                            setLoanFiles((prev) => ({
                              ...prev,
                              [doc]: e.target.files![0].name,
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

        {/* Right 1 Col: Resume / Summary */}
        <div className="space-y-6">
          <Card className="shadow-card border-primary/30 sticky top-20">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-base text-primary">Resume Simulasi Angsuran</CardTitle>
              <CardDescription>Perhitungan resmi metode flat 1% / bulan</CardDescription>
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
                  <span className="font-semibold text-success">12% / thn (1% / bln)</span>
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
                <p>3. ACC Kepala Primkopad (Kaprim)</p>
                <p>4. Pencairan Dana oleh Bendahara</p>
              </div>

              <Button
                size="lg"
                disabled={!selectedAnggotaId || createLoanMutation.isPending}
                onClick={handleSubmit}
                className="w-full font-semibold shadow-md"
              >
                {createLoanMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Mengirimkan...
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
    </div>
  );
}
