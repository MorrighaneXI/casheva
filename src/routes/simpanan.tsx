import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  RefreshCw,
  CheckCircle2,
  FileSpreadsheet,
  Settings2,
  Save,
  Filter,
  PiggyBank,
  Wallet,
  Coins,
  Copy,
  Upload,
  Download,
  AlertCircle,
  FileCheck,
  Calendar,
  Check,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { useSession } from "@/components/session-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatRp, formatPangkatKorps, cleanNamaPersonel, formatNamaLengkapDinas, sortPersonelByPangkat } from "@/lib/casheva-data";
import { apiAnggota, apiSimpanan, type SimpananRekapItem } from "@/lib/api";
import { exportToCSV } from "@/lib/export-excel";

export const Route = createFileRoute("/simpanan")({
  head: () => ({
    meta: [
      { title: "Transaksi & Rekap Simpanan — Casheva Koperasi TNI AD" },
      {
        name: "description",
        content:
          "Kelola simpanan pokok, wajib, sukarela, dan simpanan khusus dengan pengaturan nominal dinamis oleh Bendahara.",
      },
      { property: "og:title", content: "Transaksi Simpanan — Casheva" },
      {
        property: "og:description",
        content: "Mutasi simpanan anggota koperasi TNI AD dan ekspor excel bulanan.",
      },
    ],
  }),
  component: SimpananPage,
});

const BULAN_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const SUKARELA_RATES: Record<string, number> = {
  PATI: 500_000,
  PAMEN: 300_000,
  PAMA: 250_000,
  BINTARA: 200_000,
  BATA_ASN: 150_000,
  PNS: 150_000,
};

const SUKARELA_RATE_LABELS: Record<string, string> = {
  PATI: "Perwira Tinggi (Pati)",
  PAMEN: "Perwira Menengah (Pamen)",
  PAMA: "Perwira Pertama (Pama)",
  BINTARA: "Bintara",
  BATA_ASN: "Tamtama / ASN",
  PNS: "PNS",
};

const KHUSUS_TIPE_OPTIONS = [
  "Simpanan Qurban",
  "Simpanan Hari Raya / THR",
  "Simpanan Wisata",
  "Dana Khusus Pendidikan",
  "Dana Khusus Lainnya",
];

