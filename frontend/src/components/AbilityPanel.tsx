
import { useGameStore } from '../store/gameStore'
import type { CaptainProfile } from '../types'

interface Props {
  captain: CaptainProfile
  onActivate: (mode: 'radar' | 'line') => void
  activating: boolean
}

export function AbilityPanel({ captain, onActivate, activating }: Props) {
  const { lastAbility } = useGameStore()
  const ab = captain.ability

  if (captain.id === 0 || !ab) return null

  const depleted  = ab.usesLeft <= 0
  const canUse    = !depleted && !activating

  const handleClick = () => {
    if (!canUse) return
    if (captain.id === 1) onActivate('radar')
    else if (captain.id === 2) onActivate('line')
    else {
      // Voss: cortina de humo, no necesita coordenada
      useGameStore.getState().useAbility(0, 0)
    }
  }

  return (
    <div className={`p-3 rounded-xl border transition-all ${
      depleted
        ? 'border-slate-800 bg-slate-900/30 opacity-50'
        : activating
        ? 'border-cyan-400 bg-cyan-950/50 animate-pulse'
        : 'border-slate-700 bg-slate-900/60'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{ab.icon}</span>
          <span className="text-xs font-bold text-slate-200">{ab.name}</span>
        </div>
        {/* Usos restantes */}
        <div className="flex gap-1">
          {Array.from({ length: ab.maxUses }, (_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${
              i < ab.usesLeft ? 'bg-cyan-400' : 'bg-slate-700'
            }`} />
          ))}
        </div>
      </div>

      <p className="text-[10px] text-slate-500 mb-2">{ab.description}</p>

      <button
        onClick={handleClick}
        disabled={!canUse}
        className={`w-full py-2 rounded-lg text-xs font-bold tracking-wider transition-colors ${
          depleted
            ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
            : activating
            ? 'bg-cyan-800 text-cyan-200 cursor-crosshair'
            : 'bg-cyan-700 hover:bg-cyan-600 text-white cursor-pointer'
        }`}
      >
        {depleted ? 'Agotada' : activating ? 'Selecciona objetivo…' : 'Usar habilidad'}
      </button>

      {/* Feedback del último uso */}
      {lastAbility && !depleted && (
        <p className="text-[10px] text-cyan-400 mt-1.5 text-center">
          {lastAbility.abilityName}: {
            lastAbility.radarHits?.length
              ? `${lastAbility.radarHits.length} barco(s) detectado(s)`
              : lastAbility.lineResults?.length
              ? `${lastAbility.lineResults.filter(r => r.hit).length} impactos en la fila`
              : lastAbility.turnsLeft
              ? `Cortina activa (${lastAbility.turnsLeft} turnos)`
              : 'Activada'
          }
        </p>
      )}
    </div>
  )
}
