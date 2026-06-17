import archiver from 'archiver';
import { Readable, PassThrough } from 'stream';

export interface ArchiveFile {
  name: string;
  stream: Readable;
}

export interface ArchiveOptions {
  format?: 'zip' | 'tar';
  level?: number;
}

export function createZipStream(
  files: ArchiveFile[],
  options: ArchiveOptions = {}
): Readable {
  const { format = 'zip', level = 9 } = options;

  const archive = archiver(format, {
    zlib: { level },
  });

  const output = new PassThrough();

  archive.pipe(output);

  for (const file of files) {
    archive.append(file.stream, { name: file.name });
  }

  archive.finalize();

  archive.on('error', (err) => {
    output.destroy(err);
  });

  return output;
}

export async function createZipBuffer(
  files: ArchiveFile[],
  options?: ArchiveOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const stream = createZipStream(files, options);

    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}
