import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Database,
  Plus,
  Edit,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Users,
  Search,
  CheckCircle2,
  RefreshCw,
  UserCheck,
  Filter,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiMaster, type Kotama, type Satminkal } from "@/lib/api";
import { useNavigate } from "@tanstack/react-router";
import { useSession } from "@/components/session-context";

// ─── Form state types ──────────────────────────────────────────────────────────
interface KotamaFormState {
  kode: string;
  nama: string;
  tipe: string;
  adminUsername: string;
  adminPassword: string;
  adminNamaLengkap: string;
}

interface SatminkalFormState {
  kode: string;
  nama: string;
  kotamaId: string;
  adminUsername: string;
  adminPassword: string;
  adminNamaLengkap: string;
}

const emptyKotamaForm: KotamaFormState = {
  kode: "",
  nama: "",
  tipe: "KOTAMA",
  adminUsername: "",
  adminPassword: "",
  adminNamaLengkap: "",
};

const emptySatminkalForm: SatminkalFormState = {
  kode: "",
  nama: "",
  kotamaId: "",
  adminUsername: "",
  adminPassword: "",
  adminNamaLengkap: "",
};

// ─── Password Field Component ──────────────────────────────────────────────────
function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold text-foreground">
        {label} <span className="text-destructive">*</span>
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Min. 6 karakter"}
          className="pr-9 text-xs h-9"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
      </div>
    </div>
  );
}

