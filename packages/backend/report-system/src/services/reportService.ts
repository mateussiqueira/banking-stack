import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { Report, IReport, ReportType, ReportFormat, ReportStatus } from '../models/report';
import { createModelReadStream, transformStream, progressStream, streamToBuffer } from '../generators/streams';
import { generateXlsxStream, XlsxColumn } from '../generators/xlsx';
import { generateCsvStream, CsvColumn } from '../generators/csv';
import { generatePdfReport, PdfReportOptions } from '../generators/pdf';
import { storageService } from './storageService';
import { Readable, Transform } from 'stream';

const mockData = generateMockData(1000);

function generateMockData(count: number): Record<string, unknown>[] {
  const types = ['PIX_IN', 'PIX_OUT', 'TED', 'BOLETO'];
  const statuses = ['COMPLETED', 'PENDING', 'FAILED'];
  return Array.from({ length: count }, (_, i) => ({
    id: `tx-${i + 1}`,
    amount: Math.random() * 10000,
    type: types[Math.floor(Math.random() * types.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    description: `Transaction ${i + 1}`,
    createdAt: dayjs()
      .subtract(Math.floor(Math.random() * 30), 'day')
      .toISOString(),
    customer: {
      name: `Customer ${i + 1}`,
      document: `${String(10000000000 + i).padStart(11, '0')}`,
    },
  }));
}

function createDataStream(): Readable {
  let index = 0;
  return new Readable({
    objectMode: true,
    read() {
      if (index < mockData.length) {
        this.push(mockData[index]);
        index++;
      } else {
        this.push(null);
      }
    },
  });
}

interface CreateReportInput {
  name: string;
  type: ReportType;
  format: ReportFormat;
  filters?: Record<string, unknown>;
}

class ReportService {
  async createReport(input: CreateReportInput): Promise<IReport> {
    const report = await Report.create({
      name: input.name,
      type: input.type,
      format: input.format,
      filters: input.filters || {},
      status: 'PENDING',
    });

    this.generateReport(report._id.toString()).catch((err) => {
      console.error(`Report generation failed: ${err.message}`);
    });

    return report;
  }

  async generateReport(reportId: string): Promise<void> {
    const report = await Report.findById(reportId);
    if (!report) throw new Error(`Report ${reportId} not found`);

    await Report.findByIdAndUpdate(reportId, { status: 'GENERATING' });

    try {
      const dataStream = createDataStream();

      const mappedStream = dataStream.pipe(
        transformStream((row: Record<string, unknown>) => ({
          id: row.id,
          amount: `R$ ${(row.amount as number).toFixed(2)}`,
          type: row.type,
          status: row.status,
          description: row.description,
          date: row.createdAt,
          customerName: (row.customer as Record<string, unknown>).name,
          customerDoc: (row.customer as Record<string, unknown>).document,
        }))
      );

      const progress = progressStream((count) => {
        console.log(`Report ${reportId}: processed ${count} records`);
      });

      const progressStreamInstance = mappedStream.pipe(progress);

      let buffer: Buffer;
      const key = `reports/${reportId}/${report.name}-${dayjs().format('YYYYMMDDHHmmss')}`;

      switch (report.format) {
        case 'CSV': {
          const columns: CsvColumn[] = [
            { header: 'ID', key: 'id' },
            { header: 'Amount', key: 'amount' },
            { header: 'Type', key: 'type' },
            { header: 'Status', key: 'status' },
            { header: 'Description', key: 'description' },
            { header: 'Date', key: 'date' },
            { header: 'Customer', key: 'customerName' },
            { header: 'Document', key: 'customerDoc' },
          ];
          const csvStream = progressStreamInstance.pipe(
            generateCsvStream(progressStreamInstance, columns)
          );
          buffer = await streamToBuffer(csvStream as Readable);
          const result = await storageService.uploadBuffer(
            buffer,
            `${key}.csv`,
            'text/csv'
          );

          await Report.findByIdAndUpdate(reportId, {
            status: 'COMPLETED',
            fileUrl: result.url,
            fileSize: result.size,
            recordCount: mockData.length,
            completedAt: new Date(),
          });
          break;
        }

        case 'XLSX': {
          const columns: XlsxColumn[] = [
            { header: 'ID', key: 'id', width: 30 },
            { header: 'Amount', key: 'amount', width: 15 },
            { header: 'Type', key: 'type', width: 12 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Description', key: 'description', width: 25 },
            { header: 'Date', key: 'date', width: 20 },
            { header: 'Customer', key: 'customerName', width: 20 },
            { header: 'Document', key: 'customerDoc', width: 15 },
          ];

          const allData: Record<string, unknown>[] = [];
          for await (const row of progressStreamInstance) {
            allData.push(row as Record<string, unknown>);
          }

          const dataReadable = Readable.from(allData);
          buffer = await generateXlsxStream(dataReadable, columns, {
            sheetName: report.name,
            autoWidth: true,
          });

          const result = await storageService.uploadBuffer(
            buffer,
            `${key}.xlsx`,
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          );

          await Report.findByIdAndUpdate(reportId, {
            status: 'COMPLETED',
            fileUrl: result.url,
            fileSize: result.size,
            recordCount: allData.length,
            completedAt: new Date(),
          });
          break;
        }

        case 'JSON': {
          const jsonParts: string[] = ['['];
          let first = true;
          for await (const row of progressStreamInstance) {
            if (!first) jsonParts.push(',');
            jsonParts.push(JSON.stringify(row));
            first = false;
          }
          jsonParts.push(']');
          buffer = Buffer.from(jsonParts.join(''), 'utf-8');

          const result = await storageService.uploadBuffer(
            buffer,
            `${key}.json`,
            'application/json'
          );

          await Report.findByIdAndUpdate(reportId, {
            status: 'COMPLETED',
            fileUrl: result.url,
            fileSize: result.size,
            recordCount: mockData.length,
            completedAt: new Date(),
          });
          break;
        }

        case 'PDF': {
          const allData: Record<string, unknown>[] = [];
          for await (const row of progressStreamInstance) {
            allData.push(row as Record<string, unknown>);
          }

          const pdfOptions: PdfReportOptions = {
            title: report.name,
            subtitle: `Generated on ${dayjs().format('DD/MM/YYYY HH:mm')}`,
            columns: [
              { header: 'ID', key: 'id', width: 80 },
              { header: 'Amount', key: 'amount', width: 60 },
              { header: 'Type', key: 'type', width: 60 },
              { header: 'Status', key: 'status', width: 60 },
              { header: 'Description', key: 'description', width: 100 },
              { header: 'Date', key: 'date', width: 80 },
              { header: 'Customer', key: 'customerName', width: 80 },
            ],
            orientation: 'landscape',
          };

          buffer = await generatePdfReport(allData, pdfOptions);

          const result = await storageService.uploadBuffer(
            buffer,
            `${key}.pdf`,
            'application/pdf'
          );

          await Report.findByIdAndUpdate(reportId, {
            status: 'COMPLETED',
            fileUrl: result.url,
            fileSize: result.size,
            recordCount: allData.length,
            completedAt: new Date(),
          });
          break;
        }

        default:
          throw new Error(`Unsupported format: ${report.format}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      await Report.findByIdAndUpdate(reportId, {
        status: 'FAILED',
        error: message,
        completedAt: new Date(),
      });
      throw err;
    }
  }

  async getReport(id: string): Promise<IReport | null> {
    return Report.findById(id);
  }

  async listReports(
    page = 1,
    limit = 20
  ): Promise<{ reports: IReport[]; total: number; page: number; pages: number }> {
    const skip = (page - 1) * limit;
    const [reports, total] = await Promise.all([
      Report.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Report.countDocuments(),
    ]);

    return {
      reports,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async deleteReport(id: string): Promise<void> {
    const report = await Report.findById(id);
    if (!report) throw new Error(`Report ${id} not found`);

    if (report.fileUrl) {
      const key = report.fileUrl.split('/').slice(-2).join('/');
      await storageService.deleteFile(key).catch(() => {});
    }

    await Report.findByIdAndDelete(id);
  }
}

export const reportService = new ReportService();