function SimpananPage() {
  const queryClient = useQueryClient();
  const { role, isAdmin, user } = useSession();
  const isBendaharaOrAdmin = isAdmin || role === "Bendahara" || role === "Admin Koperasi";
  const isJuruBayar = role === "Juru Bayar";
  const isJuruBayarOrAbove = isBendaharaOrAdmin || isJuruBayar;

  const [activeTab, setActiveTab] = useState<"saldo" | "upload-excel" | "bulanan" | "pengaturan">("saldo");
  const [search, setSearch] = useState("");

  // Filter Rekap Bulanan
  const currentDate = new Date();
  const [selectedBulan, setSelectedBulan] = useState<number>(currentDate.getMonth() + 1);
  const [selectedTahun, setSelectedTahun] = useState<number>(currentDate.getFullYear());

  // Dialog Setor Simpanan Dinamis (Bendahara)
  const [openSetorModal, setOpenSetorModal] = useState(false);
  const [setorAnggotaId, setSetorAnggotaId] = useState("");
  const [setorJenis, setSetorJenis] = useState<"POKOK" | "WAJIB" | "SUKARELA" | "KHUSUS">("WAJIB");
  const [setorNominal, setSetorNominal] = useState(100_000);
  const [setorKeterangan, setSetorKeterangan] = useState("");

  // === Modal Simpanan Sukarela Manual (Juru Bayar / Bendahara / Admin) ===
  const [openSukarelaModal, setOpenSukarelaModal] = useState(false);
  const [sukarelaAnggotaId, setSukarelaAnggotaId] = useState("");
  const [sukarelaNominal, setSukarelaNominal] = useState(150_000);
  const [sukarelaKeterangan, setSukarelaKeterangan] = useState("");

  // === Modal Simpanan Khusus (Bendahara / Admin Only) ===
  const [openKhususModal, setOpenKhususModal] = useState(false);
  const [khususAnggotaId, setKhususAnggotaId] = useState("");
  const [khususNominal, setKhususNominal] = useState(100_000);
  const [khususTipeKeterangan, setKhususTipeKeterangan] = useState("Simpanan Qurban");
  const [khususKeterangan, setKhususKeterangan] = useState("");

  // State Pengaturan Dinamis Simpanan
  const [editPokok, setEditPokok] = useState<number>(50_000);
  const [editWajib, setEditWajib] = useState<number>(100_000);
  const [editKhusus, setEditKhusus] = useState<number>(0);

  // Batch Upload Excel Simpanan State
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [parsedRates, setParsedRates] = useState<
    {
      golongan: string;
      nominalPokok: number;
      nominalWajib: number;
      count: number;
      subtotalPokok: number;
      subtotalWajib: number;
    }[]
  >([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [batchPeriodeBulan, setBatchPeriodeBulan] = useState<number>(currentDate.getMonth() + 1);
  const [batchPeriodeTahun, setBatchPeriodeTahun] = useState<number>(currentDate.getFullYear());
  const [lastBatchResult, setLastBatchResult] = useState<any | null>(null);
  const [searchBatchResult, setSearchBatchResult] = useState("");

  // CRUD Alert Confirmation States
  const [openConfirmUpload, setOpenConfirmUpload] = useState(false);
  const [openConfirmSetor, setOpenConfirmSetor] = useState(false);
  const [openConfirmPengaturan, setOpenConfirmPengaturan] = useState(false);
  const [openConfirmSukarela, setOpenConfirmSukarela] = useState(false);
  const [openConfirmKhusus, setOpenConfirmKhusus] = useState(false);

  // Queries
  const { data: rekapList = [], isLoading: loadingSaldo } = useQuery({
    queryKey: ["simpanan-rekap"],
    queryFn: () => apiSimpanan.getRekap(),
  });

  const { data: anggotaList = [] } = useQuery({
    queryKey: ["anggota-list"],
    queryFn: () => apiAnggota.findAll(true),
  });

  const { data: pengaturanSimpanan } = useQuery({
    queryKey: ["pengaturan-simpanan"],
    queryFn: async () => {
      const res = await apiSimpanan.getPengaturan();
      if (res) {
        setEditPokok(res.nominalSimpananPokok ?? 50_000);
        setEditWajib(res.nominalSimpananWajib ?? 100_000);
        setEditKhusus(res.nominalSimpananKhusus ?? 0);
      }
      return res;
    },
  });

  const { data: rekapBulananList = [], isLoading: loadingBulanan } = useQuery({
    queryKey: ["simpanan-rekap-bulanan", selectedBulan, selectedTahun],
    queryFn: () => apiSimpanan.getRekapBulanan(selectedBulan, selectedTahun),
  });

  // Mutations
  const massalMutation = useMutation({
    mutationFn: () => apiSimpanan.sukarelaMassal(),
    onSuccess: (res) => {
      toast.success("Simpanan Sukarela Massal Berhasil", {
        description: `${res.message} - Total: ${formatRp(res.totalNominal)}`,
      });
      queryClient.invalidateQueries({ queryKey: ["simpanan-rekap"] });
      queryClient.invalidateQueries({ queryKey: ["simpanan-rekap-bulanan"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
    onError: (err: any) => {
      toast.error("Gagal menjalankan potongan massal", { description: err.message });
    },
  });

  const updatePengaturanMutation = useMutation({
    mutationFn: () =>
      apiSimpanan.updatePengaturan({
        nominalPokok: editPokok,
        nominalWajib: editWajib,
        nominalKhusus: editKhusus,
      }),
    onSuccess: () => {
      toast.success("Pengaturan Nominal Simpanan Berhasil Disimpan", {
        description: `Pokok: ${formatRp(editPokok)}, Wajib: ${formatRp(editWajib)}, Khusus: ${formatRp(editKhusus)}`,
      });
      queryClient.invalidateQueries({ queryKey: ["pengaturan-simpanan"] });
    },
    onError: (err: any) => {
      toast.error("Gagal menyimpan pengaturan", { description: err.message });
    },
  });

  const setorDinamisMutation = useMutation({
    mutationFn: () =>
      apiSimpanan.setor({
        anggotaId: setorAnggotaId,
        jenis: setorJenis,
        nominal: setorNominal,
        keterangan: setorKeterangan || `Setoran ${setorJenis.toLowerCase()} oleh Bendahara`,
      }),
    onSuccess: () => {
      toast.success(`Setoran Simpanan ${setorJenis} Berhasil!`, {
        description: `Nominal ${formatRp(setorNominal)} berhasil dicatat ke pembukuan.`,
      });
      queryClient.invalidateQueries({ queryKey: ["simpanan-rekap"] });
      queryClient.invalidateQueries({ queryKey: ["simpanan-rekap-bulanan"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setOpenSetorModal(false);
      setSetorAnggotaId("");
      setSetorKeterangan("");
    },
    onError: (err: any) => {
      toast.error("Gagal mencatat setoran", { description: err.message });
      setOpenConfirmSetor(false);
    },
  });

  // Mutation: Simpanan Sukarela Manual (Juru Bayar / Bendahara / Admin)
  const setorSukarelaMutation = useMutation({
    mutationFn: () =>
      apiSimpanan.setor({
        anggotaId: sukarelaAnggotaId,
        jenis: "SUKARELA",
        nominal: sukarelaNominal,
        keterangan: sukarelaKeterangan || `Setoran simpanan sukarela manual oleh ${role}`,
      }),
    onSuccess: () => {
      const anggota = anggotaList.find((a) => a.id === sukarelaAnggotaId);
      toast.success("Simpanan Sukarela Berhasil Dicatat!", {
        description: `${formatRp(sukarelaNominal)} untuk ${anggota?.nama || "Anggota"} berhasil disimpan.`,
      });
      queryClient.invalidateQueries({ queryKey: ["simpanan-rekap"] });
      queryClient.invalidateQueries({ queryKey: ["simpanan-rekap-bulanan"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setOpenSukarelaModal(false);
      setSukarelaAnggotaId("");
      setSukarelaNominal(150_000);
      setSukarelaKeterangan("");
      setOpenConfirmSukarela(false);
    },
    onError: (err: any) => {
      toast.error("Gagal mencatat simpanan sukarela", { description: err.message });
      setOpenConfirmSukarela(false);
    },
  });

  // Mutation: Simpanan Khusus (Bendahara / Admin Only)
  const setorKhususMutation = useMutation({
    mutationFn: () =>
      apiSimpanan.setor({
        anggotaId: khususAnggotaId,
        jenis: "KHUSUS",
        nominal: khususNominal,
        keterangan: khususTipeKeterangan + (khususKeterangan ? ` — ${khususKeterangan}` : ""),
      }),
    onSuccess: () => {
      const anggota = anggotaList.find((a) => a.id === khususAnggotaId);
      toast.success("Simpanan Khusus Berhasil Dicatat!", {
        description: `${khususTipeKeterangan} ${formatRp(khususNominal)} untuk ${anggota?.nama || "Anggota"} berhasil disimpan.`,
      });
      queryClient.invalidateQueries({ queryKey: ["simpanan-rekap"] });
      queryClient.invalidateQueries({ queryKey: ["simpanan-rekap-bulanan"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setOpenKhususModal(false);
      setKhususAnggotaId("");
      setKhususNominal(100_000);
      setKhususTipeKeterangan("Simpanan Qurban");
      setKhususKeterangan("");
      setOpenConfirmKhusus(false);
    },
    onError: (err: any) => {
      toast.error("Gagal mencatat simpanan khusus", { description: err.message });
      setOpenConfirmKhusus(false);
    },
  });

  const batchGolonganMutation = useMutation({
    mutationFn: () => {
      const periodeStr = `${batchPeriodeTahun}-${String(batchPeriodeBulan).padStart(2, "0")}`;
      return apiSimpanan.batchGolongan({
        rates: parsedRates.map((r) => ({
          golongan: r.golongan,
          nominalPokok: r.nominalPokok,
          nominalWajib: r.nominalWajib,
        })),
        periode: periodeStr,
        keterangan: `Potong Simpanan via Excel Golongan Periode ${BULAN_NAMES[batchPeriodeBulan - 1]} ${batchPeriodeTahun}`,
      });
    },
    onSuccess: (res) => {
      setLastBatchResult(res);
      toast.success("Simpanan Berhasil Dimasukkan Realtime!", {
        description: `${res.message} - Total: ${formatRp(res.totalNominal)} (${res.totalAnggota} Anggota).`,
      });
      queryClient.invalidateQueries({ queryKey: ["simpanan-rekap"] });
      queryClient.invalidateQueries({ queryKey: ["simpanan-rekap-bulanan"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setOpenConfirmUpload(false);
    },
    onError: (err: any) => {
      toast.error("Gagal Memproses Simpanan", { description: err.message });
      setOpenConfirmUpload(false);
    },
  });

  // Auto-fill nominal saat pilih anggota di form Simpanan Sukarela
  const handleSukarelaAnggotaChange = (anggotaId: string) => {
    setSukarelaAnggotaId(anggotaId);
    const anggota = anggotaList.find((a) => a.id === anggotaId);
    if (anggota) {
      const kat = (anggota.pangkat?.kategori || "").toUpperCase();
      setSukarelaNominal(SUKARELA_RATES[kat] ?? 150_000);
    }
  };

  // Handler Upload & Validasi File Excel
  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);
    setValidationError(null);
    setLastBatchResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          setValidationError("File Excel tidak memiliki lembar sheet.");
          setParsedRates([]);
          return;
        }
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
          setValidationError("Lembar sheet tidak dapat dibaca.");
          setParsedRates([]);
          return;
        }
        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!jsonRows || jsonRows.length < 2) {
          setValidationError("File Excel kosong atau tidak memiliki baris data tarif.");
          setParsedRates([]);
          return;
        }

        // Cari index kolom: Golongan, Simpanan Pokok, Simpanan Wajib
        const headerRow: string[] = jsonRows[0].map((h: any) => String(h || "").toLowerCase().trim());
        const golonganIdx = headerRow.findIndex((h) => h.includes("golongan"));
        const pokokIdx = headerRow.findIndex((h) => h.includes("pokok"));
        const wajibIdx = headerRow.findIndex((h) => h.includes("wajib"));

        if (golonganIdx === -1 || pokokIdx === -1 || wajibIdx === -1) {
          setValidationError(
            "Format kolom Excel tidak sesuai! Pastikan file Excel memiliki kolom: 'Golongan', 'Simpanan Pokok', dan 'Simpanan Wajib'."
          );
          setParsedRates([]);
          return;
        }

        // Hitung persebaran anggota aktif per golongan di sistem
        const countsByGolongan: Record<string, number> = {
          Pati: 0,
          Pamen: 0,
          Pama: 0,
          "Ba/Ta/Pns": 0,
        };

        anggotaList.forEach((a) => {
          const kat = (a.pangkat?.kategori || "").toUpperCase();
          if (kat.includes("PATI")) countsByGolongan["Pati"] = (countsByGolongan["Pati"] || 0) + 1;
          else if (kat.includes("PAMEN")) countsByGolongan["Pamen"] = (countsByGolongan["Pamen"] || 0) + 1;
          else if (kat.includes("PAMA")) countsByGolongan["Pama"] = (countsByGolongan["Pama"] || 0) + 1;
          else countsByGolongan["Ba/Ta/Pns"] = (countsByGolongan["Ba/Ta/Pns"] || 0) + 1;
        });

        const rowsData: any[] = [];
        const seenGolongan = new Set<string>();

        for (let i = 1; i < jsonRows.length; i++) {
          const row = jsonRows[i];
          if (!row || row.length === 0) continue;

          const rawGolongan = String(row[golonganIdx] || "").trim();
          if (!rawGolongan) continue;

          // Normalisasi nama golongan
          let normGolongan = "Ba/Ta/Pns";
          const gLower = rawGolongan.toLowerCase();
          if (gLower.includes("pati")) normGolongan = "Pati";
          else if (gLower.includes("pamen")) normGolongan = "Pamen";
          else if (gLower.includes("pama")) normGolongan = "Pama";
          else normGolongan = "Ba/Ta/Pns";

          if (seenGolongan.has(normGolongan)) continue;
          seenGolongan.add(normGolongan);

          // Parse angka (bersihkan simbol Rp, titik, koma)
          const parseNominal = (val: any) => {
            if (typeof val === "number") return val;
            const str = String(val || "").replace(/[^\d]/g, "");
            return Number(str) || 0;
          };

          const nominalPokok = parseNominal(row[pokokIdx]);
          const nominalWajib = parseNominal(row[wajibIdx]);

          const memberCount = countsByGolongan[normGolongan] || 0;

          rowsData.push({
            golongan: normGolongan,
            nominalPokok,
            nominalWajib,
            count: memberCount,
            subtotalPokok: nominalPokok * memberCount,
            subtotalWajib: nominalWajib * memberCount,
          });
        }

        if (rowsData.length === 0) {
          setValidationError("Tidak ada baris golongan valid yang dapat diproses.");
          setParsedRates([]);
          return;
        }

        // Urutkan hierarki: Pati -> Pamen -> Pama -> Ba/Ta/Pns
        const orderMap: Record<string, number> = { Pati: 1, Pamen: 2, Pama: 3, "Ba/Ta/Pns": 4 };
        rowsData.sort((a, b) => (orderMap[a.golongan] || 9) - (orderMap[b.golongan] || 9));

        setParsedRates(rowsData);
        setValidationError(null);
        toast.success("File Excel Berhasil Divalidasi!", {
          description: `${rowsData.length} golongan terdeteksi siap diproses.`,
        });
      } catch (err: any) {
        setValidationError("Gagal membaca file Excel. Pastikan file dalam format .xlsx, .xls, atau .csv.");
        setParsedRates([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Unduh Template Excel Siap Isi
  const downloadTemplateSimpananExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [
      ["Golongan", "Simpanan Pokok", "Simpanan Wajib"],
      ["Ba/Ta/Pns", 50000, 100000],
      ["Pama", 50000, 150000],
      ["Pamen", 50000, 200000],
      ["Pati", 50000, 300000],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{ wch: 18 }, { wch: 18 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws, "Tarif Simpanan");
    XLSX.writeFile(wb, "Template_Simpanan_Golongan_TNI_AD.xlsx");
    toast.success("Template Excel berhasil diunduh: Template_Simpanan_Golongan_TNI_AD.xlsx");
  };

  // Ekspor Hasil Pemotongan Terurut Berdasarkan Golongan & Pangkat
  const exportHasilPemotonganSimpananExcel = (rincianData?: any[]) => {
    const rawData = rincianData || lastBatchResult?.rincian || [];
    const dataToExport = sortPersonelByPangkat(rawData);
    if (dataToExport.length === 0) {
      toast.info("Tidak ada data rincian pemotongan untuk diekspor.");
      return;
    }

    const wb = XLSX.utils.book_new();
    const wsData = [
      ["REKAP HASIL PEMOTONGAN SIMPANAN ANGGOTA PER GOLONGAN"],
      [`Satuan: INFOLAHTADAM IV/DIPONEGORO | Periode: ${BULAN_NAMES[batchPeriodeBulan - 1]} ${batchPeriodeTahun}`],
      [],
      [
        "No",
        "Nama Personel",
        "Pangkat / Korps",
        "NRP / NIP",
        "Golongan",
        "Simpanan Pokok (Rp)",
        "Simpanan Wajib (Rp)",
        "Total Potongan (Rp)",
        "Status Transaksi",
      ],
    ];

    dataToExport.forEach((item: any, idx: number) => {
      const pangkatKorps = formatPangkatKorps(item.pangkat, item.korps, item.kategoriPangkat);
      wsData.push([
        idx + 1,
        item.nama,
        pangkatKorps,
        `'${item.nrpNip}`,
        item.golongan,
        item.simpananPokok,
        item.simpananWajib,
        item.totalPotongan,
        "Berhasil Dicatat",
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [
      { wch: 6 },
      { wch: 30 },
      { wch: 22 },
      { wch: 20 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Hasil Pemotongan");
    const filename = `Hasil_Potongan_Simpanan_Golongan_${BULAN_NAMES[batchPeriodeBulan - 1]}_${batchPeriodeTahun}.xlsx`;
    XLSX.writeFile(wb, filename);
    toast.success(`Hasil pemotongan berhasil diekspor: ${filename}`);
  };

  // Export to Excel / CSV
  const handleExportExcel = () => {
    if (rekapBulananList.length === 0) {
      toast.info("Tidak ada data untuk diekspor pada periode ini.");
      return;
    }

    const headers = [
      "No",
      "Nama Personel",
      "Pangkat",
      "NRP / NIP",
      "Jenis Simpanan",
      "Tipe Transaksi",
      "Nominal (Rp)",
      "Tanggal Transaksi",
      "No. Invoice / Kwitansi",
      "Keterangan",
    ];

    const rows = rekapBulananSorted.map((item, idx) => {
      const formattedRank = formatPangkatKorps(item.pangkat, item.korps, item.kategoriPangkat);
      return [
        idx + 1,
        item.namaAnggota,
        formattedRank,
        `'${item.nrpNip}`,
        item.jenis,
        item.tipe,
        item.nominal,
        new Date(item.tanggal).toLocaleDateString("id-ID"),
        item.noInvoice || "-",
        item.keterangan || "-",
      ];
    });

    const filename = `Rekap_Simpanan_${BULAN_NAMES[selectedBulan - 1]}_${selectedTahun}`;
    exportToCSV(filename, headers, rows);
    toast.success(`Rekap simpanan berhasil diekspor: ${filename}.csv`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`NRP disalin: ${text}`);
  };

  // Kalkulasi total tanpa NaN
  const totalPokok = useMemo(
    () => rekapList.reduce((acc, row) => acc + Number(row.totalPokok ?? row.simpananPokok ?? 0), 0),
    [rekapList],
  );
  const totalWajib = useMemo(
    () => rekapList.reduce((acc, row) => acc + Number(row.totalWajib ?? row.simpananWajib ?? 0), 0),
    [rekapList],
  );
  const totalSukarela = useMemo(
    () =>
      rekapList.reduce(
        (acc, row) =>
          acc + Number(row.totalSukarela ?? row.simpananSukarela ?? 0) + Number(row.totalKhusus ?? 0),
        0,
      ),
    [rekapList],
  );

  const filteredRekap = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = !q
      ? rekapList
      : rekapList.filter(
          (r) =>
            r.nama.toLowerCase().includes(q) ||
            r.nrpNip.includes(q) ||
            (r.pangkat || "").toLowerCase().includes(q) ||
            (r.korps || "").toLowerCase().includes(q),
        );
    return sortPersonelByPangkat(list);
  }, [rekapList, search]);

  const rekapBulananSorted = useMemo(() => {
    return sortPersonelByPangkat(rekapBulananList, (item) => ({
      nama: item.namaAnggota,
      pangkat: item.pangkat,
      korps: item.korps,
      kategoriPangkat: item.kategoriPangkat,
    }));
  }, [rekapBulananList]);

  const sortedAnggotaList = useMemo(() => {
    return sortPersonelByPangkat(anggotaList);
  }, [anggotaList]);

  const isAnggota = role === "Anggota";

  if (isAnggota) {
    // ============================
    // TAMPILAN PERSONAL ANGGOTA
    // ============================
    // Cari data simpanan milik anggota yang login berdasarkan NRP
    const myRekap = rekapList.find(
      (r) =>
        r.nrpNip === user?.username ||
        r.anggotaId === user?.id
    );

    const myPokok = myRekap ? Number(myRekap.totalPokok ?? myRekap.simpananPokok ?? 0) : 0;
    const myWajib = myRekap ? Number(myRekap.totalWajib ?? myRekap.simpananWajib ?? 0) : 0;
    const mySukarela = myRekap
      ? Number(myRekap.totalSukarela ?? myRekap.simpananSukarela ?? 0) + Number(myRekap.totalKhusus ?? 0)
      : 0;
    const myTotal = myRekap ? Number(myRekap.totalSimpanan ?? (myPokok + myWajib + mySukarela)) : 0;

    // Mutasi bulanan milik anggota sendiri
    const myMutasiBulanan = rekapBulananList.filter(
      (item) => item.nrpNip === user?.username || item.anggotaId === user?.id
    );

    return (
      <div className="space-y-6">
        <PageHeader
          title="Simpanan Saya"
          description={`Posisi dan riwayat mutasi simpanan Anda di Koperasi INFOLAHTADAM IV/DIPONEGORO`}
          actions={
            <Button
              variant="outline"
              className="gap-1.5 border-success/40 bg-success/10 text-success hover:bg-success/20 font-semibold"
              onClick={handleExportExcel}
              disabled={myMutasiBulanan.length === 0}
            >
              <Download className="size-4" /> Ekspor Rekening Koran
            </Button>
          }
        />

        {/* Ringkasan Saldo Personal */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-card card-interactive border-primary/20">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5">
                <Coins className="size-4 text-primary" /> Simpanan Pokok Saya
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSaldo ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : (
                <p className="text-2xl font-extrabold text-primary">{formatRp(myPokok)}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Setoran awal bergabung koperasi
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-card card-interactive border-blue-500/20">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5">
                <Wallet className="size-4 text-blue-600" /> Simpanan Wajib Saya
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSaldo ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : (
                <p className="text-2xl font-extrabold text-foreground">{formatRp(myWajib)}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Dipotong rutin tiap bulan</p>
            </CardContent>
          </Card>
          <Card className="shadow-card card-interactive border-success/20">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5">
                <PiggyBank className="size-4 text-success" /> Sukarela &amp; Khusus Saya
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSaldo ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : (
                <p className="text-2xl font-extrabold text-success">{formatRp(mySukarela)}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Tabungan mandiri &amp; simpanan khusus</p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-2 border-primary/30 bg-primary-soft/30">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5 font-semibold">
                <PiggyBank className="size-4 text-primary" /> Total Saldo Tersimpan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSaldo ? (
                <Loader2 className="size-4 animate-spin text-primary" />
              ) : (
                <p className="text-2xl font-extrabold text-primary">{formatRp(myTotal)}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Akumulasi semua jenis simpanan</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="posisi" className="space-y-6">
          <TabsList className="grid w-full max-w-sm grid-cols-2">
            <TabsTrigger value="posisi">Posisi Simpanan Saya</TabsTrigger>
            <TabsTrigger value="mutasi">Mutasi Setoran</TabsTrigger>
          </TabsList>

          {/* TAB 1: POSISI SIMPANAN */}
          <TabsContent value="posisi" className="space-y-4">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Rincian Posisi Simpanan Saya</CardTitle>
                <CardDescription>Akumulasi setoran per jenis simpanan yang tercatat di koperasi</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                {loadingSaldo ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-6 animate-spin mb-2 text-primary" />
                    Memuat data simpanan...
                  </div>
                ) : !myRekap ? (
                  <div className="py-12 text-center text-muted-foreground">
                    Data simpanan Anda belum tersedia. Hubungi Bendahara untuk informasi lebih lanjut.
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>Jenis Simpanan</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                        <TableHead>Keterangan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-semibold">Simpanan Pokok</TableCell>
                        <TableCell className="text-right font-bold text-primary">{formatRp(myPokok)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">Setoran awal bergabung, tidak dapat ditarik selama menjadi anggota</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold">Simpanan Wajib</TableCell>
                        <TableCell className="text-right font-bold text-foreground">{formatRp(myWajib)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">Potongan rutin bulanan dari gaji dinas</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold">Simpanan Sukarela</TableCell>
                        <TableCell className="text-right font-bold text-success">
                          {formatRp(Number(myRekap.totalSukarela ?? myRekap.simpananSukarela ?? 0))}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">Tabungan sukarela, dapat ditarik sewaktu-waktu</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold">Simpanan Khusus</TableCell>
                        <TableCell className="text-right font-bold text-foreground">{formatRp(Number(myRekap.totalKhusus ?? 0))}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">Simpanan tujuan khusus (Hari Raya, dsb.)</TableCell>
                      </TableRow>
                      <TableRow className="bg-primary-soft/30 font-bold">
                        <TableCell className="font-extrabold">TOTAL SALDO</TableCell>
                        <TableCell className="text-right font-extrabold text-primary text-lg">{formatRp(myTotal)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">Total akumulasi semua jenis simpanan</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: MUTASI SETORAN BULANAN */}
          <TabsContent value="mutasi" className="space-y-4">
            <Card className="shadow-card">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                <div>
                  <CardTitle>Riwayat Mutasi Setoran Simpanan Saya</CardTitle>
                  <CardDescription>Transaksi simpanan {BULAN_NAMES[selectedBulan - 1]} {selectedTahun} — hanya milik Anda</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={String(selectedBulan)} onValueChange={(v) => setSelectedBulan(Number(v))}>
                    <SelectTrigger className="w-32 h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BULAN_NAMES.map((b, idx) => (
                        <SelectItem key={idx + 1} value={String(idx + 1)}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={String(selectedTahun)} onValueChange={(v) => setSelectedTahun(Number(v))}>
                    <SelectTrigger className="w-24 h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2025, 2026, 2027].map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={handleExportExcel}
                    disabled={myMutasiBulanan.length === 0}
                    className="h-9 gap-1.5 text-xs border-success/40 bg-success/10 text-success hover:bg-success/20 font-semibold"
                  >
                    <FileSpreadsheet className="size-4" /> Ekspor (.csv)
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="w-12">No.</TableHead>
                      <TableHead>Jenis Simpanan</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead className="text-right">Nominal</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>No. Invoice</TableHead>
                      <TableHead>Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingBulanan ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                          <Loader2 className="mx-auto size-6 animate-spin mb-2 text-primary" />
                          Memuat riwayat mutasi...
                        </TableCell>
                      </TableRow>
                    ) : myMutasiBulanan.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                          Tidak ada mutasi simpanan pada {BULAN_NAMES[selectedBulan - 1]} {selectedTahun}.
                        </TableCell>
                      </TableRow>
                    ) : (
                      myMutasiBulanan.map((item, idx) => (
                        <TableRow key={item.id || idx} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {item.jenis}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={item.tipe === "SETOR" ? "border-success/30 bg-success/15 text-success text-xs" : "border-destructive/30 bg-destructive/10 text-destructive text-xs"}
                            >
                              {item.tipe === "SETOR" ? "+" : "-"} {item.tipe}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-bold ${item.tipe === "SETOR" ? "text-success" : "text-destructive"}`}>
                            {item.tipe === "SETOR" ? "+" : "-"}{formatRp(item.nominal)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {item.tanggal ? new Date(item.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{item.noInvoice || "-"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{item.keterangan || "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transaksi & Rekap Simpanan Koperasi"
        description="Pengelolaan simpanan pokok, wajib, sukarela, dan khusus dengan pengaturan nominal dinamis oleh Bendahara."
        actions={
          <div className="flex flex-wrap gap-2">
            {isJuruBayarOrAbove && (
              <>
                <Button
                  variant="outline"
                  className="gap-1.5 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 font-semibold"
                  onClick={() => setOpenSukarelaModal(true)}
                >
                  <PiggyBank className="size-4" /> Input Simpanan Sukarela
                </Button>
                <Button
                  variant="outline"
                  disabled={massalMutation.isPending}
                  onClick={() => massalMutation.mutate()}
                >
                  {massalMutation.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 size-4" />
                  )}
                  Auto Potong Sukarela (Tgl 5)
                </Button>
              </>
            )}
            {isBendaharaOrAdmin && (
              <>
                <Button
                  variant="outline"
                  className="gap-1.5 border-amber-500/40 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 font-semibold"
                  onClick={() => setOpenKhususModal(true)}
                >
                  <Coins className="size-4" /> Input Simpanan Khusus
                </Button>
                <Button onClick={() => setOpenSetorModal(true)} className="shadow-md">
                  <Plus className="mr-2 size-4" /> Catat Setoran Simpanan
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card card-interactive border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Coins className="size-4 text-primary" /> Total Simpanan Pokok
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-primary">{formatRp(totalPokok)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Nominal aktif: {formatRp(pengaturanSimpanan?.nominalSimpananPokok ?? 50_000)} / anggota
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card card-interactive border-blue-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Wallet className="size-4 text-blue-600" /> Total Simpanan Wajib
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-foreground">{formatRp(totalWajib)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Nominal aktif: {formatRp(pengaturanSimpanan?.nominalSimpananWajib ?? 100_000)} / bulan
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card card-interactive border-success/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <PiggyBank className="size-4 text-success" /> Total Simpanan Sukarela &amp; Khusus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-success">{formatRp(totalSukarela)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Tabungan sukarela potong gaji &amp; simpanan khusus
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-6">
        <TabsList
          className={`grid w-full h-auto p-1 gap-1 ${
            isBendaharaOrAdmin ? "max-w-3xl grid-cols-2 sm:grid-cols-4" : "max-w-md grid-cols-2"
          }`}
        >
          <TabsTrigger value="saldo">Rekap Saldo Anggota</TabsTrigger>
          <TabsTrigger value="bulanan">Rekap Mutasi Bulanan</TabsTrigger>
          {isBendaharaOrAdmin && (
            <>
              <TabsTrigger
                value="upload-excel"
                className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400"
              >
                <FileSpreadsheet className="size-4" /> Upload Simpanan (Excel)
              </TabsTrigger>
              <TabsTrigger value="pengaturan">Pengaturan Dinamis</TabsTrigger>
            </>
          )}
        </TabsList>

        {/* ============================================================== */}
        {/* TAB 1: REKAP SALDO ANGGOTA */}
        {/* ============================================================== */}
        <TabsContent value="saldo" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-3">
              <div>
                <CardTitle>Rekap Saldo Simpanan Per Anggota</CardTitle>
                <CardDescription>
                  Akumulasi seluruh simpanan (Pokok, Wajib, Sukarela) yang tersimpan di kas koperasi
                </CardDescription>
              </div>
              <div className="w-full sm:w-64">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari anggota / NRP..."
                />
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-12">No.</TableHead>
                    <TableHead>Nama Anggota</TableHead>
                    <TableHead>Pangkat / Golongan</TableHead>
                    <TableHead>NRP / NIP</TableHead>
                    <TableHead>Satminkal</TableHead>
                    <TableHead className="text-right">Pokok</TableHead>
                    <TableHead className="text-right">Wajib</TableHead>
                    <TableHead className="text-right">Sukarela / Khusus</TableHead>
                    <TableHead className="text-right font-bold">Total Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingSaldo ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                        <Loader2 className="mx-auto size-6 animate-spin mb-2 text-primary" />
                        Memuat data saldo simpanan...
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRekap.map((r, idx) => {
                      const pokok = Number(r.totalPokok ?? r.simpananPokok ?? 0);
                      const wajib = Number(r.totalWajib ?? r.simpananWajib ?? 0);
                      const sukarela =
                        Number(r.totalSukarela ?? r.simpananSukarela ?? 0) + Number(r.totalKhusus ?? 0);
                      const total = Number(r.totalSimpanan ?? (pokok + wajib + sukarela));
                      const formattedPangkat = formatPangkatKorps(r.pangkat, r.korps, r.kategoriPangkat);

                      return (
                        <TableRow key={r.anggotaId || r.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="font-semibold text-foreground">{cleanNamaPersonel(r.nama)}</TableCell>
                          <TableCell className="text-xs font-medium text-foreground">
                            {formattedPangkat}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-semibold">
                            <button
                              onClick={() => copyToClipboard(r.nrpNip)}
                              className="flex items-center gap-1 text-primary hover:underline text-left"
                              title="Klik untuk menyalin NRP"
                            >
                              {r.nrpNip}
                              <Copy className="size-3 opacity-60" />
                            </button>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{r.satminkal || "INFOLAHTADAM IV/DIPONEGORO"}</TableCell>
                          <TableCell className="text-right font-medium">{formatRp(pokok)}</TableCell>
                          <TableCell className="text-right font-medium">{formatRp(wajib)}</TableCell>
                          <TableCell className="text-right text-success font-medium">
                            {formatRp(sukarela)}
                          </TableCell>
                          <TableCell className="text-right font-bold text-foreground">
                            {formatRp(total)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                  {!loadingSaldo && filteredRekap.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                        Tidak ada data simpanan ditemukan.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 2: REKAP MUTASI BULANAN & EKSPOR EXCEL */}
        {/* ============================================================== */}
        <TabsContent value="bulanan" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
              <div>
                <CardTitle>Rincian Mutasi Simpanan Bulanan</CardTitle>
                <CardDescription>
                  Daftar transaksi setoran simpanan per bulan beserta rincian penyetor dan tanggal transaksi
                </CardDescription>
              </div>

              {/* Filter Bulan & Tahun + Tombol Ekspor */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Select
                    value={String(selectedBulan)}
                    onValueChange={(v) => setSelectedBulan(Number(v))}
                  >
                    <SelectTrigger className="w-32 h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BULAN_NAMES.map((b, idx) => (
                        <SelectItem key={idx + 1} value={String(idx + 1)}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={String(selectedTahun)}
                    onValueChange={(v) => setSelectedTahun(Number(v))}
                  >
                    <SelectTrigger className="w-24 h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2025, 2026, 2027].map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  onClick={handleExportExcel}
                  className="h-9 gap-1.5 text-xs border-success/40 bg-success/10 text-success hover:bg-success/20 font-semibold"
                >
                  <FileSpreadsheet className="size-4" /> Ekspor ke Excel (.csv)
                </Button>
              </div>
            </CardHeader>

            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-12">No.</TableHead>
                    <TableHead>Nama Personel</TableHead>
                    <TableHead>Pangkat / Golongan</TableHead>
                    <TableHead>NRP / NIP</TableHead>
                    <TableHead>Jenis Simpanan</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                    <TableHead>Tanggal Transaksi</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingBulanan ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                        <Loader2 className="mx-auto size-6 animate-spin mb-2 text-primary" />
                        Memuat mutasi simpanan periode {BULAN_NAMES[selectedBulan - 1]} {selectedTahun}...
                      </TableCell>
                    </TableRow>
                  ) : (
                    rekapBulananSorted.map((item, idx) => {
                      const formattedRank = formatPangkatKorps(item.pangkat, item.korps, item.kategoriPangkat);
                      return (
                        <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="font-semibold text-foreground">{item.namaAnggota}</TableCell>
                          <TableCell className="text-xs font-medium text-foreground">
                            {formattedRank}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-semibold">
                            <button
                              onClick={() => copyToClipboard(item.nrpNip)}
                              className="flex items-center gap-1 text-primary hover:underline text-left"
                              title="Klik untuk menyalin NRP"
                            >
                              {item.nrpNip}
                              <Copy className="size-3 opacity-60" />
                            </button>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                item.jenis === "POKOK"
                                  ? "border-primary/40 bg-primary/10 text-primary text-[10px]"
                                  : item.jenis === "WAJIB"
                                  ? "border-blue-500/40 bg-blue-500/10 text-blue-600 text-[10px]"
                                  : item.jenis === "KHUSUS"
                                  ? "border-amber-500/40 bg-amber-500/10 text-amber-600 text-[10px]"
                                  : "border-success/40 bg-success/10 text-success text-[10px]"
                              }
                            >
                              {item.jenis}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-foreground">
                            {formatRp(item.nominal)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {new Date(item.tanggal).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                            {item.keterangan || "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                  {!loadingBulanan && rekapBulananList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                        Tidak ada transaksi simpanan pada {BULAN_NAMES[selectedBulan - 1]} {selectedTahun}.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB KHUSUS: UPLOAD TARIF SIMPANAN GOLONGAN VIA EXCEL (BENDAHARA) */}
        {/* ============================================================== */}
        {isBendaharaOrAdmin && (
          <TabsContent value="upload-excel" className="space-y-6">
            <Card className="shadow-card border-emerald-500/20">
              <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                    <FileSpreadsheet className="size-5" />
                    <CardTitle>Upload Tarif Simpanan Per Golongan via Excel</CardTitle>
                  </div>
                  <CardDescription className="mt-1">
                    Khusus Bendahara: Upload file Excel berisi tarif Simpanan Pokok &amp; Simpanan Wajib per golongan (Ba/Ta/Pns, Pama, Pamen, Pati).
                    Sistem memvalidasi file terlebih dahulu sebelum pemotongan massal dicatat realtime ke pembukuan.
                  </CardDescription>
                </div>

                <Button
                  variant="outline"
                  onClick={downloadTemplateSimpananExcel}
                  className="gap-1.5 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-semibold"
                >
                  <Download className="size-4" /> Unduh Format Template Excel
                </Button>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Periode Potongan */}
                <div className="p-4 rounded-xl bg-muted/40 border flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Calendar className="size-4 text-emerald-600" />
                    <span>Periode Pemotongan:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={String(batchPeriodeBulan)}
                      onValueChange={(v) => setBatchPeriodeBulan(Number(v))}
                    >
                      <SelectTrigger className="w-36 h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BULAN_NAMES.map((b, idx) => (
                          <SelectItem key={idx + 1} value={String(idx + 1)}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={String(batchPeriodeTahun)}
                      onValueChange={(v) => setBatchPeriodeTahun(Number(v))}
                    >
                      <SelectTrigger className="w-28 h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2025, 2026, 2027].map((y) => (
                          <SelectItem key={y} value={String(y)}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-xs text-muted-foreground ml-auto">
                    * Simpanan Sukarela dan Khusus diinput manual pada menu Catat Setoran.
                  </div>
                </div>

                {/* Dropzone Upload */}
                <div className="border-2 border-dashed border-emerald-500/30 dark:border-emerald-500/20 hover:border-emerald-500/60 rounded-xl p-6 text-center transition-colors bg-emerald-500/[0.02]">
                  <input
                    type="file"
                    id="excel-file-input"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={handleExcelFileUpload}
                  />
                  <label
                    htmlFor="excel-file-input"
                    className="cursor-pointer flex flex-col items-center justify-center gap-2"
                  >
                    <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Upload className="size-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {excelFile ? excelFile.name : "Klik atau seret file Excel tarif simpanan ke sini"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Mendukung format .xlsx, .xls, atau .csv (Maksimal 5MB)
                      </p>
                    </div>
                    {excelFile && (
                      <Badge variant="outline" className="mt-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs">
                        <Check className="size-3 mr-1" /> {(excelFile.size / 1024).toFixed(1)} KB terpilih
                      </Badge>
                    )}
                  </label>
                </div>

                {/* Alert Validasi Gagal */}
                {validationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertTitle>Validasi File Excel Gagal</AlertTitle>
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                )}

                {/* Alert Validasi Berhasil */}
                {!validationError && parsedRates.length > 0 && (
                  <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <AlertTitle className="font-bold">File Excel Valid &amp; Berhasil Diverifikasi</AlertTitle>
                    <AlertDescription>
                      Ditemukan {parsedRates.length} kategori golongan terdeteksi. Silakan periksa tabel rincian estimasi di bawah sebelum menekan tombol <strong>Masukan Simpanan</strong>.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Tabel Preview Validasi Tarif per Golongan */}
                {parsedRates.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        <FileCheck className="size-4 text-emerald-600" />
                        Tabel Estimasi Pemotongan Anggota Aktif per Golongan
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        Urutan hierarki: Pati &rarr; Pamen &rarr; Pama &rarr; Ba/Ta/Pns
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="w-12">No.</TableHead>
                            <TableHead>Golongan</TableHead>
                            <TableHead className="text-center">Personel Aktif</TableHead>
                            <TableHead className="text-right">Tarif Simpanan Pokok</TableHead>
                            <TableHead className="text-right">Tarif Simpanan Wajib</TableHead>
                            <TableHead className="text-right">Subtotal Pokok</TableHead>
                            <TableHead className="text-right">Subtotal Wajib</TableHead>
                            <TableHead className="text-right font-bold">Total Potongan</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedRates.map((r, idx) => {
                            const totalGol = r.subtotalPokok + r.subtotalWajib;
                            return (
                              <TableRow key={r.golongan}>
                                <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                                <TableCell className="font-bold text-foreground">
                                  <Badge
                                    variant="outline"
                                    className={
                                      r.golongan === "Pati"
                                        ? "border-amber-500 bg-amber-500/10 text-amber-600 font-extrabold"
                                        : r.golongan === "Pamen"
                                        ? "border-purple-500 bg-purple-500/10 text-purple-600 font-bold"
                                        : r.golongan === "Pama"
                                        ? "border-blue-500 bg-blue-500/10 text-blue-600 font-semibold"
                                        : "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                                    }
                                  >
                                    {r.golongan}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center font-semibold">{r.count} Orang</TableCell>
                                <TableCell className="text-right">{formatRp(r.nominalPokok)}</TableCell>
                                <TableCell className="text-right">{formatRp(r.nominalWajib)}</TableCell>
                                <TableCell className="text-right font-medium text-primary">{formatRp(r.subtotalPokok)}</TableCell>
                                <TableCell className="text-right font-medium text-blue-600">{formatRp(r.subtotalWajib)}</TableCell>
                                <TableCell className="text-right font-extrabold text-foreground">{formatRp(totalGol)}</TableCell>
                              </TableRow>
                            );
                          })}
                          <TableRow className="bg-muted/70 font-bold border-t-2">
                            <TableCell colSpan={2} className="text-right font-extrabold">
                              TOTAL KESELURUHAN:
                            </TableCell>
                            <TableCell className="text-center font-extrabold text-foreground">
                              {parsedRates.reduce((acc, r) => acc + r.count, 0)} Orang
                            </TableCell>
                            <TableCell colSpan={2}></TableCell>
                            <TableCell className="text-right font-extrabold text-primary">
                              {formatRp(parsedRates.reduce((acc, r) => acc + r.subtotalPokok, 0))}
                            </TableCell>
                            <TableCell className="text-right font-extrabold text-blue-600">
                              {formatRp(parsedRates.reduce((acc, r) => acc + r.subtotalWajib, 0))}
                            </TableCell>
                            <TableCell className="text-right font-extrabold text-foreground text-base">
                              {formatRp(
                                parsedRates.reduce((acc, r) => acc + r.subtotalPokok + r.subtotalWajib, 0)
                              )}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    {/* Tombol Masukan Simpanan */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                      <div>
                        <p className="font-bold text-foreground">Konfirmasi &amp; Masukan Data Simpanan</p>
                        <p className="text-xs text-muted-foreground">
                          Setelah menekan tombol di samping, sistem akan meminta konfirmasi final sebelum mencatat pemotongan ke kas koperasi secara realtime.
                        </p>
                      </div>

                      <Button
                        size="lg"
                        disabled={batchGolonganMutation.isPending}
                        onClick={() => setOpenConfirmUpload(true)}
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md gap-2"
                      >
                        {batchGolonganMutation.isPending ? (
                          <Loader2 className="size-4 animate-spin mr-2" />
                        ) : (
                          <Upload className="size-4 mr-2" />
                        )}
                        Masukan Simpanan
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hasil Eksekusi Terakhir & Tombol Ekspor Excel */}
            {lastBatchResult && (
              <Card className="shadow-card border-emerald-500/30 bg-emerald-500/[0.02]">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 font-semibold px-2.5 py-1">
                        <CheckCircle2 className="size-3.5 mr-1" /> Sukses Realtime
                      </Badge>
                      <CardTitle className="text-lg">Hasil Pemotongan Simpanan via Excel</CardTitle>
                    </div>
                    <CardDescription className="mt-1">
                      Periode: {lastBatchResult.periode} | Total: {formatRp(lastBatchResult.totalNominal)} ({lastBatchResult.totalAnggota} Personel).
                      Data ini telah tercatat secara realtime di kas koperasi.
                    </CardDescription>
                  </div>

                  <Button
                    onClick={() => exportHasilPemotonganSimpananExcel()}
                    className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-md"
                  >
                    <FileSpreadsheet className="size-4" />
                    Ekspor Hasil Pemotongan ke Excel
                  </Button>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="w-full sm:w-72">
                    <Input
                      placeholder="Cari personel di hasil pemotongan..."
                      value={searchBatchResult}
                      onChange={(e) => setSearchBatchResult(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="overflow-x-auto rounded-lg border max-h-96">
                    <Table>
                      <TableHeader className="bg-muted/50 sticky top-0">
                        <TableRow>
                          <TableHead className="w-12">No.</TableHead>
                          <TableHead>Nama Personel</TableHead>
                          <TableHead>Pangkat / Korps</TableHead>
                          <TableHead>NRP / NIP</TableHead>
                          <TableHead>Golongan</TableHead>
                          <TableHead className="text-right">Pokok</TableHead>
                          <TableHead className="text-right">Wajib</TableHead>
                          <TableHead className="text-right font-bold">Total Potongan</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(lastBatchResult.rincian || [])
                          .filter((item: any) => {
                            const q = searchBatchResult.toLowerCase().trim();
                            if (!q) return true;
                            return (
                              item.nama?.toLowerCase().includes(q) ||
                              item.nrpNip?.includes(q) ||
                              item.pangkat?.toLowerCase().includes(q) ||
                              item.golongan?.toLowerCase().includes(q)
                            );
                          })
                          .map((item: any, idx: number) => {
                            const formattedRank = formatPangkatKorps(item.pangkat, item.korps, item.kategoriPangkat);
                            return (
                              <TableRow key={item.anggotaId || idx} className="hover:bg-muted/50">
                                <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                                <TableCell className="font-semibold text-foreground">{item.nama}</TableCell>
                                <TableCell className="text-xs font-medium text-foreground">{formattedRank}</TableCell>
                                <TableCell className="font-mono text-xs font-semibold">{item.nrpNip}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={
                                      item.golongan === "Pati"
                                        ? "border-amber-500 bg-amber-500/10 text-amber-600 font-extrabold text-[10px]"
                                        : item.golongan === "Pamen"
                                        ? "border-purple-500 bg-purple-500/10 text-purple-600 font-bold text-[10px]"
                                        : item.golongan === "Pama"
                                        ? "border-blue-500 bg-blue-500/10 text-blue-600 font-semibold text-[10px]"
                                        : "border-emerald-500 bg-emerald-500/10 text-emerald-600 text-[10px]"
                                    }
                                  >
                                    {item.golongan}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">{formatRp(item.simpananPokok)}</TableCell>
                                <TableCell className="text-right">{formatRp(item.simpananWajib)}</TableCell>
                                <TableCell className="text-right font-extrabold text-foreground">
                                  {formatRp(item.totalPotongan)}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">
                                    <Check className="size-3 mr-0.5" /> Berhasil
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* ============================================================== */}
        {/* TAB 3: PENGATURAN NOMINAL DINAMIS (BENDAHARA / ADMIN) */}
        {/* ============================================================== */}
        {isBendaharaOrAdmin && (
          <TabsContent value="pengaturan" className="space-y-4">
            <Card className="shadow-card max-w-2xl">
              <CardHeader>
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Settings2 className="size-5" />
                  <CardTitle>Pengaturan Nominal Simpanan Koperasi (Dinamis)</CardTitle>
                </div>
                <CardDescription>
                  Khusus Bendahara &amp; Admin: Ubah nominal standar simpanan pokok dan wajib sewaktu-waktu sesuai keputusan Rapat Anggota Tahunan (RAT) / Kebijakan Pengurus.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Nominal Simpanan Pokok (Sekali saat pendaftaran)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={10_000}
                    value={editPokok}
                    onChange={(e) => setEditPokok(Number(e.target.value) || 0)}
                    className="h-11 font-semibold"
                  />
                  <p className="text-xs text-muted-foreground">
                    Terbilang: <strong>{formatRp(editPokok)}</strong> (Default Juknis: Rp 50.000)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Nominal Simpanan Wajib (Rutin bulanan / awal)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={10_000}
                    value={editWajib}
                    onChange={(e) => setEditWajib(Number(e.target.value) || 0)}
                    className="h-11 font-semibold"
                  />
                  <p className="text-xs text-muted-foreground">
                    Terbilang: <strong>{formatRp(editWajib)}</strong> (Default Juknis: Rp 100.000)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Nominal Acuan Simpanan Khusus (Opsional / Fleksibel)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={50_000}
                    value={editKhusus}
                    onChange={(e) => setEditKhusus(Number(e.target.value) || 0)}
                    className="h-11 font-semibold"
                  />
                  <p className="text-xs text-muted-foreground">
                    Terbilang: <strong>{formatRp(editKhusus)}</strong> (Program Khusus Hari Raya / Qurban)
                  </p>
                </div>

                <Button
                  size="lg"
                  disabled={updatePengaturanMutation.isPending}
                  onClick={() => setOpenConfirmPengaturan(true)}
                  className="w-full gap-2 font-semibold shadow-md"
                >
                  {updatePengaturanMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Simpan Perubahan Pengaturan Simpanan
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Dialog Catat Setoran Simpanan Dinamis */}
      <Dialog open={openSetorModal} onOpenChange={setOpenSetorModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Catat Pembayaran / Setoran Simpanan</DialogTitle>
            <DialogDescription>
              Input setoran simpanan pokok, wajib, sukarela, atau khusus untuk anggota secara dinamis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Pilih Anggota</Label>
              <Select value={setorAnggotaId} onValueChange={setSetorAnggotaId}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Pilih Anggota Penyetor --" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {anggotaList.map((a) => {
                    const formatted = formatPangkatKorps(a.pangkat?.nama, a.korps?.nama, a.pangkat?.kategori);
                    return (
                      <SelectItem key={a.id} value={a.id}>
                        {formatNamaLengkapDinas(a.nama, a.pangkat?.nama, a.korps?.nama, a.pangkat?.kategori)} (NRP: {a.nrpNip})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Jenis Simpanan</Label>
              <Select value={setorJenis} onValueChange={(v: any) => setSetorJenis(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POKOK">Simpanan Pokok</SelectItem>
                  <SelectItem value="WAJIB">Simpanan Wajib</SelectItem>
                  <SelectItem value="SUKARELA">Simpanan Sukarela</SelectItem>
                  <SelectItem value="KHUSUS">Simpanan Khusus (Qurban/Hari Raya)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nominal Setoran</Label>
              <Input
                type="number"
                min={10_000}
                step={10_000}
                value={setorNominal}
                onChange={(e) => setSetorNominal(Number(e.target.value) || 0)}
                className="font-semibold"
              />
              <p className="text-xs text-muted-foreground">
                Terbilang: <strong>{formatRp(setorNominal)}</strong>
              </p>
            </div>

            <div className="space-y-2">
              <Label>Keterangan Transaksi</Label>
              <Textarea
                value={setorKeterangan}
                onChange={(e) => setSetorKeterangan(e.target.value)}
                placeholder="Contoh: Setoran tunai bendahara / Potong gaji bulan berjalan"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={!setorAnggotaId || setorNominal <= 0 || setorDinamisMutation.isPending}
              onClick={() => setOpenConfirmSetor(true)}
            >
              {setorDinamisMutation.isPending ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : null}
              Simpan Setoran
            </Button>
            <Button variant="outline" onClick={() => setOpenSetorModal(false)}>
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Pop-up 1: Konfirmasi Upload Excel Simpanan */}
      <AlertDialog open={openConfirmUpload} onOpenChange={setOpenConfirmUpload}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">
              Anda Yakin ingin Mengupload ini
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm">
              <p>
                Sistem akan memotong dan mencatat simpanan pokok &amp; wajib untuk{" "}
                <strong>
                  {parsedRates.reduce((acc, r) => acc + r.count, 0)} personel aktif
                </strong>{" "}
                berdasarkan file Excel periode{" "}
                <strong>
                  {BULAN_NAMES[batchPeriodeBulan - 1]} {batchPeriodeTahun}
                </strong>
                .
              </p>
              <p className="text-xs text-muted-foreground">
                Total nominal pemotongan yang akan dibukukan secara realtime:{" "}
                <span className="font-bold text-foreground">
                  {formatRp(
                    parsedRates.reduce((acc, r) => acc + r.subtotalPokok + r.subtotalWajib, 0)
                  )}
                </span>
                .
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batalkan Upload</AlertDialogCancel>
            <AlertDialogAction
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              disabled={batchGolonganMutation.isPending}
              onClick={() => batchGolonganMutation.mutate()}
            >
              {batchGolonganMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Upload className="mr-2 size-4" />
              )}
              Iya, Masukan Simpanan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Pop-up 2: Konfirmasi Catat Setoran Simpanan */}
      <AlertDialog open={openConfirmSetor} onOpenChange={setOpenConfirmSetor}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              Anda Yakin ingin menambahkan data ini?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Setoran simpanan <strong>{setorJenis}</strong> sebesar{" "}
              <strong>{formatRp(setorNominal)}</strong> akan dicatat ke dalam pembukuan kas koperasi secara realtime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batalkan</AlertDialogCancel>
            <AlertDialogAction
              disabled={setorDinamisMutation.isPending}
              onClick={() => setorDinamisMutation.mutate()}
            >
              {setorDinamisMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Check className="mr-2 size-4" />
              )}
              Iya, Tambahkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Pop-up 3: Konfirmasi Edit Pengaturan Simpanan */}
      <AlertDialog open={openConfirmPengaturan} onOpenChange={setOpenConfirmPengaturan}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              Anda Yakin ingin mengedit data ini?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Perubahan nominal acuan simpanan pokok (<strong>{formatRp(editPokok)}</strong>), simpanan wajib (<strong>{formatRp(editWajib)}</strong>), dan simpanan khusus (<strong>{formatRp(editKhusus)}</strong>) akan disimpan ke sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batalkan</AlertDialogCancel>
            <AlertDialogAction
              disabled={updatePengaturanMutation.isPending}
              onClick={() => updatePengaturanMutation.mutate()}
            >
              {updatePengaturanMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Save className="mr-2 size-4" />
              )}
              Iya, Simpan Perubahan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ========================= */}
      {/* MODAL: INPUT SIMPANAN SUKARELA (Juru Bayar / Bendahara / Admin) */}
      {/* ========================= */}
      <Dialog
        open={openSukarelaModal}
        onOpenChange={(o) => {
          setOpenSukarelaModal(o);
          if (!o) {
            setSukarelaAnggotaId("");
            setSukarelaNominal(150_000);
            setSukarelaKeterangan("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PiggyBank className="size-5 text-emerald-600" /> Input Simpanan Sukarela Manual
            </DialogTitle>
            <DialogDescription>
              Catat setoran simpanan sukarela untuk anggota tertentu. Nominal otomatis terisi sesuai golongan pangkat, namun dapat diedit.
            </DialogDescription>
          </DialogHeader>

          {/* Tabel Tarif Sukarela per Golongan */}
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Tarif Simpanan Sukarela per Golongan:</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {Object.entries(SUKARELA_RATES).map(([kat, nom]) => (
                <div key={kat} className="flex items-center justify-between rounded-md bg-card border px-2.5 py-1.5">
                  <span className="font-semibold text-foreground">
                    {SUKARELA_RATE_LABELS[kat] ? SUKARELA_RATE_LABELS[kat].split(" (")[0] : kat}
                  </span>
                  <span className="font-bold text-primary">{formatRp(nom)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Pilih Anggota <span className="text-destructive">*</span></Label>
              <Select value={sukarelaAnggotaId} onValueChange={handleSukarelaAnggotaChange}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Pilih Anggota --" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {sortedAnggotaList.map((a) => {
                    const kategori = (a.pangkat?.kategori || "").toUpperCase();
                    const rate = SUKARELA_RATES[kategori] ?? 150_000;
                    return (
                      <SelectItem key={a.id} value={a.id}>
                        {formatNamaLengkapDinas(a.nama, a.pangkat?.nama, a.korps?.nama, a.pangkat?.kategori)} (NRP: {a.nrpNip}) — {formatRp(rate)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Info Golongan Anggota Terpilih */}
            {sukarelaAnggotaId && (() => {
              const selected = anggotaList.find((a) => a.id === sukarelaAnggotaId);
              if (!selected) return null;
              const kat = (selected.pangkat?.kategori || "").toUpperCase();
              const golLabel = SUKARELA_RATE_LABELS[kat] || kat || "Tidak Diketahui";
              return (
                <Alert className="border-emerald-500/30 bg-emerald-500/10">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <AlertTitle className="text-sm font-bold">{selected.nama}</AlertTitle>
                  <AlertDescription className="text-xs">
                    Pangkat: <strong>{selected.pangkat?.nama || "-"}</strong> — Golongan: <strong>{golLabel}</strong> — Nominal Default: <strong>{formatRp(SUKARELA_RATES[kat] ?? 150_000)}</strong>
                  </AlertDescription>
                </Alert>
              );
            })()}

            <div className="space-y-2">
              <Label>Nominal Simpanan Sukarela</Label>
              <Input
                type="number"
                min={10_000}
                step={10_000}
                value={sukarelaNominal}
                onChange={(e) => setSukarelaNominal(Number(e.target.value) || 0)}
                className="h-11 font-semibold"
              />
              <p className="text-xs text-muted-foreground">
                Terbilang: <strong>{formatRp(sukarelaNominal)}</strong>
              </p>
            </div>

            <div className="space-y-2">
              <Label>Keterangan (Opsional)</Label>
              <Textarea
                value={sukarelaKeterangan}
                onChange={(e) => setSukarelaKeterangan(e.target.value)}
                placeholder="Contoh: Potong gaji sukarela bulan September 2026"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={!sukarelaAnggotaId || sukarelaNominal <= 0 || setorSukarelaMutation.isPending}
              onClick={() => setOpenConfirmSukarela(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {setorSukarelaMutation.isPending ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <ArrowDownLeft className="size-4 mr-2" />
              )}
              Simpan Simpanan Sukarela
            </Button>
            <Button variant="outline" onClick={() => setOpenSukarelaModal(false)}>
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi Simpanan Sukarela */}
      <AlertDialog open={openConfirmSukarela} onOpenChange={setOpenConfirmSukarela}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              Konfirmasi Simpanan Sukarela?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Simpanan sukarela sebesar <strong>{formatRp(sukarelaNominal)}</strong> untuk anggota <strong>{anggotaList.find((a) => a.id === sukarelaAnggotaId)?.nama || ""}</strong> akan dicatat ke pembukuan koperasi secara realtime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batalkan</AlertDialogCancel>
            <AlertDialogAction
              disabled={setorSukarelaMutation.isPending}
              onClick={() => setorSukarelaMutation.mutate()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {setorSukarelaMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Check className="mr-2 size-4" />
              )}
              Ya, Simpan Sukarela
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ========================= */}
      {/* MODAL: INPUT SIMPANAN KHUSUS (Bendahara / Admin Only) */}
      {/* ========================= */}
      <Dialog
        open={openKhususModal}
        onOpenChange={(o) => {
          setOpenKhususModal(o);
          if (!o) {
            setKhususAnggotaId("");
            setKhususNominal(100_000);
            setKhususTipeKeterangan("Simpanan Qurban");
            setKhususKeterangan("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="size-5 text-amber-600" /> Input Simpanan Khusus
            </DialogTitle>
            <DialogDescription>
              Khusus Bendahara: Catat simpanan khusus (Qurban, Hari Raya, Wisata, dll.) untuk anggota tertentu.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Pilih Anggota <span className="text-destructive">*</span></Label>
              <Select value={khususAnggotaId} onValueChange={setKhususAnggotaId}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Pilih Anggota --" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {sortedAnggotaList.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {formatNamaLengkapDinas(a.nama, a.pangkat?.nama, a.korps?.nama, a.pangkat?.kategori)} (NRP: {a.nrpNip})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Info anggota terpilih */}
            {khususAnggotaId && (() => {
              const selected = anggotaList.find((a) => a.id === khususAnggotaId);
              if (!selected) return null;
              return (
                <Alert className="border-amber-500/30 bg-amber-500/10">
                  <CheckCircle2 className="size-4 text-amber-600" />
                  <AlertTitle className="text-sm font-bold">{selected.nama}</AlertTitle>
                  <AlertDescription className="text-xs">
                    Pangkat: <strong>{selected.pangkat?.nama || "-"}</strong> — NRP: <strong>{selected.nrpNip}</strong>
                  </AlertDescription>
                </Alert>
              );
            })()}

            <div className="space-y-2">
              <Label>Jenis Simpanan Khusus <span className="text-destructive">*</span></Label>
              <Select value={khususTipeKeterangan} onValueChange={setKhususTipeKeterangan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KHUSUS_TIPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nominal Simpanan Khusus <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                min={10_000}
                step={10_000}
                value={khususNominal}
                onChange={(e) => setKhususNominal(Number(e.target.value) || 0)}
                className="h-11 font-semibold"
              />
              <p className="text-xs text-muted-foreground">
                Terbilang: <strong>{formatRp(khususNominal)}</strong>
              </p>
            </div>

            <div className="space-y-2">
              <Label>Catatan Tambahan (Opsional)</Label>
              <Textarea
                value={khususKeterangan}
                onChange={(e) => setKhususKeterangan(e.target.value)}
                placeholder="Contoh: Simpanan qurban tahun 2026 periode September"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={!khususAnggotaId || khususNominal <= 0 || setorKhususMutation.isPending}
              onClick={() => setOpenConfirmKhusus(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              {setorKhususMutation.isPending ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <ArrowDownLeft className="size-4 mr-2" />
              )}
              Simpan Simpanan Khusus
            </Button>
            <Button variant="outline" onClick={() => setOpenKhususModal(false)}>
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi Simpanan Khusus */}
      <AlertDialog open={openConfirmKhusus} onOpenChange={setOpenConfirmKhusus}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              Konfirmasi Simpanan Khusus?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{khususTipeKeterangan}</strong> sebesar <strong>{formatRp(khususNominal)}</strong> untuk anggota <strong>{anggotaList.find((a) => a.id === khususAnggotaId)?.nama || ""}</strong> akan dicatat ke pembukuan koperasi secara realtime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batalkan</AlertDialogCancel>
            <AlertDialogAction
              disabled={setorKhususMutation.isPending}
              onClick={() => setorKhususMutation.mutate()}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              {setorKhususMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Check className="mr-2 size-4" />
              )}
              Ya, Simpan Khusus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
