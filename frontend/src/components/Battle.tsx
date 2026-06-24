import { useGameStore } from '../store/gameStore'
import { Board } from './Board'
import { Chat } from './Chat'

export function Battle() {
  const { session, playerFire, loading } = useGameStore()
  if (!session) return null

  const { playerBoard, cpuBoard, currentTurn, lastPlayerShot, lastCPUShot } = session
  const isMyTurn = currentTurn === 'player' && !loading

  // ── Texto del indicador de turno ──────────────────────────────────
  const turnLabel = isMyTurn
    ? 'TU TURNO — selecciona un objetivo'
    : loading
    ? 'Procesando…'
    : 'Turno de la CPU'

  // ── Texto del último disparo (jugador / CPU) ──────────────────────
  const shotLabel = (
    hit: boolean | undefined,
    sunk: boolean | undefined,
    name: string | undefined,
    who: 'Tú' | 'CPU'
  ) => {
    if (hit === undefined) return null
    if (sunk)  return `${who}: Hundido (${name})`
    if (hit)   return `${who}: Impacto`
    return `${who}: Agua`
  }

  const playerLabel = lastPlayerShot
    ? shotLabel(lastPlayerShot.hit, lastPlayerShot.sunk, lastPlayerShot.shipName, 'Tú')
    : null
  const cpuLabel = lastCPUShot
    ? shotLabel(lastCPUShot.hit, lastCPUShot.sunk, lastCPUShot.shipName, 'CPU')
    : null

  return (
    <div className="flex flex-col h-full">

      {/* ── Barra de turno ── */}
      <div className={`flex items-center justify-between px-8 py-3 border-b border-slate-800/70
                       transition-colors duration-300 ${isMyTurn ? 'bg-cyan-950/25' : 'bg-slate-950'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            isMyTurn ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'
          }`} />
          <span className="font-bold tracking-[0.12em] text-sm text-slate-100">
            {turnLabel}
          </span>
        </div>

        {/* Resumen últimos disparos */}
        <div className="flex gap-6 text-[11px]">
          {playerLabel && (
            <span className={lastPlayerShot?.hit ? 'text-orange-400' : 'text-slate-500'}>
              {playerLabel}
            </span>
          )}
          {cpuLabel && (
            <span className={lastCPUShot?.hit ? 'text-red-400' : 'text-slate-500'}>
              {cpuLabel}
            </span>
          )}
        </div>
      </div>

      {/* ── Cuerpo principal ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Tablero del jugador */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
          <p className="text-[9px] uppercase tracking-[0.25em] text-slate-600 font-mono">
            Tu flota
          </p>
          <Board cells={playerBoard.cells} mode="own" />
        </div>

        {/* Divisor central */}
        <div className="w-px bg-slate-800/70 self-stretch my-4" />

        {/* Tablero de la CPU */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
          <p className="text-[9px] uppercase tracking-[0.25em] text-slate-600 font-mono">
            Flota enemiga
          </p>
          <Board
            cells={cpuBoard.cells}
            mode="enemy"
            onCellClick={(x, y) => { if (isMyTurn) playerFire(x, y) }}
            disabled={!isMyTurn}
          />
        </div>

        {/* Divisor + panel de chat */}
        <div className="flex">
          <div className="w-px bg-slate-800/70 self-stretch my-4" />
          <div className="w-60">
            <Chat />
          </div>
        </div>
      </div>
    </div>
  )
}
