export const buildInvoiceNumber = (date = new Date(), sequence = 1) => {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const n = String(sequence).padStart(4, "0");
  return `#INV${yy}${mm}${dd}${n}`;
};

export const nextInvoiceFromList = (existing: string[], date = new Date()) => {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const prefix = `#INV${yy}${mm}${dd}`;
  const todaySeq = existing
    .filter((x) => x.startsWith(prefix))
    .map((x) => Number(x.slice(prefix.length)))
    .filter((x) => Number.isFinite(x));
  const nextSeq = (todaySeq.length ? Math.max(...todaySeq) : 0) + 1;
  return buildInvoiceNumber(date, nextSeq);
};
