/**
 * Utility Ekspor Data ke Excel & CSV untuk Koperasi TNI AD Casheva
 * Mendukung format spreadsheet Excel dengan kop resmi, styling header, dan format numerik Rupiah.
 */

export interface ExcelExportOptions {
  filename: string;
  title: string;
  satminkal?: string;
  periode?: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
  summary?: { label: string; value: string | number }[];
}

/**
 * Ekspor data ke Spreadsheet Excel (.xls / XML Spreadsheet) dengan Header & Styling Resmi
 */
export function exportToExcel(options: ExcelExportOptions) {
  const {
    filename,
    title,
    satminkal = "INFOLAHTADAM IV/DIPONEGORO",
    periode = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
    headers,
    rows,
    summary = [],
  } = options;

  const sanitizeText = (val: any) => {
    if (val === null || val === undefined) return "-";
    return String(val)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };

  const tableHeaderCols = headers
    .map(
      (h) =>
        `<th style="background-color: #1e3a29; color: #ffffff; font-weight: bold; border: 1px solid #000000; padding: 8px 12px; text-align: center; font-size: 11pt;">${sanitizeText(
          h
        )}</th>`
    )
    .join("");

  const tableRows = rows
    .map((row, idx) => {
      const bg = idx % 2 === 0 ? "#ffffff" : "#f8f9fa";
      const cells = row
        .map((cell) => {
          const isNum = typeof cell === "number";
          const align = isNum ? "right" : "left";
          return `<td style="border: 1px solid #cccccc; padding: 6px 10px; text-align: ${align}; font-size: 10pt;">${sanitizeText(
            cell
          )}</td>`;
        })
        .join("");
      return `<tr style="background-color: ${bg};">${cells}</tr>`;
    })
    .join("");

  const summaryRows = summary
    .map(
      (s) =>
        `<tr>
          <td colspan="${Math.max(1, headers.length - 2)}" style="font-weight: bold; text-align: right; padding: 6px 10px; border: 1px solid #000000; background-color: #e9ecef;">${sanitizeText(
          s.label
        )}</td>
          <td colspan="2" style="font-weight: bold; text-align: right; padding: 6px 10px; border: 1px solid #000000; background-color: #d1e7dd; color: #0f5132;">${sanitizeText(
          s.value
        )}</td>
        </tr>`
    )
    .join("");

  const htmlContent = `
  <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <!--[if gte mso 9]>
    <xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>${sanitizeText(filename.substring(0, 30))}</x:Name>
            <x:WorksheetOptions>
              <x:DisplayGridlines/>
            </x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
    <style>
      body { font-family: 'Arial', sans-serif; font-size: 10pt; }
      table { border-collapse: collapse; width: 100%; }
    </style>
  </head>
  <body>
    <table>
      <tr>
        <td colspan="${headers.length}" style="font-size: 14pt; font-weight: bold; text-align: center; color: #1e3a29;">KOPERASI SIMPAN PINJAM TNI AD — CASHEVA</td>
      </tr>
      <tr>
        <td colspan="${headers.length}" style="font-size: 12pt; font-weight: bold; text-align: center;">${sanitizeText(
    title.toUpperCase()
  )}</td>
      </tr>
      <tr>
        <td colspan="${headers.length}" style="font-size: 10pt; text-align: center; color: #555555;">Satminkal: ${sanitizeText(
    satminkal
  )} | Periode: ${sanitizeText(periode)} | Dicetak: ${new Date().toLocaleString(
    "id-ID"
  )}</td>
      </tr>
      <tr><td colspan="${headers.length}">&nbsp;</td></tr>
      <thead>
        <tr>${tableHeaderCols}</tr>
      </thead>
      <tbody>
        ${tableRows}
        ${summaryRows}
      </tbody>
    </table>
  </body>
  </html>
  `;

  const blob = new Blob([htmlContent], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const cleanFilename = filename.toLowerCase().endsWith(".xls") ? filename : `${filename}.xls`;
  link.setAttribute("href", url);
  link.setAttribute("download", cleanFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Ekspor data ke file CSV dengan UTF-8 BOM
 */
export function exportToCSV(filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]) {
  const escapeCSV = (value: any) => {
    if (value === null || value === undefined) return '""';
    const stringValue = String(value).replace(/"/g, '""');
    return `"${stringValue}"`;
  };

  const headerLine = headers.map(escapeCSV).join(";");
  const dataLines = rows.map((row) => row.map(escapeCSV).join(";"));
  const csvContent = "\uFEFF" + [headerLine, ...dataLines].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const cleanFilename = filename.toLowerCase().endsWith(".csv") ? filename : `${filename}.csv`;
  link.setAttribute("href", url);
  link.setAttribute("download", cleanFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
