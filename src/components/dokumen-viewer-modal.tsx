import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Printer,
  Download,
  Eye,
  CheckCircle2,
  Building2,
  Shield,
  User,
  CreditCard,
  FileCheck,
  X,
  ExternalLink,
  Layers,
  UploadCloud,
  FileImage,
  Cloud,
  FileSpreadsheet,
  FileCode,
  Loader2,
  File,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatRp,
  formatNamaLengkapDinas,
  formatPangkatKorps,
} from "@/lib/casheva-data";
import { apiDokumen, type Pinjaman, type DokumenPinjaman } from "@/lib/api";

export interface DokumenViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pinjaman?: Pinjaman | null;
  customData?: {
    id?: string | undefined;
    nama?: string | undefined;
    pangkat?: string | undefined;
    korps?: string | undefined;
    kategoriPangkat?: string | undefined;
    nrpNip?: string | undefined;
    satminkal?: string | undefined;
    nominal?: number | undefined;
    tenorBulan?: number | undefined;
    catatan?: string | undefined;
    tanggalAjuan?: string | undefined;
    bungaPersenTahun?: number | undefined;
    dokumen?: DokumenPinjaman[] | undefined;
  };
  initialDocId?: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  shortTitle: string;
  nomorSurat: string;
  category: string;
  verified: boolean;
}

