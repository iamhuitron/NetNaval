package game

import "fmt"

// Phase representa la etapa actual de la sesión.
type Phase = string

const (
	PhasePlacement Phase = "placement"
	PhaseBattle    Phase = "battle"
	PhaseGameOver  Phase = "gameover"
)

// ShipInfo contiene la información de un barco para la UI de colocación.
type ShipInfo struct {
	Index  int    `json:"index"`
	Name   string `json:"name"`
	Size   int    `json:"size"`
	Placed bool   `json:"placed"`
}

// SessionState es la instantánea serializable que se envía al frontend
// tras cada acción. La CPU reacciona dentro del mismo ciclo que el
// jugador, de modo que el frontend siempre recibe el estado final.
type SessionState struct {
	Phase          Phase      `json:"phase"`
	PlayerBoard    BoardView  `json:"playerBoard"`
	CPUBoard       BoardView  `json:"cpuBoard"`
	CurrentTurn    string     `json:"currentTurn"` // "player" | "cpu"
	Winner         string     `json:"winner"`       // "" | "player" | "cpu"
	Fleet          []ShipInfo `json:"fleet"`
	LastPlayerShot *FireResult `json:"lastPlayerShot,omitempty"`
	LastCPUShot    *FireResult `json:"lastCPUShot,omitempty"`
}

// Session orquesta una partida completa entre el jugador y la CPU.
type Session struct {
	playerBoard    *Board
	cpuBoard       *Board
	cpu            *CPU
	fleet          []*Ship // flota del jugador
	phase          Phase
	currentTurn    string
	winner         string
	lastPlayerShot *FireResult
	lastCPUShot    *FireResult
}

// NewSession crea una sesión nueva con la dificultad de CPU indicada.
func NewSession(difficulty Difficulty) *Session {
	return &Session{
		playerBoard: NewBoard(10),
		cpuBoard:    NewBoard(10),
		cpu:         &CPU{Difficulty: difficulty},
		fleet:       NewClassicFleet(),
		phase:       PhasePlacement,
		currentTurn: "player",
	}
}

// PlaceShip coloca uno de los barcos del jugador en el tablero.
// shipIndex es el índice 0-based dentro de la flota.
func (s *Session) PlaceShip(shipIndex, x, y int, horizontal bool) error {
	if s.phase != PhasePlacement {
		return fmt.Errorf("no estás en la fase de colocación")
	}
	if shipIndex < 0 || shipIndex >= len(s.fleet) {
		return fmt.Errorf("índice de barco inválido: %d", shipIndex)
	}
	o := Horizontal
	if !horizontal {
		o = Vertical
	}
	return s.playerBoard.PlaceShip(s.fleet[shipIndex], Coordinate{X: x, Y: y}, o)
}

// RemoveShip retira un barco ya colocado para reposicionarlo.
func (s *Session) RemoveShip(shipIndex int) error {
	if s.phase != PhasePlacement {
		return fmt.Errorf("no estás en la fase de colocación")
	}
	if shipIndex < 0 || shipIndex >= len(s.fleet) {
		return fmt.Errorf("índice de barco inválido")
	}
	ship := s.fleet[shipIndex]
	if len(ship.Positions) == 0 {
		return nil // ya está sin colocar
	}
	// Limpiar las celdas del tablero
	for _, p := range ship.Positions {
		s.playerBoard.Cells[p.Y][p.X] = CellEmpty
	}
	// Retirar el barco de la lista de Ships del tablero
	filtered := make([]*Ship, 0, len(s.playerBoard.Ships)-1)
	for _, sh := range s.playerBoard.Ships {
		if sh != ship {
			filtered = append(filtered, sh)
		}
	}
	s.playerBoard.Ships = filtered
	// Resetear las posiciones del barco en la flota
	ship.Positions = nil
	ship.HitsTaken = 0
	return nil
}

// AutoPlace coloca todos los barcos del jugador aleatoriamente,
// descartando cualquier posición previa.
func (s *Session) AutoPlace() error {
	if s.phase != PhasePlacement {
		return fmt.Errorf("no estás en la fase de colocación")
	}
	s.playerBoard = NewBoard(10)
	s.fleet = NewClassicFleet()
	return s.playerBoard.AutoPlaceFleet(s.fleet)
}

// allPlaced indica si toda la flota del jugador fue colocada.
func (s *Session) allPlaced() bool {
	for _, ship := range s.fleet {
		if len(ship.Positions) == 0 {
			return false
		}
	}
	return true
}

// StartBattle pasa de la fase de colocación a la fase de batalla.
// Requiere que todos los barcos del jugador estén colocados.
func (s *Session) StartBattle() error {
	if s.phase != PhasePlacement {
		return fmt.Errorf("ya estás en otra fase")
	}
	if !s.allPlaced() {
		return fmt.Errorf("coloca todos tus barcos antes de empezar")
	}
	// La CPU coloca su flota automáticamente
	cpuFleet := NewClassicFleet()
	if err := s.cpuBoard.AutoPlaceFleet(cpuFleet); err != nil {
		return fmt.Errorf("error al colocar la flota de la CPU: %w", err)
	}
	s.phase = PhaseBattle
	s.currentTurn = "player"
	return nil
}

// PlayerFire ejecuta el disparo del jugador en (x,y) sobre el tablero
// de la CPU y, si la partida no termina, ejecuta automáticamente el
// turno de la CPU. Almacena ambos resultados en la sesión.
func (s *Session) PlayerFire(x, y int) error {
	if s.phase != PhaseBattle {
		return fmt.Errorf("no estás en fase de batalla")
	}
	if s.currentTurn != "player" {
		return fmt.Errorf("no es tu turno")
	}

	// Disparo del jugador
	playerResult, err := s.cpuBoard.Fire(Coordinate{X: x, Y: y})
	if err != nil {
		return err
	}
	if playerResult.AlreadyFired {
		s.lastPlayerShot = nil
		s.lastCPUShot = nil
		return nil
	}

	s.lastPlayerShot = &playerResult
	s.lastCPUShot = nil

	if s.cpuBoard.AllSunk() {
		s.phase = PhaseGameOver
		s.winner = "player"
		return nil
	}

	// Turno de la CPU
	s.currentTurn = "cpu"
	shot := s.cpu.NextShot(s.playerBoard)
	cpuResult, err := s.playerBoard.Fire(shot)
	if err != nil {
		return err
	}
	s.cpu.RegisterResult(shot, cpuResult.Hit, cpuResult.Sunk)
	s.lastCPUShot = &cpuResult

	if s.playerBoard.AllSunk() {
		s.phase = PhaseGameOver
		s.winner = "cpu"
		return nil
	}

	s.currentTurn = "player"
	return nil
}

// State devuelve una instantánea serializable del estado actual.
func (s *Session) State() SessionState {
	fleet := make([]ShipInfo, len(s.fleet))
	for i, ship := range s.fleet {
		fleet[i] = ShipInfo{
			Index:  i,
			Name:   ship.Name,
			Size:   ship.Size,
			Placed: len(ship.Positions) > 0,
		}
	}
	return SessionState{
		Phase:          s.phase,
		PlayerBoard:    s.playerBoard.View(true),
		CPUBoard:       s.cpuBoard.View(s.phase == PhaseGameOver),
		CurrentTurn:    s.currentTurn,
		Winner:         s.winner,
		Fleet:          fleet,
		LastPlayerShot: s.lastPlayerShot,
		LastCPUShot:    s.lastCPUShot,
	}
}
