import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Loader2,
  Filter,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  Copy,
  ChevronRight,
  Eye,
  Wallet,
  HandCoins,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { useSession } from "@/components/session-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRp, loanStatusTone, backendStatusToFrontend, formatPangkatKorps, formatNamaLengkapDinas, cleanNamaPersonel } from "@/lib/casheva-data";
import { canAccessPath } from "@/lib/rbac";
import { apiPinjaman, apiAnggota, type Pinjaman } from "@/lib/api";
import { DokumenViewerModal } from "@/components/dokumen-viewer-modal";
import { Download, Layers } from "lucide-react";

export const Route = createFileRoute("/pinjaman")({
  head: () => ({
    meta: [
      { title: "Riwayat Pinjaman — Casheva Koperasi TNI AD" },
      {
        name: "description",
        content:
          "Daftar seluruh pengajuan pinjaman anggota koperasi TNI AD beserta status persetujuan berjenjang dan alur pencairan.",
      },
      { property: "og:title", content: "Riwayat Pinjaman — Casheva" },
      {
        property: "og:description",
        content: "Pantau seluruh pengajuan pinjaman anggota koperasi TNI AD secara real-time.",
      },
    ],
  }),
  component: PinjamanPage,
});

type FilterStatus = "ALL" | "PROCESS" | "APPROVED" | "DISBURSED" | "PAID" | "REJECTED";

