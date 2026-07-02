import { useEffect } from 'react'
import { useThemeStore } from '../store/themeStore'

export function ThemePicker() {
  const { themes, activeID, load, apply } = useThemeStore()

  useEffect(() => { load() }, [])

  if (themes.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">Tema visual</p>
      <div className="flex gap-2 flex-wrap">
        {themes.map(t => (
          <button
            key={t.id}
            onClick={() => apply(t.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs
                        font-medium transition-all ${
              activeID === t.id
                ? 'border-cyan-500 bg-cyan-950/50 text-cyan-300'
                : 'border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            {/* Swatches de color */}
            <div className="flex gap-0.5">
              {[t.colors.background, t.colors.accent, t.colors.cellHit].map((col, i) => (
                <div key={i}
                  className="w-3 h-3 rounded-sm border border-white/10"
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
            {t.name}
          </button>
        ))}
      </div>
    </div>
  )
}
