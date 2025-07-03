import { io, Socket } from 'socket.io-client'
import { SudokuBoard } from '../utils/sudokuUtils'
import { Difficulty } from '../hooks/useSudoku'

export interface SocketGameState {
  id: string
  phase: 'lobby' | 'playing' | 'finished'
  difficulty: Difficulty
  players: Array<{
    id: string
    name: string
    isConnected: boolean
    cellsRemaining: number
    finishedAt?: Date
    isHost: boolean
    isSolved: boolean
  }>
  createdAt: Date
  startedAt?: Date
  finishedAt?: Date
}

export interface SocketPlayerData {
  id: string
  board: SudokuBoard
  originalBoard: SudokuBoard
}

class SocketService {
  private socket: Socket | null = null
  private serverUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : window.location.origin // Use same origin in production
  
  // Event callbacks
  private onGameStateCallback?: (gameState: SocketGameState, playerData: SocketPlayerData) => void
  private onPlayerUpdateCallback?: (playerId: string, board: SudokuBoard, cellsRemaining: number, isSolved: boolean) => void
  private onPlayerFinishedCallback?: (playerId: string, playerName: string, finishedAt: Date) => void
  private onGameStartedCallback?: (gameState: SocketGameState, board: SudokuBoard, originalBoard: SudokuBoard) => void
  private onPlayerConnectedCallback?: (data: { playerId: string, playerName: string, game?: SocketGameState }) => void
  private onPlayerDisconnectedCallback?: (playerId: string, playerName: string) => void
  private onPlayerLeftCallback?: (playerId: string, playerName: string) => void
  private onErrorCallback?: (message: string) => void

  /**
   * Koble til WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.serverUrl, {
          transports: ['websocket', 'polling'],
          timeout: 10000
        })

        this.socket.on('connect', () => {
          console.log('🔗 Connected to WebSocket server')
          this.setupEventListeners()
          resolve()
        })

        this.socket.on('connect_error', (error) => {
          console.error('❌ WebSocket connection error:', error)
          reject(error)
        })

      } catch (error) {
        console.error('❌ Failed to initialize WebSocket:', error)
        reject(error)
      }
    })
  }

  /**
   * Koble fra WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      console.log('❌ Disconnected from WebSocket server')
    }
  }

  /**
   * Sett opp event listeners
   */
  private setupEventListeners() {
    if (!this.socket) return

    this.socket.on('game-state', (data: { game: SocketGameState, player: SocketPlayerData }) => {
      console.log('📊 Received game state:', data)
      this.onGameStateCallback?.(data.game, data.player)
    })

    this.socket.on('player-update', (data: { playerId: string, board: SudokuBoard, cellsRemaining: number, isSolved: boolean }) => {
      console.log('🔄 Player update:', data)
      this.onPlayerUpdateCallback?.(data.playerId, data.board, data.cellsRemaining, data.isSolved)
    })

    this.socket.on('player-finished', (data: { playerId: string, playerName: string, finishedAt: string }) => {
      console.log('🏆 Player finished:', data)
      this.onPlayerFinishedCallback?.(data.playerId, data.playerName, new Date(data.finishedAt))
    })

    this.socket.on('game-started', (data: { game: SocketGameState, board: SudokuBoard, originalBoard: SudokuBoard }) => {
      console.log('🚀 Game started:', data)
      this.onGameStartedCallback?.(data.game, data.board, data.originalBoard)
    })

    this.socket.on('player-connected', (data: { playerId: string, playerName: string, game?: SocketGameState }) => {
      console.log('👤 Player connected:', data)
      this.onPlayerConnectedCallback?.(data)
    })

    this.socket.on('player-disconnected', (data: { playerId: string, playerName: string }) => {
      console.log('❌ Player disconnected:', data)
      this.onPlayerDisconnectedCallback?.(data.playerId, data.playerName)
    })

    this.socket.on('player-left', (data: { playerId: string, playerName: string }) => {
      console.log('👋 Player left:', data)
      this.onPlayerLeftCallback?.(data.playerId, data.playerName)
    })

    this.socket.on('error', (data: { message: string }) => {
      console.error('🚨 Server error:', data.message)
      this.onErrorCallback?.(data.message)
    })
  }

