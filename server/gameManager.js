import { v4 as uuidv4 } from 'uuid'

export class GameManager {
  constructor() {
    this.games = new Map() // gameId -> Game object
    this.players = new Map() // playerId -> Player object
  }

  /**
   * Opprett et nytt spill
   */
  async createGame(difficulty, playerName) {
    const gameId = this.generateGameId()
    const playerId = uuidv4()
    
    const game = {
      id: gameId,
      phase: 'lobby', // lobby, playing, finished
      difficulty,
      board: null,
      originalBoard: null,
      players: [],
      createdAt: new Date(),
      startedAt: null,
      finishedAt: null
    }

    const player = {
      id: playerId,
      name: playerName,
      gameId: gameId,
      board: null,
      originalBoard: null,
      cellsRemaining: 0,
      isConnected: false,
      socketId: null,
      isHost: true,
      finishedAt: null,
      isSolved: false
    }

    game.players.push(player)
    this.games.set(gameId, game)
    this.players.set(playerId, player)

    console.log(`🎮 Created game ${gameId} with difficulty ${difficulty}`)
    return game
  }

  /**
   * Koble til et eksisterende spill
   */
  async joinGame(gameId, playerName) {
    const game = this.games.get(gameId)
    
    if (!game) {
      return { success: false, error: 'Game not found' }
    }

    if (game.phase !== 'lobby') {
      return { success: false, error: 'Game has already started' }
    }

    if (game.players.length >= 2) {
      return { success: false, error: 'Game is full' }
    }

    const playerId = uuidv4()
    const player = {
      id: playerId,
      name: playerName,
      gameId: gameId,
      board: null,
      originalBoard: null,
      cellsRemaining: 0,
      isConnected: false,
      socketId: null,
      isHost: false,
      finishedAt: null,
      isSolved: false
    }

    game.players.push(player)
    this.players.set(playerId, player)

    console.log(`👥 Player ${playerName} joined game ${gameId}`)
    return { success: true, game, player }
  }

  /**
   * Start et spill
   */
  async startGame(gameId, playerId, sudokuGenerator) {
    const game = this.games.get(gameId)
    
    if (!game) {
      return { success: false, error: 'Game not found' }
    }

    const player = game.players.find(p => p.id === playerId)
    if (!player || !player.isHost) {
      return { success: false, error: 'Only the host can start the game' }
    }

    if (game.phase !== 'lobby') {
      return { success: false, error: 'Game has already started' }
    }

    if (game.players.length < 2) {
      return { success: false, error: 'Need at least 2 players to start' }
    }

    // Generer sudoku-brett
    const { board, originalBoard } = await sudokuGenerator.generateSudoku(game.difficulty)
    
    game.board = board
    game.originalBoard = originalBoard
    game.phase = 'playing'
    game.startedAt = new Date()

    // Initialiser spillerenes brett
    const cellsRemaining = board.flat().filter(cell => cell === 0).length
    game.players.forEach(player => {
      player.board = board.map(row => [...row]) // Deep copy
      player.originalBoard = originalBoard.map(row => [...row]) // Deep copy
      player.cellsRemaining = cellsRemaining
    })

    return { success: true, game }
  }

  /**
   * Oppdater en celle i spillerens brett
   */
  updateCell(gameId, playerId, row, col, value) {
    const game = this.games.get(gameId)
    const player = this.players.get(playerId)
    
    if (!game || !player) {
      return { success: false, error: 'Game or player not found' }
    }

    if (game.phase !== 'playing') {
      return { success: false, error: 'Game is not in playing phase' }
    }

    if (!player.board || !player.originalBoard) {
      return { success: false, error: 'Player board not initialized' }
    }

    // Kan ikke endre originale tall
    if (player.originalBoard[row][col] !== 0) {
      return { success: false, error: 'Cannot modify original numbers' }
    }

    // Valider input
    if (value < 0 || value > 9) {
      return { success: false, error: 'Invalid value' }
    }

    // Oppdater brettet
    player.board[row][col] = value
    player.cellsRemaining = player.board.flat().filter(cell => cell === 0).length
    
    // Sjekk om brettet er løst
    player.isSolved = this.isSudokuSolved(player.board)

    return { success: true, player }
  }

  /**
   * Forlat spill
   */
  leaveGame(gameId, playerId) {
    const game = this.games.get(gameId)
    const player = this.players.get(playerId)
    
    if (!game || !player) {
      return { success: false, error: 'Game or player not found' }
    }

    // Fjern spilleren fra spillet
    const playerIndex = game.players.findIndex(p => p.id === playerId)
    if (playerIndex !== -1) {
      game.players.splice(playerIndex, 1)
    }

    // Fjern spilleren fra global liste
    this.players.delete(playerId)

    // Hvis ingen spillere igjen, slett spillet
    if (game.players.length === 0) {
      this.games.delete(gameId)
      console.log(`🗑️ Deleted empty game ${gameId}`)
    }

    return { success: true, playerName: player.name }
  }

  /**
   * Hent spill
   */
  getGame(gameId) {
    return this.games.get(gameId)
  }

  /**
   * Hent alle spill
   */
  getAllGames() {
    return Array.from(this.games.values())
  }

  /**
   * Hent sanitized game data (uten sensitive info)
   */
  getSanitizedGame(game) {
    return {
      id: game.id,
      phase: game.phase,
      difficulty: game.difficulty,
      players: game.players.map(p => ({
        id: p.id,
        name: p.name,
        isConnected: p.isConnected,
        cellsRemaining: p.cellsRemaining,
        finishedAt: p.finishedAt,
        isHost: p.isHost,
        isSolved: p.isSolved
      })),
      createdAt: game.createdAt,
      startedAt: game.startedAt,
      finishedAt: game.finishedAt
    }
  }

  /**
   * Generer tilfeldig game ID
   */
  generateGameId() {
    return Math.random().toString(36).substr(2, 8).toUpperCase()
  }

  /**
   * Hent antall aktive spill
   */
  getActiveGamesCount() {
    return this.games.size
  }

  /**
   * Hent antall aktive spillere
   */
  getActivePlayersCount() {
    return this.players.size
  }

  /**
   * Sjekk om sudoku er løst
   */
  isSudokuSolved(board) {
    // Sjekk at alle celler er fylt
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) return false
      }
    }

    // Sjekk alle rader
    for (let row = 0; row < 9; row++) {
      const seen = new Set()
      for (let col = 0; col < 9; col++) {
        const num = board[row][col]
        if (seen.has(num)) return false
        seen.add(num)
      }
    }

    // Sjekk alle kolonner
    for (let col = 0; col < 9; col++) {
      const seen = new Set()
      for (let row = 0; row < 9; row++) {
        const num = board[row][col]
        if (seen.has(num)) return false
        seen.add(num)
      }
    }

    // Sjekk alle 3x3 bokser
    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        const seen = new Set()
        for (let row = boxRow * 3; row < boxRow * 3 + 3; row++) {
          for (let col = boxCol * 3; col < boxCol * 3 + 3; col++) {
            const num = board[row][col]
            if (seen.has(num)) return false
            seen.add(num)
          }
        }
      }
    }

    return true
  }
} 