function PinjamanPage() {
  const { user, role, originalRole } = useSession();
  const isAnggota = role === "Anggota";
  const monitorOnly = role === "Pimpinan / Dan / Ka" || role === "Keprim";
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [selectedLoan, setSelectedLoan] = useState<Pinjaman | null>(null);
  const [docModalOpen, setDocModalOpen] = useState(false);

  const { data: anggotaList = [] } = useQuery({
    queryKey: ["anggota-list-active"],
    queryFn: () => apiAnggota.findAll(true),
  });

  const currentMember = useMemo(() => {
    if (!user) return null;
    let pool = anggotaList || [];
    if (pool.length === 0 && typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("casheva.anggota_cache");
        if (raw) pool = JSON.parse(raw);
      } catch {}
    }

    if (pool.length > 0) {
      const byNrp = pool.find((a) => a.nrpNip?.toLowerCase() === user.username?.toLowerCase());
      if (byNrp) return byNrp;

      const byId = pool.find((a) => a.id === user.id);
      if (byId) return byId;

      if (user.namaLengkap) {
        const cleanUser = cleanNamaPersonel(user.namaLengkap).toLowerCase();
        const byName = pool.find((a) => {
          const cleanA = cleanNamaPersonel(a.nama).toLowerCase();
          return cleanA === cleanUser || (cleanUser.length > 3 && (cleanA.includes(cleanUser) || cleanUser.includes(cleanA)));
        });
        if (byName) return byName;
      }
    }
    return null;
  }, [anggotaList, user]);

  const { data: rawLoanList = [], isLoading } = useQuery({
    queryKey: ["pinjaman-list"],
    queryFn: () => apiPinjaman.findAll(),
  });

  // Jika login sebagai Anggota, batasi HANYA pinjaman miliknya sendiri
  const loanList = useMemo(() => {
    if (!isAnggota) return rawLoanList;
    return rawLoanList.filter((l) => {
      if (currentMember && (l.anggotaId === currentMember.id || l.anggota?.id === currentMember.id)) {
        return true;
      }
      if (user?.username) {
        const cleanUsername = user.username.toLowerCase().trim();
        const nrpAnggota = (l.anggota?.nrpNip || "").toLowerCase().trim();
        if (nrpAnggota === cleanUsername) return true;
      }
      if (user?.id && (l.anggotaId === user.id || l.anggota?.id === user.id)) {
        return true;
      }
      if (user?.namaLengkap && l.anggota?.nama) {
        const cleanUser = cleanNamaPersonel(user.namaLengkap).toLowerCase();
        const cleanA = cleanNamaPersonel(l.anggota.nama).toLowerCase();
        if (cleanA === cleanUser || (cleanUser.length > 3 && (cleanA.includes(cleanUser) || cleanUser.includes(cleanA)))) {
          return true;
        }
      }
      return false;
    });
  }, [rawLoanList, isAnggota, currentMember, user]);

  // Filter dengan useMemo agar ringan & cepat tanpa re-render berlebih
  const filteredRows = useMemo(() => {
    const query = q.toLowerCase().trim();
    return loanList.filter((l) => {
      const nama = (l.anggota?.nama || "").toLowerCase();
      const nrp = l.anggota?.nrpNip || "";
      const id = (l.id || "").toLowerCase();
      const status = l.status;

      const matchesSearch = !query || nama.includes(query) || nrp.includes(query) || id.includes(query);
      if (!matchesSearch) return false;

      if (statusFilter === "ALL") return true;
      if (statusFilter === "PROCESS") {
        return ["DIAJUKAN", "VERIFIKASI_PRIMKOP", "VERIFIKASI_JURU_BAYAR", "REKOMENDASI_PIMPINAN"].includes(status);
      }
      if (statusFilter === "APPROVED") {
        return ["SETUJU_KEPRIM", "MENUNGGU_DOKUMEN"].includes(status);
      }
      if (statusFilter === "DISBURSED") return status === "DICAIRKAN";
      if (statusFilter === "PAID") return status === "LUNAS";
      if (statusFilter === "REJECTED") return status === "DITOLAK";

      return true;
    });
  }, [loanList, q, statusFilter]);

  // Statistik Ringkas
  const stats = useMemo(() => {
    const total = loanList.length;
    const proses = loanList.filter((l) =>
      ["DIAJUKAN", "VERIFIKASI_PRIMKOP", "VERIFIKASI_JURU_BAYAR", "REKOMENDASI_PIMPINAN"].includes(l.status),
    ).length;
    const dicairkan = loanList.filter((l) => l.status === "DICAIRKAN").length;
    const lunas = loanList.filter((l) => l.status === "LUNAS").length;
    const totalPlafon = loanList.reduce((acc, curr) => acc + Number(curr.nominal || 0), 0);

    return { total, proses, dicairkan, lunas, totalPlafon };
  }, [loanList]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin ke clipboard: ${text}`);
  };

  const detailTo = canAccessPath(role, "/acc", originalRole)
    ? "/acc"
    : canAccessPath(role, "/rekomendasi", originalRole)
    ? "/rekomendasi"
    : canAccessPath(role, "/verifikasi", originalRole)
    ? "/verifikasi"
    : "/pinjaman";

  return (
    <div className="space-y-6">
      <PageHeader
        title={monitorOnly ? "Riwayat & Monitoring Pinjaman Satuan" : "Pengajuan & Riwayat Pinjaman Koperasi"}
        description={
          monitorOnly
            ? "Monitoring seluruh pengajuan pinjaman anggota satuan sesuai hierarki Juknis TNI AD."
            : "Kelola pengajuan, pantau alur verifikasi hierarki 4 pintu, dan jadwal angsuran real-time."
        }
        actions={
          <div className="flex items-center gap-2">
            {!monitorOnly && (
              <Button asChild className="shadow-md">
                <Link to="/pengajuan">
                  <Plus className="mr-2 size-4" /> Ajukan Pinjaman Baru
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card card-interactive border-primary/20">
          <CardHeader className="pb-1">
            <CardDescription className="flex items-center justify-between">
              <span>Total Pengajuan</span>
              <FileText className="size-4 text-primary" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total berkas terdaftar</p>
          </CardContent>
        </Card>

        <Card className="shadow-card card-interactive border-amber-500/20">
          <CardHeader className="pb-1">
            <CardDescription className="flex items-center justify-between">
              <span>Dalam Alur Proses</span>
              <Clock className="size-4 text-amber-500" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{stats.proses}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Menunggu verifikasi / ACC</p>
          </CardContent>
        </Card>

        <Card className="shadow-card card-interactive border-blue-500/20">
          <CardHeader className="pb-1">
            <CardDescription className="flex items-center justify-between">
              <span>Sedang Berjalan</span>
              <HandCoins className="size-4 text-blue-500" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{stats.dicairkan}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Dicairkan & mengangsur</p>
          </CardContent>
        </Card>

        <Card className="shadow-card card-interactive border-success/20">
          <CardHeader className="pb-1">
            <CardDescription className="flex items-center justify-between">
              <span>Lunas Selesai</span>
              <BadgeCheck className="size-4 text-success" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-success">{stats.lunas}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Kewajiban terselesaikan</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="shadow-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari nama pemohon, NRP, atau ID pinjaman…"
                className="pl-9 h-10"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Status Filter Pills */}
            <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
              {[
                { key: "ALL", label: "Semua" },
                { key: "PROCESS", label: "Proses" },
                { key: "APPROVED", label: "ACC" },
                { key: "DISBURSED", label: "Berjalan" },
                { key: "PAID", label: "Lunas" },
                { key: "REJECTED", label: "Ditolak" },
              ].map((tab) => (
                <Button
                  key={tab.key}
                  variant={statusFilter === tab.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(tab.key as FilterStatus)}
                  className={`h-8 text-xs px-2.5 transition-all ${
                    statusFilter === tab.key ? "shadow-sm font-semibold" : "text-muted-foreground"
                  }`}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Data */}
      <Card className="shadow-card">
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-28">No. Berkas</TableHead>
                <TableHead>Nama Pemohon</TableHead>
                <TableHead>Pangkat / Golongan</TableHead>
                <TableHead>NRP / NIP</TableHead>
                <TableHead>Satminkal</TableHead>
                <TableHead className="text-right">Plafon Pokok</TableHead>
                <TableHead className="text-center">Tenor</TableHead>
                <TableHead className="text-right">Angsuran / bln</TableHead>
                <TableHead>Status Alur</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-6 animate-spin mb-2 text-primary" />
                    Memuat daftar pinjaman anggota...
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((l) => {
                  const uiStatus = backendStatusToFrontend(l.status);
                  const angsuranPerBulan =
                    l.angsuran && l.angsuran.length > 0 && l.angsuran[0]
                      ? Number(l.angsuran[0].total)
                      : Math.round((Number(l.nominal) * (1 + (Number(l.bungaPersenTahun || 12) / 100))) / l.tenorBulan);
                  const formattedPangkat = formatPangkatKorps(
                    l.anggota?.pangkat?.nama,
                    l.anggota?.korps?.nama,
                    l.anggota?.pangkat?.kategori,
                  );

                  return (
                    <TableRow key={l.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold">
                        <button
                          onClick={() => copyToClipboard(l.id.slice(0, 8).toUpperCase(), "No. Berkas")}
                          className="flex items-center gap-1 text-primary hover:underline text-left"
                          title="Klik untuk menyalin"
                        >
                          {l.id.slice(0, 8).toUpperCase()}
                          <Copy className="size-3 opacity-60" />
                        </button>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-foreground">{formatNamaLengkapDinas(l.anggota?.nama, l.anggota?.pangkat?.nama, l.anggota?.korps?.nama, l.anggota?.pangkat?.kategori)}</p>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-foreground">
                        {formattedPangkat}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold">
                        <button
                          onClick={() => copyToClipboard(l.anggota?.nrpNip || "-", "NRP")}
                          className="flex items-center gap-1 text-primary hover:underline text-left"
                          title="Klik untuk menyalin NRP"
                        >
                          {l.anggota?.nrpNip || "-"}
                          <Copy className="size-3 opacity-60" />
                        </button>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {l.anggota?.satminkal?.nama || "INFOLAHTADAM IV/DIPONEGORO"}
                      </TableCell>
                      <TableCell className="text-right font-bold text-foreground">
                        {formatRp(Number(l.nominal))}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs">{l.tenorBulan} bln</TableCell>
                      <TableCell className="text-right text-xs font-semibold text-primary">
                        {formatRp(angsuranPerBulan)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${loanStatusTone[uiStatus] || ""} text-[11px] font-medium`}>
                          {uiStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedLoan(l)}
                          className="h-8 px-2.5 text-xs"
                        >
                          <Eye className="mr-1 size-3.5" /> Detail
                        </Button>
                        {!monitorOnly && (
                          <Button size="sm" variant="ghost" asChild className="h-8 px-2 text-xs">
                            <Link to={detailTo as "/"}>
                              <ChevronRight className="size-4" />
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
              {!isLoading && filteredRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                    Tidak ada riwayat pinjaman yang sesuai dengan filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Detail Berkas Pinjaman */}
      <Dialog open={!!selectedLoan} onOpenChange={(o) => !o && setSelectedLoan(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Rincian Pengajuan Pinjaman</span>
              <Badge variant="outline" className="font-mono text-xs">
                {selectedLoan?.id.slice(0, 8).toUpperCase()}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Data permohonan pinjaman anggota dan status verifikasi berjenjang
            </DialogDescription>
          </DialogHeader>

          {selectedLoan && (
            <div className="space-y-4 py-2 text-xs">
              <div className="rounded-xl border border-primary/20 bg-primary-soft/40 p-3.5 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nama Personel:</span>
                  <span className="font-semibold text-foreground">
                    {formatNamaLengkapDinas(selectedLoan.anggota?.nama, selectedLoan.anggota?.pangkat?.nama, selectedLoan.anggota?.korps?.nama, selectedLoan.anggota?.pangkat?.kategori)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NRP / NIP:</span>
                  <span className="font-mono">{selectedLoan.anggota?.nrpNip}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kesatuan / Satminkal:</span>
                  <span>{selectedLoan.anggota?.satminkal?.nama || "INFOLAHTADAM IV/DIPONEGORO"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 rounded-lg border bg-background">
                  <div className="text-muted-foreground text-[10px]">Nominal Plafon</div>
                  <div className="text-base font-extrabold text-primary mt-0.5">
                    {formatRp(Number(selectedLoan.nominal))}
                  </div>
                </div>
                <div className="p-3 rounded-lg border bg-background">
                  <div className="text-muted-foreground text-[10px]">Tenor / Jangka Waktu</div>
                  <div className="text-base font-extrabold text-foreground mt-0.5">
                    {selectedLoan.tenorBulan} Bulan
                  </div>
                </div>
                <div className="p-3 rounded-lg border bg-background">
                  <div className="text-muted-foreground text-[10px]">Suku Bunga</div>
                  <div className="text-sm font-bold text-success mt-0.5">
                    {selectedLoan.bungaPersenTahun ?? 12}% p.a Flat
                  </div>
                </div>
                <div className="p-3 rounded-lg border bg-background">
                  <div className="text-muted-foreground text-[10px]">Sisa Pokok</div>
                  <div className="text-sm font-bold text-foreground mt-0.5">
                    {formatRp(Number(selectedLoan.sisaPokok ?? selectedLoan.nominal))}
                  </div>
                </div>
              </div>

              {/* Hierarki Flowchart */}
              <div className="rounded-xl border p-3.5 space-y-2 bg-muted/30">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-primary" /> Alur Verifikasi Hierarki 4 Pintu:
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-background border flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-primary" />
                    <span>1. Juru Bayar (Gaji)</span>
                  </div>
                  <div className="p-2 rounded bg-background border flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-primary" />
                    <span>2. Rekomendasi Dan/Ka</span>
                  </div>
                  <div className="p-2 rounded bg-background border flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-primary" />
                    <span>3. ACC Kepala Primkop</span>
                  </div>
                  <div className="p-2 rounded bg-background border flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-primary" />
                    <span>4. Pencairan Bendahara</span>
                  </div>
                </div>
              </div>

              {selectedLoan.catatan && (
                <div className="p-3 rounded-lg border bg-muted/20 text-muted-foreground">
                  <span className="font-semibold text-foreground">Catatan Pemohon: </span>
                  {selectedLoan.catatan}
                </div>
              )}

              {selectedLoan.alasanPenolakan && (
                <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs">
                  <span className="font-semibold">Alasan Penolakan: </span>
                  {selectedLoan.alasanPenolakan}
                </div>
              )}

              {/* Tombol Pemeriksaan Dokumen & Arsip */}
              <div className="pt-1">
                <Button
                  variant="outline"
                  onClick={() => setDocModalOpen(true)}
                  className="w-full gap-2 text-xs font-semibold shadow-sm border-primary/30"
                >
                  <FileText className="size-4 text-primary" />
                  Pemeriksaan Dokumen Persyaratan &amp; Unduh Arsip Digital
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Pemeriksaan Dokumen & Arsip */}
      {selectedLoan && (
        <DokumenViewerModal
          isOpen={docModalOpen}
          onClose={() => setDocModalOpen(false)}
          pinjaman={selectedLoan}
        />
      )}
    </div>
  );
}
