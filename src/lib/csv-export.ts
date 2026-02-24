/**
 * CSV export utility for billing cost reports.
 * Converts a list of billing records into a RFC-4180 compliant CSV string
 * and triggers a browser download.
 */

export interface BillingExportRow {
  date: string;
  service: string;
  team: string;
  environment: string;
  region: string;
  amount: number;
  currency: string;
  usageType?: string;
  description?: string;
}

function escapeCsvField(value: string | number | undefined): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  // Wrap in quotes if the field contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export function buildCsv(rows: BillingExportRow[]): string {
  const headers: (keyof BillingExportRow)[] = [
    'date', 'service', 'team', 'environment', 'region',
    'amount', 'currency', 'usageType', 'description',
  ];

  const headerLine = headers.join(',');
  const dataLines = rows.map((row) =>
    headers.map((h) => escapeCsvField(row[h])).join(',')
  );

  return [headerLine, ...dataLines].join('\n');
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convenience: build CSV from rows and immediately trigger a browser download.
 *
 * @param rows     Billing records to export.
 * @param prefix   Optional filename prefix (default "spendlens-export").
 */
export function exportBillingCsv(
  rows: BillingExportRow[],
  prefix = 'spendlens-export'
): void {
  const today = new Date().toISOString().slice(0, 10);
  const filename = `${prefix}-${today}.csv`;
  downloadCsv(filename, buildCsv(rows));
}
