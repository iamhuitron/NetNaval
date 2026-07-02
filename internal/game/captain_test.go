package game

import "testing"

// ── Roster ────────────────────────────────────────────────────────────

func TestCaptainRosterHasThree(t *testing.T) {
	roster := CaptainRoster()
	if len(roster) != 3 {
		t.Fatalf("se esperaban 3 capitanes, hay %d", len(roster))
	}
	for _, c := range roster {
		if c.Ability.UsesLeft != c.Ability.MaxUses {
			t.Errorf("%s: UsesLeft debe igualar MaxUses al inicio (%d != %d)",
				c.Name, c.Ability.UsesLeft, c.Ability.MaxUses)
		}
		if c.Ability.MaxUses <= 0 {
			t.Errorf("%s: MaxUses debe ser positivo", c.Name)
		}
	}
}

func TestFindCaptainValid(t *testing.T) {
	c, err := FindCaptain(CaptainDrake)
	if err != nil {
		t.Fatal(err)
	}
	if c.ID != CaptainDrake {
		t.Errorf("ID esperado %d, obtuve %d", CaptainDrake, c.ID)
	}
}

func TestFindCaptainInvalid(t *testing.T) {
	if _, err := FindCaptain(999); err == nil {
		t.Error("debe fallar para un ID de capitán inexistente")
	}
}

// ── Radar (Drake) ────────────────────────────────────────────────────

func TestExecRadarDetectsShipsInArea(t *testing.T) {
	b := NewBoard(10)
	b.PlaceShip(&Ship{Name: "T", Size: 2}, Coordinate{5, 5}, Horizontal)

	hits := execRadar(b, 5, 5) // centro exacto sobre el barco
	if len(hits) == 0 {
		t.Error("el radar debería detectar el barco en el área 3×3")
	}
}

func TestExecRadarEmptyArea(t *testing.T) {
	b := NewBoard(10)
	// Sin barcos en el tablero
	hits := execRadar(b, 0, 0)
	if len(hits) != 0 {
		t.Errorf("área vacía no debería reportar detecciones, obtuvo %d", len(hits))
	}
}

func TestExecRadarRespectsBounds(t *testing.T) {
	b := NewBoard(10)
	b.PlaceShip(&Ship{Name: "T", Size: 1}, Coordinate{0, 0}, Horizontal)
	// Centro en la esquina: el área 3×3 se sale del tablero en 5 de 9 celdas
	hits := execRadar(b, 0, 0)
	if len(hits) != 1 {
		t.Errorf("debería detectar exactamente 1 barco sin pánico por límites, obtuvo %d", len(hits))
	}
}

// ── Disparo en Línea (Blackwood) ────────────────────────────────────

func TestExecLineShotHitsEntireRow(t *testing.T) {
	b := NewBoard(10)
	b.PlaceShip(&Ship{Name: "T", Size: 3}, Coordinate{2, 4}, Horizontal)

	results := execLineShot(b, 4)
	if len(results) != 10 {
		t.Fatalf("debe disparar las 10 celdas de la fila, disparó %d", len(results))
	}
	hits := 0
	for _, r := range results {
		if r.Hit {
			hits++
		}
	}
	if hits != 3 {
		t.Errorf("se esperaban 3 impactos (tamaño del barco), hubo %d", hits)
	}
}

func TestExecLineShotSkipsAlreadyFired(t *testing.T) {
	b := NewBoard(10)
	b.Fire(Coordinate{0, 3}) // disparo previo manual

	results := execLineShot(b, 3)
	if len(results) != 9 {
		t.Errorf("debe omitir la celda ya disparada (9 nuevas), obtuvo %d", len(results))
	}
}

// ── Session.UseAbility ───────────────────────────────────────────────

func newBattleSession(captainID CaptainID) *Session {
	s := NewSession(Easy, captainID)
	s.AutoPlace()
	s.StartBattle()
	return s
}

func TestUseAbilityRequiresBattlePhase(t *testing.T) {
	s := NewSession(Easy, CaptainDrake)
	// Aún en colocación, no en batalla
	if _, err := s.UseAbility(5, 5); err == nil {
		t.Error("debe fallar fuera de la fase de batalla")
	}
}

func TestUseAbilityRequiresCaptain(t *testing.T) {
	s := newBattleSession(CaptainNone)
	if _, err := s.UseAbility(5, 5); err == nil {
		t.Error("debe fallar sin capitán seleccionado")
	}
}

func TestUseAbilityDrakeRadar(t *testing.T) {
	s := newBattleSession(CaptainDrake)
	initialUses := s.GetAbilityInfo().UsesLeft

	result, err := s.UseAbility(5, 5)
	if err != nil {
		t.Fatal(err)
	}
	if !result.Activated {
		t.Error("el radar debe marcarse como activado")
	}
	if s.GetAbilityInfo().UsesLeft != initialUses-1 {
		t.Error("debe consumir un uso del radar")
	}
}

