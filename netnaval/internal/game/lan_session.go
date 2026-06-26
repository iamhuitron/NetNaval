package game

import (
	"errors"
	"fmt"
)

// LANSession gestiona la perspectiva de UN jugador en una partida LAN.
// Cada instancia (host y cliente) tiene:
//   - MyBoard  : su propio tablero con barcos
//   - EnemyBoard: vista de niebla de guerra del rival (solo celdas disparadas)
//
// La sincronización ocurre mediante mensajes de red: fire → fire_result.
type LANSession struct {
	MyBoard    *Board
	EnemyBoard *Board // niebla de guerra
	MyFleet    []*Ship

	Phase  Phase
	MyTurn bool   // true cuando es el turno de este jugador
	Winner string // "" | "me" | "opponent"

	MyReady   bool
	PeerReady bool

	LastMyShot    *FireResult
	LastEnemyShot *FireResult

	// Celdas del enemigo confirmadas como hundidas (para detectar victoria)
	enemySunkenShips int
	pendingCoord     *Coordinate // disparo enviado, esperando resultado
}

// NewLANSession crea una sesión LAN vacía.
func NewLANSession() *LANSession {
	return &LANSession{
		MyBoard:    NewBoard(10),
		EnemyBoard: NewBoard(10),
		MyFleet:    NewClassicFleet(),
		Phase:      PhasePlacement,
	}
}

// AllPlaced informa si toda la flota propia fue colocada.
func (s *LANSession) AllPlaced() bool {
	for _, sh := range s.MyFleet {
		if len(sh.Positions) == 0 {
			return false
		}
	}
	return len(s.MyFleet) > 0
}

// PlaceShip coloca un barco propio en el tablero.
func (s *LANSession) PlaceShip(idx, x, y int, horizontal bool) error {
	if s.Phase != PhasePlacement {
		return errors.New("no estás en colocación")
	}
	if idx < 0 || idx >= len(s.MyFleet) {
		return fmt.Errorf("índice inválido: %d", idx)
	}
	o := Horizontal
	if !horizontal {
		o = Vertical
	}
	return s.MyBoard.PlaceShip(s.MyFleet[idx], Coordinate{X: x, Y: y}, o)
}

// RemoveShip retira un barco ya colocado.
func (s *LANSession) RemoveShip(idx int) error {
	if s.Phase != PhasePlacement {
		return errors.New("no estás en colocación")
	}
	if idx < 0 || idx >= len(s.MyFleet) {
		return errors.New("índice inválido")
	}
	ship := s.MyFleet[idx]
	if len(ship.Positions) == 0 {
		return nil
	}
	for _, p := range ship.Positions {
		s.MyBoard.Cells[p.Y][p.X] = CellEmpty
	}
	filtered := make([]*Ship, 0, len(s.MyBoard.Ships)-1)
	for _, sh := range s.MyBoard.Ships {
		if sh != ship {
			filtered = append(filtered, sh)
		}
	}
	s.MyBoard.Ships = filtered
	ship.Positions = nil
	ship.HitsTaken = 0
	return nil
}

// AutoPlace coloca todos los barcos propios de forma aleatoria.
func (s *LANSession) AutoPlace() error {
	if s.Phase != PhasePlacement {
		return errors.New("no estás en colocación")
	}
	s.MyBoard = NewBoard(10)
	s.MyFleet = NewClassicFleet()
	return s.MyBoard.AutoPlaceFleet(s.MyFleet)
}

// StartBattle inicia la fase de batalla.
// goFirst=true → este jugador dispara primero.
func (s *LANSession) StartBattle(goFirst bool) {
	s.Phase = PhaseBattle
	s.MyTurn = goFirst
}

// RegisterFire registra que enviamos un disparo a (x,y) al rival y
// esperamos su confirmación. Cambia el turno a "esperando".
func (s *LANSession) RegisterFire(x, y int) error {
	if !s.MyTurn {
		return errors.New("no es tu turno")
	}
	c := Coordinate{X: x, Y: y}
	if !s.EnemyBoard.InBounds(c) {
		return errors.New("coordenada fuera del tablero")
	}
	if fired(s.EnemyBoard.Cells[c.Y][c.X]) {
		return errors.New("ya disparaste ahí")
	}
	s.pendingCoord = &c
	s.MyTurn = false
	return nil
}

// ConfirmFireResult actualiza la niebla de guerra con el resultado que
// nos devolvió el rival. Detecta victoria si hundimos todos sus barcos.
// La flota clásica suma 17 celdas (5+4+3+3+2); contamos por barco.
func (s *LANSession) ConfirmFireResult(x, y int, hit, sunk bool, shipName string, shipSize int) {
	c := Coordinate{X: x, Y: y}
	switch {
	case sunk:
		s.EnemyBoard.Cells[c.Y][c.X] = CellSunk
		s.enemySunkenShips++
	case hit:
		s.EnemyBoard.Cells[c.Y][c.X] = CellHit
	default:
		s.EnemyBoard.Cells[c.Y][c.X] = CellMiss
	}

	s.LastMyShot = &FireResult{
		Coordinate: c, Hit: hit, Sunk: sunk,
		ShipName: shipName, ShipSize: shipSize,
	}
	s.pendingCoord = nil

	const classicFleetShips = 5
	if s.enemySunkenShips >= classicFleetShips {
		s.Phase = PhaseGameOver
		s.Winner = "me"
	} else {
		// Ahora le toca al rival
		s.MyTurn = false
	}
}

// ReceiveOpponentFire procesa el disparo del rival sobre nuestro tablero.
// Devuelve el FireResult para enviárselo al rival.
func (s *LANSession) ReceiveOpponentFire(x, y int) (FireResult, error) {
	c := Coordinate{X: x, Y: y}
	result, err := s.MyBoard.Fire(c)
	if err != nil {
		return FireResult{}, err
	}
	s.LastEnemyShot = &result

	if s.MyBoard.AllSunk() {
		s.Phase = PhaseGameOver
		s.Winner = "opponent"
	} else {
		s.MyTurn = true // ahora nos toca a nosotros
	}
	return result, nil
}

// State devuelve una instantánea serializable compatible con SessionState.
func (s *LANSession) State() SessionState {
	fleet := make([]ShipInfo, len(s.MyFleet))
	for i, sh := range s.MyFleet {
		fleet[i] = ShipInfo{
			Index:  i,
			Name:   sh.Name,
			Size:   sh.Size,
			Placed: len(sh.Positions) > 0,
		}
	}

	turn := "cpu"
	if s.MyTurn {
		turn = "player"
	}

	winner := ""
	switch s.Winner {
	case "me":
		winner = "player"
	case "opponent":
		winner = "cpu"
	}

	return SessionState{
		Phase:          s.Phase,
		PlayerBoard:    s.MyBoard.View(true),
		CPUBoard:       s.EnemyBoard.View(s.Phase == PhaseGameOver),
		CurrentTurn:    turn,
		Winner:         winner,
		Fleet:          fleet,
		LastPlayerShot: s.LastMyShot,
		LastCPUShot:    s.LastEnemyShot,
	}
}
