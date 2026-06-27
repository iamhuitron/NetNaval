import { create } from 'zustand'
import type { SessionState, Difficulty, GameMode, OnlineHostResult, DiscoveredGame } from '../types'
import * as w from '../lib/wails'

interface GameStore {
  session:          SessionState | null
  mode:             GameMode | null
  loading:          boolean
  error:            string | null
  lanIP:            string | null
  lanMyReady:       boolean
  onlineResult:     OnlineHostResult | null
  discoveredGames:  DiscoveredGame[]

  // Menú
  startSolo:    (d: Difficulty) => Promise<void>
  hostLan:      () => Promise<void>
  joinLan:      (ip: string) => Promise<void>
  hostOnline:   () => Promise<void>
  joinOnline:   (code: string) => Promise<void>
  startScan:    () => void
  stopScan:     () => void

  // Colocación
  placeShip:    (i: number, x: number, y: number, h: boolean) => Promise<void>
  removeShip:   (i: number) => Promise<void>
  autoPlace:    () => Promise<void>
  readyOrStart: () => Promise<void>

  // Batalla
  fire:         (x: number, y: number) => Promise<void>

  // Eventos LAN
  setSession:     (s: SessionState) => void
  setDiscovered:  (games: DiscoveredGame[]) => void

  reset:       () => void
  clearError:  () => void
}

async function call(set: (p: Partial<GameStore>) => void, fn: () => Promise<SessionState>) {
  set({ error: null })
  try { set({ session: await fn() }) }
  catch (e) { set({ error: String(e) }) }
}

export const useGameStore = create<GameStore>((set, get) => ({
  session:         null,
  mode:            null,
  loading:         false,
  error:           null,
  lanIP:           null,
  lanMyReady:      false,
  onlineResult:    null,
  discoveredGames: [],

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
    set({ loading: true, error: null, lanMyReady: false })
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

  startScan: () => {
    try { w.startLANScan() } catch {}
  },
  stopScan: () => {
    try { w.stopLANScan() } catch {}
  },

  // ── Colocación (modo agnóstico) ───────────────────────────────────

  placeShip: (i, x, y, h) => {
    const m = get().mode
    return call(set, () => m === 'solo' ? w.placeShip(i, x, y, h) : w.lanPlaceShip(i, x, y, h))
  },
  removeShip: (i) => {
    const m = get().mode
    return call(set, () => m === 'solo' ? w.removeShip(i) : w.lanRemoveShip(i))
  },
  autoPlace: () => {
    const m = get().mode
    return call(set, () => m === 'solo' ? w.autoPlace() : w.lanAutoPlace())
  },

  readyOrStart: async () => {
    const m = get().mode
    set({ loading: true, error: null })
    try {
      if (m === 'solo') {
        set({ session: await w.startBattle(), loading: false })
      } else {
        set({ session: await w.lanReady(), loading: false, lanMyReady: true })
      }
    } catch (e) { set({ error: String(e), loading: false }) }
  },

  // ── Batalla ───────────────────────────────────────────────────────

  fire: async (x, y) => {
    const m = get().mode
    set({ error: null })
    try {
      if (m === 'solo') set({ session: await w.playerFire(x, y) })
      else              set({ session: await w.lanFire(x, y) })
    } catch (e) { set({ error: String(e) }) }
  },

  setSession:    (session) => set({ session }),
  setDiscovered: (games)   => set({ discoveredGames: games }),

  reset: () => set({
    session: null, mode: null, error: null,
    lanIP: null, lanMyReady: false,
    onlineResult: null, discoveredGames: [],
  }),
  clearError: () => set({ error: null }),
}))
