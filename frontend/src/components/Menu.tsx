import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import type { Difficulty } from '../types'

export function Menu() {
  const [difficulty, setDiff] = useState<Difficulty>(0)
  const [joinIP, setJoinIP]   = useState('')
  const [tab, setTab]         = useState<'solo' | 'lan'>('solo')
  const { startSolo, hostLan, joinLan, loading, error, clearError } = useGameStore()

  return (
    <div className="flex flex-col items-center justify-center h-full gap-10">

      {/* Título */}
      <div className="text-center">
        <h1 className="text-7xl font-black tracking-[0.25em] text-slate-100 mb-2">NETNAVAL</h1>
        <p className="text-slate-600 tracking-[0.3em] text-xs uppercase">Batalla Naval · Tiempo Real</p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl border border-slate-800 overflow-hidden">
        {(['solo', 'lan'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); clearError() }}
            className={`px-10 py-3 font-bold text-sm tracking-wider transition-colors ${
              tab === t ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:text-slate-300'
            }`}>
            {t === 'solo' ? '🤖  vs CPU' : '🌐  LAN'}
          </button>
        ))}
      </div>

      {/* Solo */}
      {tab === 'solo' && (
        <div className="flex flex-col items-center gap-6">
          <p className="text-[10px] uppercase tracking-[0.25em] text-slate-600">Dificultad de la CPU</p>
          <div className="flex gap-4">
            {([
              { v: 0, label: 'Fácil',  desc: 'Disparos aleatorios',   cls: 'green'  },
              { v: 1, label: 'Medio',  desc: 'Modo cacería',          cls: 'yellow' },
            ] as const).map(({ v, label, desc, cls }) => (
              <button key={v} onClick={() => setDiff(v as Difficulty)}
                className={`w-44 p-4 rounded-xl border-2 text-left transition-all ${
                  difficulty === v
                    ? cls === 'green'
                      ? 'border-green-500 bg-green-950/50 text-green-300'
                      : 'border-yellow-500 bg-yellow-950/50 text-yellow-300'
                    : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500'
                }`}>
                <div className="font-bold mb-1">{label}</div>
                <div className="text-xs opacity-70">{desc}</div>
              </button>
            ))}
          </div>
          <button onClick={() => startSolo(difficulty)} disabled={loading}
            className="px-20 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800
                       disabled:text-slate-600 text-slate-950 font-black text-xl tracking-[0.2em]
                       transition-colors shadow-lg shadow-cyan-900/40">
            {loading ? '···' : 'JUGAR'}
          </button>
        </div>
      )}

      {/* LAN */}
      {tab === 'lan' && (
        <div className="flex flex-col items-center gap-5 w-72">
          <button onClick={hostLan} disabled={loading}
            className="w-full py-4 rounded-xl bg-blue-700 hover:bg-blue-600 disabled:bg-slate-800
                       disabled:text-slate-600 text-white font-bold tracking-wider transition-colors">
            {loading ? '···' : '🖥  Crear partida'}
          </button>

          <div className="flex items-center gap-3 w-full text-slate-700">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs uppercase tracking-widest">o</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          <div className="w-full flex flex-col gap-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">IP del host</p>
            <input value={joinIP} onChange={e => setJoinIP(e.target.value)}
              placeholder="192.168.1.X"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3
                         text-slate-100 placeholder-slate-700 text-sm font-mono
                         focus:outline-none focus:border-cyan-700 transition-colors" />
            <button onClick={() => joinLan(joinIP.trim())}
              disabled={loading || !joinIP.trim()}
              className="w-full py-3 rounded-xl bg-teal-700 hover:bg-teal-600
                         disabled:bg-slate-800 disabled:text-slate-600
                         text-white font-bold tracking-wider transition-colors">
              {loading ? '···' : '📡  Unirse'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div onClick={clearError}
          className="px-5 py-2.5 rounded-lg bg-red-950/80 border border-red-900
                     text-red-400 text-sm cursor-pointer max-w-xs text-center">
          ⚠ {error}
        </div>
      )}

      <p className="text-slate-800 text-[10px] tracking-widest uppercase absolute bottom-5">
        NetNaval · Fase 1 MVP · Wails v2 + Go + React
      </p>
    </div>
  )
}
