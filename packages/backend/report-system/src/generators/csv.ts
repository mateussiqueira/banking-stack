import { Readable, Transform } from 'stream';

export interface CsvColumn {
  header: string;
  key: string;
}

export interface CsvOptions {
  delimiter?: string;
  encoding?: BufferEncoding;
  includeHeaders?: boolean;
}

function escapeField(value: string, delimiter: string): string {
  if (
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r')
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function generateCsvStream(
  dataStream: Readable,
  columns: CsvColumn[],
  options: CsvOptions = {}
): Transform {
  const {
    delimiter = ',',
    encoding = 'utf-8',
    includeHeaders = true,
  } = options;

  let headersWritten = false;
  let rowCount = 0;

  const transform = new Transform({
    writableObjectMode: true,
    readableObjectMode: false,

    transform(row: Record<string, unknown>, _encoding, callback) {
      try {
        if (includeHeaders && !headersWritten) {
          const headerLine =
            columns.map((c) => escapeField(c.header, delimiter)).join(delimiter) +
            '\n';
          this.push(Buffer.from(headerLine, encoding));
          headersWritten = true;
        }

        const values = columns.map((col) => {
          const raw = row[col.key];
          const str = raw === null || raw === undefined ? '' : String(raw);
          return escapeField(str, delimiter);
        });

        const line = values.join(delimiter) + '\n';
        this.push(Buffer.from(line, encoding));
        rowCount++;
        callback();
      } catch (err) {
        callback(err as Error);
      }
    },
  });

  return transform;
}

export function generateCsvBuffer(
  dataStream: Readable,
  columns: CsvColumn[],
  options?: CsvOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const transform = generateCsvStream(dataStream, columns, options);

    transform.on('data', (chunk: Buffer) => chunks.push(chunk));
    transform.on('end', () => resolve(Buffer.concat(chunks)));
    transform.on('error', reject);

    dataStream.pipe(transform, { end: true });
  });
}
