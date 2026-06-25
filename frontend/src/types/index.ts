export type CellState  = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk'
export type GamePhase  = 'placement' | 'battle' | 'gameover'
export type GameMode   = 'solo' | 'lan_host' | 'lan_client'
export type Difficulty = 0 | 1   // 0 = Fácil · 1 = Medio

export interface Coordinate  { x: number; y: number }

export interface FireResult {
  coordinate:   Coordinate
  hit:          boolean
  sunk:         boolean
  shipName?:    string
  shipSize?:    number
  alreadyFired: boolean
}

export interface ShipInfo { index: number; name: string; size: number; placed: boolean }

export interface BoardView { size: number; cells: CellState[][] }

export interface SessionState {
  phase:          GamePhase
  playerBoard:    BoardView
  cpuBoard:       BoardView
  currentTurn:    'player' | 'cpu'
  winner:         '' | 'player' | 'cpu'
  fleet:          ShipInfo[]
  lastPlayerShot?: FireResult
  lastCPUShot?:    FireResult
}

export interface ChatMessage {
  id:        string
  sender:    string
  content:   string
  timestamp: string
  kind:      'chat' | 'event'
}
