export type SudokuBoard = number[][]

type Difficulty = 'lett' | 'middels' | 'vanskelig'

// Antall celler som skal fjernes per vanskelighetsgrad
const DIFFICULTY_HOLES = {
  lett: 30,
  middels: 45,
  vanskelig: 55
}

/**
 * Sjekker om et tall er gyldig på en gitt posisjon
 */
function isValidMove(board: SudokuBoard, row: number, col: number, num: number): boolean {
  // Sjekk rad
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num) return false
  }

  // Sjekk kolonne
  for (let i = 0; i < 9; i++) {
    if (board[i][col] === num) return false
  }

  // Sjekk 3x3 boks
  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  
  for (let i = boxRow; i < boxRow + 3; i++) {
    for (let j = boxCol; j < boxCol + 3; j++) {
      if (board[i][j] === num) return false
    }
  }

  return true
}

/**
 * Fyller diagonale 3x3 bokser først (de påvirker ikke hverandre)
 */
function fillDiagonalBoxes(board: SudokuBoard): void {
  for (let i = 0; i < 3; i++) {
    fillBox(board, i * 3, i * 3)
  }
}

/**
 * Fyller en 3x3 boks med tilfeldige tall
 */
function fillBox(board: SudokuBoard, row: number, col: number): void {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  shuffleArray(numbers)
  
  let numIndex = 0
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      board[row + i][col + j] = numbers[numIndex++]
    }
  }
}

/**
 * Fyller resten av brettet med backtracking
 */
function fillRemaining(board: SudokuBoard, row: number, col: number): boolean {
  // Hvis vi har kommet til slutten av brettet
  if (row >= 9) return true
  
  // Beregn neste posisjon
  const nextRow = col >= 8 ? row + 1 : row
  const nextCol = col >= 8 ? 0 : col + 1
  
  // Hvis cellen allerede er fylt, gå til neste
  if (board[row][col] !== 0) {
    return fillRemaining(board, nextRow, nextCol)
  }
  
  // Prøv tall 1-9 i tilfeldig rekkefølge
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  shuffleArray(numbers)
  
  for (const num of numbers) {
    if (isValidMove(board, row, col, num)) {
      board[row][col] = num
      
      if (fillRemaining(board, nextRow, nextCol)) {
        return true
      }
      
      board[row][col] = 0
    }
  }
  
  return false
}

/**
 * Bytter to rader innenfor samme 3x3 boks-gruppe
 */
function swapRowsInGroup(board: SudokuBoard, group: number): void {
  const startRow = group * 3
  const row1 = startRow + Math.floor(Math.random() * 3)
  const row2 = startRow + Math.floor(Math.random() * 3)
  
  if (row1 !== row2) {
    ;[board[row1], board[row2]] = [board[row2], board[row1]]
  }
}

/**
 * Bytter to kolonner innenfor samme 3x3 boks-gruppe
 */
function swapColumnsInGroup(board: SudokuBoard, group: number): void {
  const startCol = group * 3
  const col1 = startCol + Math.floor(Math.random() * 3)
  const col2 = startCol + Math.floor(Math.random() * 3)
  
  if (col1 !== col2) {
    for (let row = 0; row < 9; row++) {
      ;[board[row][col1], board[row][col2]] = [board[row][col2], board[row][col1]]
    }
  }
}

/**
 * Bytter to 3x3 rad-grupper
 */
function swapRowGroups(board: SudokuBoard): void {
  const group1 = Math.floor(Math.random() * 3)
  const group2 = Math.floor(Math.random() * 3)
  
  if (group1 !== group2) {
    for (let i = 0; i < 3; i++) {
      const row1 = group1 * 3 + i
      const row2 = group2 * 3 + i
      ;[board[row1], board[row2]] = [board[row2], board[row1]]
    }
  }
}

/**
 * Bytter to 3x3 kolonne-grupper
 */
function swapColumnGroups(board: SudokuBoard): void {
  const group1 = Math.floor(Math.random() * 3)
  const group2 = Math.floor(Math.random() * 3)
  
  if (group1 !== group2) {
    for (let row = 0; row < 9; row++) {
      for (let i = 0; i < 3; i++) {
        const col1 = group1 * 3 + i
        const col2 = group2 * 3 + i
        ;[board[row][col1], board[row][col2]] = [board[row][col2], board[row][col1]]
      }
    }
  }
}

/**
 * Transponerer brettet (bytter rader og kolonner)
 */
function transpose(board: SudokuBoard): void {
  for (let i = 0; i < 9; i++) {
    for (let j = i + 1; j < 9; j++) {
      ;[board[i][j], board[j][i]] = [board[j][i], board[i][j]]
    }
  }
}

/**
 * Utfører tilfeldige transformasjoner på brettet
 */
