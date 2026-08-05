import { Bell, Search, Moon, Sun, UserRound, LogOut, Settings } from "lucide-react";
import { useState } from "react";
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
  { title: "3 pengajuan menunggu Verifikasi Jurbay", time: "5 menit lalu" },
  { title: "2 berkas rekomendasi Dan/Ka belum diunggah", time: "1 jam lalu" },
  { title: "Auto-generate simpanan sukarela dijadwalkan 5 Agu", time: "Kemarin" },
];

export function TopHeader() {
  const { role, setRole, profile, satminkal, kotama, pendingFor } = useSession();
  const [dark, setDark] = useState(false);
  const pending = pendingFor(role);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 sm:flex sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="shrink-0" />
          <Separator orientation="vertical" className="hidden h-6 sm:block" />
          <div className="relative min-w-0 flex-1 sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari anggota, NRP, atau nomor pengajuan…"
              className="h-9 pl-9"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 rounded-xl border border-gold/40 bg-gold-soft px-3 py-1.5 lg:flex">
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent-foreground/70">
              Demo
            </span>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger className="h-7 w-[150px] border-0 bg-transparent px-1 text-xs font-semibold shadow-none focus:ring-0">
                <SelectValue placeholder="Pilih peran" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger className="flex h-9 w-[150px] md:hidden lg:hidden">
              <SelectValue placeholder="Peran" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Ganti tema">
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="Notifikasi">
                <Bell className="size-4" />
                {pending > 0 && (
                  <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                    {pending}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-semibold">Notifikasi Persetujuan</p>
                <p className="text-xs text-muted-foreground">
                  {pending} berkas menunggu aksi {role}
                </p>
              </div>
              <ul className="divide-y divide-border">
                {notifications.map((n) => (
                  <li key={n.title} className="px-4 py-3 hover:bg-muted/60">
                    <p className="text-sm leading-snug">{n.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{n.time}</p>
                  </li>
                ))}
              </ul>
              <div className="p-2">
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => toast.success("Semua notifikasi ditandai dibaca")}
                >
                  Tandai semua dibaca
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-xl border border-border px-2 py-1.5 text-left transition-colors hover:bg-muted">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <UserRound className="size-4" />
                </span>
                <span className="hidden min-w-0 sm:block">
                  <span className="block truncate text-xs font-semibold">
                    {profile.pangkat} {profile.nama}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    NRP {profile.nrp}
                  </span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <p className="text-sm">
                  {profile.pangkat} {profile.nama}
                </p>
                <p className="text-xs font-normal text-muted-foreground">
                  {profile.jabatan}
                </p>
                <p className="mt-1 text-[11px] font-normal text-muted-foreground">
                  {kotama} · {satminkal}
                </p>
                <Badge variant="outline" className="mt-2 font-normal">
                  {role}
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 size-4" /> Pengaturan Akun
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast("Sesi diakhiri")}>
                <LogOut className="mr-2 size-4" /> Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
