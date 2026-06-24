import { create } from 'zustand'
import type { ChatMessage } from '../types'

interface ChatStore {
  messages: ChatMessage[]
  add:   (msg: ChatMessage) => void
  clear: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  // Conserva los últimos 300 mensajes para no saturar la memoria
  add:   (msg) => set((s) => ({ messages: [...s.messages.slice(-299), msg] })),
  clear: ()    => set({ messages: [] }),
}))
