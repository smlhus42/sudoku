import React, { useEffect, useState } from 'react'
import { Difficulty } from '../hooks/useSudoku'
import SudokuGrid from './SudokuGrid'
import confetti from 'canvas-confetti'
import { socketService } from '../services/socketService'

interface GameBoardProps {
  gameId: string | null
  playerId: string | null
  difficulty: Difficulty
  currentPlayer: any
  opponent: any
  updatePlayerBoard: (playerId: string, board: any, cellsRemaining: number) => void
  finishPlayer: (playerId: string) => void
  leaveGame: () => void
  onGameEnd: () => void
}

/**
 * GameBoard - Hovedspillekomponent som viser sudoku-brettet og motstanderens fremdrift
 */
const GameBoard: React.FC<GameBoardProps> = ({
  gameId,
  playerId,
  difficulty,
  currentPlayer,
  opponent,
  leaveGame,
  onGameEnd
}) => {
  const [showConfetti, setShowConfetti] = useState(false)
  
  // Trigger confetti when current player finishes
  useEffect(() => {
    if (currentPlayer?.finishedAt && !showConfetti) {
      // Big celebration for current player
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
      setShowConfetti(true)
    }
  }, [currentPlayer?.finishedAt, showConfetti])

  // Trigger confetti when opponent finishes
  useEffect(() => {
    if (opponent?.finishedAt) {
      // Smaller celebration for opponent
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#999999', '#666666', '#333333']
      })
    }
  }, [opponent?.finishedAt])

  // Handle game end when both players finish
  useEffect(() => {
    if (currentPlayer?.finishedAt && opponent?.finishedAt) {
      setTimeout(() => {
        onGameEnd()
      }, 3000) // Show results for 3 seconds
    }
  }, [currentPlayer?.finishedAt, opponent?.finishedAt, onGameEnd])

  const handleCellChange = (row: number, col: number, value: string) => {
    if (!gameId || !playerId) return

    const numValue = value === '' ? 0 : parseInt(value)
    if (isNaN(numValue) || numValue < 0 || numValue > 9) return

    // Send update to server
    socketService.updateCell(gameId, playerId, row, col, numValue)
  }

  const getOpponentProgressText = () => {
    if (!opponent) return 'Venter på motspiller...'
    if (opponent.finishedAt) return '🏁 Ferdig!'
    return `${opponent.cellsRemaining} celler igjen`
  }

  const getPlayerProgressText = () => {
    if (!currentPlayer) return 'Laster...'
    if (currentPlayer.finishedAt) return '🎉 Du er ferdig!'
    return `${currentPlayer.cellsRemaining} celler igjen`
  }

  if (!currentPlayer?.board) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Laster spill...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Spillerens brett */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              Ditt brett
            </h2>
            <div className="text-sm text-gray-600">
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-semibold text-blue-600">
                {getPlayerProgressText()}
              </span>
            </div>
            {currentPlayer.cellsRemaining > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(0, 100 - (currentPlayer.cellsRemaining / 81 * 100))}%`
                  }}
                ></div>
              </div>
            )}
          </div>

          <SudokuGrid
            board={currentPlayer.board}
            originalBoard={currentPlayer.originalBoard}
            onCellChange={handleCellChange}
            readOnly={!!currentPlayer.finishedAt}
            isSolved={!!currentPlayer.finishedAt}
          />
        </div>

        {/* Motstanderens fremdrift */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              Motspiller
            </h2>
            <div className="text-sm text-gray-600">
              {opponent?.name || 'Ukjent spiller'}
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-semibold text-red-600">
                {getOpponentProgressText()}
              </span>
            </div>
            {opponent && opponent.cellsRemaining > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(0, 100 - (opponent.cellsRemaining / 81 * 100))}%`
                  }}
                ></div>
              </div>
            )}
          </div>

          {/* Kampinfo */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Kampstatus</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Vanskelighetsgrad: {difficulty}</div>
                <div>Spill-ID: {gameId}</div>
                {currentPlayer.finishedAt && opponent?.finishedAt && (
                  <div className="mt-2 p-2 bg-yellow-100 rounded text-center">
                    <div className="font-bold">
                      {new Date(currentPlayer.finishedAt).getTime() < new Date(opponent.finishedAt).getTime()
                        ? '🏆 Du vant!'
                        : '😔 Du tapte!'
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={leaveGame}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Forlat spill
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GameBoard 