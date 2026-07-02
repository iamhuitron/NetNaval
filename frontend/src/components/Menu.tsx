import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import type { Difficulty } from '../types'

// v4 — tres modos completamente hardcodeados, sin .map()
const VERSION = 'v4'

type Tab = 'solo' | 'lan' | 'online'

export function Menu() {
  const [tab,      setTab]      = useState<Tab>('solo')
  const [diff,     setDiff]     = useState<Difficulty>(0)
  const [joinIP,   setJoinIP]   = useState('')
  const [joinCode, setJoinCode] = useState('')

  const {
    startSolo, hostLan, joinLan, hostOnline, joinOnline,
    discoveredGames, loading, error, clearError,
  } = useGameStore()

  useEffect(() => {
    console.log('[NetNaval Menu] version:', VERSION, '| tab:', tab)
    const store = useGameStore.getState()
    if (tab === 'lan') store.startScan()
    else               store.stopScan()
    return () => useGameStore.getState().stopScan()
  }, [tab])

  // Clases para los tabs activo / inactivo
  const active   = 'border-2 border-cyan-500 bg-cyan-950 text-cyan-300 font-black px-6 py-3 rounded-xl text-sm'
  const inactive = 'border-2 border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500 hover:text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors'

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:'28px', padding:'0 24px' }}>

      {/* Título */}
      <div style={{ textAlign:'center' }}>
        <h1 style={{ fontSize:'60px', fontWeight:900, letterSpacing:'0.2em', color:'#f1f5f9', margin:0 }}>
          NETNAVAL
        </h1>
        <p style={{ color:'#475569', fontSize:'11px', letterSpacing:'0.25em', textTransform:'uppercase', margin:'4px 0 0' }}>
          Batalla Naval · Tiempo Real
        </p>
        {/* NÚMERO DE VERSIÓN VISIBLE — confirma que estás corriendo el código nuevo */}
        <p style={{ color:'#1e3a5f', fontSize:'10px', marginTop:'6px', fontFamily:'monospace' }}>
          {VERSION}
        </p>
      </div>

      {/* ── TRES BOTONES HARDCODEADOS ── */}
      <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', justifyContent:'center' }}>
        <button
          className={tab === 'solo' ? active : inactive}
          onClick={() => { setTab('solo'); clearError() }}
        >
          🤖 vs CPU
        </button>
        <button
          className={tab === 'lan' ? active : inactive}
          onClick={() => { setTab('lan'); clearError() }}
        >
          🏠 Red local
        </button>
        <button
          className={tab === 'online' ? active : inactive}
          onClick={() => { setTab('online'); clearError() }}
        >
          🌍 En Línea
        </button>
      </div>

      {/* ── CONTENIDO ── */}
      <div style={{ width:'100%', maxWidth:'380px', display:'flex', flexDirection:'column', gap:'12px' }}>

        {/* vs CPU */}
        {tab === 'solo' && (
          <>
            <p style={{ textAlign:'center', fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.2em', color:'#64748b' }}>
              Dificultad
            </p>
            <div style={{ display:'flex', gap:'8px' }}>
              <button
                onClick={() => setDiff(0)}
                className={diff === 0
                  ? 'flex-1 py-3 rounded-xl border-2 border-green-500 bg-green-950 text-green-300 font-bold text-sm'
                  : 'flex-1 py-3 rounded-xl border-2 border-slate-700 bg-slate-900 text-slate-500 font-bold text-sm hover:border-slate-500 transition-colors'}
              >Fácil</button>
              <button
                onClick={() => setDiff(1)}
                className={diff === 1
                  ? 'flex-1 py-3 rounded-xl border-2 border-yellow-500 bg-yellow-950 text-yellow-300 font-bold text-sm'
                  : 'flex-1 py-3 rounded-xl border-2 border-slate-700 bg-slate-900 text-slate-500 font-bold text-sm hover:border-slate-500 transition-colors'}
              >Medio</button>
              <button
                onClick={() => setDiff(2)}
                className={diff === 2
                  ? 'flex-1 py-3 rounded-xl border-2 border-red-500 bg-red-950 text-red-300 font-bold text-sm'
                  : 'flex-1 py-3 rounded-xl border-2 border-slate-700 bg-slate-900 text-slate-500 font-bold text-sm hover:border-slate-500 transition-colors'}
              >Difícil</button>
            </div>
            <button
              onClick={() => startSolo(diff, 0)}
              disabled={loading}
              className="w-full py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black text-xl tracking-widest transition-colors"
            >
              {loading ? '···' : 'JUGAR'}
            </button>
          </>
        )}

        {/* Red local */}
        {tab === 'lan' && (
          <>
            <button
              onClick={hostLan}
              disabled={loading}
              className="w-full py-4 rounded-xl bg-blue-700 hover:bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-lg tracking-wide transition-colors"
            >
              {loading ? '···' : '🖥  Crear partida'}
            </button>

            {discoveredGames.length > 0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                <p style={{ fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.2em', color:'#64748b' }}>
                  Partidas encontradas
                </p>
                {discoveredGames.map(g => (
                  <button
                    key={g.ip}
                    onClick={() => joinLan(g.ip)}
                    className="flex justify-between items-center px-4 py-3 rounded-xl border border-cyan-800 bg-cyan-950 hover:bg-cyan-900 transition-colors"
                  >
                    <span className="text-cyan-300 font-semibold text-sm">{g.name}</span>
                    <span className="text-cyan-500 font-bold text-sm">Unirse →</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-800 bg-slate-900">
                <div className="w-2 h-2 rounded-full bg-slate-600 animate-pulse" />
                <span className="text-slate-600 text-sm">Buscando en tu red…</span>
              </div>
            )}

            <p style={{ textAlign:'center', fontSize:'11px', color:'#475569' }}>— o escribe la IP —</p>

            <div style={{ display:'flex', gap:'8px' }}>
              <input
                value={joinIP}
                onChange={e => setJoinIP(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && joinIP && joinLan(joinIP.trim())}
                placeholder="192.168.1.X"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-3 text-slate-100 placeholder-slate-700 text-sm font-mono focus:outline-none focus:border-cyan-700"
              />
              <button
                onClick={() => joinLan(joinIP.trim())}
                disabled={loading || !joinIP.trim()}
                className="px-5 rounded-lg bg-teal-700 hover:bg-teal-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold transition-colors"
              >
                Unirse
              </button>
            </div>
          </>
        )}

        {/* En Línea */}
        {tab === 'online' && (
          <>
            <div className="p-4 rounded-xl border border-slate-700 bg-slate-900 flex flex-col gap-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                Abre el puerto automáticamente (UPnP) y genera un código de 7 caracteres para que tu rival se conecte desde cualquier lugar.
              </p>
              <button
                onClick={hostOnline}
                disabled={loading}
                className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold tracking-wide transition-colors"
              >
                {loading ? '···' : '🌐  Crear partida en línea'}
              </button>
            </div>

            <p style={{ textAlign:'center', fontSize:'11px', color:'#475569' }}>— o únete con un código —</p>

            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              <input
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,7))}
                onKeyDown={e => e.key === 'Enter' && joinCode.length === 7 && joinOnline(joinCode)}
                placeholder="XXXXXXX"
                maxLength={7}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-2xl font-mono font-black tracking-widest text-center text-slate-100 placeholder-slate-700 focus:outline-none focus:border-indigo-500"
              />
              <p style={{ textAlign:'center', fontSize:'10px', color:'#374151' }}>
                {joinCode.length}/7 — letras A–Z y números 0–9
              </p>
              <button
                onClick={() => joinOnline(joinCode)}
                disabled={loading || joinCode.length !== 7}
                className="w-full py-3 rounded-xl bg-teal-700 hover:bg-teal-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold tracking-wide transition-colors"
              >
                {loading ? '···' : '🚀  Unirse'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          onClick={clearError}
          style={{ padding:'12px 20px', borderRadius:'12px', backgroundColor:'rgba(69,10,10,0.8)', border:'1px solid #7f1d1d', color:'#fca5a5', fontSize:'14px', cursor:'pointer', textAlign:'center', maxWidth:'320px' }}
        >
          ⚠ {error}
        </div>
      )}
    </div>
  )
}
