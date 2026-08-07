import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { FilePlus2, UploadCloud, FileText, Send } from "lucide-react";
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
import { formatRp } from "@/lib/casheva-data";
import { cn } from "@/lib/utils";

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
  "Surat Permohonan",
  "Slip Gaji 3 Bulan",
  "Fotokopi KTA / KTP",
  "Surat Pernyataan Potong Gaji",
];

const savingsDocs = ["Formulir Simpanan", "Fotokopi KTA / KTP"];

function PengajuanPage() {
  const { role } = useSession();
  const isBendahara = role === "Bendahara";
  const [amount, setAmount] = useState(10_000_000);
  const [tenor, setTenor] = useState(24);
  const [savingAmount, setSavingAmount] = useState(500_000);
  const [note, setNote] = useState("");
  const [loanFiles, setLoanFiles] = useState<Record<string, string>>({});
  const [savingFiles, setSavingFiles] = useState<Record<string, string>>({});

  const calc = useMemo(() => {
    const rate = 0.12;
    const bunga = amount * rate * (tenor / 12);
    const total = amount + bunga;
    const angsuran = total / tenor;
    const adminFee = amount * 0.01;
    return { bunga, total, angsuran, adminFee, net: amount - adminFee };
  }, [amount, tenor]);

  const nextHop = isBendahara
    ? "Juru Bayar untuk verifikasi gaji"
    : "Bendahara, lalu Juru Bayar → Dan/Ka → Kaprim";

  const submitLoan = () => {
    const missing = loanDocs.filter((d) => !loanFiles[d]);
    if (missing.length) {
      toast.error("Berkas belum lengkap", {
        description: `Masih kurang: ${missing.join(", ")}`,
      });
      return;
    }
    toast.success("Pengajuan pinjaman dikirim", {
      description: `Diteruskan ke ${nextHop}.`,
    });
  };

  const submitSaving = () => {
    const missing = savingsDocs.filter((d) => !savingFiles[d]);
    if (missing.length) {
      toast.error("Berkas simpanan belum lengkap");
      return;
    }
    toast.success("Pengajuan simpanan dikirim", {
      description: `Nominal ${formatRp(savingAmount)} menunggu verifikasi.`,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengajuan"
        description={
          isBendahara
            ? "Ajukan pinjaman atas nama anggota — berkas akan diteruskan ke Juru Bayar."
            : "Ajukan pinjaman atau simpanan dengan unggah berkas persyaratan."
        }
        actions={
          <Badge variant="outline" className="border-gold/40 bg-gold-soft text-accent-foreground">
            <FilePlus2 className="mr-1 size-3.5" /> Alur berjenjang
          </Badge>
        }
      />

      <Tabs defaultValue="pinjaman">
        <TabsList>
          <TabsTrigger value="pinjaman">Pinjaman</TabsTrigger>
          <TabsTrigger value="simpanan">Simpanan</TabsTrigger>
        </TabsList>

        <TabsContent value="pinjaman" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="shadow-card lg:col-span-3">
              <CardHeader>
                <CardTitle>Kalkulator Pinjaman</CardTitle>
                <CardDescription>Bunga tetap 12% per tahun · plafon maks. Rp 20.000.000</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label>Jumlah Pinjaman</Label>
                    <Input
                      value={amount}
                      onChange={(e) =>
                        setAmount(
                          Math.min(20_000_000, Math.max(1_000_000, Number(e.target.value) || 0)),
                        )
                      }
                      className="h-9 w-44 text-right font-semibold"
                    />
                  </div>
                  <Slider
                    value={[amount]}
                    min={1_000_000}
                    max={20_000_000}
                    step={500_000}
                    onValueChange={([v]) => setAmount(v ?? amount)}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label>Tenor</Label>
                    <span className="text-sm font-semibold">{tenor} bulan</span>
                  </div>
                  <Slider
                    value={[tenor]}
                    min={1}
                    max={36}
                    step={1}
                    onValueChange={([v]) => setTenor(v ?? tenor)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Catatan</Label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Keperluan pinjaman / keterangan tambahan…"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card lg:col-span-2">
              <CardHeader>
                <CardTitle>Hasil Perhitungan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  ["Pokok pinjaman", formatRp(amount)],
                  ["Bunga 12% p.a.", formatRp(calc.bunga)],
                  ["Total kewajiban", formatRp(calc.total)],
                  ["Biaya administrasi 1%", formatRp(calc.adminFee)],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
                <Separator />
                <div className="rounded-xl bg-primary-soft p-3">
                  <p className="text-xs text-primary">Angsuran per bulan</p>
                  <p className="text-xl font-extrabold text-primary">{formatRp(calc.angsuran)}</p>
                </div>
                <div className="rounded-xl bg-gold-soft p-3">
                  <p className="text-xs text-accent-foreground">Dana diterima bersih</p>
                  <p className="text-xl font-extrabold text-accent-foreground">
                    {formatRp(calc.net)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <UploadGrid
            title="Berkas Persyaratan Pinjaman"
            docs={loanDocs}
            uploaded={loanFiles}
            setUploaded={setLoanFiles}
          />

          <div className="flex justify-end">
            <Button onClick={submitLoan}>
              <Send className="mr-2 size-4" />
              Kirim ke {isBendahara ? "Juru Bayar" : "Antrean Verifikasi"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="simpanan" className="mt-4 space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Pengajuan Simpanan</CardTitle>
              <CardDescription>Simpanan wajib / sukarela dengan unggah formulir</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nominal Simpanan</Label>
                <Input
                  type="number"
                  value={savingAmount}
                  onChange={(e) => setSavingAmount(Math.max(0, Number(e.target.value) || 0))}
                />
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
                <p className="font-semibold">Ringkasan</p>
                <p className="mt-1 text-muted-foreground">
                  Nominal diajukan:{" "}
                  <span className="font-semibold text-foreground">{formatRp(savingAmount)}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <UploadGrid
            title="Berkas Persyaratan Simpanan"
            docs={savingsDocs}
            uploaded={savingFiles}
            setUploaded={setSavingFiles}
          />

          <div className="flex justify-end">
            <Button onClick={submitSaving}>
              <Send className="mr-2 size-4" /> Kirim Pengajuan Simpanan
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UploadGrid({
  title,
  docs,
  uploaded,
  setUploaded,
}: {
  title: string;
  docs: string[];
  uploaded: Record<string, string>;
  setUploaded: Dispatch<SetStateAction<Record<string, string>>>;
}) {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Format PDF, JPG, atau PNG maksimal 5 MB</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {docs.map((d) => {
          const file = uploaded[d];
          return (
            <div
              key={d}
              className={cn(
                "rounded-xl border-2 border-dashed p-4",
                file ? "border-success/40 bg-success/10" : "border-border bg-muted/40",
              )}
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-card text-muted-foreground">
                  {file ? (
                    <FileText className="size-4 text-success" />
                  ) : (
                    <UploadCloud className="size-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{d}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {file ?? "Belum diunggah"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={file ? "ghost" : "outline"}
                  onClick={() => {
                    if (file) {
                      setUploaded((u) => {
                        const next = { ...u };
                        delete next[d];
                        return next;
                      });
                      toast("Berkas dihapus");
                    } else {
                      setUploaded((u) => ({ ...u, [d]: "berkas-terunggah.pdf" }));
                      toast.success(`${d} berhasil diunggah`);
                    }
                  }}
                >
                  {file ? "Hapus" : "Unggah"}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
