import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Printer, FileSpreadsheet, PenLine, Shield } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatRp, shuRows } from "@/lib/casheva-data";

export const Route = createFileRoute("/laporan")({
  head: () => ({
    meta: [
      { title: "Laporan & Cetakan SHU — Casheva" },
      {
        name: "description",
        content:
          "Pratinjau cetak dinamis rekapitulasi SHU anggota dengan jasa modal 20% dan jasa usaha 30%.",
      },
      { property: "og:title", content: "Laporan & Cetakan SHU — Casheva" },
      {
        property: "og:description",
        content: "Cetak rekapitulasi SHU koperasi TNI AD dengan kopstuk dan tajuk tanda tangan.",
      },
    ],
  }),
  component: LaporanPage,
});

const TOTAL_SHU = 1_284_500_000;

function LaporanPage() {
  const [kop1, setKop1] = useState("MARKAS BESAR ANGKATAN DARAT");
  const [kop2, setKop2] = useState("PRIMER KOPERASI KARTIKA DISINFOLAHTAD");
  const [kop3, setKop3] = useState("Jl. Veteran No. 5, Jakarta Pusat");
  const [ttdOpen, setTtdOpen] = useState(false);
  const [jabatan, setJabatan] = useState("Ketua Primkop Kartika");
  const [pejabat, setPejabat] = useState("Letkol Cba Dedi Kurnia");
  const [nrp, setNrp] = useState("11020033");

  const totalModal = shuRows.reduce((s, r) => s + r.modal, 0);
  const totalTransaksi = shuRows.reduce((s, r) => s + r.transaksi, 0);
  const poolModal = TOTAL_SHU * 0.2;
  const poolUsaha = TOTAL_SHU * 0.3;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan & Cetakan"
        description="Rekapitulasi SHU Anggota Tahun Buku 2026"
        actions={
          <>
            <Button variant="outline" onClick={() => setTtdOpen(true)}>
              <PenLine className="mr-2 size-4" /> Sesuaikan Pejabat TTD
            </Button>
            <Button variant="outline" onClick={() => toast.success("Berkas Excel disiapkan")}>
              <FileSpreadsheet className="mr-2 size-4" /> Export Excel
            </Button>
            <Button onClick={() => toast.success("Dokumen dikirim ke antrean cetak PDF")}>
              <Printer className="mr-2 size-4" /> Cetak PDF
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="shadow-card lg:sticky lg:top-24 lg:self-start">
          <CardHeader>
            <CardTitle className="text-base">Editor Kopstuk Satuan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Baris 1 — Komando Atas</Label>
              <Input value={kop1} onChange={(e) => setKop1(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Baris 2 — Nama Koperasi</Label>
              <Input value={kop2} onChange={(e) => setKop2(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Baris 3 — Alamat</Label>
              <Input value={kop3} onChange={(e) => setKop3(e.target.value)} />
            </div>
            <div className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
              Logo satuan (placeholder) — unggah PNG transparan
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-x-auto p-6 print-sheet">
          <div className="min-w-[720px]">
            <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 border-b-4 border-double border-neutral-800 pb-3">
              <div className="grid size-16 shrink-0 place-items-center rounded-full border-2 border-neutral-800">
                <Shield className="size-8" />
              </div>
              <div className="min-w-0 text-center">
                <p className="text-sm font-bold uppercase tracking-wide">{kop1}</p>
                <p className="text-lg font-extrabold uppercase">{kop2}</p>
                <p className="text-xs">{kop3}</p>
              </div>
            </header>

            <div className="mt-6 text-center">
              <p className="text-base font-bold uppercase underline">
                Rekapitulasi Pembagian SHU Anggota
              </p>
              <p className="text-xs">Tahun Buku 2026 · Jasa Modal 20% · Jasa Usaha 30%</p>
            </div>

            <table className="mt-5 w-full border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-100 text-left">
                  {["No", "NRP/NIP", "Nama Anggota", "Simpanan", "Transaksi", "Jasa Modal (20%)", "Jasa Usaha (30%)", "Total SHU"].map(
                    (h) => (
                      <th key={h} className="border border-neutral-400 px-2 py-1.5 font-semibold">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {shuRows.map((r, i) => {
                  const jm = (r.modal / totalModal) * poolModal;
                  const ju = (r.transaksi / totalTransaksi) * poolUsaha;
                  return (
                    <tr key={r.nrp}>
                      <td className="border border-neutral-400 px-2 py-1.5 text-center">{i + 1}</td>
                      <td className="border border-neutral-400 px-2 py-1.5 font-mono">{r.nrp}</td>
                      <td className="border border-neutral-400 px-2 py-1.5">{r.nama}</td>
                      <td className="border border-neutral-400 px-2 py-1.5 text-right">{formatRp(r.modal)}</td>
                      <td className="border border-neutral-400 px-2 py-1.5 text-right">{formatRp(r.transaksi)}</td>
                      <td className="border border-neutral-400 px-2 py-1.5 text-right">{formatRp(jm)}</td>
                      <td className="border border-neutral-400 px-2 py-1.5 text-right">{formatRp(ju)}</td>
                      <td className="border border-neutral-400 px-2 py-1.5 text-right font-semibold">
                        {formatRp(jm + ju)}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-neutral-100 font-bold">
                  <td className="border border-neutral-400 px-2 py-1.5 text-center" colSpan={3}>
                    JUMLAH
                  </td>
                  <td className="border border-neutral-400 px-2 py-1.5 text-right">{formatRp(totalModal)}</td>
                  <td className="border border-neutral-400 px-2 py-1.5 text-right">{formatRp(totalTransaksi)}</td>
                  <td className="border border-neutral-400 px-2 py-1.5 text-right">{formatRp(poolModal)}</td>
                  <td className="border border-neutral-400 px-2 py-1.5 text-right">{formatRp(poolUsaha)}</td>
                  <td className="border border-neutral-400 px-2 py-1.5 text-right">
                    {formatRp(poolModal + poolUsaha)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="mt-10 flex justify-end">
              <div className="w-72 text-center text-xs">
                <p>Jakarta, 4 Agustus 2026</p>
                <p className="font-semibold">{jabatan}</p>
                <div className="h-20" />
                <p className="font-bold uppercase underline">{pejabat}</p>
                <p>NRP {nrp}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Sheet open={ttdOpen} onOpenChange={setTtdOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Tajuk Tanda Tangan</SheetTitle>
            <SheetDescription>
              Sesuaikan pejabat penandatangan laporan cetak.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4">
            <div className="space-y-2">
              <Label>Jabatan</Label>
              <Input value={jabatan} onChange={(e) => setJabatan(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nama & Pangkat</Label>
              <Input value={pejabat} onChange={(e) => setPejabat(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>NRP</Label>
              <Input value={nrp} onChange={(e) => setNrp(e.target.value)} />
            </div>
          </div>
          <SheetFooter>
            <Button
              onClick={() => {
                setTtdOpen(false);
                toast.success("Tajuk tanda tangan diperbarui");
              }}
            >
              Terapkan
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