func TestUseAbilityBlackwoodLineShot(t *testing.T) {
	s := newBattleSession(CaptainBlackwood)
	result, err := s.UseAbility(0, 5) // y=5 es la fila objetivo
	if err != nil {
		t.Fatal(err)
	}
	if len(result.LineResults) == 0 {
		t.Error("el disparo en línea debe producir resultados")
	}
	if s.GetAbilityInfo().UsesLeft != 0 {
		t.Error("Blackwood solo tiene 1 uso, debe quedar en 0")
	}
}

func TestUseAbilityVossSmokeScreen(t *testing.T) {
	s := newBattleSession(CaptainVoss)
	result, err := s.UseAbility(0, 0)
	if err != nil {
		t.Fatal(err)
	}
	if !result.Activated || result.TurnsLeft != 2 {
		t.Errorf("la cortina de humo debe activarse con 2 turnos, obtuvo turnsLeft=%d", result.TurnsLeft)
	}
	if s.State().SmokeScreen != 2 {
		t.Error("SessionState debe reflejar 2 turnos de cortina activos")
	}
}

func TestUseAbilityFailsWhenDepleted(t *testing.T) {
	s := newBattleSession(CaptainBlackwood) // maxUses = 1
	if _, err := s.UseAbility(0, 0); err != nil {
		t.Fatal(err)
	}
	// Segundo uso: ya no quedan
	if _, err := s.UseAbility(0, 1); err == nil {
		t.Error("debe fallar al intentar usar una habilidad agotada")
	}
}

// ── Analytics ─────────────────────────────────────────────────────────

func TestBuildReportEmpty(t *testing.T) {
	r := BuildReport(nil, 10)
	if r.TotalShots != 0 || r.Accuracy != 0 {
		t.Error("un historial vacío debe producir un reporte en cero")
	}
}

func TestBuildReportBasicStats(t *testing.T) {
	shots := []ShotRecord{
		{X: 0, Y: 0, Hit: true, Sunk: false, Turn: 1},
		{X: 1, Y: 0, Hit: true, Sunk: true, Turn: 2},
		{X: 5, Y: 5, Hit: false, Sunk: false, Turn: 3},
		{X: 6, Y: 5, Hit: false, Sunk: false, Turn: 4},
	}
	r := BuildReport(shots, 10)

	if r.TotalShots != 4 {
		t.Errorf("TotalShots esperado 4, obtuvo %d", r.TotalShots)
	}
	if r.TotalHits != 2 {
		t.Errorf("TotalHits esperado 2, obtuvo %d", r.TotalHits)
	}
	if r.Accuracy != 50.0 {
		t.Errorf("Accuracy esperada 50.0, obtuvo %.1f", r.Accuracy)
	}
	if r.BestStreak != 2 {
		t.Errorf("BestStreak esperado 2 (dos impactos seguidos), obtuvo %d", r.BestStreak)
	}
}

func TestBuildReportHeatMapDimensions(t *testing.T) {
	shots := []ShotRecord{{X: 3, Y: 3, Hit: true, Turn: 1}}
	r := BuildReport(shots, 10)

	if len(r.HeatMap) != 10 {
		t.Fatalf("el mapa de calor debe tener 10 filas, tiene %d", len(r.HeatMap))
	}
	if r.HeatMap[3][3] != 1 {
		t.Errorf("la celda (3,3) debe registrar 1 disparo, tiene %d", r.HeatMap[3][3])
	}
	if r.HeatMap[0][0] != 0 {
		t.Error("una celda sin disparos debe quedar en 0")
	}
}

func TestBuildReportSectorBiasSumsTo100(t *testing.T) {
	shots := []ShotRecord{
		{X: 0, Y: 0, Hit: false, Turn: 1}, // top-left
		{X: 9, Y: 0, Hit: false, Turn: 2}, // top-right
		{X: 0, Y: 9, Hit: false, Turn: 3}, // bottom-left
		{X: 9, Y: 9, Hit: false, Turn: 4}, // bottom-right
	}
	r := BuildReport(shots, 10)
	total := r.SectorBias.TopLeft + r.SectorBias.TopRight +
		r.SectorBias.BottomLeft + r.SectorBias.BottomRight
	if total < 99.9 || total > 100.1 {
		t.Errorf("los 4 sectores deben sumar ~100%%, sumaron %.2f", total)
	}
}

func TestBuildReportStreakResetsOnMiss(t *testing.T) {
	shots := []ShotRecord{
		{X: 0, Y: 0, Hit: true, Turn: 1},
		{X: 1, Y: 0, Hit: true, Turn: 2},
		{X: 2, Y: 0, Hit: false, Turn: 3}, // rompe la racha
		{X: 3, Y: 0, Hit: true, Turn: 4},
	}
	r := BuildReport(shots, 10)
	if r.BestStreak != 2 {
		t.Errorf("la mejor racha debe quedar en 2 (no 3), obtuvo %d", r.BestStreak)
	}
}

// ── Session.GetReport integración ───────────────────────────────────

func TestSessionGetReportAfterShots(t *testing.T) {
	s := newBattleSession(CaptainNone)
	s.PlayerFire(0, 0)
	s.PlayerFire(1, 0)

	report := s.GetReport()
	if report.TotalShots < 2 {
		t.Errorf("el reporte debe reflejar al menos 2 disparos del jugador, tiene %d",
			report.TotalShots)
	}
}
