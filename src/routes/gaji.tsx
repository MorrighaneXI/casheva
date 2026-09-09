import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  MinusCircle,
  Wallet,
  Printer,
  UserCheck,
  Search,
  Loader2,
  Calendar,
  CheckCircle2,
  Download,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { useSession } from "@/components/session-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  formatRp,
  formatNamaLengkapDinas,
  formatPangkatKorps,
  cleanNamaPersonel,
} from "@/lib/casheva-data";
import { apiAnggota, apiSimpanan, apiPinjaman, type Anggota } from "@/lib/api";

export const Route = createFileRoute("/gaji")({
  head: () => ({
    meta: [
      { title: "Rincian Gaji — Casheva Koperasi TNI AD" },
      {
        name: "description",
        content: "Rincian gaji pokok, tunjangan, dan potongan anggota koperasi TNI AD.",
      },
      { property: "og:title", content: "Rincian Gaji — Casheva" },
      {
        property: "og:description",
        content: "Pantau komponen gaji dan potongan koperasi Anda.",
      },
    ],
  }),
  component: GajiPage,
});

function GajiPage() {
  const { user, role, isAdmin } = useSession();
  const isAnggota = role === "Anggota";
  const canSelectMember = isAdmin || role === "Bendahara" || role === "Admin Koperasi" || role === "Keprim" || role === "Pimpinan / Dan / Ka";

  const [selectedAnggotaId, setSelectedAnggotaId] = useState<string>("");

  // Queries
  const { data: anggotaList = [], isLoading: loadingAnggota } = useQuery({
    queryKey: ["anggota-list-active"],
    queryFn: () => apiAnggota.findAll(true),
  });

  const { data: simpananList = [] } = useQuery({
    queryKey: ["simpanan-rekap"],
    queryFn: () => apiSimpanan.getRekap(),
  });

  const { data: pinjamanList = [] } = useQuery({
    queryKey: ["pinjaman-angsuran-all"],
    queryFn: () => apiPinjaman.findAll(),
  });

  // Tentukan anggota yang aktif ditampilkan
  const activeAnggota = useMemo(() => {
    if (!anggotaList || anggotaList.length === 0) return null;

    if (isAnggota) {
      // 1. Cari berdasarkan NRP
      const byNrp = anggotaList.find((a) => a.nrpNip === user?.username);
      if (byNrp) return byNrp;

      // 2. Cari berdasarkan ID
      const byId = anggotaList.find((a) => a.id === user?.id);
      if (byId) return byId;

      // 3. Cari berdasarkan Nama Lengkap
      if (user?.namaLengkap) {
        const cleanUser = cleanNamaPersonel(user.namaLengkap).toLowerCase();
        const byName = anggotaList.find((a) => {
          const cleanA = cleanNamaPersonel(a.nama).toLowerCase();
          return cleanA === cleanUser || cleanA.includes(cleanUser) || cleanUser.includes(cleanA);
        });
        if (byName) return byName;
      }
      return anggotaList[0];
    }

    // Role Bendahara/Admin: gunakan yang dipilih di Select dropdown
    if (selectedAnggotaId) {
      const found = anggotaList.find((a) => a.id === selectedAnggotaId);
      if (found) return found;
    }

    return anggotaList[0];
  }, [anggotaList, user, isAnggota, selectedAnggotaId]);

  // Kalkulasi komponen gaji & potongan dinamis
  const salaryProfile = useMemo(() => {
    if (!activeAnggota) {
      return {
        nama: "Personel TNI AD",
        nrp: "-",
        pangkat: "",
        korps: "",
        kategori: "BINTARA",
        satminkal: "INFOLAHTADAM IV/DIPONEGORO",
        gajiPokok: 5_400_000,
        tunkin: 2_100_000,
        tunjanganLain: 350_000,
        potongan: [
          { nama: "Simpanan Wajib", jumlah: 150_000 },
          { nama: "Simpanan Sukarela", jumlah: 150_000 },
          { nama: "Iuran Koperasi", jumlah: 25_000 },
          { nama: "Asuransi / Dana Sosial", jumlah: 50_000 },
        ],
      };
    }

    const rankName = (activeAnggota.pangkat?.nama || "").toUpperCase();
    const rankKat = (activeAnggota.pangkat?.kategori || "").toUpperCase();

    // Standar Skala Penghasilan Dinas TNI AD per Golongan
    let gajiPokok = 4_600_000;
    let tunkin = 2_100_000;
    let tunjanganLain = 350_000;
    let defaultWajib = 150_000;
    let defaultSukarela = 150_000;

    if (rankKat.includes("PATI") || rankName.includes("JENDERAL") || rankName.includes("MAYJEN") || rankName.includes("BRIGJEN")) {
      gajiPokok = 6_200_000;
      tunkin = 4_500_000;
      tunjanganLain = 850_000;
      defaultWajib = 300_000;
      defaultSukarela = 300_000;
    } else if (rankKat.includes("PAMEN") || rankName.includes("KOLONEL") || rankName.includes("LETKOL") || rankName.includes("MAYOR")) {
      gajiPokok = 5_800_000;
      tunkin = 3_200_000;
      tunjanganLain = 650_000;
      defaultWajib = 200_000;
      defaultSukarela = 200_000;
    } else if (rankKat.includes("PAMA") || rankName.includes("KAPTEN") || rankName.includes("LETTU") || rankName.includes("LETDA")) {
      gajiPokok = 5_200_000;
      tunkin = 2_600_000;
      tunjanganLain = 450_000;
      defaultWajib = 150_000;
      defaultSukarela = 150_000;
    } else if (rankKat.includes("BINTARA") || rankName.includes("PELTU") || rankName.includes("PELDA") || rankName.includes("SERMA") || rankName.includes("SERKA") || rankName.includes("SERTU") || rankName.includes("SERDA")) {
      gajiPokok = 5_400_000;
      tunkin = 2_100_000;
      tunjanganLain = 350_000;
      defaultWajib = 100_000;
      defaultSukarela = 100_000;
    } else {
      // Tamtama & PNS
      gajiPokok = 4_200_000;
      tunkin = 1_800_000;
      tunjanganLain = 300_000;
      defaultWajib = 100_000;
      defaultSukarela = 100_000;
    }

    // Cari data simpanan riil anggota jika ada
    const userSimpanan = simpananList.find(
      (s) => s.nrpNip === activeAnggota.nrpNip || s.anggotaId === activeAnggota.id
    );
    const nominalWajib = userSimpanan
      ? Number(userSimpanan.totalWajib ?? userSimpanan.simpananWajib ?? defaultWajib)
      : defaultWajib;

    // Cari pinjaman aktif anggota
    const activeMemberLoans = pinjamanList.filter(
      (p) =>
        (p.anggotaId === activeAnggota.id || p.anggota?.nrpNip === activeAnggota.nrpNip) &&
        ["DICAIRKAN", "LUNAS"].includes(p.status)
    );

    // Hitung rincian potongan
    const potonganList: { nama: string; jumlah: number }[] = [
      { nama: "Simpanan Wajib", jumlah: nominalWajib > 0 ? (nominalWajib > 500_000 ? defaultWajib : nominalWajib) : defaultWajib },
      { nama: "Simpanan Sukarela", jumlah: defaultSukarela },
    ];

    // Tambahkan potongan angsuran pinjaman jika anggota punya pinjaman aktif
    if (activeMemberLoans.length > 0) {
      activeMemberLoans.forEach((loan) => {
        if (loan.status === "DICAIRKAN") {
          const unpaidAngsuran = (loan.angsuran || []).find((a: any) => !a.dibayar);
          const nominalAngsuran = unpaidAngsuran
            ? Number(unpaidAngsuran.total || 0)
            : Math.round(Number(loan.nominal || 0) / (loan.tenorBulan || 12));
          
          if (nominalAngsuran > 0) {
            potonganList.push({
              nama: `Angsuran Pinjaman #${loan.id.slice(0, 8).toUpperCase()}`,
              jumlah: nominalAngsuran,
            });
          }
        }
      });
    }

    // Potongan rutin lainnya
    potonganList.push({ nama: "Iuran Koperasi", jumlah: 25_000 });
    potonganList.push({ nama: "Asuransi & Dana Sosial", jumlah: 50_000 });

    return {
      nama: activeAnggota.nama,
      nrp: activeAnggota.nrpNip,
      pangkat: activeAnggota.pangkat?.nama || "",
      korps: activeAnggota.korps?.nama || "",
      kategori: activeAnggota.pangkat?.kategori || "BINTARA",
      satminkal: activeAnggota.satminkal?.nama || "INFOLAHTADAM IV/DIPONEGORO",
      gajiPokok,
      tunkin,
      tunjanganLain,
      potongan: potonganList,
    };
  }, [activeAnggota, simpananList, pinjamanList]);

  const bruto = salaryProfile.gajiPokok + salaryProfile.tunkin + salaryProfile.tunjanganLain;
  const totalPotongan = salaryProfile.potongan.reduce((sum, row) => sum + row.jumlah, 0);
  const netto = bruto - totalPotongan;

  const currentMonthName = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rincian Gaji"
        description={
          loadingAnggota ? (
            "Memuat data gaji personel..."
          ) : (
            `${formatNamaLengkapDinas(
              salaryProfile.nama,
              salaryProfile.pangkat,
              salaryProfile.korps,
              salaryProfile.kategori
            )} · NRP ${salaryProfile.nrp} · ${salaryProfile.satminkal}`
          )
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canSelectMember && anggotaList.length > 0 && (
              <Select
                value={activeAnggota?.id || ""}
                onValueChange={(val) => setSelectedAnggotaId(val)}
              >
                <SelectTrigger className="w-[240px] bg-background">
                  <UserCheck className="size-4 mr-2 text-primary" />
                  <SelectValue placeholder="Pilih Anggota..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {anggotaList.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {formatPangkatKorps(a.pangkat?.nama, a.korps?.nama)} {a.nama} ({a.nrpNip})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handlePrint}
            >
              <Printer className="size-4" /> Cetak Slip Gaji
            </Button>
            <Badge variant="outline" className="border-primary/30 bg-primary-soft text-primary font-medium">
              Slip {currentMonthName}
            </Badge>
          </div>
        }
      />

      {/* Ringkasan Kartu Penghasilan */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card card-interactive border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription>Gaji Bruto</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            {loadingAnggota ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : (
              <p className="text-2xl font-extrabold text-foreground">{formatRp(bruto)}</p>
            )}
            <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
              <Wallet className="size-5" />
            </span>
          </CardContent>
        </Card>

        <Card className="shadow-card card-interactive border-destructive/20">
          <CardHeader className="pb-2">
            <CardDescription>Total Potongan</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            {loadingAnggota ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : (
              <p className="text-2xl font-extrabold text-destructive">{formatRp(totalPotongan)}</p>
            )}
            <span className="grid size-10 place-items-center rounded-xl bg-destructive/10 text-destructive">
              <MinusCircle className="size-5" />
            </span>
          </CardContent>
        </Card>

        <Card className="shadow-card card-interactive border-success/30 bg-success-soft/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-success font-semibold">Gaji Bersih Diterima</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            {loadingAnggota ? (
              <Loader2 className="size-5 animate-spin text-success" />
            ) : (
              <p className="text-2xl font-extrabold text-success">{formatRp(netto)}</p>
            )}
            <span className="grid size-10 place-items-center rounded-xl bg-success/20 text-success">
              <Banknote className="size-5" />
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Rincian Komponen Pendapatan & Potongan */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Komponen Pendapatan */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Komponen Pendapatan</CardTitle>
            <CardDescription>Gaji pokok dan tunjangan dinas bulan ini</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              ["Gaji pokok", salaryProfile.gajiPokok],
              ["Tunjangan kinerja (Tunkin)", salaryProfile.tunkin],
              ["Tunjangan lain", salaryProfile.tunjanganLain],
            ].map(([label, amount]) => (
              <div key={String(label)} className="flex items-center justify-between gap-3 py-1.5 border-b border-border/40 last:border-0">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold text-foreground">{formatRp(Number(amount))}</span>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 pt-3 font-bold">
              <span>Total Penghasilan Bruto</span>
              <span className="text-primary font-extrabold text-base">{formatRp(bruto)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Rincian Potongan */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Rincian Potongan</CardTitle>
            <CardDescription>Potongan koperasi dan kewajiban berjalan</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="pl-6">Jenis Potongan</TableHead>
                  <TableHead className="text-right pr-6">Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaryProfile.potongan.map((row) => (
                  <TableRow key={row.nama}>
                    <TableCell className="pl-6 font-medium text-foreground">{row.nama}</TableCell>
                    <TableCell className="text-right pr-6 font-semibold text-destructive">
                      {formatRp(row.jumlah)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-destructive/5 font-bold">
                  <TableCell className="pl-6 font-extrabold">TOTAL POTONGAN</TableCell>
                  <TableCell className="text-right pr-6 font-extrabold text-destructive text-base">
                    {formatRp(totalPotongan)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
