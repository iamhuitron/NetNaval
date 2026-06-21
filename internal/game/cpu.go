package game

import "math/rand"

// Difficulty representa el nivel de la CPU.
type Difficulty int

const (
	Easy   Difficulty = iota // 100% disparos aleatorios
	Medium                   // aleatorio + "modo cacería" tras un acierto
	// Hard se implementa en la Fase 2 (Algoritmo de Paridad + deducción
	// de orientación del barco).
)

// CPU representa al oponente virtual.
type CPU struct {
	Difficulty Difficulty

	huntMode bool
	lastHit  *Coordinate
}

// NextShot decide la siguiente casilla a disparar según la dificultad.
func (c *CPU) NextShot(board *Board) Coordinate {
	if c.Difficulty == Medium && c.huntMode && c.lastHit != nil {
		// TODO: priorizar casillas adyacentes a lastHit antes de
		// volver a disparar al azar.
	}

	return Coordinate{
		X: rand.Intn(board.Size),
		Y: rand.Intn(board.Size),
	}
}

// RegisterResult actualiza el estado interno de la CPU tras un disparo,
// activando el modo cacería en dificultad Media cuando hay un acierto.
func (c *CPU) RegisterResult(shot Coordinate, hit bool) {
	if c.Difficulty != Medium {
		return
	}
	if hit {
		c.huntMode = true
		c.lastHit = &shot
	}
	// TODO: desactivar huntMode cuando el barco impactado se hunda.
}
