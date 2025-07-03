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
  updatePlayerBoard,
  finishPlayer,
  leaveGame,
  onGameEnd
}) => {

  const [lastFinishedPlayer, setLastFinishedPlayer] = useState<string | null>(null)

  // Håndter celle-oppdatering
  const handleCellChange = (row: number, col: number, value: string) => {
    if (!currentPlayer?.board || !currentPlayer?.originalBoard) return
    
    // Kan ikke endre originale tall
    if (currentPlayer.originalBoard[row][col] !== 0) return
    
    const num = value === '' ? 0 : parseInt(value)
    
    // Bare tillat tall 1-9 eller tomt
    if (num < 0 || num > 9 || isNaN(num)) return
    
    // Send oppdatering til server
    if (gameId && playerId) {
      socketService.updateCell(gameId, playerId, row, col, num)
    }
  }

  // Håndter konfetti når spillere fullfører
  useEffect(() => {
    // Trigger konfetti når currentPlayer fullfører
    if (currentPlayer?.finishedAt && lastFinishedPlayer !== currentPlayer.id) {
      triggerConfetti()
      setLastFinishedPlayer(currentPlayer.id)
    }
    
    // Trigger konfetti når opponent fullfører
    if (opponent?.finishedAt && lastFinishedPlayer !== opponent.id) {
      triggerOpponentConfetti()
      setLastFinishedPlayer(opponent.id)
    }
  }, [currentPlayer?.finishedAt, opponent?.finishedAt, lastFinishedPlayer])

  /**
   * Trigger konfetti-animasjon når spilleren selv fullfører
   */
  const triggerConfetti = () => {
    confetti({
      particleCount: 200,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
    })
    
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 120,
        origin: { y: 0.7 },
        colors: ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
      })
    }, 300)
    
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 160,
        origin: { y: 0.8 },
        colors: ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
      })
    }, 600)
  }

  /**
   * Trigger mindre konfetti når motspilleren fullfører
   */
  const triggerOpponentConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#6B7280', '#9CA3AF', '#D1D5DB']
    })
    
    setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.7 },
        colors: ['#6B7280', '#9CA3AF', '#D1D5DB']
      })
    }, 250)
  }

  /**
   * Beregn fremdrift i prosent
   */
  const getProgress = (cellsRemaining: number) => {
    const totalCells = difficulty === 'lett' ? 30 : difficulty === 'middels' ? 45 : 55
    return Math.round(((totalCells - cellsRemaining) / totalCells) * 100)
  }

  /**
   * Håndter at spilleren forlater spillet
   */
  const handleLeaveGame = () => {
    leaveGame()
    onGameEnd()
  }

  if (!currentPlayer?.board) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Venter på spilldata...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            ⚔️ War of Numbers
          </h1>
          <p className="text-gray-600">
            Spill-ID: <span className="font-mono font-bold">{gameId}</span>
          </p>
        </div>
        <button
          onClick={handleLeaveGame}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
        >
          Forlat spill
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Spillerens brett */}
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              🎯 Ditt brett
            </h2>
            <p className="text-sm text-gray-600">
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} vanskelighetsgrad
            </p>
          </div>

          <SudokuGrid
            board={currentPlayer.board}
            originalBoard={currentPlayer.originalBoard}
            onCellChange={handleCellChange}
            isSolved={currentPlayer.finishedAt ? true : false}
          />

          <div className="text-center">
            {currentPlayer.finishedAt ? (
              <div className="text-green-600 font-semibold">
                <p className="text-lg">🎉 Gratulerer! Du løste sudokuen! 🎉</p>
                <p>Utmerket jobbet!</p>
              </div>
            ) : (
              <div className="text-gray-600">
                <p>Celler igjen: <span className="font-semibold">{currentPlayer.cellsRemaining}</span></p>
                <p>Fremdrift: <span className="font-semibold">{getProgress(currentPlayer.cellsRemaining)}%</span></p>
              </div>
            )}
          </div>
        </div>

        {/* Motstanderens fremdrift */}
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              🏁 Motstanderens fremdrift
            </h2>
            <p className="text-sm text-gray-600">
              {opponent ? opponent.name : 'Ingen motspiller'}
            </p>
          </div>

          {opponent ? (
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Fremdrift
                  </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {getProgress(opponent.cellsRemaining)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${getProgress(opponent.cellsRemaining)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Celler igjen:</p>
                  <p className="font-semibold">{opponent.cellsRemaining}</p>
                </div>
                <div>
                  <p className="text-gray-600">Status:</p>
                  <p className="font-semibold">
                    {opponent.finishedAt ? (
                      <span className="text-green-600">✅ Ferdig!</span>
                    ) : opponent.isConnected ? (
                      <span className="text-blue-600">🔄 Spiller</span>
                    ) : (
                      <span className="text-red-600">❌ Frakoblet</span>
                    )}
                  </p>
                </div>
              </div>

              {opponent.finishedAt && (
                <div className="mt-4 p-3 bg-yellow-100 rounded-md">
                  <p className="text-sm text-yellow-800">
                    🏆 Motstanderen har fullført sudokuen!
                  </p>
                  {currentPlayer.finishedAt && (
                    <p className="text-sm text-yellow-800 mt-1">
                      {currentPlayer.finishedAt < opponent.finishedAt ? 
                        "🥇 Du vant!" : 
                        "🥈 Du kom på andreplass!"
                      }
                    </p>
                  )}
                </div>
              )}


            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="text-gray-400 mb-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2"></div>
                <p>Venter på motspiller...</p>
              </div>
              
              <p className="text-xs text-gray-500">
                Del spill-ID med en venn for å starte!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Spillinformasjon */}
      <div className="mt-6 text-center text-xs text-gray-500">
        <p>
          💡 Tips: Grå celler er originale tall - blå celler kan du fylle inn
        </p>
        <p>
          🎯 Dere konkurrerer om å løse det samme brettet først!
        </p>
      </div>
    </div>
  )
}

export default GameBoard 