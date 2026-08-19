import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { apiKopstuk } from "@/lib/api";

export const Route = createFileRoute("/kopstuk")({
  head: () => ({
    meta: [
      { title: "Pengaturan Kopstuk — Casheva" },
      {
        name: "description",
        content:
          "Atur kop surat satuan, logo, dan preferensi cetak dokumen resmi koperasi TNI AD.",
      },
      { property: "og:title", content: "Pengaturan Kopstuk — Casheva" },
      {
        property: "og:description",
        content: "Konfigurasi kop surat dan preferensi cetak dokumen koperasi TNI AD.",
      },
    ],
  }),
  component: KopstukPage,
});

function KopstukPage() {
  const queryClient = useQueryClient();
  const [baris1, setBaris1] = useState("MARKAS BESAR ANGKATAN DARAT");
  const [baris2, setBaris2] = useState("PRIMER KOPERASI KARTIKA DISINFOLAHTAD");
  const [baris3, setBaris3] = useState("Jl. Veteran No. 5, Jakarta Pusat");
  const [garisGanda, setGarisGanda] = useState(true);
  const [showLogo, setShowLogo] = useState(true);

  const { data: kopstuk, isLoading } = useQuery({
    queryKey: ["kopstuk-active"],
    queryFn: () => apiKopstuk.get(),
  });

  useEffect(() => {
    if (kopstuk) {
      if (kopstuk.baris1) setBaris1(kopstuk.baris1);
      if (kopstuk.baris2) setBaris2(kopstuk.baris2);
      if (kopstuk.baris3) setBaris3(kopstuk.baris3);
      if (typeof kopstuk.garisGanda === "boolean") setGarisGanda(kopstuk.garisGanda);
    }
  }, [kopstuk]);

  const saveMutation = useMutation({
    mutationFn: () =>
      apiKopstuk.upsert({
        baris1,
        baris2,
        baris3,
        garisGanda,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kopstuk-active"] });
      toast.success("Pengaturan Kopstuk Satuan Berhasil Disimpan!");
    },
    onError: (err: any) => {
      toast.error("Gagal Menyimpan Kopstuk", { description: err.message });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Kopstuk Satuan"
        description="Konfigurasi kop surat satuan untuk seluruh dokumen cetak resmi (Lampiran I s.d IX)"
        actions={
          <Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            Simpan Perubahan
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Identitas Satuan &amp; Koperasi</CardTitle>
            <CardDescription>Teks yang tampil pada kepala surat dokumen cetak</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Baris 1 — Komando Atas (Kotama)</Label>
              <Input value={baris1} onChange={(e) => setBaris1(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Baris 2 — Nama Koperasi Primer</Label>
              <Input value={baris2} onChange={(e) => setBaris2(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Baris 3 — Alamat / Kedudukan Satuan</Label>
              <Input value={baris3} onChange={(e) => setBaris3(e.target.value)} />
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">Tampilkan logo satuan / Kartika</p>
                <p className="text-xs text-muted-foreground">Logo di sisi kiri kop</p>
              </div>
              <Switch checked={showLogo} onCheckedChange={setShowLogo} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">Garis pemisah ganda dinas</p>
                <p className="text-xs text-muted-foreground">Sesuai ketentuan standar tata naskah TNI AD</p>
              </div>
              <Switch checked={garisGanda} onCheckedChange={setGarisGanda} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Pratinjau Kop Cetak</CardTitle>
            <CardDescription>Bentuk visual dokumen saat dicetak</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="print-sheet rounded-xl p-6 bg-card border border-border shadow-inner">
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
                {showLogo && (
                  <div className="grid size-14 shrink-0 place-items-center rounded-full border-2 border-foreground">
                    <Shield className="size-7 text-primary" />
                  </div>
                )}
                <div className="min-w-0 text-center">
                  <p className="text-xs font-bold uppercase tracking-wider">{baris1}</p>
                  <p className="text-base font-extrabold uppercase">{baris2}</p>
                  <p className="text-[11px] text-muted-foreground">{baris3}</p>
                </div>
              </div>
              <div
                className={
                  garisGanda
                    ? "mt-3 border-b-4 border-double border-foreground"
                    : "mt-3 border-b border-foreground"
                }
              />
              <p className="mt-8 text-center text-xs text-muted-foreground italic">
                (Pratinjau isi dokumen cetak resmi Koperasi TNI AD)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
