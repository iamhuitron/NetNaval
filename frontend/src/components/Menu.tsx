import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import type { Difficulty } from '../types'

const DIFFICULTIES: { value: Difficulty; label: string; desc: string; color: 'green' | 'yellow' }[] = [
  { value: 0, label: 'Fácil', desc: 'Disparos 100% aleatorios',     color: 'green'  },
  { value: 1, label: 'Medio', desc: 'Modo cacería tras acertar',    color: 'yellow' },
]

const STYLES = {
  green:  { on: 'border-green-500  bg-green-950/50  text-green-300',  off: 'border-slate-700 bg-slate-900 text-slate-400 hover:border-green-800' },
  yellow: { on: 'border-yellow-500 bg-yellow-950/50 text-yellow-300', off: 'border-slate-700 bg-slate-900 text-slate-400 hover:border-yellow-800' },
}

export function Menu() {
  const [difficulty, setDifficulty] = useState<Difficulty>(0)
  const { newGame, loading } = useGameStore()

  return (
    <div className="flex flex-col items-center justify-center h-full gap-12">

      <div className="text-center">
        <h1 className="text-7xl font-black tracking-[0.25em] text-slate-100 mb-3">NETNAVAL</h1>
        <p className="text-slate-500 tracking-[0.3em] text-xs uppercase">Batalla Naval · Tiempo Real</p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <p className="text-[10px] uppercase tracking-[0.25em] text-slate-600">Dificultad de la CPU</p>
        <div className="flex gap-4">
          {DIFFICULTIES.map(({ value, label, desc, color }) => {
            const s = STYLES[color]
            return (
              <button
                key={value}
                onClick={() => setDifficulty(value)}
                className={`w-48 p-5 rounded-xl border-2 text-left transition-all duration-200 ${difficulty === value ? s.on : s.off}`}
              >
                <div className="font-bold text-base mb-1">{label}</div>
                <div className="text-xs opacity-70">{desc}</div>
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={() => newGame(difficulty)}
        disabled={loading}
        className="px-20 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600
                   text-slate-950 font-black text-xl tracking-[0.2em] transition-colors duration-200 shadow-lg shadow-cyan-900/40"
      >
        {loading ? '···' : 'JUGAR'}
      </button>

      <p className="text-slate-800 text-[10px] tracking-widest uppercase absolute bottom-6">
        NetNaval · Fase 1 MVP · Wails v2 + Go + React
      </p>
    </div>
  )
}
