import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import * as w from '../lib/wails'

export function LanLobby() {
  const mode    = useGameStore(s => s.mode)
  const lanIP   = useGameStore(s => s.lanIP)
  const reset   = useGameStore(s => s.reset)
  const [connected, setConnected] = useState(false)

  // Escuchar cuando el cliente se conecta al host
  useEffect(() => {
    let unsub: (() => void) | undefined
    try {
      unsub = w.onLanConnected(() => setConnected(true))
    } catch {}
    return () => unsub?.()
  }, [])

  // Si ya hay session (cliente conectó y viene la sesión LAN), 
  // App.tsx redirigirá a Placement automáticamente.
  // Este componente solo muestra la pantalla de espera.

  const isHost = mode === 'lan_host'

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">

      {isHost ? (
        <>
          <div className="text-center">
            <p className="text-slate-500 text-xs uppercase tracking-[0.2em] mb-3">
              {connected ? 'Oponente conectado' : 'Esperando oponente…'}
            </p>
            <div className={`text-5xl font-black ${connected ? 'text-green-400' : 'text-slate-100 animate-pulse'}`}>
              {connected ? '✓ CONECTADO' : '···'}
            </div>
          </div>

          {!connected && (
            <div className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-slate-700 bg-slate-900/60">
              <p className="text-xs uppercase tracking-widest text-slate-500">
                Comparte esta IP con tu oponente
              </p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-mono font-bold text-cyan-400 tracking-wider">
                  {lanIP ?? '···'}
                </span>
                <button
                  onClick={() => lanIP && navigator.clipboard?.writeText(lanIP)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400
                             hover:border-slate-500 hover:text-slate-200 text-xs transition-colors"
                >
                  Copiar
                </button>
              </div>
              <p className="text-[10px] text-slate-700 font-mono">
                Puerto: 7342
              </p>
            </div>
          )}

          {connected && (
            <p className="text-slate-400 text-sm">
              Ambos pasarán a la pantalla de colocación en un momento…
            </p>
          )}
        </>
      ) : (
        /* Cliente: mostrando que está conectando */
        <div className="text-center">
          <p className="text-slate-500 text-xs uppercase tracking-[0.2em] mb-3">Conectando al host</p>
          <div className="text-4xl font-black text-cyan-400 animate-pulse">···</div>
          <p className="text-slate-600 text-sm mt-4">
            Esperando que el host acepte la conexión
          </p>
        </div>
      )}

      <button
        onClick={reset}
        className="mt-4 px-6 py-2 rounded-lg border border-slate-700 text-slate-500
                   hover:border-slate-500 hover:text-slate-300 text-sm transition-colors"
      >
        ← Volver al menú
      </button>
    </div>
  )
}
