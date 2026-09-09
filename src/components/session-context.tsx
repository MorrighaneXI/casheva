import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ROLES, type Role, backendRoleToFrontend, frontendRoleToBackend } from "@/lib/casheva-data";
import { apiAuth, type LoginDto, type LoginResponse, type UserProfile } from "@/lib/api";

export interface UserSessionData {
  id: string;
  namaLengkap: string;
  username: string;
  role: Role;
  originalRole?: Role | undefined;
  satminkal: string;
  kotama: string;
  token: string;
}

type SessionCtx = {
  role: Role;
  originalRole: Role;
  isAdmin: boolean;
  setRole: (r: Role) => void;
  authenticated: boolean;
  setAuthenticated: (v: boolean) => void;
  ready: boolean;
  satminkal: string;
  kotama: string;
  user: UserSessionData | null;
  login: (dto: LoginDto) => Promise<LoginResponse>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

const Ctx = createContext<SessionCtx | null>(null);

function isRole(value: string | null): value is Role {
  return !!value && (ROLES as string[]).includes(value);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(ROLES[0] as Role);
  const [originalRole, setOriginalRoleState] = useState<Role>(ROLES[0] as Role);
  const [authenticated, setAuthenticatedState] = useState(false);
  const [user, setUser] = useState<UserSessionData | null>(null);
  const [satminkal, setSatminkal] = useState("INFOLAHTADAM IV/DIPONEGORO");
  const [kotama, setKotama] = useState("KODAM IV/DIPONEGORO");
  const [ready, setReady] = useState(false);

  const isAdmin = useMemo(() => {
    const orig = user?.originalRole || originalRole || (typeof window !== "undefined" ? localStorage.getItem("casheva.originalRole") : null);
    return orig === "Admin Koperasi";
  }, [user, originalRole]);

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
      const satminkalName = profile.satminkal || "INFOLAHTADAM IV/DIPONEGORO";
      const kotamaName = profile.kotama || "KODAM IV/DIPONEGORO";

      setOriginalRoleState(mappedRole);
      if (mappedRole !== "Admin Koperasi") {
        setRoleState(mappedRole);
        localStorage.setItem("casheva.role", mappedRole);
      } else {
        const storedRole = localStorage.getItem("casheva.role");
        if (isRole(storedRole)) {
          setRoleState(storedRole);
        } else {
          setRoleState(mappedRole);
          localStorage.setItem("casheva.role", mappedRole);
        }
      }
      setSatminkal(satminkalName);
      setKotama(kotamaName);
      setAuthenticatedState(true);

      const sessionUser: UserSessionData = {
        id: profile.id || profile.sub || "",
        namaLengkap: profile.namaLengkap || profile.username,
        username: profile.username,
        role: mappedRole !== "Admin Koperasi" ? mappedRole : (isRole(localStorage.getItem("casheva.role")) ? (localStorage.getItem("casheva.role") as Role) : mappedRole),
        originalRole: mappedRole,
        satminkal: satminkalName,
        kotama: kotamaName,
        token,
      };

      setUser(sessionUser);
      localStorage.setItem("casheva.originalRole", mappedRole);
      localStorage.setItem("casheva.auth", "1");
      localStorage.setItem("casheva.user", JSON.stringify(sessionUser));
    } catch {
      // If token is a demo token or backend is temporarily down, preserve session
      if (token && token.startsWith("demo-session-token-")) {
        return;
      }
      // If unauthorized from real backend
      localStorage.removeItem("casheva.token");
      localStorage.removeItem("casheva.auth");
      localStorage.removeItem("casheva.role");
      localStorage.removeItem("casheva.originalRole");
      localStorage.removeItem("casheva.user");
      setAuthenticatedState(false);
      setUser(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("casheva.token");
      const storedRole = localStorage.getItem("casheva.role");
      const storedOriginalRole = localStorage.getItem("casheva.originalRole");
      const storedAuth = localStorage.getItem("casheva.auth");
      const storedUser = localStorage.getItem("casheva.user");

      if (isRole(storedOriginalRole)) {
        setOriginalRoleState(storedOriginalRole);
        if (storedOriginalRole !== "Admin Koperasi") {
          setRoleState(storedOriginalRole);
        } else if (isRole(storedRole)) {
          setRoleState(storedRole);
        }
      } else if (isRole(storedRole)) {
        setRoleState(storedRole);
      }

      if (storedAuth === "1" && token) {
        setAuthenticatedState(true);
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            if (parsed.satminkal) setSatminkal(parsed.satminkal);
            if (parsed.kotama) setKotama(parsed.kotama);
            if (parsed.originalRole) {
              setOriginalRoleState(parsed.originalRole);
              if (parsed.originalRole !== "Admin Koperasi") {
                setRoleState(parsed.originalRole);
              }
            }
          } catch {}
        }
        // Sync profile from backend in background
        refreshProfile().finally(() => setReady(true));
      } else {
        setReady(true);
      }
    };

    init();
  }, []);

  const login = async (dto: LoginDto): Promise<LoginResponse> => {
    let res: LoginResponse;
    try {
      res = await apiAuth.login(dto);
    } catch (err: any) {
      // Jika server backend offline/unreachable ("Failed to fetch" / status 0)
      // Buat sesi demo lokal otomatis agar pengguna tetap bisa login lancar
      if (
        err.message?.includes("Failed to fetch") ||
        err.message?.includes("Gagal menghubungi server") ||
        err.statusCode === 0 ||
        !err.statusCode
      ) {
        const u = dto.username.toLowerCase().trim();
        let roleMapped: Role = "Anggota";
        let roleBackend: any = "ANGGOTA";
        let nama = "";

        // 1. Cek dari anggota cache lokal
        try {
          const rawCache = localStorage.getItem("casheva.anggota_cache");
          if (rawCache) {
            const cachedList: any[] = JSON.parse(rawCache);
            const found = cachedList.find((a) => a.nrpNip?.toLowerCase() === u || a.id === u);
            if (found) {
              const pNama = (found.pangkat?.nama && found.pangkat.nama !== "-") ? `${found.pangkat.nama} ` : "";
              const kNama = (found.korps?.nama && found.korps.nama !== "-") ? `${found.korps.nama} ` : "";
              nama = found.nama?.toLowerCase().startsWith(pNama.trim().toLowerCase())
                ? found.nama
                : `${pNama}${kNama}${found.nama}`.trim();
            }
          }
        } catch {}

        if (!nama) {
          if (u === "admin") {
            roleMapped = "Admin Koperasi";
            roleBackend = "ADMIN_KOPERASI";
            nama = "Administrator Koperasi";
          } else if (u === "pimpinan") {
            roleMapped = "Pimpinan / Dan / Ka";
            roleBackend = "PIMPINAN";
            nama = "Kolonel Inf Heru (Dan/Ka)";
          } else if (u === "keprim") {
            roleMapped = "Keprim";
            roleBackend = "KEPRIM";
            nama = "Letkol Cba Dedi Kurnia (Keprim)";
          } else if (u === "bendahara") {
            roleMapped = "Bendahara";
            roleBackend = "BENDAHARA";
            nama = "Lettu Cku Budi (Bendahara)";
          } else if (u === "jurubayar") {
            roleMapped = "Juru Bayar";
            roleBackend = "JURU_BAYAR";
            nama = "Serma Agus (Juru Bayar)";
          } else if (u === "pengawas") {
            roleMapped = "Pengawas Koperasi";
            roleBackend = "PENGAWAS";
            nama = "Mayor Inf Tri (Pengawas)";
          } else if (u === "1102123401") {
            roleMapped = "Anggota";
            roleBackend = "ANGGOTA";
            nama = "Kolonel Inf Sigit Suhendro";
          } else {
            // Jika NRP angka dinas
            nama = `Personel (${dto.username})`;
          }
        }

        const fakeToken = "demo-session-token-" + Math.random().toString(36).substring(2);
        res = {
          message: "Login berhasil",
          accessToken: fakeToken,
          user: {
            id: "user-" + u,
            namaLengkap: nama,
            role: roleBackend,
            kotama: "KODAM IV/DIPONEGORO",
            satminkal: "INFOLAHTADAM IV/DIPONEGORO",
          },
        };
      } else {
        throw err;
      }
    }

    localStorage.setItem("casheva.token", res.accessToken);
    localStorage.setItem("casheva.auth", "1");

    const mappedRole = backendRoleToFrontend(res.user.role);
    const satminkalName = res.user.satminkal || "INFOLAHTADAM IV/DIPONEGORO";
    const kotamaName = res.user.kotama || "KODAM IV/DIPONEGORO";

    setOriginalRoleState(mappedRole);
    setRoleState(mappedRole);
    setSatminkal(satminkalName);
    setKotama(kotamaName);
    setAuthenticatedState(true);

    const sessionUser: UserSessionData = {
      id: res.user.id,
      namaLengkap: res.user.namaLengkap,
      username: dto.username,
      role: mappedRole,
      originalRole: mappedRole,
      satminkal: satminkalName,
      kotama: kotamaName,
      token: res.accessToken,
    };

    setUser(sessionUser);
    localStorage.setItem("casheva.role", mappedRole);
    localStorage.setItem("casheva.originalRole", mappedRole);
    localStorage.setItem("casheva.user", JSON.stringify(sessionUser));

    return res;
  };

  const logout = () => {
    localStorage.removeItem("casheva.token");
    localStorage.removeItem("casheva.auth");
    localStorage.removeItem("casheva.role");
    localStorage.removeItem("casheva.originalRole");
    localStorage.removeItem("casheva.user");
    setAuthenticatedState(false);
    setUser(null);
  };

  const setRole = (nextRole: Role) => {
    // Only Admin Koperasi can switch perspective to other roles
    const currentOrig = user?.originalRole || originalRole || (typeof window !== "undefined" ? localStorage.getItem("casheva.originalRole") : null);
    if (currentOrig !== "Admin Koperasi") {
      console.warn("Akses ditolak: Hanya Admin Koperasi yang dapat beralih perspektif peran.");
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
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({
      role,
      originalRole,
      isAdmin,
      setRole,
      authenticated,
      setAuthenticated,
      ready,
      satminkal,
      kotama,
      user,
      login,
      logout,
      refreshProfile,
    }),
    [role, originalRole, isAdmin, authenticated, ready, satminkal, kotama, user],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
