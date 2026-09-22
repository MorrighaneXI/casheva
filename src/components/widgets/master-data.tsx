import { useQuery } from "@tanstack/react-query";
import { Building2, FolderKanban, Medal, Percent, UsersRound, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRp, backendRoleToFrontend } from "@/lib/casheva-data";
import { apiMaster, apiUsers } from "@/lib/api";
import { useSession } from "@/components/session-context";
import { useMemo } from "react";

// Default Master Kodifikasi TNI AD fallback reference
const defaultKotamaFallback = [
  { id: "k-07", kode: "07", nama: "KODAM IV/DIPONEGORO", tipe: "KODAM" },
  { id: "k-08", kode: "08", nama: "KODAM V/BRAWIJAYA", tipe: "KODAM" },
  { id: "k-25", kode: "25", nama: "KOPASSUS", tipe: "KOPASSUS" },
  { id: "k-38", kode: "38", nama: "PUSKOMLEKAD", tipe: "BALAKPUS" },
];

const defaultSatminkalFallback = [
  // KODAM IV/DIPONEGORO
  { id: "s-07-1", kode: "344238", nama: "KESDAM IV/DIPONEGORO", kotamaId: "k-07" },
  { id: "s-07-2", kode: "685600", nama: "INFOLAHTADAM IV/DIPONEGORO", kotamaId: "k-07" },
  { id: "s-07-3", kode: "685610", nama: "TOPDAM IV/DIPONEGORO", kotamaId: "k-07" },
  { id: "s-07-4", kode: "685620", nama: "KUDAM IV/DIPONEGORO", kotamaId: "k-07" },

  // KODAM V/BRAWIJAYA
  { id: "s-08-1", kode: "344235", nama: "BEKANGDAM V/BRAWIJAYA", kotamaId: "k-08" },
  { id: "s-08-2", kode: "344236", nama: "PALDAM V/BRAWIJAYA", kotamaId: "k-08" },
  { id: "s-08-3", kode: "344239", nama: "POMDAM V/BRAWIJAYA", kotamaId: "k-08" },
  { id: "s-08-4", kode: "344240", nama: "AJENDAM V/BRAWIJAYA", kotamaId: "k-08" },
  { id: "s-08-5", kode: "SANSIDAM V/BRW", nama: "SANSIDAM V/BRAWIJAYA", kotamaId: "k-08" },

  // KOPASSUS
  { id: "s-25-1", kode: "250001", nama: "MAKOPASSUS", kotamaId: "k-25" },
  { id: "s-25-2", kode: "250002", nama: "PUSDIKLATPASSUS", kotamaId: "k-25" },
  { id: "s-25-3", kode: "250013", nama: "BATALYON 13 KOPASSUS", kotamaId: "k-25" },
  { id: "s-25-4", kode: "250021", nama: "BATALYON 21 KOPASSUS", kotamaId: "k-25" },

  // PUSKOMLEKAD
  { id: "s-38-1", kode: "380001", nama: "PUSDIKKOMLEK", kotamaId: "k-38" },
  { id: "s-38-2", kode: "380002", nama: "YONKOMLEK", kotamaId: "k-38" },
  { id: "s-38-3", kode: "380003", nama: "GUDPUSKOMLEK", kotamaId: "k-38" },
  { id: "s-38-4", kode: "380004", nama: "BENGPUSKOMLEK", kotamaId: "k-38" },
];

