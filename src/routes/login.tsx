import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

import emblem from "@/assets/casheva-emblem.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/session-context";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Masuk — Casheva Koperasi Simpan Pinjam TNI AD" },
      {
        name: "description",
        content:
          "Halaman masuk Casheva, sistem informasi koperasi simpan pinjam TNI AD yang transparan, akuntabel, dan terintegrasi.",
      },
      { property: "og:title", content: "Masuk — Casheva Koperasi TNI AD" },
      {
        property: "og:description",
        content:
          "Akses terbatas untuk pengurus dan pejabat koperasi TNI AD. Masuk untuk mengelola simpanan, pinjaman, dan laporan.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login, satminkal, kotama } = useSession();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Admin123!");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  const track = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  const handleLogin = async () => {
    const u = username.trim();
    const p = password.trim();

    if (!u || !p) {
      toast.error("Data tidak lengkap", {
        description: "Masukkan NRP/NIP dan password dinas Anda.",
      });
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      const res = await login({ username: u, password: p });
      setLoading(false);
      setSuccess(true);
      toast.success("Login Berhasil", {
        description: `Selamat datang, ${res.user.namaLengkap} (${res.user.role})`,
      });
      track(() => setLeaving(true), 600);
      track(() => navigate({ to: "/" }), 1000);
    } catch (err: any) {
      setLoading(false);
      toast.error("Gagal Masuk", {
        description:
          err.message || "NRP/NIP atau password salah. Pastikan server backend aktif.",
      });
    }
  };

  return (
    <div
      className={cn(
        "relative min-h-screen w-full bg-background transition-all duration-500",
        leaving && "scale-[0.98] opacity-0 blur-md",
      )}
    >
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left — branding */}
        <aside className="animate-in fade-in slide-in-from-left-8 relative hidden overflow-hidden bg-sidebar px-10 py-14 duration-700 lg:flex lg:flex-col lg:justify-between">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-gold/15 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-primary/25 blur-3xl"
          />

          <div className="relative flex items-center gap-3 text-sidebar-foreground">
            <div className="grid size-8 place-items-center rounded-lg bg-sidebar-accent/60 p-1">
              <img src={emblem} alt="Logo Casheva Koperasi Kartika" className="size-full object-contain" />
            </div>
            <span className="text-sm font-semibold tracking-[0.2em] uppercase">
              Casheva
            </span>
          </div>

          <div className="relative max-w-lg">
            <div className="animate-in zoom-in-95 fade-in mb-8 inline-flex rounded-3xl bg-sidebar-accent/60 p-5 shadow-[0_0_60px_-12px] shadow-gold/40 delay-150 duration-700">
              <img
                src={emblem}
                alt="Emblem Koperasi Kartika Infolahtadam IV/Diponegoro"
                width={512}
                height={512}
                className="h-28 w-28 object-contain drop-shadow-[0_0_18px_rgba(217,119,6,0.35)]"
              />
            </div>
            <h1 className="text-3xl leading-tight font-extrabold text-sidebar-foreground xl:text-4xl">
              Sistem Informasi Koperasi Simpan Pinjam TNI AD
            </h1>
            <p className="mt-4 text-lg font-medium text-sidebar-primary">
              Transparan, Akuntabel, dan Terintegrasi
            </p>
          </div>

          <p className="relative text-xs text-sidebar-foreground/60">
            © 2026 Koperasi TNI AD · Infolahtadam IV/Diponegoro. Created by Todskyyy
          </p>
        </aside>

        {/* Right — form */}
        <main className="animate-in fade-in slide-in-from-bottom-8 flex items-center justify-center px-4 py-10 delay-200 duration-700 sm:px-8">
          <div className="w-full max-w-md space-y-4">
            {/* Mobile Header */}
            <div className="mb-4 flex items-center gap-3 lg:hidden">
              <img
                src={emblem}
                alt="Emblem koperasi TNI AD"
                width={512}
                height={512}
                className="h-12 w-12 object-contain"
              />
              <div>
                <p className="text-sm font-bold text-foreground">Casheva</p>
                <p className="text-xs text-muted-foreground">
                  Koperasi Simpan Pinjam TNI AD
                </p>
              </div>
            </div>

            {/* Login Card */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-card sm:p-8 space-y-6">
              <div className="space-y-1.5">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Selamat Datang Kembali
                </h2>
                <p className="text-xs text-muted-foreground">
                  Masukkan kredensial dinas Anda untuk mengakses sistem informasi koperasi.
                </p>
              </div>

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin();
                }}
              >
                {/* Field 1: NRP / NIP */}
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-xs font-semibold">
                    NRP / NIP
                  </Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan NRP/NIP atau username"
                      autoComplete="username"
                      className="h-10 pl-9 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Field 2: Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold">
                      Kata Sandi
                    </Label>
                    <ForgotPasswordDialog />
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="h-10 pr-10 pl-9 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary text-xs"
                    />
                    <button
                      type="button"
                      aria-label={
                        showPassword ? "Sembunyikan password" : "Tampilkan password"
                      }
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <span
                        className={cn(
                          "block transition-transform duration-300",
                          showPassword && "rotate-180",
                        )}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Session & Satminkal Info Card */}
                <div className="rounded-xl border border-border/80 bg-muted/40 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="size-3.5 text-primary" />
                      Sesi Multi-Tenant Terintegrasi
                    </span>
                    <Badge
                      variant="outline"
                      className="border-primary/30 bg-primary-soft text-primary text-[10px] px-2 py-0 font-medium"
                    >
                      TNI AD
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-border/50">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Satminkal</span>
                      <span className="font-semibold text-foreground block truncate" title={satminkal}>
                        {satminkal}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Kotama</span>
                      <span className="font-semibold text-foreground block truncate" title={kotama}>
                        {kotama}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-10 w-full font-semibold shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25 active:scale-95 text-xs"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Memverifikasi Kredensial...
                    </>
                  ) : (
                    "Masuk Aplikasi"
                  )}
                </Button>
              </form>

              {/* Security Badge Footer inside Card */}
              <div className="pt-3 border-t border-border/60 text-center">
                <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
                  <Lock className="size-3 text-emerald-600 dark:text-emerald-400" />
                  Dilindungi oleh Tuhan Yang Maha Esa
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {success && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm duration-300">
          <div className="animate-in zoom-in-95 fade-in flex items-center gap-3 rounded-2xl border border-success/30 bg-card px-6 py-4 shadow-card duration-300">
            <CheckCircle2 className="h-6 w-6 text-success" />
            <div>
              <p className="text-sm font-semibold text-card-foreground">
                Autentikasi Berhasil!
              </p>
              <p className="text-xs text-muted-foreground">
                Mengalihkan ke Dashboard...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ForgotPasswordDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-xs font-medium text-primary transition-colors hover:text-gold hover:underline"
        >
          Lupa Password?
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Demi keamanan sistem, reset password hanya dapat dilakukan oleh
            Admin Koperasi. Silakan hubungi Admin Koperasi Satminkal Anda
            dengan membawa identitas dinas (NRP/NIP) untuk verifikasi.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