export function DokumenViewerModal({
  isOpen,
  onClose,
  pinjaman,
  customData,
  initialDocId = "usipa",
}: DokumenViewerModalProps) {
  const queryClient = useQueryClient();
  const [activeDoc, setActiveDoc] = useState<string>(initialDocId);
  const [viewMode, setViewMode] = useState<"uploaded" | "template">("uploaded");
  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialDocId) {
      setActiveDoc(initialDocId);
    }
  }, [initialDocId]);

  // Normalisasi data dari pinjaman atau customData
  const id = pinjaman?.id || customData?.id || "PJM-2026-001";
  const noBerkas = id.slice(0, 8).toUpperCase();
  const nama = pinjaman?.anggota?.nama || customData?.nama || "Sigit Suhendro";
  const pangkat = pinjaman?.anggota?.pangkat?.nama || customData?.pangkat || "Kolonel";
  const korps = pinjaman?.anggota?.korps?.nama || customData?.korps || "Inf";
  const kategori = pinjaman?.anggota?.pangkat?.kategori || customData?.kategoriPangkat || "PAMEN";
  const nrpNip = pinjaman?.anggota?.nrpNip || customData?.nrpNip || "1102123401";
  const satminkal = pinjaman?.anggota?.satminkal?.nama || customData?.satminkal || "INFOLAHTADAM IV/DIPONEGORO";
  const nominal = Number(pinjaman?.nominal || customData?.nominal || 15_000_000);
  const tenor = Number(pinjaman?.tenorBulan || customData?.tenorBulan || 24);
  const bungaTahun = Number(pinjaman?.bungaPersenTahun || customData?.bungaPersenTahun || 10);
  const bungaBulanRate = bungaTahun / 12 / 100;
  const angsuranPokok = Math.floor(nominal / tenor);
  const angsuranBunga = Math.floor(nominal * bungaBulanRate);
  const totalAngsuran = angsuranPokok + angsuranBunga;
  const totalPengembalian = nominal + angsuranBunga * tenor;
  const catatan = pinjaman?.catatan || customData?.catatan || "Keperluan renovasi rumah dinas / biaya pendidikan";
  const tanggal = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Query berkas dokumen real-time dari database & Cloudinary
  const { data: remoteDocs = [] } = useQuery({
    queryKey: ["dokumen-pinjaman", id],
    queryFn: () => apiDokumen.getByPinjaman(id),
    enabled: isOpen && !!id && !id.startsWith("USIPA-"),
    initialData: pinjaman?.dokumen || customData?.dokumen || [],
  });

  // Gabungkan dokumen dari props dan query
  const allDokumen = useMemo(() => {
    const map = new Map<string, DokumenPinjaman>();
    (customData?.dokumen || []).forEach((d) => map.set(d.id || d.filePath, d));
    (pinjaman?.dokumen || []).forEach((d) => map.set(d.id || d.filePath, d));
    (remoteDocs || []).forEach((d) => map.set(d.id || d.filePath, d));
    return Array.from(map.values());
  }, [customData?.dokumen, pinjaman?.dokumen, remoteDocs]);

  const docList: DocumentItem[] = [
    {
      id: "usipa",
      title: "Surat Permohonan Pinjaman Usipa",
      shortTitle: "Permohonan Usipa",
      nomorSurat: `SP-USIPA/${noBerkas}/VIII/2026`,
      category: "Formulir Pemohon",
      verified: true,
    },
    {
      id: "jurbay",
      title: "Surat Rekomendasi Juru Bayar Satuan",
      shortTitle: "Rekomendasi Juru Bayar",
      nomorSurat: `REK-JB/${noBerkas}/VIII/2026`,
      category: "Verifikasi Gaji",
      verified: true,
    },
    {
      id: "slip",
      title: "Rincian Slip Gaji & Tunjangan Kinerja",
      shortTitle: "Slip Gaji 3 Bulan",
      nomorSurat: `SLIP-GAJI/${nrpNip}/2026`,
      category: "Penghasilan",
      verified: true,
    },
    {
      id: "kta",
      title: "Lembar Verifikasi KTA & KTP Anggota",
      shortTitle: "Fotokopi KTA / KTP",
      nomorSurat: `VER-ID/${nrpNip}/2026`,
      category: "Identitas Dinas",
      verified: true,
    },
    {
      id: "potong_gaji",
      title: "Surat Kuasa Potong Gaji & Akad Kredit",
      shortTitle: "Pernyataan Potong Gaji",
      nomorSurat: `AKAD-PG/${noBerkas}/VIII/2026`,
      category: "Perjanjian Kredit",
      verified: true,
    },
  ];

  const currentDoc = docList.find((d) => d.id === activeDoc) ?? docList[0]!;

  // Temukan file yang diunggah untuk kategori dokumen aktif
  const uploadedFileForCurrentDoc = useMemo(() => {
    return allDokumen.find((d) => {
      const j = (d.jenis || d.jenisDokumen || "").toLowerCase();
      const targetId = currentDoc.id.toLowerCase();
      const targetTitle = currentDoc.title.toLowerCase();
      const targetShort = currentDoc.shortTitle.toLowerCase();

      return (
        j === targetId ||
        j.includes(targetId) ||
        j === targetTitle ||
        j.includes(targetTitle) ||
        j.includes(targetShort) ||
        (targetId === "usipa" && (j.includes("usipa") || j.includes("permohonan"))) ||
        (targetId === "jurbay" && (j.includes("jurbay") || j.includes("juru bayar") || j.includes("rekomendasi"))) ||
        (targetId === "slip" && (j.includes("slip") || j.includes("gaji"))) ||
        (targetId === "kta" && (j.includes("kta") || j.includes("ktp") || j.includes("identitas"))) ||
        (targetId === "potong_gaji" && (j.includes("potong") || j.includes("akad") || j.includes("kuasa")))
      );
    });
  }, [allDokumen, currentDoc]);

  // Otomatis set viewMode sesuai ketersediaan file
  useEffect(() => {
    if (uploadedFileForCurrentDoc?.filePath) {
      setViewMode("uploaded");
    } else {
      setViewMode("template");
    }
  }, [activeDoc, uploadedFileForCurrentDoc]);

  // Mutasi upload dokumen tambahan
  const uploadDocMutation = useMutation({
    mutationFn: ({ file, jenis }: { file: File; jenis: string }) =>
      apiDokumen.upload(file, id, jenis),
    onSuccess: (res) => {
      toast.success("Dokumen Berhasil Diunggah ke Cloudinary & Database", {
        description: `Tersimpan untuk ${currentDoc.title}`,
      });
      queryClient.invalidateQueries({ queryKey: ["dokumen-pinjaman", id] });
      queryClient.invalidateQueries({ queryKey: ["pinjaman-list"] });
      setViewMode("uploaded");
    },
    onError: (err: any) => {
      toast.error("Gagal Mengunggah Dokumen", {
        description: err.message || "Pastikan file valid dan ukuran maksimal 10MB.",
      });
    },
  });

  const handleFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadDocMutation.mutate({ file, jenis: currentDoc.title });
    e.target.value = "";
  };

  const handleDownloadUploaded = async (url: string, defaultName: string) => {
    try {
      toast.info("Mengunduh berkas arsip dari Cloudinary...");
      const response = await fetch(url);
      if (!response.ok) throw new Error("Gagal mengambil file");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = defaultName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Berkas arsip berhasil diunduh.");
    } catch (e) {
      // Fallback open in new window
      window.open(url, "_blank");
      toast.success("Membuka berkas arsip di tab baru.");
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const win = window.open("", "_blank", "width=850,height=1100");
    if (!win) {
      toast.error("Gagal membuka jendela cetak. Izinkan pop-up di browser Anda.");
      return;
    }

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${currentDoc.title} - ${nama} (${nrpNip})</title>
          <style>
            @page { size: A4; margin: 20mm 15mm 20mm 15mm; }
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 11pt;
              line-height: 1.35;
              color: #000;
              background: #fff;
              margin: 0;
              padding: 10px;
            }
            .kopstuk {
              border-bottom: 2px solid #000;
              padding-bottom: 8px;
              margin-bottom: 16px;
              line-height: 1.2;
            }
            .kopstuk-instansi { font-size: 10pt; font-weight: bold; text-transform: uppercase; }
            .kopstuk-satuan { font-size: 9pt; font-weight: normal; }
            .judul-dokumen {
              text-align: center;
              font-size: 12pt;
              font-weight: bold;
              text-decoration: underline;
              margin-top: 14px;
              margin-bottom: 3px;
              text-transform: uppercase;
            }
            .nomor-dokumen { text-align: center; font-size: 10pt; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10.5pt; }
            th, td { padding: 4px 6px; vertical-align: top; }
            .bordered-table th, .bordered-table td { border: 1px solid #000; padding: 5px 8px; }
            .bordered-table th { background: #f0f0f0; text-align: center; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .ttd-box { margin-top: 24px; width: 100%; }
            .ttd-col { width: 45%; display: inline-block; vertical-align: top; text-align: center; font-size: 10pt; }
            .stempel-badge {
              border: 2px solid #166534;
              color: #166534;
              padding: 4px 8px;
              border-radius: 4px;
              font-weight: bold;
              font-size: 8pt;
              display: inline-block;
              margin-top: 4px;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const handleDownloadDoc = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>${currentDoc.title} - ${nama}</title>
          <style>
            body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.4; color: #000; }
            .kopstuk { border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 16px; }
            .judul-dokumen { text-align: center; font-size: 12pt; font-weight: bold; text-decoration: underline; }
            .nomor-dokumen { text-align: center; font-size: 10pt; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            .bordered-table th, .bordered-table td { border: 1px solid #000; padding: 6px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ARSIP_${currentDoc.id.toUpperCase()}_${nrpNip}_${noBerkas}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Dokumen ${currentDoc.shortTitle} berhasil diunduh untuk arsip`);
  };

  const filePath = uploadedFileForCurrentDoc?.filePath || uploadedFileForCurrentDoc?.urlDokumen;
  const isImage = filePath && /\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(filePath);
  const isPdf = filePath && /\.(pdf)($|\?)/i.test(filePath);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0">
        {/* Hidden File Input for uploading */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
          onChange={handleFileUploadChange}
        />

        {/* Modal Header */}
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b bg-muted/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="size-5 text-primary" />
                Pemeriksaan Dokumen &amp; Arsip Digital Lampiran Juknis
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Nomor Berkas: <span className="font-mono font-bold text-foreground">#{noBerkas}</span> · Pemohon: {formatNamaLengkapDinas(nama, pangkat, korps, kategori)} (NRP: {nrpNip})
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {filePath ? (
                <Button
                  size="sm"
                  className="gap-1.5 text-xs font-semibold shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() =>
                    handleDownloadUploaded(
                      filePath,
                      `DOKUMEN_${currentDoc.id.toUpperCase()}_${nrpNip}_${noBerkas}.${isPdf ? "pdf" : isImage ? "jpg" : "bin"}`
                    )
                  }
                >
                  <Download className="size-3.5" /> Unduh Berkas Asli (Cloudinary)
                </Button>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={handleDownloadDoc} className="gap-1.5 text-xs shadow-sm">
                    <Download className="size-3.5" /> Unduh Dokumen (.doc)
                  </Button>
                  <Button size="sm" onClick={handlePrint} className="gap-1.5 text-xs shadow-sm">
                    <Printer className="size-3.5" /> Cetak / Unduh PDF
                  </Button>
                </>
              )}

              {/* Tombol Unggah / Ganti Berkas */}
              <Button
                size="sm"
                variant="outline"
                disabled={uploadDocMutation.isPending}
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5 text-xs shadow-sm border-primary/40"
              >
                {uploadDocMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <UploadCloud className="size-3.5 text-primary" />
                )}
                {filePath ? "Ganti Berkas" : "Unggah Berkas"}
              </Button>
            </div>
          </div>

          {/* Mode Switcher Tabs jika ada berkas terunggah */}
          {filePath && (
            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-1.5 p-1 bg-background rounded-lg border text-xs">
                <button
                  onClick={() => setViewMode("uploaded")}
                  className={`px-3 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                    viewMode === "uploaded"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Cloud className="size-3.5" /> Berkas Asli Terunggah (Cloudinary)
                </button>
                <button
                  onClick={() => setViewMode("template")}
                  className={`px-3 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                    viewMode === "template"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileText className="size-3.5" /> Format Cetak Juknis TNI AD
                </button>
              </div>

              <Badge variant="outline" className="border-success/40 bg-success/10 text-success text-[11px] gap-1">
                <CheckCircle2 className="size-3" /> Tersimpan di Cloudinary &amp; Database
              </Badge>
            </div>
          )}
        </DialogHeader>

        {/* Modal Body: Sidebar Selector + Paper Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* Left Column: Daftar Dokumen Tabs */}
          <div className="md:col-span-4 border-r bg-muted/10 p-3 overflow-y-auto space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
              Daftar Lampiran Berkas ({docList.length})
            </p>
            {docList.map((doc) => {
              const isActive = doc.id === activeDoc;
              // Cek apakah dokumen ini memiliki file terunggah di Cloudinary
              const hasUploaded = allDokumen.some((d) => {
                const j = (d.jenis || d.jenisDokumen || "").toLowerCase();
                const targetId = doc.id.toLowerCase();
                const targetTitle = doc.title.toLowerCase();
                const targetShort = doc.shortTitle.toLowerCase();
                return (
                  j === targetId ||
                  j.includes(targetId) ||
                  j === targetTitle ||
                  j.includes(targetTitle) ||
                  j.includes(targetShort) ||
                  (targetId === "usipa" && (j.includes("usipa") || j.includes("permohonan"))) ||
                  (targetId === "jurbay" && (j.includes("jurbay") || j.includes("juru bayar") || j.includes("rekomendasi"))) ||
                  (targetId === "slip" && (j.includes("slip") || j.includes("gaji"))) ||
                  (targetId === "kta" && (j.includes("kta") || j.includes("ktp") || j.includes("identitas"))) ||
                  (targetId === "potong_gaji" && (j.includes("potong") || j.includes("akad") || j.includes("kuasa")))
                );
              });

              return (
                <button
                  key={doc.id}
                  onClick={() => setActiveDoc(doc.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex items-start gap-2.5 ${
                    isActive
                      ? "bg-primary/10 border-primary/50 text-foreground font-semibold shadow-sm"
                      : "bg-card hover:bg-muted/40 border-border/70 text-muted-foreground"
                  }`}
                >
                  <FileCheck className={`size-4 mt-0.5 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-foreground">{doc.title}</div>
                    <div className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
                      {doc.nomorSurat}
                    </div>
                  </div>
                  {hasUploaded ? (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-success/40 bg-success/15 text-success font-semibold shrink-0 gap-0.5">
                      <Cloud className="size-2.5" /> Cloudinary
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border bg-muted/30 text-muted-foreground shrink-0">
                      Juknis Standar
                    </Badge>
                  )}
                </button>
              );
            })}

            <div className="mt-4 p-3 rounded-xl bg-primary-soft/40 border border-primary/20 text-[11px] text-muted-foreground space-y-1.5">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Shield className="size-3.5 text-primary" /> Keabsahan Berkas Digital
              </div>
              <p>
                Setiap role berhak memeriksa dan mengunduh berkas asli terunggah dari Cloudinary atau dokumen format resmi TNI AD untuk arsip.
              </p>
            </div>
          </div>

          {/* Right Column: Dokumen Viewer */}
          <div className="md:col-span-8 p-4 sm:p-6 overflow-y-auto bg-muted/20 flex justify-center">
            {/* JIKA BERKAS ASLI TERUNGGAH DARI CLOUDINARY TERSEDIA & VIEWMODE = UPLOADED */}
            {viewMode === "uploaded" && filePath ? (
              <div className="w-full max-w-3xl space-y-4">
                <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b">
                    <div className="flex items-center gap-2.5">
                      <div className="grid size-10 place-items-center rounded-xl bg-success/15 text-success border border-success/30">
                        <Cloud className="size-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{currentDoc.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          Berkas Asli Terverifikasi di Cloudinary &amp; Database NeonDB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(filePath, "_blank")}
                        className="gap-1.5 text-xs shadow-sm"
                      >
                        <ExternalLink className="size-3.5" /> Buka Tab Baru
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleDownloadUploaded(
                            filePath,
                            `DOKUMEN_${currentDoc.id.toUpperCase()}_${nrpNip}_${noBerkas}.${isPdf ? "pdf" : isImage ? "jpg" : "bin"}`
                          )
                        }
                        className="gap-1.5 text-xs shadow-sm bg-primary text-primary-foreground"
                      >
                        <Download className="size-3.5" /> Unduh Berkas
                      </Button>
                    </div>
                  </div>

                  {/* PREVIEW CONTAINER */}
                  <div className="w-full rounded-lg border bg-muted/10 p-2 overflow-hidden flex justify-center items-center min-h-[480px]">
                    {isImage ? (
                      <div className="relative group max-w-full">
                        <img
                          src={filePath}
                          alt={currentDoc.title}
                          className="max-h-[620px] w-auto rounded-lg object-contain border shadow-sm mx-auto"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => window.open(filePath, "_blank")}
                            className="gap-1 text-xs"
                          >
                            <ExternalLink className="size-3.5" /> Perbesar Tampilan
                          </Button>
                        </div>
                      </div>
                    ) : isPdf ? (
                      <iframe
                        src={`${filePath}#toolbar=1&navpanes=0`}
                        title={currentDoc.title}
                        className="w-full h-[620px] rounded-lg border bg-background"
                      />
                    ) : (
                      <div className="text-center p-8 space-y-3">
                        <File className="size-16 text-primary mx-auto" />
                        <div>
                          <p className="font-bold text-foreground">{currentDoc.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Dokumen terunggah: Format binary / Office (.doc, .docx)
                          </p>
                        </div>
                        <Button
                          onClick={() =>
                            handleDownloadUploaded(
                              filePath,
                              `DOKUMEN_${currentDoc.id.toUpperCase()}_${nrpNip}_${noBerkas}.docx`
                            )
                          }
                          className="gap-1.5 text-xs font-semibold"
                        >
                          <Download className="size-4" /> Unduh Dokumen Sekarang
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* TAMPILAN FORMAT DOKUMEN JUKNIS RESMI TNI AD (A4 Paper Style) */
              <div
                ref={printRef}
                className="w-full max-w-2xl bg-card rounded-lg border shadow-sm p-6 sm:p-8 text-foreground text-xs leading-relaxed font-serif"
                style={{ minHeight: "650px" }}
              >
                {/* Kopstuk Resmi TNI AD */}
                <div className="border-b-2 border-foreground pb-2 mb-4">
                  <div className="font-bold uppercase tracking-wider text-[11px]">
                    KOMANDO DAERAH MILITER IV/DIPONEGORO
                  </div>
                  <div className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                    INFOLAHTADAM IV/DIPONEGORO
                  </div>
                  <div className="text-[9px] font-sans text-muted-foreground">
                    PRIMER KOPERASI KARTIKA INFOLAHTADAM · WATUGONG SEMARANG
                  </div>
                </div>

                {/* DOKUMEN 1: SURAT PERMOHONAN USIPA */}
                {activeDoc === "usipa" && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="font-bold text-sm uppercase underline">
                        SURAT PERMOHONAN PINJAMAN USIPA
                      </h3>
                      <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                        Nomor: B / SP-USIPA / {noBerkas} / VIII / 2026
                      </p>
                    </div>

                    <p>
                      Kepada Yth.<br />
                      <strong>Kepala Primer Koperasi Kartika Infolahtadam</strong><br />
                      di Tempat
                    </p>

                    <p>
                      Yang bertanda tangan di bawah ini, saya anggota Primer Koperasi Kartika TNI AD:
                    </p>

                    <table className="w-full">
                      <tbody>
                        <tr>
                          <td className="w-36 text-muted-foreground py-0.5">Nama Lengkap</td>
                          <td className="w-3">:</td>
                          <td className="font-semibold text-foreground">
                            {formatNamaLengkapDinas(nama, pangkat, korps, kategori)}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-muted-foreground py-0.5">Pangkat / Korps</td>
                          <td>:</td>
                          <td className="font-medium">{formatPangkatKorps(pangkat, korps, kategori)} ({kategori})</td>
                        </tr>
                        <tr>
                          <td className="text-muted-foreground py-0.5">NRP / NIP</td>
                          <td>:</td>
                          <td className="font-mono">{nrpNip}</td>
                        </tr>
                        <tr>
                          <td className="text-muted-foreground py-0.5">Kesatuan / Satminkal</td>
                          <td>:</td>
                          <td>{satminkal}</td>
                        </tr>
                      </tbody>
                    </table>

                    <p>
                      Dengan ini mengajukan permohonan pinjaman uang pada Unit Simpan Pinjam (USIPA) Primer Koperasi Kartika dengan rincian sebagai berikut:
                    </p>

                    <table className="w-full border border-border my-2 text-xs">
                      <tbody>
                        <tr className="border-b bg-muted/40 font-semibold">
                          <td className="p-2 w-44">Uraian Pengajuan</td>
                          <td className="p-2">Rincian Nilai</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 text-muted-foreground">Nominal Plafon Diajukan</td>
                          <td className="p-2 font-bold text-primary">{formatRp(nominal)}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 text-muted-foreground">Jangka Waktu (Tenor)</td>
                          <td className="p-2 font-semibold">{tenor} Bulan</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 text-muted-foreground">Suku Bunga Koperasi</td>
                          <td className="p-2 font-semibold text-success">{bungaTahun}% p.a (Flat Sesuai Juknis)</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 text-muted-foreground">Angsuran Pokok + Bunga</td>
                          <td className="p-2 font-bold">{formatRp(totalAngsuran)} / bulan</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 text-muted-foreground">Total Pengembalian</td>
                          <td className="p-2">{formatRp(totalPengembalian)}</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-muted-foreground">Keperluan Pinjaman</td>
                          <td className="p-2 italic">{catatan}</td>
                        </tr>
                      </tbody>
                    </table>

                    <p className="text-[11px] text-justify leading-relaxed">
                      Demikian permohonan ini saya buat dengan sebenarnya. Saya bersedia memenuhi segala ketentuan yang berlaku di lingkungan Primer Koperasi Kartika dan memberi kuasa untuk dilakukan pemotongan gaji rutin bulanan sampai dengan pinjaman dinyatakan lunas.
                    </p>

                    <div className="pt-4 flex justify-between items-start text-center">
                      <div className="w-44">
                        <p className="text-[10px] text-muted-foreground">Mengetahui,</p>
                        <p className="font-semibold text-[11px]">Ketua Primkop Kartika</p>
                        <div className="h-14 flex items-center justify-center">
                          <span className="text-[9px] border border-dashed border-primary/40 px-2 py-0.5 rounded text-primary font-sans">
                            [TERVERIFIKASI SISTEM]
                          </span>
                        </div>
                        <p className="font-bold underline text-[11px]">Letkol Cba Dedi Kurnia</p>
                        <p className="text-[10px] font-mono">NRP 11020033</p>
                      </div>

                      <div className="w-44">
                        <p className="text-[10px] text-muted-foreground">Semarang, {tanggal}</p>
                        <p className="font-semibold text-[11px]">Pemohon Pinjaman</p>
                        <div className="h-14 flex items-center justify-center">
                          <span className="text-[9px] border border-success/40 bg-success/10 px-2 py-0.5 rounded text-success font-sans font-bold">
                            [TANDA TANGAN ELEKTRONIK]
                          </span>
                        </div>
                        <p className="font-bold underline text-[11px]">{nama}</p>
                        <p className="text-[10px] font-mono">NRP {nrpNip}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* DOKUMEN 2: REKOMENDASI JURU BAYAR */}
                {activeDoc === "jurbay" && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="font-bold text-sm uppercase underline">
                        SURAT REKOMENDASI DAN KETERANGAN KELAYAKAN GAJI
                      </h3>
                      <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                        Nomor: Rek / JB-{noBerkas} / VIII / 2026
                      </p>
                    </div>

                    <p>
                      Yang bertanda tangan di bawah ini Juru Bayar Satuan {satminkal}, menerangkan dengan sebenarnya bahwa:
                    </p>

                    <table className="w-full">
                      <tbody>
                        <tr>
                          <td className="w-36 text-muted-foreground py-0.5">Nama Personel</td>
                          <td className="w-3">:</td>
                          <td className="font-semibold">{formatNamaLengkapDinas(nama, pangkat, korps, kategori)}</td>
                        </tr>
                        <tr>
                          <td className="text-muted-foreground py-0.5">Pangkat / NRP</td>
                          <td>:</td>
                          <td>{formatPangkatKorps(pangkat, korps, kategori)} / {nrpNip}</td>
                        </tr>
                        <tr>
                          <td className="text-muted-foreground py-0.5">Kesatuan</td>
                          <td>:</td>
                          <td>{satminkal}</td>
                        </tr>
                      </tbody>
                    </table>

                    <p className="font-semibold text-foreground">
                      Berdasarkan catatan daftar gaji berjalan, personel tersebut memiliki kemampuan keuangan sbb:
                    </p>

                    <table className="w-full border border-border text-xs">
                      <tbody>
                        <tr className="border-b bg-muted/40 font-semibold">
                          <td className="p-2">Komponen Evaluasi Penghasilan</td>
                          <td className="p-2 text-right">Jumlah (Rp)</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">Gaji Pokok + Tunjangan Kinerja (Bruto)</td>
                          <td className="p-2 text-right font-semibold">Rp 8.700.000</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">Potongan Wajib Rutin (TWP, BPJS, Pajak)</td>
                          <td className="p-2 text-right text-destructive">- Rp 1.450.000</td>
                        </tr>
                        <tr className="border-b bg-muted/20">
                          <td className="p-2 font-semibold">Sisa Penghasilan Bersih (Netto)</td>
                          <td className="p-2 text-right font-bold text-foreground">Rp 7.250.000</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">Rencana Angsuran Pinjaman Koperasi per Bulan</td>
                          <td className="p-2 text-right font-bold text-primary">{formatRp(totalAngsuran)}</td>
                        </tr>
                        <tr className="border-b bg-success/10 text-success">
                          <td className="p-2 font-bold">Rasio Angsuran terhadap Gaji</td>
                          <td className="p-2 text-right font-bold">
                            {((totalAngsuran / 8700000) * 100).toFixed(1)}% (Batas Maksimal Aman: 40%)
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="p-3 rounded-lg border border-success/30 bg-success/10 text-success text-[11px] font-medium">
                      KESIMPULAN: Berdasarkan rasio kemampuan potong gaji dan kelengkapan administrasi, yang bersangkutan dinyatakan <strong>LAYAK &amp; MEMENUHI SYARAT</strong> untuk memperoleh pinjaman senilai {formatRp(nominal)} dengan tenor {tenor} bulan.
                    </div>

                    <div className="pt-4 flex justify-end text-center">
                      <div className="w-48">
                        <p className="text-[10px] text-muted-foreground">Semarang, {tanggal}</p>
                        <p className="font-semibold text-[11px]">Juru Bayar Satuan,</p>
                        <div className="h-14 flex items-center justify-center">
                          <span className="text-[9px] border border-success/40 bg-success/10 px-2 py-0.5 rounded text-success font-sans font-bold">
                            [TERVERIFIKASI JURUBAYAR]
                          </span>
                        </div>
                        <p className="font-bold underline text-[11px]">Serma Agus Setyono</p>
                        <p className="text-[10px] font-mono">NRP 2108019920</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* DOKUMEN 3: SLIP GAJI 3 BULAN */}
                {activeDoc === "slip" && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="font-bold text-sm uppercase underline">
                        RINCIAN PENGHASILAN DAN SLIP GAJI PERSONEL
                      </h3>
                      <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                        Lampiran Slip Gaji Bulan Berjalan · Periode 2026
                      </p>
                    </div>

                    <table className="w-full">
                      <tbody>
                        <tr>
                          <td className="w-36 text-muted-foreground py-0.5">Nama Prajurit/PNS</td>
                          <td className="w-3">:</td>
                          <td className="font-semibold">{formatNamaLengkapDinas(nama, pangkat, korps, kategori)}</td>
                        </tr>
                        <tr>
                          <td className="text-muted-foreground py-0.5">NRP / NIP</td>
                          <td>:</td>
                          <td className="font-mono">{nrpNip}</td>
                        </tr>
                        <tr>
                          <td className="text-muted-foreground py-0.5">Pangkat / Korps</td>
                          <td>:</td>
                          <td>{formatPangkatKorps(pangkat, korps, kategori)}</td>
                        </tr>
                        <tr>
                          <td className="text-muted-foreground py-0.5">Kesatuan</td>
                          <td>:</td>
                          <td>{satminkal}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="border rounded p-2.5 space-y-1 text-[11px]">
                        <p className="font-bold text-primary border-b pb-1">I. RINCIAN PENERIMAAN</p>
                        <div className="flex justify-between"><span>Gaji Pokok:</span><span>Rp 4.950.000</span></div>
                        <div className="flex justify-between"><span>Tunjangan Istri/Anak:</span><span>Rp 650.000</span></div>
                        <div className="flex justify-between"><span>Tunjangan Beras/ULP:</span><span>Rp 1.200.000</span></div>
                        <div className="flex justify-between"><span>Tunjangan Kinerja:</span><span>Rp 2.900.000</span></div>
                        <Separator />
                        <div className="flex justify-between font-bold text-foreground"><span>Total Bruto:</span><span>Rp 9.700.000</span></div>
                      </div>

                      <div className="border rounded p-2.5 space-y-1 text-[11px]">
                        <p className="font-bold text-destructive border-b pb-1">II. RINCIAN POTONGAN</p>
                        <div className="flex justify-between"><span>IWP &amp; Asabri:</span><span>Rp 420.000</span></div>
                        <div className="flex justify-between"><span>TWP TNI AD:</span><span>Rp 250.000</span></div>
                        <div className="flex justify-between"><span>Simpanan Wajib Koperasi:</span><span>Rp 100.000</span></div>
                        <div className="flex justify-between"><span>Potongan Angsuran Pinjaman:</span><span className="font-bold text-primary">{formatRp(totalAngsuran)}</span></div>
                        <Separator />
                        <div className="flex justify-between font-bold text-destructive"><span>Total Potongan:</span><span>{formatRp(770000 + totalAngsuran)}</span></div>
                      </div>
                    </div>

                    <div className="p-3 bg-muted/40 rounded border flex justify-between items-center font-bold">
                      <span>Penghasilan Bersih Diterima (Take Home Pay):</span>
                      <span className="text-sm text-success">{formatRp(9700000 - (770000 + totalAngsuran))}</span>
                    </div>

                    <div className="pt-2 text-right">
                      <p className="text-[10px] text-muted-foreground">Semarang, {tanggal}</p>
                      <p className="text-[10px] font-semibold">Tercatat pada Buku Gaji Induk TNI AD</p>
                    </div>
                  </div>
                )}

                {/* DOKUMEN 4: FOTOKOPI KTA / KTP */}
                {activeDoc === "kta" && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="font-bold text-sm uppercase underline">
                        LEMBAR VERIFIKASI IDENTITAS DINAS &amp; KEPENDUDUKAN
                      </h3>
                      <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                        Lampiran Dokumen Identitas Prajurit / Anggota Koperasi
                      </p>
                    </div>

                    <div className="border border-dashed border-primary/40 rounded-xl p-4 bg-primary-soft/20 space-y-3">
                      <div className="flex items-center gap-3 border-b border-primary/20 pb-3">
                        <div className="grid size-12 place-items-center rounded-lg bg-primary text-primary-foreground font-bold">
                          <Shield className="size-6" />
                        </div>
                        <div>
                          <div className="font-bold text-sm">{formatNamaLengkapDinas(nama, pangkat, korps, kategori)}</div>
                          <div className="text-muted-foreground font-mono">NRP: {nrpNip} · KTA KARTIKA AKTIF</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div><span className="text-muted-foreground block">Nomor KTA TNI AD:</span><span className="font-mono font-semibold">{nrpNip}-AD-2026</span></div>
                        <div><span className="text-muted-foreground block">Nomor Induk Kependudukan (NIK):</span><span className="font-mono font-semibold">337401{nrpNip.slice(0, 6)}0001</span></div>
                        <div><span className="text-muted-foreground block">Pangkat / Golongan:</span><span className="font-semibold">{formatPangkatKorps(pangkat, korps, kategori)}</span></div>
                        <div><span className="text-muted-foreground block">Kesatuan / Satminkal:</span><span className="font-semibold">{satminkal}</span></div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border bg-muted/40 text-[11px] space-y-1">
                      <p className="font-bold text-foreground">Status Verifikasi Identitas:</p>
                      <p>✔ Identitas Prajurit aktif telah divalidasi sesuai Buku Induk Prajurit Infolahtadam.</p>
                      <p>✔ Tidak sedang dalam masa persiapan pensiun (MPP) atau masa skorsing.</p>
                      <p>✔ Terdaftar sebagai anggota resmi Primkopad berhak menerima fasilitas USIPA.</p>
                    </div>

                    <div className="pt-2 text-right">
                      <p className="text-[10px] text-muted-foreground">Diverifikasi secara digital oleh Tim Administrasi Primkop Kartika</p>
                    </div>
                  </div>
                )}

                {/* DOKUMEN 5: SURAT PERNYATAAN POTONG GAJI */}
                {activeDoc === "potong_gaji" && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="font-bold text-sm uppercase underline">
                        SURAT KUASA PEMOTONGAN GAJI &amp; PERJANJIAN AKAD KREDIT
                      </h3>
                      <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                        Nomor: AKAD-PG / {noBerkas} / VIII / 2026
                      </p>
                    </div>

                    <p>
                      Yang bertanda tangan di bawah ini saya:
                    </p>

                    <table className="w-full">
                      <tbody>
                        <tr>
                          <td className="w-36 text-muted-foreground py-0.5">Nama Lengkap</td>
                          <td className="w-3">:</td>
                          <td className="font-semibold">{formatNamaLengkapDinas(nama, pangkat, korps, kategori)}</td>
                        </tr>
                        <tr>
                          <td className="text-muted-foreground py-0.5">Pangkat / NRP</td>
                          <td>:</td>
                          <td>{formatPangkatKorps(pangkat, korps, kategori)} / {nrpNip}</td>
                        </tr>
                        <tr>
                          <td className="text-muted-foreground py-0.5">Kesatuan</td>
                          <td>:</td>
                          <td>{satminkal}</td>
                        </tr>
                      </tbody>
                    </table>

                    <p className="text-[11px] text-justify leading-relaxed">
                      Dengan ini memberikan <strong>KUASA PENUH DAN MUTLAK</strong> yang tidak dapat dicabut kembali kepada:
                    </p>

                    <div className="p-3 rounded-lg border bg-muted/20 text-[11px] space-y-1">
                      <p className="font-bold">BENDAHARA PRIMER KOPERASI KARTIKA &amp; JURU BAYAR SATUAN</p>
                      <p>Untuk memotong gaji bulanan / tunjangan kinerja saya setiap bulan sebesar <strong>{formatRp(totalAngsuran)}</strong> selama <strong>{tenor} (dua puluh empat) bulan berturut-turut</strong> terhitung sejak dana pinjaman dicairkan sampai dengan seluruh kewajiban pinjaman sebesar <strong>{formatRp(totalPengembalian)}</strong> dinyatakan lunas.</p>
                    </div>

                    <p className="text-[11px] text-justify leading-relaxed">
                      Apabila sebelum pinjaman lunas saya pindah satuan / pensiun / MPP, maka sisa pinjaman akan dilunasi dari hak-hak penerimaan saya (TWP/Asabri/Uang Pesangon) atau dilanjutkan pemotongan di satuan baru.
                    </p>

                    <div className="pt-4 flex justify-between items-start text-center">
                      <div className="w-44">
                        <p className="text-[10px] text-muted-foreground">Mengetahui,</p>
                        <p className="font-semibold text-[11px]">Juru Bayar Satuan</p>
                        <div className="h-12 flex items-center justify-center">
                          <span className="text-[9px] border border-primary/40 px-2 py-0.5 rounded text-primary font-sans">
                            [TERCATAT JURUBAYAR]
                          </span>
                        </div>
                        <p className="font-bold underline text-[11px]">Serma Agus Setyono</p>
                        <p className="text-[10px] font-mono">NRP 2108019920</p>
                      </div>

                      <div className="w-44">
                        <p className="text-[10px] text-muted-foreground">Semarang, {tanggal}</p>
                        <p className="font-semibold text-[11px]">Pemberi Kuasa (Debitur)</p>
                        <div className="h-12 flex items-center justify-center">
                          <span className="text-[9px] border border-success/40 bg-success/10 px-2 py-0.5 rounded text-success font-sans font-bold">
                            [BERMATERAI DIGITAL]
                          </span>
                        </div>
                        <p className="font-bold underline text-[11px]">{nama}</p>
                        <p className="text-[10px] font-mono">NRP {nrpNip}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
