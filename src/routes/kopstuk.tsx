import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shield, Save } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

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
  const [kop1, setKop1] = useState("MARKAS BESAR ANGKATAN DARAT");
  const [kop2, setKop2] = useState("PRIMER KOPERASI KARTIKA DISINFOLAHTAD");
  const [kop3, setKop3] = useState("Jl. Veteran No. 5, Jakarta Pusat");
  const [garis, setGaris] = useState(true);
  const [logo, setLogo] = useState(true);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Kopstuk"
        description="Konfigurasi kop surat satuan untuk seluruh dokumen cetak"
        actions={
          <Button onClick={() => toast.success("Pengaturan kopstuk disimpan")}>
            <Save className="mr-2 size-4" /> Simpan
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Identitas Satuan</CardTitle>
            <CardDescription>Teks yang tampil pada kop dokumen resmi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Komando Atas</Label>
              <Input value={kop1} onChange={(e) => setKop1(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nama Koperasi</Label>
              <Input value={kop2} onChange={(e) => setKop2(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Alamat</Label>
              <Input value={kop3} onChange={(e) => setKop3(e.target.value)} />
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">Tampilkan logo satuan</p>
                <p className="text-xs text-muted-foreground">Logo di sisi kiri kop</p>
              </div>
              <Switch checked={logo} onCheckedChange={setLogo} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">Garis pemisah ganda</p>
                <p className="text-xs text-muted-foreground">Sesuai standar surat dinas</p>
              </div>
              <Switch checked={garis} onCheckedChange={setGaris} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Pratinjau Kop</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="print-sheet rounded-xl p-5">
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
                {logo && (
                  <div className="grid size-14 shrink-0 place-items-center rounded-full border-2 border-neutral-800">
                    <Shield className="size-7" />
                  </div>
                )}
                <div className="min-w-0 text-center">
                  <p className="text-xs font-bold uppercase">{kop1}</p>
                  <p className="text-base font-extrabold uppercase">{kop2}</p>
                  <p className="text-[11px]">{kop3}</p>
                </div>
              </div>
              <div
                className={
                  garis
                    ? "mt-3 border-b-4 border-double border-neutral-800"
                    : "mt-3 border-b border-neutral-800"
                }
              />
              <p className="mt-4 text-center text-xs text-neutral-500">
                Contoh isi dokumen resmi koperasi…
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
