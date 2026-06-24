import { useState, useMemo, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import { Board } from './Board'
import type { ShipInfo } from '../types'

export function Placement() {
  const { session, placeShip, removeShip, autoPlace, startBattle, loading, error, clearError } = useGameStore()
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [horizontal, setHorizontal]   = useState(true)
  const [hovered, setHovered]         = useState<{ x: number; y: number } | null>(null)

  if (!session) return null

  const { fleet, playerBoard } = session
  const allPlaced = fleet.every((s) => s.placed)

  // Si el barco seleccionado ya fue colocado, no hay selección activa
  const activeIdx =
    selectedIdx !== null && !fleet[selectedIdx]?.placed ? selectedIdx : null

  // ── Preview de colocación ─────────────────────────────────────────

  const previewCells = useMemo<Set<string>>(() => {
    if (activeIdx === null || !hovered) return new Set()
    const ship = fleet[activeIdx]
    const cells = new Set<string>()
    for (let i = 0; i < ship.size; i++) {
      const cx = horizontal ? hovered.x + i : hovered.x
      const cy = horizontal ? hovered.y     : hovered.y + i
      cells.add(`${cx},${cy}`)
    }
    return cells
  }, [activeIdx, hovered, horizontal, fleet])

  const previewValid = useMemo<boolean>(() => {
    if (previewCells.size === 0) return false
    const sz = playerBoard.size
    for (const key of previewCells) {
      const [x, y] = key.split(',').map(Number)
      if (x < 0 || x >= sz || y < 0 || y >= sz) return false
      if (playerBoard.cells[y]?.[x] === 'ship')  return false
    }
    return true
  }, [previewCells, playerBoard])

  // ── Handlers ──────────────────────────────────────────────────────

  const handleCellClick = useCallback(async (x: number, y: number) => {
    if (activeIdx === null || !previewValid) return
    await placeShip(activeIdx, x, y, horizontal)
    // Avanzar automáticamente al siguiente barco sin colocar
    const updated = useGameStore.getState().session?.fleet ?? []
    const next    = updated.findIndex((s) => !s.placed)
    setSelectedIdx(next >= 0 ? next : null)
  }, [activeIdx, previewValid, placeShip, horizontal])

  const handleShipClick = (ship: ShipInfo) => {
    clearError()
    if (ship.placed) {
      // Retirar el barco para reposicionarlo
      removeShip(ship.index).then(() => setSelectedIdx(ship.index))
    } else {
      setSelectedIdx(ship.index === selectedIdx ? null : ship.index)
    }
  }

  const handleAutoPlace = () => { clearError(); setSelectedIdx(null); autoPlace() }

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-slate-800/70">
        <div>
          <h2 className="font-bold text-lg tracking-[0.15em] text-slate-100">DESPLIEGUE DE FLOTA</h2>
          <p className="text-slate-500 text-xs mt-0.5">Coloca tus barcos · Click en la lista para retirar</p>
        </div>
        <div className="flex gap-3 items-center">
          <button
            onClick={handleAutoPlace}
            className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm
                       hover:border-slate-500 hover:text-slate-100 transition-colors"
          >
            ↺ Auto-colocar
          </button>
          <button
            onClick={() => setHorizontal((h) => !h)}
            className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm
                       hover:border-slate-500 hover:text-slate-100 transition-colors w-36 text-center"
          >
            {horizontal ? '→ Horizontal' : '↓ Vertical'}
          </button>
          <button
            onClick={startBattle}
            disabled={!allPlaced || loading}
            className="px-8 py-2 rounded-lg font-bold text-sm tracking-wider transition-colors
                       bg-cyan-500 hover:bg-cyan-400 text-slate-950
                       disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed"
          >
            {loading ? '···' : '⚓ ZARPAR'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Fleet list */}
        <div className="w-56 border-r border-slate-800/70 p-4 flex flex-col gap-2 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600 mb-1">Tu flota</p>

          {fleet.map((ship) => {
            const isActive = activeIdx === ship.index
            return (
              <button
                key={ship.index}
                onClick={() => handleShipClick(ship)}
                className={`w-full text-left p-3 rounded-xl border transition-all duration-150 ${
                  ship.placed
                    ? 'border-slate-700/40 bg-slate-900/30 text-slate-500 hover:border-red-900'
                    : isActive
                    ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                    : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold">{ship.name}</span>
                  {ship.placed
                    ? <span className="text-[9px] text-green-500 font-bold">✓</span>
                    : isActive
                    ? <span className="text-[9px] text-cyan-400">activo</span>
                    : null}
                </div>
                {/* Visualización del tamaño */}
                <div className="flex gap-0.5">
                  {Array.from({ length: ship.size }, (_, i) => (
                    <div
                      key={i}
                      className={`h-2.5 w-2.5 rounded-sm ${
                        ship.placed ? 'bg-green-800' : isActive ? 'bg-cyan-700' : 'bg-blue-900'
                      }`}
                    />
                  ))}
                </div>
                {ship.placed && (
                  <p className="text-[9px] text-slate-700 mt-1.5">Click para retirar</p>
                )}
              </button>
            )
          })}

          {allPlaced && (
            <div className="mt-2 p-3 rounded-xl border border-green-800/60 bg-green-950/30 text-green-400 text-xs text-center">
              ✓ Flota lista
            </div>
          )}
        </div>

        {/* Board */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          {activeIdx !== null ? (
            <p className="text-xs text-cyan-400 tracking-wider">
              Colocando: <span className="font-bold">{fleet[activeIdx]?.name}</span>
              {' '}({fleet[activeIdx]?.size} casillas · {horizontal ? 'horizontal' : 'vertical'})
            </p>
          ) : (
            <p className="text-xs text-slate-600 tracking-wider">
              {allPlaced ? 'Haz click en un barco para reposicionarlo' : 'Selecciona un barco de la lista'}
            </p>
          )}

          <Board
            cells={playerBoard.cells}
            mode="placement"
            onCellClick={handleCellClick}
            onCellHover={(x, y) => setHovered({ x, y })}
            onBoardLeave={() => setHovered(null)}
            previewCells={previewCells}
            previewValid={previewValid}
            disabled={activeIdx === null}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          onClick={clearError}
          className="px-6 py-2.5 bg-red-950/80 border-t border-red-900 text-red-400 text-sm cursor-pointer"
        >
          ⚠ {error}
        </div>
      )}
    </div>
  )
}
