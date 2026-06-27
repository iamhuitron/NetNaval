package game

import "math/rand"

// Difficulty representa el nivel de la CPU.
type Difficulty int

const (
	Easy   Difficulty = iota // disparos 100% aleatorios
	Medium                   // aleatorio + modo cacería tras un impacto
	Hard                     // Algoritmo de Paridad + deducción de orientación
)

// CPU representa al oponente virtual.
type CPU struct {
	Difficulty Difficulty

	// ── Modo cacería (Medium + Hard) ──────────────────────────────────
	huntQueue []Coordinate // candidatos priorizados tras un acierto

	// ── Hard: deducción de orientación del barco ──────────────────────
	hitLine   []Coordinate // serie de impactos consecutivos en el barco actual
	huntDir   int          // 0=desconocida  1=horizontal  2=vertical

	// ── Hard: barrido de paridad ──────────────────────────────────────
	parityCells []Coordinate // celdas (x+y)%2==0 aún no disparadas, en orden aleatorio
	parityReady bool
}

// ── API pública ────────────────────────────────────────────────────────

// NextShot devuelve la siguiente celda a disparar según la dificultad.
func (c *CPU) NextShot(board *Board) Coordinate {
	switch c.Difficulty {
	case Hard:
		return c.nextHard(board)
	case Medium:
		return c.nextMedium(board)
	default:
		return c.randomUnfired(board)
	}
}

// RegisterResult actualiza el estado interno de la CPU tras un disparo.
func (c *CPU) RegisterResult(shot Coordinate, hit, sunk bool) {
	switch c.Difficulty {
	case Medium:
		c.registerMedium(shot, hit, sunk)
	case Hard:
		c.registerHard(shot, hit, sunk)
	}
}

// ── Easy ───────────────────────────────────────────────────────────────

func (c *CPU) randomUnfired(board *Board) Coordinate {
	// Búsqueda aleatoria con fallback sistemático para evitar bucle infinito
	for range 300 {
		cand := Coordinate{X: rand.Intn(board.Size), Y: rand.Intn(board.Size)}
		if !fired(board.Cells[cand.Y][cand.X]) {
			return cand
		}
	}
	for y := range board.Size {
		for x := range board.Size {
			if !fired(board.Cells[y][x]) {
				return Coordinate{X: x, Y: y}
			}
		}
	}
	return Coordinate{}
}

// ── Medium ────────────────────────────────────────────────────────────

func (c *CPU) nextMedium(board *Board) Coordinate {
	for len(c.huntQueue) > 0 {
		cand := c.huntQueue[0]
		c.huntQueue = c.huntQueue[1:]
		if board.InBounds(cand) && !fired(board.Cells[cand.Y][cand.X]) {
			return cand
		}
	}
	return c.randomUnfired(board)
}

func (c *CPU) registerMedium(shot Coordinate, hit, sunk bool) {
	if sunk {
		c.huntQueue = nil
		return
	}
	if hit {
		c.huntQueue = append(c.huntQueue, adjacents(shot)...)
	}
}

// ── Hard ───────────────────────────────────────────────────────────────

func (c *CPU) nextHard(board *Board) Coordinate {
	// 1. Cola de cacería dirigida (tiene prioridad absoluta)
	for len(c.huntQueue) > 0 {
		cand := c.huntQueue[0]
		c.huntQueue = c.huntQueue[1:]
		if board.InBounds(cand) && !fired(board.Cells[cand.Y][cand.X]) {
			return cand
		}
	}
	// 2. Barrido de paridad
	return c.nextParity(board)
}

// nextParity devuelve la siguiente celda del barrido de paridad.
// El tablero se cubre en el patrón de ajedrez (x+y)%2==0, que garantiza
// impactar todo barco de tamaño ≥ 2 con ≤ 50 disparos.
func (c *CPU) nextParity(board *Board) Coordinate {
	if !c.parityReady {
		c.initParity(board)
	}
	for len(c.parityCells) > 0 {
		cand := c.parityCells[0]
		c.parityCells = c.parityCells[1:]
		if !fired(board.Cells[cand.Y][cand.X]) {
			return cand
		}
	}
	// Fallback: todas las celdas de paridad agotadas
	return c.randomUnfired(board)
}

func (c *CPU) initParity(board *Board) {
	c.parityCells = nil
	for y := range board.Size {
		for x := range board.Size {
			if (x+y)%2 == 0 {
				c.parityCells = append(c.parityCells, Coordinate{X: x, Y: y})
			}
		}
	}
	// Mezclar para que el patrón no sea predecible
	rand.Shuffle(len(c.parityCells), func(i, j int) {
		c.parityCells[i], c.parityCells[j] = c.parityCells[j], c.parityCells[i]
	})
	c.parityReady = true
}

func (c *CPU) registerHard(shot Coordinate, hit, sunk bool) {
	if sunk {
		// Barco hundido: limpiar toda la información de cacería
		c.huntQueue = nil
		c.hitLine = nil
		c.huntDir = 0
		return
	}
	if !hit {
		return
	}

	c.hitLine = append(c.hitLine, shot)

	if len(c.hitLine) == 1 {
		// Primer impacto: probar las 4 direcciones adyacentes
		c.huntQueue = adjacents(shot)
		return
	}

	// Dos o más impactos: deducir orientación del barco
	c.deduceDirection()
	c.buildDirectedQueue()
}

// deduceDirection determina si los impactos actuales forman una línea
// horizontal o vertical.
func (c *CPU) deduceDirection() {
	if len(c.hitLine) < 2 {
		return
	}
	first, last := c.hitLine[0], c.hitLine[len(c.hitLine)-1]
	if first.Y == last.Y {
		c.huntDir = 1 // horizontal
	} else {
		c.huntDir = 2 // vertical
	}
}

// buildDirectedQueue reemplaza la cola por extensiones en la dirección deducida,
// priorizando los extremos más alejados de la secuencia de impactos.
func (c *CPU) buildDirectedQueue() {
	if c.huntDir == 0 {
		return
	}
	// Calcular extremos de los impactos actuales
	minX, maxX := c.hitLine[0].X, c.hitLine[0].X
	minY, maxY := c.hitLine[0].Y, c.hitLine[0].Y
	for _, p := range c.hitLine {
		if p.X < minX {
			minX = p.X
		}
		if p.X > maxX {
			maxX = p.X
		}
		if p.Y < minY {
			minY = p.Y
		}
		if p.Y > maxY {
			maxY = p.Y
		}
	}

	c.huntQueue = nil
	if c.huntDir == 1 { // horizontal: extender izquierda y derecha
		c.huntQueue = []Coordinate{
			{X: maxX + 1, Y: minY},
			{X: minX - 1, Y: minY},
		}
	} else { // vertical: extender abajo y arriba
		c.huntQueue = []Coordinate{
			{X: minX, Y: maxY + 1},
			{X: minX, Y: minY - 1},
		}
	}
}

// ── Helpers ────────────────────────────────────────────────────────────

func adjacents(c Coordinate) []Coordinate {
	return []Coordinate{
		{X: c.X + 1, Y: c.Y},
		{X: c.X - 1, Y: c.Y},
		{X: c.X, Y: c.Y + 1},
		{X: c.X, Y: c.Y - 1},
	}
}
