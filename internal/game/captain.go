package game

import "fmt"

// ── Identificadores ───────────────────────────────────────────────────

type CaptainID = int

const (
	CaptainNone      CaptainID = 0
	CaptainDrake     CaptainID = 1 // Ataque de Radar  — revela área 3×3
	CaptainBlackwood CaptainID = 2 // Disparo en Línea — dispara una fila entera
	CaptainVoss      CaptainID = 3 // Cortina de Humo  — CPU aleatoria 2 turnos
)

// ── Tipos exportados ──────────────────────────────────────────────────

// AbilityInfo describe el estado actual de una habilidad especial.
type AbilityInfo struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	MaxUses     int    `json:"maxUses"`
	UsesLeft    int    `json:"usesLeft"`
}

func (a *AbilityInfo) available() bool { return a.UsesLeft > 0 }

// CaptainProfile contiene el perfil completo de un capitán.
type CaptainProfile struct {
	ID          CaptainID   `json:"id"`
	Name        string      `json:"name"`
	Description string      `json:"description"`
	Emoji       string      `json:"emoji"`
	Ability     AbilityInfo `json:"ability"`
}

// AbilityResult es la respuesta devuelta al frontend tras usar una habilidad.
type AbilityResult struct {
	AbilityName string       `json:"abilityName"`
	UsesLeft    int          `json:"usesLeft"`
	// Radar: coordenadas donde se detectaron barcos enemigos
	RadarHits   []Coordinate `json:"radarHits,omitempty"`
	// LineShot: resultado de cada celda disparada en la fila
	LineResults []FireResult `json:"lineResults,omitempty"`
	// SmokeScreen
	Activated   bool         `json:"activated"`
	TurnsLeft   int          `json:"turnsLeft,omitempty"`
}

// ShotRecord almacena un disparo individual para análisis posterior.
type ShotRecord struct {
	X    int  `json:"x"`
	Y    int  `json:"y"`
	Hit  bool `json:"hit"`
	Sunk bool `json:"sunk"`
	Turn int  `json:"turn"`
}

// ── Roster ────────────────────────────────────────────────────────────

// CaptainRoster devuelve los tres capitanes disponibles.
func CaptainRoster() []CaptainProfile {
	return []CaptainProfile{
		{
			ID:          CaptainDrake,
			Name:        "Almirante Drake",
			Description: "Veterano de mil batallas con instinto sobrenatural para localizar flotas enemigas.",
			Emoji:       "🔭",
			Ability: AbilityInfo{
				Name:        "Ataque de Radar",
				Description: "Revela los barcos enemigos en un área de 3×3 sin disparar ni gastar turno.",
				Icon:        "📡",
				MaxUses:     2,
				UsesLeft:    2,
			},
		},
		{
			ID:          CaptainBlackwood,
			Name:        "Capitán Blackwood",
			Description: "Maestro de la artillería masiva, especializado en arrasar líneas completas del enemigo.",
			Emoji:       "💥",
			Ability: AbilityInfo{
				Name:        "Disparo en Línea",
				Description: "Dispara automáticamente a todas las casillas de una fila completa.",
				Icon:        "🚀",
				MaxUses:     1,
				UsesLeft:    1,
			},
		},
		{
			ID:          CaptainVoss,
			Name:        "Comandante Voss",
			Description: "Experto en guerra electrónica que ciega los sistemas de puntería del enemigo.",
			Emoji:       "🌫",
			Ability: AbilityInfo{
				Name:        "Cortina de Humo",
				Description: "El rival dispara de forma completamente aleatoria durante 2 turnos.",
				Icon:        "💨",
				MaxUses:     2,
				UsesLeft:    2,
			},
		},
	}
}

// FindCaptain busca un capitán por ID.
func FindCaptain(id CaptainID) (CaptainProfile, error) {
	for _, c := range CaptainRoster() {
		if c.ID == id {
			return c, nil
		}
	}
	return CaptainProfile{}, fmt.Errorf("capitán %d no existe", id)
}

// ── Implementaciones de habilidades ───────────────────────────────────

// execRadar revela las posiciones de barcos enemigos en un área 3×3
// alrededor de (x, y). No dispara ni gasta casillas.
func execRadar(board *Board, x, y int) []Coordinate {
	var hits []Coordinate
	for dy := -1; dy <= 1; dy++ {
		for dx := -1; dx <= 1; dx++ {
			c := Coordinate{X: x + dx, Y: y + dy}
			if board.InBounds(c) && board.Cells[c.Y][c.X] == CellShip {
				hits = append(hits, c)
			}
		}
	}
	return hits
}

// execLineShot dispara a todas las casillas de la fila `row`.
func execLineShot(board *Board, row int) []FireResult {
	var results []FireResult
	for x := 0; x < board.Size; x++ {
		r, _ := board.Fire(Coordinate{X: x, Y: row})
		if !r.AlreadyFired {
			results = append(results, r)
		}
	}
	return results
}
