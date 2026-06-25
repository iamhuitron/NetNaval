import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import { useChatStore } from './store/chatStore'
import * as w from './lib/wails'
import { Menu }      from './components/Menu'
import { LanLobby } from './components/LanLobby'
import { Placement } from './components/Placement'
import { Battle }    from './components/Battle'
import { GameOver }  from './components/GameOver'

export default function App() {
  const session    = useGameStore(s => s.session)
  const mode       = useGameStore(s => s.mode)
  const setSession = useGameStore(s => s.setSession)
  const addMsg     = useChatStore(s => s.add)
  const clearChat  = useChatStore(s => s.clear)

  // ── Suscripciones a eventos Wails ──────────────────────────────────
  useEffect(() => {
    const subs: (() => void)[] = []
    try {
      subs.push(w.onChatMessage(addMsg))
      subs.push(w.onLanState(setSession))
      subs.push(w.onLanBattleStart(() => {}))  // el estado ya llega por onLanState
    } catch { /* fuera de Wails */ }
    return () => subs.forEach(u => u())
  }, [addMsg, setSession])

  // Limpiar bitácora al reiniciar
  useEffect(() => { if (!session && !mode) clearChat() }, [session, mode, clearChat])

  // ── Routing por fase ───────────────────────────────────────────────
  const phase = session?.phase

  // LAN: host creó la sala pero aún no llega el cliente (session = null)
  const isLanLobby = mode?.startsWith('lan') && !phase

  return (
    <div className="h-screen w-screen bg-slate-950 overflow-hidden text-slate-100">
      {!mode && !phase            && <Menu />}
      {isLanLobby                 && <LanLobby />}
      {phase === 'placement'      && <Placement />}
      {phase === 'battle'         && <Battle />}
      {phase === 'gameover'       && <GameOver />}
    </div>
  )
}
