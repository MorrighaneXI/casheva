import { useQuery } from "@tanstack/react-query";
import { apiPinjaman } from "@/lib/api/pinjaman";
import { apiUsers } from "@/lib/api/users";
import type { Role } from "@/lib/casheva-data";

export interface LiveNotificationItem {
  id: string;
  title: string;
  description?: string;
  time: string;
  url?: string;
  unread: boolean;
  type?: "info" | "warning" | "success" | "action";
}

export function useLiveNotifications(currentRole?: Role) {
  // 1. Live loan query with background polling every 3 seconds
  const { data: loanList = [], refetch: refetchLoans } = useQuery({
    queryKey: ["pinjaman-live-stream"],
    queryFn: () => apiPinjaman.findAll(),
    refetchInterval: 3000,
    staleTime: 2000,
  });

  // 2. Live users query (for admin user count)
  const { data: userList = [] } = useQuery({
    queryKey: ["users-live-stream"],
    queryFn: () => apiUsers.findAll(),
    refetchInterval: 10000,
    staleTime: 8000,
    enabled: currentRole === "Admin Koperasi",
  });

  // Real-time Queue Calculations
  const verifikasiCount = loanList.filter((l) =>
    ["DIAJUKAN", "VERIFIKASI_PRIMKOP", "VERIFIKASI_JURU_BAYAR"].includes(l.status),
  ).length;

  const rekomendasiCount = loanList.filter((l) =>
    ["REKOMENDASI_PIMPINAN", "VERIFIKASI_JURU_BAYAR"].includes(l.status),
  ).length;

  const accCount = loanList.filter((l) =>
    ["SETUJU_KEPRIM", "REKOMENDASI_PIMPINAN"].includes(l.status),
  ).length;

  const pencairanCount = loanList.filter((l) =>
    ["MENUNGGU_DOKUMEN", "SETUJU_KEPRIM"].includes(l.status),
  ).length;

  const usersCount = userList.length;

  // Dynamic Badge Helper for Sidebar Navigation
  const getBadgeForUrl = (url: string): string | undefined => {
    switch (url) {
      case "/verifikasi":
        return verifikasiCount > 0 ? String(verifikasiCount) : undefined;
      case "/rekomendasi":
        return rekomendasiCount > 0 ? String(rekomendasiCount) : undefined;
      case "/acc":
        return accCount > 0 ? String(accCount) : undefined;
      case "/pencairan":
        return pencairanCount > 0 ? String(pencairanCount) : undefined;
      case "/users":
        return usersCount > 0 ? String(usersCount) : undefined;
      default:
        return undefined;
    }
  };

  // Dynamic Role-Based Notifications for TopHeader Bell
  const notifications: LiveNotificationItem[] = [];

  if (currentRole === "Pimpinan / Dan / Ka") {
    if (rekomendasiCount > 0) {
      notifications.push({
        id: "rek-pending",
        title: `${rekomendasiCount} pengajuan pinjaman menunggu rekomendasi Dan/Ka`,
        description: "Pengajuan dari anggota satuan siap ditinjau dan direkomendasikan.",
        time: "Perlu Tindakan",
        url: "/rekomendasi",
        unread: true,
        type: "action",
      });
    }
  } else if (currentRole === "Juru Bayar") {
    if (verifikasiCount > 0) {
      notifications.push({
        id: "ver-pending",
        title: `${verifikasiCount} berkas pinjaman baru menunggu verifikasi gaji`,
        description: "Validasi penghasilan dan kesanggupan angsuran Usipa anggota.",
        time: "Perlu Tindakan",
        url: "/verifikasi",
        unread: true,
        type: "action",
      });
    }
  } else if (currentRole === "Keprim") {
    if (accCount > 0) {
      notifications.push({
        id: "acc-pending",
        title: `${accCount} pengajuan pinjaman menunggu otorisasi ACC Keprim`,
        description: "Persetujuan final kredit untuk diteruskan ke tahap pencairan dana.",
        time: "Perlu Tindakan",
        url: "/acc",
        unread: true,
        type: "action",
      });
    }
    if (rekomendasiCount > 0) {
      notifications.push({
        id: "rek-monitor",
        title: `${rekomendasiCount} pengajuan sedang dalam proses rekomendasi pimpinan`,
        time: "Monitoring",
        url: "/rekomendasi",
        unread: false,
        type: "info",
      });
    }
  } else if (currentRole === "Bendahara") {
    if (pencairanCount > 0) {
      notifications.push({
        id: "cair-pending",
        title: `${pencairanCount} pinjaman telah disetujui & siap dicairkan`,
        description: "Terbitkan kwitansi dan buat jadwal angsuran anggota.",
        time: "Siap Cair",
        url: "/pencairan",
        unread: true,
        type: "action",
      });
    }
  } else if (currentRole === "Admin Koperasi") {
    if (verifikasiCount > 0) {
      notifications.push({
        id: "admin-ver",
        title: `${verifikasiCount} pengajuan di antrean Verifikasi Juru Bayar`,
        time: "Verifikasi",
        url: "/verifikasi",
        unread: true,
        type: "action",
      });
    }
    if (rekomendasiCount > 0) {
      notifications.push({
        id: "admin-rek",
        title: `${rekomendasiCount} pengajuan di antrean Rekomendasi Dan/Ka`,
        time: "Rekomendasi",
        url: "/rekomendasi",
        unread: true,
        type: "action",
      });
    }
    if (accCount > 0) {
      notifications.push({
        id: "admin-acc",
        title: `${accCount} berkas menunggu Persetujuan ACC Keprim`,
        time: "Persetujuan",
        url: "/acc",
        unread: true,
        type: "action",
      });
    }
    if (pencairanCount > 0) {
      notifications.push({
        id: "admin-cair",
        title: `${pencairanCount} pinjaman siap dicairkan oleh Bendahara`,
        time: "Pencairan",
        url: "/pencairan",
        unread: true,
        type: "action",
      });
    }
  }

  // Common informative system notification
  notifications.push({
    id: "system-satker",
    title: "Sistem Aktif Satker INFOLAHTADAM IV/DIPONEGORO",
    description: "Database terintegrasi dan live synchronization aktif.",
    time: "Terkini",
    unread: false,
    type: "info",
  });

  const unreadCount = notifications.filter((n) => n.unread).length;

  return {
    verifikasiCount,
    rekomendasiCount,
    accCount,
    pencairanCount,
    usersCount,
    getBadgeForUrl,
    notifications,
    unreadCount,
    refetchLoans,
  };
}
