import Fastify from 'fastify'
import { fastifyEnv } from '@fastify/env'
import { fastifyHelmet } from '@fastify/helmet'
import { fastifyCors } from '@fastify/cors'
import { fastifyRateLimit } from '@fastify/rate-limit'
import { fastifyJwt } from '@fastify/jwt'
import { fastifyWebsocket } from '@fastify/websocket'
import { fastifyRedis } from '@fastify/redis'
import { fastifyAutoload } from '@fastify/autoload'
import { join } from 'path'
import dotenv from 'dotenv'

dotenv.config()

const schema = {
  type: 'object',
  required: ['PORT', 'DATABASE_URL'],
  properties: {
    PORT: {
      type: 'string',
      default: '3001'
    },
    NODE_ENV: {
      type: 'string',
      default: 'development'
    },
    DATABASE_URL: {
      type: 'string'
    },
    JWT_SECRET: {
      type: 'string',
      default: 'your-super-secret-jwt-key'
    },
    REDIS_URL: {
      type: 'string',
      default: 'redis://localhost:6379'
    },
    CORS_ORIGIN: {
      type: 'string',
      default: 'http://localhost:5173'
    }
  }
}

const options = {
  confKey: 'config',
  schema: schema,
  dotenv: true,
  data: process.env
}

async function buildApp() {
  const app = Fastify({
    logger: process.env.NODE_ENV === 'development' ? {
      level: 'debug',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true
        }
      }
    } : {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    }
  })

  // Environment configuration
  await app.register(fastifyEnv, options)

  // Security plugins
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false // Disable CSP for API server
  })

  // CORS
  await app.register(fastifyCors, {
    origin: (origin, callback) => {
      const hostname = new URL(origin || 'http://localhost:5173').hostname
      if (hostname === 'localhost' || hostname === '127.0.0.1' || !origin) {
        callback(null, true)
        return
      }

      // Allow specific origins from config
      const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',')
      if (allowedOrigins.includes(origin!)) {
        callback(null, true)
        return
      }

      callback(new Error('Not allowed by CORS'), false)
    },
    credentials: true
  })

  // Rate limiting
  await app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute'
  })

  // JWT
  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key'
  })

  // WebSocket support
  await app.register(fastifyWebsocket)

  // Redis (for caching and sessions)
  await app.register(fastifyRedis, {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    closeClient: true
  })

  // Auto-load plugins and routes
  await app.register(fastifyAutoload, {
    dir: join(__dirname, 'plugins'),
    options: { prefix: '' }
  })

  await app.register(fastifyAutoload, {
    dir: join(__dirname, 'routes'),
    options: { prefix: '/api' }
  })

  // Global error handler
  app.setErrorHandler(async (error, _, reply) => {
    app.log.error(error)

    if (reply.statusCode >= 500) {
      reply.send({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      })
    } else {
      reply.send({
        error: error.message || 'Bad Request'
      })
    }
  })

  return app
}

async function start() {
  try {
    const app = await buildApp()

    const port = Number(process.env.PORT) || 3010
    const host = process.env.HOST || '0.0.0.0'

    await app.listen({ port, host })

    app.log.info(`🚀 Server running on http://${host}:${port}`)
    app.log.info(`📚 API documentation available at http://${host}:${port}/documentation`)

  } catch (error) {
    console.error('Error starting server:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...')
  process.exit(0)
})

if (require.main === module) {
  start()
}

export { buildApp }