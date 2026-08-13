import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ROLES, type Role } from "@/lib/casheva-data";

type SessionCtx = {
  role: Role;
  setRole: (r: Role) => void;
  loginRole: Role;
  canSwitchRole: boolean;
  login: (r: Role) => void;
  authenticated: boolean;
  setAuthenticated: (v: boolean) => void;
  ready: boolean;
  satminkal: string;
  kotama: string;
};

const Ctx = createContext<SessionCtx | null>(null);

function isRole(value: string | null): value is Role {
  return !!value && (ROLES as string[]).includes(value);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(ROLES[0] as Role);
  const [loginRole, setLoginRoleState] = useState<Role>(ROLES[0] as Role);
  const [authenticated, setAuthenticatedState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedRole = localStorage.getItem("casheva.role");
    const storedLoginRole = localStorage.getItem("casheva.loginRole");
    const storedAuth = localStorage.getItem("casheva.auth");
    if (isRole(storedRole)) setRoleState(storedRole);
    else if (storedRole) localStorage.removeItem("casheva.role");
    if (isRole(storedLoginRole)) setLoginRoleState(storedLoginRole);
    else if (isRole(storedRole)) setLoginRoleState(storedRole);
    if (storedAuth) setAuthenticatedState(storedAuth === "1");
    setReady(true);
  }, []);

  const setRole = (nextRole: Role) => {
    setRoleState(nextRole);
    localStorage.setItem("casheva.role", nextRole);
  };

  const login = (nextRole: Role) => {
    setRoleState(nextRole);
    setLoginRoleState(nextRole);
    localStorage.setItem("casheva.role", nextRole);
    localStorage.setItem("casheva.loginRole", nextRole);
  };

  const setAuthenticated = (ok: boolean) => {
    setAuthenticatedState(ok);
    localStorage.setItem("casheva.auth", ok ? "1" : "0");
  };

  const value = useMemo(
    () => ({
      role,
      setRole,
      loginRole,
      canSwitchRole: loginRole === "Admin Koperasi",
      login,
      authenticated,
      setAuthenticated,
      ready,
      satminkal: "Disinfolahtad",
      kotama: "Mabesad",
    }),
    [role, loginRole, authenticated, ready],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}


export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
