export type PendapatanInput = {
  bungaPinjaman: number;
  biayaAdminRisiko: number;
  jasaLain: number;
};

export type BiayaOperasionalInput = {
  honorPengurus: number;
  operasionalKantor: number;
  rapatPendidikanSosial: number;
};

export const hitungPendapatan = (v: PendapatanInput) =>
  v.bungaPinjaman + v.biayaAdminRisiko + v.jasaLain;

export const hitungBiayaOperasional = (v: BiayaOperasionalInput) =>
  v.honorPengurus + v.operasionalKantor + v.rapatPendidikanSosial;

export const hitungShuAkuntansi = (
  pendapatan: PendapatanInput,
  biaya: BiayaOperasionalInput,
) => {
  const totalPendapatan = hitungPendapatan(pendapatan);
  const totalBiaya = hitungBiayaOperasional(biaya);
  const shu = totalPendapatan - totalBiaya;
  return {
    totalPendapatan,
    totalBiaya,
    shu,
    distribusi: {
      cadangan: shu * 0.4,
      jasaModal: shu * 0.2,
      jasaUsaha: shu * 0.3,
      pengurus: shu * 0.05,
      sosial: shu * 0.05,
    },
  };
};
