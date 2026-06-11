import { FastifyInstance } from 'fastify'
import { createClaim, getClaim, confirmClaim, cancelClaim } from '../services/dictService'

interface CreateClaimBody {
  key: string
  targetIspb: string
  targetAccount: string
  targetBranch: string
  targetAccountHolderName: string
}

export function registerClaimsRoutes(app: FastifyInstance): void {
  app.post('/dict/claims', async (request, reply) => {
    try {
      const body = request.body as CreateClaimBody
      const claim = await createClaim(body)
      return reply.status(201).send(claim)
    } catch (error: any) {
      if (error.message?.includes('already an open claim')) {
        return reply.status(409).send({ error: error.message })
      }
      if (error.message?.includes('not found')) {
        return reply.status(404).send({ error: error.message })
      }
      return reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })

  app.get('/dict/claims/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const claim = await getClaim(id)
      if (!claim) {
        return reply.status(404).send({ error: 'Claim not found' })
      }
      return reply.send(claim)
    } catch (error: any) {
      return reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })

  app.post('/dict/claims/:id/confirm', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const claim = await confirmClaim(id)
      if (!claim) {
        return reply.status(404).send({ error: 'Claim not found' })
      }
      return reply.send(claim)
    } catch (error: any) {
      if (error.message?.includes('not in OPEN status')) {
        return reply.status(422).send({ error: error.message })
      }
      return reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })

  app.post('/dict/claims/:id/cancel', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const claim = await cancelClaim(id)
      if (!claim) {
        return reply.status(404).send({ error: 'Claim not found' })
      }
      return reply.send(claim)
    } catch (error: any) {
      if (error.message?.includes('Cannot cancel')) {
        return reply.status(422).send({ error: error.message })
      }
      return reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })
}
