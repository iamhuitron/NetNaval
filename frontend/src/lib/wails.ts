// Puente tipado entre React y los bindings de Wails v2.
// En tiempo de ejecución, window.go.main.App.* es inyectado
// automáticamente por Wails antes de que cargue el frontend.

import type { SessionState, ChatMessage } from '../types'

// ── Tipos de la ventana Wails ─────────────────────────────────────────

interface WailsApp {
  NewGame(difficulty: number): Promise<SessionState>
  PlaceShip(shipIndex: number, x: number, y: number, horizontal: boolean): Promise<SessionState>
  RemoveShip(shipIndex: number): Promise<SessionState>
  AutoPlace(): Promise<SessionState>
  StartBattle(): Promise<SessionState>
  PlayerFire(x: number, y: number): Promise<SessionState>
  GetState(): Promise<SessionState>
  SendChatMessage(sender: string, content: string): Promise<void>
}

interface WailsRuntime {
  EventsOn(event: string, cb: (...args: unknown[]) => void): () => void
  EventsOff(...events: string[]): void
}

declare global {
  interface Window {
    go?: { main?: { App?: WailsApp } }
    runtime?: WailsRuntime
  }
}

// ── Helpers internos ──────────────────────────────────────────────────

const api = (): WailsApp => {
  const app = window.go?.main?.App
  if (!app) throw new Error('Wails runtime no disponible')
  return app
}

const rt = (): WailsRuntime => {
  const r = window.runtime
  if (!r) throw new Error('Wails runtime no disponible')
  return r
}

// ── Bindings de sesión ────────────────────────────────────────────────

export const newGame    = (d: 0 | 1) => api().NewGame(d)
export const placeShip  = (i: number, x: number, y: number, h: boolean) =>
  api().PlaceShip(i, x, y, h)
export const removeShip = (i: number)  => api().RemoveShip(i)
export const autoPlace  = ()           => api().AutoPlace()
export const startBattle = ()          => api().StartBattle()
export const playerFire = (x: number, y: number) => api().PlayerFire(x, y)
export const getState   = ()           => api().GetState()
export const sendChatMessage = (sender: string, content: string) =>
  api().SendChatMessage(sender, content)

// ── Suscripción a eventos ─────────────────────────────────────────────

/** Escucha mensajes de chat / eventos de partida emitidos desde Go. */
export const onChatMessage = (cb: (msg: ChatMessage) => void): (() => void) =>
  rt().EventsOn('chat:message', (msg) => cb(msg as ChatMessage))
