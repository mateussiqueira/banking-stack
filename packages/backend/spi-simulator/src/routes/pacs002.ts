import { FastifyInstance } from 'fastify'

interface Pacs002Body {
  Document?: {
    FIToFIPmtStsRpt?: unknown
  }
}

export function registerPacs002Routes(app: FastifyInstance): void {
  app.post<{ Body: Pacs002Body }>(
    '/spi/pacs.002',
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

        const parsed = await parsePacs002FromRequest(xml)

        return reply.status(200).send({
          status: 'ACKNOWLEDGED',
          endToEndId: parsed.endToEndId,
          transactionStatus: parsed.status,
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

async function parsePacs002FromRequest(xml: string): Promise<{
  endToEndId: string
  status: string
}> {
  const { parsePacs002 } = await import('../iso20022/parser')
  return parsePacs002(xml)
}
