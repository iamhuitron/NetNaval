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
	s := &Ship{Name: "T", Size: 3}
	if err := b.PlaceShip(s, Coordinate{0, 0}, Horizontal); err != nil {
		t.Fatal(err)
	}
	for x := 0; x < 3; x++ {
		if b.Cells[0][x] != CellShip {
			t.Errorf("celda (%d,0) debe ser CellShip", x)
		}
	}
}

func TestPlaceShipVertical(t *testing.T) {
	b := NewBoard(10)
	s := &Ship{Name: "T", Size: 3}
	if err := b.PlaceShip(s, Coordinate{0, 0}, Vertical); err != nil {
		t.Fatal(err)
	}
	for y := 0; y < 3; y++ {
		if b.Cells[y][0] != CellShip {
			t.Errorf("celda (0,%d) debe ser CellShip", y)
		}
	}
}

func TestPlaceShipOutOfBounds(t *testing.T) {
	b := NewBoard(10)
	if err := b.PlaceShip(&Ship{Name: "T", Size: 5}, Coordinate{8, 0}, Horizontal); err == nil {
		t.Error("debe rechazar barco fuera del tablero")
	}
}

func TestPlaceShipOverlap(t *testing.T) {
	b := NewBoard(10)
	b.PlaceShip(&Ship{Name: "A", Size: 3}, Coordinate{0, 0}, Horizontal)
	if err := b.PlaceShip(&Ship{Name: "B", Size: 3}, Coordinate{2, 0}, Horizontal); err == nil {
		t.Error("debe rechazar barcos solapados")
	}
}

func TestFireMiss(t *testing.T) {
	b := NewBoard(10)
	r, err := b.Fire(Coordinate{5, 5})
	if err != nil {
		t.Fatal(err)
	}
	if r.Hit || b.Cells[5][5] != CellMiss {
		t.Error("disparo sin barco debe ser agua")
	}
}

func TestFireHitAndSunk(t *testing.T) {
	b := NewBoard(10)
	b.PlaceShip(&Ship{Name: "T", Size: 2}, Coordinate{3, 3}, Horizontal)

	r1, _ := b.Fire(Coordinate{3, 3})
	if !r1.Hit || r1.Sunk {
		t.Error("primer impacto: hit=true, sunk=false")
	}
	r2, _ := b.Fire(Coordinate{4, 3})
	if !r2.Hit || !r2.Sunk {
		t.Error("segundo impacto hunde el barco")
	}
	if r2.ShipSize != 2 {
		t.Errorf("ShipSize esperado 2, obtuve %d", r2.ShipSize)
	}
	if b.Cells[3][3] != CellSunk || b.Cells[3][4] != CellSunk {
		t.Error("las celdas deben quedar como CellSunk")
	}
}

func TestFireAlreadyFired(t *testing.T) {
	b := NewBoard(10)
	b.Fire(Coordinate{0, 0})
	r, _ := b.Fire(Coordinate{0, 0})
	if !r.AlreadyFired {
		t.Error("debe indicar AlreadyFired")
	}
}

func TestAllSunk(t *testing.T) {
	b := NewBoard(10)
	b.PlaceShip(&Ship{Name: "T", Size: 2}, Coordinate{0, 0}, Horizontal)
	if b.AllSunk() {
		t.Error("no debe estar hundido antes de disparar")
	}
	b.Fire(Coordinate{0, 0})
	b.Fire(Coordinate{1, 0})
	if !b.AllSunk() {
		t.Error("debe estar hundido tras hundir toda la flota")
	}
}

func TestFogOfWar(t *testing.T) {
	b := NewBoard(10)
	b.PlaceShip(&Ship{Name: "T", Size: 2}, Coordinate{0, 0}, Horizontal)

	fog := b.View(false)
	if fog.Cells[0][0] != "empty" {
		t.Error("fog of war debe ocultar barcos")
	}
	visible := b.View(true)
	if visible.Cells[0][0] != "ship" {
		t.Error("con revealShips=true debe mostrar barcos")
	}
}

