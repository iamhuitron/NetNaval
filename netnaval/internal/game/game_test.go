package game

import (
	"testing"
)

// ── Board ─────────────────────────────────────────────────────────────

func TestNewBoard(t *testing.T) {
	b := NewBoard(10)
	if b.Size != 10 {
		t.Fatalf("tamaño esperado 10, obtuve %d", b.Size)
	}
	for y := range b.Cells {
		for x := range b.Cells[y] {
			if b.Cells[y][x] != CellEmpty {
				t.Errorf("celda (%d,%d) debería ser CellEmpty", x, y)
			}
		}
	}
}

func TestPlaceShipHorizontal(t *testing.T) {
	b := NewBoard(10)
	ship := &Ship{Name: "Test", Size: 3}
	if err := b.PlaceShip(ship, Coordinate{0, 0}, Horizontal); err != nil {
		t.Fatalf("PlaceShip falló: %v", err)
	}
	for x := 0; x < 3; x++ {
		if b.Cells[0][x] != CellShip {
			t.Errorf("celda (%d,0) debería ser CellShip", x)
		}
	}
}

func TestPlaceShipVertical(t *testing.T) {
	b := NewBoard(10)
	ship := &Ship{Name: "Test", Size: 3}
	if err := b.PlaceShip(ship, Coordinate{0, 0}, Vertical); err != nil {
		t.Fatalf("PlaceShip falló: %v", err)
	}
	for y := 0; y < 3; y++ {
		if b.Cells[y][0] != CellShip {
			t.Errorf("celda (0,%d) debería ser CellShip", y)
		}
	}
}

func TestPlaceShipOutOfBounds(t *testing.T) {
	b := NewBoard(10)
	ship := &Ship{Name: "Test", Size: 5}
	if err := b.PlaceShip(ship, Coordinate{8, 0}, Horizontal); err == nil {
		t.Error("debería rechazar barco fuera del tablero")
	}
}

func TestPlaceShipOverlap(t *testing.T) {
	b := NewBoard(10)
	a := &Ship{Name: "A", Size: 3}
	bb := &Ship{Name: "B", Size: 3}
	b.PlaceShip(a, Coordinate{0, 0}, Horizontal)
	if err := b.PlaceShip(bb, Coordinate{2, 0}, Horizontal); err == nil {
		t.Error("debería rechazar barcos solapados")
	}
}

func TestFireMiss(t *testing.T) {
	b := NewBoard(10)
	r, err := b.Fire(Coordinate{5, 5})
	if err != nil {
		t.Fatal(err)
	}
	if r.Hit {
		t.Error("debería ser agua")
	}
	if b.Cells[5][5] != CellMiss {
		t.Error("celda debería quedar como CellMiss")
	}
}

func TestFireHitNoSunk(t *testing.T) {
	b := NewBoard(10)
	ship := &Ship{Name: "Test", Size: 2}
	b.PlaceShip(ship, Coordinate{3, 3}, Horizontal)

	r, err := b.Fire(Coordinate{3, 3})
	if err != nil {
		t.Fatal(err)
	}
	if !r.Hit {
		t.Error("debería ser impacto")
	}
	if r.Sunk {
		t.Error("no debería estar hundido (solo 1 de 2 celdas)")
	}
	if b.Cells[3][3] != CellHit {
		t.Error("celda debería ser CellHit")
	}
}

func TestFireSunk(t *testing.T) {
	b := NewBoard(10)
	ship := &Ship{Name: "Test", Size: 1}
	b.PlaceShip(ship, Coordinate{0, 0}, Horizontal)

	r, err := b.Fire(Coordinate{0, 0})
	if err != nil {
		t.Fatal(err)
	}
	if !r.Hit || !r.Sunk {
		t.Error("debería ser hundimiento")
	}
	if r.ShipSize != 1 {
		t.Errorf("ShipSize esperado 1, obtuve %d", r.ShipSize)
	}
	if b.Cells[0][0] != CellSunk {
		t.Error("celda debería ser CellSunk")
	}
}

func TestFireAlreadyFired(t *testing.T) {
	b := NewBoard(10)
	b.Fire(Coordinate{0, 0})
	r, err := b.Fire(Coordinate{0, 0})
	if err != nil {
		t.Fatal(err)
	}
	if !r.AlreadyFired {
		t.Error("debería indicar AlreadyFired")
	}
}

func TestAllSunk(t *testing.T) {
	b := NewBoard(10)
	ship := &Ship{Name: "Test", Size: 2}
	b.PlaceShip(ship, Coordinate{0, 0}, Horizontal)

	if b.AllSunk() {
		t.Error("no deberían estar hundidos antes de disparar")
	}
	b.Fire(Coordinate{0, 0})
	b.Fire(Coordinate{1, 0})
	if !b.AllSunk() {
		t.Error("deberían estar hundidos tras destruir toda la flota")
	}
}

func TestAutoPlaceFleet(t *testing.T) {
	b := NewBoard(10)
	fleet := NewClassicFleet()
	if err := b.AutoPlaceFleet(fleet); err != nil {
		t.Fatalf("AutoPlaceFleet falló: %v", err)
	}
	for _, ship := range fleet {
		if len(ship.Positions) == 0 {
			t.Errorf("barco %q no fue colocado", ship.Name)
		}
	}
}

func TestFogOfWar(t *testing.T) {
	b := NewBoard(10)
	ship := &Ship{Name: "Test", Size: 2}
	b.PlaceShip(ship, Coordinate{0, 0}, Horizontal)

	view := b.View(false) // fog of war
	if view.Cells[0][0] != "empty" {
		t.Error("fog of war debería ocultar los barcos")
	}

	view = b.View(true) // revelar
	if view.Cells[0][0] != "ship" {
		t.Error("con revealShips=true debería mostrar el barco")
	}
}

