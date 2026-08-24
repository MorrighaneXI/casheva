import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Search,
  Moon,
  Sun,
  UserRound,
  LogOut,
  Settings,
  Clock,
  Radio,
  Shield,
  Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";
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
import { useSession } from "@/components/session-context";
import { ROLES, type Role } from "@/lib/casheva-data";

const notifications = [
  { title: "3 pengajuan pinjaman menunggu Verifikasi", time: "5 menit lalu", unread: true },
  { title: "Rekap simpanan sukarela bulanan siap diproses", time: "1 jam lalu", unread: false },
  { title: "Pembaruan suku bunga aktif tercatat oleh Bendahara", time: "Kemarin", unread: false },
];

export function TopHeader() {
  const navigate = useNavigate();
  const { role, setRole, user, isAdmin, satminkal, kotama, logout: sessionLogout } = useSession();
  const [dark, setDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
    document.documentElement.classList.toggle("dark", next);
  };

  const logout = () => {
    sessionLogout();
    toast.success("Sesi berhasil diakhiri");
    navigate({ to: "/login" });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    toast.info(`Mencari: "${searchQuery}"`, {
      description: "Menampilkan hasil pencarian di tabel terkait...",
    });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur-xl transition-all">
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-5">
        {/* Left Section: Sidebar Trigger & Search Bar */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3 flex-1 max-w-xl">
          <SidebarTrigger className="shrink-0 transition-transform active:scale-95" />
          <Separator orientation="vertical" className="hidden h-5 sm:block" />
          
          <form onSubmit={handleSearchSubmit} className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari anggota, NRP, simpanan, atau nomor pengajuan…"
              className="h-9 pl-9 pr-8 bg-muted/40 border-border/80 focus:bg-background transition-colors text-xs sm:text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          </form>
        </div>

        {/* Right Section: Badges, Clock, Role Switcher, & User Menu */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          {/* Live Operational Clock */}
          <div className="hidden xl:flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground font-mono">
            <Radio className="size-3 text-success animate-pulse" />
            <span>{timeString}</span>
          </div>

          {/* Satminkal / Kesatuan Badge */}
          <div className="hidden lg:flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{satminkal}</span>
            <span className="opacity-40">/</span>
            <span>{kotama}</span>
          </div>

          {/* Role Switcher for Admin Koperasi */}
          {isAdmin ? (
            <div className="hidden items-center gap-1.5 md:flex bg-primary-soft/60 border border-primary/25 rounded-lg px-2 py-0.5">
              <span className="text-[11px] font-semibold text-primary">Perspektif:</span>
              <Select
                value={role}
                onValueChange={(v) => {
                  setRole(v as Role);
                  toast.success(`Beralih ke tampilan role: ${v}`);
                }}
              >
                <SelectTrigger className="h-8 w-[175px] text-xs font-semibold bg-background">
                  <SelectValue placeholder="Pilih peran" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r} className="text-xs">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="hidden h-8 items-center rounded-lg border border-border bg-muted/60 px-2.5 text-xs font-semibold md:flex">
              <Shield className="size-3.5 text-primary mr-1" />
              <span>{role}</span>
            </div>
          )}

          {/* Notification Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative size-9 transition-transform active:scale-95"
              >
                <Bell className="size-4" />
                <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive animate-ping" />
                <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <p className="text-sm font-semibold">Notifikasi Sistem</p>
                <Badge variant="secondary" className="text-[10px]">
                  3 Baru
                </Badge>
              </div>
              <div className="divide-y divide-border text-xs max-h-64 overflow-y-auto">
                {notifications.map((n, i) => (
                  <div
                    key={i}
                    className={`p-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                      n.unread ? "bg-primary-soft/30" : ""
                    }`}
                  >
                    <p className="font-medium text-foreground">{n.title}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{n.time}</p>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 px-2 transition-transform active:scale-95"
              >
                <div className="flex size-7 items-center justify-center rounded-full bg-primary font-bold text-xs text-primary-foreground">
                  {user?.namaLengkap ? user.namaLengkap.slice(0, 1).toUpperCase() : "U"}
                </div>
                <div className="hidden text-left sm:block max-w-[120px]">
                  <p className="truncate text-xs font-semibold leading-none">
                    {user?.namaLengkap || "User Koperasi"}
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
                  <p className="text-sm font-semibold">{user?.namaLengkap || "Pengguna Koperasi"}</p>
                  <p className="text-xs text-muted-foreground font-mono">{user?.username || "-"}</p>
                  <Badge variant="outline" className="w-fit text-[10px] mt-1 font-semibold">
                    {role}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate({ to: "/users" })} className="gap-2 cursor-pointer">
                <UserRound className="size-4" /> Manajemen Akun
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: "/profil" })} className="gap-2 cursor-pointer">
                <Settings className="size-4" /> Profil &amp; Satminkal
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="gap-2 text-destructive cursor-pointer font-medium">
                <LogOut className="size-4" /> Akhiri Sesi (Keluar)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
