import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'

export function Analytics() {
  const { analytics, loadAnalytics } = useGameStore()

  useEffect(() => { loadAnalytics() }, [])

  if (!analytics) return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="text-3xl">📊</div>
      <p className="text-slate-500 text-sm">
        Analítica disponible solo en modo <strong>vs CPU</strong>.
      </p>
      <p className="text-slate-700 text-xs">
        En partidas LAN/Online el historial de disparos no se registra todavía.
      </p>
    </div>
  )

  const a = analytics

  return (
    <div className="flex flex-col gap-6">

      {/* Métricas globales */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Disparos',  value: a.totalShots },
          { label: 'Impactos',  value: a.totalHits },
          { label: 'Precisión', value: `${a.accuracy.toFixed(1)}%` },
          { label: 'Mejor racha', value: a.bestStreak },
          { label: 'Prom. turnos/hundimiento', value: a.avgTurnsPerSink.toFixed(1) },
        ].map(({ label, value }) => (
          <div key={label}
            className="flex flex-col items-center p-3 rounded-xl border border-slate-800 bg-slate-900/50">
            <span className="text-xl font-black text-slate-100">{value}</span>
            <span className="text-[9px] uppercase tracking-wider text-slate-600 text-center mt-0.5">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Mapa de calor */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600 mb-2">
          Mapa de calor — disparos por zona
        </p>
        <HeatMap data={a.heatMap} />
      </div>

      {/* Sesgo por sector */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600 mb-2">
          Sesgo por cuadrante
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: '↖ Superior izq.', value: a.sectorBias.topLeft },
            { label: '↗ Superior der.', value: a.sectorBias.topRight },
            { label: '↙ Inferior izq.', value: a.sectorBias.bottomLeft },
            { label: '↘ Inferior der.', value: a.sectorBias.bottomRight },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">{label}</span>
                <span className="text-slate-400 font-mono">{value.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-cyan-500 transition-all"
                  style={{ width: `${Math.min(value, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function HeatMap({ data }: { data: number[][] }) {
  if (!data || data.length === 0) return null

  const max = Math.max(...data.flat(), 1)

  return (
    <div className="inline-block">
      {data.map((row, y) => (
        <div key={y} className="flex">
          {row.map((val, x) => {
            const intensity = val / max
            return (
              <div
                key={x}
                title={`(${x},${y}): ${val} disparos`}
                className="w-6 h-6 m-px rounded-sm transition-colors"
                style={{
                  backgroundColor: val === 0
                    ? '#1e293b'
                    : `rgba(249, 115, 22, ${0.15 + intensity * 0.85})`,
                }}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
