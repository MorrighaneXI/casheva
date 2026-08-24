/**
 * Utility untuk mengekspor data array JSON ke file CSV / Excel kompatibel (.csv dengan UTF-8 BOM)
 */
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCSV = (value: string | number) => {
    if (value === null || value === undefined) return '""';
    const stringValue = String(value).replace(/"/g, '""');
    return `"${stringValue}"`;
  };

  const headerLine = headers.map(escapeCSV).join(';');
  const dataLines = rows.map((row) => row.map(escapeCSV).join(';'));
  const csvContent = '\uFEFF' + [headerLine, ...dataLines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
