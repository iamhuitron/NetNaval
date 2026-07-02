import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import type { CaptainProfile } from '../types'

interface Props {
  onSelect: (id: number) => void
  selected: number
}

export function CaptainSelect({ onSelect, selected }: Props) {
  const { captainRoster, loadCaptains } = useGameStore()

  useEffect(() => { loadCaptains() }, [])

  if (captainRoster.length === 0) return null

  return (
    <div className="flex flex-col gap-3 w-full max-w-md">
      <p className="text-[10px] uppercase tracking-[0.25em] text-slate-600 text-center">
        Elige tu capitán (opcional)
      </p>

      {/* Sin capitán */}
      <button
        onClick={() => onSelect(0)}
        className={`w-full p-3 rounded-xl border text-left transition-all text-sm ${
          selected === 0
            ? 'border-slate-500 bg-slate-800 text-slate-200'
            : 'border-slate-800 text-slate-600 hover:border-slate-700'
        }`}
      >
        Sin capitán — partida estándar
      </button>

      {captainRoster.map((cap: CaptainProfile) => (
        <button
          key={cap.id}
          onClick={() => onSelect(cap.id)}
          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
            selected === cap.id
              ? 'border-cyan-500 bg-cyan-950/40 text-slate-100'
              : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-500'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{cap.emoji}</span>
            <div>
              <p className="font-bold text-sm">{cap.name}</p>
              <p className="text-[10px] opacity-60">{cap.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700/50">
            <span className="text-base">{cap.ability.icon}</span>
            <div>
              <p className="text-xs font-semibold text-cyan-400">{cap.ability.name}</p>
              <p className="text-[10px] text-slate-500">{cap.ability.description}</p>
            </div>
            <span className="ml-auto text-[10px] text-slate-600 shrink-0">
              ×{cap.ability.maxUses}
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}