function randomTransformations(board: SudokuBoard): void {
  // Utfør 5-15 tilfeldige transformasjoner
  const numTransformations = 5 + Math.floor(Math.random() * 10)
  
  for (let i = 0; i < numTransformations; i++) {
    const transformation = Math.floor(Math.random() * 6)
    
    switch (transformation) {
      case 0:
        swapRowsInGroup(board, Math.floor(Math.random() * 3))
        break
      case 1:
        swapColumnsInGroup(board, Math.floor(Math.random() * 3))
        break
      case 2:
        swapRowGroups(board)
        break
      case 3:
        swapColumnGroups(board)
        break
      case 4:
        transpose(board)
        break
      case 5:
        // Bytt to tilfeldige tall i hele brettet
        const num1 = 1 + Math.floor(Math.random() * 9)
        const num2 = 1 + Math.floor(Math.random() * 9)
        if (num1 !== num2) {
          for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
              if (board[row][col] === num1) {
                board[row][col] = num2
              } else if (board[row][col] === num2) {
                board[row][col] = num1
              }
            }
          }
        }
        break
    }
  }
}

/**
 * Hovedfunksjonen for å fylle brettet
 */
function fillBoard(board: SudokuBoard): boolean {
  // Først fyller vi diagonale bokser (de påvirker ikke hverandre)
  fillDiagonalBoxes(board)
  
  // Så fyller vi resten med backtracking
  if (!fillRemaining(board, 0, 0)) {
    return false
  }
  
  // Til slutt utfører vi tilfeldige transformasjoner for ekstra variasjon
  randomTransformations(board)
  
  return true
}

/**
 * Blander en array
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Lager et tomt 9x9 brett
 */
function createEmptyBoard(): SudokuBoard {
  return Array(9).fill(null).map(() => Array(9).fill(0))
}

/**
 * Kopierer et brett
 */
function copyBoard(board: SudokuBoard): SudokuBoard {
  return board.map(row => [...row])
}

/**
 * Fjerner tall fra brettet for å lage puzzle
 */
function removeNumbers(board: SudokuBoard, holes: number): SudokuBoard {
  const puzzle = copyBoard(board)
  let removed = 0
  
  while (removed < holes) {
    const row = Math.floor(Math.random() * 9)
    const col = Math.floor(Math.random() * 9)
    
    if (puzzle[row][col] !== 0) {
      puzzle[row][col] = 0
      removed++
    }
  }
  
  return puzzle
}

/**
 * Genererer et nytt sudoku-brett med spesifisert vanskelighetsgrad
 */
export function generateSudoku(difficulty: Difficulty): SudokuBoard {
  // Prøv å generere brettet flere ganger om nødvendig
  let attempts = 0
  const maxAttempts = 10
  
  while (attempts < maxAttempts) {
    try {
      const board = createEmptyBoard()
      
      // Fyll brettet med gyldige tall
      if (fillBoard(board)) {
        // Fjern tall basert på vanskelighetsgrad
        const holes = DIFFICULTY_HOLES[difficulty]
        const puzzle = removeNumbers(board, holes)
        
        // Valider at brettet er korrekt
        if (isValidBoard(puzzle)) {
          return puzzle
        }
      }
    } catch (error) {
      console.warn(`Attempt ${attempts + 1} failed:`, error)
    }
    
    attempts++
  }
  
  throw new Error(`Kunne ikke generere gyldig sudoku-brett etter ${maxAttempts} forsøk`)
}

/**
 * Sjekker om brettet er komplett løst
 */
export function isSolved(board: SudokuBoard): boolean {
  // Først sjekk om alle celler er fylt ut
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) return false
    }
  }
  
  // Så sjekk om brettet er gyldig
  return isValidBoard(board)
}

/**
 * Validerer om et brett er gyldig så langt
 */
export function isValidBoard(board: SudokuBoard): boolean {
  // Sjekk alle rader
  for (let row = 0; row < 9; row++) {
    const seen = new Set<number>()
    for (let col = 0; col < 9; col++) {
      const num = board[row][col]
      if (num !== 0) {
        if (seen.has(num)) return false
        seen.add(num)
      }
    }
  }
  
  // Sjekk alle kolonner
  for (let col = 0; col < 9; col++) {
    const seen = new Set<number>()
    for (let row = 0; row < 9; row++) {
      const num = board[row][col]
      if (num !== 0) {
        if (seen.has(num)) return false
        seen.add(num)
      }
    }
  }
  
  // Sjekk alle 3x3 bokser
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const seen = new Set<number>()
      for (let row = boxRow * 3; row < boxRow * 3 + 3; row++) {
        for (let col = boxCol * 3; col < boxCol * 3 + 3; col++) {
          const num = board[row][col]
          if (num !== 0) {
            if (seen.has(num)) return false
            seen.add(num)
          }
        }
      }
    }
  }
  
  return true
} 