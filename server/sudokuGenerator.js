export class SudokuGenerator {
  constructor() {
    this.DIFFICULTY_HOLES = {
      lett: 30,
      middels: 45,
      vanskelig: 55
    }
  }

  /**
   * Generer et nytt sudoku-brett med spesifisert vanskelighetsgrad
   */
  async generateSudoku(difficulty) {
    let attempts = 0
    const maxAttempts = 10
    
    while (attempts < maxAttempts) {
      try {
        const board = this.createEmptyBoard()
        
        if (this.fillBoard(board)) {
          const holes = this.DIFFICULTY_HOLES[difficulty]
          const puzzle = this.removeNumbers(board, holes)
          
          if (this.isValidBoard(puzzle)) {
            return {
              board: puzzle,
              originalBoard: puzzle.map(row => [...row]) // Deep copy
            }
          }
        }
      } catch (error) {
        console.warn(`Attempt ${attempts + 1} failed:`, error)
      }
      
      attempts++
    }
    
    throw new Error(`Could not generate valid sudoku board after ${maxAttempts} attempts`)
  }

  /**
   * Lag et tomt 9x9 brett
   */
  createEmptyBoard() {
    return Array(9).fill(null).map(() => Array(9).fill(0))
  }

  /**
   * Fyller diagonale 3x3 bokser først
   */
  fillDiagonalBoxes(board) {
    for (let i = 0; i < 3; i++) {
      this.fillBox(board, i * 3, i * 3)
    }
  }

  /**
   * Fyller en 3x3 boks med tilfeldige tall
   */
  fillBox(board, row, col) {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    this.shuffleArray(numbers)
    
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
  fillRemaining(board, row, col) {
    if (row >= 9) return true
    
    const nextRow = col >= 8 ? row + 1 : row
    const nextCol = col >= 8 ? 0 : col + 1
    
    if (board[row][col] !== 0) {
      return this.fillRemaining(board, nextRow, nextCol)
    }
    
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    this.shuffleArray(numbers)
    
    for (const num of numbers) {
      if (this.isValidMove(board, row, col, num)) {
        board[row][col] = num
        
        if (this.fillRemaining(board, nextRow, nextCol)) {
          return true
        }
        
        board[row][col] = 0
      }
    }
    
    return false
  }

  /**
   * Hovedfunksjonen for å fylle brettet
   */
  fillBoard(board) {
    this.fillDiagonalBoxes(board)
    
    if (!this.fillRemaining(board, 0, 0)) {
      return false
    }
    
    this.randomTransformations(board)
    return true
  }

  /**
   * Utfører tilfeldige transformasjoner på brettet
   */
  randomTransformations(board) {
    const numTransformations = 5 + Math.floor(Math.random() * 10)
    
    for (let i = 0; i < numTransformations; i++) {
      const transformation = Math.floor(Math.random() * 6)
      
      switch (transformation) {
        case 0:
          this.swapRowsInGroup(board, Math.floor(Math.random() * 3))
          break
        case 1:
          this.swapColumnsInGroup(board, Math.floor(Math.random() * 3))
          break
        case 2:
          this.swapRowGroups(board)
          break
        case 3:
          this.swapColumnGroups(board)
          break
        case 4:
          this.transpose(board)
          break
        case 5:
          const num1 = 1 + Math.floor(Math.random() * 9)
          const num2 = 1 + Math.floor(Math.random() * 9)
          if (num1 !== num2) {
            this.swapNumbers(board, num1, num2)
          }
          break
      }
    }
  }

  /**
   * Bytt to rader innenfor samme 3x3 boks-gruppe
   */
  swapRowsInGroup(board, group) {
    const startRow = group * 3
    const row1 = startRow + Math.floor(Math.random() * 3)
    const row2 = startRow + Math.floor(Math.random() * 3)
    
    if (row1 !== row2) {
      [board[row1], board[row2]] = [board[row2], board[row1]]
    }
  }

  /**
   * Bytt to kolonner innenfor samme 3x3 boks-gruppe
   */
  swapColumnsInGroup(board, group) {
    const startCol = group * 3
    const col1 = startCol + Math.floor(Math.random() * 3)
    const col2 = startCol + Math.floor(Math.random() * 3)
    
    if (col1 !== col2) {
      for (let row = 0; row < 9; row++) {
        [board[row][col1], board[row][col2]] = [board[row][col2], board[row][col1]]
      }
    }
  }

  /**
   * Bytt to 3x3 rad-grupper
   */
  swapRowGroups(board) {
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
   * Bytt to 3x3 kolonne-grupper
   */
  swapColumnGroups(board) {
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
   * Transponér brettet
   */
  transpose(board) {
    for (let i = 0; i < 9; i++) {
      for (let j = i + 1; j < 9; j++) {
        ;[board[i][j], board[j][i]] = [board[j][i], board[i][j]]
      }
    }
  }

  /**
   * Bytt to tall i hele brettet
   */
  swapNumbers(board, num1, num2) {
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

  /**
   * Fjern tall fra brettet for å lage puzzle
   */
  removeNumbers(board, holes) {
    const puzzle = board.map(row => [...row])
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
   * Sjekk om et tall er gyldig på en gitt posisjon
   */
  isValidMove(board, row, col, num) {
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
   * Valider om brettet er gyldig så langt
   */
  isValidBoard(board) {
    // Sjekk alle rader
    for (let row = 0; row < 9; row++) {
      const seen = new Set()
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
      const seen = new Set()
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
        const seen = new Set()
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

  /**
   * Bland en array
   */
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }
} 