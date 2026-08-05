import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  Info,
  ShieldCheck,
} from "lucide-react";

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
import { ROLES, type Role } from "@/lib/casheva-data";
import { cn } from "@/lib/utils";

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

const DEMO_CREDENTIALS: Record<Role, { username: string; password: string }> = {
  "Juru Bayar": { username: "jurbay.disinfolahtad", password: "casheva2026" },
  "Dan/Ka": { username: "danka.disinfolahtad", password: "casheva2026" },
  Kaprim: { username: "kaprim.mabesad", password: "casheva2026" },
  Bendahara: { username: "bendahara.koperasi", password: "casheva2026" },
};

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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

  const runLogin = () => {
    if (loading) return;
    setLoading(true);
    track(() => {
      setLoading(false);
      setSuccess(true);
      track(() => setLeaving(true), 900);
      track(() => navigate({ to: "/" }), 1500);
    }, 1600);
  };

  const typeInto = (
    value: string,
    setter: (v: string) => void,
    stepMs: number,
    onDone?: () => void,
  ) => {
    setter("");
    value.split("").forEach((_, i) => {
      track(() => setter(value.slice(0, i + 1)), stepMs * (i + 1));
    });
    if (onDone) track(onDone, stepMs * value.length + 120);
  };

  const quickLogin = (role: Role) => {
    if (loading) return;
    setRole(role);
    const creds = DEMO_CREDENTIALS[role];
    typeInto(creds.username, setUsername, 35, () =>
      typeInto(creds.password, setPassword, 30, runLogin),
    );
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
            <ShieldCheck className="h-5 w-5 text-sidebar-primary" />
            <span className="text-sm font-semibold tracking-[0.2em] uppercase">
              Casheva
            </span>
          </div>

          <div className="relative max-w-lg">
            <div className="animate-in zoom-in-95 fade-in mb-8 inline-flex rounded-3xl bg-sidebar-accent/60 p-5 shadow-[0_0_60px_-12px] shadow-gold/40 delay-150 duration-700">
              <img
                src={emblem}
                alt="Emblem koperasi TNI AD Disinfolahtad"
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
            © 2026 Koperasi TNI AD · Disinfolahtad. Seluruh aktivitas dicatat
            dan diaudit.
          </p>
        </aside>

        {/* Right — form */}
        <main className="animate-in fade-in slide-in-from-bottom-8 flex items-center justify-center px-4 py-10 delay-200 duration-700 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
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

            <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
              <h2 className="text-2xl font-bold text-card-foreground">
                Selamat Datang Kembali
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Masukkan kredensial dinas Anda untuk mengakses dasbor koperasi.
              </p>

              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  runLogin();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="username">Username / NRP / NIP</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Contoh: 21980045"
                      autoComplete="username"
                      className="h-11 pl-9 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
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
                      className="h-11 pr-10 pl-9 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary"
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

                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/60 px-3 py-2.5 text-xs text-muted-foreground">
                  <Badge
                    variant="outline"
                    className="border-primary/30 bg-primary-soft text-primary"
                  >
                    Sesi Aktif
                  </Badge>
                  <span className="font-medium text-foreground">
                    Satminkal: Disinfolahtad
                  </span>
                  <span className="opacity-40">|</span>
                  <span className="font-medium text-foreground">
                    Kotama: Mabesad
                  </span>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full font-semibold shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25 active:scale-95"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Memverifikasi Hak Akses...
                    </>
                  ) : (
                    "Masuk Aplikasi"
                  )}
                </Button>
              </form>

              <div className="mt-5 flex gap-2.5 rounded-lg border border-gold/30 bg-gold-soft px-3 py-2.5 text-xs leading-relaxed text-accent-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Akses terbatas khusus Pengurus &amp; Pejabat Koperasi. Akun
                  anggota dikelola terpusat oleh Admin.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-dashed border-gold/50 bg-gold-soft/50 p-4">
              <p className="text-xs font-semibold tracking-wide text-accent-foreground uppercase">
                Quick Demo Login As:
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {ROLES.map((role) => (
                  <Button
                    key={role}
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={loading}
                    onClick={() => quickLogin(role)}
                    className="transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary-soft active:scale-95"
                  >
                    {role}
                  </Button>
                ))}
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
