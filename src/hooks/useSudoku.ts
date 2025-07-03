import { useState, useEffect } from 'react'
import { generateSudoku, SudokuBoard, isSolved, isValidBoard } from '../utils/sudokuUtils'
import { socketService } from '../services/socketService'

export type Difficulty = 'lett' | 'middels' | 'vanskelig'

export interface SudokuGameState {
  board: SudokuBoard | null
  originalBoard: SudokuBoard | null
  difficulty: Difficulty
  isGenerating: boolean
  isSolved: boolean
  isValid: boolean
  cellsRemaining: number
}

export function useSudoku(initialDifficulty: Difficulty = 'lett', gameId?: string, playerId?: string) {
  const [gameState, setGameState] = useState<SudokuGameState>({
    board: null,
    originalBoard: null,
    difficulty: initialDifficulty,
    isGenerating: false,
    isSolved: false,
    isValid: true,
    cellsRemaining: 0
  })

  /**
   * Genererer et nytt sudoku-brett
   * TODO: Erstatt med backend-kall til /api/game/generate
   */
  const generateBoard = async (difficulty: Difficulty = gameState.difficulty) => {
    setGameState(prev => ({
      ...prev,
      isGenerating: true,
      isSolved: false,
      difficulty
    }))

    try {
      // Simuler nettverksdelay for å teste loading states
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const newBoard = generateSudoku(difficulty)
      const cellsRemaining = newBoard.flat().filter(cell => cell === 0).length
      
      setGameState(prev => ({
        ...prev,
        board: newBoard,
        originalBoard: newBoard.map(row => [...row]), // Deep copy
        isGenerating: false,
        cellsRemaining,
        isValid: true
      }))
    } catch (error) {
      console.error('Feil ved generering av sudoku:', error)
      setGameState(prev => ({
        ...prev,
        isGenerating: false
      }))
    }
  }

  /**
   * Oppdaterer en celle i brettet
   * TODO: Send oppdatering til backend via WebSocket
   */
  const updateCell = (row: number, col: number, value: string) => {
    if (!gameState.board || !gameState.originalBoard) return
    
    // Kan ikke endre originale tall
    if (gameState.originalBoard[row][col] !== 0) return
    
    const num = value === '' ? 0 : parseInt(value)
    
    // Bare tillat tall 1-9 eller tomt
    if (num < 0 || num > 9 || isNaN(num)) return
    
    const newBoard = gameState.board.map(r => [...r])
    newBoard[row][col] = num
    
    const solved = isSolved(newBoard)
    const valid = isValidBoard(newBoard)
    const cellsRemaining = newBoard.flat().filter(cell => cell === 0).length
    
    setGameState(prev => ({
      ...prev,
      board: newBoard,
      isSolved: solved,
      isValid: valid,
      cellsRemaining
    }))

    // Send oppdatering til WebSocket server hvis i multiplayer
    if (gameId && playerId && socketService.isConnected()) {
      socketService.updateCell(gameId, playerId, row, col, num)
    }
  }

  /**
   * Setter brettet (brukes når man mottar data fra backend)
   */
  const setBoard = (board: SudokuBoard, originalBoard: SudokuBoard) => {
    const solved = isSolved(board)
    const valid = isValidBoard(board)
    const cellsRemaining = board.flat().filter(cell => cell === 0).length
    
    setGameState(prev => ({
      ...prev,
      board,
      originalBoard,
      isSolved: solved,
      isValid: valid,
      cellsRemaining
    }))
  }

  /**
   * Tilbakestiller spillet
   */
  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      board: null,
      originalBoard: null,
      isSolved: false,
      isValid: true,
      cellsRemaining: 0
    }))
  }

  return {
    ...gameState,
    generateBoard,
    updateCell,
    setBoard,
    resetGame
  }
} 