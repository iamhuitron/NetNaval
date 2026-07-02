import { create } from 'zustand'
import type { Theme } from '../types'
import * as w from '../lib/wails'

interface ThemeStore {
  themes:   Theme[]
  activeID: string
  load:     () => Promise<void>
  apply:    (id: string) => void
}

const STORAGE_KEY = 'netnaval-theme'

// localStorage puede lanzar en algunos webviews (almacenamiento restringido,
// orígenes especiales tipo wails://, modo privado, etc). Nunca debe
// ejecutarse sin protección, y MENOS aún en la inicialización síncrona
// del store — un fallo aquí rompe la carga de TODO el módulo que lo
// importe (en este caso, App.tsx).
function safeGetTheme(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? 'classic'
  } catch {
    return 'classic'
  }
}

function safeSetTheme(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // Si falla, simplemente no persiste entre sesiones — no es crítico
  }
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  themes:   [],
  activeID: safeGetTheme(),

  load: async () => {
    try {
      const themes = await w.getThemes()
      set({ themes })
      get().apply(get().activeID)
    } catch {
      // Sin Wails runtime (o falla la llamada): seguir sin temas cargados,
      // el resto de la app debe funcionar igual.
    }
  },

  apply: (id) => {
    const { themes } = get()
    const theme = themes.find(t => t.id === id)
    if (!theme) return

    try {
      const root = document.documentElement
      const { colors: c } = theme
      root.style.setProperty('--bg',          c.background)
      root.style.setProperty('--surface',     c.surface)
      root.style.setProperty('--border',      c.border)
      root.style.setProperty('--accent',      c.accent)
      root.style.setProperty('--accent-text', c.accentText)
      root.style.setProperty('--text',        c.textPrimary)
      root.style.setProperty('--text-muted',  c.textMuted)
      root.style.setProperty('--cell-empty',  c.cellEmpty)
      root.style.setProperty('--cell-ship',   c.cellShip)
      root.style.setProperty('--cell-hit',    c.cellHit)
      root.style.setProperty('--cell-miss',   c.cellMiss)
      root.style.setProperty('--cell-sunk',   c.cellSunk)
    } catch {
      // No debe romper el flujo del juego si falla aplicar estilos
    }

    set({ activeID: id })
    safeSetTheme(id)
  },
}))
