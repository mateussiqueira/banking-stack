import { Readable, Transform } from 'stream';
import ExcelJS from 'exceljs';
import { streamToBuffer } from './streams';

export interface XlsxColumn {
  header: string;
  key: string;
  width?: number;
  style?: Partial<ExcelJS.Style>;
  format?: string;
}

export interface XlsxOptions {
  sheetName?: string;
  autoWidth?: boolean;
  headerStyle?: Partial<ExcelJS.Style>;
  columns: XlsxColumn[];
}

export async function generateXlsxStream(
  dataStream: Readable,
  columns: XlsxColumn[],
  options: XlsxOptions = { columns }
): Promise<Buffer> {
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: new PassThroughBuffer(),
    useStyles: true,
  });

  const sheetName = options.sheetName || 'Report';
  const sheet = workbook.addWorksheet(sheetName);

  const headerRow = sheet.addRow(columns.map((c) => c.header));

  if (options.headerStyle) {
    headerRow.eachCell((cell) => {
      Object.assign(cell, options.headerStyle);
    });
  }

  if (options.autoWidth) {
    columns.forEach((col, index) => {
      sheet.getColumn(index + 1).width = col.width || 20;
    });
  }

  for await (const row of dataStream) {
    const rowData = columns.map((col) => {
      const value = (row as Record<string, unknown>)[col.key];
      if (value instanceof Date) {
        return col.format
          ? formatDate(value, col.format)
          : value.toISOString();
      }
      return value?.toString() ?? '';
    });
    sheet.addRow(rowData).commit();
  }

  sheet.commit();
  workbook.commit();

  const buffer = await (workbook as unknown as { stream: PassThroughBuffer }).stream.toBuffer();
  return buffer;
}

export async function generateXlsxMultiSheet(
  sheets: Array<{
    name: string;
    dataStream: Readable;
    columns: XlsxColumn[];
    options?: Partial<XlsxOptions>;
  }>
): Promise<Buffer> {
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: new PassThroughBuffer(),
    useStyles: true,
  });

  for (const sheetDef of sheets) {
    const sheet = workbook.addWorksheet(sheetDef.name);
    const headerRow = sheet.addRow(sheetDef.columns.map((c) => c.header));

    if (sheetDef.options?.autoWidth) {
      sheetDef.columns.forEach((col, index) => {
        sheet.getColumn(index + 1).width = col.width || 20;
      });
    }

    for await (const row of sheetDef.dataStream) {
      const rowData = sheetDef.columns.map((col) => {
        const value = (row as Record<string, unknown>)[col.key];
        return value?.toString() ?? '';
      });
      sheet.addRow(rowData).commit();
    }

    sheet.commit();
  }

  workbook.commit();

  const buffer = await (workbook as unknown as { stream: PassThroughBuffer }).stream.toBuffer();
  return buffer;
}

class PassThroughBuffer extends Transform {
  private chunks: Buffer[] = [];

  _transform(chunk: Buffer, _encoding: string, callback: () => void): void {
    this.chunks.push(chunk);
    callback();
  }

  toBuffer(): Buffer {
    return Buffer.concat(this.chunks);
  }
}

function formatDate(date: Date, format: string): string {
  const map: Record<string, string> = {
    YYYY: date.getFullYear().toString(),
    MM: String(date.getMonth() + 1).padStart(2, '0'),
    DD: String(date.getDate()).padStart(2, '0'),
    HH: String(date.getHours()).padStart(2, '0'),
    mm: String(date.getMinutes()).padStart(2, '0'),
    ss: String(date.getSeconds()).padStart(2, '0'),
  };
  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (match) => map[match]);
}
