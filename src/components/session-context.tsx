import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { ROLES, SATMINKAL_ROLES, type Role, backendRoleToFrontend } from "@/lib/casheva-data";
import { apiAuth, apiKotama, type LoginDto, type LoginResponse, type UserProfile } from "@/lib/api";
import { useIdleSession } from "@/hooks/use-idle-session";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShieldAlert, LogOut } from "lucide-react";

export interface UserSessionData {
  id: string;
  namaLengkap: string;
  username: string;
  role: Role;
  originalRole?: Role | undefined;
  satminkal: string;
  satminkalId?: string | undefined;
  kotama: string;
  kotamaId?: string | undefined;
  token: string;
}

export interface MonitoringSatminkalData {
  id: string;
  kode: string;
  nama: string;
}

export interface MonitoringKotamaData {
  id: string;
  kode: string;
  nama: string;
}

type SessionCtx = {
  role: Role;
  originalRole: Role;
  isAdmin: boolean;
  isKotamaAdmin: boolean;
  isSuperAdmin: boolean;
  isGuestMode: boolean;
  monitoringSatminkal: MonitoringSatminkalData | null;
  monitoringKotama: MonitoringKotamaData | null;
  startMonitoring: (target: MonitoringSatminkalData) => Promise<void>;
  exitMonitoring: () => Promise<void>;
  startMonitoringKotama: (target: MonitoringKotamaData) => Promise<void>;
  exitMonitoringKotama: () => Promise<void>;
  setRole: (r: Role) => void;
  authenticated: boolean;
  setAuthenticated: (v: boolean) => void;
  ready: boolean;
  satminkal: string;
  satminkalId?: string | undefined;
  kotama: string;
  kotamaId?: string | undefined;
  user: UserSessionData | null;
  login: (dto: LoginDto) => Promise<LoginResponse>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

const Ctx = createContext<SessionCtx | null>(null);

function isRole(value: string | null): value is Role {
  return !!value && (ROLES as string[]).includes(value);
}

const DEFAULT_KOTAMA = "KODAM IV/DIPONEGORO";
const DEFAULT_SATMINKAL = "INFOLAHTADAM IV/DIPONEGORO";

function clearSatminkalCaches() {
  localStorage.removeItem("casheva_kopstuk_baris1");
  localStorage.removeItem("casheva_kopstuk_baris2");
  localStorage.removeItem("casheva_kopstuk_baris3");
  localStorage.removeItem("casheva_lokasi_kwitansi");
  localStorage.removeItem("casheva_jabatan_kwitansi");
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(ROLES[0] as Role);
  const [originalRole, setOriginalRoleState] = useState<Role>(ROLES[0] as Role);
  const [authenticated, setAuthenticatedState] = useState(false);
  const [user, setUser] = useState<UserSessionData | null>(null);
  const [satminkal, setSatminkal] = useState("INFOLAHTADAM IV/DIPONEGORO");
  const [satminkalId, setSatminkalId] = useState<string | undefined>();
  const [kotama, setKotama] = useState("KODAM IV/DIPONEGORO");
  const [kotamaId, setKotamaId] = useState<string | undefined>();
  const [ready, setReady] = useState(false);

  // Real-time Concurrent Session Conflict Detection
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictMessage, setConflictMessage] = useState("");

  useEffect(() => {
    const handleConflict = (e: Event) => {
      const customEvent = e as CustomEvent;
      const msg = customEvent.detail?.message || "Akun Anda sedang digunakan di perangkat lain.";
      setConflictMessage(msg);
      setConflictModalOpen(true);
      setAuthenticatedState(false);
      setUser(null);
    };

    window.addEventListener("casheva:concurrent-session-conflict", handleConflict);
    return () => {
      window.removeEventListener("casheva:concurrent-session-conflict", handleConflict);
    };
  }, []);

  // Heartbeat session check every 3.5 seconds
  useEffect(() => {
    if (!authenticated || !ready || conflictModalOpen) return;

    const interval = setInterval(async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("casheva.token") : null;
      if (!token) return;

      try {
        await apiAuth.checkSession();
      } catch {
        // If 401 occurs, client.ts automatically triggers the event and clears localStorage
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [authenticated, ready, conflictModalOpen]);

  // Monitoring (Mode Tamu)
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [monitoringSatminkal, setMonitoringSatminkal] = useState<MonitoringSatminkalData | null>(null);
  const [monitoringKotama, setMonitoringKotama] = useState<MonitoringKotamaData | null>(null);

  const isSuperAdmin = useMemo(() => {
    const orig = user?.originalRole || originalRole || (typeof window !== "undefined" ? localStorage.getItem("casheva.originalRole") : null);
    return orig === "Super Admin";
  }, [user, originalRole]);

  const isKotamaAdmin = useMemo(() => {
    const orig = user?.originalRole || originalRole || (typeof window !== "undefined" ? localStorage.getItem("casheva.originalRole") : null);
    return orig === "Admin Kotama";
  }, [user, originalRole]);

  const isAdmin = useMemo(() => {
    const orig = user?.originalRole || originalRole || (typeof window !== "undefined" ? localStorage.getItem("casheva.originalRole") : null);
    return orig === "Admin Koperasi";
  }, [user, originalRole]);

  const startMonitoring = useCallback(async (target: MonitoringSatminkalData) => {
    try {
      await apiKotama.startMonitoring(target.id);
    } catch (e) {
      console.warn("Failed to notify backend monitoring start:", e);
    }
    clearSatminkalCaches();
    setIsGuestMode(true);
    setMonitoringSatminkal(target);
    setSatminkal(target.nama);
    setSatminkalId(target.id);
    if (typeof window !== "undefined") {
      localStorage.setItem("casheva.guest_monitoring", JSON.stringify(target));
    }
  }, []);

  const exitMonitoring = useCallback(async () => {
    try {
      await apiKotama.endMonitoring();
    } catch (e) {
      console.warn("Failed to notify backend monitoring end:", e);
    }
    clearSatminkalCaches();
    setIsGuestMode(false);
    setMonitoringSatminkal(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("casheva.guest_monitoring");
    }
    // Restore Kotama / User's base Satminkal
    if (user) {
      setSatminkal(user.satminkal || "INFOLAHTADAM IV/DIPONEGORO");
      setSatminkalId(user.satminkalId);
    }
  }, [user]);

  // Super Admin -> Kotama Monitoring
  const startMonitoringKotama = useCallback(async (target: MonitoringKotamaData) => {
    try {
      await apiKotama.startKotamaMonitoring(target.id);
    } catch (e) {
      console.warn("Failed to notify backend kotama monitoring start:", e);
    }
    clearSatminkalCaches();
    setIsGuestMode(true);
    setMonitoringKotama(target);
    setMonitoringSatminkal(null);
    setKotama(target.nama);
    setKotamaId(target.id);
    setSatminkal(target.nama);
    setSatminkalId(undefined);
    setRoleState("Admin Kotama");
    if (typeof window !== "undefined") {
      localStorage.setItem("casheva.guest_monitoring_kotama", JSON.stringify(target));
      localStorage.setItem("casheva.role", "Admin Kotama");
    }
  }, []);

  const exitMonitoringKotama = useCallback(async () => {
    try {
      if (monitoringKotama?.id) {
        await apiKotama.endKotamaMonitoring(monitoringKotama.id);
      } else {
        await apiKotama.endKotamaMonitoring();
      }
    } catch (e) {
      console.warn("Failed to notify backend kotama monitoring end:", e);
    }
    clearSatminkalCaches();
    setIsGuestMode(false);
    setMonitoringKotama(null);
    setRoleState("Super Admin");
    setKotama("MABES TNI AD / PUSAT");
    setKotamaId(undefined);
    setSatminkal("MABES TNI AD / PUSAT");
    setSatminkalId(undefined);
    if (typeof window !== "undefined") {
      localStorage.removeItem("casheva.guest_monitoring_kotama");
      localStorage.setItem("casheva.role", "Super Admin");
    }
    if (user) {
      setKotama(user.kotama || "MABES TNI AD / PUSAT");
      setKotamaId(user.kotamaId);
      setSatminkal(user.satminkal || "MABES TNI AD / PUSAT");
      setSatminkalId(user.satminkalId);
    }
  }, [monitoringKotama, user]);


  const refreshProfile = async () => {
    const token = localStorage.getItem("casheva.token");
    if (!token) {
      setAuthenticatedState(false);
      setUser(null);
      return;
    }

    try {
      const profile: UserProfile = await apiAuth.getProfile();
      const mappedRole = backendRoleToFrontend(profile.role);
      const isKotama = mappedRole === "Admin Kotama";
      const kotamaName = profile.kotama || (isKotama ? "PUSKOMLEKAD" : "KODAM IV/DIPONEGORO");
      const defaultSatminkal = isKotama ? kotamaName : "INFOLAHTADAM IV/DIPONEGORO";
      const satminkalName = profile.satminkal || defaultSatminkal;
      const satId = profile.satminkalId || undefined;
      const kotId = profile.kotamaId || undefined;

      setOriginalRoleState(mappedRole);
      if (mappedRole !== "Admin Koperasi") {
        setRoleState(mappedRole);
        localStorage.setItem("casheva.role", mappedRole);
      } else {
        const storedRole = localStorage.getItem("casheva.role");
        if (isRole(storedRole) && SATMINKAL_ROLES.includes(storedRole as Role)) {
          setRoleState(storedRole as Role);
        } else {
          setRoleState(mappedRole);
          localStorage.setItem("casheva.role", mappedRole);
        }
      }

      // Restore monitoring mode if previously saved
      const savedMonitoring = typeof window !== "undefined" ? localStorage.getItem("casheva.guest_monitoring") : null;
      const savedKotamaMonitoring = typeof window !== "undefined" ? localStorage.getItem("casheva.guest_monitoring_kotama") : null;

      if (mappedRole === "Super Admin" && savedKotamaMonitoring) {
        try {
          const kmon = JSON.parse(savedKotamaMonitoring) as MonitoringKotamaData;
          setIsGuestMode(true);
          setMonitoringKotama(kmon);
          setMonitoringSatminkal(null);
          setKotama(kmon.nama);
          setKotamaId(kmon.id);
          setSatminkal(kmon.nama);
          setSatminkalId(undefined);
          setRoleState("Admin Kotama");
        } catch {
          setKotama(kotamaName);
          setKotamaId(kotId);
          setSatminkal(satminkalName);
          setSatminkalId(satId);
        }
      } else if (mappedRole === "Admin Kotama" && savedMonitoring) {
        try {
          const mon = JSON.parse(savedMonitoring) as MonitoringSatminkalData;
          setIsGuestMode(true);
          setMonitoringSatminkal(mon);
          setMonitoringKotama(null);
          setSatminkal(mon.nama);
          setSatminkalId(mon.id);
          setKotama(kotamaName);
          setKotamaId(kotId);
        } catch {
          setSatminkal(satminkalName);
          setSatminkalId(satId);
          setKotama(kotamaName);
          setKotamaId(kotId);
        }
      } else {
        setSatminkal(satminkalName);
        setSatminkalId(satId);
        setKotama(kotamaName);
        setKotamaId(kotId);
      }

      setAuthenticatedState(true);

      const sessionUser: UserSessionData = {
        id: profile.id || profile.sub || "",
        namaLengkap: profile.namaLengkap || profile.username,
        username: profile.username,
        role: mappedRole !== "Admin Koperasi" ? mappedRole : (isRole(localStorage.getItem("casheva.role")) ? (localStorage.getItem("casheva.role") as Role) : mappedRole),
        originalRole: mappedRole,
        satminkal: satminkalName,
        satminkalId: satId,
        kotama: kotamaName,
        kotamaId: kotId,
        token,
      };

      setUser(sessionUser);
      localStorage.setItem("casheva.originalRole", mappedRole);
      localStorage.setItem("casheva.auth", "1");
      localStorage.setItem("casheva.user", JSON.stringify(sessionUser));
    } catch {
      // Token tidak valid atau backend menolak — hapus sesi dan reset state
      localStorage.removeItem("casheva.token");
      localStorage.removeItem("casheva.auth");
      localStorage.removeItem("casheva.role");
      localStorage.removeItem("casheva.originalRole");
      localStorage.removeItem("casheva.user");
      localStorage.removeItem("casheva.guest_monitoring");
      localStorage.removeItem("casheva.guest_monitoring_kotama");
      clearSatminkalCaches();
      setAuthenticatedState(false);
      setUser(null);
    }
  };

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("casheva.user") : null;
    const isAuth = typeof window !== "undefined" ? localStorage.getItem("casheva.auth") === "1" : false;
    const token = typeof window !== "undefined" ? localStorage.getItem("casheva.token") : null;

    if (raw && isAuth && token) {
      try {
        const parsed = JSON.parse(raw) as UserSessionData;
        const isKotama = parsed.originalRole === "Admin Kotama" || parsed.role === "Admin Kotama";
        const kotamaVal = parsed.kotama || (isKotama ? "PUSKOMLEKAD" : "KODAM IV/DIPONEGORO");
        const satminkalVal = isKotama ? (parsed.satminkal || kotamaVal) : (parsed.satminkal || "INFOLAHTADAM IV/DIPONEGORO");
        setUser(parsed);
        setSatminkal(satminkalVal);
        setSatminkalId(parsed.satminkalId);
        setKotama(kotamaVal);
        setKotamaId(parsed.kotamaId);
        setAuthenticatedState(true);

        const effectiveOrig = isRole(storedOrig) ? (storedOrig as Role) : parsed.originalRole;

        if (isRole(storedRole)) {
          if (effectiveOrig === "Admin Koperasi" && !SATMINKAL_ROLES.includes(storedRole as Role)) {
            setRoleState("Admin Koperasi");
            localStorage.setItem("casheva.role", "Admin Koperasi");
          } else {
            setRoleState(storedRole);
          }
        } else if (parsed.role) {
          if (effectiveOrig === "Admin Koperasi" && !SATMINKAL_ROLES.includes(parsed.role)) {
            setRoleState("Admin Koperasi");
            localStorage.setItem("casheva.role", "Admin Koperasi");
          } else {
            setRoleState(parsed.role);
          }
        }

        if (isRole(storedOrig)) {
          setOriginalRoleState(storedOrig);
        } else if (parsed.originalRole) {
          setOriginalRoleState(parsed.originalRole);
        }

        const savedKotamaMonitoring = localStorage.getItem("casheva.guest_monitoring_kotama");
        const savedMonitoring = localStorage.getItem("casheva.guest_monitoring");

        if (savedKotamaMonitoring) {
          try {
            const kmon = JSON.parse(savedKotamaMonitoring) as MonitoringKotamaData;
            setIsGuestMode(true);
            setMonitoringKotama(kmon);
            setMonitoringSatminkal(null);
            setKotama(kmon.nama);
            setKotamaId(kmon.id);
            setSatminkal(kmon.nama);
            setSatminkalId(undefined);
            setRoleState("Admin Kotama");
          } catch {
            // ignore
          }
        } else if (savedMonitoring) {
          try {
            const mon = JSON.parse(savedMonitoring) as MonitoringSatminkalData;
            setIsGuestMode(true);
            setMonitoringSatminkal(mon);
            setMonitoringKotama(null);
            setSatminkal(mon.nama);
            setSatminkalId(mon.id);
          } catch {
            // ignore
          }
        }
      } catch {
        localStorage.removeItem("casheva.user");
      }
    }

    if (token) {
      refreshProfile().finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  const login = async (dto: LoginDto) => {
    clearSatminkalCaches();
    localStorage.removeItem("casheva.guest_monitoring");
    localStorage.removeItem("casheva.guest_monitoring_kotama");
    setIsGuestMode(false);
    setMonitoringSatminkal(null);
    setMonitoringKotama(null);

    // Login ke backend asli — jika gagal, error dilempar langsung ke pemanggil
    const res = await apiAuth.login(dto);

    localStorage.setItem("casheva.token", res.accessToken);
    localStorage.setItem("casheva.auth", "1");

    const mappedRole = backendRoleToFrontend(res.user.role);
    const isKotama = mappedRole === "Admin Kotama";
    const kotamaName = res.user.kotama || (isKotama ? "PUSKOMLEKAD" : "KODAM IV/DIPONEGORO");
    const defaultSatminkal = isKotama ? kotamaName : "INFOLAHTADAM IV/DIPONEGORO";
    const satminkalName = res.user.satminkal || defaultSatminkal;
    const satId = (res.user as any).satminkalId || undefined;
    const kotId = (res.user as any).kotamaId || undefined;

    setOriginalRoleState(mappedRole);
    setRoleState(mappedRole);
    setSatminkal(satminkalName);
    setSatminkalId(satId);
    setKotama(kotamaName);
    setKotamaId(kotId);
    setAuthenticatedState(true);

    const sessionUser: UserSessionData = {
      id: res.user.id,
      namaLengkap: res.user.namaLengkap,
      username: dto.username,
      role: mappedRole,
      originalRole: mappedRole,
      satminkal: satminkalName,
      satminkalId: satId,
      kotama: kotamaName,
      kotamaId: kotId,
      token: res.accessToken,
    };

    setUser(sessionUser);
    localStorage.setItem("casheva.role", mappedRole);
    localStorage.setItem("casheva.originalRole", mappedRole);
    localStorage.setItem("casheva.user", JSON.stringify(sessionUser));

    return res;
  };

  const logout = useCallback(() => {
    apiAuth.logout().catch(() => {});
    localStorage.removeItem("casheva.token");
    localStorage.removeItem("casheva.auth");
    localStorage.removeItem("casheva.role");
    localStorage.removeItem("casheva.originalRole");
    localStorage.removeItem("casheva.user");
    localStorage.removeItem("casheva.guest_monitoring");
    localStorage.removeItem("casheva.guest_monitoring_kotama");
    clearSatminkalCaches();
    setIsGuestMode(false);
    setMonitoringSatminkal(null);
    setMonitoringKotama(null);
    setAuthenticatedState(false);
    setUser(null);
  }, []);

  // Manajemen Sesi Keamanan: Auto logout setelah 15 menit idle
  useIdleSession({
    onTimeout: logout,
    enabled: authenticated,
    timeoutMs: 15 * 60 * 1000, // 15 menit
    warningMs: 14 * 60 * 1000, // Peringatan di menit ke-14
  });

  const setRole = (nextRole: Role) => {
    // Only Admin Koperasi can switch perspective to other roles
    const currentOrig = user?.originalRole || originalRole || (typeof window !== "undefined" ? localStorage.getItem("casheva.originalRole") : null);
    if (currentOrig !== "Admin Koperasi") {
      console.warn("Akses ditolak: Hanya Admin Koperasi yang dapat beralih perspektif peran.");
      return;
    }
    // Satminkal admin can only switch to Satminkal level roles (up to Admin Koperasi)
    if (!SATMINKAL_ROLES.includes(nextRole)) {
      console.warn(`Akses ditolak: Admin Satminkal hanya dapat beralih ke peran tingkat Satminkal / Koperasi (maksimal Admin Koperasi).`);
      return;
    }
    setRoleState(nextRole);
    localStorage.setItem("casheva.role", nextRole);
    if (user) {
      const updatedUser = { ...user, role: nextRole };
      setUser(updatedUser);
      localStorage.setItem("casheva.user", JSON.stringify(updatedUser));
    }
  };

  const setAuthenticated = (ok: boolean) => {
    setAuthenticatedState(ok);
    localStorage.setItem("casheva.auth", ok ? "1" : "0");
    if (!ok) {
      localStorage.removeItem("casheva.token");
      localStorage.removeItem("casheva.role");
      localStorage.removeItem("casheva.originalRole");
      localStorage.removeItem("casheva.user");
      localStorage.removeItem("casheva.guest_monitoring");
      localStorage.removeItem("casheva.guest_monitoring_kotama");
      setIsGuestMode(false);
      setMonitoringSatminkal(null);
      setMonitoringKotama(null);
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({
      role,
      originalRole,
      isAdmin,
      isKotamaAdmin,
      isSuperAdmin,
      isGuestMode,
      monitoringSatminkal,
      monitoringKotama,
      startMonitoring,
      exitMonitoring,
      startMonitoringKotama,
      exitMonitoringKotama,
      setRole,
      authenticated,
      setAuthenticated,
      ready,
      satminkal,
      satminkalId,
      kotama,
      kotamaId,
      user,
      login,
      logout,
      refreshProfile,
    }),
    [
      role,
      originalRole,
      isAdmin,
      isKotamaAdmin,
      isSuperAdmin,
      isGuestMode,
      monitoringSatminkal,
      monitoringKotama,
      startMonitoring,
      exitMonitoring,
      startMonitoringKotama,
      exitMonitoringKotama,
      authenticated,
      ready,
      satminkal,
      satminkalId,
      kotama,
      kotamaId,
      user,
      logout,
    ],
  );

  return (
    <Ctx.Provider value={value}>
      {children}

      {/* Concurrent Session Security Alert Modal */}
      <AlertDialog
        open={conflictModalOpen}
        onOpenChange={(o) => {
          if (!o) {
            setConflictModalOpen(false);
            window.location.href = "/login";
          }
        }}
      >
        <AlertDialogContent
          className="max-w-md border-rose-500/30 bg-card/95 backdrop-blur-md shadow-2xl p-6"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <AlertDialogHeader className="text-center sm:text-center items-center">
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-500/30 shadow-inner">
              <ShieldAlert className="size-8 animate-pulse" />
            </div>
            <AlertDialogTitle className="text-lg font-bold text-foreground">
              Sesi Berakhir: Akun Digunakan di Perangkat Lain
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground text-center leading-relaxed mt-2">
              Akun Anda baru saja login melalui perangkat atau browser lain. Sesuai standar keamanan sistem informasi TNI AD, satu akun hanya diizinkan aktif pada <strong>1 perangkat dalam satu waktu</strong>. Sesi pada perangkat ini telah dihentikan secara otomatis demi keamanan data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 sm:justify-center">
            <AlertDialogAction
              onClick={() => {
                setConflictModalOpen(false);
                window.location.href = "/login";
              }}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-md gap-2"
            >
              <LogOut className="size-4" />
              Kembali ke Halaman Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Ctx.Provider>
  );
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
