import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import { useChatStore } from './store/chatStore'
import * as w from './lib/wails'
import { Menu }         from './components/Menu'
import { LanLobby }     from './components/LanLobby'
import { OnlineLobby }  from './components/OnlineLobby'
import { Placement }    from './components/Placement'
import { Battle }       from './components/Battle'
import { GameOver }     from './components/GameOver'

export default function App() {
  const session    = useGameStore(s => s.session)
  const mode       = useGameStore(s => s.mode)
  const setSession = useGameStore(s => s.setSession)
  const addMsg     = useChatStore(s => s.add)
  const clearChat  = useChatStore(s => s.clear)

  useEffect(() => {
    const subs: (() => void)[] = []
    try {
      subs.push(w.onChatMessage(addMsg))
      subs.push(w.onLanState(setSession))
      subs.push(w.onLanBattleStart(() => {}))
    } catch { /* fuera de Wails */ }
    return () => subs.forEach(u => u())
  }, [addMsg, setSession])

  useEffect(() => { if (!session && !mode) clearChat() }, [session, mode, clearChat])

  const phase = session?.phase

  // Lobbies de espera (sin session aún)
  const showLanLobby    = (mode === 'lan_host')                         && !phase
  const showOnlineLobby = (mode === 'online_host' || mode === 'online_client') && !phase

  return (
    <div className="h-screen w-screen bg-slate-950 overflow-hidden text-slate-100">
      {!mode && !phase           && <Menu />}
      {showLanLobby              && <LanLobby />}
      {showOnlineLobby           && <OnlineLobby />}
      {phase === 'placement'     && <Placement />}
      {phase === 'battle'        && <Battle />}
      {phase === 'gameover'      && <GameOver />}
    </div>
  )
}
