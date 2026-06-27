package online

import (
	"fmt"
	"net"
	"strconv"
	"strings"
)

// Port es el puerto TCP fijo de NetNaval.
const Port = 7342

// codeLen es la longitud fija del Room Code (7 caracteres base36
// cubren todo el espacio IPv4: 36^7 = 78B > 2^32 = 4.3B).
const codeLen = 7

// IPToCode codifica una IPv4 como código alfanumérico de 7 caracteres
// en mayúsculas. Ejemplo: 192.168.1.5 → "2LFKZL5"
func IPToCode(ip net.IP) (string, error) {
	ip4 := ip.To4()
	if ip4 == nil {
		return "", fmt.Errorf("solo se soportan direcciones IPv4")
	}
	n := uint64(ip4[0])<<24 | uint64(ip4[1])<<16 | uint64(ip4[2])<<8 | uint64(ip4[3])
	raw := strings.ToUpper(strconv.FormatUint(n, 36))
	// Rellenar con ceros hasta codeLen
	if len(raw) < codeLen {
		raw = strings.Repeat("0", codeLen-len(raw)) + raw
	}
	return raw, nil
}

// CodeToAddr decodifica un Room Code y devuelve la dirección TCP "ip:puerto".
// Acepta mayúsculas, minúsculas y espacios extra.
func CodeToAddr(code string) (string, error) {
	code = strings.TrimSpace(strings.ToUpper(code))
	if code == "" {
		return "", fmt.Errorf("el código no puede estar vacío")
	}
	if len(code) > codeLen {
		return "", fmt.Errorf("el código debe tener %d caracteres (recibido: %d)", codeLen, len(code))
	}

	n, err := strconv.ParseUint(strings.ToLower(code), 36, 64)
	if err != nil {
		return "", fmt.Errorf("código inválido — usa solo letras (A-Z) y números")
	}
	if n > 0xFFFFFFFF {
		return "", fmt.Errorf("código fuera de rango")
	}

	ip := net.IPv4(byte(n>>24), byte(n>>16), byte(n>>8), byte(n))
	return fmt.Sprintf("%s:%d", ip.String(), Port), nil
}

// CodeToIP decodifica un Room Code y devuelve solo la IP.
func CodeToIP(code string) (net.IP, error) {
	addr, err := CodeToAddr(code)
	if err != nil {
		return nil, err
	}
	host, _, _ := net.SplitHostPort(addr)
	return net.ParseIP(host), nil
}
