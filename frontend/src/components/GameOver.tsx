import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useChatStore } from '../store/chatStore'
import { Analytics } from './Analytics'

type Tab = 'result' | 'analytics'

export function GameOver() {
  const { session, mode, reset, loadAnalytics } = useGameStore()
  const clearChat = useChatStore(s => s.clear)
  const [tab, setTab] = useState<Tab>('result')

  useEffect(() => { loadAnalytics() }, [])

  if (!session) return null

  const won   = session.winner === 'player'
  const isNet = mode?.startsWith('lan') || mode?.startsWith('online')
  const rival = isNet ? 'oponente' : 'CPU'

  const enemyCells = session.cpuBoard.cells.flat()
  const shots    = enemyCells.filter(c => c === 'hit' || c === 'miss' || c === 'sunk').length
  const hits     = enemyCells.filter(c => c === 'hit' || c === 'sunk').length
  const accuracy = shots > 0 ? Math.round((hits / shots) * 100) : 0

  return (
    <div className="flex flex-col items-center h-full pt-6 gap-5 overflow-hidden">

      {/* ── Cabecera ── */}
      <div className="text-center shrink-0">
        <div className="text-5xl mb-2">{won ? '🏆' : '💀'}</div>
        <h2 className={`text-4xl font-black tracking-[0.2em] mb-1.5 ${
          won ? 'text-cyan-400' : 'text-red-500'
        }`}>
          {won ? 'VICTORIA' : 'DERROTA'}
        </h2>
        <p className="text-slate-400 text-sm">
          {won ? `Hundiste toda la flota del ${rival}.`
                : `El ${rival} hundió toda tu flota.`}
        </p>
        {session.captain.id !== 0 && (
          <p className="text-slate-600 text-xs mt-1">
            {session.captain.emoji} {session.captain.name}
          </p>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex rounded-xl border border-slate-800 overflow-hidden shrink-0">
        {(['result', 'analytics'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-8 py-2.5 font-bold text-sm tracking-wider transition-colors ${
              tab === t
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-500 hover:text-slate-300'
            }`}>
            {t === 'result' ? '📊 Resumen' : '🗺 Analítica'}
          </button>
        ))}
      </div>

      {/* ── Contenido scrollable ── */}
      <div className="w-full flex-1 overflow-y-auto min-h-0 px-6 pb-6">

        {tab === 'result' && (
          <div className="flex flex-col items-center gap-8 pt-2">
            {/* Stats */}
            <div className="flex gap-10 text-center">
              {[
                { label: 'Disparos',  value: shots       },
                { label: 'Impactos',  value: hits        },
                { label: 'Precisión', value: `${accuracy}%` },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <span className="text-3xl font-black text-slate-100">{value}</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-slate-600">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Tableros finales (miniatura) */}
            <div className="flex gap-8 items-start">
              <div className="text-center">
                <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-1.5">
                  Tu flota
                </p>
                <MiniBoard cells={session.playerBoard.cells} />
              </div>
              <div className="text-center">
                <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-1.5">
                  Flota enemiga (revelada)
                </p>
                <MiniBoard cells={session.cpuBoard.cells} />
              </div>
            </div>

            <button
              onClick={() => { clearChat(); reset() }}
              className="px-16 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400
                         text-slate-950 font-black text-lg tracking-[0.15em]
                         transition-colors shadow-lg shadow-cyan-900/40">
              JUGAR DE NUEVO
            </button>
          </div>
        )}

        {tab === 'analytics' && (
          <div className="pt-2 flex flex-col gap-6">
            <Analytics />
            <button
              onClick={() => { clearChat(); reset() }}
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400
                         text-slate-950 font-black tracking-wider transition-colors">
              JUGAR DE NUEVO
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Tablero en miniatura para el resumen final
const CELL_COLOR: Record<string, string> = {
  empty: '#1e293b', ship: '#1d4ed8', hit: '#f97316',
  miss:  '#334155', sunk: '#991b1b',
}

function MiniBoard({ cells }: { cells: string[][] }) {
  return (
    <div className="inline-block">
      {cells.map((row, y) => (
        <div key={y} className="flex">
          {row.map((cell, x) => (
            <div
              key={x}
              className="w-4 h-4 m-px rounded-sm"
              style={{ backgroundColor: CELL_COLOR[cell] ?? '#1e293b' }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
