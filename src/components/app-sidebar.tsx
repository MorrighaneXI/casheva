import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

// import cashevaLogo from "../assets/casheva-emblem.png";
import cashevaLogo from "../assets/primkop-kartika.png";

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
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useSession } from "@/components/session-context";
import { roleNavGrouped } from "@/lib/role-nav";
import { useLiveNotifications } from "@/lib/notifications";

export function AppSidebar() {
    const { state } = useSidebar();
    const collapsed = state === "collapsed";
    const pathname = useRouterState({ select: (r) => r.location.pathname });
    const { satminkal, kotama, role, isKotamaAdmin, isSuperAdmin, isGuestMode, monitoringKotama } = useSession();
    const groups = roleNavGrouped[role] || [];
    const { getBadgeForUrl } = useLiveNotifications(role);

    // Keep track of which groups are open
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

    useEffect(() => {
        // Auto-open group that contains active link or default open
        const initial: Record<string, boolean> = {};
        groups.forEach((g) => {
            const hasActive = g.items.some((item) =>
                item.url === "/" ? pathname === "/" : pathname.startsWith(item.url)
            );
            initial[g.groupTitle] = hasActive || true;
        });
        setOpenGroups((prev) => ({ ...initial, ...prev }));
    }, [pathname, role, groups]);

    const toggleGroup = (title: string) => {
        setOpenGroups((prev) => ({
            ...prev,
            [title]: !prev[title],
        }));
    };

    return (
        <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar select-none">
            <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
                <div className="flex items-center gap-2.5">
                    <img
                        src={cashevaLogo}
                        alt="SISKOPAD"
                        className="size-8 object-contain shrink-0 drop-shadow-sm"
                    />
                    {!collapsed && (
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-extrabold tracking-tight text-white leading-none">
                                SISKOPAD
                            </span>
                            <span className="text-[10px] font-medium text-sidebar-foreground/70 leading-tight">
                                Sistem Koperasi TNI Angkatan Darat
                            </span>
                        </div>
                    )}
                </div>
                {!collapsed && (
                    <div className="mt-3 rounded-lg border border-sidebar-border bg-sidebar-accent/60 px-3 py-2 text-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60 font-semibold">
                                Sesi Aktif
                            </span>
                            <span className="inline-flex size-2 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                        {isSuperAdmin && !isGuestMode ? (
                            <>
                                <p className="mt-1 truncate font-semibold text-sidebar-accent-foreground">
                                    MABESAD / PUSAT
                                </p>
                                <p className="truncate text-[11px] text-sidebar-foreground/75">
                                    Super Administrator TNI AD
                                </p>
                            </>
                        ) : isSuperAdmin && isGuestMode && monitoringKotama ? (
                            <>
                                <p className="mt-1 truncate font-semibold text-sidebar-accent-foreground" title={monitoringKotama.nama}>
                                    {monitoringKotama.nama}
                                </p>
                                <p className="truncate text-[11px] text-rose-400 font-medium">
                                    Mode Monitoring Kotama
                                </p>
                            </>
                        ) : isKotamaAdmin && !isGuestMode ? (
                            <>
                                <p className="mt-1 truncate font-semibold text-sidebar-accent-foreground" title={kotama}>
                                    {kotama}
                                </p>
                                <p className="truncate text-[11px] text-sidebar-foreground/75">
                                    Komando Utama / Balakpus
                                </p>
                            </>
                        ) : isKotamaAdmin && isGuestMode ? (
                            <>
                                <p className="mt-1 truncate font-semibold text-sidebar-accent-foreground" title={satminkal}>
                                    {satminkal}
                                </p>
                                <p className="truncate text-[11px] text-sidebar-foreground/75" title={kotama}>
                                    Mode Monitoring · {kotama}
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="mt-1 truncate font-semibold text-sidebar-accent-foreground" title={satminkal}>
                                    {satminkal}
                                </p>
                                <p className="truncate text-[11px] text-sidebar-foreground/75" title={kotama}>
                                    {kotama}
                                </p>
                            </>
                        )}
                        <div className="mt-1.5 inline-flex items-center rounded-md bg-sidebar-accent px-2 py-0.5 text-[10px] font-bold text-sidebar-primary border border-sidebar-border/80">
                            {isGuestMode ? `${role} (Monitoring)` : role}
                        </div>
                    </div>
                )}
            </SidebarHeader>

            <SidebarContent className="px-1 py-2 space-y-1">
                {groups.map((grp) => {
                    const isGroupOpen = openGroups[grp.groupTitle] ?? true;
                    const hasActiveChild = grp.items.some((item) =>
                        item.url === "/" ? pathname === "/" : pathname.startsWith(item.url)
                    );

                    if (collapsed) {
                        return (
                            <SidebarGroup key={grp.groupTitle} className="p-0">
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        {grp.items.map((item) => {
                                            const active =
                                                item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
                                            return (
                                                <SidebarMenuItem key={item.title}>
                                                    <SidebarMenuButton
                                                        asChild
                                                        isActive={active}
                                                        tooltip={item.title}
                                                        className={`transition-all duration-150 rounded-lg ${active
                                                            ? "bg-sidebar-accent text-sidebar-primary font-semibold shadow-sm"
                                                            : "hover:bg-sidebar-accent/50 text-sidebar-foreground/90"
                                                            }`}
                                                    >
                                                        <Link to={item.url} className="flex items-center justify-center">
                                                            <item.icon
                                                                className={`size-4 shrink-0 transition-transform ${active ? "text-sidebar-primary scale-110" : "text-sidebar-foreground/70"
                                                                    }`}
                                                            />
                                                        </Link>
                                                    </SidebarMenuButton>
                                                </SidebarMenuItem>
                                            );
                                        })}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        );
                    }

                    return (
                        <Collapsible
                            key={grp.groupTitle}
                            open={isGroupOpen}
                            onOpenChange={() => toggleGroup(grp.groupTitle)}
                            className="group/collapsible"
                        >
                            <SidebarGroup className="py-1 px-1">
                                <div className="flex items-center justify-between px-2 py-1">
                                    <SidebarGroupLabel
                                        asChild
                                        className="text-[11px] uppercase tracking-wider text-sidebar-foreground/65 font-bold cursor-pointer select-none hover:text-sidebar-foreground transition-colors p-0 h-auto"
                                    >
                                        <CollapsibleTrigger className="flex w-full items-center justify-between">
                                            <span className={hasActiveChild ? "text-sidebar-primary font-extrabold" : ""}>
                                                {grp.groupTitle}
                                            </span>
                                            <ChevronDown
                                                className={`size-3.5 text-sidebar-foreground/50 transition-transform duration-200 ${isGroupOpen ? "rotate-0" : "-rotate-90"
                                                    }`}
                                            />
                                        </CollapsibleTrigger>
                                    </SidebarGroupLabel>
                                </div>

                                <CollapsibleContent className="transition-all duration-200 data-[state=closed]:animate-collapse data-[state=open]:animate-expand">
                                    <SidebarGroupContent className="pt-1">
                                        <SidebarMenu className="space-y-0.5">
                                            {grp.items.map((item) => {
                                                const active =
                                                    item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
                                                const liveBadge = getBadgeForUrl(item.url);
                                                return (
                                                    <SidebarMenuItem key={item.title}>
                                                        <SidebarMenuButton
                                                            asChild
                                                            isActive={active}
                                                            tooltip={item.title}
                                                            className={`transition-all duration-150 rounded-lg text-xs py-1.5 h-8.5 ${active
                                                                ? "bg-sidebar-accent text-sidebar-primary font-semibold shadow-sm border-l-2 border-primary"
                                                                : "hover:bg-sidebar-accent/50 text-sidebar-foreground/85"
                                                                }`}
                                                        >
                                                            <Link to={item.url} className="flex items-center gap-2.5 pl-2">
                                                                <item.icon
                                                                    className={`size-3.5 shrink-0 transition-transform ${active ? "text-sidebar-primary scale-110" : "text-sidebar-foreground/70"
                                                                        }`}
                                                                />
                                                                <span className="truncate">{item.title}</span>
                                                            </Link>
                                                        </SidebarMenuButton>
                                                        {liveBadge && !collapsed ? (
                                                            <SidebarMenuBadge className="bg-gold text-gold-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-in fade-in zoom-in-75 duration-200">
                                                                {liveBadge}
                                                            </SidebarMenuBadge>
                                                        ) : null}
                                                    </SidebarMenuItem>
                                                );
                                            })}
                                        </SidebarMenu>
                                    </SidebarGroupContent>
                                </CollapsibleContent>
                            </SidebarGroup>
                        </Collapsible>
                    );
                })}
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border p-2.5">
                {!collapsed ? (
                    <div className="flex items-center justify-between text-[10px] text-sidebar-foreground/60 px-1">
                        <span>Casheva 6w3d</span>
                    </div>
                ) : (
                    <div className="flex justify-center">
                        <span className="size-2 rounded-full bg-emerald-400" />
                    </div>
                )}
            </SidebarFooter>
        </Sidebar>
    );
}
