import React, { useState } from 'react'
import { Difficulty } from '../hooks/useSudoku'

interface GameLobbyProps {
  gameId: string | null
  difficulty: Difficulty
  players: any[]
  isHost: boolean
  isConnecting: boolean
  connectionError: string | null
  createGame: (difficulty: Difficulty, playerName?: string) => Promise<string>
  joinGame: (gameId: string, playerName?: string) => Promise<any>
  startGame: () => Promise<void>
  getInviteLink: () => string
  onGameStart: () => void
}

/**
 * GameLobby - Håndterer opprettelse og joining av spill
 * TODO: Integrer med backend for real-time lobby updates
 */
const GameLobby: React.FC<GameLobbyProps> = ({
  gameId,
  difficulty,
  players,
  isHost,
  isConnecting,
  connectionError,
  createGame,
  joinGame,
  startGame,
  getInviteLink,
  onGameStart
}) => {

  const [joinGameId, setJoinGameId] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('lett')
  const [showInviteLink, setShowInviteLink] = useState(false)

  /**
   * Håndter opprettelse av nytt spill
   */
  const handleCreateGame = async () => {
    console.log('🎮 Oppretter spill med vanskelighetsgrad:', selectedDifficulty)
    try {
      const gameId = await createGame(selectedDifficulty, 'Du')
      console.log('✅ Spill opprettet med ID:', gameId)
      setShowInviteLink(true)
    } catch (error) {
      console.error('❌ Feil ved opprettelse av spill:', error)
      // Feilmelding vises automatisk i UI via connectionError
    }
  }

  /**
   * Håndter joining av eksisterende spill
   */
  const handleJoinGame = async () => {
    if (!joinGameId.trim()) return
    
    setIsJoining(true)
    try {
      await joinGame(joinGameId.trim().toUpperCase())
      setJoinGameId('')
    } catch (error) {
      console.error('Feil ved tilkobling til spill:', error)
      // TODO: Vis feilmelding til bruker
    } finally {
      setIsJoining(false)
    }
  }

  /**
   * Håndter start av spill
   */
  const handleStartGame = async () => {
    try {
      await startGame()
      onGameStart()
    } catch (error) {
      console.error('Feil ved start av spill:', error)
    }
  }

  /**
   * Kopier invite link til clipboard
   */
  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(getInviteLink())
      // TODO: Vis feedback at link er kopiert
    } catch (error) {
      console.error('Kunne ikke kopiere link:', error)
    }
  }

  /**
   * Parse invite link fra input
   */
  const handleInviteLinkPaste = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setJoinGameId(value)
    
    // Prøv å ekstraktere gameId fra URL
    const urlMatch = value.match(/gameId=([A-Z0-9]+)/i)
    if (urlMatch) {
      setJoinGameId(urlMatch[1])
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          ⚔️ War of Numbers
        </h1>
        <p className="text-gray-600">
          Konkurrér mot andre i lynraske Sudoku-dueller!
        </p>
      </div>

      {/* Connection status */}
      {isConnecting && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <p className="text-blue-800">Kobler til server...</p>
          </div>
        </div>
      )}

      {!gameId ? (
        <div className="space-y-8">
          {/* Opprett nytt spill */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              🎮 Opprett nytt spill
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Velg vanskelighetsgrad:
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value as Difficulty)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="lett">Lett (~30 tomme celler)</option>
                <option value="middels">Middels (~45 tomme celler)</option>
                <option value="vanskelig">Vanskelig (~55 tomme celler)</option>
              </select>
            </div>

            <button
              onClick={handleCreateGame}
              disabled={isConnecting}
              className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isConnecting ? 'Oppretter spill...' : 'Opprett spill'}
            </button>

            {connectionError && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                <p className="text-sm">
                  <strong>Feil:</strong> {connectionError}
                </p>
              </div>
            )}
          </div>

          {/* Koble til eksisterende spill */}
          <div className="bg-green-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              🔗 Koble til spill
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Spill-ID eller invite-link:
              </label>
              <input
                type="text"
                value={joinGameId}
                onChange={handleInviteLinkPaste}
                placeholder="Lim inn invite-link eller skriv inn spill-ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <button
              onClick={handleJoinGame}
              disabled={!joinGameId.trim() || isJoining}
              className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isJoining ? 'Kobler til...' : 'Koble til spill'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Spill-info */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              🎯 Spill opprettet
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Spill-ID:</p>
                <p className="text-lg font-mono font-bold text-gray-800">{gameId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Vanskelighetsgrad:</p>
                <p className="text-lg font-semibold text-gray-800 capitalize">{difficulty}</p>
              </div>
            </div>

            {showInviteLink && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Invite-link:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={getInviteLink()}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                  />
                  <button
                    onClick={copyInviteLink}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
                  >
                    📋 Kopier
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Spillere */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              👥 Spillere ({players.length}/2)
            </h3>
            
            <div className="space-y-2">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-white rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${player.isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="font-medium">{player.name}</span>
                    {index === 0 && isHost && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Host
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {players.length < 2 && (
                <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-md border-2 border-dashed border-gray-300">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span className="text-gray-500">Venter på motspiller...</span>
                </div>
              )}
            </div>
          </div>

          {/* Start spill */}
          {isHost && players.length >= 2 && (
            <button
              onClick={handleStartGame}
              className="w-full px-4 py-3 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
            >
              🚀 Start spill
            </button>
          )}
          
          {!isHost && (
            <div className="text-center text-gray-600">
              <p>Venter på at host starter spillet...</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default GameLobby 