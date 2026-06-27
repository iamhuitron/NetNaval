import { useGameStore } from '../store/gameStore'
import { useChatStore } from '../store/chatStore'

export function GameOver() {
  const { session, mode, reset } = useGameStore()
  const clearChat                = useChatStore(s => s.clear)

  if (!session) return null

  const won    = session.winner === 'player'
  const isNet  = mode?.startsWith('lan') || mode?.startsWith('online')
  const rival  = isNet ? 'oponente' : 'CPU'

  // Estadísticas del jugador sobre el tablero del enemigo
  const enemyCells = session.cpuBoard.cells.flat()
  const shots      = enemyCells.filter(c => c === 'hit' || c === 'miss' || c === 'sunk').length
  const hits       = enemyCells.filter(c => c === 'hit' || c === 'sunk').length
  const accuracy   = shots > 0 ? Math.round((hits / shots) * 100) : 0

  return (
    <div className="flex flex-col items-center justify-center h-full gap-10">

      {/* Resultado */}
      <div className="text-center">
        <div className="text-8xl mb-5">{won ? '🏆' : '💀'}</div>
        <h2 className={`text-6xl font-black tracking-[0.2em] mb-4 ${
          won ? 'text-cyan-400' : 'text-red-500'
        }`}>
          {won ? 'VICTORIA' : 'DERROTA'}
        </h2>
        <p className="text-slate-400 tracking-wider text-sm">
          {won
            ? `Hundiste toda la flota del ${rival}.`
            : `El ${rival} hundió toda tu flota.`}
        </p>
      </div>

      {/* Stats */}
      <div className="flex gap-10 text-center">
        {[
          { label: 'Disparos',  value: shots       },
          { label: 'Impactos',  value: hits        },
          { label: 'Precisión', value: `${accuracy}%` },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <span className="text-3xl font-black text-slate-100">{value}</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-600">{label}</span>
          </div>
        ))}
      </div>

      {/* Acción */}
      <button
        onClick={() => { clearChat(); reset() }}
        className="px-16 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400
                   text-slate-950 font-black text-lg tracking-[0.15em]
                   transition-colors shadow-lg shadow-cyan-900/40">
        JUGAR DE NUEVO
      </button>
    </div>
  )
}
