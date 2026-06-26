import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import * as w from '../lib/wails'

// Formato visual del código: XXXX-XXX (grupos de 4 y 3 para facilitar lectura)
function formatCode(raw: string): string {
  const c = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return c.length === 7 ? `${c.slice(0, 4)}-${c.slice(4)}` : c
}

function copyToClipboard(text: string) {
  navigator.clipboard?.writeText(text).catch(() => {})
}

export function OnlineLobby() {
  const { mode, onlineResult, reset } = useGameStore()
  const [connected, setConnected]     = useState(false)
  const [copied, setCopied]           = useState(false)

  useEffect(() => {
    let unsub: (() => void) | undefined
    try { unsub = w.onLanConnected(() => setConnected(true)) } catch {}
    return () => unsub?.()
  }, [])

  const handleCopy = () => {
    if (!onlineResult?.roomCode) return
    copyToClipboard(onlineResult.roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Host ──────────────────────────────────────────────────────────
  if (mode === 'online_host') {
    const code = onlineResult?.roomCode ?? '···'

    return (
      <div className="flex flex-col items-center justify-center h-full gap-8">

        {!connected ? (
          <>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2">
                Esperando oponente
              </p>
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping mx-auto" />
            </div>

            {/* Room Code */}
            <div className="flex flex-col items-center gap-4
                            p-8 rounded-2xl border border-slate-700 bg-slate-900/60">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                Comparte este código con tu oponente
              </p>
              <div className="font-mono text-5xl font-black tracking-[0.2em] text-cyan-400
                              select-all cursor-text">
                {formatCode(code)}
              </div>
              <button
                onClick={handleCopy}
                className={`px-5 py-2 rounded-lg border text-sm font-medium transition-all ${
                  copied
                    ? 'border-green-600 bg-green-950/50 text-green-400'
                    : 'border-slate-600 text-slate-300 hover:border-slate-400'
                }`}
              >
                {copied ? '✓ Copiado' : 'Copiar código'}
              </button>
            </div>

            {/* Estado UPnP */}
            <div className={`flex items-start gap-3 p-4 rounded-xl border max-w-sm text-sm ${
              onlineResult?.upnpSuccess
                ? 'border-green-800/60 bg-green-950/30 text-green-400'
                : 'border-yellow-800/60 bg-yellow-950/30 text-yellow-500'
            }`}>
              <span className="text-lg shrink-0">
                {onlineResult?.upnpSuccess ? '✅' : '⚠️'}
              </span>
              <div>
                {onlineResult?.upnpSuccess ? (
                  <p>Puerto abierto automáticamente (UPnP).</p>
                ) : (
                  <>
                    <p className="font-semibold mb-1">UPnP no disponible</p>
                    <p className="text-xs opacity-80">
                      Abre el puerto <strong>TCP 7342</strong> en tu router y apúntalo
                      a <strong>{onlineResult?.localIP}</strong>.
                    </p>
                  </>
                )}
                <p className="text-xs mt-1 opacity-60">
                  IP pública: {onlineResult?.publicIP ?? '···'}
                </p>
              </div>
            </div>
          </>
        ) : (
          /* Conectado → transición automática a Placement vía lan:state */
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-xl font-bold text-green-400 tracking-wider">Oponente conectado</p>
            <p className="text-slate-500 text-sm mt-2">Preparando la partida…</p>
          </div>
        )}

        <button
          onClick={reset}
          className="text-slate-600 hover:text-slate-400 text-sm transition-colors mt-2"
        >
          ← Cancelar y volver al menú
        </button>
      </div>
    )
  }

  // ── Cliente (online_client) — transición inmediata a Placement ────
  // (el cliente debería ver OnlineLobby brevemente mientras conecta;
  // en cuanto joinOnline resuelve, session.phase='placement' y App.tsx
  // redirige a Placement automáticamente)
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <div className="text-4xl font-black text-cyan-400 animate-pulse">···</div>
      <p className="text-slate-400 text-sm tracking-wider">Conectando al servidor…</p>
      <button
        onClick={reset}
        className="text-slate-600 hover:text-slate-400 text-sm transition-colors mt-4"
      >
        ← Cancelar
      </button>
    </div>
  )
}
