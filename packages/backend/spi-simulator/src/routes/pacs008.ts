import { FastifyInstance } from 'fastify'
import { processPayment, getTransactionByEndToEndId } from '../services/spiService'

interface Pacs008Body {
  Document?: {
    FIToFICstmrCdtTrf?: unknown
  }
}

export function registerPacs008Routes(app: FastifyInstance): void {
  app.post<{ Body: Pacs008Body }>('/spi/pacs.008', async (request, reply) => {
    try {
      const rawXml = (request as any).rawBody || request.body

      let xml: string
      if (typeof rawXml === 'object' && rawXml !== null) {
        const fastifyReq = request as any
        if (fastifyReq.rawBody) {
          xml = fastifyReq.rawBody
        } else {
          return reply.status(400).send({
            status: 'REJECTED',
            reason: 'InvalidContentType',
            details: 'XML body required',
          })
        }
      } else {
        xml = rawXml as string
      }

      if (!xml || (typeof xml === 'string' && xml.trim().length === 0)) {
        return reply.status(400).send({
          status: 'REJECTED',
          reason: 'MissingBody',
          details: 'Request body is empty',
        })
      }

      const result = processPayment(xml)

      return reply.status(200).type('application/xml').send(result.statusXml)
    } catch (error: any) {
      const message = error.message || 'Unknown error'

      if (
        message.includes('Invalid') ||
        message.includes('must be positive') ||
        message.includes('exceeds maximum') ||
        message.includes('missing')
      ) {
        return reply.status(422).send({
          status: 'REJECTED',
          reason: 'ValidationError',
          details: message,
        })
      }

      if (message.includes('Duplicate')) {
        return reply.status(409).send({
          status: 'REJECTED',
          reason: 'DuplicateEndToEndId',
          details: message,
        })
      }

      return reply.status(500).send({
        status: 'REJECTED',
        reason: 'InternalError',
        details: message,
      })
    }
  })

  app.get('/spi/transactions/:endToEndId', async (request, reply) => {
    const { endToEndId } = request.params as { endToEndId: string }
    const tx = getTransactionByEndToEndId(endToEndId)

    if (!tx) {
      return reply.status(404).send({ error: 'Transaction not found' })
    }

    return reply.send(tx)
  })
}
