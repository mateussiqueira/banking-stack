import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

export interface PdfTableColumn {
  header: string;
  key: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

export interface PdfReportOptions {
  title?: string;
  subtitle?: string;
  columns: PdfTableColumn[];
  pageSize?: 'A4' | 'LETTER';
  orientation?: 'portrait' | 'landscape';
  pageMargins?: number;
}

export function generatePdfReport(
  data: Record<string, unknown>[],
  template: PdfReportOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: template.pageSize || 'A4',
      layout: template.orientation || 'portrait',
      margins: {
        top: template.pageMargins ?? 40,
        bottom: template.pageMargins ?? 40,
        left: template.pageMargins ?? 40,
        right: template.pageMargins ?? 40,
      },
      info: {
        Title: template.title || 'Report',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const margin = template.pageMargins ?? 40;
    const pageWidth =
      (template.orientation === 'landscape' ? 841.89 : 595.28) - margin * 2;
    const pageHeight =
      (template.orientation === 'landscape' ? 595.28 : 841.89) - margin * 2;

    const colWidths = template.columns.map(
      (col, _i) =>
        col.width || pageWidth / template.columns.length
    );

    if (template.title) {
      doc.fontSize(18).font('Helvetica-Bold').text(template.title, {
        align: 'center',
      });
      doc.moveDown(0.5);
    }

    if (template.subtitle) {
      doc.fontSize(11).font('Helvetica').text(template.subtitle, {
        align: 'center',
        color: '#666666',
      });
      doc.moveDown(1);
    }

    doc.fontSize(8);

    const rowHeight = 16;
    const headerHeight = 20;
    const tableTop = doc.y;

    function drawHeader() {
      let x = margin;
      doc.font('Helvetica-Bold');
      template.columns.forEach((col, i) => {
        doc.rect(x, doc.y, colWidths[i], headerHeight).fill('#2563eb');
        doc.fill('#ffffff').text(col.header, x + 4, doc.y + 4, {
          width: colWidths[i] - 8,
          align: col.align || 'left',
        });
        x += colWidths[i];
      });
      doc.y += headerHeight;
    }

    function drawRow(row: Record<string, unknown>, isEven: boolean) {
      if (doc.y + rowHeight > pageHeight + margin) {
        doc.addPage();
        drawHeader();
      }

      let x = margin;
      doc.font('Helvetica');

      if (isEven) {
        doc
          .rect(x, doc.y, pageWidth, rowHeight)
          .fill('#f3f4f6');
      }

      x = margin;
      template.columns.forEach((col, i) => {
        const value = String(row[col.key] ?? '');
        doc.fill('#111827').text(value, x + 4, doc.y + 4, {
          width: colWidths[i] - 8,
          align: col.align || 'left',
        });
        x += colWidths[i];
      });

      doc.y += rowHeight;
    }

    drawHeader();
    data.forEach((row, idx) => drawRow(row, idx % 2 === 1));

    doc.end();
  });
}

export function generatePdfStream(
  dataStream: Readable,
  template: PdfReportOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const rows: Record<string, unknown>[] = [];
    dataStream.on('data', (chunk) => rows.push(chunk as Record<string, unknown>));
    dataStream.on('end', () => {
      generatePdfReport(rows, template).then(resolve).catch(reject);
    });
    dataStream.on('error', reject);
  });
}

// TODO: support custom header/footer templates with logo
