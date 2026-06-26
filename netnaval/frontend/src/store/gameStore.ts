import { create } from 'zustand'
import type { SessionState, Difficulty, GameMode, OnlineHostResult } from '../types'
import * as w from '../lib/wails'


interface GameStore {
  session:          SessionState | null
  mode:             GameMode | null
  loading:          boolean
  error:            string | null
  // LAN
  lanIP:            string | null
  lanMyReady:       boolean
  // Online
  onlineResult:     OnlineHostResult | null

  // ── Menú ──────────────────────────────────────────────────────────
  startSolo:        (d: Difficulty) => Promise<void>
  hostLan:          () => Promise<void>
  joinLan:          (ip: string) => Promise<void>
  hostOnline:       () => Promise<void>
  joinOnline:       (code: string) => Promise<void>

  // ── Colocación (modo agnóstico) ───────────────────────────────────
  placeShip:        (i: number, x: number, y: number, h: boolean) => Promise<void>
  removeShip:       (i: number) => Promise<void>
  autoPlace:        () => Promise<void>
  readyOrStart:     () => Promise<void>

  // ── Batalla ───────────────────────────────────────────────────────
  fire:             (x: number, y: number) => Promise<void>

  // ── LAN events ────────────────────────────────────────────────────
  setSession:       (s: SessionState) => void

  // ── Control ───────────────────────────────────────────────────────
  reset:            () => void
  clearError:       () => void
}

async function apiCall(
  set: (p: Partial<GameStore>) => void,
  fn: () => Promise<SessionState>
) {
  set({ error: null })
  try {
    const session = await fn()
    set({ session })
  } catch (e) {
    set({ error: String(e) })
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  session:      null,
  mode:         null,
  loading:      false,
  error:        null,
  lanIP:        null,
  lanMyReady:   false,
  onlineResult: null,

  // ── Menú ──────────────────────────────────────────────────────────

  startSolo: async (d) => {
    set({ loading: true, error: null, mode: 'solo', lanMyReady: false, onlineResult: null })
    try {
      const session = await w.newGame(d)
      set({ session, loading: false })
    } catch (e) { set({ error: String(e), loading: false, mode: null }) }
  },

  hostLan: async () => {
    set({ loading: true, error: null, lanMyReady: false, onlineResult: null })
    try {
      const ip = await w.hostLanGame()
      set({ mode: 'lan_host', lanIP: ip, loading: false, session: null })
    } catch (e) { set({ error: String(e), loading: false }) }
  },

  joinLan: async (ip) => {
    set({ loading: true, error: null, lanMyReady: false, onlineResult: null })
    try {
      const session = await w.joinLanGame(ip)
      set({ mode: 'lan_client', session, loading: false })
    } catch (e) { set({ error: String(e), loading: false }) }
  },

  hostOnline: async () => {
    set({ loading: true, error: null, lanMyReady: false, onlineResult: null })
    try {
      const result = await w.hostOnlineGame()
      set({ mode: 'online_host', onlineResult: result, loading: false, session: null })
    } catch (e) { set({ error: String(e), loading: false }) }
  },

  joinOnline: async (code) => {
    set({ loading: true, error: null, lanMyReady: false })
    try {
      const session = await w.joinOnlineGame(code)
      set({ mode: 'online_client', session, loading: false })
    } catch (e) { set({ error: String(e), loading: false }) }
  },

  // ── Colocación ────────────────────────────────────────────────────

  placeShip: (i, x, y, h) => {
    const m = get().mode
    return apiCall(set, () =>
      m === 'solo' ? w.placeShip(i, x, y, h) : w.lanPlaceShip(i, x, y, h)
    )
  },

  removeShip: (i) => {
    const m = get().mode
    return apiCall(set, () =>
      m === 'solo' ? w.removeShip(i) : w.lanRemoveShip(i)
    )
  },

  autoPlace: () => {
    const m = get().mode
    return apiCall(set, () =>
      m === 'solo' ? w.autoPlace() : w.lanAutoPlace()
    )
  },

  readyOrStart: async () => {
    const m = get().mode
    set({ loading: true, error: null })
    try {
      if (m === 'solo') {
        const session = await w.startBattle()
        set({ session, loading: false })
      } else {
        const session = await w.lanReady()
        set({ session, loading: false, lanMyReady: true })
      }
    } catch (e) { set({ error: String(e), loading: false }) }
  },

  // ── Batalla ───────────────────────────────────────────────────────

  fire: async (x, y) => {
    const m = get().mode
    set({ error: null })
    try {
      if (m === 'solo') {
        const session = await w.playerFire(x, y)
        set({ session })
      } else {
        const session = await w.lanFire(x, y)
        set({ session })
      }
    } catch (e) { set({ error: String(e) }) }
  },

  setSession: (session) => set({ session }),

  reset: () => set({
    session: null, mode: null, error: null,
    lanIP: null, lanMyReady: false, onlineResult: null,
  }),
  clearError: () => set({ error: null }),
}))
