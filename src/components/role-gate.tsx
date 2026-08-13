import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { notify as toast } from "@/lib/notify";

import { useSession } from "@/components/session-context";
import { canAccessPath, homePathFor } from "@/lib/rbac";

/** Client-side RBAC gate — waits for session hydrate to avoid login flash. */
export function RoleGate({ children }: { children: React.ReactNode }) {
  const { role, authenticated, ready } = useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (pathname === "/login") {
      if (authenticated) navigate({ to: homePathFor(role) });
      return;
    }
    if (!authenticated) {
      navigate({ to: "/login" });
      return;
    }
    if (!canAccessPath(role, pathname)) {
      toast.error("Akses ditolak untuk peran Anda", {
        description: `${role} tidak memiliki akses ke halaman ini.`,
      });
      navigate({ to: homePathFor(role) });
    }
  }, [ready, authenticated, role, pathname, navigate]);

  if (!ready) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-sm text-muted-foreground">
        Memuat sesi…
      </div>
    );
  }

  if (pathname !== "/login" && !authenticated) return null;
  if (pathname !== "/login" && !canAccessPath(role, pathname)) return null;

  return <>{children}</>;
}
