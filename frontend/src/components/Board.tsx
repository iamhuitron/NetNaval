import type { CellState } from '../types'

const COLS = ['A','B','C','D','E','F','G','H','I','J']

export interface BoardProps {
  cells:         CellState[][]
  mode:          'own' | 'enemy' | 'placement'
  onCellClick?:  (x: number, y: number) => void
  onCellHover?:  (x: number, y: number) => void
  onBoardLeave?: () => void
  previewCells?: Set<string>   // claves 'x,y' de celdas en preview
  previewValid?: boolean
  disabled?:     boolean
}

// ── Colores por estado de celda ──────────────────────────────────────

function cellBg(
  state: CellState,
  mode: BoardProps['mode'],
  key: string,
  preview: Set<string> | undefined,
  previewValid: boolean | undefined,
  disabled: boolean | undefined,
): string {
  // 1. Preview de colocación
  if (preview?.has(key)) {
    return previewValid
      ? 'bg-cyan-600/70 border-cyan-400 cursor-pointer'
      : 'bg-red-900/60 border-red-600 cursor-not-allowed'
  }

  // 2. Fog of war: ocultar barcos del enemigo
  const effective: CellState =
    mode === 'enemy' && state === 'ship' ? 'empty' : state

  const canFire = mode === 'enemy' && effective === 'empty' && !disabled

  switch (effective) {
    case 'ship':  return 'bg-blue-800 border-blue-600'
    case 'hit':   return 'bg-orange-500 border-orange-400'
    case 'miss':  return 'bg-slate-700/60 border-slate-600/50'
    case 'sunk':  return 'bg-red-800 border-red-600'
    default:      return canFire
      ? 'bg-slate-800/80 border-slate-700/50 hover:bg-cyan-950 hover:border-cyan-800 cursor-crosshair'
      : 'bg-slate-800/80 border-slate-700/50'
  }
}

function cellIcon(state: CellState): { char: string; cls: string } | null {
  if (state === 'hit')  return { char: '✕', cls: 'text-white text-[11px]' }
  if (state === 'sunk') return { char: '✕', cls: 'text-white text-[11px]' }
  if (state === 'miss') return { char: '·', cls: 'text-slate-500 text-base leading-none' }
  return null
}

// ── Componente ────────────────────────────────────────────────────────

export function Board({
  cells, mode, onCellClick, onCellHover, onBoardLeave,
  previewCells, previewValid, disabled,
}: BoardProps) {
  const size = cells.length

  return (
    <div onMouseLeave={onBoardLeave} className="inline-block select-none">

      {/* Letras de columna */}
      <div className="flex pl-7 mb-0.5">
        {COLS.slice(0, size).map((col) => (
          <div key={col} className="w-8 text-center text-[10px] text-slate-600 font-mono">{col}</div>
        ))}
      </div>

      {/* Filas */}
      {cells.map((row, y) => (
        <div key={y} className="flex items-center">

          {/* Número de fila */}
          <div className="w-7 text-right pr-1.5 text-[10px] text-slate-600 font-mono">
            {y + 1}
          </div>

          {/* Celdas */}
          {row.map((state, x) => {
            const key       = `${x},${y}`
            const fired     = mode === 'enemy' && (state === 'hit' || state === 'miss' || state === 'sunk')
            const isDisabled = disabled || mode === 'own' || fired
            const bg        = cellBg(state, mode, key, previewCells, previewValid, disabled)
            const icon      = cellIcon(state)

            return (
              <button
                key={x}
                disabled={isDisabled}
                onClick={() => onCellClick?.(x, y)}
                onMouseEnter={() => onCellHover?.(x, y)}
                className={`
                  w-8 h-8 mx-px my-px border rounded-sm
                  flex items-center justify-center
                  transition-colors duration-100 disabled:cursor-default
                  ${bg}
                `}
              >
                {icon && <span className={icon.cls}>{icon.char}</span>}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
