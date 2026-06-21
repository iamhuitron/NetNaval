import { useGameStore } from './store/gameStore'

function App() {
  const phase = useGameStore((state) => state.phase)

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">NetNaval</h1>
        <p className="mt-2 text-slate-400">Fase actual: {phase}</p>
        {/* TODO: montar aquí el tablero, el chat y el menú principal */}
      </div>
    </div>
  )
}

export default App
