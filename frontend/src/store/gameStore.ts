import { create } from 'zustand'
import type { CellState, GamePhase } from '../types'

const BOARD_SIZE = 10

interface GameState {
  phase: GamePhase
  board: CellState[][]
  setPhase: (phase: GamePhase) => void
}

function createEmptyBoard(size: number): CellState[][] {
  return Array.from({ length: size }, () => Array(size).fill('empty'))
}

export const useGameStore = create<GameState>((set) => ({
  phase: 'menu',
  board: createEmptyBoard(BOARD_SIZE),
  setPhase: (phase) => set({ phase }),

  // TODO (Fase 1): placeShip, fireAt, resetBoard, conectar con los
  // bindings de Go (window.go.main.App.*) generados por `wails dev`.
}))