export function SuperAdminMasterDataWidget() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { startMonitoringKotama } = useSession();
  const [activeTab, setActiveTab] = useState("kotama");

  const handleMonitorKotama = async (kotama: any) => {
    try {
      await startMonitoringKotama({
        id: kotama.id,
        kode: kotama.kode,
        nama: kotama.nama,
      });
      toast.success("Mode Monitoring Aktif", {
        description: `Sedang mengamati Komando Utama ${kotama.nama} (Mode Tamu / Read-Only)`,
      });
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error("Gagal memulai monitoring", {
        description: err.message || "Terjadi kesalahan sistem",
      });
    }
  };

  // Search & Filter states
  const [kotamaSearch, setKotamaSearch] = useState("");
  const [kotamaTipeFilter, setKotamaTipeFilter] = useState("SEMUA");
  const [satminkalSearch, setSatminkalSearch] = useState("");
  const [satminkalKotamaFilter, setSatminkalKotamaFilter] = useState("SEMUA");

  // Dialog states
  const [createKotamaOpen, setCreateKotamaOpen] = useState(false);
  const [createSatminkalOpen, setCreateSatminkalOpen] = useState(false);
  const [editKotamaOpen, setEditKotamaOpen] = useState(false);
  const [editSatminkalOpen, setEditSatminkalOpen] = useState(false);
  const [selectedKotama, setSelectedKotama] = useState<any | null>(null);
  const [selectedSatminkal, setSelectedSatminkal] = useState<any | null>(null);

  // Edit forms
  const [editKotamaForm, setEditKotamaForm] = useState({ kode: "", nama: "", tipe: "KOTAMA" });
  const [editSatminkalForm, setEditSatminkalForm] = useState({ kode: "", nama: "", kotamaId: "" });

  // Create form states
  const [kotamaForm, setKotamaForm] = useState<KotamaFormState>(emptyKotamaForm);
  const [satminkalForm, setSatminkalForm] = useState<SatminkalFormState>(emptySatminkalForm);

  // Confirmation dialogs
  const [confirmKotama, setConfirmKotama] = useState(false);
  const [confirmSatminkal, setConfirmSatminkal] = useState(false);

  // ── Queries ────────────────────────────────────────────────────────────────
  const {
    data: kotamaList = [],
    isLoading: loadingKotama,
    refetch: refetchKotama,
  } = useQuery({
    queryKey: ["master-kotama"],
    queryFn: () => apiMaster.getKotama(),
  });

  const {
    data: satminkalList = [],
    isLoading: loadingSatminkal,
    refetch: refetchSatminkal,
  } = useQuery({
    queryKey: ["master-satminkal"],
    queryFn: () => apiMaster.getSatminkal(),
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const kotamaMutation = useMutation({
    mutationFn: () =>
      apiMaster.createKotamaWithAdmin({
        kode: kotamaForm.kode,
        nama: kotamaForm.nama,
        tipe: kotamaForm.tipe,
        adminUsername: kotamaForm.adminUsername,
        adminPassword: kotamaForm.adminPassword,
        adminNamaLengkap: kotamaForm.adminNamaLengkap,
      }),
    onSuccess: (res) => {
      toast.success("Kotama & Admin Berhasil Didaftarkan", {
        description: `${res.kotama?.nama} dengan Admin @${res.admin?.username} telah dibuat.`,
      });
      setKotamaForm(emptyKotamaForm);
      setConfirmKotama(false);
      setCreateKotamaOpen(false);
      queryClient.invalidateQueries({ queryKey: ["master-kotama"] });
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
    },
    onError: (err: any) => {
      toast.error("Gagal Mendaftarkan Kotama", {
        description: err?.message || "Periksa kembali data yang dimasukkan.",
      });
      setConfirmKotama(false);
    },
  });

  const satminkalMutation = useMutation({
    mutationFn: () =>
      apiMaster.createSatminkalWithAdmin({
        kode: satminkalForm.kode,
        nama: satminkalForm.nama,
        kotamaId: satminkalForm.kotamaId,
        adminUsername: satminkalForm.adminUsername,
        adminPassword: satminkalForm.adminPassword,
        adminNamaLengkap: satminkalForm.adminNamaLengkap,
      }),
    onSuccess: (res) => {
      toast.success("Satminkal & Admin Berhasil Didaftarkan", {
        description: `${res.satminkal?.nama} dengan Admin @${res.admin?.username} telah dibuat.`,
      });
      setSatminkalForm(emptySatminkalForm);
      setConfirmSatminkal(false);
      setCreateSatminkalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["master-satminkal"] });
      queryClient.invalidateQueries({ queryKey: ["master-kotama"] });
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
    },
    onError: (err: any) => {
      toast.error("Gagal Mendaftarkan Satminkal", {
        description: err?.message || "Periksa kembali data yang dimasukkan.",
      });
      setConfirmSatminkal(false);
    },
  });

  const updateKotamaMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => apiMaster.updateKotama(id, dto),
    onSuccess: () => {
      toast.success("Data Kotama Berhasil Diperbarui");
      setEditKotamaOpen(false);
      setSelectedKotama(null);
      queryClient.invalidateQueries({ queryKey: ["master-kotama"] });
    },
    onError: (err: any) => {
      toast.error("Gagal Memperbarui Kotama", { description: err.message });
    },
  });

  const updateSatminkalMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => apiMaster.updateSatminkal(id, dto),
    onSuccess: () => {
      toast.success("Data Satminkal Berhasil Diperbarui");
      setEditSatminkalOpen(false);
      setSelectedSatminkal(null);
      queryClient.invalidateQueries({ queryKey: ["master-satminkal"] });
    },
    onError: (err: any) => {
      toast.error("Gagal Memperbarui Satminkal", { description: err.message });
    },
  });

  const isKotamaFormValid =
    kotamaForm.kode.trim() &&
    kotamaForm.nama.trim() &&
    kotamaForm.adminUsername.trim() &&
    kotamaForm.adminPassword.trim().length >= 6 &&
    kotamaForm.adminNamaLengkap.trim();

  const isSatminkalFormValid =
    satminkalForm.kode.trim() &&
    satminkalForm.nama.trim() &&
    satminkalForm.kotamaId &&
    satminkalForm.adminUsername.trim() &&
    satminkalForm.adminPassword.trim().length >= 6 &&
    satminkalForm.adminNamaLengkap.trim();

  const selectedKotamaForSatminkal = kotamaList.find(
    (k: Kotama) => k.id === satminkalForm.kotamaId
  );

  // Filtered lists
  const filteredKotama = useMemo(() => {
    const q = kotamaSearch.toLowerCase().trim();
    return kotamaList.filter((k: any) => {
      const matchQ =
        !q ||
        k.nama.toLowerCase().includes(q) ||
        k.kode.toLowerCase().includes(q) ||
        (k.tipe && k.tipe.toLowerCase().includes(q));
      const matchTipe =
        kotamaTipeFilter === "SEMUA" || (k.tipe || "KOTAMA").toUpperCase() === kotamaTipeFilter;
      return matchQ && matchTipe;
    });
  }, [kotamaList, kotamaSearch, kotamaTipeFilter]);

  const filteredSatminkal = useMemo(() => {
    const q = satminkalSearch.toLowerCase().trim();
    return satminkalList.filter((s: any) => {
      const matchQ =
        !q ||
        s.nama.toLowerCase().includes(q) ||
        s.kode.toLowerCase().includes(q) ||
        (s.kotama?.nama && s.kotama.nama.toLowerCase().includes(q)) ||
        (s.admin?.namaLengkap && s.admin.namaLengkap.toLowerCase().includes(q));
      const matchKotama =
        satminkalKotamaFilter === "SEMUA" ||
        s.kotamaId === satminkalKotamaFilter ||
        (s.kotama && s.kotama.id === satminkalKotamaFilter);
      return matchQ && matchKotama;
    });
  }, [satminkalList, satminkalSearch, satminkalKotamaFilter]);

  const handleRefreshAll = () => {
    refetchKotama();
    refetchSatminkal();
    toast.success("Data jajaran diperbarui");
  };

  const handleOpenEditKotama = (k: any) => {
    setSelectedKotama(k);
    setEditKotamaForm({
      kode: k.kode,
      nama: k.nama,
      tipe: k.tipe || "KOTAMA",
    });
    setEditKotamaOpen(true);
  };

  const handleOpenEditSatminkal = (s: any) => {
    setSelectedSatminkal(s);
    setEditSatminkalForm({
      kode: s.kode,
      nama: s.nama,
      kotamaId: s.kotamaId || s.kotama?.id || "",
    });
    setEditSatminkalOpen(true);
  };

  // KPI Summary Items (Consistent with Kotama and Satminkal Dashboards)
  const kpiItems = [
    {
      label: "Total Kotama / Balakpus",
      value: `${kotamaList.length.toLocaleString("id-ID")} Komando`,
      delta: "Seluruh Kotama & Balakpus Terdaftar",
      icon: Building2,
      loading: loadingKotama,
    },
    {
      label: "Total Satminkal Jajaran",
      value: `${satminkalList.length.toLocaleString("id-ID")} Satminkal`,
      delta: "Koperasi Primer (Primkopad) Binaan",
      icon: Database,
      loading: loadingSatminkal,
    },
    {
      label: "Cakupan Integrasi Nasional",
      value: "Tingkat Mabes TNI AD",
      delta: "Pemetaan Terpadu Satuan Binaan",
      icon: Users,
      loading: false,
    },
    {
      label: "Status Otoritas Komando",
      value: "Super Administrator",
      delta: "Wewenang Penuh Registrasi & Hak Akses",
      icon: ShieldCheck,
      loading: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Main KPI Cards Grid (Harmonized with Kotama & Satminkal Dashboards) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiItems.map((kpi) => (
          <Card key={kpi.label} className="shadow-card card-interactive">
            <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 pb-2">
              <CardDescription className="min-w-0 truncate">{kpi.label}</CardDescription>
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary transition-transform group-hover:scale-105">
                <kpi.icon className="size-4" />
              </span>
            </CardHeader>
            <CardContent>
              {kpi.loading ? (
                <div className="flex items-center gap-2 py-1 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-primary" /> Memuat...
                </div>
              ) : (
                <p className="text-xl sm:text-2xl font-extrabold tracking-tight break-words text-foreground">
                  {kpi.value}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {kpi.delta}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 2. Tabs: Kotama / Balakpus & Satminkal / Primkopad */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList className="h-10 gap-1 bg-muted/60 border border-border p-1">
            <TabsTrigger
              value="kotama"
              className="gap-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow"
            >
              <Building2 className="size-3.5" />
              Kotama / Balakpus
              <Badge className="ml-1 text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-primary/30 font-bold">
                {kotamaList.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="satminkal"
              className="gap-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow"
            >
              <Database className="size-3.5" />
              Satminkal / Primkopad
              <Badge className="ml-1 text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-primary/30 font-bold">
                {satminkalList.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              className="text-xs h-9 gap-1.5"
            >
              <RefreshCw className="size-3.5" />
              Perbarui
            </Button>
            {activeTab === "kotama" ? (
              <Button
                size="sm"
                onClick={() => setCreateKotamaOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-9 gap-1.5 shadow-sm"
              >
                <Plus className="size-4" />
                Tambah Kotama Baru
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setCreateSatminkalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-9 gap-1.5 shadow-sm"
              >
                <Plus className="size-4" />
                Tambah Satminkal Baru
              </Button>
            )}
          </div>
        </div>

        {/* ════════ TAB: KOTAMA / BALAKPUS ════════ */}
        <TabsContent value="kotama" className="space-y-4">
          {/* Search & Filter Card */}
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={kotamaSearch}
                    onChange={(e) => setKotamaSearch(e.target.value)}
                    placeholder="Cari kode, nama kotama, atau tipe..."
                    className="h-9 pl-9 text-xs rounded-lg"
                  />
                </div>

                <Select value={kotamaTipeFilter} onValueChange={setKotamaTipeFilter}>
                  <SelectTrigger className="h-9 text-xs w-36">
                    <SelectValue placeholder="Tipe Satuan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEMUA">Semua Tipe</SelectItem>
                    <SelectItem value="KODAM">KODAM</SelectItem>
                    <SelectItem value="BALAKPUS">BALAKPUS</SelectItem>
                    <SelectItem value="KOSTRAD">KOSTRAD</SelectItem>
                    <SelectItem value="KOPASSUS">KOPASSUS</SelectItem>
                    <SelectItem value="KODIKLAT">KODIKLAT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="font-mono">
                  Total {filteredKotama.length} Kotama / Balakpus
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Kotama Data Table */}
          <Card className="shadow-card border-border/80 overflow-hidden">
            <CardHeader className="p-4 pb-2 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                Daftar Komando Utama (Kotama / Balakpus) Terdaftar
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Daftar seluruh komando utama tingkat Kotama dan Badan Pelaksana Pusat di lingkungan TNI AD.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="text-xs">
                      <TableHead className="w-12 text-center font-bold">No</TableHead>
                      <TableHead className="font-bold">Kode</TableHead>
                      <TableHead className="font-bold">Nama Kotama / Balakpus</TableHead>
                      <TableHead className="font-bold">Tipe Satuan</TableHead>
                      <TableHead className="font-bold">Satminkal Binaan</TableHead>
                      <TableHead className="text-center font-bold">Status</TableHead>
                      <TableHead className="text-right font-bold">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border">
                    {loadingKotama ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                          <Loader2 className="size-5 animate-spin mx-auto mb-1 text-primary" />
                          Memuat data Kotama...
                        </TableCell>
                      </TableRow>
                    ) : filteredKotama.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                          Tidak ada Kotama / Balakpus yang sesuai dengan pencarian.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredKotama.map((k: any, idx: number) => {
                        const satCount =
                          k.satminkal?.length ??
                          satminkalList.filter((s: any) => s.kotamaId === k.id).length;

                        return (
                          <TableRow key={k.id} className="hover:bg-muted/30 text-xs transition-colors">
                            <TableCell className="text-center font-mono text-muted-foreground">
                              {idx + 1}
                            </TableCell>
                            <TableCell className="font-mono font-bold text-primary">
                              {k.kode}
                            </TableCell>
                            <TableCell className="font-semibold text-foreground text-sm">
                              {k.nama}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="text-[10px] font-semibold bg-primary-soft text-primary border-primary/20"
                              >
                                {k.tipe || "KOTAMA"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[11px] font-mono">
                                {satCount} satker
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-semibold">
                                AKTIF
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleMonitorKotama(k)}
                                  className="h-7 px-2.5 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold gap-1"
                                  title="Masuk Mode Monitoring (Read-Only)"
                                >
                                  <Eye className="size-3.5" />
                                  Monitoring
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleOpenEditKotama(k)}
                                  className="h-7 px-2 text-xs"
                                  title="Edit Kotama"
                                >
                                  <Edit className="size-3.5 mr-1" />
                                  Edit
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════ TAB: SATMINKAL / PRIMKOPAD ════════ */}
        <TabsContent value="satminkal" className="space-y-4">
          {/* Search & Filter Card */}
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={satminkalSearch}
                    onChange={(e) => setSatminkalSearch(e.target.value)}
                    placeholder="Cari satminkal, kode, atau admin..."
                    className="h-9 pl-9 text-xs rounded-lg"
                  />
                </div>

                <Select value={satminkalKotamaFilter} onValueChange={setSatminkalKotamaFilter}>
                  <SelectTrigger className="h-9 text-xs w-48">
                    <SelectValue placeholder="Kotama Induk" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEMUA">Semua Kotama</SelectItem>
                    {kotamaList.map((k: Kotama) => (
                      <SelectItem key={k.id} value={k.id}>
                        [{k.kode}] {k.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="font-mono">
                  Total {filteredSatminkal.length} Satminkal Terdaftar
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Satminkal Data Table */}
          <Card className="shadow-card border-border/80 overflow-hidden">
            <CardHeader className="p-4 pb-2 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Database className="size-4 text-primary" />
                Daftar Satuan Kerja Koperasi (Satminkal / Primkopad) Terdaftar
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Daftar seluruh satuan kerja koperasi primer dan pemetaan ke Komando Utama induk terkait.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="text-xs">
                      <TableHead className="w-12 text-center font-bold">No</TableHead>
                      <TableHead className="font-bold">Kode &amp; Satminkal</TableHead>
                      <TableHead className="font-bold">Kotama Induk</TableHead>
                      <TableHead className="font-bold">Admin Koperasi</TableHead>
                      <TableHead className="text-center font-bold">Status</TableHead>
                      <TableHead className="text-right font-bold">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border">
                    {loadingSatminkal ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                          <Loader2 className="size-5 animate-spin mx-auto mb-1 text-primary" />
                          Memuat data Satminkal...
                        </TableCell>
                      </TableRow>
                    ) : filteredSatminkal.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                          Tidak ada Satminkal yang sesuai dengan kriteria pencarian.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSatminkal.map((s: any, idx: number) => {
                        const kNama = s.kotama?.nama || s.kotamaNama || "-";
                        const kKode = s.kotama?.kode || "";

                        return (
                          <TableRow key={s.id} className="hover:bg-muted/30 text-xs transition-colors">
                            <TableCell className="text-center font-mono text-muted-foreground">
                              {idx + 1}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-0.5">
                                <div className="font-semibold text-sm text-foreground">{s.nama}</div>
                                <div className="text-[11px] text-muted-foreground font-mono">
                                  Kode: <span className="text-foreground font-bold">{s.kode}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[11px] font-medium bg-muted/30">
                                {kKode ? `[${kKode}] ` : ""}{kNama}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-0.5">
                                <div className="font-medium text-foreground">
                                  {s.admin?.namaLengkap || "Admin Satminkal"}
                                </div>
                                <div className="text-[11px] font-mono text-primary">
                                  @{s.admin?.username || `admin_${s.kode.toLowerCase().replace(/[^a-z0-9]/g, "")}`}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-semibold">
                                AKTIF
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEditSatminkal(s)}
                                className="h-7 px-2 text-xs"
                                title="Edit Satminkal"
                              >
                                <Edit className="size-3.5 mr-1" />
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Dialog: Tambah Kotama Baru ── */}
      <Dialog open={createKotamaOpen} onOpenChange={setCreateKotamaOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-5 text-emerald-600" />
              Tambah Kotama / Balakpus Baru
            </DialogTitle>
            <DialogDescription className="text-xs">
              Daftarkan Komando Utama baru beserta inisialisasi akun Administrator penanggung jawab.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Kode Kotama *</Label>
                  <Input
                    required
                    placeholder="Cth: 02, KOSTRAD"
                    value={kotamaForm.kode}
                    onChange={(e) => setKotamaForm({ ...kotamaForm, kode: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Tipe Satuan</Label>
                  <Select
                    value={kotamaForm.tipe}
                    onValueChange={(v) => setKotamaForm({ ...kotamaForm, tipe: v })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KOTAMA">KOTAMA</SelectItem>
                      <SelectItem value="BALAKPUS">BALAKPUS</SelectItem>
                      <SelectItem value="KODAM">KODAM</SelectItem>
                      <SelectItem value="KOSTRAD">KOSTRAD</SelectItem>
                      <SelectItem value="KOPASSUS">KOPASSUS</SelectItem>
                      <SelectItem value="KODIKLAT">KODIKLAT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nama Kotama / Balakpus *</Label>
                <Input
                  required
                  placeholder="Cth: Kodam IV/Diponegoro"
                  value={kotamaForm.nama}
                  onChange={(e) => setKotamaForm({ ...kotamaForm, nama: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="border-t border-border pt-3 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <UserCheck className="size-4 text-emerald-600" />
                <span>Inisialisasi Akun Admin Kotama (Wajib)</span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nama Lengkap Admin *</Label>
                <Input
                  required
                  placeholder="Cth: Letkol Cba Budi Santoso"
                  value={kotamaForm.adminNamaLengkap}
                  onChange={(e) => setKotamaForm({ ...kotamaForm, adminNamaLengkap: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Username Admin *</Label>
                  <Input
                    required
                    placeholder="admin.kodam4"
                    value={kotamaForm.adminUsername}
                    onChange={(e) => setKotamaForm({ ...kotamaForm, adminUsername: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <PasswordField
                  id="kotama-pass"
                  label="Password Admin"
                  value={kotamaForm.adminPassword}
                  onChange={(v) => setKotamaForm({ ...kotamaForm, adminPassword: v })}
                />
              </div>

              {kotamaForm.adminPassword && kotamaForm.adminPassword.length < 6 && (
                <p className="text-[11px] text-destructive font-medium">
                  ⚠ Password minimal 6 karakter
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateKotamaOpen(false)}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!isKotamaFormValid || kotamaMutation.isPending}
              onClick={() => setConfirmKotama(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
            >
              {kotamaMutation.isPending ? "Menyimpan..." : "Daftarkan Kotama & Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Tambah Satminkal Baru ── */}
      <Dialog open={createSatminkalOpen} onOpenChange={setCreateSatminkalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Database className="size-5 text-emerald-600" />
              Tambah Satminkal / Primkopad Baru
            </DialogTitle>
            <DialogDescription className="text-xs">
              Pilih Kotama induk, lalu isi data Satminkal dan akun Admin Koperasi penanggung jawab.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-3">
              {/* Kotama Picker */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Kotama / Balakpus Induk *</Label>
                <Select
                  value={satminkalForm.kotamaId}
                  onValueChange={(v) => setSatminkalForm({ ...satminkalForm, kotamaId: v })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="— Pilih Kotama Induk —" />
                  </SelectTrigger>
                  <SelectContent>
                    {kotamaList.map((k: Kotama) => (
                      <SelectItem key={k.id} value={k.id}>
                        [{k.kode}] {k.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedKotamaForSatminkal && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
                  <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Satminkal ini akan berada di bawah <strong>{selectedKotamaForSatminkal.nama}</strong>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Kode Satminkal *</Label>
                  <Input
                    required
                    placeholder="Cth: 685600"
                    value={satminkalForm.kode}
                    onChange={(e) => setSatminkalForm({ ...satminkalForm, kode: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Nama Satminkal *</Label>
                  <Input
                    required
                    placeholder="Cth: Primkopad Yonif 400"
                    value={satminkalForm.nama}
                    onChange={(e) => setSatminkalForm({ ...satminkalForm, nama: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-3 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <UserCheck className="size-4 text-emerald-600" />
                <span>Inisialisasi Akun Admin Satminkal (Wajib)</span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nama Lengkap Admin *</Label>
                <Input
                  required
                  placeholder="Cth: Kapten Cku Ahmad Rifai"
                  value={satminkalForm.adminNamaLengkap}
                  onChange={(e) => setSatminkalForm({ ...satminkalForm, adminNamaLengkap: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Username Admin *</Label>
                  <Input
                    required
                    placeholder="admin.yonif400"
                    value={satminkalForm.adminUsername}
                    onChange={(e) => setSatminkalForm({ ...satminkalForm, adminUsername: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <PasswordField
                  id="satminkal-pass"
                  label="Password Admin"
                  value={satminkalForm.adminPassword}
                  onChange={(v) => setSatminkalForm({ ...satminkalForm, adminPassword: v })}
                />
              </div>

              {satminkalForm.adminPassword && satminkalForm.adminPassword.length < 6 && (
                <p className="text-[11px] text-destructive font-medium">
                  ⚠ Password minimal 6 karakter
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateSatminkalOpen(false)}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!isSatminkalFormValid || satminkalMutation.isPending}
              onClick={() => setConfirmSatminkal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
            >
              {satminkalMutation.isPending ? "Menyimpan..." : "Daftarkan Satminkal & Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Edit Kotama ── */}
      <Dialog open={editKotamaOpen} onOpenChange={setEditKotamaOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Edit className="size-4 text-primary" />
              Edit Kotama / Balakpus
            </DialogTitle>
            <DialogDescription className="text-xs">
              Perbarui data identitas Komando Utama {selectedKotama?.nama}.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!selectedKotama) return;
              updateKotamaMutation.mutate({ id: selectedKotama.id, dto: editKotamaForm });
            }}
            className="space-y-3 py-2"
          >
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Kode Kotama *</Label>
                <Input
                  required
                  value={editKotamaForm.kode}
                  onChange={(e) => setEditKotamaForm({ ...editKotamaForm, kode: e.target.value })}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tipe Satuan</Label>
                <Select
                  value={editKotamaForm.tipe}
                  onValueChange={(v) => setEditKotamaForm({ ...editKotamaForm, tipe: v })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KOTAMA">KOTAMA</SelectItem>
                    <SelectItem value="BALAKPUS">BALAKPUS</SelectItem>
                    <SelectItem value="KODAM">KODAM</SelectItem>
                    <SelectItem value="KOSTRAD">KOSTRAD</SelectItem>
                    <SelectItem value="KOPASSUS">KOPASSUS</SelectItem>
                    <SelectItem value="KODIKLAT">KODIKLAT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nama Kotama *</Label>
              <Input
                required
                value={editKotamaForm.nama}
                onChange={(e) => setEditKotamaForm({ ...editKotamaForm, nama: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditKotamaOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={updateKotamaMutation.isPending}
                className="bg-primary text-primary-foreground text-xs font-semibold"
              >
                {updateKotamaMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Edit Satminkal ── */}
      <Dialog open={editSatminkalOpen} onOpenChange={setEditSatminkalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Edit className="size-4 text-primary" />
              Edit Satminkal / Primkopad
            </DialogTitle>
            <DialogDescription className="text-xs">
              Perbarui data rincian Satminkal {selectedSatminkal?.nama}.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!selectedSatminkal) return;
              updateSatminkalMutation.mutate({ id: selectedSatminkal.id, dto: editSatminkalForm });
            }}
            className="space-y-3 py-2"
          >
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Kotama Induk *</Label>
              <Select
                value={editSatminkalForm.kotamaId}
                onValueChange={(v) => setEditSatminkalForm({ ...editSatminkalForm, kotamaId: v })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Pilih Kotama" />
                </SelectTrigger>
                <SelectContent>
                  {kotamaList.map((k: Kotama) => (
                    <SelectItem key={k.id} value={k.id}>
                      [{k.kode}] {k.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Kode Satminkal *</Label>
                <Input
                  required
                  value={editSatminkalForm.kode}
                  onChange={(e) => setEditSatminkalForm({ ...editSatminkalForm, kode: e.target.value })}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nama Satminkal *</Label>
                <Input
                  required
                  value={editSatminkalForm.nama}
                  onChange={(e) => setEditSatminkalForm({ ...editSatminkalForm, nama: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditSatminkalOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={updateSatminkalMutation.isPending}
                className="bg-primary text-primary-foreground text-xs font-semibold"
              >
                {updateSatminkalMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Confirm: Create Kotama ── */}
      <ConfirmActionDialog
        open={confirmKotama}
        onOpenChange={setConfirmKotama}
        title="Konfirmasi Pendaftaran Kotama & Admin"
        description="Anda akan mendaftarkan Komando Utama baru beserta inisialisasi akun Administrator penanggung jawab ke database."
        confirmText="Ya, Daftarkan Kotama"
        variant="default"
        isLoading={kotamaMutation.isPending}
        details={[
          { label: "Kode Kotama", value: kotamaForm.kode },
          { label: "Nama Kotama", value: kotamaForm.nama },
          { label: "Tipe Satuan", value: kotamaForm.tipe },
          { label: "Nama Admin", value: kotamaForm.adminNamaLengkap },
          { label: "Username Admin", value: `@${kotamaForm.adminUsername}` },
        ]}
        onConfirm={() => kotamaMutation.mutate()}
      />

      {/* ── Confirm: Create Satminkal ── */}
      <ConfirmActionDialog
        open={confirmSatminkal}
        onOpenChange={setConfirmSatminkal}
        title="Konfirmasi Pendaftaran Satminkal & Admin"
        description="Anda akan mendaftarkan Satminkal baru di bawah Kotama terpilih beserta inisialisasi akun Administrator penanggung jawab ke database."
        confirmText="Ya, Daftarkan Satminkal"
        variant="default"
        isLoading={satminkalMutation.isPending}
        details={[
          { label: "Kode Satminkal", value: satminkalForm.kode },
          { label: "Nama Satminkal", value: satminkalForm.nama },
          {
            label: "Kotama Induk",
            value: selectedKotamaForSatminkal
              ? `[${selectedKotamaForSatminkal.kode}] ${selectedKotamaForSatminkal.nama}`
              : "-",
          },
          { label: "Nama Admin", value: satminkalForm.adminNamaLengkap },
          { label: "Username Admin", value: `@${satminkalForm.adminUsername}` },
        ]}
        onConfirm={() => satminkalMutation.mutate()}
      />
    </div>
  );
}
