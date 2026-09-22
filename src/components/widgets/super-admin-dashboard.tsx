import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "@tanstack/react-router";
import {
  Building2,
  Database,
  Users,
  Shield,
  Activity,
  LogOut,
  RefreshCw,
  Loader2,
  ShieldCheck,
  ChevronRight,
  Eye,
  Radio,
  Clock,
  Layers,
  Search,
  CheckCircle2,
  BadgeCheck,
  Lock,
  Download,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiUsers, apiMaster, apiBackup } from "@/lib/api";
import { backendRoleToFrontend } from "@/lib/casheva-data";
import { useSession } from "@/components/session-context";

export function SuperAdminDashboardView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { startMonitoringKotama } = useSession();

  const [sessionSearch, setSessionSearch] = useState("");
  const [sessionToTerminate, setSessionToTerminate] = useState<any | null>(null);
  const [openConfirmTerminate, setOpenConfirmTerminate] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

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

  // Queries
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

  const {
    data: activeSessions = [],
    isLoading: loadingSessions,
    isFetching: fetchingSessions,
    refetch: refetchSessions,
  } = useQuery({
    queryKey: ["active-sessions"],
    queryFn: () => apiUsers.getActiveSessions(),
    refetchInterval: 5000,
  });

  const {
    data: allUsers = [],
    isLoading: loadingUsers,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["users-list"],
    queryFn: () => apiUsers.findAll(),
    refetchInterval: 10000,
  });

  const handleConfirmBackup = async () => {
    try {
      setIsBackingUp(true);
      const filename = await apiBackup.downloadEncryptedFile();
      toast.success("Cadangan Database Global Berhasil", {
        description: `File cadangan konsolidasi nasional seluruh Kotama & Satminkal (${filename}) berhasil diunduh dan tersimpan aman (AES-256-GCM).`,
      });
      setBackupDialogOpen(false);
    } catch (err: any) {
      toast.error("Gagal Mencadangkan Data Global", {
        description:
          err.message ||
          "Terjadi kendala saat memproses cadangan database global.",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRefreshAll = () => {
    refetchKotama();
    refetchSatminkal();
    refetchSessions();
    refetchUsers();
    toast.success("Data Dashboard Super Admin diperbarui");
  };

  // Force Logout Mutation with Universal Alert
  const terminateSessionMutation = useMutation({
    mutationFn: (userId: string) => apiUsers.terminateSession(userId),
    onSuccess: () => {
      toast.success("Sesi Pengguna Berhasil Diakhiri", {
        description: `Pengguna @${sessionToTerminate?.username || ""} telah dipaksa logout dari perangkat yang terhubung.`,
      });
      queryClient.invalidateQueries({ queryKey: ["active-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      setSessionToTerminate(null);
      setOpenConfirmTerminate(false);
    },
    onError: (err: any) => {
      toast.error("Gagal Memaksa Logout", {
        description: err.message || "Terjadi kesalahan saat memutuskan sesi pengguna.",
      });
    },
  });

  // Group active sessions by Kotama
  const sessionsByKotama = useMemo(() => {
    const q = sessionSearch.toLowerCase().trim();
    const filtered = activeSessions.filter((s: any) => {
      if (!q) return true;
      return (
        (s.username || "").toLowerCase().includes(q) ||
        (s.namaLengkap || "").toLowerCase().includes(q) ||
        (s.satminkal || "").toLowerCase().includes(q) ||
        (s.kotamaNama || "").toLowerCase().includes(q) ||
        (backendRoleToFrontend(s.role) || "").toLowerCase().includes(q)
      );
    });

    // Grouping map: kotamaNama -> list of sessions
    const grouped: Record<string, any[]> = {};

    // Ensure all registered kotamas exist in map if desired, or group by presence
    kotamaList.forEach((k: any) => {
      grouped[k.nama] = [];
    });

    // Include general "Mabes TNI AD / Pusat"
    grouped["MABES TNI AD / PUSAT"] = [];

    filtered.forEach((s: any) => {
      let kNama = s.kotamaNama || "MABES TNI AD / PUSAT";
      // Normalize to match existing kotama list
      const matchedKotama = kotamaList.find(
        (k: any) => k.id === s.kotamaId || k.nama.toLowerCase() === kNama.toLowerCase()
      );
      if (matchedKotama) {
        kNama = matchedKotama.nama;
      }

      if (!grouped[kNama]) {
        grouped[kNama] = [];
      }
      grouped[kNama]!.push(s);
    });

    return grouped;
  }, [activeSessions, kotamaList, sessionSearch]);

  const totalKotamaCount = kotamaList.length;
  const totalSatminkalCount = satminkalList.length;
  const totalActiveSessionsCount = activeSessions.length;
  const totalUsersCount = allUsers.length;

  // Main 4 KPI items (Matching Kotama/Satminkal layout)
  const kpiItems = [
    {
      label: "Total Kotama / Balakpus",
      value: `${totalKotamaCount.toLocaleString("id-ID")} Komando`,
      delta: "Seluruh Komando Utama & Balakpus",
      icon: Building2,
      loading: loadingKotama,
    },
    {
      label: "Total Satminkal (Satker)",
      value: `${totalSatminkalCount.toLocaleString("id-ID")} Satminkal`,
      delta: "Unit Koperasi Primer (Primkopad)",
      icon: Database,
      loading: loadingSatminkal,
    },
    {
      label: "Sesi Aktif Realtime",
      value: `${totalActiveSessionsCount.toLocaleString("id-ID")} Sesi Terhubung`,
      delta: "Admin Kotama & Satminkal Terautentikasi",
      icon: Activity,
      loading: loadingSessions,
    },
    {
      label: "Total Akun Pengguna",
      value: `${totalUsersCount.toLocaleString("id-ID")} Personel`,
      delta: "Akun Pengurus & Anggota Terdaftar",
      icon: Users,
      loading: loadingUsers,
    },
  ];

  // Secondary status counters (Matching Kotama/Satminkal layout)
  const statusKpis = [
    {
      label: "Tingkat Otoritas Sistem",
      value: "Super Administrator (Tingkat Pusat)",
      hint: "Wewenang Penuh Audit, Monitoring & Kendali Sesi",
      icon: ShieldCheck,
      tone: "text-primary bg-primary-soft",
    },
    {
      label: "Kebijakan Akses Perangkat",
      value: "Single Device Enforcement (Aktif)",
      hint: "Sesi Otomatis Diputus Saat Login Ganda Terdeteksi",
      icon: Lock,
      tone: "text-accent-foreground bg-gold-soft",
    },
    {
      label: "Konektivitas Integrasi",
      value: "Terpusat MABESAD / PUSAT",
      hint: "Sinkronisasi Realtime Seluruh Kotama & Satminkal",
      icon: CheckCircle2,
      tone: "text-primary bg-primary-soft",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Standard PageHeader (Consistent with Kotama and Satminkal) */}
      <PageHeader
        title="Dashboard Pusat Komando Super Admin"
        description="Pusat Pemantauan Agregat Kotama, Pengawasan Satminkal & Kontrol Keamanan Sesi Tunggal Mabes TNI AD TA 2026"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border-primary/30 bg-primary/5 text-primary"
            >
              <Radio className="size-3.5 animate-pulse text-emerald-600 dark:text-emerald-400" />
              Live Synchronized
            </Badge>
            <Button
              variant="outline"
              onClick={handleRefreshAll}
              className="text-xs h-9 gap-1.5"
            >
              <RefreshCw className="size-3.5" />
              Perbarui Data
            </Button>
            <Button
              onClick={() => setBackupDialogOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 gap-1.5 shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.02]"
            >
              <Download className="size-4" />
              Cadangkan Database Global
            </Button>
            <Button
              asChild
              variant="outline"
              className="text-xs h-9 gap-1.5"
            >
              <Link to="/monitoring-kotama">
                <Building2 className="size-4" />
                Monitoring Kotama
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="text-xs h-9 gap-1.5"
            >
              <Link to="/users">
                <Users className="size-4" />
                Kelola Pengguna
              </Link>
            </Button>
          </div>
        }
      />

      {/* Dialog Konfirmasi Pencadangan Database Global Super Admin */}
      <ConfirmActionDialog
        open={backupDialogOpen}
        onOpenChange={setBackupDialogOpen}
        onConfirm={handleConfirmBackup}
        isLoading={isBackingUp}
        title="Cadangkan Database Global Nasional (Terenkripsi AES-256)?"
        description="Sistem akan mengekspor snapshot data menyeluruh (Global Master, Seluruh Kotama/Balakpus, Seluruh Satminkal, Seluruh Anggota, Simpanan, Pinjaman, POS Toko, Gadai, dan Pengaturan) dalam format terenkripsi berstandar militer."
        confirmText="Unduh Cadangan Global"
        cancelText="Batal"
        variant="success"
        icon={<Database className="size-6 text-emerald-600 dark:text-emerald-400" />}
        details={[
          { label: "Cakupan Sistem", value: "GLOBAL (Mabesad / Seluruh Indonesia)" },
          { label: "Total Kotama", value: `${kotamaList.length} Kotama / Balakpus Terintegrasi` },
          { label: "Total Satminkal", value: `${satminkalList.length} Satminkal Koperasi Binaan` },
          { label: "Algoritma Enkripsi", value: "AES-256-GCM + SHA-256 Checksum" },
          { label: "Format File", value: ".siskopad.enc (Encrypted JSON Bundle)" },
          { label: "Perlindungan", value: "Disaster Recovery & Anti-Ransomware" },
        ]}
      />

      {/* 2. Main KPI Grid (4 Cards - Harmonized with Kotama & Satminkal) */}
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

      {/* 3. Secondary Status Highlight Row (Consistent with Kotama / Satminkal) */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statusKpis.map((kpi) => (
          <Card key={kpi.label} className="shadow-card border-border/80">
            <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 pb-1.5">
              <CardDescription className="text-xs font-semibold">{kpi.label}</CardDescription>
              <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${kpi.tone}`}>
                <kpi.icon className="size-4" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-bold text-foreground">{kpi.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{kpi.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 4. SECTION: SESI AKTIF SELURUH KOTAMA & SATMINKAL (DIKELOMPOKKAN PER KOTAMA) */}
      <Card className="shadow-card">
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                Daftar Sesi Aktif Admin (Dikelompokkan Berdasarkan Kotama / Balakpus)
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Super Admin memiliki wewenang untuk memantau dan memaksa logout (*Force Logout*) sesi aktif admin pada seluruh level Kotama dan Satminkal.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={sessionSearch}
                  onChange={(e) => setSessionSearch(e.target.value)}
                  placeholder="Cari admin, satminkal, kotama..."
                  className="h-9 pl-8 text-xs rounded-lg"
                />
              </div>
              <Badge variant="outline" className="h-9 px-2.5 font-mono text-xs shrink-0 flex items-center gap-1">
                {fetchingSessions && <RefreshCw className="size-3 animate-spin text-primary" />}
                {totalActiveSessionsCount} Sesi Terbuka
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {loadingSessions ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-primary mb-2" />
              <p className="text-xs">Mengambil data sesi aktif seluruh Kotama &amp; Satminkal...</p>
            </div>
          ) : Object.keys(sessionsByKotama).length === 0 || totalActiveSessionsCount === 0 ? (
            <div className="text-center py-10 border border-dashed rounded-xl space-y-2 bg-muted/10">
              <ShieldCheck className="size-8 mx-auto text-muted-foreground opacity-60" />
              <p className="text-sm font-semibold text-foreground">Tidak Ada Sesi Aktif</p>
              <p className="text-xs text-muted-foreground">
                Saat ini tidak ada admin Kotama maupun Satminkal yang sedang terhubung di sistem.
              </p>
            </div>
          ) : (
            Object.entries(sessionsByKotama).map(([kotamaName, sessions]) => {
              // Hide empty groups when filtering or if no sessions
              if (sessions.length === 0 && sessionSearch) return null;

              const matchedKotama = kotamaList.find(
                (k: any) => k.nama.toLowerCase() === kotamaName.toLowerCase()
              );

              return (
                <div
                  key={kotamaName}
                  className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-sm"
                >
                  {/* Kotama Group Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/40 px-4 py-3 border-b">
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                        <Building2 className="size-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">
                          {kotamaName}
                        </h3>
                        <p className="text-[10px] text-muted-foreground">
                          {sessions.length > 0
                            ? `${sessions.length} Admin Sedang Aktif`
                            : "Tidak ada sesi aktif di komando ini"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {matchedKotama && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMonitorKotama(matchedKotama)}
                          className="h-7 text-xs font-semibold gap-1.5 border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                          title={`Masuk ke mode monitoring untuk ${matchedKotama.nama}`}
                        >
                          <Eye className="size-3.5" />
                          Mode Tamu (Monitoring)
                        </Button>
                      )}
                      {sessions.length > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-semibold gap-1 px-2.5 py-0.5"
                        >
                          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {sessions.length} Sesi Terhubung
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Sessions Table for this Kotama */}
                  {sessions.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground italic">
                      Tidak ada pengguna aktif pada {kotamaName} saat ini.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="text-xs bg-muted/20">
                            <TableHead className="w-10 text-center font-bold">No</TableHead>
                            <TableHead className="font-bold">Nama Admin / Personel</TableHead>
                            <TableHead className="font-bold">NRP / Username</TableHead>
                            <TableHead className="font-bold">Role Akses</TableHead>
                            <TableHead className="font-bold">Satuan / Satminkal</TableHead>
                            <TableHead className="font-bold">Status Perangkat</TableHead>
                            <TableHead className="text-right font-bold">Tindakan Super Admin</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sessions.map((s: any, idx: number) => {
                            const isOnline = s.isOnline ?? true;
                            const isIdle = s.isIdle ?? false;
                            const uiRole = backendRoleToFrontend(s.role);

                            return (
                              <TableRow key={s.id} className="text-xs hover:bg-muted/30 transition-colors">
                                <TableCell className="text-center text-muted-foreground font-mono">
                                  {idx + 1}
                                </TableCell>
                                <TableCell className="font-semibold text-foreground">
                                  {s.namaLengkap}
                                </TableCell>
                                <TableCell className="font-mono text-primary font-semibold">
                                  @{s.username}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] font-semibold border-primary/30 bg-primary-soft text-primary"
                                  >
                                    {uiRole}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-[11px] text-muted-foreground font-medium">
                                  {s.satminkal || "Pusat / Kotama"}
                                </TableCell>
                                <TableCell>
                                  {isOnline ? (
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                      Live (Terhubung)
                                    </span>
                                  ) : isIdle ? (
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                                      <span className="size-1.5 rounded-full bg-amber-500" />
                                      Idle (&lt; 30 mnt)
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-muted-foreground">Offline</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-7 text-xs gap-1 shadow-sm font-semibold"
                                    onClick={() => {
                                      setSessionToTerminate(s);
                                      setOpenConfirmTerminate(true);
                                    }}
                                  >
                                    <LogOut className="size-3" />
                                    Force Logout
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* UNIVERSAL CONFIRMATION ALERT: FORCE LOGOUT SESI AKTIF */}
      <ConfirmActionDialog
        open={openConfirmTerminate}
        onOpenChange={(o) => {
          setOpenConfirmTerminate(o);
          if (!o) setSessionToTerminate(null);
        }}
        title="Paksa Logout Sesi Admin?"
        description={
          <>
            Apakah Anda yakin ingin memutuskan sesi aktif pengguna{" "}
            <strong>@{sessionToTerminate?.username}</strong> ({sessionToTerminate?.namaLengkap})?
            <br />
            <span className="text-destructive font-semibold">
              Pengguna akan langsung dikeluarkan dari sistem di perangkat yang terhubung.
            </span>
          </>
        }
        confirmText="Ya, Paksa Logout"
        variant="destructive"
        isLoading={terminateSessionMutation.isPending}
        details={[
          { label: "Nama Personel", value: sessionToTerminate?.namaLengkap || "-" },
          { label: "NRP / Username", value: `@${sessionToTerminate?.username || "-"}` },
          {
            label: "Role Sistem",
            value: sessionToTerminate ? backendRoleToFrontend(sessionToTerminate.role) : "-",
          },
          { label: "Satuan / Satminkal", value: sessionToTerminate?.satminkal || "-" },
          { label: "Kotama / Balakpus", value: sessionToTerminate?.kotamaNama || "-" },
        ]}
        onConfirm={() => {
          if (sessionToTerminate) {
            terminateSessionMutation.mutate(sessionToTerminate.id);
          }
        }}
      />
    </div>
  );
}
