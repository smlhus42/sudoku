// Simple server launcher for Railway deployment
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🚀 Starting War of Numbers Server...')
console.log('📂 Current directory:', __dirname)
console.log('🌍 Environment variables:')
console.log('  - NODE_ENV:', process.env.NODE_ENV)
console.log('  - PORT:', process.env.PORT)
console.log('  - FRONTEND_URL:', process.env.FRONTEND_URL)

// Check if server directory exists
const serverPath = join(__dirname, 'server')
console.log('📁 Server path:', serverPath)
console.log('✅ Server directory exists:', existsSync(serverPath))

const indexPath = join(serverPath, 'index.js')
console.log('📄 Index.js path:', indexPath)
console.log('✅ Index.js exists:', existsSync(indexPath))

// List contents of server directory
try {
  const fs = await import('fs')
  const contents = fs.readdirSync(serverPath)
  console.log('📋 Server directory contents:', contents)
} catch (error) {
  console.error('❌ Error reading server directory:', error)
}

// Start the server from the server directory
console.log('🔄 Starting server process...')
const serverProcess = spawn('node', ['index.js'], {
  cwd: serverPath,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'production',
    PORT: process.env.PORT || '3001'
  }
})

serverProcess.on('error', (error) => {
  console.error('❌ Failed to start server:', error)
  process.exit(1)
})

serverProcess.on('close', (code) => {
  console.log(`🔚 Server process exited with code ${code}`)
  process.exit(code)
}) 