import { useGameStore } from '../store/gameStore'
import { useChatStore } from '../store/chatStore'

// Se superpone a toda la app cuando el rival se desconecta en una
// partida LAN u Online. Sin esto, el jugador se queda mirando un
// tablero congelado sin saber qué pasó ni cómo salir.
export function DisconnectOverlay() {
  const reset     = useGameStore(s => s.reset)
  const clearChat = useChatStore(s => s.clear)

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center
                    gap-6 bg-slate-950/95 backdrop-blur-sm">
      <div className="text-5xl">🔌</div>
      <div className="text-center">
        <h2 className="text-2xl font-black text-red-400 tracking-wide mb-2">
          Oponente desconectado
        </h2>
        <p className="text-slate-500 text-sm max-w-xs">
          La conexión con el rival se perdió. La partida no puede continuar.
        </p>
      </div>
      <button
        onClick={() => { clearChat(); reset() }}
        className="px-10 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400
                   text-slate-950 font-black tracking-wider transition-colors"
      >
        Volver al menú
      </button>
    </div>
  )
}
