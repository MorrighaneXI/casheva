import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Printer,
  FileSpreadsheet,
  PenLine,
  Shield,
  Loader2,
  FileText,
  Users,
  CreditCard,
  PieChart,
  Receipt,
  BookOpen,
  Calculator,
  RefreshCw,
  Settings2,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  Calendar,
  Layers,
  MapPin,
  Upload,
  Trash2,
  Image as ImageIcon,
  Sliders,
  Maximize2,
  Check,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatRp,
  cleanNamaPersonel,
  sortPersonelByPangkat,
} from "@/lib/casheva-data";
import {
  apiReports,
  apiKopstuk,
  apiTajukTtd,
  apiKeuangan,
} from "@/lib/api";
import { useSession } from "@/components/session-context";
import { SatminkalFilter } from "@/components/satminkal-filter";

export const Route = createFileRoute("/laporan")({
  head: () => ({
    meta: [
      { title: "Laporan & Cetakan Resmi Lampiran — SISKOPAD" },
      {
        name: "description",
        content:
          "Pusat cetak laporan resmi Lampiran II s.d IX sesuai Petunjuk Teknis Koperasi TNI AD 2026.",
      },
      { property: "og:title", content: "Laporan & Cetakan Resmi — SISKOPAD" },
      {
        property: "og:description",
        content: "Cetak dokumen resmi koperasi TNI AD dengan kopstuk dan tajuk tanda tangan dinamis.",
      },
    ],
  }),
  component: LaporanPage,
});

// Margin Configuration Types & Presets
export type MarginPreset = "A" | "B" | "C" | "D" | "E";

