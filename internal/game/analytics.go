package game

// AnalyticsReport es el informe completo generado al terminar una partida.
type AnalyticsReport struct {
	// Eficiencia general
	TotalShots  int     `json:"totalShots"`
	TotalHits   int     `json:"totalHits"`
	Accuracy    float64 `json:"accuracy"` // 0–100
	TurnsToWin  int     `json:"turnsToWin"`

	// Mapa de calor (10×10): número de disparos en cada celda propia (0 = nunca disparado)
	HeatMap     [][]int `json:"heatMap"`

	// Sectores preferidos (cuadrantes: TL, TR, BL, BR)
	SectorBias  SectorBias `json:"sectorBias"`

	// Racha más larga de impactos consecutivos
	BestStreak  int `json:"bestStreak"`

	// Promedio de turnos entre hundimientos sucesivos
	AvgTurnsPerSink float64 `json:"avgTurnsPerSink"`
}

// SectorBias muestra el porcentaje de disparos en cada cuadrante del tablero.
type SectorBias struct {
	TopLeft     float64 `json:"topLeft"`
	TopRight    float64 `json:"topRight"`
	BottomLeft  float64 `json:"bottomLeft"`
	BottomRight float64 `json:"bottomRight"`
}

// BuildReport construye el informe analítico a partir del historial de disparos
// del jugador y el tablero enemigo al final de la partida.
func BuildReport(shots []ShotRecord, boardSize int) AnalyticsReport {
	r := AnalyticsReport{}
	if len(shots) == 0 || boardSize == 0 {
		return r
	}

	half := boardSize / 2

	// Mapa de calor vacío
	heat := make([][]int, boardSize)
	for i := range heat {
		heat[i] = make([]int, boardSize)
	}

	var (
		hits       int
		streak     int
		bestStreak int
		sinkTurns  []int
		lastSink   int
	)

	for _, s := range shots {
		heat[s.Y][s.X]++
		if s.Hit {
			hits++
			streak++
			if streak > bestStreak {
				bestStreak = streak
			}
			if s.Sunk {
				sinkTurns = append(sinkTurns, s.Turn-lastSink)
				lastSink = s.Turn
			}
		} else {
			streak = 0
		}

		// Acumular sectores
		if s.X < half && s.Y < half {
			r.SectorBias.TopLeft++
		} else if s.X >= half && s.Y < half {
			r.SectorBias.TopRight++
		} else if s.X < half {
			r.SectorBias.BottomLeft++
		} else {
			r.SectorBias.BottomRight++
		}
	}

	total := float64(len(shots))
	r.TotalShots = len(shots)
	r.TotalHits = hits
	if total > 0 {
		r.Accuracy = float64(hits) / total * 100
	}
	r.HeatMap = heat
	r.BestStreak = bestStreak

	// Normalizar sectores a porcentajes
	r.SectorBias.TopLeft /= total / 100
	r.SectorBias.TopRight /= total / 100
	r.SectorBias.BottomLeft /= total / 100
	r.SectorBias.BottomRight /= total / 100

	// Promedio de turnos entre hundimientos
	if len(sinkTurns) > 0 {
		var sum int
		for _, t := range sinkTurns {
			sum += t
		}
		r.AvgTurnsPerSink = float64(sum) / float64(len(sinkTurns))
	}

	return r
}
