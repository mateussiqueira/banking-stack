import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable, PassThrough } from 'stream';
import { config } from '../config';

class StorageService {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.client = new S3Client({
      endpoint: config.s3.endpoint,
      region: config.s3.region,
      credentials: {
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
      },
      forcePathStyle: config.s3.forcePathStyle,
    });
    this.bucket = config.s3.bucket;
  }

  async uploadStream(
    stream: Readable,
    key: string,
    contentType: string
  ): Promise<{ url: string; size: number }> {
    const chunks: Buffer[] = [];
    let totalSize = 0;

    const collectingStream = new PassThrough();
    collectingStream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
      totalSize += chunk.length;
    });

    stream.pipe(collectingStream);

    await new Promise<void>((resolve, reject) => {
      collectingStream.on('finish', resolve);
      collectingStream.on('error', reject);
    });

    const body = Buffer.concat(chunks);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );

    return {
      url: `${config.s3.endpoint}/${this.bucket}/${key}`,
      size: totalSize,
    };
  }

  async getDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: config.reports.presignedUrlExpiry,
    });
  }

  async deleteFile(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }

  async uploadBuffer(
    buffer: Buffer,
    key: string,
    contentType: string
  ): Promise<{ url: string; size: number }> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    return {
      url: `${config.s3.endpoint}/${this.bucket}/${key}`,
      size: buffer.length,
    };
  }
}

export const storageService = new StorageService();
