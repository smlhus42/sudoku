# ⚔️ War of Numbers - Multiplayer Sudoku

En moderne React-app for flerspiller Sudoku-konkurranser med TypeScript og Tailwind CSS.

## 🎮 Spillkonsept

War of Numbers er en sanntids multiplayer Sudoku-spill hvor spillere konkurrerer om å løse identiske sudoku-brett raskest mulig. Spillet er designet for å være raskt, engasjerende og sosialt.

## 🏗️ Arkitektur

Appen er strukturert for å enkelt integreres med en backend og WebSocket-server for real-time kommunikasjon.

### Komponenter

```
src/
├── components/
│   ├── GameLobby.tsx      # Lobby for å opprette/koble til spill
│   ├── GameBoard.tsx      # Hovedspilleskjerm
│   └── SudokuGrid.tsx     # Gjenbrukbar sudoku-grid komponent
├── hooks/
│   ├── useGameState.ts    # Hook for overordnet spill-state
│   └── useSudoku.ts       # Hook for sudoku-logikk
├── utils/
│   └── sudokuUtils.ts     # Algoritmer for sudoku-generering
└── App.tsx                # Hovedkomponent med routing
```

### State Management

#### `useGameState` Hook
Håndterer overordnet spill-state:
- **gameId**: Unik identifikator for spillet
- **playerId**: Spillerens unike ID
- **phase**: Spillfase ('lobby', 'playing', 'finished')
- **players**: Array av spillere med deres state
- **difficulty**: Valgt vanskelighetsgrad

#### `useSudoku` Hook
Håndterer sudoku-spesifikk logikk:
- **board**: Nåværende brett-state
- **originalBoard**: Originalt brett (for å vise originale tall)
- **generateBoard()**: Genererer nytt brett
- **updateCell()**: Oppdaterer en celle
- **isSolved**: Om brettet er løst

## 🔧 Backend-integrering

### API Endpoints (TODO)

```typescript
// Opprett nytt spill
POST /api/game/create
{
  "difficulty": "lett" | "middels" | "vanskelig",
  "playerId": "string"
}

// Koble til eksisterende spill
POST /api/game/join/:gameId
{
  "playerId": "string"
}

// Hent spill-state
GET /api/game/:gameId

// Forlat spill
DELETE /api/game/:gameId/player/:playerId
```

### WebSocket Events (TODO)

```typescript
// Client -> Server
{
  "type": "CELL_UPDATE",
  "gameId": "string",
  "playerId": "string",
  "row": number,
  "col": number,
  "value": number
}

{
  "type": "START_GAME",
  "gameId": "string"
}

{
  "type": "LEAVE_GAME",
  "gameId": "string",
  "playerId": "string"
}

// Server -> Client
{
  "type": "PLAYER_UPDATE",
  "gameId": "string",
  "playerId": "string",
  "board": number[][],
  "cellsRemaining": number
}

{
  "type": "GAME_STARTED",
  "gameId": "string",
  "board": number[][],
  "originalBoard": number[][]
}

{
  "type": "PLAYER_FINISHED",
  "gameId": "string",
  "playerId": "string",
  "finishedAt": string
}
```

## 🚀 Kom i gang

### Installasjon

```bash
npm install
```

### Utvikling

```bash
npm run dev
```

Appen kjører på `http://localhost:5173`

### Bygging

```bash
npm run build
```

## 🎯 Funksjonalitet

### ✅ Implementert

- **Sudoku-generering**: Avansert algoritme med god randomisering
- **Multiplayer lobby**: Opprett og koble til spill
- **Real-time UI**: Viser motstanderens fremdrift
- **Konfetti**: Feiring når brettet er løst
- **Responsive design**: Fungerer på desktop og mobil
- **Invite-links**: Del spill med venner

### 🔄 TODO - Backend-integrering

- [ ] WebSocket-tilkobling for real-time kommunikasjon
- [ ] Persistent spill-state på server
- [ ] Matchmaking-system
- [ ] Spillerprofilering og statistikk
- [ ] Chat-system
- [ ] Spectator-modus
- [ ] Turnerings-system

### 🔄 TODO - Frontend-forbedringer

- [ ] Bedre error handling og feedback
- [ ] Loading states
- [ ] Offline-modus
- [ ] Lokalisering
- [ ] Accessibility improvements
- [ ] PWA-støtte
- [ ] Animasjoner og transitions

## 🎨 Design

Appen bruker Tailwind CSS for styling med fokus på:
- **Moderne design**: Rene linjer og god kontrast
- **Responsivt**: Fungerer på alle skjermstørrelser
- **Tilgjengelig**: God fargekontrast og keyboard navigation
- **Consistent**: Gjenbrukbare design-tokens

## 🧪 Testing

```bash
npm run test
```

## 📦 Deployment

Appen er konfigurert for enkel deployment til:
- **Vercel**: `vercel --prod`
- **Netlify**: `npm run build && drag dist/ to netlify`
- **Static hosting**: Bygg med `npm run build`

## 🤝 Bidrag

1. Fork prosjektet
2. Lag en feature branch (`git checkout -b feature/amazing-feature`)
3. Commit endringene (`git commit -m 'Add amazing feature'`)
4. Push til branch (`git push origin feature/amazing-feature`)
5. Åpne en Pull Request

## 📄 Lisens

Dette prosjektet er lisensiert under MIT License.

## 🎮 Spilleregler

1. **Opprett spill**: Velg vanskelighetsgrad og opprett et nytt spill
2. **Inviter venner**: Del spill-ID eller invite-link
3. **Konkurrér**: Løs sudoku-brettet raskest mulig
4. **Vinn**: Første spiller som fullfører brettet vinner!

---

Laget med ❤️ for sudoku-elskere og konkurranse-entusiaster! 