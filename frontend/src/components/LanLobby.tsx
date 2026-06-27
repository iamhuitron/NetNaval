import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import * as w from '../lib/wails'

export function LanLobby() {
  const { lanIP, reset }          = useGameStore()
  const [connected, setConnected] = useState(false)
  const [copied,    setCopied]    = useState(false)

  useEffect(() => {
    let unsub: (() => void) | undefined
    try { unsub = w.onLanConnected(() => setConnected(true)) } catch {}
    return () => unsub?.()
  }, [])

  const handleCopy = () => {
    if (!lanIP) return
    navigator.clipboard?.writeText(lanIP).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">

      {!connected ? (
        <>
          {/* Estado de espera */}
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-4">
              Esperando oponente en la red local
            </p>
            <div className="flex items-center justify-center gap-1.5">
              {[0, 1, 2].map(i => (
                <div key={i}
                  style={{ animationDelay: `${i * 200}ms` }}
                  className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce"
                />
              ))}
            </div>
          </div>

          {/* IP + broadcast info */}
          <div className="p-6 rounded-2xl border border-slate-700 bg-slate-900/60 flex flex-col items-center gap-4">

            {/* Autodescubrimiento activo */}
            <div className="flex items-center gap-2 text-green-400 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span>Anunciando partida en la red local</span>
            </div>

            <div className="w-full h-px bg-slate-800" />

            {/* IP para conexión manual */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
                IP para conexión manual
              </p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-mono font-bold text-slate-200 tracking-wider">
                  {lanIP ?? '···'}
                </span>
                <button onClick={handleCopy}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    copied
                      ? 'border-green-600 bg-green-950/50 text-green-400'
                      : 'border-slate-600 text-slate-400 hover:border-slate-400 hover:text-slate-200'
                  }`}>
                  {copied ? '✓' : 'Copiar'}
                </button>
              </div>
              <p className="text-[10px] text-slate-700 font-mono">Puerto TCP: 7342</p>
            </div>
          </div>

          <p className="text-slate-600 text-xs text-center max-w-xs">
            Los jugadores en tu red verán tu partida automáticamente.
            Si no aparece, pueden escribir la IP manualmente.
          </p>
        </>
      ) : (
        <div className="text-center">
          <div className="text-5xl mb-4">✅</div>
          <p className="text-xl font-bold text-green-400 tracking-wider">Oponente conectado</p>
          <p className="text-slate-500 text-sm mt-2">Preparando colocación de barcos…</p>
        </div>
      )}

      <button onClick={reset}
        className="text-slate-600 hover:text-slate-400 text-sm transition-colors">
        ← Volver al menú
      </button>
    </div>
  )
}