func TestAutoPlaceFleet(t *testing.T) {
	b := NewBoard(10)
	fleet := NewClassicFleet()
	if err := b.AutoPlaceFleet(fleet); err != nil {
		t.Fatal(err)
	}
	for _, s := range fleet {
		if len(s.Positions) == 0 {
			t.Errorf("barco %q sin colocar", s.Name)
		}
	}
}

// ── CPU ───────────────────────────────────────────────────────────────

func TestCPUEasyInBounds(t *testing.T) {
	b := NewBoard(10)
	b.AutoPlaceFleet(NewClassicFleet())
	cpu := &CPU{Difficulty: Easy}
	for i := 0; i < 30; i++ {
		shot := cpu.NextShot(b)
		if !b.InBounds(shot) {
			t.Fatalf("CPU Easy disparo fuera del tablero: %+v", shot)
		}
	}
}

func TestCPUMediumHuntsAfterHit(t *testing.T) {
	cpu := &CPU{Difficulty: Medium}
	cpu.RegisterResult(Coordinate{5, 5}, true, false)
	if len(cpu.huntQueue) == 0 {
		t.Error("modo cacería debe tener candidatos tras un impacto")
	}
}

func TestCPUMediumClearsOnSunk(t *testing.T) {
	cpu := &CPU{Difficulty: Medium}
	cpu.huntQueue = []Coordinate{{1, 1}, {2, 1}}
	cpu.RegisterResult(Coordinate{1, 1}, true, true)
	if len(cpu.huntQueue) != 0 {
		t.Error("la cola debe limpiarse al hundir el barco")
	}
}

func TestCPUHardParityCells(t *testing.T) {
	b := NewBoard(10)
	b.AutoPlaceFleet(NewClassicFleet())
	cpu := &CPU{Difficulty: Hard}

	// En el barrido de paridad, todas las celdas deben tener (x+y)%2==0
	// hasta que se activa el modo cacería
	parityViolations := 0
	for i := 0; i < 20; i++ {
		shot := cpu.NextShot(b)
		if (shot.X+shot.Y)%2 != 0 {
			parityViolations++
		}
		b.Cells[shot.Y][shot.X] = CellMiss // simular disparo al agua
	}
	if parityViolations > 0 {
		t.Errorf("Hard CPU violó la paridad %d veces en la fase de barrido", parityViolations)
	}
}

func TestCPUHardDirectionDeduction(t *testing.T) {
	cpu := &CPU{Difficulty: Hard}

	// Simular dos impactos horizontales en y=3: (2,3) y (3,3)
	cpu.RegisterResult(Coordinate{2, 3}, true, false)
	cpu.RegisterResult(Coordinate{3, 3}, true, false)

	if cpu.huntDir != 1 {
		t.Errorf("debe deducir dirección horizontal (1), obtuvo %d", cpu.huntDir)
	}
	// La cola debe extenderse horizontalmente: (4,3) y (1,3)
	expectedX := map[int]bool{4: true, 1: true}
	for _, c := range cpu.huntQueue {
		if c.Y != 3 {
			t.Errorf("candidato (%d,%d) debe tener Y=3", c.X, c.Y)
		}
		if !expectedX[c.X] {
			t.Errorf("candidato (%d,%d) inesperado en cola", c.X, c.Y)
		}
	}
}

func TestCPUHardVerticalDeduction(t *testing.T) {
	cpu := &CPU{Difficulty: Hard}
	cpu.RegisterResult(Coordinate{5, 2}, true, false)
	cpu.RegisterResult(Coordinate{5, 3}, true, false)

	if cpu.huntDir != 2 {
		t.Errorf("debe deducir dirección vertical (2), obtuvo %d", cpu.huntDir)
	}
	for _, c := range cpu.huntQueue {
		if c.X != 5 {
			t.Errorf("candidato (%d,%d) debe tener X=5", c.X, c.Y)
		}
	}
}

func TestCPUHardClearsOnSunk(t *testing.T) {
	cpu := &CPU{Difficulty: Hard}
	cpu.RegisterResult(Coordinate{2, 3}, true, false)
	cpu.RegisterResult(Coordinate{3, 3}, true, false)
	cpu.RegisterResult(Coordinate{4, 3}, true, true) // hundimiento
	if len(cpu.huntQueue) != 0 || len(cpu.hitLine) != 0 || cpu.huntDir != 0 {
		t.Error("al hundir debe limpiar toda la información de cacería")
	}
}

