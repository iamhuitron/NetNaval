import { create } from 'zustand'
import type { SessionState, Difficulty, GameMode } from '../types'
import * as w from '../lib/wails'

interface GameStore {
  session:  SessionState | null
  mode:     GameMode | null
  loading:  boolean
  error:    string | null
  lanIP:    string | null   // IP local que muestra el host

  // ── Menú ───────────────────────────────────────────────────────────
  startSolo:   (d: Difficulty) => Promise<void>
  hostLan:     () => Promise<void>
  joinLan:     (ip: string) => Promise<void>

  // ── Colocación (funciona para ambos modos) ────────────────────────
  placeShip:   (i: number, x: number, y: number, h: boolean) => Promise<void>
  removeShip:  (i: number) => Promise<void>
  autoPlace:   () => Promise<void>
  readyOrStart:() => Promise<void>   // solo → startBattle; LAN → lanReady

  // ── Batalla ───────────────────────────────────────────────────────
  fire:        (x: number, y: number) => Promise<void>

  // ── LAN events ───────────────────────────────────────────────────
  setSession:  (s: SessionState) => void

  // ── Control ───────────────────────────────────────────────────────
  reset:       () => void
  clearError:  () => void
}

// Helper que envuelve una llamada async, limpia el error y guarda la sesión
async function run(
  set: (p: Partial<GameStore>) => void,
  fn: () => Promise<SessionState>,
  opts?: { loading?: boolean }
) {
  if (opts?.loading) set({ loading: true })
  set({ error: null })
  try {
    const session = await fn()
    set({ session, loading: false })
  } catch (e) {
    set({ error: String(e), loading: false })
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  session: null,
  mode:    null,
  loading: false,
  error:   null,
  lanIP:   null,

  // ── Menú ──────────────────────────────────────────────────────────

  startSolo: async (d) => {
    set({ loading: true, error: null, mode: 'solo' })
    try {
      const session = await w.newGame(d)
      set({ session, loading: false })
    } catch (e) { set({ error: String(e), loading: false, mode: null }) }
  },

  hostLan: async () => {
    set({ loading: true, error: null })
    try {
      const ip = await w.hostLanGame()
      set({ mode: 'lan_host', lanIP: ip, loading: false, session: null })
    } catch (e) { set({ error: String(e), loading: false }) }
  },

  joinLan: async (ip) => {
    set({ loading: true, error: null })
    try {
      const session = await w.joinLanGame(ip)
      set({ mode: 'lan_client', session, loading: false })
    } catch (e) { set({ error: String(e), loading: false }) }
  },

  // ── Colocación ────────────────────────────────────────────────────

  placeShip: (i, x, y, h) => {
    const mode = get().mode
    return run(set, () => mode === 'solo' ? w.placeShip(i, x, y, h) : w.lanPlaceShip(i, x, y, h))
  },

  removeShip: (i) => {
    const mode = get().mode
    return run(set, () => mode === 'solo' ? w.removeShip(i) : w.lanRemoveShip(i))
  },

  autoPlace: () => {
    const mode = get().mode
    return run(set, () => mode === 'solo' ? w.autoPlace() : w.lanAutoPlace())
  },

  readyOrStart: () => {
    const mode = get().mode
    return run(set, () => mode === 'solo' ? w.startBattle() : w.lanReady(), { loading: true })
  },

  // ── Batalla ───────────────────────────────────────────────────────

  fire: async (x, y) => {
    const mode = get().mode
    set({ error: null })
    try {
      if (mode === 'solo') {
        const session = await w.playerFire(x, y)
        set({ session })
      } else {
        // LAN: resultado llega vía evento lan:state
        await w.lanFire(x, y)
      }
    } catch (e) { set({ error: String(e) }) }
  },

  // ── LAN event handler ─────────────────────────────────────────────
  setSession: (session) => set({ session }),

  // ── Control ───────────────────────────────────────────────────────
  reset:      () => set({ session: null, mode: null, error: null, lanIP: null }),
  clearError: () => set({ error: null }),
}))
