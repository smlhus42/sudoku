# WebSocket Server Guide - War of Numbers

Denne guiden viser deg hvordan du setter opp og kjører WebSocket-serveren for War of Numbers multiplayer Sudoku-spillet.

## 🚀 Rask start

### 1. Start backend-serveren
```bash
cd server
npm run dev
```

### 2. Start frontend-serveren
```bash
npm run dev
```

### 3. Åpne spillet
- Gå til `http://localhost:5173` i nettleseren
- Opprett et nytt spill eller koble til et eksisterende spill

## 🔧 Teknisk oversikt

### Backend (Node.js + Express + Socket.io)
- **Port**: 3001
- **API Base URL**: `http://localhost:3001`
- **WebSocket URL**: `ws://localhost:3001`

### Frontend (React + Vite)
- **Port**: 5173
- **URL**: `http://localhost:5173`

## 📡 API Endpoints

### REST API
```
POST /api/game/create
- Body: { difficulty: 'lett' | 'middels' | 'vanskelig', playerName: string }
- Response: { gameId: string, playerId: string }

POST /api/game/join/:gameId
- Body: { playerName: string }
- Response: { gameId: string, playerId: string }

GET /api/game/:gameId
- Response: { id, phase, difficulty, players, createdAt, startedAt }

GET /health
- Response: { status: 'OK', activeGames: number, activePlayers: number }
```

### WebSocket Events

#### Client → Server
```javascript
// Koble til spill-room
socket.emit('join-game', { gameId, playerId })

// Start spill (kun host)
socket.emit('start-game', { gameId, playerId })

// Oppdater celle
socket.emit('cell-update', { gameId, playerId, row, col, value })

// Forlat spill
socket.emit('leave-game', { gameId, playerId })
```

#### Server → Client
```javascript
// Spill-tilstand
socket.on('game-state', (data) => {
  // { game: {...}, player: { id, board, originalBoard } }
})

// Spiller-oppdatering
socket.on('player-update', (data) => {
  // { playerId, board, cellsRemaining, isSolved }
})

// Spillet startet
socket.on('game-started', (data) => {
  // { game: {...}, board, originalBoard }
})

// Spiller ferdig
socket.on('player-finished', (data) => {
  // { playerId, playerName, finishedAt }
})

// Spiller tilkoblet/frakoblet
socket.on('player-connected', (data) => { /* ... */ })
socket.on('player-disconnected', (data) => { /* ... */ })

// Feil
socket.on('error', (data) => {
  // { message: string }
})
```

## 🏗️ Arkitektur

### Backend-struktur
```
server/
├── index.js          # Hovedserverfil (Express + Socket.io)
├── gameManager.js    # Spilltilstand og logikk
├── sudokuGenerator.js # Sudoku-generering
└── package.json      # Dependencies
```

### Frontend-struktur
```
src/
├── services/
│   └── socketService.ts     # WebSocket-klient
├── hooks/
│   ├── useGameState.ts      # Multiplayer-tilstand
│   └── useSudoku.ts         # Sudoku-logikk
├── components/
│   ├── GameLobby.tsx        # Lobby-skjerm
│   ├── GameBoard.tsx        # Spill-skjerm
│   └── SudokuGrid.tsx       # Sudoku-brett
└── App.tsx                  # Hovedkomponent
```

## 🎮 Spillflyt

### 1. Opprett spill
1. Bruker velger vanskelighetsgrad
2. Frontend sender `POST /api/game/create`
3. Backend returnerer `gameId` og `playerId`
4. Frontend kobler til WebSocket og sender `join-game`

### 2. Koble til spill
1. Bruker limer inn gameId eller invite-link
2. Frontend sender `POST /api/game/join/:gameId`
3. Backend returnerer `playerId`
4. Frontend kobler til WebSocket og sender `join-game`

### 3. Start spill
1. Host klikker "Start spill"
2. Frontend sender `start-game` via WebSocket
3. Backend genererer Sudoku-brett
4. Backend sender `game-started` til alle spillere

### 4. Spill pågår
1. Spillere fyller ut celler
2. Frontend sender `cell-update` for hver endring
3. Backend oppdaterer spilltilstand
4. Backend sender `player-update` til alle spillere

### 5. Spill ferdig
1. Spiller løser brettet
2. Backend sender `player-finished`
3. Frontend viser konfetti og resultater

## 🔒 Sikkerhet

### Validering
- Alle input valideres på backend
- Spillere kan kun endre tomme celler
- Kun host kan starte spill
- Sudoku-regler valideres

### Feilhåndtering
- WebSocket-reconnection ved nettverksfeil
- Timeout på API-kall
- Graceful handling av disconnects

## 🐛 Debugging

### Backend-logging
```bash
# I server-terminalen ser du:
🔗 New connection: socket_id
👤 Player Name joined game GAME123
🚀 Game GAME123 started
🔄 Player update: { playerId, board, cellsRemaining }
🏆 Player Name finished game GAME123!
```

### Frontend-logging
```bash
# I browser console ser du:
🔗 Connected to WebSocket server
📊 Received game state: { game, player }
🔄 Player update: { playerId, board, cellsRemaining }
🚀 Game started: { game, board, originalBoard }
```

### Health check
```bash
curl http://localhost:3001/health
```

## 🚨 Feilsøking

### Common Issues

#### "WebSocket connection failed"
- Sjekk at backend-serveren kjører på port 3001
- Kontroller at CORS er konfigurert riktig

#### "Game not found"
- Sjekk at gameId er gyldig (8 karakterer, store bokstaver/tall)
- Kontroller at spillet ikke er slettet

#### "Only the host can start the game"
- Kun spilleren som opprettet spillet kan starte det
- Sjekk at `isHost` er `true`

#### "Cannot modify original numbers"
- Originalverdier kan ikke endres
- Kun tomme celler (0) kan fylles ut

### Restart alt
```bash
# Stop alle servere (Ctrl+C)
# Start backend
cd server && npm run dev

# Start frontend (ny terminal)
npm run dev
```

## 🎯 Testing

### Multiplayer-testing
1. Åpne to nettlesertabs
2. Opprett spill i første tab
3. Kopier invite-link
4. Koble til i andre tab
5. Start spill og test real-time sync

### API-testing
```bash
# Test health
curl http://localhost:3001/health

# Test create game
curl -X POST http://localhost:3001/api/game/create \
  -H "Content-Type: application/json" \
  -d '{"difficulty": "lett", "playerName": "TestPlayer"}'
```

## 🔄 Neste steg

### Produksjon
- Konfigurer HTTPS for WebSocket
- Sett opp database for persistent storage
- Implementer rate limiting
- Konfigurer logging og monitoring

### Nye features
- Spectator mode
- Turnering/ranking system
- Chat-funksjonalitet
- Replay-system

---

**Lykke til med War of Numbers! ⚔️🔢** 