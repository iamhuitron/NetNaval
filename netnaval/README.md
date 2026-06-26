# 🗺️ NetNaval

Plataforma híbrida de **Batalla Naval y Chat en Tiempo Real**, distribuida y multiplataforma, empaquetada como aplicación de escritorio nativa (Wails v2) y expandible a móviles.

## 🏗️ Stack

| Capa | Tecnología |
|---|---|
| Backend | Go — estado de red, concurrencia, IA |
| Frontend | React + Vite (TypeScript) + Tailwind CSS |
| Puente de escritorio | [Wails v2](https://wails.io) — ventana nativa sin browser externo |
| Estado (FE) | Zustand |
| Protocolo LAN | TCP · JSON por líneas · Puerto 7342 |

## 📁 Estructura

```
netnaval/
├── main.go                        # Entrypoint Wails
├── app.go                         # Bindings Solo + LAN
├── wails.json
├── go.mod
├── internal/
│   ├── game/
│   │   ├── types.go               # Board, Ship, FireResult, fog-of-war
│   │   ├── cpu.go                 # IA Fácil (random) y Medio (cacería)
│   │   ├── session.go             # Orquestador Solo (vs CPU)
│   │   ├── lan_session.go         # Orquestador LAN (peer-to-peer)
│   │   └── game_test.go           # Tests unitarios
│   ├── chat/
│   │   └── chat.go                # Mensajes chat + eventos de partida
│   └── network/
│       ├── messages.go            # Protocolo TCP (tipos de mensaje)
│       └── manager.go             # Gestor de conexión host/cliente
└── frontend/
    ├── src/
    │   ├── lib/wails.ts           # Bridge tipado React → Wails runtime
    │   ├── store/
    │   │   ├── gameStore.ts       # Estado de partida (Zustand)
    │   │   └── chatStore.ts       # Mensajes de la bitácora
    │   ├── types/index.ts
    │   └── components/
    │       ├── Menu.tsx           # Menú principal (Solo / LAN)
    │       ├── LanLobby.tsx       # Sala de espera LAN
    │       ├── Board.tsx          # Tablero 10×10 reutilizable
    │       ├── Placement.tsx      # Colocación de barcos
    │       ├── Battle.tsx         # Pantalla de combate
    │       ├── Chat.tsx           # Bitácora de eventos + chat
    │       └── GameOver.tsx       # Resultado final
    ├── package.json
    ├── vite.config.ts
    └── tailwind.config.js
```

## 🚀 Primeros pasos

### Requisitos

- [Go](https://go.dev/dl/) 1.22+
- [Node.js](https://nodejs.org/) 20+
- Wails CLI: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`

### Setup inicial (solo la primera vez)

```bash
git clone <repo>
cd netnaval

# Genera go.sum con todas las dependencias de Wails
go mod tidy

# Instala dependencias del frontend
cd frontend && npm install && cd ..
```

### Desarrollo

```bash
wails dev       # Hot-reload Go + React en ventana nativa
```

### Build de producción

```bash
wails build     # Binario en build/bin/
```

### Tests de Go

```bash
go test ./internal/... -v
```

## 🎮 Modos de juego (Fase 1 MVP)

### vs CPU
1. **Menú** → tab *vs CPU* → elige dificultad → **JUGAR**
2. **Colocación**: selecciona barco → haz clic en el tablero (`R` rota)
3. **Batalla**: haz clic en el tablero del enemigo para disparar
4. Chat en la bitácora lateral durante toda la partida

### LAN (misma red)
| Jugador | Pasos |
|---|---|
| **Host** | Tab *LAN* → **Crear partida** → comparte la IP mostrada |
| **Cliente** | Tab *LAN* → escribe la IP del host → **Unirse** |

Ambos colocan sus barcos de forma independiente. Al pulsar **✓ LISTO** se espera al rival. Cuando los dos están listos, el host dispara primero.

## 🗺️ Hoja de ruta

### ✅ Fase 1 — MVP
- Tablero 10×10, flota clásica de 5 barcos
- IA Fácil (aleatoria) y Media (modo cacería)
- Chat / bitácora en tiempo real vía eventos Wails
- Multijugador LAN por IP manual (TCP · puerto 7342)

### Fase 2 — Conectividad remota
- UDP Broadcasting para autodescubrimiento LAN
- UPnP para jugar por internet sin configurar puertos
- Room Code (Base36) para compartir partida con un código corto
- IA Difícil: Algoritmo de Paridad + deducción de orientación

### Fase 3 — Diferenciadores
- Dashboard de analítica y mapas de calor de disparos
- Sistema de Capitanes con habilidades especiales (Radar, Disparo en Línea, Cortina de Humo)
- Motor de temas ("Ricing"): Cyberpunk · Retro Terminal · Classic Elegant

### Fase 4 — Expansión móvil
- Interfaz responsive para táctil/vertical
- Frontend desplegado en Vercel/Netlify
- `.apk` instalable con Capacitor

## 📄 Licencia

MIT — ver [LICENSE](./LICENSE).