  /**
   * API: Opprett nytt spill
   */
  async createGame(difficulty: Difficulty, playerName: string): Promise<{ gameId: string, playerId: string }> {
    console.log('🚀 SocketService: Sending request to create game:', { difficulty, playerName })
    console.log('🌐 Server URL:', this.serverUrl)
    
    try {
      const response = await fetch(`${this.serverUrl}/api/game/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ difficulty, playerName })
      })

      console.log('📡 Response status:', response.status, response.statusText)

      if (!response.ok) {
        const error = await response.json()
        console.error('❌ API Error:', error)
        throw new Error(error.error || 'Failed to create game')
      }

      const result = await response.json()
      console.log('✅ Game created successfully:', result)
      return result
    } catch (error) {
      console.error('💥 Fetch error:', error)
      throw error
    }
  }

  /**
   * API: Koble til eksisterende spill
   */
  async joinGame(gameId: string, playerName: string): Promise<{ gameId: string, playerId: string }> {
    const response = await fetch(`${this.serverUrl}/api/game/join/${gameId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ playerName })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to join game')
    }

    return await response.json()
  }

  /**
   * WebSocket: Koble til spill-room
   */
  joinGameRoom(gameId: string, playerId: string) {
    if (!this.socket) {
      throw new Error('Not connected to WebSocket server')
    }

    this.socket.emit('join-game', { gameId, playerId })
  }

  /**
   * WebSocket: Start spill
   */
  startGame(gameId: string, playerId: string) {
    if (!this.socket) {
      throw new Error('Not connected to WebSocket server')
    }

    this.socket.emit('start-game', { gameId, playerId })
  }

  /**
   * WebSocket: Send celle-oppdatering
   */
  updateCell(gameId: string, playerId: string, row: number, col: number, value: number) {
    if (!this.socket) {
      throw new Error('Not connected to WebSocket server')
    }

    this.socket.emit('cell-update', { gameId, playerId, row, col, value })
  }

  /**
   * WebSocket: Forlat spill
   */
  leaveGame(gameId: string, playerId: string) {
    if (!this.socket) {
      throw new Error('Not connected to WebSocket server')
    }

    this.socket.emit('leave-game', { gameId, playerId })
  }

  /**
   * Registrer callback for game state
   */
  onGameState(callback: (gameState: SocketGameState, playerData: SocketPlayerData) => void) {
    this.onGameStateCallback = callback
  }

  /**
   * Registrer callback for player updates
   */
  onPlayerUpdate(callback: (playerId: string, board: SudokuBoard, cellsRemaining: number, isSolved: boolean) => void) {
    this.onPlayerUpdateCallback = callback
  }

  /**
   * Registrer callback for player finished
   */
  onPlayerFinished(callback: (playerId: string, playerName: string, finishedAt: Date) => void) {
    this.onPlayerFinishedCallback = callback
  }

  /**
   * Registrer callback for game started
   */
  onGameStarted(callback: (gameState: SocketGameState, board: SudokuBoard, originalBoard: SudokuBoard) => void) {
    this.onGameStartedCallback = callback
  }

  /**
   * Registrer callback for player connected
   */
  onPlayerConnected(callback: (data: { playerId: string, playerName: string, game?: SocketGameState }) => void) {
    this.onPlayerConnectedCallback = callback
  }

  /**
   * Registrer callback for player disconnected
   */
  onPlayerDisconnected(callback: (playerId: string, playerName: string) => void) {
    this.onPlayerDisconnectedCallback = callback
  }

  /**
   * Registrer callback for player left
   */
  onPlayerLeft(callback: (playerId: string, playerName: string) => void) {
    this.onPlayerLeftCallback = callback
  }

  /**
   * Registrer callback for errors
   */
  onError(callback: (message: string) => void) {
    this.onErrorCallback = callback
  }

  /**
   * Sjekk om tilkoblet
   */
  isConnected(): boolean {
    return this.socket?.connected || false
  }
}

// Singleton instance
export const socketService = new SocketService() 