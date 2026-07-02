package online

import (
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"
	"time"
)

// ipSources son servicios que devuelven la IP pública como texto plano.
var ipSources = []string{
	"https://api.ipify.org",
	"https://checkip.amazonaws.com",
	"https://icanhazip.com",
	"https://ip4.seeip.org",
}

// GetPublicIP obtiene la IP pública consultando servicios HTTP externos.
// Prueba cada fuente en orden y devuelve la primera respuesta válida.
func GetPublicIP() (string, error) {
	client := &http.Client{Timeout: 4 * time.Second}

	var lastErr error
	for _, url := range ipSources {
		resp, err := client.Get(url)
		if err != nil {
			lastErr = err
			continue
		}
		body, err := io.ReadAll(io.LimitReader(resp.Body, 64))
		resp.Body.Close()
		if err != nil {
			lastErr = err
			continue
		}
		ip := strings.TrimSpace(string(body))
		if net.ParseIP(ip) != nil {
			return ip, nil
		}
	}

	if lastErr != nil {
		return "", fmt.Errorf("no se pudo obtener IP pública: %w", lastErr)
	}
	return "", fmt.Errorf("ninguna fuente devolvió una IP válida")
}
