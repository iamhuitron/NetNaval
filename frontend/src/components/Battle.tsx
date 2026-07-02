import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { Board } from './Board'
import { Chat } from './Chat'
import { AbilityPanel } from './AbilityPanel'


type AbilityMode = 'radar' | 'line' | null

export function Battle() {
  const { session, fire, useAbility, loading, mode } = useGameStore()
  const [abilityMode, setAbilityMode] = useState<AbilityMode>(null)

  // Escape cancela el modo de habilidad activo, sin gastar el uso
  useEffect(() => {
    if (!abilityMode) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbilityMode(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [abilityMode])

  if (!session) return null

  const { playerBoard, cpuBoard, currentTurn, lastPlayerShot, lastCPUShot,
          captain, smokeScreen } = session

  const isLAN    = (mode?.startsWith('lan') || mode?.startsWith('online')) ?? false
  const isMyTurn = currentTurn === 'player' && !loading

  // Manejar click sobre tablero enemigo
  const handleEnemyClick = async (x: number, y: number) => {
    if (!isMyTurn) return
    if (abilityMode === 'radar') {
      await useAbility(x, y)
      setAbilityMode(null)
    } else if (abilityMode === 'line') {
      await useAbility(x, y)   // y = la fila seleccionada
      setAbilityMode(null)
    } else {
      await fire(x, y)
    }
  }

  const turnLabel = abilityMode
    ? abilityMode === 'radar'
      ? '📡 Click para centrar el Radar (Esc cancela)'
      : '🚀 Click en cualquier celda de la fila objetivo (Esc cancela)'
    : isMyTurn
    ? 'TU TURNO — selecciona un objetivo'
    : loading ? 'Procesando…'
    : isLAN ? 'Turno del oponente'
    : 'Turno de la CPU'

  const shotSummary = (
    hit: boolean | undefined, sunk: boolean | undefined,
    name: string | undefined, who: string
  ) => {
    if (hit === undefined) return null
    if (sunk) return `${who}: Hundido (${name})`
    if (hit)  return `${who}: Impacto`
    return `${who}: Agua`
  }

  return (
    <div className="flex flex-col h-full">

      {/* ── Barra de turno ── */}
      <div className={`flex items-center justify-between px-8 py-3 border-b border-slate-800/70
                       transition-colors duration-300 ${
        abilityMode ? 'bg-cyan-950/40' : isMyTurn ? 'bg-cyan-950/20' : 'bg-slate-950'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 transition-colors ${
            abilityMode ? 'bg-cyan-300 animate-ping'
            : isMyTurn  ? 'bg-cyan-400 animate-pulse'
            : 'bg-slate-700'
          }`} />
          <span className="font-bold tracking-[0.12em] text-sm">{turnLabel}</span>
        </div>

        <div className="flex items-center gap-5">
          {/* Cortina de humo activa */}
          {smokeScreen > 0 && (
            <span className="text-[11px] text-indigo-400 bg-indigo-950/60 px-2 py-1
                             rounded-md border border-indigo-800/60 font-mono">
              💨 Humo: {smokeScreen}
            </span>
          )}
          {/* Resumen disparos */}
          <div className="flex gap-5 text-[11px]">
            {lastPlayerShot && (
              <span className={lastPlayerShot.hit ? 'text-orange-400' : 'text-slate-600'}>
                {shotSummary(lastPlayerShot.hit, lastPlayerShot.sunk, lastPlayerShot.shipName, 'Tú')}
              </span>
            )}
            {lastCPUShot && (
              <span className={lastCPUShot.hit ? 'text-red-400' : 'text-slate-600'}>
                {shotSummary(lastCPUShot.hit, lastCPUShot.sunk, lastCPUShot.shipName,
                  isLAN ? 'Rival' : 'CPU')}
              </span>
            )}
          </div>
          {/* Badge modo */}
          {isLAN && (
            <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-md
                             border text-blue-400 bg-blue-950/60 border-blue-800/60">
              {mode?.startsWith('online') ? '🌍 EN LÍNEA' : '🏠 LAN'}
            </span>
          )}
        </div>
      </div>

      {/* ── Cuerpo ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Tablero propio */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
          <p className="text-[9px] uppercase tracking-[0.25em] text-slate-600 font-mono">
            Tu flota
          </p>
          <Board cells={playerBoard.cells} mode="own" />
          {/* Capitán */}
          {captain.id !== 0 && (
            <div className="flex items-center gap-1.5 text-[10px] text-slate-600 mt-1">
              <span>{captain.emoji}</span>
              <span>{captain.name}</span>
            </div>
          )}
        </div>

        <div className="w-px bg-slate-800/70 self-stretch my-4" />

        {/* Tablero enemigo */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
          <p className="text-[9px] uppercase tracking-[0.25em] text-slate-600 font-mono">
            {isLAN ? 'Flota del rival' : 'Flota de la CPU'}
          </p>
          <Board
            cells={cpuBoard.cells}
            mode="enemy"
            onCellClick={handleEnemyClick}
            disabled={!isMyTurn && !abilityMode}
          />
          {abilityMode && (
            <button onClick={() => setAbilityMode(null)}
              className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors">
              ✕ Cancelar habilidad
            </button>
          )}
        </div>

        {/* Panel lateral: habilidad + chat */}
        <div className="flex">
          <div className="w-px bg-slate-800/70 self-stretch my-4" />
          <div className="w-60 flex flex-col">
            {/* Habilidad del capitán (solo modo solo) */}
            {!isLAN && captain.id !== 0 && (
              <div className="p-3 border-b border-slate-800/70">
                <AbilityPanel
                  captain={captain}
                  onActivate={(m) => setAbilityMode(m)}
                  activating={abilityMode !== null}
                />
              </div>
            )}
            <div className="flex-1 min-h-0">
              <Chat />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
