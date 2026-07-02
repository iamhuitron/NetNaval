import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

// Sin esto, si cualquier componente lanza una excepción durante el render
// (por ejemplo, una llamada a Wails o a localStorage que falla en cierto
// webview), React desmonta TODO el árbol en silencio y la pantalla se
// queda en blanco o muestra solo lo que alcanzó a renderizar antes del
// fallo — sin ningún mensaje de error visible.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('NetNaval — error no capturado:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col
                        items-center justify-center gap-4 p-8">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-xl font-bold text-red-400">Algo falló al cargar NetNaval</h1>
          <p className="text-slate-500 text-sm max-w-md text-center">
            {this.state.error.message}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            className="px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500
                       text-white font-bold text-sm transition-colors"
          >
            Reintentar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