export function MasterDataWidget() {
  const { isSuperAdmin, isKotamaAdmin, satminkal: currentSatminkal, satminkalId, kotama: currentKotama, kotamaId } = useSession();

  const { data: rawKotamaList = [], isLoading: loadKotama } = useQuery({
    queryKey: ["master-kotama"],
    queryFn: () => apiMaster.getKotama(),
  });

  const { data: rawSatminkalList = [] } = useQuery({
    queryKey: ["master-satminkal"],
    queryFn: () => apiMaster.getSatminkal(),
  });

  // Gabungkan data API dengan fallback jika list kosong / demo
  const allKotama = useMemo(() => {
    if (rawKotamaList.length > 0) {
      // Pastikan data fallback yang belum ada di API tetap tersedia untuk Super Admin jika database baru berisi 1
      if (isSuperAdmin && rawKotamaList.length < defaultKotamaFallback.length) {
        const existingKodes = new Set(rawKotamaList.map((k) => k.kode.toUpperCase()));
        const missing = defaultKotamaFallback.filter((k) => !existingKodes.has(k.kode.toUpperCase()));
        return [...rawKotamaList, ...missing];
      }
      return rawKotamaList;
    }
    return defaultKotamaFallback;
  }, [rawKotamaList, isSuperAdmin]);

  const allSatminkal = useMemo(() => {
    if (rawSatminkalList.length > 0) {
      if (isSuperAdmin && rawSatminkalList.length < defaultSatminkalFallback.length) {
        const existingKodes = new Set(rawSatminkalList.map((s) => s.kode.toUpperCase()));
        const missing = defaultSatminkalFallback.filter((s) => !existingKodes.has(s.kode.toUpperCase()));
        return [...rawSatminkalList, ...missing];
      }
      return rawSatminkalList;
    }
    return defaultSatminkalFallback;
  }, [rawSatminkalList, isSuperAdmin]);

  // Filter tampilan Kotama & Satminkal sesuai Hak Akses (RBAC)
  const displayKotamaList = useMemo(() => {
    // 1. Super Admin: Menampilkan seluruh Kotama
    if (isSuperAdmin) {
      return allKotama;
    }

    // 2. Admin Kotama: Hanya menampilkan Kotama yang dia loginkan
    if (isKotamaAdmin) {
      const kotamaNorm = (currentKotama || "").trim().toLowerCase();
      const filtered = allKotama.filter(
        (k) =>
          (kotamaId && k.id === kotamaId) ||
          k.nama.toLowerCase().includes(kotamaNorm) ||
          kotamaNorm.includes(k.nama.toLowerCase()) ||
          k.kode.toLowerCase() === kotamaNorm
      );
      return filtered.length > 0 ? filtered : [{ id: kotamaId || "k-current", kode: "07", nama: currentKotama || "KODAM IV/DIPONEGORO", tipe: "KODAM" }];
    }

    // 3. Akun Satminkal (Admin Koperasi, Keprim, Bendahara, Juru Bayar, Kasir, Anggota, Pengawas, Dan/Ka):
    // Hanya menampilkan Kotama induk yang menaunginya
    const kotamaNorm = (currentKotama || "").trim().toLowerCase();
    const filtered = allKotama.filter(
      (k) =>
        (kotamaId && k.id === kotamaId) ||
        k.nama.toLowerCase().includes(kotamaNorm) ||
        kotamaNorm.includes(k.nama.toLowerCase()) ||
        k.kode.toLowerCase() === kotamaNorm
    );
    return filtered.length > 0 ? filtered : [{ id: kotamaId || "k-current", kode: "07", nama: currentKotama || "KODAM IV/DIPONEGORO", tipe: "KODAM" }];
  }, [allKotama, isSuperAdmin, isKotamaAdmin, currentKotama, kotamaId]);

  // Fungsi pembantu untuk mengambil daftar Satminkal di bawah suatu Kotama sesuai hak akses
  const getScopedSatminkalForKotama = (kotama: any) => {
    // Satminkal yang terhubung dengan Kotama ini
    const related = allSatminkal.filter(
      (s: any) =>
        s.kotamaId === kotama.id ||
        (s.kotama && s.kotama.id === kotama.id) ||
        (s.kotama && s.kotama.nama === kotama.nama)
    );

    // 1. Super Admin: Tampilkan semua Satminkal di bawah Kotama ini
    if (isSuperAdmin) {
      return related;
    }

    // 2. Admin Kotama: Tampilkan semua Satminkal di bawah Kotama ini
    if (isKotamaAdmin) {
      return related;
    }

    // 3. Akun Satminkal: HANYA tampilkan satminkal yang sedang di-loginkan
    const satNorm = (currentSatminkal || "").trim().toLowerCase();
    const scoped = related.filter(
      (s) =>
        (satminkalId && s.id === satminkalId) ||
        s.nama.toLowerCase().includes(satNorm) ||
        satNorm.includes(s.nama.toLowerCase()) ||
        s.kode.toLowerCase() === satNorm
    );

    if (scoped.length > 0) {
      return scoped;
    }

    // Fallback jika nama satminkal aktif belum terdaftar di query
    return [
      {
        id: satminkalId || "sat-current",
        kode: "685600",
        nama: currentSatminkal || "INFOLAHTADAM IV/DIPONEGORO",
        kotamaId: kotama.id,
      },
    ];
  };

  const { data: pangkatList = [], isLoading: loadPangkat } = useQuery({
    queryKey: ["master-pangkat"],
    queryFn: () => apiMaster.getPangkat(),
  });

  const { data: korpsList = [] } = useQuery({
    queryKey: ["master-korps"],
    queryFn: () => apiMaster.getKorps(),
  });

  const { data: dokumenList = [] } = useQuery({
    queryKey: ["master-dokumen"],
    queryFn: () => apiMaster.getKelompokDokumen(),
  });

  const { data: userList = [] } = useQuery({
    queryKey: ["users-list"],
    queryFn: () => apiUsers.findAll(),
  });

  const pengurusList = useMemo(() => {
    if (isSuperAdmin) {
      return [
        {
          id: "super-admin-pusat",
          jabatan: "Super Administrator TNI AD",
          nama: "Super Administrator TNI AD",
          periode: "2024 - Sekarang",
          isAktif: true,
        },
      ];
    }

    const officerRoles = [
      "PIMPINAN",
      "KEPRIM",
      "BENDAHARA",
      "PENGAWAS",
      "JURU_BAYAR",
      "KASIR_TOKO",
      "PETUGAS_GADAI",
      "ADMIN_KOPERASI",
      "ADMIN_SATMINKAL",
    ];
    const filtered = userList.filter((u: any) => officerRoles.includes(u.role));
    if (filtered.length > 0) {
      return filtered.map((u: any) => ({
        id: u.id,
        jabatan: backendRoleToFrontend(u.role),
        nama: u.namaLengkap,
        periode: "2024 - 2027",
        isAktif: u.isActive ?? true,
      }));
    }
    return [
      { id: "1", jabatan: "Dan / Ka / Pimpinan", nama: "Kolonel Inf Suryo", periode: "2024 - 2027", isAktif: true },
      { id: "2", jabatan: "Kepala Primkopad (Keprim)", nama: "Letkol Cba Dedi Kurnia", periode: "2024 - 2027", isAktif: true },
      { id: "3", jabatan: "Bendahara", nama: "Lettu Cku Budi", periode: "2024 - 2027", isAktif: true },
      { id: "4", jabatan: "Pengawas Koperasi", nama: "Mayor Inf Tri", periode: "2024 - 2027", isAktif: true },
      { id: "5", jabatan: "Juru Bayar", nama: "Serma Agus", periode: "2024 - 2027", isAktif: true },
    ];
  }, [userList, isSuperAdmin]);

  // Parameter pinjaman standar Juknis TNI AD
  const pinjamanMatrix = [
    { nominal: 1_000_000, tenor: 12, angsuran: 93_333, bunga: 10_000, total: 103_333 },
    { nominal: 3_000_000, tenor: 12, angsuran: 250_000, bunga: 30_000, total: 280_000 },
    { nominal: 5_000_000, tenor: 24, angsuran: 208_333, bunga: 50_000, total: 258_333 },
    { nominal: 10_000_000, tenor: 24, angsuran: 416_666, bunga: 100_000, total: 516_666 },
    { nominal: 15_000_000, tenor: 36, angsuran: 416_666, bunga: 150_000, total: 566_666 },
    { nominal: 20_000_000, tenor: 36, angsuran: 555_555, bunga: 200_000, total: 755_555 },
  ];

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Master Data Referensi Kodifikasi TNI AD</CardTitle>
        <CardDescription>
          Data Kotama, Satminkal, Kepangkatan, Korps, Kelompok Dokumen, dan Parameter Pinjaman
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="kotama">
          <TabsList className="flex w-full flex-wrap">
            <TabsTrigger value="kotama">
              <Building2 className="mr-1 size-4" /> Kotama &amp; Satminkal
            </TabsTrigger>
            <TabsTrigger value="pangkat">
              <Medal className="mr-1 size-4" /> Pangkat &amp; Korps
            </TabsTrigger>
            <TabsTrigger value="pinjaman">
              <Percent className="mr-1 size-4" /> Matriks Pinjaman
            </TabsTrigger>
            <TabsTrigger value="dokumen">
              <FolderKanban className="mr-1 size-4" /> Kelompok Dokumen
            </TabsTrigger>
            <TabsTrigger value="pengurus">
              <UsersRound className="mr-1 size-4" /> Data Pengurus
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kotama" className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20 font-bold">Kode</TableHead>
                  <TableHead className="w-64 font-bold">Komando Utama (Kotama)</TableHead>
                  <TableHead className="font-bold">Daftar Satminkal Terkait</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadKotama && displayKotamaList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                      <Loader2 className="mx-auto size-5 animate-spin mb-1" />
                      Memuat master Kotama...
                    </TableCell>
                  </TableRow>
                ) : (
                  displayKotamaList.map((k) => {
                    const relatedSatminkal = getScopedSatminkalForKotama(k);
                    return (
                      <TableRow key={k.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs font-bold text-foreground align-top pt-3.5">
                          {k.kode}
                        </TableCell>
                        <TableCell className="font-bold text-sm text-foreground align-top pt-3.5">
                          {k.nama}
                        </TableCell>
                        <TableCell className="align-top py-2.5">
                          <div className="flex flex-wrap gap-1.5">
                            {relatedSatminkal.map((s) => (
                              <span
                                key={s.id}
                                className="inline-flex items-center rounded-full border border-border/70 bg-muted/20 px-3 py-1 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
                              >
                                {s.nama} ({s.kode})
                              </span>
                            ))}
                            {relatedSatminkal.length === 0 && (
                              <span className="text-xs text-muted-foreground italic">-</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="pangkat" className="mt-4 overflow-x-auto space-y-6">
            <div>
              <h4 className="text-sm font-semibold mb-2">Daftar Pangkat &amp; Ketentuan Simpanan Sukarela Otomatis</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kategori / Golongan</TableHead>
                    <TableHead>Nama Pangkat</TableHead>
                    <TableHead>Kode</TableHead>
                    <TableHead className="text-right">Potongan Sukarela / Bulan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pangkatList.map((p) => {
                    const nominalSukarela =
                      p.kategori === "PAMEN"
                        ? 300_000
                        : p.kategori === "PAMA"
                          ? 250_000
                          : 150_000;
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {p.kategori}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{p.nama}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {p.kode}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {formatRp(nominalSukarela)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Daftar Korps TNI AD</h4>
              <div className="flex flex-wrap gap-2">
                {korpsList.map((c) => (
                  <Badge key={c.id} variant="secondary" className="px-3 py-1 text-xs">
                    {c.kode} — {c.nama}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pinjaman" className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plafon Pinjaman</TableHead>
                  <TableHead className="text-center">Tenor</TableHead>
                  <TableHead className="text-right">Angsuran Pokok</TableHead>
                  <TableHead className="text-right">Bunga 1% (Flat)</TableHead>
                  <TableHead className="text-right font-bold">Total Angsuran/Bulan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pinjamanMatrix.map((m) => (
                  <TableRow key={`${m.nominal}-${m.tenor}`}>
                    <TableCell className="font-semibold">{formatRp(m.nominal)}</TableCell>
                    <TableCell className="text-center">{m.tenor} Bulan</TableCell>
                    <TableCell className="text-right">{formatRp(m.angsuran)}</TableCell>
                    <TableCell className="text-right text-success">{formatRp(m.bunga)}</TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {formatRp(m.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="dokumen" className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kelompok Dokumen</TableHead>
                  <TableHead>Keterangan / Persyaratan</TableHead>
                  <TableHead>Status Wajib</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dokumenList.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.nama}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {d.keterangan || "Berkas persyaratan administrasi pinjaman"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-primary/30 text-primary text-xs">
                        Wajib
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="pengurus" className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jabatan Pengurus</TableHead>
                  <TableHead>Nama Pejabat</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pengurusList.map((peng: any) => (
                  <TableRow key={peng.id}>
                    <TableCell className="font-medium">{peng.jabatan}</TableCell>
                    <TableCell>{peng.nama}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{peng.periode}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          peng.isAktif
                            ? "border-success/30 bg-success/15 text-success"
                            : "border-muted text-muted-foreground"
                        }
                      >
                        {peng.isAktif ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
