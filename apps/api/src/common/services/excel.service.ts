import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';

/** تعریف یک ستون خروجی Excel. */
export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  /** ستون عددی → قالب‌بندی هزارگان و ردیف جمع. */
  numeric?: boolean;
}

export interface ExcelExportOptions {
  sheetName: string;
  title: string;
  columns: ExcelColumn[];
  rows: Array<Record<string, unknown>>;
  /** ردیف جمع Footer (کلید ستون → مقدار). */
  sumRow?: Record<string, number>;
}

/**
 * سرویس تولید فایل Excel (بخش ۹.۰ — دکمه Export در همه جداول).
 * جمع‌ها از Backend می‌آیند تا با نمای جدول یکی باشند (بخش ۹.۰).
 */
@Injectable()
export class ExcelService {
  async build(options: ExcelExportOptions): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'پورتال سیمان خاکستری نی‌ریز';
    const sheet = workbook.addWorksheet(options.sheetName, {
      views: [{ rightToLeft: true }],
    });

    const columnCount = options.columns.length;

    // عنوان گزارش (ردیف اول، Merge روی همه ستون‌ها)
    sheet.mergeCells(1, 1, 1, columnCount);
    const titleCell = sheet.getCell(1, 1);
    titleCell.value = options.title;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // ردیف سرستون
    const headerRow = sheet.getRow(2);
    options.columns.forEach((col, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = col.header;
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEFF3F8' },
      };
      sheet.getColumn(index + 1).width = col.width ?? 18;
    });
    headerRow.commit();

    // ردیف‌های داده
    options.rows.forEach((row) => {
      const values = options.columns.map((col) => {
        const value = row[col.key];
        return value === null || value === undefined ? '' : (value as string | number);
      });
      const added = sheet.addRow(values);
      options.columns.forEach((col, index) => {
        if (col.numeric) {
          added.getCell(index + 1).numFmt = '#,##0';
        }
      });
    });

    // ردیف جمع
    if (options.sumRow) {
      const sumValues = options.columns.map((col, index) => {
        if (index === 0) {
          return 'جمع کل';
        }
        return col.numeric ? (options.sumRow?.[col.key] ?? '') : '';
      });
      const sumLine = sheet.addRow(sumValues);
      sumLine.font = { bold: true };
      options.columns.forEach((col, index) => {
        if (col.numeric) {
          sumLine.getCell(index + 1).numFmt = '#,##0';
        }
      });
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }
}
