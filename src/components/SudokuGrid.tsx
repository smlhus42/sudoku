import React from 'react'
import { SudokuBoard } from '../utils/sudokuUtils'

interface SudokuGridProps {
  board: SudokuBoard
  originalBoard: SudokuBoard | null
  onCellChange?: (row: number, col: number, value: string) => void
  readOnly?: boolean
  isSolved?: boolean
  className?: string
}

/**
 * Gjenbrukbar SudokuGrid komponent
 * Kan brukes både for spillerens eget brett og for å vise motstanderens brett
 */
const SudokuGrid: React.FC<SudokuGridProps> = ({
  board,
  originalBoard,
  onCellChange,
  readOnly = false,
  isSolved = false,
  className = ''
}) => {
  const renderCell = (value: number, rowIndex: number, colIndex: number) => {
    const isBoxBorder = (index: number) => index % 3 === 0 && index !== 0
    const isOriginal = originalBoard ? originalBoard[rowIndex][colIndex] !== 0 : false
    
    return (
      <div
        key={`${rowIndex}-${colIndex}`}
        className={`
          w-12 h-12 border border-gray-300 flex items-center justify-center
          transition-colors duration-200
          ${isBoxBorder(colIndex) ? 'border-l-2 border-l-gray-800' : ''}
          ${isBoxBorder(rowIndex) ? 'border-t-2 border-t-gray-800' : ''}
          ${colIndex === 8 ? 'border-r-2 border-r-gray-800' : ''}
          ${rowIndex === 8 ? 'border-b-2 border-b-gray-800' : ''}
          ${isOriginal ? 'bg-gray-100' : readOnly ? 'bg-gray-50' : 'bg-white hover:bg-blue-50'}
          ${isSolved ? 'bg-green-100' : ''}
        `}
      >
        <input
          type="text"
          value={value === 0 ? '' : value.toString()}
          onChange={(e) => onCellChange?.(rowIndex, colIndex, e.target.value)}
          disabled={isOriginal || readOnly}
          className={`
            w-full h-full text-center text-lg font-semibold border-none outline-none
            bg-transparent
            ${isOriginal ? 'text-gray-800 cursor-not-allowed' : readOnly ? 'text-gray-600' : 'text-blue-600'}
            ${isSolved ? 'text-green-700' : ''}
          `}
          maxLength={1}
        />
      </div>
    )
  }

  return (
    <div className={`flex justify-center ${className}`}>
      <div className="grid grid-cols-9 gap-0 border-2 border-gray-800 bg-gray-800">
        {board.map((row, rowIndex) =>
          row.map((value, colIndex) => renderCell(value, rowIndex, colIndex))
        )}
      </div>
    </div>
  )
}

export default SudokuGrid 