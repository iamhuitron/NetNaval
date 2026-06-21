package main

import (
	"context"

	"netnaval/internal/chat"
	"netnaval/internal/game"
)

// App es el struct principal expuesto al frontend vía bindings de Wails.
// Todo método público de App con receptor (a *App) queda disponible
// automáticamente en el frontend como window.go.main.App.<Metodo>.
type App struct {
	ctx context.Context

	// Estado de la Fase 1: un tablero local por jugador + la CPU.
	playerBoard *game.Board
	cpu         *game.CPU
}

// NewApp crea la instancia de App con su estado inicial.
func NewApp() *App {
	return &App{
		playerBoard: game.NewBoard(10),
		cpu:         &game.CPU{Difficulty: game.Easy},
	}
}

// startup se ejecuta al arrancar la app y guarda el contexto de Wails,
// necesario para invocar el runtime (eventos, diálogos, etc).
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet es un binding de ejemplo: confirma que el puente Go <-> React
// funciona correctamente. Bórralo cuando conectes los bindings reales
// de juego y chat.
func (a *App) Greet(name string) string {
	return "Bienvenido a NetNaval, " + name
}

// SendChatMessage es el stub del binding de chat (Fase 1).
// TODO: emitir el mensaje al otro jugador mediante runtime.EventsEmit
// y persistir/transmitir según el modo de conexión (LAN/online).
func (a *App) SendChatMessage(msg chat.Message) {
	// Implementación pendiente.
}
