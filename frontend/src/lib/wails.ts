// Puente tipado React → Wails v2 runtime (window.go.main.App.*)

import type { SessionState, ChatMessage } from '../types'

interface WailsApp {
  // Solo
  NewGame(d: number): Promise<SessionState>
  PlaceShip(i: number, x: number, y: number, h: boolean): Promise<SessionState>
  RemoveShip(i: number): Promise<SessionState>
  AutoPlace(): Promise<SessionState>
  StartBattle(): Promise<SessionState>
  PlayerFire(x: number, y: number): Promise<SessionState>
  GetState(): Promise<SessionState>
  SendChatMessage(sender: string, content: string): Promise<void>
  // LAN
  HostLanGame(): Promise<string>
  JoinLanGame(ip: string): Promise<SessionState>
  LanPlaceShip(i: number, x: number, y: number, h: boolean): Promise<SessionState>
  LanRemoveShip(i: number): Promise<SessionState>
  LanAutoPlace(): Promise<SessionState>
  LanReady(): Promise<SessionState>
  LanFire(x: number, y: number): Promise<void>
  LanGetState(): Promise<SessionState>
  LanSendChat(content: string): Promise<void>
}

interface WailsRuntime {
  EventsOn(e: string, cb: (...a: unknown[]) => void): () => void
  EventsOff(...e: string[]): void
}

declare global {
  interface Window {
    go?: { main?: { App?: WailsApp } }
    runtime?: WailsRuntime
  }
}

const api = (): WailsApp => {
  const a = window.go?.main?.App
  if (!a) throw new Error('Wails runtime no disponible')
  return a
}
const rt = (): WailsRuntime => {
  const r = window.runtime
  if (!r) throw new Error('Wails runtime no disponible')
  return r
}

// ── Solo ─────────────────────────────────────────────────────────────
export const newGame      = (d: 0 | 1)                                   => api().NewGame(d)
export const placeShip    = (i: number, x: number, y: number, h: boolean) => api().PlaceShip(i, x, y, h)
export const removeShip   = (i: number)                                   => api().RemoveShip(i)
export const autoPlace    = ()                                            => api().AutoPlace()
export const startBattle  = ()                                            => api().StartBattle()
export const playerFire   = (x: number, y: number)                       => api().PlayerFire(x, y)
export const sendChat     = (sender: string, c: string)                   => api().SendChatMessage(sender, c)

// ── LAN ──────────────────────────────────────────────────────────────
export const hostLanGame    = ()                                            => api().HostLanGame()
export const joinLanGame    = (ip: string)                                  => api().JoinLanGame(ip)
export const lanPlaceShip   = (i: number, x: number, y: number, h: boolean) => api().LanPlaceShip(i, x, y, h)
export const lanRemoveShip  = (i: number)                                   => api().LanRemoveShip(i)
export const lanAutoPlace   = ()                                            => api().LanAutoPlace()
export const lanReady       = ()                                            => api().LanReady()
export const lanFire        = (x: number, y: number)                       => api().LanFire(x, y)
export const lanGetState    = ()                                            => api().LanGetState()
export const lanSendChat    = (c: string)                                   => api().LanSendChat(c)

// ── Eventos ──────────────────────────────────────────────────────────
export const onChatMessage    = (cb: (m: ChatMessage)    => void) => rt().EventsOn('chat:message',    m => cb(m as ChatMessage))
export const onLanState       = (cb: (s: SessionState)   => void) => rt().EventsOn('lan:state',       s => cb(s as SessionState))
export const onLanConnected   = (cb: ()                  => void) => rt().EventsOn('lan:connected',   cb)
export const onLanBattleStart = (cb: ()                  => void) => rt().EventsOn('lan:battle_start',cb)
export const onLanDisconnected= (cb: ()                  => void) => rt().EventsOn('lan:disconnected',cb)
