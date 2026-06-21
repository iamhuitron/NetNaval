export type CellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk'

export interface Coordinate {
  x: number
  y: number
}

export interface Ship {
  id: string
  name: string
  size: number
  positions: Coordinate[]
  hitsTaken: number
}

export interface ChatMessage {
  sender: string
  content: string
  timestamp: string
}

export type GamePhase = 'menu' | 'placement' | 'battle' | 'gameover'
