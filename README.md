# 🗺️ NetNaval

Una plataforma híbrida de **Batalla Naval y Chat en Tiempo Real**, distribuida y multiplataforma, empaquetada inicialmente como aplicación de escritorio nativa y expandible a dispositivos móviles.

## 🏗️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Go (Golang) — estado de red, concurrencia e IA |
| Frontend | React + Vite (TypeScript) + Tailwind CSS |
| Puente de escritorio | [Wails](https://wails.io) — unifica Go y React en una ventana nativa |
| Gestor de estado | Zustand |

## 📁 Estructura del repositorio

```
netnaval/
├── main.go                 # Entrypoint de Wails
├── app.go                  # Bindings expuestos al frontend
├── wails.json               # Configuración de Wails
├── go.mod
├── internal/
│   ├── game/                # Tablero, barcos, CPU
│   │   ├── types.go
│   │   └── cpu.go
│   └── chat/                 # Mensajería en tiempo real
│       └── chat.go
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── store/
        │   └── gameStore.ts   # Estado del tablero (Zustand)
        ├── types/
        │   └── index.ts
        └── components/        # Tablero, chat, menú (por construir)
```

## 🚀 Primeros pasos

### Requisitos previos

- [Go](https://go.dev/dl/) 1.22+
- [Node.js](https://nodejs.org/) 20+
- Wails CLI: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`

### Instalación

```bash
git clone <tu-repo>
cd netnaval
go mod tidy          # resuelve la versión exacta de Wails y sus dependencias
cd frontend && npm install && cd ..
```

### Desarrollo

```bash
wails dev
```

Esto levanta la app de escritorio con hot-reload tanto en el frontend (React) como en el backend (Go).

### Build de producción

```bash
wails build
```

El binario resultante queda en `build/bin/`.

> **Nota:** este repo es un *scaffold* inicial escrito a mano siguiendo las convenciones de Wails v2. La carpeta `frontend/wailsjs` (bindings auto-generados entre Go y TS) no está incluida porque Wails la crea automáticamente la primera vez que corres `wails dev` o `wails build`.

## 🗺️ Hoja de ruta

### Fase 1 — MVP (jugabilidad local)
- Tablero clásico: colocación de barcos, turnos, impactos, agua y hundimientos.
- Chat integrado en tiempo real vía bindings de Wails.
- CPU en Go con dos dificultades: 🟢 Fácil (disparos aleatorios) y 🟡 Medio (modo cacería tras acertar).
- Multijugador LAN inicial introduciendo la IP manualmente.

### Fase 2 — Conectividad remota y robustez
- Autodescubrimiento LAN con UDP Broadcasting.
- Modo en línea sin servidor central, usando UPnP para abrir puertos.
- "Room Code" en Base36: comprime IP pública + puerto en un código corto compartible.
- CPU 🔴 Difícil: Algoritmo de Paridad + deducción de orientación del barco.

### Fase 3 — Diferenciadores competitivos
- Dashboard de analítica: mapas de calor de disparos, eficiencia por turno, predicción de patrones del rival.
- Sistema de Capitanes: habilidades especiales con cooldown (Radar, Disparo en Línea, Cortina de Humo).
- Motor de temas ("Ricing"): Cyberpunk, Retro Terminal y Classic Elegant vía JSON de configuración.

### Fase 4 — Expansión móvil (Android)
- Interfaz responsiva para pantallas táctiles verticales.
- Arquitectura host-cliente: el celular es un cliente puro, sin backend de Go embebido.
- Frontend desplegado en Vercel/Netlify, accesible vía navegador.
- Empaquetado en `.apk` con Capacitor, conectándose al host vía el Código de Sala.

## 📄 Licencia

MIT — ver [LICENSE](./LICENSE).
