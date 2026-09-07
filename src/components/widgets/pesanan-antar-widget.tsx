import { useState } from "react";
import {
  Clock,
  Truck,
  Shield,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Phone,
  User,
  Package,
  Calendar,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import {
  pesananOnlineList,
  formatRp,
  type PesananOnline,
} from "@/lib/casheva-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function PesananAntarWidget() {
  const [orders, setOrders] = useState<PesananOnline[]>(pesananOnlineList);
  const [selectedOrder, setSelectedOrder] = useState<PesananOnline | null>(null);

  const handleUpdateStatus = (
    orderId: string,
    newStatus: PesananOnline["status"]
  ) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const isLate = ord.menitBerjalan > ord.estimasiMenit;
          const kompensasi = isLate ? (ord.totalBelanja * 15) / 100 : 0;
          return {
            ...ord,
            status: newStatus,
            isTerlambatSla: isLate,
            kompensasiDiskon: kompensasi,
          };
        }
        return ord;
      })
    );
    toast.success(`Status pesanan berhasil diperbarui ke: ${newStatus}`);
  };

  return (
    <div className="space-y-6">
      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-card">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Truck className="size-3.5" /> Pesanan Sedang Diantar
          </p>
          <p className="text-2xl font-black text-primary font-mono mt-1">
            {orders.filter((o) => o.status === "SEDANG_DIANTAR").length} Pesanan
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">Dalam perjalanan kurir internal satuan</p>
        </div>

        <div className="rounded-2xl border border-gold/30 bg-gold/5 p-4 shadow-card">
          <p className="text-xs font-semibold text-accent-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="size-3.5 text-gold" /> Dititipkan di Meja Piket
          </p>
          <p className="text-2xl font-black text-foreground font-mono mt-1">
            {orders.filter((o) => o.status === "TITIP_DI_PIKET").length} Pesanan
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">Siap diambil di pos jaga hari libur</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-card">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Garansi SLA Pengiriman</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">30 Menit</p>
          <p className="text-[11px] text-muted-foreground mt-1">Kompensasi diskon 15% jika terlambat</p>
        </div>
      </div>

      {/* Orders List */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Clock className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Antrean Pesanan Online, Delivery & Titip Piket</h3>
              <p className="text-[11px] text-muted-foreground">Monitoring SLA kecepatan respon petugas dan serah terima piket</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {orders.map((ord) => {
            const isLate = ord.menitBerjalan > ord.estimasiMenit;

            return (
              <div
                key={ord.id}
                className="rounded-2xl border border-border/80 bg-muted/20 p-4 hover:border-primary/40 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Badge variant="outline" className="font-mono text-xs font-bold">
                      {ord.nomorPesanan}
                    </Badge>
                    <Badge
                      className={`text-xs font-bold ${
                        ord.tipe === "TITIP_PIKET_SATUAN"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20"
                          : ord.tipe === "DELIVERY_CEPAT"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {ord.tipe === "TITIP_PIKET_SATUAN"
                        ? "Titip Meja Piket"
                        : ord.tipe === "DELIVERY_CEPAT"
                        ? "Delivery Fast Consume"
                        : "Ambil Sendiri"}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-medium">{ord.waktuPesan}</span>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {ord.isTerlambatSla && (
                      <Badge className="bg-destructive text-destructive-foreground text-[10px] font-bold animate-pulse">
                        SLA Terlewat (Diskon 15% Terpasang)
                      </Badge>
                    )}
                    <Badge
                      className={`text-xs font-bold ${
                        ord.status === "SELESAI"
                          ? "bg-emerald-600 text-white"
                          : ord.status === "SEDANG_DIANTAR"
                          ? "bg-primary text-primary-foreground"
                          : ord.status === "TITIP_DI_PIKET"
                          ? "bg-gold text-gold-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {ord.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Pemesan / Anggota:</p>
                    <p className="font-bold text-foreground">{ord.anggotaNama}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">NRP: {ord.anggotaNrp} | {ord.noHp}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-muted-foreground">Tujuan / Petugas Penerima:</p>
                    <p className="font-bold text-foreground flex items-center gap-1">
                      <MapPin className="size-3.5 text-primary" /> {ord.lokasi}
                    </p>
                    {ord.petugasPiket && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                        Penerima Piket: {ord.petugasPiket}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 md:text-right">
                    <p className="text-muted-foreground">Rincian Tagihan:</p>
                    <p className="text-base font-extrabold text-primary font-mono">{formatRp(ord.totalTagihan)}</p>
                    {ord.kompensasiDiskon > 0 && (
                      <p className="text-[11px] text-destructive font-bold">
                        Kompensasi Diskon Telat: -{formatRp(ord.kompensasiDiskon)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Items Summary & Action Buttons */}
                <div className="pt-2 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Package className="size-3.5" />
                    <span>
                      {ord.items.map((i) => `${i.jumlah}x ${i.nama}`).join(", ")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {ord.status === "MENUNGGU_KONFIRMASI" && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(ord.id, "DIPROSES_PETUGAS")}
                        className="h-8 rounded-lg text-xs font-bold bg-primary text-primary-foreground"
                      >
                        Proses Pesanan
                      </Button>
                    )}
                    {ord.status === "DIPROSES_PETUGAS" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          handleUpdateStatus(
                            ord.id,
                            ord.tipe === "TITIP_PIKET_SATUAN" ? "TITIP_DI_PIKET" : "SEDANG_DIANTAR"
                          )
                        }
                        className="h-8 rounded-lg text-xs font-bold bg-primary text-primary-foreground"
                      >
                        {ord.tipe === "TITIP_PIKET_SATUAN" ? "Serahkan ke Piket Jaga" : "Mulai Pengantaran"}
                      </Button>
                    )}
                    {(ord.status === "SEDANG_DIANTAR" || ord.status === "TITIP_DI_PIKET") && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(ord.id, "SELESAI")}
                        className="h-8 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="size-3.5 mr-1" /> Konfirmasi Selesai / Diterima
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
