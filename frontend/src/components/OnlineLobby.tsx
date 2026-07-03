import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import * as w from '../lib/wails'

// Formatea el código como XXXX-XXX para facilitar lectura
function fmt(raw: string): string {
  const c = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return c.length === 7 ? `${c.slice(0,4)}-${c.slice(4)}` : c
}

function CopyBtn({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(text).catch(() => {})
    setDone(true)
    setTimeout(() => setDone(false), 2000)
  }
  return (
    <button onClick={copy}
      className={`px-3 py-1 rounded-lg border text-xs font-medium transition-all ${
        done
          ? 'border-green-600 bg-green-950/60 text-green-400'
          : 'border-slate-600 text-slate-400 hover:border-slate-400 hover:text-slate-200'
      }`}>
      {done ? '✓ Copiado' : label}
    </button>
  )
}

export function OnlineLobby() {
  const { mode, onlineResult, reset } = useGameStore()
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    let unsub: (() => void) | undefined
    try { unsub = w.onLanConnected(() => setConnected(true)) } catch {}
    return () => unsub?.()
  }, [])

  // ── Pantalla de cliente esperando conexión ────────────────────────
  if (mode === 'online_client') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <div className="text-4xl font-black text-cyan-400 animate-pulse">···</div>
        <p className="text-slate-400 text-sm">Conectando al servidor…</p>
        <button onClick={reset}
          className="text-slate-600 hover:text-slate-400 text-sm transition-colors">
          ← Cancelar
        </button>
      </div>
    )
  }

  // ── Host conectado → transición automática a Placement vía lan:state ─
  if (connected) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-5xl">✅</div>
        <p className="text-xl font-bold text-green-400 tracking-wide">Oponente conectado</p>
        <p className="text-slate-500 text-sm">Preparando colocación de barcos…</p>
      </div>
    )
  }

  const r = onlineResult

  // ── Host esperando rival ───────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-8 overflow-y-auto py-6">

      {/* Indicador de espera */}
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-3">
          Esperando oponente…
        </p>
        <div className="flex justify-center gap-1.5">
          {[0,1,2].map(i => (
            <div key={i} style={{ animationDelay: `${i*200}ms` }}
              className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" />
          ))}
        </div>
      </div>

      {/* Room Code — sección principal */}
      <div className="w-full max-w-sm p-6 rounded-2xl border border-slate-700 bg-slate-900/60
                      flex flex-col items-center gap-4">
        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
          Código de sala — comparte esto con tu rival
        </p>
        <div className="font-mono text-5xl font-black tracking-[0.2em] text-cyan-400 select-all">
          {r ? fmt(r.roomCode) : '···'}
        </div>
        {r && <CopyBtn text={r.roomCode} label="Copiar código" />}

        {/* Estado del mapeo de puertos */}
        {r && (
          <div className={`w-full flex items-start gap-3 p-3 rounded-xl border text-xs ${
            r.portMappingReady
              ? 'border-green-800/60 bg-green-950/30 text-green-400'
              : 'border-yellow-800/50 bg-yellow-950/20 text-yellow-500'
          }`}>
            <span className="text-base shrink-0">
              {r.portMappingReady ? '✅' : '⚠️'}
            </span>
            <div>
              {r.portMappingReady ? (
                <p>Puerto abierto automáticamente
                  ({r.method === 'upnp' ? 'UPnP' : 'NAT-PMP'}).</p>
              ) : (
                <p className="font-semibold">
                  Requiere apertura de puerto manual.
                </p>
              )}
              {r.publicIP && (
                <p className="opacity-60 mt-0.5">IP pública: {r.publicIP}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Instrucciones de port forwarding cuando es necesario */}
      {r && !r.portMappingReady && (
        <div className="w-full max-w-sm flex flex-col gap-3">
          <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
            Cómo abrir el puerto en tu router
          </p>

          {/* Paso 1 */}
          <Step n={1}>
            <p className="text-slate-300 text-xs mb-1">
              Abre el panel de administración de tu router
            </p>
            <div className="flex items-center gap-2">
              <code className="bg-slate-800 border border-slate-700 rounded px-2 py-1
                               text-cyan-400 text-xs font-mono">
                http://{r.gatewayIP}
              </code>
              <CopyBtn text={`http://${r.gatewayIP}`} />
            </div>
            <p className="text-slate-600 text-[10px] mt-1">
              Usuario y contraseña: generalmente "admin" / "admin" o están en la etiqueta del router
            </p>
          </Step>

          {/* Paso 2 */}
          <Step n={2}>
            <p className="text-slate-300 text-xs">
              Busca <span className="text-slate-200 font-semibold">"Port Forwarding"</span>,{' '}
              <span className="text-slate-200 font-semibold">"Apertura de puertos"</span> o{' '}
              <span className="text-slate-200 font-semibold">"Virtual Server"</span>
            </p>
          </Step>

          {/* Paso 3 */}
          <Step n={3}>
            <p className="text-slate-300 text-xs mb-2">Crea una nueva regla con estos valores:</p>
            <div className="flex flex-col gap-1">
              {[
                { label: 'Protocolo',        val: 'TCP' },
                { label: 'Puerto externo',   val: '7342' },
                { label: 'Puerto interno',   val: '7342' },
                { label: 'IP destino (interna)', val: r.localIP },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center justify-between
                                            bg-slate-800/60 rounded-lg px-3 py-1.5">
                  <span className="text-slate-500 text-[11px]">{label}</span>
                  <div className="flex items-center gap-2">
                    <code className="text-cyan-400 text-xs font-mono">{val}</code>
                    <CopyBtn text={val} />
                  </div>
                </div>
              ))}
            </div>
          </Step>

          {/* Paso 4 */}
          <Step n={4}>
            <p className="text-slate-300 text-xs">
              Guarda los cambios. Puede que necesites reiniciar el router.
            </p>
          </Step>

          <p className="text-slate-700 text-[10px] text-center mt-1">
            Después de abrir el puerto, tu rival podrá conectarse con el código de sala de arriba.
          </p>
        </div>
      )}

      <button onClick={reset}
        className="text-slate-600 hover:text-slate-400 text-sm transition-colors">
        ← Cancelar y volver al menú
      </button>
    </div>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-6 h-6 rounded-full bg-slate-800 border border-slate-700
                      flex items-center justify-center text-[10px] font-bold text-slate-400 mt-0.5">
        {n}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}
