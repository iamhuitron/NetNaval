import { useGameStore } from '../store/gameStore'
import { Board } from './Board'
import { Chat } from './Chat'

export function Battle() {
  const { session, fire, loading, mode } = useGameStore()
  if (!session) return null

  const { playerBoard, cpuBoard, currentTurn, lastPlayerShot, lastCPUShot } = session
  const isLAN     = mode?.startsWith('lan') ?? false
  const isMyTurn  = currentTurn === 'player' && !loading

  const turnLabel = isMyTurn
    ? 'TU TURNO — selecciona un objetivo'
    : loading ? 'Procesando…'
    : isLAN ? 'Turno del oponente' : 'Turno de la CPU'

  const shotSummary = (
    hit:  boolean | undefined,
    sunk: boolean | undefined,
    name: string | undefined,
    who:  string
  ) => {
    if (hit === undefined) return null
    if (sunk) return `${who}: Hundido (${name})`
    if (hit)  return `${who}: Impacto`
    return `${who}: Agua`
  }

  const playerLabel = lastPlayerShot
    ? shotSummary(lastPlayerShot.hit, lastPlayerShot.sunk, lastPlayerShot.shipName, 'Tú')
    : null
  const enemyLabel = lastCPUShot
    ? shotSummary(lastCPUShot.hit, lastCPUShot.sunk, lastCPUShot.shipName, isLAN ? 'Rival' : 'CPU')
    : null

  return (
    <div className="flex flex-col h-full">

      {/* ── Barra de turno ── */}
      <div className={`flex items-center justify-between px-8 py-3 border-b border-slate-800/70
                       transition-colors duration-300 ${isMyTurn ? 'bg-cyan-950/25' : 'bg-slate-950'}`}>

        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 transition-colors ${
            isMyTurn ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'
          }`} />
          <span className="font-bold tracking-[0.12em] text-sm">{turnLabel}</span>
        </div>

        <div className="flex items-center gap-6">
          {/* Resumen disparos */}
          <div className="flex gap-5 text-[11px]">
            {playerLabel && (
              <span className={lastPlayerShot?.hit ? 'text-orange-400' : 'text-slate-600'}>
                {playerLabel}
              </span>
            )}
            {enemyLabel && (
              <span className={lastCPUShot?.hit ? 'text-red-400' : 'text-slate-600'}>
                {enemyLabel}
              </span>
            )}
          </div>

          {/* Badge de modo */}
          {isLAN && (
            <span className="text-[9px] uppercase tracking-widest font-bold
                             text-blue-400 bg-blue-950/60 border border-blue-800/60
                             px-2 py-1 rounded-md">
              🌐 LAN
            </span>
          )}
        </div>
      </div>

      {/* ── Cuerpo ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Tablero propio */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
          <p className="text-[9px] uppercase tracking-[0.25em] text-slate-600 font-mono">Tu flota</p>
          <Board cells={playerBoard.cells} mode="own" />
        </div>

        <div className="w-px bg-slate-800/70 self-stretch my-4" />

        {/* Tablero enemigo */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
          <p className="text-[9px] uppercase tracking-[0.25em] text-slate-600 font-mono">
            {isLAN ? 'Flota del rival' : 'Flota enemiga'}
          </p>
          <Board
            cells={cpuBoard.cells}
            mode="enemy"
            onCellClick={(x, y) => { if (isMyTurn) fire(x, y) }}
            disabled={!isMyTurn}
          />
        </div>

        {/* Chat */}
        <div className="flex">
          <div className="w-px bg-slate-800/70 self-stretch my-4" />
          <div className="w-60"><Chat /></div>
        </div>
      </div>
    </div>
  )
}
