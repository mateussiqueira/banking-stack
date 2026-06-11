import Fastify from 'fastify'
import xmlBodyParser from 'fastify-xml-body-parser'
import { registerPacs008Routes } from './routes/pacs008'
import { registerPacs002Routes } from './routes/pacs002'
import { registerPacs004Routes } from './routes/pacs004'
import { getAllTransactions } from './models/transaction'

const PORT = parseInt(process.env.PORT || '3002', 10)
const HOST = process.env.HOST || '0.0.0.0'

async function start(): Promise<void> {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  })

  await app.register(xmlBodyParser)

  registerPacs008Routes(app)
  registerPacs002Routes(app)
  registerPacs004Routes(app)

  app.get('/spi/health', async (_request, reply) => {
    return reply.send({
      status: 'ok',
      service: 'spi-simulator',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    })
  })

  app.get('/spi/transactions', async (_request, reply) => {
    return reply.send(getAllTransactions())
  })

  try {
    await app.listen({ port: PORT, host: HOST })
    app.log.info(`SPI Simulator listening on ${HOST}:${PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
