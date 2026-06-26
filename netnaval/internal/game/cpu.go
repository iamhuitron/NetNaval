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

	// huntQueue contiene las casillas candidatas a disparar a
	// continuación porque son adyacentes a un acierto reciente.
	// Solo se usa en dificultad Media.
	huntQueue []Coordinate
}

// NextShot decide la siguiente casilla a disparar según la dificultad.
func (c *CPU) NextShot(board *Board) Coordinate {
	if c.Difficulty == Medium {
		for len(c.huntQueue) > 0 {
			candidate := c.huntQueue[0]
			c.huntQueue = c.huntQueue[1:]
			if board.InBounds(candidate) && !fired(board.Cells[candidate.Y][candidate.X]) {
				return candidate
			}
		}
	}
	return c.randomUnfiredShot(board)
}

func (c *CPU) randomUnfiredShot(board *Board) Coordinate {
	for {
		candidate := Coordinate{X: rand.Intn(board.Size), Y: rand.Intn(board.Size)}
		if !fired(board.Cells[candidate.Y][candidate.X]) {
			return candidate
		}
	}
}

// RegisterResult actualiza el estado interno de la CPU tras un disparo.
// En dificultad Media: si acierta, encola las casillas adyacentes
// (modo cacería); si hunde el barco, abandona la cacería y vuelve al
// disparo aleatorio.
func (c *CPU) RegisterResult(shot Coordinate, hit bool, sunk bool) {
	if c.Difficulty != Medium {
		return
	}

	if sunk {
		c.huntQueue = nil
		return
	}

	if hit {
		c.huntQueue = append(c.huntQueue,
			Coordinate{X: shot.X + 1, Y: shot.Y},
			Coordinate{X: shot.X - 1, Y: shot.Y},
			Coordinate{X: shot.X, Y: shot.Y + 1},
			Coordinate{X: shot.X, Y: shot.Y - 1},
		)
	}
}