// ── CPU ───────────────────────────────────────────────────────────────

func TestCPUEasyInBounds(t *testing.T) {
	b := NewBoard(10)
	fleet := NewClassicFleet()
	b.AutoPlaceFleet(fleet)

	cpu := &CPU{Difficulty: Easy}
	for i := 0; i < 20; i++ {
		shot := cpu.NextShot(b)
		if !b.InBounds(shot) {
			t.Fatalf("disparo CPU fuera del tablero: %+v", shot)
		}
	}
}

func TestCPUMediumHuntsAfterHit(t *testing.T) {
	b := NewBoard(10)
	ship := &Ship{Name: "Test", Size: 4}
	b.PlaceShip(ship, Coordinate{5, 5}, Horizontal)

	cpu := &CPU{Difficulty: Medium}
	hit := Coordinate{5, 5}
	b.Cells[5][5] = CellHit // simular disparo previo

	cpu.RegisterResult(hit, true, false)
	if len(cpu.huntQueue) == 0 {
		t.Error("modo cacería debería tener casillas en cola tras un impacto")
	}
}

func TestCPUMediumClearsQueueOnSunk(t *testing.T) {
	cpu := &CPU{Difficulty: Medium}
	cpu.huntQueue = []Coordinate{{1, 1}, {2, 1}}
	cpu.RegisterResult(Coordinate{1, 1}, true, true) // hundido
	if len(cpu.huntQueue) != 0 {
		t.Error("modo cacería debería limpiar la cola al hundir el barco")
	}
}

// ── Session ───────────────────────────────────────────────────────────

func TestSessionPlacementPhase(t *testing.T) {
	s := NewSession(Easy)
	if s.State().Phase != PhasePlacement {
		t.Error("sesión nueva debería empezar en colocación")
	}
}

func TestSessionAutoPlaceAndStart(t *testing.T) {
	s := NewSession(Easy)
	if err := s.AutoPlace(); err != nil {
		t.Fatalf("AutoPlace falló: %v", err)
	}
	if err := s.StartBattle(); err != nil {
		t.Fatalf("StartBattle falló: %v", err)
	}
	state := s.State()
	if state.Phase != PhaseBattle {
		t.Error("debería estar en fase de batalla")
	}
	if state.CurrentTurn != "player" {
		t.Error("el jugador debería ir primero")
	}
}

func TestSessionStartRequiresAllShips(t *testing.T) {
	s := NewSession(Easy)
	if err := s.StartBattle(); err == nil {
		t.Error("StartBattle debería fallar si no se colocaron todos los barcos")
	}
}

func TestSessionPlayerFireAndCPUResponds(t *testing.T) {
	s := NewSession(Easy)
	s.AutoPlace()
	s.StartBattle()

	before := s.State().CurrentTurn
	if before != "player" {
		t.Fatal("se esperaba turno del jugador")
	}

	if err := s.PlayerFire(0, 0); err != nil {
		t.Fatalf("PlayerFire falló: %v", err)
	}

	state := s.State()
	// Después del turno completo (jugador + CPU): vuelve a ser "player"
	// a menos que la partida haya terminado.
	if state.Phase == PhaseGameOver {
		return // victoria rápida: válido en tests con Easy
	}
	if state.CurrentTurn != "player" {
		t.Errorf("debería ser turno del jugador de nuevo, es '%s'", state.CurrentTurn)
	}
}

func TestSessionRemoveShip(t *testing.T) {
	s := NewSession(Easy)
	if err := s.PlaceShip(0, 0, 0, true); err != nil {
		t.Fatal(err)
	}
	if s.State().Fleet[0].Placed == false {
		t.Error("barco debería aparecer como colocado")
	}
	if err := s.RemoveShip(0); err != nil {
		t.Fatalf("RemoveShip falló: %v", err)
	}
	if s.State().Fleet[0].Placed {
		t.Error("barco debería aparecer como no colocado tras retirarlo")
	}
}

// ── LANSession ────────────────────────────────────────────────────────

func TestLANSessionPlacementAndReady(t *testing.T) {
	ls := NewLANSession()
	if ls.State().Phase != PhasePlacement {
		t.Error("LANSession nueva debería estar en colocación")
	}
	if err := ls.AutoPlace(); err != nil {
		t.Fatalf("LANSession.AutoPlace falló: %v", err)
	}
	if !ls.AllPlaced() {
		t.Error("todos los barcos deberían estar colocados")
	}
}

func TestLANSessionFireExchange(t *testing.T) {
	// Jugador A dispara a Jugador B
	a := NewLANSession()
	b := NewLANSession()
	a.AutoPlace()
	b.AutoPlace()
	a.StartBattle(true)
	b.StartBattle(false)

	// A registra disparo a (0,0)
	if err := a.RegisterFire(0, 0); err != nil {
		t.Fatalf("RegisterFire falló: %v", err)
	}
	if a.MyTurn {
		t.Error("después de RegisterFire el turno debería ser del rival")
	}

	// B recibe el disparo
	result, err := b.ReceiveOpponentFire(0, 0)
	if err != nil {
		t.Fatalf("ReceiveOpponentFire falló: %v", err)
	}

	// A recibe el resultado
	a.ConfirmFireResult(0, 0, result.Hit, result.Sunk, result.ShipName, result.ShipSize)
	// Ahora le toca al rival (B) o A ganó
	if a.State().Phase != PhaseGameOver {
		if a.MyTurn {
			t.Error("después del resultado, le debería tocar al rival")
		}
	}
}
