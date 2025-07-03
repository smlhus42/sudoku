import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { GameManager } from './gameManager.js'
import { SudokuGenerator } from './sudokuGenerator.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const server = createServer(app)

// Socket.io med CORS-støtte
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"]
  }
})

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : ["http://localhost:5173", "http://localhost:3000"],
  credentials: true
}))
app.use(express.json())

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')))
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  })
}

// Game state manager
const gameManager = new GameManager()
const sudokuGenerator = new SudokuGenerator()

// Test endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'War of Numbers Server is running!',
    activeGames: gameManager.getActiveGamesCount(),
    activePlayers: gameManager.getActivePlayersCount()
  })
})

// API Routes
app.post('/api/game/create', async (req, res) => {
  try {
    const { difficulty, playerName } = req.body
    
    if (!difficulty || !['lett', 'middels', 'vanskelig'].includes(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty level' })
    }

    const game = await gameManager.createGame(difficulty, playerName || 'Spiller 1')
    
    res.json({
      gameId: game.id,
      playerId: game.players[0].id,
      message: 'Game created successfully'
    })
  } catch (error) {
    console.error('Error creating game:', error)
    res.status(500).json({ error: 'Failed to create game' })
  }
})

app.post('/api/game/join/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params
    const { playerName } = req.body

    const result = await gameManager.joinGame(gameId, playerName || 'Spiller 2')
    
    if (!result.success) {
      return res.status(400).json({ error: result.error })
    }

    res.json({
      gameId: result.game.id,
      playerId: result.player.id,
      message: 'Joined game successfully'
    })
  } catch (error) {
    console.error('Error joining game:', error)
    res.status(500).json({ error: 'Failed to join game' })
  }
})

app.get('/api/game/:gameId', (req, res) => {
  try {
    const { gameId } = req.params
    const game = gameManager.getGame(gameId)
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' })
    }

    // Ikke send sensitive data
    const sanitizedGame = {
      id: game.id,
      phase: game.phase,
      difficulty: game.difficulty,
      players: game.players.map(p => ({
        id: p.id,
        name: p.name,
        isConnected: p.isConnected,
        cellsRemaining: p.cellsRemaining,
        finishedAt: p.finishedAt
      })),
      createdAt: game.createdAt,
      startedAt: game.startedAt
    }

    res.json(sanitizedGame)
  } catch (error) {
    console.error('Error getting game:', error)
    res.status(500).json({ error: 'Failed to get game' })
  }
})

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`🔗 New connection: ${socket.id}`)

  // Join game room
  socket.on('join-game', async (data) => {
    try {
      const { gameId, playerId } = data
      const game = gameManager.getGame(gameId)
      
      if (!game) {
        socket.emit('error', { message: 'Game not found' })
        return
      }

      const player = game.players.find(p => p.id === playerId)
      if (!player) {
        socket.emit('error', { message: 'Player not found in game' })
        return
      }

      // Join socket room for this game
      socket.join(gameId)
      
      // Update player connection status
      player.socketId = socket.id
      player.isConnected = true
      
      console.log(`👤 Player ${player.name} joined game ${gameId}`)
      
      // Send current game state to the joining player
      socket.emit('game-state', {
        game: gameManager.getSanitizedGame(game),
        player: {
          id: player.id,
          board: player.board,
          originalBoard: player.originalBoard
        }
      })

      // Send updated game state to ALL players in the room (including the one that just joined)
      io.to(gameId).emit('player-connected', {
        playerId: player.id,
        playerName: player.name,
        game: gameManager.getSanitizedGame(game) // Include full game state
      })

    } catch (error) {
      console.error('Error joining game:', error)
      socket.emit('error', { message: 'Failed to join game' })
    }
  })

  // Start game
  socket.on('start-game', async (data) => {
    try {
      const { gameId, playerId } = data
      const result = await gameManager.startGame(gameId, playerId, sudokuGenerator)
      
      if (!result.success) {
        socket.emit('error', { message: result.error })
        return
      }

      console.log(`🚀 Game ${gameId} started`)
      
      // Send game started event to all players in the room
      io.to(gameId).emit('game-started', {
        game: gameManager.getSanitizedGame(result.game),
        board: result.game.board,
        originalBoard: result.game.originalBoard
      })

    } catch (error) {
      console.error('Error starting game:', error)
      socket.emit('error', { message: 'Failed to start game' })
    }
  })

  // Handle cell updates
  socket.on('cell-update', (data) => {
    try {
      const { gameId, playerId, row, col, value } = data
      const result = gameManager.updateCell(gameId, playerId, row, col, value)
      
      if (!result.success) {
        socket.emit('error', { message: result.error })
        return
      }

      // Broadcast update to all players in the game
      io.to(gameId).emit('player-update', {
        playerId: playerId,
        board: result.player.board,
        cellsRemaining: result.player.cellsRemaining,
        isSolved: result.player.isSolved
      })

      // Check if player finished
      if (result.player.isSolved && !result.player.finishedAt) {
        result.player.finishedAt = new Date()
        
        io.to(gameId).emit('player-finished', {
          playerId: playerId,
          playerName: result.player.name,
          finishedAt: result.player.finishedAt
        })

        console.log(`🏆 Player ${result.player.name} finished game ${gameId}!`)
      }

    } catch (error) {
      console.error('Error updating cell:', error)
      socket.emit('error', { message: 'Failed to update cell' })
    }
  })

  // Handle player disconnect
  socket.on('disconnect', () => {
    try {
      console.log(`❌ Player disconnected: ${socket.id}`)
      
      // Find and update player connection status
      const games = gameManager.getAllGames()
      for (const game of games) {
        const player = game.players.find(p => p.socketId === socket.id)
        if (player) {
          player.isConnected = false
          player.socketId = null
          
          // Notify other players
          socket.to(game.id).emit('player-disconnected', {
            playerId: player.id,
            playerName: player.name
          })
          
          console.log(`👤 Player ${player.name} disconnected from game ${game.id}`)
          break
        }
      }
    } catch (error) {
      console.error('Error handling disconnect:', error)
    }
  })

  // Handle leave game
  socket.on('leave-game', (data) => {
    try {
      const { gameId, playerId } = data
      const result = gameManager.leaveGame(gameId, playerId)
      
      if (result.success) {
        socket.leave(gameId)
        socket.to(gameId).emit('player-left', {
          playerId: playerId,
          playerName: result.playerName
        })
        
        console.log(`👋 Player ${result.playerName} left game ${gameId}`)
      }
    } catch (error) {
      console.error('Error leaving game:', error)
    }
  })
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`🚀 War of Numbers Server running on port ${PORT}`)
  console.log(`🌐 Frontend URL: http://localhost:5173`)
  console.log(`🔍 Health check: http://localhost:${PORT}/health`)
}) 