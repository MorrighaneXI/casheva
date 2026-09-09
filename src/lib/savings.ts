import type { Anggota } from "@/lib/casheva-data";
import { potonganSukarela } from "@/lib/casheva-data";

export type SimpananTrx = {
  id: string;
  nama: string;
  jenis: "Pokok" | "Wajib" | "Sukarela";
  tipe: "Setoran" | "Penarikan";
  jumlah: number;
  tgl: string;
};

export const SIMPANAN_DEFAULT = {
  pokok: 50_000,
  wajib: 100_000,
} as const;

export const getPotonganSukarela = (golongan: Anggota["golongan"]): number => {
  if (golongan === "Pamen") return (potonganSukarela as any)["Pamen"] ?? 300_000;
  if (golongan === "Pama") return (potonganSukarela as any)["Pama"] ?? 250_000;
  return (potonganSukarela as any)["Ba/Ta/ASN"] ?? 150_000;
};

const formatDateID = (d: Date) =>
  d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

export const generateSukarelaBatch = (
  anggota: Anggota[],
  date = new Date(),
): SimpananTrx[] => {
  const tgl = formatDateID(date);
  return anggota
    .filter((a) => a.status === "Aktif")
    .map((a, idx) => ({
      id: `TRX-BATCH-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(idx + 1).padStart(4, "0")}`,
      nama: a.nama,
      jenis: "Sukarela",
      tipe: "Setoran",
      jumlah: getPotonganSukarela(a.golongan),
      tgl,
    }));
};
