package online

import (
	"encoding/binary"
	"fmt"
	"net"
	"time"
)

// TryNATPMP intenta abrir el puerto mediante NAT-PMP (RFC 6886).
// Es un protocolo UDP mucho más simple que UPnP, soportado por la mayoría
// de routers Apple y muchos routers modernos con firmware actualizado.
func TryNATPMP(port uint16, timeout time.Duration) MapResult {
	if timeout == 0 {
		timeout = 3 * time.Second
	}

	gateway, err := guessGateway()
	if err != nil {
		return MapResult{Err: fmt.Errorf("NAT-PMP: no se pudo determinar el gateway: %w", err)}
	}

	// Paso 1: obtener IP pública via NAT-PMP
	extIP, err := natpmpExternalIP(gateway, timeout/2)
	if err != nil {
		return MapResult{Err: fmt.Errorf("NAT-PMP getExternalIP: %w", err)}
	}

	// Paso 2: solicitar mapeo de puerto
	if err := natpmpMapPort(gateway, port, timeout/2); err != nil {
		// Tenemos la IP aunque el mapeo falle
		return MapResult{ExternalIP: extIP, Err: fmt.Errorf("NAT-PMP mapPort: %w", err)}
	}

	return MapResult{ExternalIP: extIP, Success: true}
}

// guessGateway deriva la IP del gateway a partir de la IP local.
// En la mayoría de redes domésticas el gateway es X.X.X.1.
func guessGateway() (string, error) {
	// Establecer una conexión UDP ficticia para obtener la IP local saliente
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		return "", err
	}
	defer conn.Close()

	localIP := conn.LocalAddr().(*net.UDPAddr).IP.To4()
	if localIP == nil {
		return "", fmt.Errorf("solo IPv4 soportado")
	}
	// Reemplazar el último octeto con 1 (192.168.1.X → 192.168.1.1)
	return fmt.Sprintf("%d.%d.%d.1", localIP[0], localIP[1], localIP[2]), nil
}

// natpmpExternalIP envía una solicitud GetExternalAddress al gateway.
func natpmpExternalIP(gateway string, timeout time.Duration) (string, error) {
	conn, err := net.DialUDP("udp4", nil, &net.UDPAddr{
		IP:   net.ParseIP(gateway),
		Port: 5351,
	})
	if err != nil {
		return "", err
	}
	defer conn.Close()
	conn.SetDeadline(time.Now().Add(timeout))

	// Solicitud: versión=0, opcode=0 (GetExternalAddress)
	req := []byte{0, 0}
	if _, err := conn.Write(req); err != nil {
		return "", err
	}

	buf := make([]byte, 12)
	if _, err := conn.Read(buf); err != nil {
		return "", err
	}
	if len(buf) < 12 || buf[0] != 0 || buf[1] != 128 {
		return "", fmt.Errorf("respuesta NAT-PMP inválida")
	}
	result := binary.BigEndian.Uint16(buf[2:4])
	if result != 0 {
		return "", fmt.Errorf("NAT-PMP error code %d", result)
	}

	ip := net.IP(buf[8:12]).String()
	return ip, nil
}

// natpmpMapPort solicita un mapeo TCP port→port con lifetime de 3600s.
func natpmpMapPort(gateway string, port uint16, timeout time.Duration) error {
	conn, err := net.DialUDP("udp4", nil, &net.UDPAddr{
		IP:   net.ParseIP(gateway),
		Port: 5351,
	})
	if err != nil {
		return err
	}
	defer conn.Close()
	conn.SetDeadline(time.Now().Add(timeout))

	// Solicitud de mapeo TCP (opcode=2):
	// [0]=version [1]=opcode [2-3]=reserved [4-5]=internal_port
	// [6-7]=external_port [8-11]=lifetime
	req := make([]byte, 12)
	req[0] = 0   // version
	req[1] = 2   // opcode: map TCP
	// reserved: 0,0
	binary.BigEndian.PutUint16(req[4:], port)  // internal port
	binary.BigEndian.PutUint16(req[6:], port)  // external port (mismo)
	binary.BigEndian.PutUint32(req[8:], 3600)  // lifetime = 1 hora

	if _, err := conn.Write(req); err != nil {
		return err
	}

	buf := make([]byte, 16)
	if _, err := conn.Read(buf); err != nil {
		return err
	}
	if len(buf) < 16 || buf[1] != 130 { // opcode de respuesta = 128 + 2
		return fmt.Errorf("respuesta NAT-PMP de mapeo inválida")
	}
	code := binary.BigEndian.Uint16(buf[2:4])
	if code != 0 {
		return fmt.Errorf("NAT-PMP mapeo rechazado, código %d", code)
	}
	return nil
}
