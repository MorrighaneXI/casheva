import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  PiggyBank,
  HandCoins,
  ShieldCheck,
  FileBarChart,
  Stamp,
  Shield,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSession } from "@/components/session-context";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Data Anggota", url: "/anggota", icon: Users },
  { title: "Transaksi Simpanan", url: "/simpanan", icon: PiggyBank },
  { title: "Pengajuan Pinjaman", url: "/pinjaman", icon: HandCoins },
  { title: "Verification Center", url: "/verifikasi", icon: ShieldCheck, badge: true },
  { title: "Laporan & SHU", url: "/laporan", icon: FileBarChart },
  { title: "Pengaturan Kopstuk", url: "/kopstuk", icon: Stamp },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { satminkal, kotama, role, profile, pendingFor } = useSession();
  const pending = pendingFor(role);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Shield className="size-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-base font-extrabold tracking-tight text-sidebar-accent-foreground">
                Casheva
              </p>
              <p className="truncate text-[11px] text-sidebar-foreground/70">
                Koperasi TNI AD
              </p>
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="mt-3 rounded-lg border border-sidebar-border bg-sidebar-accent/60 px-3 py-2">
            <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">
              Sesi Aktif
            </p>
            <p className="mt-0.5 truncate text-xs font-semibold text-sidebar-accent-foreground">
              Satminkal: {satminkal}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/80">
              Kotama: {kotama}
            </p>
            <p className="mt-1 truncate text-[11px] font-semibold text-sidebar-primary">
              Peran: {role}
            </p>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active =
                  item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="size-4 shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {"badge" in item && item.badge && !collapsed && pending > 0 ? (
                      <SidebarMenuBadge className="bg-gold text-gold-foreground">
                        {pending}
                      </SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed && (
          <p className="px-2 py-1 text-[10px] text-sidebar-foreground/60">
            Casheva v1.0 · Sistem Koperasi TNI AD
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
