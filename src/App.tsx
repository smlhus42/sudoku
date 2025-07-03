import { useEffect } from 'react'
import GameLobby from './components/GameLobby'
import GameBoard from './components/GameBoard'
import { useGameState } from './hooks/useGameState'
import { socketService } from './services/socketService'

/**
 * Hovedkomponent for War of Numbers
 * Håndterer routing mellom lobby og spill
 */
function App() {
  const {
    gameId,
    playerId,
    phase,
    difficulty,
    players,
    currentPlayer,
    opponent,
    isHost,
    isConnecting,
    connectionError,
    createGame,
    joinGame,
    startGame,
    updatePlayerBoard,
    finishPlayer,
    leaveGame,
    getInviteLink
  } = useGameState()

  useEffect(() => {
    // Sjekk om vi har game invite i URL
    const urlParams = new URLSearchParams(window.location.search)
    const gameId = urlParams.get('game')
    
    if (gameId) {
      // TODO: Automatisk join game fra URL
      console.log('Auto-joining game:', gameId)
    }
  }, [])

  const handleGameStart = () => {
    // Game started callback
  }

  const handleGameEnd = () => {
    // Reset til lobby
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              ⚡ War of Numbers
            </h1>
            <p className="text-gray-600">
              Multiplayer Sudoku - Hvem løser først?
            </p>
          </header>

          {phase === 'lobby' && (
            <GameLobby
              gameId={gameId}
              difficulty={difficulty}
              players={players}
              isHost={isHost}
              isConnecting={isConnecting}
              connectionError={connectionError}
              createGame={createGame}
              joinGame={joinGame}
              startGame={startGame}
              getInviteLink={getInviteLink}
              onGameStart={handleGameStart}
            />
          )}

          {phase === 'playing' && (
            <GameBoard
              gameId={gameId}
              playerId={playerId}
              difficulty={difficulty}
              currentPlayer={currentPlayer}
              opponent={opponent}
              updatePlayerBoard={updatePlayerBoard}
              finishPlayer={finishPlayer}
              leaveGame={leaveGame}
              onGameEnd={handleGameEnd}
            />
          )}

          {phase === 'finished' && (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-green-600 mb-4">
                🎉 Spillet er ferdig!
              </h2>
              <div className="space-y-4">
                {players
                  .sort((a, b) => {
                    if (!a.finishedAt) return 1
                    if (!b.finishedAt) return -1
                    return new Date(a.finishedAt).getTime() - new Date(b.finishedAt).getTime()
                  })
                  .map((player, index) => (
                    <div key={player.id} className={`p-4 rounded-lg ${
                      index === 0 ? 'bg-gold-100 border-2 border-gold-300' : 'bg-gray-100'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold">
                          {index === 0 ? '🏆' : `${index + 1}.`} {player.name}
                        </span>
                        {player.finishedAt && (
                          <span className="text-sm text-gray-600">
                            {new Date(player.finishedAt).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
              <button
                onClick={handleGameEnd}
                className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Spill på nytt
              </button>
            </div>
          )}

          {/* Connection status */}
          <div className="fixed bottom-4 left-4 text-xs text-gray-500">
            {socketService.isConnected() ? '🟢 Tilkoblet' : '🔴 Frakoblet'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App 