package game

import (
	"errors"
	"fmt"
	"math/rand"
)

// CellState representa el estado interno de una casilla del tablero.
type CellState int

const (
	CellEmpty CellState = iota
	CellShip
	CellHit
	CellMiss
	CellSunk
)

func (s CellState) label() string {
	switch s {
	case CellShip:
		return "ship"
	case CellHit:
		return "hit"
	case CellMiss:
		return "miss"
	case CellSunk:
		return "sunk"
	default:
		return "empty"
	}
}

// Orientation define cómo está colocado un barco en el tablero.
type Orientation int

const (
	Horizontal Orientation = iota
	Vertical
)

// Coordinate identifica una casilla del tablero (0-indexada).
type Coordinate struct {
	X int `json:"x"`
	Y int `json:"y"`
}

// Ship representa un barco individual de la flota.
type Ship struct {
	Name      string       `json:"name"`
	Size      int          `json:"size"`
	Positions []Coordinate `json:"positions"`
	HitsTaken int          `json:"hitsTaken"`
}

// Sunk indica si el barco ya fue hundido por completo.
func (s *Ship) Sunk() bool {
	return s.HitsTaken >= s.Size
}

// NewClassicFleet devuelve la flota estándar de Batalla Naval, sin
// posiciones asignadas todavía.
func NewClassicFleet() []*Ship {
	return []*Ship{
		{Name: "Portaaviones", Size: 5},
		{Name: "Acorazado", Size: 4},
		{Name: "Crucero", Size: 3},
		{Name: "Submarino", Size: 3},
		{Name: "Destructor", Size: 2},
	}
}

// FireResult resume el efecto de un disparo sobre un tablero.
type FireResult struct {
	Coordinate   Coordinate `json:"coordinate"`
	Hit          bool       `json:"hit"`
	Sunk         bool       `json:"sunk"`
	ShipName     string     `json:"shipName,omitempty"`
	ShipSize     int        `json:"shipSize,omitempty"` // > 0 cuando Sunk=true
	AlreadyFired bool       `json:"alreadyFired"`
}

// BoardView es una proyección serializable del tablero pensada para el
// frontend. revealShips controla si se muestran los barcos (tablero
// propio) o se ocultan (niebla de guerra sobre el tablero rival).
type BoardView struct {
	Size  int        `json:"size"`
	Cells [][]string `json:"cells"`
}

// Board representa el tablero (clásico 10x10) de un jugador.
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

// InBounds indica si una coordenada cae dentro del tablero.
func (b *Board) InBounds(c Coordinate) bool {
	return c.X >= 0 && c.X < b.Size && c.Y >= 0 && c.Y < b.Size
}

func (b *Board) computePositions(size int, origin Coordinate, o Orientation) ([]Coordinate, error) {
	positions := make([]Coordinate, size)
	for i := 0; i < size; i++ {
		c := origin
		if o == Horizontal {
			c.X += i
		} else {
			c.Y += i
		}
		if !b.InBounds(c) {
			return nil, errors.New("el barco no cabe en el tablero")
		}
		positions[i] = c
	}
	return positions, nil
}

// PlaceShip valida y coloca un barco en el tablero (sin solapes).
func (b *Board) PlaceShip(ship *Ship, origin Coordinate, o Orientation) error {
	if len(ship.Positions) > 0 {
		return errors.New("ese barco ya fue colocado")
	}

	positions, err := b.computePositions(ship.Size, origin, o)
	if err != nil {
		return err
	}

	for _, p := range positions {
		if b.Cells[p.Y][p.X] == CellShip {
			return errors.New("hay un barco en esa posición")
		}
	}

	for _, p := range positions {
		b.Cells[p.Y][p.X] = CellShip
	}
	ship.Positions = positions
	b.Ships = append(b.Ships, ship)
	return nil
}

// AutoPlaceFleet coloca al azar cada barco de la flota recibida.
func (b *Board) AutoPlaceFleet(fleet []*Ship) error {
	for _, ship := range fleet {
		placed := false
		for attempts := 0; attempts < 300 && !placed; attempts++ {
			o := Horizontal
			if rand.Intn(2) == 1 {
				o = Vertical
			}
			origin := Coordinate{X: rand.Intn(b.Size), Y: rand.Intn(b.Size)}
			if err := b.PlaceShip(ship, origin, o); err == nil {
				placed = true
			}
		}
		if !placed {
			return fmt.Errorf("no se pudo colocar %s tras varios intentos", ship.Name)
		}
	}
	return nil
}

func (b *Board) shipAt(c Coordinate) *Ship {
	for _, s := range b.Ships {
		for _, p := range s.Positions {
			if p == c {
				return s
			}
		}
	}
	return nil
}

func fired(state CellState) bool {
	return state == CellHit || state == CellMiss || state == CellSunk
}

// Fire procesa un disparo sobre el tablero: marca agua, impacto o
// hundimiento, y devuelve el resultado.
func (b *Board) Fire(c Coordinate) (FireResult, error) {
	if !b.InBounds(c) {
		return FireResult{}, errors.New("coordenada fuera del tablero")
	}

	state := b.Cells[c.Y][c.X]
	if fired(state) {
		return FireResult{Coordinate: c, AlreadyFired: true}, nil
	}

	if state != CellShip {
		b.Cells[c.Y][c.X] = CellMiss
		return FireResult{Coordinate: c, Hit: false}, nil
	}

	ship := b.shipAt(c)
	ship.HitsTaken++
	sunk := ship.Sunk()

	if sunk {
		for _, p := range ship.Positions {
			b.Cells[p.Y][p.X] = CellSunk
		}
	} else {
		b.Cells[c.Y][c.X] = CellHit
	}

	size := 0
	if sunk {
		size = ship.Size
	}
	return FireResult{Coordinate: c, Hit: true, Sunk: sunk, ShipName: ship.Name, ShipSize: size}, nil
}

// AllSunk indica si toda la flota del tablero fue hundida (condición
// de fin de partida).
func (b *Board) AllSunk() bool {
	if len(b.Ships) == 0 {
		return false
	}
	for _, s := range b.Ships {
		if !s.Sunk() {
			return false
		}
	}
	return true
}

// View proyecta el tablero a un formato serializable para el frontend.
// Cuando revealShips es false, las casillas con barco no impactado se
// muestran como "empty" (niebla de guerra).
func (b *Board) View(revealShips bool) BoardView {
	cells := make([][]string, b.Size)
	for y := 0; y < b.Size; y++ {
		row := make([]string, b.Size)
		for x := 0; x < b.Size; x++ {
			state := b.Cells[y][x]
			if state == CellShip && !revealShips {
				state = CellEmpty
			}
			row[x] = state.label()
		}
		cells[y] = row
	}
	return BoardView{Size: b.Size, Cells: cells}
}
