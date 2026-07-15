'use client';

import { useState } from 'react';
import { FileSpreadsheet, Printer } from 'lucide-react';
import { downloadFile } from '../../lib/api';

/**
 * دکمه‌های Export (بخش ۱۰.۷ — ExportButtons): Excel سبز، Print/PDF زرد.
 * با Loading State و دانلود احرازشده (Bearer) از Endpoint مربوطه.
 */
export function ExportButtons({
  excelPath,
  excelName,
  pdfPath,
  pdfName,
}: {
  excelPath?: string;
  excelName?: string;
  pdfPath?: string;
  pdfName?: string;
}): React.ReactElement {
  const [busy, setBusy] = useState<'excel' | 'pdf' | null>(null);

  async function run(kind: 'excel' | 'pdf', path: string, name: string): Promise<void> {
    setBusy(kind);
    try {
      await downloadFile(path, name);
    } catch {
      // خطای دانلود بی‌صدا؛ کاربر می‌تواند دوباره تلاش کند
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex gap-2">
      {excelPath && (
        <button
          onClick={() => void run('excel', excelPath, excelName ?? 'export.xlsx')}
          disabled={busy !== null}
          className="interactive-element flex items-center gap-2 rounded-lg bg-success px-3 py-2 text-sm font-medium text-white shadow-sm transition-all hover:brightness-110 disabled:opacity-60"
        >
          <FileSpreadsheet className="h-4 w-4" />
          {busy === 'excel' ? 'در حال آماده‌سازی…' : 'خروجی Excel'}
        </button>
      )}
      {pdfPath && (
        <button
          onClick={() => void run('pdf', pdfPath, pdfName ?? 'export.pdf')}
          disabled={busy !== null}
          className="interactive-element flex items-center gap-2 rounded-lg bg-warning px-3 py-2 text-sm font-medium text-white shadow-sm transition-all hover:brightness-110 disabled:opacity-60"
        >
          <Printer className="h-4 w-4" />
          {busy === 'pdf' ? 'در حال آماده‌سازی…' : 'چاپ / PDF'}
        </button>
      )}
    </div>
  );
}
