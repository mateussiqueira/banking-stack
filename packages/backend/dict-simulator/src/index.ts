import Fastify from 'fastify'
import cors from '@fastify/cors'
import mongoose from 'mongoose'
import { config } from './config'
import { registerEntriesRoutes } from './routes/entries'
import { registerClaimsRoutes } from './routes/claims'

async function start(): Promise<void> {
  const app = Fastify({
    logger: {
      level: config.logLevel,
    },
  })

  await app.register(cors, {
    origin: true,
  })

  await mongoose.connect(config.mongoUri)
  app.log.info(`Connected to MongoDB at ${config.mongoUri}`)

  registerEntriesRoutes(app)
  registerClaimsRoutes(app)

  app.get('/dict/health', async (_request, reply) => {
    return reply.send({
      status: 'ok',
      service: 'dict-simulator',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    })
  })

  try {
    await app.listen({ port: config.port, host: config.host })
    app.log.info(`DICT Simulator listening on ${config.host}:${config.port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
