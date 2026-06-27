package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"netnaval/internal/chat"
	"netnaval/internal/game"
	"netnaval/internal/network"
	"netnaval/internal/online"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App es el struct principal expuesto al frontend vía bindings de Wails.
type App struct {
	ctx context.Context

	// ── Modo Solo (vs CPU) ──────────────────────────────────────────
	session *game.Session

	// ── Modo LAN ────────────────────────────────────────────────────
	lanSession *game.LANSession
	lanMgr     *network.Manager
}

func NewApp() *App { return &App{} }

func (a *App) startup(ctx context.Context) { a.ctx = ctx }

// ────────────────────────────────────────────────────────────────────
// MODO SOLO
// ────────────────────────────────────────────────────────────────────

func (a *App) NewGame(difficulty int) game.SessionState {
	d := game.Easy
	if difficulty == 1 {
		d = game.Medium
	}
	a.session = game.NewSession(d)
	a.lanSession = nil
	if a.lanMgr != nil {
		a.lanMgr.Close()
		a.lanMgr = nil
	}
	return a.session.State()
}

func (a *App) PlaceShip(shipIndex, x, y int, horizontal bool) (game.SessionState, error) {
	if a.session == nil {
		return game.SessionState{}, fmt.Errorf("no hay partida activa")
	}
	if err := a.session.PlaceShip(shipIndex, x, y, horizontal); err != nil {
		return game.SessionState{}, err
	}
	return a.session.State(), nil
}

func (a *App) RemoveShip(shipIndex int) (game.SessionState, error) {
	if a.session == nil {
		return game.SessionState{}, fmt.Errorf("no hay partida activa")
	}
	if err := a.session.RemoveShip(shipIndex); err != nil {
		return game.SessionState{}, err
	}
	return a.session.State(), nil
}

func (a *App) AutoPlace() (game.SessionState, error) {
	if a.session == nil {
		return game.SessionState{}, fmt.Errorf("no hay partida activa")
	}
	if err := a.session.AutoPlace(); err != nil {
		return game.SessionState{}, err
	}
	return a.session.State(), nil
}

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

