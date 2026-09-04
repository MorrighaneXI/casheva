import { createFileRoute } from '@tanstack/react-router'
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Percent, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { InvoiceGenerator } from "@/components/widgets/role-widgets";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/session-context";
import { api } from "@/lib/api/client";

export const Route = createFileRoute("/pencairan")({
  head: () => ({
    meta: [
      { title: "Pencairan & Invoice — Casheva Koperasi TNI AD" },
      { name: "description", content: "Generator kwitansi dan penomoran invoice otomatis." },
      { property: "og:title", content: "Pencairan & Invoice — Casheva" },
      { property: "og:description", content: "Generator kwitansi dan penomoran invoice otomatis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { role } = useSession();
  const isBendaharaOrAdmin = role === "Bendahara" || role === "Admin Koperasi";

  return (
    <div className="space-y-6">
      <PageHeader title="Pencairan & Invoice" description="Generator kwitansi dan penomoran invoice otomatis." />
      <InvoiceGenerator />
      {isBendaharaOrAdmin ? <BungaSettingCard /> : null}
    </div>
  );
}

function BungaSettingCard() {
  const queryClient = useQueryClient();
  const [bunga, setBunga] = useState("12");
  const [keterangan, setKeterangan] = useState("");

  const { data: bungaData } = useQuery({
    queryKey: ["pengaturan-bunga"],
    queryFn: () => api.get("/pinjaman/pengaturan-bunga"),
  });

  const updateBungaMutation = useMutation({
    mutationFn: (body: { bungaPersenTahun: number; keterangan?: string }) =>
      api.post("/pinjaman/pengaturan-bunga", body),
    onSuccess: (res: any) => {
      toast.success(res.message || "Suku bunga pinjaman baru berhasil disimpan!");
      queryClient.invalidateQueries({ queryKey: ["pengaturan-bunga"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal memperbarui suku bunga");
    },
  });

  return (
    <Card className="shadow-card border-primary/20">
      <CardHeader>
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Percent className="size-5 text-primary" /> Pengaturan Suku Bunga Pinjaman Koperasi (Dinamis - Khusus Bendahara)
        </CardTitle>
        <CardDescription>
          Bunga ini berlaku untuk pengajuan pinjaman baru. Pengajuan yang sudah berjalan tetap terkunci (locked) pada suku bunga saat pengajuan dibuat.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="space-y-1 flex-1">
            <Label>Suku Bunga Pinjaman (% / tahun)</Label>
            <Input
              type="number"
              step="0.5"
              value={bunga}
              onChange={(e) => setBunga(e.target.value)}
              placeholder="Contoh: 12"
            />
          </div>
          <div className="space-y-1 flex-[2]">
            <Label>Alasan / Keterangan Perubahan</Label>
            <Input
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Penyesuaian Hasil RAT Koperasi 2026"
            />
          </div>
          <div className="pt-2 sm:pt-6">
            <Button
              disabled={updateBungaMutation.isPending}
              onClick={() =>
                updateBungaMutation.mutate({
                  bungaPersenTahun: parseFloat(bunga) || 12,
                  keterangan,
                })
              }
            >
              {updateBungaMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Simpan Bunga Baru
            </Button>
          </div>
        </div>
        {bungaData?.bungaPersenTahun !== undefined ? (
          <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
            Suku Bunga Pinjaman Aktif: <span className="font-bold text-foreground">{bungaData.bungaPersenTahun}% / tahun</span> (Terakhir diubah: {bungaData.updatedAt ? new Date(bungaData.updatedAt).toLocaleDateString('id-ID') : 'Belum diubah'})
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
