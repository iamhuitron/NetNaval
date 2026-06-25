package network

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"sync"
)

const DefaultPort = 7342

// Manager gestiona la conexión TCP con el otro jugador.
// Expone callbacks para recibir mensajes y eventos de conexión.
type Manager struct {
	role string // "host" | "client"

	conn     net.Conn
	listener net.Listener
	scanner  *bufio.Scanner
	enc      *json.Encoder
	mu       sync.Mutex

	// Callbacks (se asignan antes de WaitForClient / NewClient)
	OnMessage    func(Envelope)
	OnConnect    func()
	OnDisconnect func(error)
}

// NewHost crea un servidor TCP en el puerto por defecto.
// Llama a WaitForClient() para bloquear hasta que el cliente conecte.
func NewHost() (*Manager, error) {
	l, err := net.Listen("tcp", fmt.Sprintf(":%d", DefaultPort))
	if err != nil {
		return nil, fmt.Errorf("no se pudo iniciar el servidor en :%d: %w", DefaultPort, err)
	}
	return &Manager{role: "host", listener: l}, nil
}

// NewClient conecta a un host. ip puede ser solo la IP (puerto fijo)
// o una dirección completa "ip:puerto".
func NewClient(ip string) (*Manager, error) {
	addr := ip
	if _, _, err := net.SplitHostPort(ip); err != nil {
		addr = fmt.Sprintf("%s:%d", ip, DefaultPort)
	}
	conn, err := net.Dial("tcp", addr)
	if err != nil {
		return nil, fmt.Errorf("no se pudo conectar a %s: %w", addr, err)
	}
	m := &Manager{
		role:    "client",
		conn:    conn,
		scanner: bufio.NewScanner(conn),
		enc:     json.NewEncoder(conn),
	}
	go m.readLoop()
	return m, nil
}

// WaitForClient bloquea hasta que un cliente se conecta (solo modo host).
func (m *Manager) WaitForClient() error {
	conn, err := m.listener.Accept()
	if err != nil {
		return fmt.Errorf("error esperando cliente: %w", err)
	}
	m.mu.Lock()
	m.conn = conn
	m.scanner = bufio.NewScanner(conn)
	m.enc = json.NewEncoder(conn)
	m.mu.Unlock()

	go m.readLoop()

	if m.OnConnect != nil {
		m.OnConnect()
	}
	return nil
}

func (m *Manager) readLoop() {
	for {
		if !m.scanner.Scan() {
			err := m.scanner.Err()
			if err == nil {
				err = io.EOF
			}
			if m.OnDisconnect != nil {
				m.OnDisconnect(err)
			}
			return
		}
		var env Envelope
		if err := json.Unmarshal(m.scanner.Bytes(), &env); err != nil {
			continue // mensaje malformado: ignorar
		}
		if m.OnMessage != nil {
			m.OnMessage(env)
		}
	}
}

// Send serializa el payload y lo envía al peer como una línea JSON.
func (m *Manager) Send(msgType MsgType, payload interface{}) error {
	var raw json.RawMessage
	if payload != nil {
		b, err := json.Marshal(payload)
		if err != nil {
			return err
		}
		raw = b
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.enc == nil {
		return fmt.Errorf("no hay conexión activa")
	}
	return m.enc.Encode(Envelope{Type: msgType, Payload: raw})
}

// IsHost informa si este nodo es el host.
func (m *Manager) IsHost() bool { return m.role == "host" }

// Role devuelve "host" o "client".
func (m *Manager) Role() string { return m.role }

// Close cierra la conexión y el listener (si los hay).
func (m *Manager) Close() {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.conn != nil {
		m.conn.Close()
	}
	if m.listener != nil {
		m.listener.Close()
	}
}

// LocalIP devuelve la IP local principal (la que se mostrará al host).
func LocalIP() string {
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		return "127.0.0.1"
	}
	defer conn.Close()
	return conn.LocalAddr().(*net.UDPAddr).IP.String()
}
