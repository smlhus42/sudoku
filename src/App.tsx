import React, { useState, useEffect } from 'react'
import { useGameState } from './hooks/useGameState'
import GameLobby from './components/GameLobby'
import GameBoard from './components/GameBoard'

/**
 * Hovedkomponent for War of Numbers
 * Håndterer routing mellom lobby og spill
 */
function App() {
  const gameState = useGameState()
  const { 
    phase, 
    gameId, 
    playerId, 
    difficulty, 
    players, 
    isHost, 
    currentPlayer, 
    opponent,
    isConnecting,
    connectionError,
    createGame,
    joinGame,
    startGame,
    updatePlayerBoard,
    finishPlayer,
    leaveGame,
    getInviteLink
  } = gameState
  
  // Sjekk om det er en gameId i URL ved lasting
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const gameId = urlParams.get('gameId')
    
    if (gameId) {
      // TODO: Valider at gameId er gyldig før joining
      joinGame(gameId).catch(error => {
        console.error('Kunne ikke koble til spill fra URL:', error)
        // TODO: Vis feilmelding til bruker
      })
    }
  }, [joinGame])

  const handleGameStart = () => {
    // Game state håndteres av useGameState hook
    // Dette er bare en callback for å refreshe UI
  }

  const handleGameEnd = () => {
    // Game state håndteres av useGameState hook
    // Dette er bare en callback for å refreshe UI
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
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
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              🎉 Spillet er over!
            </h2>
            <p className="text-gray-600 mb-6">
              Takk for at du spilte War of Numbers!
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              Spill igjen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App 