import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { parseMessage, buildMessage, formatMessageSummary } from '../iso8583/parser';
import { ISOMessage } from '../iso8583/types';
import {
  processAuthorization,
  processFinancial,
  processReversal,
} from '../services/issuer';

function parseBodyToISOMessage(body: any, contentType?: string): ISOMessage {
  if (contentType && contentType.includes('text/plain')) {
    return parseMessage(Buffer.from(body, 'ascii'));
  }

  if (typeof body === 'object' && body !== null) {
    const fields: Record<number, string> = {};
    if (body.fields) {
      for (const [k, v] of Object.entries(body.fields)) {
        fields[Number(k)] = String(v);
      }
    }
    return {
      mti: String(body.mti || ''),
      bitmap: body.bitmap || [],
      fields,
    };
  }

  const strBody = String(body).trim();
  if (strBody.length >= 20) {
    return parseMessage(Buffer.from(strBody, 'ascii'));
  }

  throw new Error('Unable to parse request body as ISO 8583 message');
}

function formatResponse(reply: FastifyReply, msg: ISOMessage, format: 'json' | 'raw'): void {
  if (format === 'raw') {
    const buf = buildMessage(msg);
    reply.header('Content-Type', 'text/plain; charset=ascii');
    reply.send(buf.toString('ascii'));
  } else {
    reply.send({
      mti: msg.mti,
      hexBitmap: (() => {
        let h = '';
        for (let i = 0; i < msg.bitmap.length; i += 8) {
          let byte = 0;
          for (let j = 0; j < 8; j++) {
            if (i + j < msg.bitmap.length && msg.bitmap[i + j] === 1) {
              byte |= (1 << (7 - j));
            }
          }
          h += byte.toString(16).toUpperCase().padStart(2, '0');
        }
        return h;
      })(),
      fields: msg.fields,
      summary: formatMessageSummary(msg),
    });
  }
}

function getFormat(request: FastifyRequest): 'json' | 'raw' {
  const queryFormat = (request.query as any)?.format;
  if (queryFormat === 'raw') return 'raw';
  const contentType = request.headers['content-type'] || '';
  if (contentType.includes('text/plain')) return 'raw';
  const accept = request.headers['accept'] || '';
  if (accept.includes('text/plain')) return 'raw';
  return 'json';
}

export default async function issuerRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/iso8583/issuer/authorize', async (request, reply) => {
    try {
      const format = getFormat(request);
      const contentType = request.headers['content-type'] as string;
      const isoMsg = parseBodyToISOMessage(request.body, contentType);
      const response = processAuthorization(isoMsg);
      formatResponse(reply, response, format);
    } catch (err: any) {
      reply.status(400).send({ error: err.message });
    }
  });

  fastify.post('/iso8583/issuer/financial', async (request, reply) => {
    try {
      const format = getFormat(request);
      const contentType = request.headers['content-type'] as string;
      const isoMsg = parseBodyToISOMessage(request.body, contentType);
      const response = processFinancial(isoMsg);
      formatResponse(reply, response, format);
    } catch (err: any) {
      reply.status(400).send({ error: err.message });
    }
  });

  fastify.post('/iso8583/issuer/reversal', async (request, reply) => {
    try {
      const format = getFormat(request);
      const contentType = request.headers['content-type'] as string;
      const isoMsg = parseBodyToISOMessage(request.body, contentType);
      const response = processReversal(isoMsg);
      formatResponse(reply, response, format);
    } catch (err: any) {
      reply.status(400).send({ error: err.message });
    }
  });
}
