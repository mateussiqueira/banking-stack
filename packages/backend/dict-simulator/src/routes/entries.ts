import { FastifyInstance } from 'fastify'
import {
  registerKey,
  lookupKey,
  updateKey,
  deactivateKey,
  listKeys,
} from '../services/dictService'
import { KeyType } from '../models/PixKey'

interface CreateKeyBody {
  key: string
  keyType: KeyType
  accountType: string
  ispb: string
  branch: string
  accountNumber: string
  accountHolderName: string
  accountHolderDoc: string
}

interface UpdateKeyBody {
  accountType?: string
  branch?: string
  accountNumber?: string
  accountHolderName?: string
}

export function registerEntriesRoutes(app: FastifyInstance): void {
  app.post('/dict/entries', async (request, reply) => {
    try {
      const body = request.body as CreateKeyBody
      const pixKey = await registerKey(body)
      return reply.status(201).send(pixKey)
    } catch (error: any) {
      if (error.message?.includes('already registered')) {
        return reply.status(409).send({ error: error.message })
      }
      if (error.message?.includes('Invalid')) {
        return reply.status(422).send({ error: error.message })
      }
      return reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })

  app.get('/dict/entries/:key', async (request, reply) => {
    try {
      const { key } = request.params as { key: string }
      const pixKey = await lookupKey(key)
      if (!pixKey) {
        return reply.status(404).send({ error: 'Pix key not found' })
      }
      return reply.send(pixKey)
    } catch (error: any) {
      return reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })

  app.patch('/dict/entries/:key', async (request, reply) => {
    try {
      const { key } = request.params as { key: string }
      const body = request.body as UpdateKeyBody
      const pixKey = await updateKey(key, body)
      if (!pixKey) {
        return reply.status(404).send({ error: 'Pix key not found or not active' })
      }
      return reply.send(pixKey)
    } catch (error: any) {
      return reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })

  app.delete('/dict/entries/:key', async (request, reply) => {
    try {
      const { key } = request.params as { key: string }
      const pixKey = await deactivateKey(key)
      if (!pixKey) {
        return reply.status(404).send({ error: 'Pix key not found or not active' })
      }
      return reply.send({ message: 'Pix key deactivated', key: pixKey.key })
    } catch (error: any) {
      return reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })

  app.get('/dict/entries', async (request, reply) => {
    try {
      const query = request.query as { page?: string; limit?: string }
      const page = parseInt(query.page || '1', 10)
      const limit = parseInt(query.limit || '20', 10)
      const result = await listKeys(page, limit)
      return reply.send(result)
    } catch (error: any) {
      return reply.status(500).send({ error: error.message || 'Internal server error' })
    }
  })
}
