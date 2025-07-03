// Simple server launcher for Railway deployment
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🚀 Starting War of Numbers Server...')

// Start the server from the server directory
const serverProcess = spawn('node', ['index.js'], {
  cwd: join(__dirname, 'server'),
  stdio: 'inherit'
})

serverProcess.on('error', (error) => {
  console.error('❌ Failed to start server:', error)
  process.exit(1)
})

serverProcess.on('close', (code) => {
  console.log(`🔚 Server process exited with code ${code}`)
  process.exit(code)
}) 