package main

import (
	"context"
	"fmt"
	"netnaval/internal/chat"
	"netnaval/internal/game"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App es el struct principal expuesto al frontend vía bindings de Wails.
// Cada método público con receptor (a *App) queda disponible en React
// como window.go.main.App.<Metodo>(...).
type App struct {
	ctx     context.Context
	session *game.Session
}

// NewApp crea la instancia de App.
func NewApp() *App { return &App{} }

func (a *App) startup(ctx context.Context) { a.ctx = ctx }

// ── Bindings de sesión ───────────────────────────────────────────────

// NewGame crea una sesión nueva.
// difficulty: 0 = Fácil, 1 = Medio
func (a *App) NewGame(difficulty int) game.SessionState {
	d := game.Easy
	if difficulty == 1 {
		d = game.Medium
	}
	a.session = game.NewSession(d)
	return a.session.State()
}

// PlaceShip coloca el barco indicado en (x, y) con la orientación dada.
func (a *App) PlaceShip(shipIndex, x, y int, horizontal bool) (game.SessionState, error) {
	if a.session == nil {
		return game.SessionState{}, fmt.Errorf("no hay partida activa")
	}
	if err := a.session.PlaceShip(shipIndex, x, y, horizontal); err != nil {
		return game.SessionState{}, err
	}
	return a.session.State(), nil
}

// RemoveShip retira un barco ya colocado para reposicionarlo.
func (a *App) RemoveShip(shipIndex int) (game.SessionState, error) {
	if a.session == nil {
		return game.SessionState{}, fmt.Errorf("no hay partida activa")
	}
	if err := a.session.RemoveShip(shipIndex); err != nil {
		return game.SessionState{}, err
	}
	return a.session.State(), nil
}

// AutoPlace coloca todos los barcos del jugador aleatoriamente.
func (a *App) AutoPlace() (game.SessionState, error) {
	if a.session == nil {
		return game.SessionState{}, fmt.Errorf("no hay partida activa")
	}
	if err := a.session.AutoPlace(); err != nil {
		return game.SessionState{}, err
	}
	return a.session.State(), nil
}

// StartBattle inicia la fase de batalla. Todos los barcos deben estar colocados.
func (a *App) StartBattle() (game.SessionState, error) {
	if a.session == nil {
		return game.SessionState{}, fmt.Errorf("no hay partida activa")
	}
	if err := a.session.StartBattle(); err != nil {
		return game.SessionState{}, err
	}
	a.emitEvent("⚓ ¡La batalla ha comenzado! Eres el primero en disparar.")
	return a.session.State(), nil
}

// PlayerFire ejecuta el disparo del jugador en (x, y) sobre el tablero
// de la CPU. Internamente también ejecuta el turno de la CPU y emite
// los mensajes de evento correspondientes al panel de chat.
func (a *App) PlayerFire(x, y int) (game.SessionState, error) {
	if a.session == nil {
		return game.SessionState{}, fmt.Errorf("no hay partida activa")
	}

	if err := a.session.PlayerFire(x, y); err != nil {
		return game.SessionState{}, err
	}

	state := a.session.State()

	// Narrar el disparo del jugador
	if p := state.LastPlayerShot; p != nil {
		if p.Sunk {
			a.emitEvent(fmt.Sprintf("💥 ¡Hundiste el %s de la CPU!", p.ShipName))
		} else if p.Hit {
			a.emitEvent(fmt.Sprintf("🎯 ¡Impacto en el %s!", p.ShipName))
		} else {
			a.emitEvent("💧 Fallaste. ¡Agua!")
		}
	}

	if state.Winner == "player" {
		a.emitEvent("🏆 ¡Victoria! Hundiste toda la flota enemiga.")
		return state, nil
	}

	// Narrar el disparo de la CPU
	if c := state.LastCPUShot; c != nil {
		if c.Sunk {
			a.emitEvent(fmt.Sprintf("💣 La CPU hundió tu %s.", c.ShipName))
		} else if c.Hit {
			a.emitEvent(fmt.Sprintf("🔥 La CPU impactó en tu %s.", c.ShipName))
		} else {
			a.emitEvent("🌊 La CPU falló. ¡Agua!")
		}
	}

	if state.Winner == "cpu" {
		a.emitEvent("💀 La CPU hundió toda tu flota. Has perdido.")
	}

	return state, nil
}

// GetState devuelve el estado actual de la partida.
func (a *App) GetState() (game.SessionState, error) {
	if a.session == nil {
		return game.SessionState{}, fmt.Errorf("no hay partida activa")
	}
	return a.session.State(), nil
}

// ── Binding de chat ───────────────────────────────────────────────────

// SendChatMessage emite un mensaje de chat del jugador al frontend.
func (a *App) SendChatMessage(sender, content string) {
	msg := chat.NewMessage(sender, content)
	runtime.EventsEmit(a.ctx, "chat:message", msg)
}

// emitEvent envía un mensaje de evento del sistema al panel de chat.
func (a *App) emitEvent(content string) {
	msg := chat.NewEvent(content)
	runtime.EventsEmit(a.ctx, "chat:message", msg)
}
