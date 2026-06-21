package chat

import "time"

// Message representa un mensaje de chat intercambiado entre jugadores.
// La etiqueta json es necesaria para que Wails serialice correctamente
// la struct al cruzar el binding hacia React.
type Message struct {
	Sender    string    `json:"sender"`
	Content   string    `json:"content"`
	Timestamp time.Time `json:"timestamp"`
}

// TODO (Fase 1): conectar con runtime.EventsEmit / EventsOn de Wails
// para transmitir mensajes en tiempo real entre el backend de Go y
// los componentes de React, en paralelo a la partida.
