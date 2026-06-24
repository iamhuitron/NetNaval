package chat

import (
	"fmt"
	"time"
)

// Message representa un mensaje en el panel lateral de la partida.
// kind="chat"  → mensaje escrito por el jugador
// kind="event" → mensaje automático del sistema (impacto, hundimiento, etc.)
type Message struct {
	ID        string    `json:"id"`
	Sender    string    `json:"sender"`
	Content   string    `json:"content"`
	Timestamp time.Time `json:"timestamp"`
	Kind      string    `json:"kind"`
}

var counter int

func newID() string {
	counter++
	return fmt.Sprintf("%d-%d", time.Now().UnixMilli(), counter)
}

// NewMessage crea un mensaje de chat del jugador.
func NewMessage(sender, content string) Message {
	return Message{
		ID:        newID(),
		Sender:    sender,
		Content:   content,
		Timestamp: time.Now(),
		Kind:      "chat",
	}
}

// NewEvent crea un mensaje automático del sistema.
func NewEvent(content string) Message {
	return Message{
		ID:        newID(),
		Sender:    "sistema",
		Content:   content,
		Timestamp: time.Now(),
		Kind:      "event",
	}
}
