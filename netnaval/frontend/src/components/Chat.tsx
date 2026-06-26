import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '../store/chatStore'
import { useGameStore } from '../store/gameStore'
import * as w from '../lib/wails'

export function Chat() {
  const messages  = useChatStore((s) => s.messages)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const mode = useGameStore(s => s.mode)
  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    try {
      if (mode?.startsWith('lan')) w.lanSendChat(text)
      else w.sendChat('Jugador', text)
    } catch { /* fuera de Wails */ }
    setInput('')
  }

  return (
    <div className="flex flex-col h-full bg-slate-950/50">

      {/* Cabecera */}
      <div className="px-3 py-2.5 border-b border-slate-800/70 shrink-0">
        <p className="text-[9px] uppercase tracking-[0.25em] text-slate-600 font-medium">
          Bitácora
        </p>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-1 min-h-0">
        {messages.length === 0 && (
          <p className="text-slate-700 text-[11px] italic px-1 pt-1">
            Los eventos de la partida aparecerán aquí…
          </p>
        )}

        {messages.map((msg) =>
          msg.kind === 'event' ? (
            <div key={msg.id} className="text-[11px] text-slate-500 italic px-1 py-0.5 leading-snug">
              {msg.content}
            </div>
          ) : (
            <div key={msg.id} className="text-[11px] bg-slate-800/60 rounded-lg px-2.5 py-1.5 leading-snug">
              <span className="text-cyan-500 font-bold mr-1">{msg.sender}:</span>
              <span className="text-slate-200">{msg.content}</span>
            </div>
          )
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-1.5 p-2 border-t border-slate-800/70 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Mensaje…"
          className="flex-1 min-w-0 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5
                     text-[11px] text-slate-100 placeholder-slate-700
                     focus:outline-none focus:border-cyan-800 transition-colors"
        />
        <button
          onClick={handleSend}
          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700
                     rounded-lg text-slate-400 hover:text-slate-200 text-xs transition-colors shrink-0"
        >
          ↑
        </button>
      </div>
    </div>
  )
}
