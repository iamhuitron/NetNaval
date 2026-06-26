import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import type { Difficulty } from '../types'

type Tab = 'solo' | 'lan' | 'online'

export function Menu() {
  const [tab, setTab]         = useState<Tab>('solo')
  const [difficulty, setDiff] = useState<Difficulty>(0)
  const [joinIP, setJoinIP]   = useState('')
  const [joinCode, setJoinCode] = useState('')

  const {
    startSolo, hostLan, joinLan,
    hostOnline, joinOnline,
    loading, error, clearError,
  } = useGameStore()

  const changeTab = (t: Tab) => { setTab(t); clearError() }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-9 relative">

      {/* Título */}
      <div className="text-center">
        <h1 className="text-7xl font-black tracking-[0.25em] text-slate-100 mb-2">NETNAVAL</h1>
        <p className="text-slate-600 tracking-[0.3em] text-xs uppercase">
          Batalla Naval · Tiempo Real
        </p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl border border-slate-800 overflow-hidden">
        {([
          { id: 'solo',   label: '🤖  vs CPU'    },
          { id: 'lan',    label: '🏠  LAN'        },
          { id: 'online', label: '🌍  En Línea'   },
        ] as { id: Tab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => changeTab(t.id)}
            className={`px-8 py-3 font-bold text-sm tracking-wider transition-colors ${
              tab === t.id
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-500 hover:text-slate-300'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── vs CPU ── */}
      {tab === 'solo' && (
        <div className="flex flex-col items-center gap-6">
          <p className="text-[10px] uppercase tracking-[0.25em] text-slate-600">
            Dificultad de la CPU
          </p>
          <div className="flex gap-4">
            {([
              { v: 0, label: 'Fácil',  desc: 'Disparos aleatorios', color: 'green'  },
              { v: 1, label: 'Medio',  desc: 'Modo cacería',        color: 'yellow' },
            ] as const).map(({ v, label, desc, color }) => (
              <button key={v} onClick={() => setDiff(v as Difficulty)}
                className={`w-44 p-4 rounded-xl border-2 text-left transition-all ${
                  difficulty === v
                    ? color === 'green'
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
            className="px-20 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400
                       disabled:bg-slate-800 disabled:text-slate-600
                       text-slate-950 font-black text-xl tracking-[0.2em]
                       transition-colors shadow-lg shadow-cyan-900/40">
            {loading ? '···' : 'JUGAR'}
          </button>
        </div>
      )}

      {/* ── LAN ── */}
      {tab === 'lan' && (
        <div className="flex flex-col items-center gap-5 w-72">
          <button onClick={hostLan} disabled={loading}
            className="w-full py-4 rounded-xl bg-blue-700 hover:bg-blue-600
                       disabled:bg-slate-800 disabled:text-slate-600
                       text-white font-bold tracking-wider transition-colors">
            {loading ? '···' : '🖥  Crear partida'}
          </button>
          <Divider />
          <IpInput
            value={joinIP} onChange={setJoinIP}
            placeholder="192.168.1.X"
            label="IP del host (red local)"
            onSubmit={() => joinLan(joinIP.trim())}
            disabled={loading || !joinIP.trim()}
            submitLabel="📡  Unirse"
          />
        </div>
      )}

      {/* ── Online ── */}
      {tab === 'online' && (
        <div className="flex flex-col items-center gap-5 w-80">

          {/* Crear partida */}
          <div className="w-full p-5 rounded-xl border border-slate-700 bg-slate-900/40 flex flex-col gap-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Crear partida</p>
            <p className="text-slate-400 text-xs leading-relaxed">
              Abre un servidor e intenta abrir el puerto automáticamente via UPnP.
              Se genera un código de 7 caracteres para compartir.
            </p>
            <button onClick={hostOnline} disabled={loading}
              className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500
                         disabled:bg-slate-800 disabled:text-slate-600
                         text-white font-bold tracking-wider transition-colors">
              {loading ? '···' : '🌐  Crear partida en línea'}
            </button>
          </div>

          <Divider />

          {/* Unirse con código */}
          <div className="w-full flex flex-col gap-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
              Unirse con código
            </p>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7))}
              onKeyDown={e => e.key === 'Enter' && joinCode.length === 7 && joinOnline(joinCode)}
              placeholder="XXXXXXX"
              maxLength={7}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3
                         text-slate-100 placeholder-slate-700 text-xl font-mono font-bold
                         tracking-[0.3em] text-center
                         focus:outline-none focus:border-indigo-600 transition-colors"
            />
            <p className="text-[10px] text-slate-700 text-center">
              {joinCode.length}/7 — solo letras y números
            </p>
            <button
              onClick={() => joinOnline(joinCode)}
              disabled={loading || joinCode.length !== 7}
              className="w-full py-3 rounded-lg bg-teal-700 hover:bg-teal-600
                         disabled:bg-slate-800 disabled:text-slate-600
                         text-white font-bold tracking-wider transition-colors">
              {loading ? '···' : '🚀  Unirse'}
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div onClick={clearError}
          className="px-5 py-3 rounded-xl bg-red-950/80 border border-red-900
                     text-red-400 text-sm cursor-pointer max-w-sm text-center">
          ⚠ {error}
        </div>
      )}

      <p className="text-slate-800 text-[10px] tracking-widest uppercase absolute bottom-5">
        NetNaval · Fase 2 · Wails v2 + Go + React
      </p>
    </div>
  )
}

// ── Helpers UI ────────────────────────────────────────────────────────

function Divider() {
  return (
    <div className="flex items-center gap-3 w-full text-slate-700">
      <div className="flex-1 h-px bg-slate-800" />
      <span className="text-xs uppercase tracking-widest">o</span>
      <div className="flex-1 h-px bg-slate-800" />
    </div>
  )
}

function IpInput({
  value, onChange, placeholder, label, onSubmit, disabled, submitLabel,
}: {
  value: string; onChange: (v: string) => void
  placeholder: string; label: string
  onSubmit: () => void; disabled: boolean; submitLabel: string
}) {
  return (
    <div className="w-full flex flex-col gap-2">
      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <input value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && !disabled && onSubmit()}
        placeholder={placeholder}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3
                   text-slate-100 placeholder-slate-700 text-sm font-mono
                   focus:outline-none focus:border-cyan-700 transition-colors" />
      <button onClick={onSubmit} disabled={disabled}
        className="w-full py-3 rounded-xl bg-teal-700 hover:bg-teal-600
                   disabled:bg-slate-800 disabled:text-slate-600
                   text-white font-bold tracking-wider transition-colors">
        {submitLabel}
      </button>
    </div>
  )
}
