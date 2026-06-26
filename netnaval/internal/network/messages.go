package network

import "encoding/json"

// MsgType identifica el tipo de mensaje en el protocolo LAN.
type MsgType = string

const (
	// Colocación y lobby
	MsgReady MsgType = "ready" // jugador terminó de colocar barcos
	MsgStart MsgType = "start" // host → cliente: batalla comienza (host va primero)

	// Batalla
	MsgFire       MsgType = "fire"        // atacante → defensor: coordenada de disparo
	MsgFireResult MsgType = "fire_result" // defensor → atacante: resultado del disparo

	// Chat
	MsgChat MsgType = "chat"

	// Control
	MsgDisconnect MsgType = "disconnect"
)

// Envelope es el sobre que envuelve cualquier mensaje de red.
type Envelope struct {
	Type    MsgType         `json:"type"`
	Payload json.RawMessage `json:"payload,omitempty"`
}

// FireCoord es el payload de MsgFire.
type FireCoord struct {
	X int `json:"x"`
	Y int `json:"y"`
}

// FireResultPayload es el payload de MsgFireResult.
type FireResultPayload struct {
	X        int    `json:"x"`
	Y        int    `json:"y"`
	Hit      bool   `json:"hit"`
	Sunk     bool   `json:"sunk"`
	ShipName string `json:"shipName,omitempty"`
	ShipSize int    `json:"shipSize,omitempty"`
}

// ChatPayload es el payload de MsgChat.
type ChatPayload struct {
	Sender  string `json:"sender"`
	Content string `json:"content"`
}

// Encode serializes a payload into a json.RawMessage.
func Encode(v interface{}) (json.RawMessage, error) {
	return json.Marshal(v)
}
