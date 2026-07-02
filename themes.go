package main

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// Theme define los tokens de color y tipografía de un tema visual.
type Theme struct {
	Name    string     `json:"name"`
	ID      string     `json:"id"`
	Colors  ThemeColors `json:"colors"`
}

// ThemeColors contiene las variables CSS del tema.
type ThemeColors struct {
	Background  string `json:"background"`
	Surface     string `json:"surface"`
	Border      string `json:"border"`
	Accent      string `json:"accent"`
	AccentText  string `json:"accentText"`
	TextPrimary string `json:"textPrimary"`
	TextMuted   string `json:"textMuted"`
	CellEmpty   string `json:"cellEmpty"`
	CellShip    string `json:"cellShip"`
	CellHit     string `json:"cellHit"`
	CellMiss    string `json:"cellMiss"`
	CellSunk    string `json:"cellSunk"`
}

// DefaultThemes son los tres temas de fábrica de NetNaval.
var DefaultThemes = []Theme{
	{
		ID:   "classic",
		Name: "Classic Elegant",
		Colors: ThemeColors{
			Background:  "#020617",
			Surface:     "#0f172a",
			Border:      "#1e293b",
			Accent:      "#22d3ee",
			AccentText:  "#083344",
			TextPrimary: "#f1f5f9",
			TextMuted:   "#64748b",
			CellEmpty:   "#1e293b",
			CellShip:    "#1d4ed8",
			CellHit:     "#f97316",
			CellMiss:    "#334155",
			CellSunk:    "#991b1b",
		},
	},
	{
		ID:   "cyberpunk",
		Name: "Cyberpunk",
		Colors: ThemeColors{
			Background:  "#050014",
			Surface:     "#0d0028",
			Border:      "#2d0060",
			Accent:      "#f0f",
			AccentText:  "#200040",
			TextPrimary: "#e0ccff",
			TextMuted:   "#6b4fa0",
			CellEmpty:   "#110030",
			CellShip:    "#6600ff",
			CellHit:     "#ff2200",
			CellMiss:    "#2a0060",
			CellSunk:    "#aa0000",
		},
	},
	{
		ID:   "retro",
		Name: "Retro Terminal",
		Colors: ThemeColors{
			Background:  "#000c00",
			Surface:     "#001400",
			Border:      "#003000",
			Accent:      "#00ff41",
			AccentText:  "#000c00",
			TextPrimary: "#00cc33",
			TextMuted:   "#006618",
			CellEmpty:   "#001a00",
			CellShip:    "#007700",
			CellHit:     "#ffaa00",
			CellMiss:    "#002200",
			CellSunk:    "#cc3300",
		},
	},
}

// GetThemes devuelve los temas disponibles:
// primero lee themes.json en el directorio del ejecutable si existe;
// si no, devuelve los temas de fábrica.
func (a *App) GetThemes() []Theme {
	path := themeFilePath()
	if data, err := os.ReadFile(path); err == nil {
		var themes []Theme
		if json.Unmarshal(data, &themes) == nil && len(themes) > 0 {
			return themes
		}
	}
	return DefaultThemes
}

// SaveTheme guarda un tema personalizado en themes.json.
func (a *App) SaveTheme(theme Theme) error {
	themes := a.GetThemes()
	// Actualizar si ya existe, añadir si es nuevo
	found := false
	for i, t := range themes {
		if t.ID == theme.ID {
			themes[i] = theme
			found = true
			break
		}
	}
	if !found {
		themes = append(themes, theme)
	}
	data, err := json.MarshalIndent(themes, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(themeFilePath(), data, 0644)
}

func themeFilePath() string {
	exe, err := os.Executable()
	if err != nil {
		return "themes.json"
	}
	return filepath.Join(filepath.Dir(exe), "themes.json")
}