func (a *App) PlayerFire(x, y int) (game.SessionState, error) {
	if a.session == nil {
		return game.SessionState{}, fmt.Errorf("no hay partida activa")
	}
	if err := a.session.PlayerFire(x, y); err != nil {
		return game.SessionState{}, err
	}
	state := a.session.State()

	if p := state.LastPlayerShot; p != nil {
		if p.Sunk {
			a.emitEvent(fmt.Sprintf("💥 ¡Hundiste el %s!", p.ShipName))
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

func (a *App) GetState() (game.SessionState, error) {
	if a.session == nil {
		return game.SessionState{}, fmt.Errorf("no hay partida activa")
	}
	return a.session.State(), nil
}

func (a *App) SendChatMessage(sender, content string) {
	msg := chat.NewMessage(sender, content)
	runtime.EventsEmit(a.ctx, "chat:message", msg)
}

// ────────────────────────────────────────────────────────────────────
// MODO LAN
// ────────────────────────────────────────────────────────────────────

// HostLanGame inicia un servidor TCP y devuelve la IP local del host.
func (a *App) HostLanGame() (string, error) {
	if a.lanMgr != nil {
		a.lanMgr.Close()
	}
	mgr, err := network.NewHost()
	if err != nil {
		return "", err
	}
	a.lanMgr = mgr
	a.lanSession = game.NewLANSession()
	a.session = nil

	mgr.OnConnect = func() {
		runtime.EventsEmit(a.ctx, "lan:connected")
		// Enviar el estado inicial para que el host transite a Placement
		runtime.EventsEmit(a.ctx, "lan:state", a.lanSession.State())
		a.emitEvent("✅ Oponente conectado. Coloca tus barcos.")
	}
	mgr.OnMessage = a.handleLanMessage
	mgr.OnDisconnect = func(e error) {
		runtime.EventsEmit(a.ctx, "lan:disconnected")
		a.emitEvent("⚠ Oponente desconectado.")
	}

	go func() {
		if err := mgr.WaitForClient(); err != nil {
			runtime.EventsEmit(a.ctx, "lan:error", err.Error())
		}
	}()

	return network.LocalIP(), nil
}

// JoinLanGame conecta a un host y devuelve el estado inicial.
func (a *App) JoinLanGame(hostIP string) (game.SessionState, error) {
	if a.lanMgr != nil {
		a.lanMgr.Close()
	}
	mgr, err := network.NewClient(hostIP)
	if err != nil {
		return game.SessionState{}, err
	}
	a.lanMgr = mgr
	a.lanSession = game.NewLANSession()
	a.session = nil

	mgr.OnMessage = a.handleLanMessage
	mgr.OnDisconnect = func(e error) {
		runtime.EventsEmit(a.ctx, "lan:disconnected")
		a.emitEvent("⚠ Oponente desconectado.")
	}

	a.emitEvent("✅ Conectado al host. Coloca tus barcos.")
	return a.lanSession.State(), nil
}

// LanPlaceShip coloca un barco propio en modo LAN.
func (a *App) LanPlaceShip(idx, x, y int, horizontal bool) (game.SessionState, error) {
	if a.lanSession == nil {
		return game.SessionState{}, fmt.Errorf("no hay partida LAN")
	}
	if err := a.lanSession.PlaceShip(idx, x, y, horizontal); err != nil {
		return game.SessionState{}, err
	}
	return a.lanSession.State(), nil
}

// LanRemoveShip retira un barco ya colocado.
func (a *App) LanRemoveShip(idx int) (game.SessionState, error) {
	if a.lanSession == nil {
		return game.SessionState{}, fmt.Errorf("no hay partida LAN")
	}
	if err := a.lanSession.RemoveShip(idx); err != nil {
		return game.SessionState{}, err
	}
	return a.lanSession.State(), nil
}

// LanAutoPlace coloca todos los barcos propios aleatoriamente.
func (a *App) LanAutoPlace() (game.SessionState, error) {
	if a.lanSession == nil {
		return game.SessionState{}, fmt.Errorf("no hay partida LAN")
	}
	if err := a.lanSession.AutoPlace(); err != nil {
		return game.SessionState{}, err
	}
	return a.lanSession.State(), nil
}

// LanReady marca al jugador como listo y envía la señal al rival.
// El host inicia la batalla cuando ambos están listos.
func (a *App) LanReady() (game.SessionState, error) {
	if a.lanSession == nil {
		return game.SessionState{}, fmt.Errorf("no hay partida LAN")
	}
	if !a.lanSession.AllPlaced() {
		return game.SessionState{}, fmt.Errorf("coloca todos tus barcos primero")
	}
	a.lanSession.MyReady = true
	if err := a.lanMgr.Send(network.MsgReady, nil); err != nil {
		return game.SessionState{}, err
	}

	if a.lanMgr.IsHost() && a.lanSession.PeerReady {
		a.startLanBattle()
	} else {
		a.emitEvent("⏳ Esperando al oponente…")
	}
	return a.lanSession.State(), nil
}

// LanFire registra el disparo localmente (currentTurn → "cpu") y lo envía
// al oponente. Devuelve el estado inmediato para que el frontend bloquee
// el tablero antes de que llegue la respuesta por evento.
func (a *App) LanFire(x, y int) (game.SessionState, error) {
	if a.lanSession == nil {
		return game.SessionState{}, fmt.Errorf("no hay partida LAN")
	}
	if err := a.lanSession.RegisterFire(x, y); err != nil {
		return game.SessionState{}, err
	}
	if err := a.lanMgr.Send(network.MsgFire, network.FireCoord{X: x, Y: y}); err != nil {
		return game.SessionState{}, err
	}
	return a.lanSession.State(), nil
}

// LanGetState devuelve el estado LAN actual.
func (a *App) LanGetState() (game.SessionState, error) {
	if a.lanSession == nil {
		return game.SessionState{}, fmt.Errorf("no hay partida LAN")
	}
	return a.lanSession.State(), nil
}

// LanSendChat envía un mensaje de chat al oponente y lo muestra localmente.
func (a *App) LanSendChat(content string) {
	if a.lanMgr == nil {
		return
	}
	a.lanMgr.Send(network.MsgChat, network.ChatPayload{Sender: "Jugador", Content: content})
	// Eco local
	msg := chat.NewMessage("Jugador", content)
	runtime.EventsEmit(a.ctx, "chat:message", msg)
}

// ────────────────────────────────────────────────────────────────────
// MODO ONLINE (Internet, sin servidor central)
// ────────────────────────────────────────────────────────────────────

// OnlineHostResult contiene toda la información que el frontend necesita
// para mostrar el Room Code y el estado de UPnP.
type OnlineHostResult struct {
	RoomCode    string `json:"roomCode"`
	PublicIP    string `json:"publicIP"`
	LocalIP     string `json:"localIP"`
	UPnPSuccess bool   `json:"upnpSuccess"`
	UPnPError   string `json:"upnpError,omitempty"`
}

// HostOnlineGame abre el servidor TCP, intenta UPnP para abrir el puerto
// en el router y devuelve el Room Code (7 chars Base36) para compartir.
func (a *App) HostOnlineGame() (OnlineHostResult, error) {
	// Limpiar sesión anterior
	if a.lanMgr != nil {
		a.lanMgr.Close()
	}
	mgr, err := network.NewHost()
	if err != nil {
		return OnlineHostResult{}, fmt.Errorf("no se pudo iniciar el servidor: %w", err)
	}
	a.lanMgr = mgr
	a.lanSession = game.NewLANSession()
	a.session = nil

	localIP := network.LocalIP()
	result := OnlineHostResult{LocalIP: localIP}

	// ── Obtener IP pública ───────────────────────────────────────────

	// Primero intentar UPnP (más rápido y nos da la IP del router)
	upnpResult := online.TryUPnP(localIP, online.Port, 6*time.Second)
	if upnpResult.Success {
		result.PublicIP = upnpResult.ExternalIP
		result.UPnPSuccess = true
	} else {
		// UPnP falló: obtener IP pública por HTTP
		if upnpResult.Err != nil {
			result.UPnPError = upnpResult.Err.Error()
		}
		pubIP, err := online.GetPublicIP()
		if err == nil {
			result.PublicIP = pubIP
		} else {
			// Último recurso: usar la IP local
			result.PublicIP = localIP
		}
	}

	// Si UPnP dio la IP pero no la IP pública, usar GetPublicIP
	if upnpResult.Success && result.PublicIP == "" {
		if pubIP, err := online.GetPublicIP(); err == nil {
			result.PublicIP = pubIP
		}
	}

	// ── Generar Room Code ────────────────────────────────────────────
	ip := net.ParseIP(result.PublicIP)
	if ip == nil {
		ip = net.ParseIP(localIP)
	}
	code, err := online.IPToCode(ip)
	if err != nil {
		a.lanMgr.Close()
		return OnlineHostResult{}, fmt.Errorf("no se pudo generar el código: %w", err)
	}
	result.RoomCode = code

	// ── Callbacks de red ─────────────────────────────────────────────
	mgr.OnConnect = func() {
		runtime.EventsEmit(a.ctx, "lan:connected")
		runtime.EventsEmit(a.ctx, "lan:state", a.lanSession.State())
		a.emitEvent("✅ Oponente conectado. Coloca tus barcos.")
	}
	mgr.OnMessage = a.handleLanMessage
	mgr.OnDisconnect = func(e error) {
		runtime.EventsEmit(a.ctx, "lan:disconnected")
		a.emitEvent("⚠ Oponente desconectado.")
	}
	go func() {
		if err := mgr.WaitForClient(); err != nil {
			runtime.EventsEmit(a.ctx, "lan:error", err.Error())
		}
	}()

	return result, nil
}

// JoinOnlineGame decodifica un Room Code y conecta al host.
// Reutiliza toda la infraestructura LAN — la diferencia es solo cómo
// se obtiene la dirección del servidor.
func (a *App) JoinOnlineGame(code string) (game.SessionState, error) {
	addr, err := online.CodeToAddr(code)
	if err != nil {
		return game.SessionState{}, err
	}
	// Reutilizar JoinLanGame con la dirección decodificada
	return a.JoinLanGame(addr)
}

// ────────────────────────────────────────────────────────────────────
// Manejador de mensajes LAN (desde la goroutine de red)
// ────────────────────────────────────────────────────────────────────

func (a *App) handleLanMessage(env network.Envelope) {
	switch env.Type {

	case network.MsgReady:
		a.lanSession.PeerReady = true
		if a.lanMgr.IsHost() && a.lanSession.MyReady {
			a.startLanBattle()
		}

	case network.MsgStart:
		// Solo el cliente recibe esto
		a.lanSession.StartBattle(false) // cliente va segundo
		a.emitEvent("⚓ ¡La batalla ha comenzado! El oponente dispara primero.")
		runtime.EventsEmit(a.ctx, "lan:state", a.lanSession.State())
		runtime.EventsEmit(a.ctx, "lan:battle_start", nil)

	case network.MsgFire:
		// El oponente nos disparó
		var coord network.FireCoord
		if err := json.Unmarshal(env.Payload, &coord); err != nil {
			return
		}
		result, err := a.lanSession.ReceiveOpponentFire(coord.X, coord.Y)
		if err != nil {
			return
		}
		// Narrar en bitácora
		if result.Sunk {
			a.emitEvent(fmt.Sprintf("💣 El oponente hundió tu %s.", result.ShipName))
		} else if result.Hit {
			a.emitEvent(fmt.Sprintf("🔥 El oponente impactó en tu %s.", result.ShipName))
		} else {
			a.emitEvent("🌊 El oponente falló. ¡Agua!")
		}
		// Enviar resultado al atacante
		a.lanMgr.Send(network.MsgFireResult, network.FireResultPayload{
			X: coord.X, Y: coord.Y,
			Hit: result.Hit, Sunk: result.Sunk,
			ShipName: result.ShipName, ShipSize: result.ShipSize,
		})
		state := a.lanSession.State()
		if state.Winner == "cpu" {
			a.emitEvent("💀 El oponente hundió toda tu flota. Has perdido.")
		}
		runtime.EventsEmit(a.ctx, "lan:state", state)

	case network.MsgFireResult:
		// Resultado de nuestro disparo
		var r network.FireResultPayload
		if err := json.Unmarshal(env.Payload, &r); err != nil {
			return
		}
		a.lanSession.ConfirmFireResult(r.X, r.Y, r.Hit, r.Sunk, r.ShipName, r.ShipSize)
		if r.Sunk {
			a.emitEvent(fmt.Sprintf("💥 ¡Hundiste el %s del oponente!", r.ShipName))
		} else if r.Hit {
			a.emitEvent(fmt.Sprintf("🎯 ¡Impacto en el %s!", r.ShipName))
		} else {
			a.emitEvent("💧 Fallaste. ¡Agua!")
		}
		state := a.lanSession.State()
		if state.Winner == "player" {
			a.emitEvent("🏆 ¡Victoria! Hundiste toda la flota enemiga.")
		}
		runtime.EventsEmit(a.ctx, "lan:state", state)

	case network.MsgChat:
		var c network.ChatPayload
		if err := json.Unmarshal(env.Payload, &c); err != nil {
			return
		}
		msg := chat.NewMessage(c.Sender, c.Content)
		runtime.EventsEmit(a.ctx, "chat:message", msg)
	}
}

func (a *App) startLanBattle() {
	a.lanMgr.Send(network.MsgStart, nil)
	a.lanSession.StartBattle(true) // host va primero
	a.emitEvent("⚓ ¡La batalla ha comenzado! Eres el primero en disparar.")
	runtime.EventsEmit(a.ctx, "lan:state", a.lanSession.State())
	runtime.EventsEmit(a.ctx, "lan:battle_start", nil)
}

func (a *App) emitEvent(content string) {
	msg := chat.NewEvent(content)
	runtime.EventsEmit(a.ctx, "chat:message", msg)
}
