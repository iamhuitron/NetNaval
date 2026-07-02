package network

import (
	"encoding/json"
	"fmt"
	"net"
	"sync"
	"time"
)

// DiscoveryPort es el puerto UDP para el anuncio de partidas LAN.
const DiscoveryPort = DefaultPort + 1 // 7343

// Announce es el mensaje que el host emite periódicamente por UDP broadcast.
type Announce struct {
	App  string `json:"app"`  // "NetNaval" — permite ignorar otros broadcasts
	Ver  string `json:"ver"`  // "1"
	Name string `json:"name"` // nombre visible de la partida
	IP   string `json:"ip"`
	Port int    `json:"port"`
}

// DiscoveredGame representa una partida LAN encontrada por el Scanner.
type DiscoveredGame struct {
	Name   string    `json:"name"`
	IP     string    `json:"ip"`
	Port   int       `json:"port"`
	SeenAt time.Time `json:"-"`
}

// Addr devuelve la dirección TCP de la partida.
func (g DiscoveredGame) Addr() string {
	return fmt.Sprintf("%s:%d", g.IP, g.Port)
}

// ──────────────────────────────────────────────────────────────────────
// Broadcaster — el host emite su IP cada 2 s
// ──────────────────────────────────────────────────────────────────────

// Broadcaster envía anuncios UDP broadcast periódicamente.
type Broadcaster struct {
	conn *net.UDPConn
	ann  []byte
	stop chan struct{}
	once sync.Once
}

// NewBroadcaster crea un Broadcaster listo para empezar.
// gameName es el nombre mostrable de la partida.
func NewBroadcaster(localIP, gameName string) (*Broadcaster, error) {
	conn, err := net.DialUDP("udp4", nil, &net.UDPAddr{
		IP:   net.IPv4bcast,
		Port: DiscoveryPort,
	})
	if err != nil {
		return nil, fmt.Errorf("broadcaster dial: %w", err)
	}
	data, _ := json.Marshal(Announce{
		App:  "NetNaval",
		Ver:  "1",
		Name: gameName,
		IP:   localIP,
		Port: DefaultPort,
	})
	return &Broadcaster{conn: conn, ann: data, stop: make(chan struct{})}, nil
}

// Start lanza el bucle de broadcast en segundo plano.
func (b *Broadcaster) Start() {
	go func() {
		b.send()
		t := time.NewTicker(2 * time.Second)
		defer t.Stop()
		for {
			select {
			case <-t.C:
				b.send()
			case <-b.stop:
				return
			}
		}
	}()
}

func (b *Broadcaster) send() { b.conn.Write(b.ann) }

// Stop detiene el broadcast y cierra el socket.
func (b *Broadcaster) Stop() {
	b.once.Do(func() { close(b.stop); b.conn.Close() })
}

// ──────────────────────────────────────────────────────────────────────
// Scanner — el cliente escucha broadcasts
// ──────────────────────────────────────────────────────────────────────

// Scanner escucha broadcasts UDP y mantiene una lista de partidas activas.
type Scanner struct {
	conn *net.UDPConn
	mu   sync.Mutex
	list map[string]*DiscoveredGame // clave: "ip:port"
	stop chan struct{}
	once sync.Once

	// OnUpdate se llama cada vez que cambia la lista de partidas.
	OnUpdate func(games []DiscoveredGame)
}

// NewScanner crea un Scanner listo para empezar.
func NewScanner() (*Scanner, error) {
	// Intentar el puerto fijo, luego uno aleatorio como fallback
	conn, err := net.ListenUDP("udp4", &net.UDPAddr{Port: DiscoveryPort})
	if err != nil {
		conn, err = net.ListenUDP("udp4", &net.UDPAddr{})
		if err != nil {
			return nil, fmt.Errorf("scanner listen: %w", err)
		}
	}
	return &Scanner{
		conn: conn,
		list: make(map[string]*DiscoveredGame),
		stop: make(chan struct{}),
	}, nil
}

// Start lanza el bucle de escucha y el proceso de expiración en segundo plano.
func (s *Scanner) Start() {
	go s.readLoop()
	go s.expireLoop()
}

func (s *Scanner) readLoop() {
	buf := make([]byte, 1024)
	for {
		s.conn.SetReadDeadline(time.Now().Add(3 * time.Second))
		n, _, err := s.conn.ReadFromUDP(buf)
		select {
		case <-s.stop:
			return
		default:
		}
		if err != nil {
			continue
		}

		var ann Announce
		if err := json.Unmarshal(buf[:n], &ann); err != nil || ann.App != "NetNaval" {
			continue
		}

		key := ann.Addr()
		game := &DiscoveredGame{
			Name:   ann.Name,
			IP:     ann.IP,
			Port:   ann.Port,
			SeenAt: time.Now(),
		}

		s.mu.Lock()
		_, existed := s.list[key]
		s.list[key] = game
		s.mu.Unlock()

		if !existed {
			s.notify()
		}
	}
}

// expireLoop elimina partidas que no se han anunciado en los últimos 8 s.
func (s *Scanner) expireLoop() {
	t := time.NewTicker(4 * time.Second)
	defer t.Stop()
	for {
		select {
		case <-s.stop:
			return
		case <-t.C:
			s.mu.Lock()
			changed := false
			for k, g := range s.list {
				if time.Since(g.SeenAt) > 8*time.Second {
					delete(s.list, k)
					changed = true
				}
			}
			s.mu.Unlock()
			if changed {
				s.notify()
			}
		}
	}
}

func (s *Scanner) notify() {
	if s.OnUpdate == nil {
		return
	}
	s.OnUpdate(s.Games())
}

// Games devuelve una copia de la lista actual de partidas descubiertas.
func (s *Scanner) Games() []DiscoveredGame {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]DiscoveredGame, 0, len(s.list))
	for _, g := range s.list {
		out = append(out, *g)
	}
	return out
}

// Stop detiene el scanner.
func (s *Scanner) Stop() {
	s.once.Do(func() { close(s.stop); s.conn.Close() })
}

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

func (a Announce) Addr() string { return fmt.Sprintf("%s:%d", a.IP, a.Port) }
