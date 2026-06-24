import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import { useChatStore } from './store/chatStore'
import { onChatMessage } from './lib/wails'
import { Menu }      from './components/Menu'
import { Placement } from './components/Placement'
import { Battle }    from './components/Battle'
import { GameOver }  from './components/GameOver'

export default function App() {
  const session   = useGameStore((s) => s.session)
  const addMsg    = useChatStore((s) => s.add)
  const clearChat = useChatStore((s) => s.clear)

  // Suscribirse a los eventos de chat/partida emitidos desde Go
  useEffect(() => {
    let unsub: (() => void) | undefined
    try {
      unsub = onChatMessage(addMsg)
    } catch {
      // Fuera del contexto Wails (p.ej. Vite solo): sin eventos
    }
    return () => unsub?.()
  }, [addMsg])

  // Limpiar la bitácora cuando se reinicia la partida
  useEffect(() => {
    if (!session) clearChat()
  }, [session, clearChat])

  const phase = session?.phase

  return (
    <div className="h-screen w-screen bg-slate-950 overflow-hidden text-slate-100">
      {!phase           && <Menu />}
      {phase === 'placement' && <Placement />}
      {phase === 'battle'    && <Battle />}
      {phase === 'gameover'  && <GameOver />}
    </div>
  )
}
