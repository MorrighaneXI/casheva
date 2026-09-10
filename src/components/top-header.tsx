import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Search,
  Moon,
  Sun,
  UserRound,
  LogOut,
  Settings,
  Radio,
  Shield,
  Eye,
  Building2,
  BadgeCheck,
  UserCheck,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/components/session-context";
import { ROLES, type Role, formatNamaLengkapDinas } from "@/lib/casheva-data";
import { apiAnggota } from "@/lib/api";
import { useLiveNotifications } from "@/lib/notifications";

export function TopHeader() {
  const navigate = useNavigate();
  const { role, setRole, user, isAdmin, originalRole, satminkal, kotama, logout: sessionLogout } = useSession();
  const { notifications, unreadCount } = useLiveNotifications(role);
  const [dark, setDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Lookup member data to display official military name (e.g. Kapten Cpm Indra, S.Kom.)
  const { data: anggotaList = [] } = useQuery({
    queryKey: ["anggota-list-active"],
    queryFn: () => apiAnggota.findAll(true),
    staleTime: 1000 * 60 * 5,
  });

  const currentMember = useMemo(() => {
    if (!user) return null;
    return anggotaList.find((a) => a.nrpNip === user.username || a.id === user.id);
  }, [anggotaList, user]);

  const displayFullName = useMemo(() => {
    if (currentMember) {
      return formatNamaLengkapDinas(
        currentMember.nama,
        currentMember.pangkat?.nama,
        currentMember.korps?.nama,
        currentMember.pangkat?.kategori
      );
    }
    if (user?.namaLengkap && !user.namaLengkap.startsWith("Personel (")) {
      return user.namaLengkap;
    }
    return user?.namaLengkap || "Anggota Koperasi";
  }, [currentMember, user]);

  // Live Digital Military Clock
  const [timeString, setTimeString] = useState("");
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const time = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setTimeString(`${time} WIB`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const logout = () => {
    sessionLogout();
    toast.success("Sesi berhasil diakhiri");
    navigate({ to: "/login" });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase().trim();
    if (q.includes("anggota") || q.includes("nrp")) {
      navigate({ to: "/anggota" });
    } else if (q.includes("simpan") || q.includes("tabung")) {
      navigate({ to: "/simpanan" });
    } else if (q.includes("pinjam") || q.includes("kredit") || q.includes("usipa")) {
      navigate({ to: "/pengajuan" });
    } else if (q.includes("cair") || q.includes("invoice") || q.includes("kwitansi")) {
      navigate({ to: "/pencairan" });
    } else if (q.includes("rekomendasi")) {
      navigate({ to: "/rekomendasi" });
    } else if (q.includes("verifikasi")) {
      navigate({ to: "/verifikasi" });
    } else if (q.includes("acc") || q.includes("otorisasi")) {
      navigate({ to: "/acc" });
    } else if (q.includes("shu")) {
      navigate({ to: "/shu" });
    } else if (q.includes("lapor") || q.includes("neraca") || q.includes("keuangan")) {
      navigate({ to: "/laporan" });
    } else if (q.includes("kopstuk") || q.includes("ttd") || q.includes("cap")) {
      navigate({ to: "/kopstuk" });
    } else if (q.includes("transaksi") || q.includes("rekap") || q.includes("mutasi")) {
      navigate({ to: "/transaksi" });
    } else if (q.includes("user") || q.includes("pengguna")) {
      navigate({ to: "/users" });
    } else {
      navigate({ to: "/anggota" });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background/95 backdrop-blur px-3 sm:px-6">
        {/* Left Side */}
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
          <Separator orientation="vertical" className="mr-2 h-4 hidden sm:block" />

          {/* Quick Search */}
          <form onSubmit={handleSearch} className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari anggota, NRP, simpanan, ajuan..."
              className="h-9 w-64 lg:w-80 pl-9 text-xs rounded-lg bg-muted/50 border-border/70 focus:bg-background transition-all"
            />
          </form>

          {/* Live Military Clock */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono font-bold text-primary">
            <Radio className="size-3 text-primary animate-pulse" />
            <span>{timeString}</span>
          </div>
        </div>

        {/* Center Tenant Switcher Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-lg border border-border/80 bg-muted/40 text-[11px] font-medium text-muted-foreground">
          <span className="font-semibold text-foreground">{satminkal}</span>
          <span>/</span>
          <span>{kotama}</span>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-2">
          {/* Role Perspective Switcher (Admin Koperasi ONLY) */}
          {isAdmin ? (
            <div className="flex items-center gap-1.5">
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger className="h-8 w-28 sm:w-44 text-xs font-medium bg-muted/50 border-border">
                  <Eye className="size-3 text-primary mr-1 shrink-0" />
                  <span className="text-muted-foreground text-[10px] mr-1 hidden sm:inline">Perspektif:</span>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end" className="text-xs">
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r} className="text-xs">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            /* Static Role Badge for Non-Admin (Pimpinan, Kaprim, Bendahara, Juru Bayar, Anggota, Pengawas) */
            <div className="flex h-8 items-center rounded-lg border border-border bg-muted/60 px-2.5 text-xs font-semibold">
              <Shield className="size-3.5 text-primary mr-1 shrink-0" />
              <span className="truncate max-w-[80px] sm:max-w-none">{role}</span>
            </div>
          )}

          {/* Real-time Notification Popover */}
          <Popover open={notifOpen} onOpenChange={setNotifOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative size-9 transition-transform active:scale-95"
              >
                <Bell className="size-4" />
                {unreadCount > 0 ? (
                  <>
                    <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive animate-ping" />
                    <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive" />
                  </>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-84 sm:w-96 p-0" align="end">
              <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/40">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold">Notifikasi Real-time</p>
                  <span className="inline-flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <Badge variant={unreadCount > 0 ? "destructive" : "secondary"} className="text-[10px]">
                  {unreadCount > 0 ? `${unreadCount} Perlu Tindakan` : "Terkini"}
                </Badge>
              </div>
              <div className="divide-y divide-border text-xs max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (n.url) {
                        setNotifOpen(false);
                        navigate({ to: n.url });
                      }
                    }}
                    className={`p-3.5 hover:bg-muted/60 transition-colors ${n.url ? "cursor-pointer" : ""
                      } ${n.unread ? "bg-primary-soft/40 border-l-2 border-primary" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-foreground leading-snug">{n.title}</p>
                      <span className={`text-[10px] font-bold shrink-0 px-1.5 py-0.5 rounded ${n.unread ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        }`}>
                        {n.time}
                      </span>
                    </div>
                    {n.description ? (
                      <p className="mt-1 text-[11px] text-muted-foreground">{n.description}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Dark / Light Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="size-9 transition-transform active:scale-95"
            title="Ubah Tema"
          >
            {dark ? <Sun className="size-4 text-gold" /> : <Moon className="size-4" />}
          </Button>

          {/* User Profile Dropdown */}
          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 px-2 transition-transform active:scale-95"
              >
                <div className="flex size-7 items-center justify-center rounded-full bg-primary font-bold text-xs text-primary-foreground">
                  {displayFullName ? displayFullName.slice(0, 1).toUpperCase() : "U"}
                </div>
                <div className="hidden text-left sm:block max-w-[180px]">
                  <p className="truncate text-xs font-semibold leading-none" title={displayFullName}>
                    {displayFullName}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground mt-0.5 font-mono">
                    {user?.username || role}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold">{displayFullName}</p>
                  <p className="text-xs text-muted-foreground font-mono">{user?.username || "-"}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge variant="outline" className="w-fit text-[10px] font-semibold">
                      {role}
                    </Badge>
                    {isAdmin && role !== "Admin Koperasi" && (
                      <Badge variant="secondary" className="text-[9px] bg-primary-soft text-primary">
                        Admin View
                      </Badge>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isAdmin && (
                <DropdownMenuItem onClick={() => navigate({ to: "/users" })} className="gap-2 cursor-pointer">
                  <UserRound className="size-4" /> Manajemen Akun
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setProfileOpen(true)} className="gap-2 cursor-pointer">
                <Settings className="size-4" /> Profil &amp; Satminkal
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="gap-2 text-destructive cursor-pointer font-medium">
                <LogOut className="size-4" /> Akhiri Sesi (Keluar)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Profil & Satminkal Modal Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="size-5 text-primary" /> Informasi Akun &amp; Satminkal
            </DialogTitle>
            <DialogDescription>
              Detail identitas dinas dan sesi aktif pada sistem Koperasi TNI AD Casheva
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 text-sm">
            <div className="flex items-center gap-3.5 rounded-xl border border-border p-3.5 bg-muted/30">
              <div className="grid size-12 shrink-0 place-items-center rounded-full bg-primary font-bold text-lg text-primary-foreground">
                {user?.namaLengkap ? user.namaLengkap.slice(0, 1).toUpperCase() : "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-base text-foreground truncate">{user?.namaLengkap || "Pengguna Koperasi"}</p>
                <p className="text-xs text-muted-foreground font-mono">NRP / User: {user?.username || "-"}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline" className="border-primary/30 bg-primary-soft text-primary text-[10px] font-semibold">
                    {originalRole || role}
                  </Badge>
                  {isAdmin && (
                    <Badge variant="secondary" className="bg-gold-soft text-accent-foreground text-[10px] font-semibold">
                      Super Administrator
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-3 bg-card">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="size-3.5 text-primary" /> Satminkal
                </div>
                <p className="font-semibold text-foreground text-sm mt-1">{satminkal}</p>
              </div>
              <div className="rounded-lg border border-border p-3 bg-card">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <BadgeCheck className="size-3.5 text-primary" /> Kotama / Pembina
                </div>
                <p className="font-semibold text-foreground text-sm mt-1">{kotama}</p>
              </div>
            </div>

            <div className="rounded-lg border border-border/80 bg-muted/20 p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status Sesi:</span>
                <span className="font-semibold text-emerald-500 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Terautentikasi (Aktif)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hak Akses:</span>
                <span className="font-semibold">{isAdmin ? "Akses Penuh Seluruh Peran (Admin)" : `Terbatas (${role})`}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
