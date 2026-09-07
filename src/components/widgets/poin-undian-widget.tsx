import { useState } from "react";
import {
  Gift,
  Sparkles,
  Ticket,
  Target,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Shuffle,
  PartyPopper,
  Calendar,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

import {
  poinUndianDemo,
  formatRp,
} from "@/lib/casheva-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function PoinUndianWidget() {
  const [poinData, setPoinData] = useState(poinUndianDemo);
  const [isDrawModalOpen, setIsDrawModalOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerKupon, setWinnerKupon] = useState<string | null>(null);

  const progressPersen = Math.min(
    100,
    Math.round((poinData.belanjaBulanIni / poinData.targetBelanjaNominal) * 100)
  );
  const isTargetAchieved = poinData.belanjaBulanIni >= poinData.targetBelanjaNominal;

  const handleTukarKupon = () => {
    const poinPerKupon = poinData.eventAktif.poinPerKupon;
    if (poinData.totalPoin < poinPerKupon) {
      toast.error(`Poin tidak mencukupi (Butuh ${poinPerKupon} poin untuk 1 kupon)`);
      return;
    }

    const nomorKuponBaru = `KP-000${Math.floor(100 + Math.random() * 900)}`;

    setPoinData((prev) => ({
      ...prev,
      totalPoin: prev.totalPoin - poinPerKupon,
      totalPoinKlaim: prev.totalPoinKlaim + poinPerKupon,
      kuponSaya: [...prev.kuponSaya, nomorKuponBaru],
      eventAktif: {
        ...prev.eventAktif,
        totalKuponTerdaftar: prev.eventAktif.totalKuponTerdaftar + 1,
      },
    }));

    toast.success(`Kupon Undian Berhasil Ditukarkan!`, {
      description: `Nomor Kupon: ${nomorKuponBaru} untuk ${poinData.eventAktif.nama}`,
    });
  };

  const handleKocokUndian = () => {
    setIsSpinning(true);
    setWinnerKupon(null);

    setTimeout(() => {
      const winner = `KP-000${Math.floor(100 + Math.random() * 900)}`;
      setWinnerKupon(winner);
      setIsSpinning(false);
      toast.success(`Pemenang Doorprize Ditemukan: ${winner}!`, {
        description: `Selamat mendapatkan ${poinData.eventAktif.hadiahUtama}`,
      });
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Poin Belanja */}
        <div className="rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/15 to-transparent p-5 shadow-card flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-accent-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="size-4 text-gold" /> Saldo Poin Belanja Koperasi
            </span>
            <p className="text-4xl font-black text-foreground mt-2 font-mono">
              {poinData.totalPoin} <span className="text-sm font-bold text-muted-foreground">Poin</span>
            </p>
          </div>
          <div className="pt-3 border-t border-gold/20 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">1 Kupon = {poinData.eventAktif.poinPerKupon} Poin</span>
            <Button
              size="sm"
              onClick={handleTukarKupon}
              className="h-8 rounded-lg bg-gold text-gold-foreground text-xs font-bold shadow-sm"
            >
              Tukar Kupon (+1)
            </Button>
          </div>
        </div>

        {/* Card 2: Kupon Undian RAT */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-card flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Ticket className="size-4" /> Kupon Undian RAT Saya
            </span>
            <p className="text-4xl font-black text-primary mt-2 font-mono">
              {poinData.kuponSaya.length} <span className="text-sm font-bold text-muted-foreground">Nomor</span>
            </p>
          </div>
          <div className="pt-3 border-t border-primary/20 flex flex-wrap gap-1">
            {poinData.kuponSaya.map((kp) => (
              <Badge key={kp} variant="outline" className="font-mono text-[10px] font-bold bg-background">
                {kp}
              </Badge>
            ))}
          </div>
        </div>

        {/* Card 3: Target Belanja Bulanan */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-card flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Target className="size-4 text-primary" /> Target Belanja Bulan Ini
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <p className="text-2xl font-black text-foreground font-mono">
                {formatRp(poinData.belanjaBulanIni)}
              </p>
              <span className="text-xs font-mono text-muted-foreground">
                / {formatRp(poinData.targetBelanjaNominal)}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-muted mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isTargetAchieved ? "bg-emerald-500" : "bg-primary"
                }`}
                style={{ width: `${progressPersen}%` }}
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-[11px]">
            <span className={isTargetAchieved ? "text-emerald-600 font-bold" : "text-muted-foreground"}>
              {isTargetAchieved ? "✓ Target Tercapai (+100 Poin)" : `Sisa ${formatRp(poinData.targetBelanjaNominal - poinData.belanjaBulanIni)}`}
            </span>
            <span className="font-bold text-foreground">{progressPersen}%</span>
          </div>
        </div>
      </div>

      {/* RAT Lucky Draw Active Event Card */}
      <div className="rounded-3xl border border-sidebar-border bg-gradient-to-r from-card via-sidebar-accent/50 to-card p-6 shadow-card flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <Badge className="bg-primary text-primary-foreground font-bold text-xs gap-1.5">
            <Trophy className="size-3.5" /> Event Undian Berhadiah RAT Koperasi
          </Badge>
          <h3 className="text-xl sm:text-2xl font-black text-foreground">
            {poinData.eventAktif.nama}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Hadiah Utama: <b className="text-foreground">{poinData.eventAktif.hadiahUtama}</b>. Pengundian akan dilakukan secara transparan pada Rapat Anggota Tahunan (RAT).
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-primary" /> Tanggal Pengundian: <b>{poinData.eventAktif.tanggalUndi}</b>
            </span>
            <span className="flex items-center gap-1.5">
              <Ticket className="size-3.5 text-gold" /> Total Kupon Terdaftar: <b>{poinData.eventAktif.totalKuponTerdaftar} Kupon</b>
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
          <Button
            onClick={() => setIsDrawModalOpen(true)}
            className="h-11 px-6 rounded-2xl bg-gold text-gold-foreground font-bold text-xs gap-2 shadow-sm"
          >
            <Shuffle className="size-4" /> Buka Simulator Acak Doorprize
          </Button>
        </div>
      </div>

      {/* DIALOG SIMULATOR ACAK DOORPRIZE */}
      <Dialog open={isDrawModalOpen} onOpenChange={setIsDrawModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 text-center">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center justify-center gap-2">
              <PartyPopper className="size-5 text-gold" /> Pengundian Acak Doorprize RAT
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="size-36 rounded-full border-4 border-dashed border-gold/60 mx-auto flex flex-col items-center justify-center p-3 bg-gold/10">
              {isSpinning ? (
                <div className="space-y-1 animate-spin">
                  <Shuffle className="size-8 text-gold" />
                </div>
              ) : winnerKupon ? (
                <div className="space-y-1">
                  <Trophy className="size-8 text-gold mx-auto" />
                  <p className="text-lg font-black text-foreground font-mono">{winnerKupon}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <Ticket className="size-8 text-muted-foreground mx-auto" />
                  <p className="text-xs font-bold text-muted-foreground">Siap Mengundi</p>
                </div>
              )}
            </div>

            {winnerKupon && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  🎉 Selamat kepada pemegang nomor kupon:
                </p>
                <p className="text-xl font-black text-foreground font-mono">{winnerKupon}</p>
                <p className="text-[11px] text-muted-foreground">Prajurit Satminkal INFOLAHTADAM IV</p>
              </div>
            )}

            <Button
              disabled={isSpinning}
              onClick={handleKocokUndian}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold gap-2"
            >
              <Shuffle className="size-4" /> {isSpinning ? "Mengacak Kupon..." : "Kocok Pemenang Sekarang"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
