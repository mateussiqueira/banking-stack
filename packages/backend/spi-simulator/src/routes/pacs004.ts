import { FastifyInstance } from 'fastify'

interface Pacs004Body {
  Document?: {
    FIToFIPmtRtr?: unknown
  }
}

export function registerPacs004Routes(app: FastifyInstance): void {
  app.post<{ Body: Pacs004Body }>(
    '/spi/pacs.004',
    async (request, reply) => {
      try {
        const fastifyReq = request as any
        const xml: string | undefined =
          fastifyReq.rawBody || (request.body as any)?.xml

        if (!xml) {
          return reply.status(400).send({
            status: 'REJECTED',
            reason: 'MissingBody',
            details: 'XML body required',
          })
        }

        const parsed = await parsePacs004FromRequest(xml)

        return reply.status(200).send({
          status: 'ACKNOWLEDGED',
          endToEndId: parsed.endToEndId,
          originalEndToEndId: parsed.originalEndToEndId,
          reasonCode: parsed.reasonCode,
          amount: parsed.amount,
          receivedAt: new Date().toISOString(),
        })
      } catch (error: any) {
        const message = error.message || 'Unknown error'

        if (message.includes('Invalid') || message.includes('missing')) {
          return reply.status(422).send({
            status: 'REJECTED',
            reason: 'ValidationError',
            details: message,
          })
        }

        return reply.status(500).send({
          status: 'REJECTED',
          reason: 'InternalError',
          details: message,
        })
      }
    }
  )
}

async function parsePacs004FromRequest(xml: string): Promise<{
  endToEndId: string
  originalEndToEndId: string
  reasonCode: string
  amount: number
}> {
  const { parsePacs004 } = await import('../iso20022/parser')
  return parsePacs004(xml)
}
