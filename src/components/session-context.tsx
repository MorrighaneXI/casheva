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
  const [satminkal, setSatminkal] = useState("Mabes TNI AD");
  const [kotama, setKotama] = useState("Mabes TNI AD");
  const [ready, setReady] = useState(false);

  const isAdmin = useMemo(() => {
    const orig = user?.originalRole || originalRole || (typeof window !== "undefined" ? localStorage.getItem("casheva.originalRole") : null);
    return orig === "Admin Koperasi" || user?.role === "Admin Koperasi" || role === "Admin Koperasi";
  }, [user, originalRole, role]);

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
      const satminkalName = profile.satminkal || "Mabes TNI AD";
      const kotamaName = profile.kotama || "Mabes TNI AD";

      setOriginalRoleState(mappedRole);
      setRoleState(mappedRole);
      setSatminkal(satminkalName);
      setKotama(kotamaName);
      setAuthenticatedState(true);

      const sessionUser: UserSessionData = {
        id: profile.id || profile.sub || "",
        namaLengkap: profile.namaLengkap || profile.username,
        username: profile.username,
        role: mappedRole,
        originalRole: mappedRole,
        satminkal: satminkalName,
        kotama: kotamaName,
        token,
      };

      setUser(sessionUser);
      localStorage.setItem("casheva.role", mappedRole);
      localStorage.setItem("casheva.originalRole", mappedRole);
      localStorage.setItem("casheva.auth", "1");
      localStorage.setItem("casheva.user", JSON.stringify(sessionUser));
    } catch {
      // Token invalid / expired
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

      if (isRole(storedOriginalRole)) setOriginalRoleState(storedOriginalRole);
      if (isRole(storedRole)) setRoleState(storedRole);
      if (storedAuth === "1" && token) {
        setAuthenticatedState(true);
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            if (parsed.satminkal) setSatminkal(parsed.satminkal);
            if (parsed.kotama) setKotama(parsed.kotama);
            if (parsed.originalRole) setOriginalRoleState(parsed.originalRole);
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
    const res = await apiAuth.login(dto);
    localStorage.setItem("casheva.token", res.accessToken);
    localStorage.setItem("casheva.auth", "1");

    const mappedRole = backendRoleToFrontend(res.user.role);
    const satminkalName = res.user.satminkal || "Mabes TNI AD";
    const kotamaName = res.user.kotama || "Mabes TNI AD";

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
