import { Readable } from 'stream';
import { generateCsvStream, generateCsvBuffer } from '../generators/csv';
import { generateXlsxStream, XlsxColumn } from '../generators/xlsx';
import { generatePdfReport } from '../generators/pdf';
import { createZipStream, createZipBuffer } from '../generators/archive';
import { createReadStream, transformStream, batchStream, progressStream, streamToBuffer } from '../generators/streams';

const mockData = Array.from({ length: 100 }, (_, i) => ({
  id: `tx-${i}`,
  amount: i * 100,
  type: i % 2 === 0 ? 'PIX_IN' : 'PIX_OUT',
  status: i % 3 === 0 ? 'FAILED' : 'COMPLETED',
  date: new Date().toISOString(),
}));

describe('CSV Generator', () => {
  it('should generate CSV from data stream', async () => {
    const stream = Readable.from(mockData);
    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'Amount', key: 'amount' },
      { header: 'Type', key: 'type' },
    ];

    const buffer = await generateCsvBuffer(stream, columns);
    const content = buffer.toString('utf-8');

    expect(content).toContain('ID,Amount,Type');
    expect(content).toContain('tx-0');
    expect(content).toContain('PIX_IN');

    const lines = content.trim().split('\n');
    expect(lines.length).toBe(mockData.length + 1);
  });

  it('should handle special characters in CSV', async () => {
    const data = [
      { field: 'contains "quotes"', value: 'has, comma' },
      { field: 'normal', value: 'text' },
    ];
    const stream = Readable.from(data);
    const columns = [
      { header: 'Field', key: 'field' },
      { header: 'Value', key: 'value' },
    ];

    const buffer = await generateCsvBuffer(stream, columns);
    const content = buffer.toString('utf-8');

    expect(content).toContain('"contains ""quotes"""');
    expect(content).toContain('"has, comma"');
  });

  it('should generate large CSV with streaming', async () => {
    const largeData = Array.from({ length: 10000 }, (_, i) => ({
      id: `tx-${i}`,
      amount: i,
    }));

    const stream = Readable.from(largeData);
    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'Amount', key: 'amount' },
    ];

    const start = Date.now();
    const buffer = await generateCsvBuffer(stream, columns);
    const elapsed = Date.now() - start;

    const lines = buffer.toString('utf-8').trim().split('\n');
    expect(lines.length).toBe(10001);
    expect(elapsed).toBeLessThan(5000);
  });
});

describe('XLSX Generator', () => {
  it('should generate XLSX from data stream', async () => {
    const stream = Readable.from(mockData.slice(0, 10));
    const columns: XlsxColumn[] = [
      { header: 'ID', key: 'id', width: 30 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Type', key: 'type', width: 12 },
    ];

    const buffer = await generateXlsxStream(stream, columns, {
      sheetName: 'Test Report',
      autoWidth: true,
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);

    const header = buffer.slice(0, 4).toString('hex');
    const isPkHeader =
      header === '504b0304' ||
      header === '504b34' ||
      buffer.slice(0, 2).toString('hex') === '504b';
    expect(isPkHeader).toBe(true);
  });

  it('should handle empty data', async () => {
    const stream = Readable.from([]);
    const columns: XlsxColumn[] = [
      { header: 'ID', key: 'id' },
    ];

    const buffer = await generateXlsxStream(stream, columns);
    expect(buffer).toBeInstanceOf(Buffer);
  });
});

describe('PDF Generator', () => {
  it('should generate PDF with table', async () => {
    const data = mockData.slice(0, 5);
    const buffer = await generatePdfReport(data, {
      title: 'Test Report',
      columns: [
        { header: 'ID', key: 'id', width: 150 },
        { header: 'Amount', key: 'amount', width: 100 },
        { header: 'Status', key: 'status', width: 100 },
      ],
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.toString('latin1').includes('Test Report')).toBe(true);
  });
});

describe('Archive Generator', () => {
  it('should create ZIP with multiple files', async () => {
    const files = [
      {
        name: 'file1.txt',
        stream: Readable.from(Buffer.from('content1')),
      },
      {
        name: 'file2.txt',
        stream: Readable.from(Buffer.from('content2')),
      },
    ];

    const buffer = await createZipBuffer(files);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);

    const isZip =
      buffer.slice(0, 2).toString('hex') === '504b';
    expect(isZip).toBe(true);
  });
});

describe('Stream Utilities', () => {
  it('should transform stream data', async () => {
    const stream = Readable.from([{ value: 1 }, { value: 2 }, { value: 3 }]);
    const doubled = stream.pipe(
      transformStream((chunk: { value: number }) => ({
        value: chunk.value * 2,
      }))
    );

    const results: unknown[] = [];
    for await (const item of doubled) {
      results.push(item);
    }

    expect(results).toEqual([{ value: 2 }, { value: 4 }, { value: 6 }]);
  });

  it('should batch stream items', async () => {
    const stream = Readable.from([1, 2, 3, 4, 5]);
    const batched = stream.pipe(batchStream(2));

    const results: unknown[] = [];
    for await (const item of batched) {
      results.push(item);
    }

    expect(results).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('should track progress', async () => {
    const stream = Readable.from([1, 2, 3, 4, 5]);
    const progressCalls: number[] = [];

    const progress = stream.pipe(
      progressStream((count) => {
        progressCalls.push(count);
      })
    );

    const results: unknown[] = [];
    for await (const item of progress) {
      results.push(item);
    }

    expect(results).toEqual([1, 2, 3, 4, 5]);
    expect(progressCalls).toContain(5);
  });

  it('should convert stream to buffer', async () => {
    const stream = Readable.from([Buffer.from('hello '), Buffer.from('world')]);
    const buffer = await streamToBuffer(stream as Readable);
    expect(buffer.toString()).toBe('hello world');
  });
});
