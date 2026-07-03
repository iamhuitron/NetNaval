export type CellState  = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk'
export type GamePhase  = 'placement' | 'battle' | 'gameover'
export type GameMode   = 'solo' | 'lan_host' | 'lan_client' | 'online_host' | 'online_client'
export type Difficulty = 0 | 1 | 2

export interface Coordinate  { x: number; y: number }
export interface FireResult  {
  coordinate: Coordinate; hit: boolean; sunk: boolean
  shipName?: string; shipSize?: number; alreadyFired: boolean
}
export interface ShipInfo    { index: number; name: string; size: number; placed: boolean }
export interface BoardView   { size: number; cells: CellState[][] }

export interface AbilityInfo {
  name: string; description: string; icon: string
  maxUses: number; usesLeft: number
}
export interface CaptainProfile {
  id: number; name: string; description: string; emoji: string; ability: AbilityInfo
}
export interface AbilityResult {
  abilityName: string; usesLeft: number
  radarHits?: Coordinate[]; lineResults?: FireResult[]
  activated: boolean; turnsLeft?: number
}
export interface SessionState {
  phase: GamePhase
  playerBoard: BoardView; cpuBoard: BoardView
  currentTurn: 'player' | 'cpu'
  winner: '' | 'player' | 'cpu'
  fleet: ShipInfo[]
  captain: CaptainProfile
  smokeScreen: number
  lastPlayerShot?: FireResult; lastCPUShot?: FireResult
}
export interface ChatMessage {
  id: string; sender: string; content: string; timestamp: string; kind: 'chat' | 'event'
}
export interface OnlineHostResult {
  roomCode:         string
  publicIP:         string
  localIP:          string
  gatewayIP:        string       // IP del router para acceder al panel de admin
  portMappingReady: boolean      // true si UPnP o NAT-PMP abrieron el puerto
  method:           'upnp' | 'natpmp' | 'manual'
  methodError?:     string
}
export interface DiscoveredGame { name: string; ip: string; port: number }
export interface SectorBias {
  topLeft: number; topRight: number; bottomLeft: number; bottomRight: number
}
export interface AnalyticsReport {
  totalShots: number; totalHits: number; accuracy: number; turnsToWin: number
  heatMap: number[][]; sectorBias: SectorBias; bestStreak: number; avgTurnsPerSink: number
}
export interface ThemeColors {
  background: string; surface: string; border: string
  accent: string; accentText: string; textPrimary: string; textMuted: string
  cellEmpty: string; cellShip: string; cellHit: string; cellMiss: string; cellSunk: string
}
export interface Theme { id: string; name: string; colors: ThemeColors }
