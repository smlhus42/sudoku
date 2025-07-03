import { useState, useEffect } from 'react'
import { SudokuBoard } from '../utils/sudokuUtils'
import { Difficulty } from './useSudoku'
import { socketService, SocketGameState, SocketPlayerData } from '../services/socketService'

export type GamePhase = 'lobby' | 'playing' | 'finished'

export interface PlayerState {
  id: string
  name: string
  board: SudokuBoard | null
  originalBoard: SudokuBoard | null
  cellsRemaining: number
  isConnected: boolean
  finishedAt?: Date
}

export interface GameState {
  gameId: string | null
  playerId: string | null
  phase: GamePhase
  difficulty: Difficulty
  players: PlayerState[]
  currentPlayer: PlayerState | null
  opponent: PlayerState | null
  isHost: boolean
  createdAt: Date | null
  startedAt: Date | null
  finishedAt: Date | null
}

/**
 * Hook for å håndtere overordnet game state
 * Denne vil senere integreres med WebSocket for real-time kommunikasjon
 */
export function useGameState() {
  const [gameState, setGameState] = useState<GameState>({
    gameId: null,
    playerId: null,
    phase: 'lobby',
    difficulty: 'lett',
    players: [],
    currentPlayer: null,
    opponent: null,
    isHost: false,
    createdAt: null,
    startedAt: null,
    finishedAt: null
  })

  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // Setup WebSocket connection and callbacks
  useEffect(() => {
    const setupWebSocket = async () => {
      try {
        setIsConnecting(true)
        await socketService.connect()
        setConnectionError(null)
        
        // Setup event callbacks
        socketService.onGameState(handleGameState)
        socketService.onPlayerUpdate(handlePlayerUpdate)
        socketService.onPlayerFinished(handlePlayerFinished)
        socketService.onGameStarted(handleGameStarted)
        socketService.onPlayerConnected(handlePlayerConnected)
        socketService.onPlayerDisconnected(handlePlayerDisconnected)
        socketService.onPlayerLeft(handlePlayerLeft)
        socketService.onError(handleError)
        
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error)
        setConnectionError(error instanceof Error ? error.message : 'Connection failed')
      } finally {
        setIsConnecting(false)
      }
    }

    setupWebSocket()

    // Cleanup on unmount
    return () => {
      socketService.disconnect()
    }
  }, [])

  /**
   * Handle game state updates from WebSocket
   */
  const handleGameState = (socketGameState: SocketGameState, playerData: SocketPlayerData) => {
         setGameState(prev => ({
       ...prev,
       gameId: socketGameState.id,
       phase: socketGameState.phase,
       difficulty: socketGameState.difficulty,
       players: socketGameState.players.map(p => ({
         id: p.id,
         name: p.name,
         board: p.id === playerData.id ? playerData.board : null,
         originalBoard: p.id === playerData.id ? playerData.originalBoard : null,
         cellsRemaining: p.cellsRemaining,
         isConnected: p.isConnected,
         finishedAt: p.finishedAt || undefined
       })),
       createdAt: socketGameState.createdAt,
       startedAt: socketGameState.startedAt || null,
       finishedAt: socketGameState.finishedAt || null
     }))
  }

  /**
   * Handle player updates from WebSocket
   */
  const handlePlayerUpdate = (playerId: string, board: SudokuBoard, cellsRemaining: number, isSolved: boolean) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(player => 
        player.id === playerId 
          ? { 
              ...player, 
              board: board.map(row => [...row]), // Deep copy the updated board
              cellsRemaining, 
              finishedAt: isSolved && !player.finishedAt ? new Date() : player.finishedAt 
            }
          : player
      )
    }))
  }

  /**
   * Handle player finished from WebSocket
   */
  const handlePlayerFinished = (playerId: string, playerName: string, finishedAt: Date) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(player =>
        player.id === playerId
          ? { ...player, finishedAt }
          : player
      )
    }))
  }

  /**
   * Handle game started from WebSocket
   */
  const handleGameStarted = (socketGameState: SocketGameState, board: SudokuBoard, originalBoard: SudokuBoard) => {
    setGameState(prev => ({
      ...prev,
      phase: 'playing',
      startedAt: socketGameState.startedAt || null,
      players: prev.players.map(player => ({
        ...player,
        board: board.map(row => [...row]),
        originalBoard: originalBoard.map(row => [...row]),
        cellsRemaining: board.flat().filter(cell => cell === 0).length
      }))
    }))
  }

  /**
   * Handle player connected from WebSocket
   */
  const handlePlayerConnected = (data: { playerId: string, playerName: string, game?: SocketGameState }) => {
    if (data.game) {
      // Full game state update when a player connects
      setGameState(prev => ({
        ...prev,
        players: data.game!.players.map(p => ({
          id: p.id,
          name: p.name,
          board: prev.players.find(existing => existing.id === p.id)?.board || null,
          originalBoard: prev.players.find(existing => existing.id === p.id)?.originalBoard || null,
          cellsRemaining: p.cellsRemaining,
          isConnected: p.isConnected,
          finishedAt: p.finishedAt || undefined
        }))
      }))
    } else {
      // Fallback: just update connection status
      setGameState(prev => ({
        ...prev,
        players: prev.players.map(player =>
          player.id === data.playerId
            ? { ...player, isConnected: true }
            : player
        )
      }))
    }
  }

  /**
   * Handle player disconnected from WebSocket
   */
  const handlePlayerDisconnected = (playerId: string, playerName: string) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(player =>
        player.id === playerId
          ? { ...player, isConnected: false }
          : player
      )
    }))
  }

  /**
   * Handle player left from WebSocket
   */
  const handlePlayerLeft = (playerId: string, playerName: string) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.filter(player => player.id !== playerId)
    }))
  }

  /**
   * Handle WebSocket errors
   */
  const handleError = (message: string) => {
    console.error('WebSocket error:', message)
    setConnectionError(message)
  }

  /**
   * Generer en tilfeldig game ID
   */
  const generateGameId = (): string => {
    return Math.random().toString(36).substr(2, 8).toUpperCase()
  }

  /**
   * Generer en tilfeldig player ID
   */
  const generatePlayerId = (): string => {
    return Math.random().toString(36).substr(2, 12)
  }

  /**
   * Opprett et nytt spill
   */
  const createGame = async (difficulty: Difficulty = 'lett', playerName: string = 'Du') => {
    try {
      setIsConnecting(true)
      setConnectionError(null)
      
      const { gameId, playerId } = await socketService.createGame(difficulty, playerName)
      
      setGameState(prev => ({
        ...prev,
        gameId,
        playerId,
        isHost: true
      }))
      
      // Join the game room
      socketService.joinGameRoom(gameId, playerId)
      
      return gameId
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create game'
      setConnectionError(message)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }

  /**
   * Koble til et eksisterende spill
   */
  const joinGame = async (gameId: string, playerName: string = 'Du') => {
    try {
      setIsConnecting(true)
      setConnectionError(null)
      
      const result = await socketService.joinGame(gameId, playerName)
      
      setGameState(prev => ({
        ...prev,
        gameId: result.gameId,
        playerId: result.playerId,
        isHost: false
      }))
      
      // Join the game room
      socketService.joinGameRoom(result.gameId, result.playerId)
      
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join game'
      setConnectionError(message)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }

  /**
   * Start spillet
   */
  const startGame = async () => {
    if (!gameState.gameId || !gameState.playerId) {
      throw new Error('Game ID or Player ID not set')
    }
    
    if (!gameState.isHost) {
      throw new Error('Only the host can start the game')
    }
    
    try {
      socketService.startGame(gameState.gameId, gameState.playerId)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start game'
      setConnectionError(message)
      throw error
    }
  }

  /**
   * Oppdater spillerens brett
   */
  const updatePlayerBoard = (playerId: string, board: SudokuBoard, cellsRemaining: number) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(player =>
        player.id === playerId
          ? { ...player, board, cellsRemaining }
          : player
      )
    }))
  }

  /**
   * Marker spiller som ferdig
   */
  const finishPlayer = (playerId: string) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(player =>
        player.id === playerId
          ? { ...player, finishedAt: new Date() }
          : player
      )
    }))
  }

  /**
   * Forlat spillet
   */
  const leaveGame = () => {
    if (gameState.gameId && gameState.playerId) {
      socketService.leaveGame(gameState.gameId, gameState.playerId)
    }
    
    setGameState({
      gameId: null,
      playerId: null,
      phase: 'lobby',
      difficulty: 'lett',
      players: [],
      currentPlayer: null,
      opponent: null,
      isHost: false,
      createdAt: null,
      startedAt: null,
      finishedAt: null
    })
  }

  /**
   * Generer invite link
   */
  const getInviteLink = () => {
    if (!gameState.gameId) return ''
    return `${window.location.origin}?gameId=${gameState.gameId}`
  }

  // Oppdater currentPlayer og opponent når players endres
  useEffect(() => {
    if (gameState.playerId) {
      const currentPlayer = gameState.players.find(p => p.id === gameState.playerId)
      const opponent = gameState.players.find(p => p.id !== gameState.playerId)
      
      setGameState(prev => ({
        ...prev,
        currentPlayer: currentPlayer || null,
        opponent: opponent || null
      }))
    }
  }, [gameState.players, gameState.playerId])

  return {
    ...gameState,
    isConnecting,
    connectionError,
    createGame,
    joinGame,
    startGame,
    updatePlayerBoard,
    finishPlayer,
    leaveGame,
    getInviteLink
  }
} 