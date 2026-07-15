/**
 * CSV سبک و بدون وابستگی برای تبادل فایل با ERP (بخش ۱۲.۳ PRD — file-based).
 * از نقل‌قول استاندارد RFC4180 پشتیبانی می‌کند: فیلدهای دارای کاما/نقل‌قول/خط‌جدید
 * داخل "..." و نقل‌قولِ داخلی دوبل می‌شود.
 */

/** پارس متن CSV با ردیف سرآیند → آرایهٔ رکورد {ستون: مقدار}. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows = parseRows(text);
  const header = rows[0];
  if (!header || header.length === 0) {
    return [];
  }
  const records: Record<string, string>[] = [];
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row || (row.length === 1 && row[0] === '')) {
      continue; // ردیف خالی انتهایی
    }
    const rec: Record<string, string> = {};
    for (let c = 0; c < header.length; c += 1) {
      rec[header[c] ?? `col${c}`] = row[c] ?? '';
    }
    records.push(rec);
  }
  return records;
}

function parseRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  // BOM ابتدای فایل (خروجی رایج Excel) حذف می‌شود.
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  for (let i = 0; i < src.length; i += 1) {
    const ch = src.charAt(i);
    if (inQuotes) {
      if (ch === '"') {
        if (src.charAt(i + 1) === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src.charAt(i + 1) === '\n') {
        i += 1;
      }
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function escapeField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** ساخت متن CSV از رکوردها با ترتیب ستون‌های داده‌شده (ردیف سرآیند + داده). */
export function toCsv(columns: string[], records: Record<string, unknown>[]): string {
  const lines = [columns.map(escapeField).join(',')];
  for (const rec of records) {
    lines.push(
      columns
        .map((col) => {
          const value = rec[col];
          return escapeField(value === undefined || value === null ? '' : String(value));
        })
        .join(','),
    );
  }
  return `${lines.join('\r\n')}\r\n`;
}
