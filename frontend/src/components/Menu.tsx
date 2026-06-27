import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import type { Difficulty, DiscoveredGame } from '../types'

type Tab = 'solo' | 'lan' | 'online'

export function Menu() {
  const [tab,       setTab]       = useState<Tab>('solo')
  const [diff,      setDiff]      = useState<Difficulty>(0)
  const [joinIP,    setJoinIP]    = useState('')
  const [joinCode,  setJoinCode]  = useState('')

  const {
    startSolo, hostLan, joinLan, hostOnline, joinOnline,
    startScan, stopScan, discoveredGames,
    loading, error, clearError,
  } = useGameStore()

  // Iniciar/detener scan al entrar/salir del tab LAN
  useEffect(() => {
    if (tab === 'lan') startScan()
    else               stopScan()
    return () => stopScan()
  }, [tab])

  const changeTab = (t: Tab) => { setTab(t); clearError() }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 relative">

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
          { id: 'solo',   label: '🤖  vs CPU'   },
          { id: 'lan',    label: '🏠  LAN'       },
          { id: 'online', label: '🌍  En Línea'  },
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
          <div className="flex gap-3">
            {([
              { v: 0, label: 'Fácil',  desc: 'Aleatoria',             color: 'green'  },
              { v: 1, label: 'Medio',  desc: 'Modo cacería',          color: 'yellow' },
              { v: 2, label: 'Difícil', desc: 'Algoritmo de Paridad', color: 'red'    },
            ] as const).map(({ v, label, desc, color }) => (
              <button key={v} onClick={() => setDiff(v as Difficulty)}
                className={`w-36 p-4 rounded-xl border-2 text-left transition-all ${
                  diff === v
                    ? color === 'green'  ? 'border-green-500  bg-green-950/50  text-green-300'
                    : color === 'yellow' ? 'border-yellow-500 bg-yellow-950/50 text-yellow-300'
                    :                     'border-red-500    bg-red-950/50    text-red-300'
                    : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500'
                }`}>
                <div className="font-bold text-sm mb-1">{label}</div>
                <div className="text-[10px] opacity-70">{desc}</div>
              </button>
            ))}
          </div>
          <button onClick={() => startSolo(diff)} disabled={loading}
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
        <div className="w-80 flex flex-col gap-4">
          <button onClick={hostLan} disabled={loading}
            className="w-full py-4 rounded-xl bg-blue-700 hover:bg-blue-600
                       disabled:bg-slate-800 disabled:text-slate-600
                       text-white font-bold tracking-wider transition-colors">
            {loading ? '···' : '🖥  Crear partida'}
          </button>

          <Divider />

          {/* Partidas descubiertas */}
          <DiscoveryList games={discoveredGames} onJoin={(ip) => joinLan(ip)} />

          {/* Unirse por IP */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">
              O escribe la IP manualmente
            </p>
            <div className="flex gap-2">
              <input value={joinIP} onChange={e => setJoinIP(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && joinIP && joinLan(joinIP.trim())}
                placeholder="192.168.1.X"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5
                           text-sm font-mono text-slate-100 placeholder-slate-700
                           focus:outline-none focus:border-cyan-700 transition-colors" />
              <button onClick={() => joinLan(joinIP.trim())}
                disabled={loading || !joinIP.trim()}
                className="px-4 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-600
                           disabled:bg-slate-800 disabled:text-slate-600
                           text-white font-bold text-sm transition-colors">
                Unirse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Online ── */}
      {tab === 'online' && (
        <div className="flex flex-col items-center gap-5 w-80">
          <div className="w-full p-5 rounded-xl border border-slate-700 bg-slate-900/40 flex flex-col gap-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Crear partida</p>
            <p className="text-slate-400 text-xs leading-relaxed">
              Abre el puerto automáticamente (UPnP) y genera un código de 7 caracteres para compartir.
            </p>
            <button onClick={hostOnline} disabled={loading}
              className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500
                         disabled:bg-slate-800 disabled:text-slate-600
                         text-white font-bold tracking-wider transition-colors">
              {loading ? '···' : '🌐  Crear partida en línea'}
            </button>
          </div>

          <Divider />

          <div className="w-full flex flex-col gap-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
              Unirse con código
            </p>
            <input value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,7))}
              onKeyDown={e => e.key === 'Enter' && joinCode.length === 7 && joinOnline(joinCode)}
              placeholder="XXXXXXX"
              maxLength={7}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3
                         text-xl font-mono font-bold tracking-[0.3em] text-center text-slate-100
                         placeholder-slate-700 focus:outline-none focus:border-indigo-600 transition-colors" />
            <p className="text-[10px] text-slate-700 text-center">{joinCode.length}/7</p>
            <button onClick={() => joinOnline(joinCode)}
              disabled={loading || joinCode.length !== 7}
              className="w-full py-3 rounded-xl bg-teal-700 hover:bg-teal-600
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
                     text-red-400 text-sm cursor-pointer max-w-xs text-center">
          ⚠ {error}
        </div>
      )}

      <p className="text-slate-800 text-[10px] tracking-widest uppercase absolute bottom-5">
        NetNaval · Fase 2 · Wails v2 + Go + React
      </p>
    </div>
  )
}

// ── Sub-componentes ───────────────────────────────────────────────────

function Divider() {
  return (
    <div className="flex items-center gap-3 w-full text-slate-700">
      <div className="flex-1 h-px bg-slate-800" />
      <span className="text-xs uppercase tracking-widest">o</span>
      <div className="flex-1 h-px bg-slate-800" />
    </div>
  )
}

function DiscoveryList({
  games, onJoin,
}: { games: DiscoveredGame[]; onJoin: (ip: string) => void }) {
  if (games.length === 0) {
    return (
      <div className="flex items-center gap-3 py-3 px-4 rounded-xl border border-slate-800 bg-slate-900/40">
        <div className="w-2 h-2 rounded-full bg-slate-600 animate-pulse shrink-0" />
        <p className="text-slate-600 text-sm">Buscando partidas en tu red…</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
        Partidas encontradas ({games.length})
      </p>
      {games.map(g => (
        <button key={g.ip} onClick={() => onJoin(g.ip)}
          className="flex items-center justify-between px-4 py-3 rounded-xl
                     border border-cyan-800/60 bg-cyan-950/30 hover:bg-cyan-950/60
                     text-left transition-colors group">
          <div>
            <p className="text-sm font-semibold text-cyan-300">{g.name}</p>
            <p className="text-[10px] text-slate-500 font-mono">{g.ip}:{g.port}</p>
          </div>
          <span className="text-cyan-500 text-sm font-bold group-hover:translate-x-0.5 transition-transform">
            Unirse →
          </span>
        </button>
      ))}
    </div>
  )
}
