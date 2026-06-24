import { create } from 'zustand'
import type { SessionState, Difficulty } from '../types'
import * as wails from '../lib/wails'

interface GameStore {
  session: SessionState | null
  loading: boolean
  error: string | null

  newGame:     (difficulty: Difficulty) => Promise<void>
  placeShip:   (idx: number, x: number, y: number, h: boolean) => Promise<void>
  removeShip:  (idx: number) => Promise<void>
  autoPlace:   () => Promise<void>
  startBattle: () => Promise<void>
  playerFire:  (x: number, y: number) => Promise<void>
  reset:       () => void
  clearError:  () => void
}

// Wrapper que limpia el error antes de cualquier llamada asíncrona
// y actualiza `session` con el estado devuelto por Go.
function call(
  set: (partial: Partial<GameStore>) => void,
  fn: () => Promise<SessionState>
) {
  return async () => {
    set({ error: null })
    try {
      const session = await fn()
      set({ session })
    } catch (e) {
      set({ error: String(e) })
    }
  }
}

export const useGameStore = create<GameStore>((set) => ({
  session: null,
  loading: false,
  error:   null,

  newGame: async (difficulty) => {
    set({ loading: true, error: null })
    try {
      const session = await wails.newGame(difficulty)
      set({ session, loading: false })
    } catch (e) {
      set({ error: String(e), loading: false })
    }
  },

  placeShip:   (idx, x, y, h) => call(set, () => wails.placeShip(idx, x, y, h))(),
  removeShip:  (idx)          => call(set, () => wails.removeShip(idx))(),
  autoPlace:   ()             => call(set, () => wails.autoPlace())(),

  startBattle: async () => {
    set({ loading: true, error: null })
    try {
      const session = await wails.startBattle()
      set({ session, loading: false })
    } catch (e) {
      set({ error: String(e), loading: false })
    }
  },

  playerFire: (x, y) => call(set, () => wails.playerFire(x, y))(),

  reset:      () => set({ session: null, error: null }),
  clearError: () => set({ error: null }),
}))
