// Simple debug server for Railway deployment testing
import express from 'express'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

console.log('🐛 Debug Server Starting...')
console.log('📂 Current directory:', __dirname)
console.log('🌍 Environment:', process.env.NODE_ENV)
console.log('🚪 Port:', PORT)

// Debug endpoint
app.get('/debug', (req, res) => {
  res.json({
    status: 'Debug server running',
    environment: process.env.NODE_ENV,
    port: PORT,
    timestamp: new Date().toISOString(),
    env_vars: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      FRONTEND_URL: process.env.FRONTEND_URL
    },
    directories: {
      current: __dirname,
      serverExists: existsSync(__dirname + '/server'),
      indexExists: existsSync(__dirname + '/server/index.js')
    }
  })
})

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Debug server is running!',
    timestamp: new Date().toISOString()
  })
})

app.get('/', (req, res) => {
  res.json({
    message: 'War of Numbers Debug Server',
    endpoints: ['/health', '/debug']
  })
})

app.listen(PORT, () => {
  console.log(`🐛 Debug Server running on port ${PORT}`)
  console.log(`🔍 Health check: http://localhost:${PORT}/health`)
  console.log(`🐛 Debug info: http://localhost:${PORT}/debug`)
}) 