func TestCPUHardCoverageEfficiency(t *testing.T) {
	// En un tablero vacío, el barrido de paridad debe cubrir exactamente 50 celdas
	b := NewBoard(10)
	cpu := &CPU{Difficulty: Hard}
	cpu.initParity(b)
	if len(cpu.parityCells) != 50 {
		t.Errorf("el barrido de paridad debe tener 50 celdas en tablero 10x10, obtuvo %d",
			len(cpu.parityCells))
	}
}

// ── Session ───────────────────────────────────────────────────────────

func TestSessionPlacementPhase(t *testing.T) {
	s := NewSession(Easy)
	if s.State().Phase != PhasePlacement {
		t.Error("sesión nueva debe estar en colocación")
	}
}

func TestSessionAutoPlaceAndStart(t *testing.T) {
	s := NewSession(Easy)
	if err := s.AutoPlace(); err != nil {
		t.Fatal(err)
	}
	if err := s.StartBattle(); err != nil {
		t.Fatal(err)
	}
	st := s.State()
	if st.Phase != PhaseBattle || st.CurrentTurn != "player" {
		t.Error("tras StartBattle: fase=battle, turno=player")
	}
}

func TestSessionStartRequiresAllShips(t *testing.T) {
	if err := NewSession(Easy).StartBattle(); err == nil {
		t.Error("StartBattle debe fallar sin barcos colocados")
	}
}

func TestSessionPlayerFireAndResponse(t *testing.T) {
	s := NewSession(Easy)
	s.AutoPlace()
	s.StartBattle()
	if err := s.PlayerFire(0, 0); err != nil {
		t.Fatal(err)
	}
	st := s.State()
	if st.Phase == PhaseGameOver {
		return // victoria instantánea: válida
	}
	if st.CurrentTurn != "player" {
		t.Errorf("tras el ciclo completo debe ser turno del jugador, es '%s'", st.CurrentTurn)
	}
}

func TestSessionRemoveShip(t *testing.T) {
	s := NewSession(Easy)
	s.PlaceShip(0, 0, 0, true)
	if !s.State().Fleet[0].Placed {
		t.Error("barco debe estar colocado")
	}
	s.RemoveShip(0)
	if s.State().Fleet[0].Placed {
		t.Error("barco debe estar retirado")
	}
}

func TestSessionHardDifficulty(t *testing.T) {
	s := NewSession(Hard)
	s.AutoPlace()
	s.StartBattle()
	// Verificar que la CPU Hard no se queda atascada
	for i := 0; i < 50; i++ {
		if err := s.PlayerFire(i%10, i/10); err != nil {
			continue
		}
		if s.State().Phase == PhaseGameOver {
			return // todo bien
		}
	}
}

// ── LANSession ────────────────────────────────────────────────────────

func TestLANSessionPlacementAndAutoPlace(t *testing.T) {
	ls := NewLANSession()
	if ls.State().Phase != PhasePlacement {
		t.Error("LANSession debe empezar en colocación")
	}
	if err := ls.AutoPlace(); err != nil {
		t.Fatal(err)
	}
	if !ls.AllPlaced() {
		t.Error("todos los barcos deben estar colocados")
	}
}

func TestLANSessionFireExchange(t *testing.T) {
	a := NewLANSession()
	b := NewLANSession()
	a.AutoPlace()
	b.AutoPlace()
	a.StartBattle(true)
	b.StartBattle(false)

	if err := a.RegisterFire(0, 0); err != nil {
		t.Fatal(err)
	}
	if a.MyTurn {
		t.Error("tras RegisterFire el turno debe ser del rival")
	}

	result, err := b.ReceiveOpponentFire(0, 0)
	if err != nil {
		t.Fatal(err)
	}

	a.ConfirmFireResult(0, 0, result.Hit, result.Sunk, result.ShipName, result.ShipSize)
	if a.State().Phase != PhaseGameOver && a.MyTurn {
		t.Error("tras confirmar resultado el turno debe ser del rival")
	}
}
