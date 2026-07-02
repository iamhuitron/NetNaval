import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import { useChatStore } from './store/chatStore'
import { useThemeStore } from './store/themeStore'
import * as w from './lib/wails'
import { Menu }         from './components/Menu'
import { LanLobby }    from './components/LanLobby'
import { OnlineLobby } from './components/OnlineLobby'
import { Placement }   from './components/Placement'
import { Battle }      from './components/Battle'
import { GameOver }    from './components/GameOver'
import { DisconnectOverlay } from './components/DisconnectOverlay'

export default function App() {
  const session       = useGameStore(s => s.session)
  const mode          = useGameStore(s => s.mode)
  const setSession    = useGameStore(s => s.setSession)
  const setDiscovered = useGameStore(s => s.setDiscovered)
  const setDisconnected = useGameStore(s => s.setDisconnected)
  const disconnected  = useGameStore(s => s.disconnected)
  const addMsg        = useChatStore(s => s.add)
  const clearChat     = useChatStore(s => s.clear)
  const loadThemes    = useThemeStore(s => s.load)

  // Cargar temas al iniciar (nunca debe bloquear el render del resto de la app)
  useEffect(() => {
    try {
      loadThemes()
    } catch {
      // Si falla la carga de temas, la app sigue funcionando con los estilos por defecto
    }
  }, [])

  // Suscripciones a eventos Wails
  useEffect(() => {
    const subs: (() => void)[] = []
    try {
      subs.push(w.onChatMessage(addMsg))
      subs.push(w.onLanState(setSession))
      subs.push(w.onLanBattleStart(() => {}))
      subs.push(w.onDiscoveryGames(setDiscovered))
      subs.push(w.onLanDisconnected(() => setDisconnected(true)))
    } catch { /* fuera de Wails */ }
    return () => subs.forEach(u => u())
  }, [addMsg, setSession, setDiscovered, setDisconnected])

  useEffect(() => {
    if (!session && !mode) clearChat()
  }, [session, mode, clearChat])

  // Solo mostramos el overlay de desconexión en modos de red activos
  // (no en Game Over, donde ya hay un resultado claro de la partida)
  const isNetworkMode = mode === 'lan_host' || mode === 'lan_client'
                      || mode === 'online_host' || mode === 'online_client'
  const showDisconnectOverlay = disconnected && isNetworkMode && session?.phase !== 'gameover'

  const phase          = session?.phase
  const showLanLobby   = mode === 'lan_host'                               && !phase
  const showOnlineLobby = (mode === 'online_host' || mode === 'online_client') && !phase

  return (
    <div className="h-screen w-screen bg-slate-950 overflow-hidden text-slate-100">
      {!mode && !phase        && <Menu />}
      {showLanLobby           && <LanLobby />}
      {showOnlineLobby        && <OnlineLobby />}
      {phase === 'placement'  && <Placement />}
      {phase === 'battle'     && <Battle />}
      {phase === 'gameover'   && <GameOver />}
      {showDisconnectOverlay  && <DisconnectOverlay />}
    </div>
  )
}
