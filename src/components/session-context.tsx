import { createContext, useContext, useState, type ReactNode } from "react";
import { ROLES, type Role } from "@/lib/casheva-data";

type SessionCtx = {
  role: Role;
  setRole: (r: Role) => void;
  satminkal: string;
  kotama: string;
};

const Ctx = createContext<SessionCtx | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(ROLES[0] as Role);
  return (
    <Ctx.Provider
      value={{ role, setRole, satminkal: "Disinfolahtad", kotama: "Mabesad" }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
