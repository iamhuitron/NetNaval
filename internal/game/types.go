package game

// CellState representa el estado de una casilla del tablero.
type CellState int

const (
	CellEmpty CellState = iota
	CellShip
	CellHit
	CellMiss
	CellSunk
)

// Orientation define cómo está colocado un barco en el tablero.
type Orientation int

const (
	Horizontal Orientation = iota
	Vertical
)

// Coordinate identifica una casilla del tablero (0-indexada).
type Coordinate struct {
	X int
	Y int
}

// Ship representa un barco individual.
type Ship struct {
	Name      string
	Size      int
	Positions []Coordinate
	HitsTaken int
}

// Sunk indica si el barco ya fue hundido por completo.
func (s *Ship) Sunk() bool {
	return s.HitsTaken >= s.Size
}

// Board representa el tablero (clásico: 10x10) de un jugador.
type Board struct {
	Size  int
	Cells [][]CellState
	Ships []*Ship
}

// NewBoard crea un tablero vacío del tamaño indicado.
func NewBoard(size int) *Board {
	cells := make([][]CellState, size)
	for i := range cells {
		cells[i] = make([]CellState, size)
	}
	return &Board{Size: size, Cells: cells}
}

// TODO (Fase 1):
//   - PlaceShip(ship *Ship, origin Coordinate, o Orientation) error
//   - ValidatePlacement(...) error  (sin solapes, dentro del tablero)
//   - Fire(c Coordinate) (CellState, error)  (impacto / agua / hundimiento)
//   - IsGameOver() bool