export interface MarginConfig {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export const MARGIN_PRESETS: Record<Exclude<MarginPreset, "E">, { name: string; desc: string; config: MarginConfig }> = {
  A: {
    name: "Opsi A — Standar / Normal (Asli)",
    desc: "Top: 2,54 cm | Bottom: 2,54 cm | Left: 2,54 cm | Right: 2,54 cm",
    config: { top: 2.54, bottom: 2.54, left: 2.54, right: 2.54 },
  },
  B: {
    name: "Opsi B — Sempit / Narrow",
    desc: "Top: 1,27 cm | Bottom: 1,27 cm | Left: 1,27 cm | Right: 1,27 cm",
    config: { top: 1.27, bottom: 1.27, left: 1.27, right: 1.27 },
  },
  C: {
    name: "Opsi C — Moderat",
    desc: "Top: 2,54 cm | Bottom: 2,54 cm | Left: 1,27 cm | Right: 1,27 cm",
    config: { top: 2.54, bottom: 2.54, left: 1.27, right: 1.27 },
  },
  D: {
    name: "Opsi D — Lebar / Wide",
    desc: "Top: 2,54 cm | Bottom: 2,54 cm | Left: 3,18 cm | Right: 3,18 cm",
    config: { top: 2.54, bottom: 2.54, left: 3.18, right: 3.18 },
  },
};

// Rekomendasi Format Layout Otomatis per Lampiran
export const RECOMMENDED_ORIENTATION: Record<string, "landscape" | "portrait"> = {
  lampiran2: "landscape",
  lampiran3: "landscape",
  lampiran4: "landscape",
  lampiran5: "landscape",
  lampiran6: "portrait",
  lampiran7: "portrait",
  lampiran8: "landscape",
  lampiran9: "landscape",
};

// Default Kopstuk Per-Lampiran (Masing-masing mandiri)
const DEFAULT_LAMPIRAN_KOPSTUK: Record<string, { line1: string; line2: string }> = {
  lampiran2: { line1: "Lampiran II", line2: "Lomba Rekayasa Teknologi Informasi TA 2026" },
  lampiran3: { line1: "Lampiran III", line2: "Lomba Rekayasa Teknologi Informasi TA 2026" },
  lampiran4: { line1: "Lampiran IV", line2: "Lomba Rekayasa Teknologi Informasi TA 2026" },
  lampiran5: { line1: "Lampiran V", line2: "Lomba Rekayasa Teknologi Informasi TA 2026" },
  lampiran6: { line1: "Lampiran VI", line2: "Lomba Rekayasa Teknologi Informasi TA 2026" },
  lampiran7: { line1: "Lampiran VII", line2: "Lomba Rekayasa Teknologi Informasi TA 2026" },
  lampiran8: { line1: "Lampiran VIII", line2: "Lomba Rekayasa Teknologi Informasi TA 2026" },
  lampiran9: { line1: "Lampiran IX", line2: "Lomba Rekayasa Teknologi Informasi TA 2026" },
};

function formatAngkaDot(val: number): string {
  if (!val && val !== 0) return "-";
  return val.toLocaleString("id-ID");
}

// Generator Brosur 1 s.d 100 Juta (10 Halaman @ 10 Kolom, Tenor 1 s.d 36 Bulan)
function generateBrosurPages() {
  const pages: any[] = [];
  const tenors = Array.from({ length: 36 }, (_, i) => i + 1);

  for (let p = 0; p < 10; p++) {
    const startJuta = p * 10 + 1; // 1, 11, 21, ..., 91
    const endJuta = (p + 1) * 10; // 10, 20, 30, ..., 100
    const pageNominals = Array.from({ length: 10 }, (_, i) => (p * 10 + i + 1) * 1_000_000);
    const title = `BROSUR PINJAMAN PRIMKOP (Rp. ${startJuta.toLocaleString("id-ID")}.000.000 - Rp. ${endJuta.toLocaleString("id-ID")}.000.000)`;

    const rows = tenors.map((tenor) => {
      const rowData: Record<string, any> = { tenor, bulan: tenor };
      for (const nom of pageNominals) {
        const pokok = Math.round(nom / tenor);
        const bunga = Math.round(nom * 0.01); // 1% flat per bulan (12% per tahun)
        rowData[`nom_${nom}`] = pokok + bunga;
      }
      return rowData;
    });

    pages.push({
      pageNumber: p + 1,
      title,
      nominals: pageNominals,
      rows,
    });
  }

  return pages;
}

function LaporanPage() {
  const queryClient = useQueryClient();
  const { satminkal: sessionSatminkal, isKotamaAdmin, isGuestMode } = useSession();
  const currentYear = 2026;
  const [activeTab, setActiveTab] = useState("lampiran2");
  const [selectedSatminkalId, setSelectedSatminkalId] = useState<string>("");

  // Layout & Margin States
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape");
  const [marginPreset, setMarginPreset] = useState<MarginPreset>("A");
  const [customMargin, setCustomMargin] = useState<MarginConfig>({
    top: 2.54,
    bottom: 2.54,
    left: 2.54,
    right: 2.54,
  });

  // Tanda Tangan Image State (Base64 data URL)
  const [ttdImage, setTtdImage] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("casheva_lampiran_ttd_image") || null;
    }
    return null;
  });

  // Kopstuk Kiri (Satuan)
  const [kopKiri1, setKopKiri1] = useState("MARKAS BESAR ANGKATAN DARAT");
  const [kopKiri2, setKopKiri2] = useState("DINAS INFORMASI DAN PENGOLAHAN DATA");

  // Kopstuk Kanan Per-Lampiran (Mandiri masing-masing)
  const [lampiranKopstuk, setLampiranKopstuk] = useState<Record<string, { line1: string; line2: string }>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("casheva_lampiran_kopstuk_map");
      if (saved) {
        try {
          return { ...DEFAULT_LAMPIRAN_KOPSTUK, ...JSON.parse(saved) };
        } catch {
          // fallback
        }
      }
    }
    return DEFAULT_LAMPIRAN_KOPSTUK;
  });

  // Lokasi & Jabatan Kwitansi Dinamis (Lampiran VII)
  const [lokasiKwitansi, setLokasiKwitansi] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("casheva_lokasi_kwitansi") || "Jakarta, 15-06-2026";
    }
    return "Jakarta, 15-06-2026";
  });
  const [jabatanKwitansi, setJabatanKwitansi] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("casheva_jabatan_kwitansi") || "Kaprimkopad,";
    }
    return "Kaprimkopad,";
  });

  // Tajuk TTD State
  const [ttdOpen, setTtdOpen] = useState(false);
  const [kopstukSettingsOpen, setKopstukSettingsOpen] = useState(false);
  const [jabatanTtd, setJabatanTtd] = useState("Kasubdistekinfo\nSelaku\nKalakgiat,");
  const [pejabatTtd, setPejabatTtd] = useState("Sigit Suhendro Hadi K., S.T., M.Tr.(Han)");
  const [pangkatNrpTtd, setPangkatNrpTtd] = useState("Kolonel Inf NRP 11020019460278");

  // Filter & Selector State
  const [brosurPage, setBrosurPage] = useState<number>(1); // 1 s.d 10 (1-10jt s/d 91-100jt)
  const [showAllBrosurPages, setShowAllBrosurPages] = useState<boolean>(false);
  const [kwitansiTahun, setKwitansiTahun] = useState<number>(2025);
  const [kwitansiBulan, setKwitansiBulan] = useState<number>(5); // Mei
  const [selectedAkadDebiturId, setSelectedAkadDebiturId] = useState<string>("default");
  const [selectedKwitansiId, setSelectedKwitansiId] = useState<string>("default");

  // Auto-switch orientation saat ganti lampiran ke rekomendasi lampiran tersebut
  useEffect(() => {
    const rec = RECOMMENDED_ORIENTATION[activeTab] || "landscape";
    setOrientation(rec);
  }, [activeTab]);

  // Compute Active Margin Configuration
  const activeMargin = useMemo<MarginConfig>(() => {
    if (marginPreset === "E") {
      return customMargin;
    }
    return MARGIN_PRESETS[marginPreset]?.config || MARGIN_PRESETS.A.config;
  }, [marginPreset, customMargin]);

  // Upload Tanda Tangan Handler
  const handleUploadTtd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 2 MB!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setTtdImage(base64);
      if (typeof window !== "undefined") {
        localStorage.setItem("casheva_lampiran_ttd_image", base64);
      }
      toast.success("Foto tanda tangan berhasil diunggah!");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveTtd = () => {
    setTtdImage(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("casheva_lampiran_ttd_image");
    }
    toast.info("Tanda tangan dikosongkan.");
  };

  // Queries
  const { data: kopstukData } = useQuery({
    queryKey: ["kopstuk-active"],
    queryFn: () => apiKopstuk.get(),
  });

  const { data: tajukData } = useQuery({
    queryKey: ["tajuk-ttd-active", selectedSatminkalId],
    queryFn: () => apiTajukTtd.get(),
  });

  const { data: reportAnggota, isLoading: loadingAnggota } = useQuery({
    queryKey: ["reports-anggota", selectedSatminkalId],
    queryFn: () => apiReports.getAnggota(selectedSatminkalId || undefined),
  });

  const { data: reportBrosur, isLoading: loadingBrosur } = useQuery({
    queryKey: ["reports-brosur", selectedSatminkalId],
    queryFn: () => apiReports.getBrosurPinjaman(selectedSatminkalId || undefined),
  });

  const { data: reportSimpanan, isLoading: loadingSimpanan } = useQuery({
    queryKey: ["reports-simpanan", selectedSatminkalId],
    queryFn: () => apiReports.getRekapSimpanan(selectedSatminkalId || undefined),
  });

  const { data: reportPinjaman, isLoading: loadingPinjaman } = useQuery({
    queryKey: ["reports-pinjaman", kwitansiTahun, selectedSatminkalId],
    queryFn: () => apiReports.getPinjamanAnggota(kwitansiTahun, selectedSatminkalId || undefined),
  });

  const { data: reportAkad, isLoading: loadingAkad } = useQuery({
    queryKey: ["reports-akad-kredit", selectedAkadDebiturId],
    queryFn: () => apiReports.getAkadKredit(selectedAkadDebiturId),
  });

  const { data: reportKwitansiSingle, isLoading: loadingKwitansiSingle } = useQuery({
    queryKey: ["reports-kwitansi-single", selectedKwitansiId],
    queryFn: () => apiReports.getKwitansi(selectedKwitansiId),
  });

  const { data: reportKwitansiBulanan, isLoading: loadingKwitansiBulanan, refetch: refetchKwitansiBulanan } = useQuery({
    queryKey: ["reports-kwitansi-bulanan", kwitansiTahun, kwitansiBulan, selectedSatminkalId],
    queryFn: () => apiReports.getRekapKwitansiBulanan(kwitansiTahun, kwitansiBulan, selectedSatminkalId || undefined),
  });

  const { data: reportShu, isLoading: loadingShu } = useQuery({
    queryKey: ["reports-shu-anggota", currentYear, selectedSatminkalId],
    queryFn: () => apiReports.getShuAnggota(currentYear, selectedSatminkalId || undefined),
  });

  // Extract arrays (Urut murni berdasarkan hierarki kepangkatan tertinggi TNI AD tanpa membedakan satuan)
  const anggotaList: any[] = useMemo(() => {
    const raw = (reportAnggota as any)?.data || (Array.isArray(reportAnggota) ? reportAnggota : []);
    return sortPersonelByPangkat(raw);
  }, [reportAnggota]);

  const simpananList: any[] = useMemo(() => {
    const raw = (reportSimpanan as any)?.data || (Array.isArray(reportSimpanan) ? reportSimpanan : []);
    return sortPersonelByPangkat(raw);
  }, [reportSimpanan]);

  const pinjamanList: any[] = useMemo(() => {
    const raw = (reportPinjaman as any)?.data || (Array.isArray(reportPinjaman) ? reportPinjaman : []);
    return sortPersonelByPangkat(raw);
  }, [reportPinjaman]);

  const kwitansiBulananList: any[] = useMemo(() => {
    const raw = (reportKwitansiBulanan as any)?.data || (Array.isArray(reportKwitansiBulanan) ? reportKwitansiBulanan : []);
    return sortPersonelByPangkat(raw);
  }, [reportKwitansiBulanan]);

  const shuList: any[] = useMemo(() => {
    const raw = (reportShu as any)?.data || (Array.isArray(reportShu) ? reportShu : []);
    return sortPersonelByPangkat(raw);
  }, [reportShu]);

  // Auto-select first real pinjaman if default or not set
  useEffect(() => {
    if (pinjamanList.length > 0) {
      const exists = pinjamanList.some((p: any) => p.id === selectedAkadDebiturId);
      if (!exists || selectedAkadDebiturId === "default") {
        setSelectedAkadDebiturId(pinjamanList[0].id);
      }
    }
  }, [pinjamanList, selectedAkadDebiturId]);

  // Fallback to selected pinjaman record from pinjamanList
  const selectedPinjamanRecord = useMemo(() => {
    return pinjamanList.find((p: any) => p.id === selectedAkadDebiturId) || pinjamanList[0] || null;
  }, [pinjamanList, selectedAkadDebiturId]);

  const resolvedAkad = useMemo(() => {
    const rawAkad: any = (reportAkad as any)?.data || reportAkad || {};
    const p = selectedPinjamanRecord;

    const nama = rawAkad?.debitur?.nama || p?.nama || "Sigit Suhendro";
    const pangkatKorpsNrp = rawAkad?.debitur?.pangkatKorpsNrp || p?.pktCrpNrp || p?.pangkatKorpsNrp || "Kolonel Inf NRP 11020019460278";
    const jabatan = rawAkad?.debitur?.jabatan || p?.kategoriPangkat || "PAMEN";
    const kesatuan = rawAkad?.debitur?.kesatuan || p?.satminkal || p?.kesatuan || sessionSatminkal || "INFOLAHTADAM IV/DIP";
    const telpHp = rawAkad?.debitur?.telpHp || (p?.nrpNip ? `08${String(p.nrpNip).slice(-9).padStart(9, "0")}` : "081390411711");
    const alamat = "Jl. Perintis Kemerdekaan";

    const nominal = rawAkad?.pinjaman?.plafonPinjaman || p?.jumlahPinjaman || p?.nominal || 20000000;
    const tenor = rawAkad?.pinjaman?.jangkaWaktuBulan || p?.tenorBulan || p?.jgkWkt || 36;
    const sukuBungaTahunan = rawAkad?.pinjaman?.sukuBungaTahunan || 12;
    const sukuBungaBulanan = rawAkad?.pinjaman?.sukuBungaBulanan || 1;
    const tglPinjam = rawAkad?.pinjaman?.tanggalPeminjaman || p?.tglAkad || "10-01-2025";
    const angsuranPerBulan = rawAkad?.pinjaman?.angsuranPerBulan || Math.round(nominal / tenor + (nominal * sukuBungaTahunan) / 1200);

    let jadwal = rawAkad?.jadwal || [];
    if (!jadwal || jadwal.length === 0) {
      const bulanIndo = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      jadwal = [];
      // Row 0
      jadwal.push({
        periode: 0,
        bulan: "-",
        angsuranPokok: 0,
        angsuranBunga: 0,
        angsuranPerBulan: 0,
        sisaPinjaman: nominal,
        keterangan: "",
        paraf: "",
      });

      let sisa = nominal;
      const pokok = Math.round(nominal / tenor);
      const bunga = Math.round((nominal * sukuBungaTahunan) / 1200);

      let baseDate = new Date(2025, 7, 1);
      if (tglPinjam) {
        const str = String(tglPinjam).trim();
        if (str.includes("-")) {
          const parts = str.split("-");
          if (parts[0] && parts[0].length === 4) {
            baseDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]) || 1);
          } else if (parts[2] && parts[2].length === 4) {
            baseDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]) || 1);
          }
        } else {
          const parsed = new Date(str);
          if (!isNaN(parsed.getTime())) baseDate = parsed;
        }
      }

      for (let b = 1; b <= tenor; b++) {
        sisa = b === tenor ? 0 : Math.max(0, sisa - pokok);
        const fDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + b, 1);
        const bName = `${bulanIndo[fDate.getMonth()]} ${fDate.getFullYear()}`;
        jadwal.push({
          periode: b,
          bulan: bName,
          angsuranPokok: pokok,
          angsuranBunga: bunga,
          angsuranPerBulan: pokok + bunga,
          sisaPinjaman: sisa,
          keterangan: b <= 4 ? "diangsur" : "",
          paraf: "",
        });
      }
    }

    const totalPokok = nominal;
    const totalBunga = jadwal.slice(1).reduce((s: number, r: any) => s + (r.angsuranBunga ?? r.bunga ?? 0), 0) || (Math.round((nominal * sukuBungaTahunan) / 1200) * tenor);
    const totalAngsuran = totalPokok + totalBunga;

    return {
      debitur: { nama, pangkatKorpsNrp, jabatan, kesatuan, telpHp, alamat },
      pinjaman: { plafonPinjaman: nominal, jangkaWaktuBulan: tenor, sukuBungaTahunan, sukuBungaBulanan, angsuranPerBulan, tanggalPeminjaman: tglPinjam },
      jadwal,
      totalPokok,
      totalBunga,
      totalAngsuran,
    };
  }, [reportAkad, selectedPinjamanRecord]);

  // Brosur Pages Memoization (1 s.d 100 Juta)
  const allBrosurPages = useMemo(() => {
    if (reportBrosur?.pages && Array.isArray(reportBrosur.pages) && reportBrosur.pages.length > 0) {
      return reportBrosur.pages;
    }
    if ((reportBrosur as any)?.data?.pages && Array.isArray((reportBrosur as any).data.pages) && (reportBrosur as any).data.pages.length > 0) {
      return (reportBrosur as any).data.pages;
    }
    return generateBrosurPages();
  }, [reportBrosur]);

  // Sync Kopstuk from Backend / LocalStorage
  useEffect(() => {
    if (kopstukData) {
      if (kopstukData.baris1 || kopstukData.namaSatuan) {
        setKopKiri1(kopstukData.baris1 || kopstukData.namaSatuan);
      }
      if (kopstukData.baris2 || kopstukData.namaBalak) {
        setKopKiri2(kopstukData.baris2 || kopstukData.namaBalak);
      }
    }
  }, [kopstukData]);

  // Sync Tajuk TTD from Backend
  useEffect(() => {
    if (tajukData) {
      if (tajukData.jabatan) setJabatanTtd(tajukData.jabatan);
      if (tajukData.namaPejabat) setPejabatTtd(tajukData.namaPejabat);
      if (tajukData.pangkatNrp || tajukData.nrp) {
        setPangkatNrpTtd(tajukData.pangkatNrp || `${tajukData.pangkat || ''} NRP ${tajukData.nrp || ''}`.trim());
      }
    }
  }, [tajukData]);

  // Update specific lampiran kopstuk
  const handleUpdateLampiranKopstuk = (key: string, field: "line1" | "line2", value: string) => {
    const updated = {
      ...lampiranKopstuk,
      [key]: {
        ...(lampiranKopstuk[key] || DEFAULT_LAMPIRAN_KOPSTUK[key] || { line1: "", line2: "" }),
        [field]: value,
      },
    };
    setLampiranKopstuk(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("casheva_lampiran_kopstuk_map", JSON.stringify(updated));
    }
  };

  const handleSaveLokasiKwitansi = (newLokasi: string, newJabatan: string) => {
    setLokasiKwitansi(newLokasi);
    setJabatanKwitansi(newJabatan);
    if (typeof window !== "undefined") {
      localStorage.setItem("casheva_lokasi_kwitansi", newLokasi);
      localStorage.setItem("casheva_jabatan_kwitansi", newJabatan);
    }
    toast.success("Lokasi & Jabatan Kwitansi Berhasil Diperbarui!");
  };

  const handlePrint = () => {
    window.print();
  };

  // Navigasi Bulan untuk Lampiran VIII
  const handlePrevMonth = () => {
    if (kwitansiBulan === 1) {
      setKwitansiBulan(12);
      setKwitansiTahun((prev) => prev - 1);
    } else {
      setKwitansiBulan((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (kwitansiBulan === 12) {
      setKwitansiBulan(1);
      setKwitansiTahun((prev) => prev + 1);
    } else {
      setKwitansiBulan((prev) => prev + 1);
    }
  };

  const bulanNamesFull = [
    "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
    "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
  ];

  // Helper Active Kopstuk Kanan
  const currentKopKanan = lampiranKopstuk[activeTab] || DEFAULT_LAMPIRAN_KOPSTUK[activeTab] || {
    line1: "Lampiran",
    line2: "Lomba Rekayasa Teknologi Informasi TA 2026",
  };

  return (
    <div className="space-y-6">
      {/* INJECT DYNAMIC PRINT CSS FOR EXACT A4 ORIENTATION AND CM MARGINS */}
      <style>{`
        @page {
          size: A4 ${orientation};
          margin: ${activeMargin.top}cm ${activeMargin.right}cm ${activeMargin.bottom}cm ${activeMargin.left}cm !important;
        }
        @media print {
          @page {
            size: A4 ${orientation};
            margin: ${activeMargin.top}cm ${activeMargin.right}cm ${activeMargin.bottom}cm ${activeMargin.left}cm !important;
          }
          html, body, #root, main {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .print-document-container {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Page Header (Hidden on Print) */}
      <div className="no-print">
        <PageHeader
          title="Laporan &amp; Cetakan Dokumen Resmi (Lampiran II s.d IX)"
          description="Format cetak dokumen resmi militer sesuai juknis Lampiran Lomba RTI Koperasi TNI AD 2026"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <SatminkalFilter value={selectedSatminkalId} onChange={setSelectedSatminkalId} />
              <Button variant="outline" size="sm" onClick={() => setKopstukSettingsOpen(true)}>
                <Settings2 className="mr-1.5 size-4" /> Atur Kopstuk Dinamis
              </Button>
              <Button variant="outline" size="sm" onClick={() => setTtdOpen(true)}>
                <PenLine className="mr-1.5 size-4" /> Pejabat &amp; Upload TTD
              </Button>
              <Button size="sm" onClick={handlePrint} className="bg-primary hover:bg-primary/90 font-bold shadow-sm">
                <Printer className="mr-1.5 size-4" /> Cetak / Unduh PDF (Hitam Putih)
              </Button>
            </div>
          }
        />
      </div>

      {/* Tabs Navigation (Hidden on Print) */}
      <div className="no-print">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap sm:inline-flex w-full overflow-x-auto justify-start p-1.5 gap-1.5 h-auto max-w-full bg-muted/80 rounded-xl border border-border">
            <TabsTrigger value="lampiran2" className="text-xs py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">
              <Users className="mr-1.5 size-3.5" /> Lampiran II (Anggota)
            </TabsTrigger>
            <TabsTrigger value="lampiran3" className="text-xs py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">
              <FileText className="mr-1.5 size-3.5" /> Lampiran III (Brosur)
            </TabsTrigger>
            <TabsTrigger value="lampiran4" className="text-xs py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">
              <BookOpen className="mr-1.5 size-3.5" /> Lampiran IV (Simpanan)
            </TabsTrigger>
            <TabsTrigger value="lampiran5" className="text-xs py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">
              <CreditCard className="mr-1.5 size-3.5" /> Lampiran V (Pinjaman)
            </TabsTrigger>
            <TabsTrigger value="lampiran6" className="text-xs py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">
              <FileCheck2 className="mr-1.5 size-3.5" /> Lampiran VI (Akad Kredit)
            </TabsTrigger>
            <TabsTrigger value="lampiran7" className="text-xs py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">
              <Receipt className="mr-1.5 size-3.5" /> Lampiran VII (Kwitansi)
            </TabsTrigger>
            <TabsTrigger value="lampiran8" className="text-xs py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">
              <Calendar className="mr-1.5 size-3.5" /> Lampiran VIII (Rekap Kwitansi)
            </TabsTrigger>
            <TabsTrigger value="lampiran9" className="text-xs py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">
              <PieChart className="mr-1.5 size-3.5" /> Lampiran IX (SHU)
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* QUICK TOOLBAR: LAYOUT A4 & MARGIN STANDAR (2.54cm) / CUSTOM & UPLOAD TTD */}
      <div className="no-print bg-card/90 backdrop-blur border border-border rounded-xl p-3.5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Layout Selection with Auto-recommendation indicator */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground">Layout Kertas A4:</span>
            <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/60">
              <button
                type="button"
                onClick={() => setOrientation("landscape")}
                className={`text-xs px-3 py-1 rounded-md font-bold transition-colors flex items-center gap-1.5 ${orientation === "landscape"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
              >
                Landscape
                {RECOMMENDED_ORIENTATION[activeTab] === "landscape" && (
                  <span className={`text-[9px] px-1 py-0.2 rounded font-medium ${orientation === "landscape" ? "bg-white/20 text-white" : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    }`}>
                    Rekomendasi
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setOrientation("portrait")}
                className={`text-xs px-3 py-1 rounded-md font-bold transition-colors flex items-center gap-1.5 ${orientation === "portrait"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
              >
                Portrait
                {RECOMMENDED_ORIENTATION[activeTab] === "portrait" && (
                  <span className={`text-[9px] px-1 py-0.2 rounded font-medium ${orientation === "portrait" ? "bg-white/20 text-white" : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    }`}>
                    Rekomendasi
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Margin Preset Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground">Margin Print:</span>
            <Select value={marginPreset} onValueChange={(v) => setMarginPreset(v as MarginPreset)}>
              <SelectTrigger className="h-8 text-xs w-64 font-semibold bg-background border-border">
                <SelectValue placeholder="Pilih Margin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A" className="text-xs">
                  Opsi A — Standar / Normal (2,54 cm) (Asli)
                </SelectItem>
                <SelectItem value="B" className="text-xs">
                  Opsi B — Sempit / Narrow (1,27 cm)
                </SelectItem>
                <SelectItem value="C" className="text-xs">
                  Opsi C — Moderat (2,54 cm / 1,27 cm)
                </SelectItem>
                <SelectItem value="D" className="text-xs">
                  Opsi D — Lebar / Wide (3,18 cm)
                </SelectItem>
                <SelectItem value="E" className="text-xs font-bold text-primary">
                  Opsi E — Kustom Ukuran Sendiri (Cm)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Signature Status & Quick Upload */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground">Tanda Tangan:</span>
            {ttdImage ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-md font-semibold flex items-center gap-1.5">
                  <ImageIcon className="size-3.5" /> Foto Terpasang
                </span>
                <Button variant="ghost" size="sm" onClick={handleRemoveTtd} className="h-8 text-xs px-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="size-3.5 mr-1" /> Hapus
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-xs px-2.5 py-1 bg-muted text-muted-foreground border border-border rounded-md">
                  Kosong (Manual)
                </span>
                <Button variant="outline" size="sm" onClick={() => setTtdOpen(true)} className="h-8 text-xs px-2.5 font-medium">
                  <Upload className="size-3.5 mr-1" /> Upload Foto TTD
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Opsi E: Custom Margin Inputs [Top] [Bottom] [Left] [Right] */}
        {marginPreset === "E" && (
          <div className="pt-2.5 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/40 p-3 rounded-lg">
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold flex items-center justify-between">
                <span>[Posisi Atur Top]</span>
                <span className="text-primary font-mono">{customMargin.top} cm</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={customMargin.top}
                onChange={(e) => setCustomMargin((prev) => ({ ...prev, top: parseFloat(e.target.value) || 0 }))}
                className="h-8 text-xs font-mono bg-background"
                placeholder="2.54"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold flex items-center justify-between">
                <span>[Posisi Atur Bottom]</span>
                <span className="text-primary font-mono">{customMargin.bottom} cm</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={customMargin.bottom}
                onChange={(e) => setCustomMargin((prev) => ({ ...prev, bottom: parseFloat(e.target.value) || 0 }))}
                className="h-8 text-xs font-mono bg-background"
                placeholder="2.54"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold flex items-center justify-between">
                <span>[Posisi Atur Left]</span>
                <span className="text-primary font-mono">{customMargin.left} cm</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={customMargin.left}
                onChange={(e) => setCustomMargin((prev) => ({ ...prev, left: parseFloat(e.target.value) || 0 }))}
                className="h-8 text-xs font-mono bg-background"
                placeholder="2.54"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold flex items-center justify-between">
                <span>[Posisi Atur Right]</span>
                <span className="text-primary font-mono">{customMargin.right} cm</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={customMargin.right}
                onChange={(e) => setCustomMargin((prev) => ({ ...prev, right: parseFloat(e.target.value) || 0 }))}
                className="h-8 text-xs font-mono bg-background"
                placeholder="2.54"
              />
            </div>
          </div>
        )}
      </div>

      {/* PRINT CONTAINER / SHEET */}
      <div
        className={`print-document-container bg-white text-black rounded-xl shadow-lg border border-border mx-auto font-sans transition-all duration-200 ${orientation === "landscape" ? "max-w-[297mm]" : "max-w-[210mm]"
          }`}
        style={{
          paddingTop: `${activeMargin.top}cm`,
          paddingBottom: `${activeMargin.bottom}cm`,
          paddingLeft: `${activeMargin.left}cm`,
          paddingRight: `${activeMargin.right}cm`,
        }}
      >
        {/* TOP OFFICIAL MILITARY HEADER */}
        <div className="flex justify-between items-start text-xs uppercase font-bold text-black pb-4">
          <div className="text-center space-y-0.5 leading-tight border-b-2 border-black pb-2">
            <p className="text-center">{kopKiri1}</p>
            <p className="text-center">{kopKiri2}</p>
          </div>
          <div className="text-left space-y-0.5 leading-tight border-b-2 border-black pb-2">
            <p className="normal-case">{currentKopKanan.line1}</p>
            <p className="normal-case">{currentKopKanan.line2}</p>
          </div>
        </div>

        {/* TAB 1: LAMPIRAN II — DAFTAR ANGGOTA */}
        {activeTab === "lampiran2" && (
          <div className="mt-4 space-y-4">
            <div className="text-center space-y-1 my-6">
              <h1 className="text-sm font-bold uppercase tracking-wider">DAFTAR ANGGOTA</h1>
              <h2 className="text-xs font-semibold uppercase">DAFTAR ANGGOTA KOPERASI</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] text-black border border-black">
                <thead>
                  <tr className="font-bold text-center uppercase bg-transparent">
                    <th className="border border-black px-2 py-1 w-10">NO</th>
                    <th className="border border-black px-2 py-1 min-w-[160px]">NAMA</th>
                    <th className="border border-black px-2 py-1 min-w-[140px]">PKT/CRP/NRP</th>
                    <th className="border border-black px-2 py-1 min-w-[120px]">KESATUAN</th>
                    <th className="border border-black px-2 py-1 w-28">TMT ANGGOTA</th>
                    <th className="border border-black px-2 py-1 w-24">STATUS</th>
                    <th className="border border-black px-2 py-1 w-20">KET</th>
                  </tr>
                  <tr className="font-normal text-center text-[10px] bg-transparent">
                    <th className="border border-black py-0.5">1</th>
                    <th className="border border-black py-0.5">2</th>
                    <th className="border border-black py-0.5">3</th>
                    <th className="border border-black py-0.5">4</th>
                    <th className="border border-black py-0.5">5</th>
                    <th className="border border-black py-0.5">6</th>
                    <th className="border border-black py-0.5">7</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingAnggota ? (
                    <tr>
                      <td colSpan={7} className="border border-black p-4 text-center">Memuat data anggota...</td>
                    </tr>
                  ) : anggotaList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="border border-black p-4 text-center">Tidak ada data anggota</td>
                    </tr>
                  ) : (
                    anggotaList.map((a: any, idx: number) => (
                      <tr key={a.id || idx}>
                        <td className="border border-black px-2 py-0.5 text-center">{idx + 1}</td>
                        <td className="border border-black px-2 py-0.5 uppercase font-medium">{a.nama}</td>
                        <td className="border border-black px-2 py-0.5 uppercase">{a.pktCrpNrp || a.pangkatKorpsNrp || "-"}</td>
                        <td className="border border-black px-2 py-0.5 text-center">{a.kesatuan || ""}</td>
                        <td className="border border-black px-2 py-0.5 text-center">{a.tmtAnggota || a.tanggalMasuk || "-"}</td>
                        <td className="border border-black px-2 py-0.5 text-center font-semibold">{a.status || (a.isAktif ? "AKTIF" : "TIDAK AKTIF")}</td>
                        <td className="border border-black px-2 py-0.5 text-center">{a.keterangan || ""}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Signature Bottom Right */}
            <SignatureBlock jabatan={jabatanTtd} namaPejabat={pejabatTtd} pangkatNrp={pangkatNrpTtd} ttdImage={ttdImage} />
          </div>
        )}

        {/* TAB 2: LAMPIRAN III — BROSUR PINJAMAN (1M - 100M) */}
        {activeTab === "lampiran3" && (
          <div className="mt-4 space-y-6">
            {/* Toolbar Page Selector (Hidden on print) */}
            <div className="no-print flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/40 rounded-xl border border-border">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-semibold">Pilih Rentang Plafon:</Label>
                <Select value={String(brosurPage)} onValueChange={(v) => setBrosurPage(Number(v))}>
                  <SelectTrigger className="h-8 text-xs w-64 font-bold bg-white text-black">
                    <SelectValue placeholder="Pilih Halaman Plafon" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((p) => {
                      const start = p === 1 ? "1.000.000" : `${(p - 1) * 10 + 1}.000.000`;
                      const end = `${p * 10}.000.000`;
                      return (
                        <SelectItem key={p} value={String(p)} className="text-xs">
                          Halaman {p} (Rp {start} - Rp {end})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={showAllBrosurPages ? "default" : "outline"}
                  onClick={() => setShowAllBrosurPages(!showAllBrosurPages)}
                  className="text-xs h-8"
                >
                  {showAllBrosurPages ? "Tampilkan Per Halaman" : "Tampilkan Semua Halaman (Cetak Lengkap)"}
                </Button>
              </div>
            </div>

            {/* Render single page or all pages */}
            {(showAllBrosurPages
              ? allBrosurPages
              : [allBrosurPages[brosurPage - 1] || allBrosurPages[0]]
            ).map((pageData: any, pIdx: number) => {
              if (!pageData) return null;
              const isFirstPage = showAllBrosurPages ? pIdx === 0 : brosurPage === 1;

              return (
                <div key={pageData.pageNumber || pIdx} className={`space-y-4 ${pIdx > 0 ? "pt-12 page-break-before" : ""}`}>
                  {/* Page Top Number for subsequent pages */}
                  {!isFirstPage && (
                    <div className="text-center text-sm font-bold text-black py-2">
                      {pageData.pageNumber}
                    </div>
                  )}

                  <div className="text-center space-y-1 my-4">
                    <h1 className="text-sm font-bold uppercase tracking-wider">BROSUR PINJAMAN</h1>
                    <h2 className="text-xs font-semibold uppercase">{pageData.title}</h2>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[10px] text-black border border-black">
                      <thead>
                        <tr className="font-bold text-center uppercase bg-[#d1e7dd] text-black">
                          <th className="border border-black px-1.5 py-1 w-24 bg-[#d1e7dd]" rowSpan={2}>
                            JANGKA WKT<br />(BULAN)
                          </th>
                          <th className="border border-black px-1.5 py-1 bg-[#d1e7dd]" colSpan={pageData.nominals?.length || 10}>
                            JUMLAH PINJAMAN
                          </th>
                        </tr>
                        <tr className="font-bold text-center text-[9.5px] bg-[#d1e7dd] text-black">
                          {(pageData.nominals || []).map((nom: number) => (
                            <th key={nom} className="border border-black px-1 py-1 min-w-[70px] bg-[#d1e7dd]">
                              Rp. {formatAngkaDot(nom)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(pageData.rows || []).map((r: any) => (
                          <tr key={r.tenor} className="text-center hover:bg-muted/20">
                            <td className="border border-black py-0.5 font-bold bg-[#d1e7dd]/20">{r.tenor}</td>
                            {(pageData.nominals || []).map((nom: number) => (
                              <td key={nom} className="border border-black px-1 py-0.5 text-right font-normal">
                                {formatAngkaDot(r[`nom_${nom}`])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: LAMPIRAN IV — DAFTAR / REKAP SIMPANAN */}
        {activeTab === "lampiran4" && (
          <div className="mt-4 space-y-4">
            <div className="text-center space-y-1 my-6">
              <h1 className="text-sm font-bold uppercase tracking-wider">DAFTAR / REKAP SIMPANAN</h1>
              <h2 className="text-xs font-semibold uppercase">REKAP SIMPANAN ANGGOTA</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] text-black border border-black">
                <thead>
                  <tr className="font-bold text-center uppercase bg-transparent">
                    <th className="border border-black px-2 py-1 w-10" rowSpan={2}>NO</th>
                    <th className="border border-black px-2 py-1 min-w-[160px]" rowSpan={2}>NAMA</th>
                    <th className="border border-black px-2 py-1 min-w-[140px]" rowSpan={2}>PKT/CRP/NRP</th>
                    <th className="border border-black px-2 py-1 min-w-[120px]" rowSpan={2}>KESATUAN</th>
                    <th className="border border-black px-2 py-0.5" colSpan={3}>SIMPANAN</th>
                    <th className="border border-black px-2 py-1 min-w-[90px]" rowSpan={2}>TOTAL</th>
                  </tr>
                  <tr className="font-bold text-center uppercase text-[10px] bg-transparent">
                    <th className="border border-black px-2 py-0.5 w-24">WAJIB</th>
                    <th className="border border-black px-2 py-0.5 w-24">KHUSUS</th>
                    <th className="border border-black px-2 py-0.5 w-24">SUKARELA</th>
                  </tr>
                  <tr className="font-normal text-center text-[10px] bg-transparent">
                    <th className="border border-black py-0.5">1</th>
                    <th className="border border-black py-0.5">2</th>
                    <th className="border border-black py-0.5">3</th>
                    <th className="border border-black py-0.5">4</th>
                    <th className="border border-black py-0.5">5</th>
                    <th className="border border-black py-0.5">6</th>
                    <th className="border border-black py-0.5">7</th>
                    <th className="border border-black py-0.5">8</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingSimpanan ? (
                    <tr>
                      <td colSpan={8} className="border border-black p-4 text-center">Memuat data simpanan...</td>
                    </tr>
                  ) : simpananList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="border border-black p-4 text-center">Tidak ada data simpanan</td>
                    </tr>
                  ) : (
                    simpananList.map((s: any, idx: number) => (
                      <tr key={s.id || idx}>
                        <td className="border border-black px-2 py-0.5 text-center">{idx + 1}</td>
                        <td className="border border-black px-2 py-0.5 uppercase font-medium">{s.nama}</td>
                        <td className="border border-black px-2 py-0.5 uppercase">{s.pktCrpNrp || s.pangkatKorpsNrp || "-"}</td>
                        <td className="border border-black px-2 py-0.5 text-center">{s.kesatuan || ""}</td>
                        <td className="border border-black px-2 py-0.5 text-right">{formatAngkaDot(s.simpananWajib ?? s.wajib ?? 100000)}</td>
                        <td className="border border-black px-2 py-0.5 text-right">{formatAngkaDot(s.simpananKhusus ?? s.khusus ?? 50000)}</td>
                        <td className="border border-black px-2 py-0.5 text-right">{formatAngkaDot(s.simpananSukarela ?? s.sukarela ?? 900000)}</td>
                        <td className="border border-black px-2 py-0.5 text-right font-bold">{formatAngkaDot(s.total ?? s.totalSimpanan ?? 1050000)}</td>
                      </tr>
                    ))
                  )}
                  {/* FOOTER JUMLAH */}
                  <tr className="font-bold text-center bg-transparent">
                    <td className="border border-black px-2 py-1 text-center" colSpan={4}>JUMLAH</td>
                    <td className="border border-black px-2 py-1 text-right">{formatAngkaDot((reportSimpanan as any)?.totalWajib || 2000000)}</td>
                    <td className="border border-black px-2 py-1 text-right">{formatAngkaDot((reportSimpanan as any)?.totalKhusus || 1000000)}</td>
                    <td className="border border-black px-2 py-1 text-right">{formatAngkaDot((reportSimpanan as any)?.totalSukarela || 16800000)}</td>
                    <td className="border border-black px-2 py-1 text-right font-extrabold">{formatAngkaDot((reportSimpanan as any)?.grandTotal || 19800000)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <SignatureBlock jabatan={jabatanTtd} namaPejabat={pejabatTtd} pangkatNrp={pangkatNrpTtd} ttdImage={ttdImage} />
          </div>
        )}

        {/* TAB 4: LAMPIRAN V — DAFTAR ANGGOTA YANG PUNYA PINJAMAN */}
        {activeTab === "lampiran5" && (
          <div className="mt-4 space-y-4">
            <div className="text-center space-y-1 my-6">
              <h1 className="text-sm font-bold uppercase tracking-wider">DAFTAR ANGGOTA YANG PUNYA PINJAMAN</h1>
              <h2 className="text-xs font-semibold uppercase">DAFTAR ANGGOTA YANG MEMINJAM KOPERASI TAHUN {kwitansiTahun}</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] text-black border border-black">
                <thead>
                  <tr className="font-bold text-center uppercase bg-transparent">
                    <th className="border border-black px-2 py-1 w-10" rowSpan={2}>NO</th>
                    <th className="border border-black px-2 py-1 min-w-[150px]" rowSpan={2}>NAMA</th>
                    <th className="border border-black px-2 py-1 min-w-[130px]" rowSpan={2}>PKT/CRP/NRP</th>
                    <th className="border border-black px-2 py-1 min-w-[110px]" rowSpan={2}>KESATUAN</th>
                    <th className="border border-black px-2 py-1 min-w-[100px]" rowSpan={2}>JUMLAH<br />PINJAMAN</th>
                    <th className="border border-black px-1 py-1 w-20" rowSpan={2}>JGK WKT<br />(BULAN)</th>
                    <th className="border border-black px-2 py-0.5" colSpan={2}>ANGSURAN</th>
                    <th className="border border-black px-2 py-1 w-24" rowSpan={2}>TGL AKAD</th>
                    <th className="border border-black px-2 py-1 w-16" rowSpan={2}>KET</th>
                  </tr>
                  <tr className="font-bold text-center uppercase text-[10px] bg-transparent">
                    <th className="border border-black px-2 py-0.5 w-20">MULAI</th>
                    <th className="border border-black px-2 py-0.5 w-20">SELESAI</th>
                  </tr>
                  <tr className="font-normal text-center text-[10px] bg-transparent">
                    <th className="border border-black py-0.5">1</th>
                    <th className="border border-black py-0.5">2</th>
                    <th className="border border-black py-0.5">3</th>
                    <th className="border border-black py-0.5">4</th>
                    <th className="border border-black py-0.5">5</th>
                    <th className="border border-black py-0.5">6</th>
                    <th className="border border-black py-0.5">7</th>
                    <th className="border border-black py-0.5">8</th>
                    <th className="border border-black py-0.5">9</th>
                    <th className="border border-black py-0.5">10</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingPinjaman ? (
                    <tr>
                      <td colSpan={10} className="border border-black p-4 text-center">Memuat data pinjaman...</td>
                    </tr>
                  ) : pinjamanList.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="border border-black p-4 text-center">Tidak ada data pinjaman</td>
                    </tr>
                  ) : (
                    pinjamanList.map((p: any, idx: number) => (
                      <tr key={p.id || idx}>
                        <td className="border border-black px-2 py-0.5 text-center">{idx + 1}</td>
                        <td className="border border-black px-2 py-0.5 uppercase font-medium">{p.nama}</td>
                        <td className="border border-black px-2 py-0.5 uppercase">{p.pktCrpNrp || p.pangkatKorpsNrp || "-"}</td>
                        <td className="border border-black px-2 py-0.5 text-center">{p.kesatuan || ""}</td>
                        <td className="border border-black px-2 py-0.5 text-right font-medium">{formatAngkaDot(p.jumlahPinjaman ?? p.nominal ?? 10000000)}</td>
                        <td className="border border-black px-2 py-0.5 text-center">{p.jgkWkt ?? p.tenorBulan ?? 10}</td>
                        <td className="border border-black px-2 py-0.5 text-center uppercase">{p.angsuranMulai || "MAR-25"}</td>
                        <td className="border border-black px-2 py-0.5 text-center uppercase">{p.angsuranSelesai || "DES-25"}</td>
                        <td className="border border-black px-2 py-0.5 text-center">{p.tglAkad || "21-02-2025"}</td>
                        <td className="border border-black px-2 py-0.5 text-center">{p.keterangan || ""}</td>
                      </tr>
                    ))
                  )}
                  {/* FOOTER JUMLAH */}
                  <tr className="font-bold text-center bg-transparent">
                    <td className="border border-black px-2 py-1 text-center" colSpan={4}>JUMLAH</td>
                    <td className="border border-black px-2 py-1 text-right font-extrabold">{formatAngkaDot((reportPinjaman as any)?.totalPinjaman || 141000000)}</td>
                    <td className="border border-black px-2 py-1 text-center" colSpan={5}></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <SignatureBlock jabatan={jabatanTtd} namaPejabat={pejabatTtd} pangkatNrp={pangkatNrpTtd} ttdImage={ttdImage} />
          </div>
        )}

        {/* TAB 5: LAMPIRAN VI — RESUME / AKAD KREDIT */}
        {activeTab === "lampiran6" && (
          <div className="mt-4 space-y-6">
            {/* Debitur Selector (Hidden on print) */}
            <div className="no-print flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border">
              <Label className="text-xs font-semibold">Pilih Debitur Akad:</Label>
              <Select value={selectedAkadDebiturId} onValueChange={(val) => setSelectedAkadDebiturId(val)}>
                <SelectTrigger className="h-8 text-xs w-80 font-bold bg-white text-black">
                  <SelectValue placeholder="Pilih Debitur" />
                </SelectTrigger>
                <SelectContent>
                  {pinjamanList.map((p: any) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.nama} — Rp {formatAngkaDot(p.jumlahPinjaman || p.nominal)} ({p.tenorBulan || p.jgkWkt || 10} Bln)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-center my-6">
              <h1 className="text-sm font-bold uppercase tracking-wider">RESUME / AKAD KREDIT</h1>
            </div>

            {/* Debitur Info Section */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-y-1 max-w-xl">
                <div className="grid grid-cols-[180px_10px_1fr]">
                  <span className="font-normal">NAMA</span>
                  <span>:</span>
                  <span className="font-bold uppercase">{resolvedAkad.debitur.nama}</span>
                </div>
                <div className="grid grid-cols-[180px_10px_1fr]">
                  <span className="font-normal">PANGKAT/KORPS/NRP</span>
                  <span>:</span>
                  <span className="font-bold uppercase">{resolvedAkad.debitur.pangkatKorpsNrp}</span>
                </div>
                <div className="grid grid-cols-[180px_10px_1fr]">
                  <span className="font-normal">JABATAN</span>
                  <span>:</span>
                  <span>{resolvedAkad.debitur.jabatan}</span>
                </div>
                <div className="grid grid-cols-[180px_10px_1fr]">
                  <span className="font-normal">KESATUAN</span>
                  <span>:</span>
                  <span>{resolvedAkad.debitur.kesatuan}</span>
                </div>
                <div className="grid grid-cols-[180px_10px_1fr]">
                  <span className="font-normal">TELP/HP</span>
                  <span>:</span>
                  <span>{resolvedAkad.debitur.telpHp}</span>
                </div>
                <div className="grid grid-cols-[180px_10px_1fr]">
                  <span className="font-normal">ALAMAT</span>
                  <span>:</span>
                  <span>{resolvedAkad.debitur.alamat}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-y-1 max-w-xl pt-2">
                <div className="grid grid-cols-[180px_10px_1fr]">
                  <span className="font-normal">PLAFON PINJAMAN</span>
                  <span>:</span>
                  <span className="font-bold">Rp. {formatAngkaDot(resolvedAkad.pinjaman.plafonPinjaman)},-</span>
                </div>
                <div className="grid grid-cols-[180px_10px_1fr]">
                  <span className="font-normal">JANGKA WAKTU</span>
                  <span>:</span>
                  <span className="font-bold">{resolvedAkad.pinjaman.jangkaWaktuBulan} BULAN</span>
                </div>
                <div className="grid grid-cols-[180px_10px_1fr]">
                  <span className="font-normal">SUKU BUNGA TAHUNAN</span>
                  <span>:</span>
                  <span>{resolvedAkad.pinjaman.sukuBungaTahunan} %</span>
                </div>
                <div className="grid grid-cols-[180px_10px_1fr]">
                  <span className="font-normal">SUKU BUNGA BULANAN</span>
                  <span>:</span>
                  <span>{resolvedAkad.pinjaman.sukuBungaBulanan} %</span>
                </div>
                <div className="grid grid-cols-[180px_10px_1fr]">
                  <span className="font-normal">ANGSURAN PERBULAN</span>
                  <span>:</span>
                  <span className="font-bold">Rp. {formatAngkaDot(resolvedAkad.pinjaman.angsuranPerBulan)},- PER BULAN</span>
                </div>
                <div className="grid grid-cols-[180px_10px_1fr]">
                  <span className="font-normal">TANGGAL PEMINJAMAN</span>
                  <span>:</span>
                  <span>{resolvedAkad.pinjaman.tanggalPeminjaman}</span>
                </div>
              </div>
            </div>

            {/* Tabel Jadwal Angsuran & Sisa Pinjaman */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full border-collapse text-[11px] text-black border border-black">
                <thead>
                  <tr className="font-bold text-center uppercase bg-transparent">
                    <th className="border border-black px-2 py-1 w-16" rowSpan={2}>PERIODE</th>
                    <th className="border border-black px-2 py-1 w-24" rowSpan={2}>BULAN</th>
                    <th className="border border-black px-2 py-0.5" colSpan={2}>ANGSURAN</th>
                    <th className="border border-black px-2 py-1 w-28" rowSpan={2}>ANGSURAN<br />PER BULAN</th>
                    <th className="border border-black px-2 py-1 w-28" rowSpan={2}>SISA<br />PINJAMAN</th>
                    <th className="border border-black px-2 py-1 w-24" rowSpan={2}>KET</th>
                    <th className="border border-black px-2 py-1 w-20" rowSpan={2}>PARAF</th>
                  </tr>
                  <tr className="font-bold text-center uppercase text-[10px] bg-transparent">
                    <th className="border border-black px-2 py-0.5 w-24">POKOK</th>
                    <th className="border border-black px-2 py-0.5 w-24">BUNGA</th>
                  </tr>
                </thead>
                <tbody>
                  {resolvedAkad.jadwal.map((j: any) => (
                    <tr key={j.periode} className="text-center">
                      <td className="border border-black py-0.5">{j.periode}</td>
                      <td className="border border-black py-0.5">{j.bulan}</td>
                      <td className="border border-black px-2 py-0.5 text-right">{j.periode === 0 ? "-" : formatAngkaDot(j.angsuranPokok ?? j.pokok)}</td>
                      <td className="border border-black px-2 py-0.5 text-right">{j.periode === 0 ? "-" : formatAngkaDot(j.angsuranBunga ?? j.bunga)}</td>
                      <td className="border border-black px-2 py-0.5 text-right font-medium">{j.periode === 0 ? "-" : formatAngkaDot(j.angsuranPerBulan)}</td>
                      <td className="border border-black px-2 py-0.5 text-right font-medium">{formatAngkaDot(j.sisaPinjaman)}</td>
                      <td className="border border-black px-2 py-0.5 text-center">{j.keterangan || ""}</td>
                      <td className="border border-black px-2 py-0.5 text-center">{j.paraf || ""}</td>
                    </tr>
                  ))}
                  {/* FOOTER JUMLAH */}
                  <tr className="font-bold text-center bg-transparent">
                    <td className="border border-black px-2 py-1 text-center" colSpan={2}>JUMLAH</td>
                    <td className="border border-black px-2 py-1 text-right">{formatAngkaDot(resolvedAkad.totalPokok)}</td>
                    <td className="border border-black px-2 py-1 text-right">{formatAngkaDot(resolvedAkad.totalBunga)}</td>
                    <td className="border border-black px-2 py-1 text-right font-extrabold">{formatAngkaDot(resolvedAkad.totalAngsuran)}</td>
                    <td className="border border-black px-2 py-1 text-center" colSpan={3}></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <SignatureBlock jabatan={jabatanTtd} namaPejabat={pejabatTtd} pangkatNrp={pangkatNrpTtd} ttdImage={ttdImage} />
          </div>
        )}

        {/* TAB 6: LAMPIRAN VII — KWITANSI / INVOICE */}
        {activeTab === "lampiran7" && (
          <div className="mt-4 space-y-6">
            {/* Invoice Selector & Dynamic Location Setting (Hidden on print) */}
            <div className="no-print flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/40 rounded-xl border border-border">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-semibold">Pilih Transaksi Kwitansi:</Label>
                <Select value={selectedKwitansiId} onValueChange={setSelectedKwitansiId}>
                  <SelectTrigger className="h-8 text-xs w-64 font-bold bg-white text-black">
                    <SelectValue placeholder="Pilih Invoice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default" className="text-xs">#INV2506170001 (MULYADI)</SelectItem>
                    {kwitansiBulananList.map((k: any) => (
                      <SelectItem key={k.id} value={k.id} className="text-xs">
                        {k.noKwitansi || k.noInvoice} — {k.nama} (Rp {formatAngkaDot(k.jumlahAngsuran)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8"
                  onClick={() => {
                    const newLok = prompt("Ubah Teks Lokasi & Tanggal Kwitansi:", lokasiKwitansi);
                    if (newLok !== null) {
                      const newJab = prompt("Ubah Jabatan Pengesah:", jabatanKwitansi);
                      handleSaveLokasiKwitansi(newLok, newJab || "Kaprimkopad,");
                    }
                  }}
                >
                  <MapPin className="mr-1.5 size-3.5" /> Ubah Lokasi &amp; Tanggal Kwitansi
                </Button>
              </div>
            </div>

            <div className="text-center my-6">
              <h1 className="text-sm font-bold uppercase tracking-wider">KWITANSI / INVOICE</h1>
            </div>

            {/* Layout Kwitansi Resmi 1:1 Screenshot */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs pt-2">
              {/* Kolom Kiri: Biodata & Detail Tagihan */}
              <div className="space-y-4">
                <p className="font-bold uppercase">KOPSTUK SATUAN</p>

                <div className="space-y-1">
                  <div className="grid grid-cols-[160px_10px_1fr]">
                    <span>NAMA</span>
                    <span>:</span>
                    <span className="font-bold uppercase">{reportKwitansiSingle?.debitur?.nama || "MULYADI"}</span>
                  </div>
                  <div className="grid grid-cols-[160px_10px_1fr]">
                    <span>PANGKAT/KORPS/NRP</span>
                    <span>:</span>
                    <span className="font-bold uppercase">{reportKwitansiSingle?.debitur?.pangkatKorpsNrp || "PELDA / 12345"}</span>
                  </div>
                  <div className="grid grid-cols-[160px_10px_1fr]">
                    <span>JABATAN</span>
                    <span>:</span>
                    <span>{reportKwitansiSingle?.debitur?.jabatan || ""}</span>
                  </div>
                  <div className="grid grid-cols-[160px_10px_1fr]">
                    <span>KESATUAN</span>
                    <span>:</span>
                    <span>{reportKwitansiSingle?.debitur?.kesatuan || ""}</span>
                  </div>
                  <div className="grid grid-cols-[160px_10px_1fr]">
                    <span>TELP/HP</span>
                    <span>:</span>
                    <span>{reportKwitansiSingle?.debitur?.telpHp || "081390411711"}</span>
                  </div>
                </div>

                <div className="space-y-1 pt-4">
                  <div className="grid grid-cols-[160px_10px_1fr]">
                    <span>NO KWITANSI</span>
                    <span>:</span>
                    <span className="font-bold">{reportKwitansiSingle?.kwitansi?.noKwitansi || "#INV2506170001"}</span>
                  </div>
                  <div className="grid grid-cols-[160px_10px_1fr]">
                    <span>NO TRANSAKSI</span>
                    <span>:</span>
                    <span>{reportKwitansiSingle?.kwitansi?.noTransaksi || "2506090001"}</span>
                  </div>
                  <div className="grid grid-cols-[160px_10px_1fr]">
                    <span>PLAFON PINJAMAN</span>
                    <span>:</span>
                    <span className="font-bold">Rp. {formatAngkaDot(reportKwitansiSingle?.kwitansi?.plafonPinjaman || 10000000)},-</span>
                  </div>
                  <div className="grid grid-cols-[160px_10px_1fr]">
                    <span>JANGKA WAKTU</span>
                    <span>:</span>
                    <span>{reportKwitansiSingle?.kwitansi?.jangkaWaktu || "10 BULAN"}</span>
                  </div>
                  <div className="grid grid-cols-[160px_10px_1fr]">
                    <span>JATUH TEMPO</span>
                    <span>:</span>
                    <span>{reportKwitansiSingle?.kwitansi?.jatuhTempo || "10-05-2025"}</span>
                  </div>
                  <div className="grid grid-cols-[160px_10px_1fr]">
                    <span>TANGGAL PEMBAYARAN</span>
                    <span>:</span>
                    <span>{reportKwitansiSingle?.kwitansi?.tanggalPembayaran || "01-05-2025"}</span>
                  </div>
                  <div className="grid grid-cols-[160px_10px_1fr]">
                    <span>ANGSURAN KE</span>
                    <span>:</span>
                    <span className="font-bold">{reportKwitansiSingle?.kwitansi?.angsuranKe || "3 / 10"}</span>
                  </div>
                  <div className="grid grid-cols-[160px_10px_1fr]">
                    <span>ANGSURAN PERBULAN</span>
                    <span>:</span>
                    <span>Rp. {formatAngkaDot(reportKwitansiSingle?.kwitansi?.angsuranPerBulan || 1100000)},-</span>
                  </div>
                  <div className="grid grid-cols-[160px_10px_1fr]">
                    <span>ADMINISTRASI</span>
                    <span>:</span>
                    <span>Rp. {formatAngkaDot(reportKwitansiSingle?.kwitansi?.administrasi || 5000)},-</span>
                  </div>
                  <div className="grid grid-cols-[160px_10px_1fr]">
                    <span className="font-bold">JUMLAH TAGIHAN</span>
                    <span>:</span>
                    <span className="font-extrabold">Rp. {formatAngkaDot(reportKwitansiSingle?.kwitansi?.jumlahTagihan || 1105000)},-</span>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Tempat & Jabatan Dinamis + Signature */}
              <div className="flex flex-col justify-between items-center text-center">
                <div className="space-y-0.5">
                  <p className="font-medium text-xs">{lokasiKwitansi}</p>
                  <p className="font-semibold text-xs">{jabatanKwitansi}</p>
                </div>

                <div className="mt-8 space-y-0.5 text-center">
                  <div className="h-16 flex items-center justify-center my-1">
                    {ttdImage ? (
                      <img
                        src={ttdImage}
                        alt="Tanda Tangan"
                        className="max-h-16 max-w-[170px] object-contain select-none"
                      />
                    ) : (
                      <div className="h-16 w-48 flex items-center justify-center" />
                    )}
                  </div>
                  <p className="font-bold text-xs">{pejabatTtd || "Sigit Suhendro Hadi K., S.T., M.Tr.(Han)"}</p>
                  <p className="font-normal text-xs">{pangkatNrpTtd || "Kolonel Inf NRP 11020019460278"}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: LAMPIRAN VIII — DAFTAR / REKAP KWITANSI BULANAN */}
        {activeTab === "lampiran8" && (
          <div className="mt-4 space-y-4">
            {/* Toolbar Month Selector (Hidden on print) */}
            <div className="no-print flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/40 rounded-xl border border-border">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handlePrevMonth} className="h-8 gap-1 text-xs">
                  <ChevronLeft className="size-4" /> Bulan Sebelumnya
                </Button>
                <Select value={String(kwitansiBulan)} onValueChange={(v) => setKwitansiBulan(Number(v))}>
                  <SelectTrigger className="h-8 text-xs w-40 font-bold bg-white text-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bulanNamesFull.map((bName, idx) => (
                      <SelectItem key={idx + 1} value={String(idx + 1)} className="text-xs">
                        {bName} {kwitansiTahun}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={handleNextMonth} className="h-8 gap-1 text-xs">
                  Bulan Selanjutnya <ChevronRight className="size-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs font-semibold">Tahun:</Label>
                <Input
                  type="number"
                  value={kwitansiTahun}
                  onChange={(e) => setKwitansiTahun(Number(e.target.value))}
                  className="h-8 w-24 text-xs font-bold bg-white text-black"
                />
                <Button size="sm" variant="ghost" onClick={() => refetchKwitansiBulanan()} className="h-8">
                  <RefreshCw className="size-3.5" />
                </Button>
              </div>
            </div>

            <div className="text-center space-y-1 my-6">
              <h1 className="text-sm font-bold uppercase tracking-wider">DAFTAR / REKAP KWITANSI BULANAN</h1>
              <h2 className="text-xs font-semibold uppercase">
                DAFTAR KWITANSI BULAN {bulanNamesFull[kwitansiBulan - 1]} TAHUN {kwitansiTahun}
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] text-black border border-black">
                <thead>
                  <tr className="font-bold text-center uppercase bg-transparent">
                    <th className="border border-black px-1.5 py-1 w-10">NO</th>
                    <th className="border border-black px-2 py-1 w-32">NO KWITANSI</th>
                    <th className="border border-black px-2 py-1 w-28">NO TRANS</th>
                    <th className="border border-black px-2 py-1 min-w-[150px]">NAMA</th>
                    <th className="border border-black px-2 py-1 min-w-[130px]">PKT/CRP/NRP</th>
                    <th className="border border-black px-2 py-1 min-w-[110px]">KESATUAN</th>
                    <th className="border border-black px-2 py-1 w-28">JUMLAH<br />PINJAMAN</th>
                    <th className="border border-black px-2 py-1 w-28">JUMLAH<br />ANGSURAN</th>
                    <th className="border border-black px-2 py-1 w-20">ANGSURAN<br />KE/DARI</th>
                    <th className="border border-black px-2 py-1 w-24">JATUH<br />TEMPO</th>
                  </tr>
                  <tr className="font-normal text-center text-[10px] bg-transparent">
                    <th className="border border-black py-0.5">1</th>
                    <th className="border border-black py-0.5">2</th>
                    <th className="border border-black py-0.5">3</th>
                    <th className="border border-black py-0.5">4</th>
                    <th className="border border-black py-0.5">5</th>
                    <th className="border border-black py-0.5">6</th>
                    <th className="border border-black py-0.5">7</th>
                    <th className="border border-black py-0.5">8</th>
                    <th className="border border-black py-0.5">9</th>
                    <th className="border border-black py-0.5">10</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingKwitansiBulanan ? (
                    <tr>
                      <td colSpan={10} className="border border-black p-4 text-center">Memuat rekap kwitansi bulanan...</td>
                    </tr>
                  ) : kwitansiBulananList.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="border border-black p-4 text-center">Tidak ada transaksi kwitansi pada bulan ini</td>
                    </tr>
                  ) : (
                    kwitansiBulananList.map((k: any, idx: number) => (
                      <tr key={k.id || idx}>
                        <td className="border border-black px-1.5 py-0.5 text-center">{idx + 1}</td>
                        <td className="border border-black px-2 py-0.5 font-mono text-center">{k.noKwitansi || k.noInvoice}</td>
                        <td className="border border-black px-2 py-0.5 font-mono text-center">{k.noTrans || k.pinjamanId || "-"}</td>
                        <td className="border border-black px-2 py-0.5 uppercase font-medium">{k.nama}</td>
                        <td className="border border-black px-2 py-0.5 uppercase">{k.pktCrpNrp || k.pangkatKorpsNrp || "-"}</td>
                        <td className="border border-black px-2 py-0.5 text-center">{k.kesatuan || ""}</td>
                        <td className="border border-black px-2 py-0.5 text-right font-medium">{formatAngkaDot(k.jumlahPinjaman || 10000000)}</td>
                        <td className="border border-black px-2 py-0.5 text-right font-bold">{formatAngkaDot(k.jumlahAngsuran || 1100000)}</td>
                        <td className="border border-black px-2 py-0.5 text-center">{k.angsuranKeDari || "3/10"}</td>
                        <td className="border border-black px-2 py-0.5 text-center">{k.jatuhTempo || "10-05-2025"}</td>
                      </tr>
                    ))
                  )}
                  {/* FOOTER JUMLAH */}
                  <tr className="font-bold text-center bg-transparent">
                    <td className="border border-black px-2 py-1 text-center" colSpan={7}>JUMLAH</td>
                    <td className="border border-black px-2 py-1 text-right font-extrabold">{formatAngkaDot((reportKwitansiBulanan as any)?.totalJumlah || 4410000)}</td>
                    <td className="border border-black px-2 py-1 text-center" colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <SignatureBlock jabatan={jabatanTtd} namaPejabat={pejabatTtd} pangkatNrp={pangkatNrpTtd} ttdImage={ttdImage} />
          </div>
        )}

        {/* TAB 8: LAMPIRAN IX — SHU ANGGOTA */}
        {activeTab === "lampiran9" && (
          <div className="mt-4 space-y-4">
            <div className="text-center space-y-1 my-6">
              <h1 className="text-sm font-bold uppercase tracking-wider">SHU ANGGOTA</h1>
              <h2 className="text-xs font-semibold uppercase">SHU ANGGOTA KOPERASI</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] text-black border border-black">
                <thead>
                  <tr className="font-bold text-center uppercase bg-transparent">
                    <th className="border border-black px-2 py-1 w-10">NO</th>
                    <th className="border border-black px-2 py-1 min-w-[160px]">NAMA</th>
                    <th className="border border-black px-2 py-1 min-w-[140px]">PKT/CRP/NRP</th>
                    <th className="border border-black px-2 py-1 w-28">SIMPANAN</th>
                    <th className="border border-black px-2 py-1 w-28">PINJAMAN</th>
                    <th className="border border-black px-2 py-1 w-28">SHU MODAL</th>
                    <th className="border border-black px-2 py-1 w-28">SHU USAHA</th>
                    <th className="border border-black px-2 py-1 w-28">TOTAL SHU</th>
                  </tr>
                  <tr className="font-normal text-center text-[10px] bg-transparent">
                    <th className="border border-black py-0.5">1</th>
                    <th className="border border-black py-0.5">2</th>
                    <th className="border border-black py-0.5">3</th>
                    <th className="border border-black py-0.5">4</th>
                    <th className="border border-black py-0.5">5</th>
                    <th className="border border-black py-0.5">6</th>
                    <th className="border border-black py-0.5">7</th>
                    <th className="border border-black py-0.5">8</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingShu ? (
                    <tr>
                      <td colSpan={8} className="border border-black p-4 text-center">Memuat data SHU...</td>
                    </tr>
                  ) : shuList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="border border-black p-4 text-center">Data SHU belum diterbitkan</td>
                    </tr>
                  ) : (
                    shuList.map((r: any, idx: number) => (
                      <tr key={r.id || idx}>
                        <td className="border border-black px-2 py-0.5 text-center">{idx + 1}</td>
                        <td className="border border-black px-2 py-0.5 uppercase font-medium">{r.nama}</td>
                        <td className="border border-black px-2 py-0.5 uppercase">{r.pktCrpNrp || r.pangkatKorpsNrp || "-"}</td>
                        <td className="border border-black px-2 py-0.5 text-right font-medium">{formatAngkaDot(r.simpanan || 1050000)}</td>
                        <td className="border border-black px-2 py-0.5 text-right font-medium">{formatAngkaDot(r.pinjaman || 10000000)}</td>
                        <td className="border border-black px-2 py-0.5 text-right">{formatAngkaDot(r.shuModal || r.jasaModal || 150000)}</td>
                        <td className="border border-black px-2 py-0.5 text-right">{formatAngkaDot(r.shuUsaha || r.jasaUsaha || 250000)}</td>
                        <td className="border border-black px-2 py-0.5 text-right font-bold">{formatAngkaDot(r.totalShu || r.total || 400000)}</td>
                      </tr>
                    ))
                  )}
                  {/* FOOTER JUMLAH */}
                  {(() => {
                    const totSimpanan = shuList.reduce((s: number, r: any) => s + (r.simpanan || 1050000), 0);
                    const totPinjaman = shuList.reduce((s: number, r: any) => s + (r.pinjaman || 10000000), 0);
                    const totShuModal = shuList.reduce((s: number, r: any) => s + (r.shuModal || r.jasaModal || 150000), 0);
                    const totShuUsaha = shuList.reduce((s: number, r: any) => s + (r.shuUsaha || r.jasaUsaha || 250000), 0);
                    const totTotalShu = shuList.reduce((s: number, r: any) => s + (r.totalShu || r.total || 400000), 0);
                    return (
                      <tr className="font-bold text-center bg-transparent">
                        <td className="border border-black px-2 py-1 text-center" colSpan={3}>JUMLAH</td>
                        <td className="border border-black px-2 py-1 text-right">{formatAngkaDot(totSimpanan)}</td>
                        <td className="border border-black px-2 py-1 text-right">{formatAngkaDot(totPinjaman)}</td>
                        <td className="border border-black px-2 py-1 text-right">{formatAngkaDot(totShuModal)}</td>
                        <td className="border border-black px-2 py-1 text-right">{formatAngkaDot(totShuUsaha)}</td>
                        <td className="border border-black px-2 py-1 text-right font-extrabold">{formatAngkaDot(totTotalShu)}</td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>

            <SignatureBlock jabatan={jabatanTtd} namaPejabat={pejabatTtd} pangkatNrp={pangkatNrpTtd} ttdImage={ttdImage} />
          </div>
        )}

      </div>

      {/* SHEET PENGATURAN KOPSTUK DINAMIS PER-LAMPIRAN */}
      <Sheet open={kopstukSettingsOpen} onOpenChange={setKopstukSettingsOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Pengaturan Kopstuk Dinamis Per-Lampiran</SheetTitle>
            <SheetDescription>
              Ubah kopstuk kiri satuan dan kopstuk kanan masing-masing lampiran secara mandiri
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-6 px-1 py-4">
            {/* Kopstuk Kiri Satuan */}
            <div className="space-y-3 p-3 bg-muted/40 rounded-xl border border-border">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Kopstuk Kiri (Satuan / Balak)</p>
              <div className="space-y-2">
                <Label className="text-xs">Baris 1 (Komando Atas):</Label>
                <Input value={kopKiri1} onChange={(e) => setKopKiri1(e.target.value)} placeholder="MARKAS BESAR ANGKATAN DARAT" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Baris 2 (Balakpus / Dinas):</Label>
                <Input value={kopKiri2} onChange={(e) => setKopKiri2(e.target.value)} placeholder="DINAS INFORMASI DAN PENGOLAHAN DATA" />
              </div>
            </div>

            {/* Kopstuk Kanan Per Lampiran */}
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Kopstuk Kanan Masing-Masing Lampiran</p>

              {Object.keys(DEFAULT_LAMPIRAN_KOPSTUK).map((lampKey) => {
                const cfg = lampiranKopstuk[lampKey] || DEFAULT_LAMPIRAN_KOPSTUK[lampKey] || { line1: "", line2: "" };
                const label = lampKey.replace("lampiran", "Lampiran ");
                return (
                  <div key={lampKey} className="p-3 bg-card rounded-xl border border-border space-y-2">
                    <p className="text-xs font-bold uppercase">{label}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[11px]">Baris 1:</Label>
                        <Input
                          value={cfg?.line1 ?? ""}
                          onChange={(e) => handleUpdateLampiranKopstuk(lampKey, "line1", e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px]">Baris 2:</Label>
                        <Input
                          value={cfg?.line2 ?? ""}
                          onChange={(e) => handleUpdateLampiranKopstuk(lampKey, "line2", e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Lokasi & Jabatan Kwitansi */}
            <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Pengaturan Khusus Kwitansi (Lampiran VII)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px]">Lokasi &amp; Tanggal:</Label>
                  <Input value={lokasiKwitansi} onChange={(e) => setLokasiKwitansi(e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Jabatan Pengesah:</Label>
                  <Input value={jabatanKwitansi} onChange={(e) => setJabatanKwitansi(e.target.value)} className="h-8 text-xs" />
                </div>
              </div>
            </div>

            <Button
              className="w-full font-bold"
              onClick={() => {
                handleSaveLokasiKwitansi(lokasiKwitansi, jabatanKwitansi);
                setKopstukSettingsOpen(false);
              }}
            >
              Simpan Semua Konfigurasi Kopstuk
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* SHEET PEJABAT & UPLOAD TANDA TANGAN */}
      <Sheet open={ttdOpen} onOpenChange={setTtdOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Pejabat &amp; Upload Tanda Tangan</SheetTitle>
            <SheetDescription>
              Sesuaikan data pejabat penandatangan dan unggah foto tanda tangan resmi (PNG/JPG/WebP)
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-5 px-1 py-4">
            {/* Foto Tanda Tangan Section */}
            <div className="p-3.5 bg-muted/40 rounded-xl border border-border space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase text-primary">Foto Tanda Tangan Resmi</Label>
                {ttdImage && (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded border border-emerald-500/30">
                    Aktif
                  </span>
                )}
              </div>

              {ttdImage ? (
                <div className="space-y-2.5">
                  <div className="h-28 bg-white rounded-lg border border-border flex items-center justify-center p-2 shadow-inner">
                    <img src={ttdImage} alt="Preview Tanda Tangan" className="max-h-24 max-w-full object-contain" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                        onChange={handleUploadTtd}
                      />
                      <span className="inline-flex items-center justify-center w-full h-8 text-xs font-semibold rounded-md border border-input bg-background hover:bg-muted transition-colors">
                        <Upload className="size-3.5 mr-1.5" /> Ganti Foto TTD
                      </span>
                    </label>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveTtd}
                      className="h-8 text-xs"
                    >
                      <Trash2 className="size-3.5 mr-1" /> Hapus (Kosongkan)
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-border hover:border-primary/60 rounded-lg cursor-pointer bg-background hover:bg-muted/30 transition-colors p-4 text-center">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      onChange={handleUploadTtd}
                    />
                    <Upload className="size-6 text-muted-foreground mb-1.5" />
                    <span className="text-xs font-semibold">Klik untuk Unggah Foto Tanda Tangan</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">Format PNG, JPG, atau WebP (Maks. 2MB)</span>
                  </label>
                  <p className="text-[11px] text-muted-foreground italic text-center">
                    Jika tidak diunggah, kolom tanda tangan akan dibiarkan <strong>KOSONG</strong> untuk tanda tangan basah real life.
                  </p>
                </div>
              )}
            </div>

            {/* Pejabat Fields */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Jabatan Penandatangan (Bisa Multi-baris):</Label>
                <textarea
                  value={jabatanTtd}
                  onChange={(e) => setJabatanTtd(e.target.value)}
                  rows={3}
                  className="w-full p-2 text-xs rounded-lg border border-border bg-background"
                  placeholder="Kasubdistekinfo&#10;Selaku&#10;Kalakgiat,"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nama Lengkap &amp; Gelar:</Label>
                <Input value={pejabatTtd} onChange={(e) => setPejabatTtd(e.target.value)} placeholder="Sigit Suhendro Hadi K., S.T., M.Tr.(Han)" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Pangkat &amp; NRP:</Label>
                <Input value={pangkatNrpTtd} onChange={(e) => setPangkatNrpTtd(e.target.value)} placeholder="Kolonel Inf NRP 11020019460278" />
              </div>
            </div>

            <Button
              className="w-full font-bold mt-4"
              onClick={() => {
                toast.success("Pengaturan Pejabat & Tanda Tangan Berhasil Diterapkan!");
                setTtdOpen(false);
              }}
            >
              Simpan &amp; Terapkan
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Komponen Tanda Tangan Resmi Sesuai PDF (Dinamis: Upload Foto atau Kosong untuk TTD Basah)
function SignatureBlock({
  jabatan,
  namaPejabat,
  pangkatNrp,
  ttdImage,
}: {
  jabatan: string;
  namaPejabat: string;
  pangkatNrp: string;
  ttdImage?: string | null;
}) {
  const jabatanLines = (jabatan || "Kasubdistekinfo\nSelaku\nKalakgiat,").split("\n");

  return (
    <div className="mt-8 flex justify-end">
      <div className="w-64 text-center text-xs space-y-0.5 text-black">
        {jabatanLines.map((line, idx) => (
          <p key={idx} className="font-normal">{line}</p>
        ))}
        {/* Tanda Tangan Area (Foto TTD atau Ruang Kosong untuk TTD Basah) */}
        <div className="h-16 flex items-center justify-center my-1">
          {ttdImage ? (
            <img
              src={ttdImage}
              alt="Tanda Tangan Pejabat"
              className="max-h-16 max-w-[170px] object-contain select-none"
            />
          ) : (
            <div className="h-16 w-full flex items-center justify-center">
              {/* Dikosongkan agar pengangsur/pejabat dapat menandatangani secara real life */}
            </div>
          )}
        </div>
        <p className="font-bold text-xs">{namaPejabat || "Sigit Suhendro Hadi K., S.T., M.Tr.(Han)"}</p>
        <p className="font-normal text-xs">{pangkatNrp || "Kolonel Inf NRP 11020019460278"}</p>
      </div>
    </div>
  );
}
