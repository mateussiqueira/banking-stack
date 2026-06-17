import { Readable, Transform, pipeline } from 'stream';
import mongoose, { Query } from 'mongoose';
import highland from 'highland';

export function createReadStream<T>(
  query: mongoose.Query<T[], T>
): Readable {
  const cursor = query.cursor();
  return Readable.from(cursor);
}

export function createModelReadStream<T>(
  model: mongoose.Model<T>,
  filter: Record<string, unknown> = {},
  batchSize = 1000
): Readable {
  const cursor = model.find(filter).cursor({ batchSize });
  return Readable.from(cursor);
}

export function transformStream<T, R>(
  mapper: (chunk: T) => R | Promise<R>
): Transform {
  return new Transform({
    objectMode: true,
    async transform(chunk: T, _encoding, callback) {
      try {
        const result = await mapper(chunk);
        callback(null, result);
      } catch (err) {
        callback(err as Error);
      }
    },
  });
}

export function batchStream(batchSize: number): Transform {
  let buffer: unknown[] = [];

  return new Transform({
    objectMode: true,
    transform(chunk, _encoding, callback) {
      buffer.push(chunk);
      if (buffer.length >= batchSize) {
        const batch = buffer;
        buffer = [];
        callback(null, batch);
      } else {
        callback();
      }
    },
    flush(callback) {
      if (buffer.length > 0) {
        const batch = buffer;
        buffer = [];
        callback(null, batch);
      } else {
        callback();
      }
    },
  });
}

export function progressStream(
  onProgress: (count: number) => void
): Transform {
  let count = 0;

  return new Transform({
    objectMode: true,
    transform(chunk, _encoding, callback) {
      count++;
      if (count % 100 === 0) {
        onProgress(count);
      }
      callback(null, chunk);
    },
    flush(callback) {
      onProgress(count);
      callback();
    },
  });
}

export function highlandTransform<T, R>(
  stream: highland.Stream<T>,
  mapper: (item: T) => R
): highland.Stream<R> {
  return stream.map(mapper);
}

export function highlandBatch<T>(
  stream: highland.Stream<T>,
  batchSize: number
): highland.Stream<T[]> {
  return stream.batchWithTimeOrCount(batchSize, 1000);
}

export function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

export function pipelineAsync(...streams: import('stream').Stream[]): Promise<void> {
  return new Promise((resolve, reject) => {
    pipeline(streams as import('stream').NodeJS.ReadableStream[], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export { highland };
