package online

import (
	"encoding/xml"
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"
	"time"
)

// MapResult es el resultado de un intento de apertura de puerto por UPnP.
type MapResult struct {
	ExternalIP string // IP pública obtenida del router
	Success    bool
	Err        error
}

// TryUPnP intenta abrir el puerto TCP en el router vía UPnP/IGD.
// Falla de forma silenciosa: nunca bloquea más de `timeout`.
func TryUPnP(localIP string, port uint16, timeout time.Duration) MapResult {
	if timeout == 0 {
		timeout = 5 * time.Second
	}

	dev, err := discoverIGD(timeout / 2)
	if err != nil {
		return MapResult{Err: fmt.Errorf("UPnP: %w", err)}
	}

	extIP, err := dev.getExternalIP()
	if err != nil {
		return MapResult{Err: fmt.Errorf("UPnP getExternalIP: %w", err)}
	}

	if err := dev.addPortMapping(localIP, port); err != nil {
		// Devolver la IP aunque el mapeo falle
		return MapResult{ExternalIP: extIP, Err: fmt.Errorf("UPnP addPortMapping: %w", err)}
	}

	return MapResult{ExternalIP: extIP, Success: true}
}

// ──────────────────────────────────────────────────────────────────────
// SSDP Discovery
// ──────────────────────────────────────────────────────────────────────

type igdDevice struct {
	serviceType string
	controlURL  string
}

var ssdpTargets = []string{
	"urn:schemas-upnp-org:service:WANIPConnection:1",
	"urn:schemas-upnp-org:service:WANIPConnection:2",
	"urn:schemas-upnp-org:service:WANPPPConnection:1",
	"urn:schemas-upnp-org:device:InternetGatewayDevice:1",
}

func discoverIGD(timeout time.Duration) (*igdDevice, error) {
	conn, err := net.ListenUDP("udp4", &net.UDPAddr{})
	if err != nil {
		return nil, err
	}
	defer conn.Close()
	conn.SetDeadline(time.Now().Add(timeout))

	dst := &net.UDPAddr{IP: net.ParseIP("239.255.255.250"), Port: 1900}
	for _, st := range ssdpTargets {
		msg := "M-SEARCH * HTTP/1.1\r\n" +
			"HOST: 239.255.255.250:1900\r\n" +
			"MAN: \"ssdp:discover\"\r\n" +
			"MX: 2\r\n" +
			"ST: " + st + "\r\n\r\n"
		conn.WriteToUDP([]byte(msg), dst)
	}

	buf := make([]byte, 4096)
	for {
		n, _, err := conn.ReadFromUDP(buf)
		if err != nil {
			break
		}
		location := ssdpHeader(string(buf[:n]), "LOCATION")
		if location == "" {
			continue
		}
		dev, err := parseIGD(location)
		if err == nil {
			return dev, nil
		}
	}
	return nil, fmt.Errorf("no se encontró gateway UPnP en la red")
}

func ssdpHeader(response, name string) string {
	for _, line := range strings.Split(response, "\n") {
		line = strings.TrimRight(line, "\r")
		parts := strings.SplitN(line, ":", 2)
		if len(parts) == 2 && strings.EqualFold(parts[0], name) {
			return strings.TrimSpace(parts[1])
		}
	}
	return ""
}

// ──────────────────────────────────────────────────────────────────────
// Device description XML parsing
// ──────────────────────────────────────────────────────────────────────

type deviceDesc struct {
	URLBase string    `xml:"URLBase"`
	Device  deviceEl  `xml:"device"`
}

type deviceEl struct {
	Services  []serviceEl `xml:"serviceList>service"`
	SubDevs   []deviceEl  `xml:"deviceList>device"`
}

type serviceEl struct {
	ServiceType string `xml:"serviceType"`
	ControlURL  string `xml:"controlURL"`
}

func parseIGD(location string) (*igdDevice, error) {
	client := &http.Client{Timeout: 4 * time.Second}
	resp, err := client.Get(location)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 128*1024))
	if err != nil {
		return nil, err
	}

	var desc deviceDesc
	if err := xml.Unmarshal(body, &desc); err != nil {
		return nil, err
	}

	// Base URL para resolver URLs relativas
	base := strings.TrimRight(desc.URLBase, "/")
	if base == "" {
		if parts := strings.SplitN(location, "/", 4); len(parts) >= 3 {
			base = parts[0] + "//" + parts[2]
		}
	}

	// Buscar WANIPConnection (o WANPPPConnection) en todos los niveles
	if dev := findService(desc.Device, base); dev != nil {
		return dev, nil
	}
	return nil, fmt.Errorf("no se encontró servicio WANIPConnection en %s", location)
}

func findService(d deviceEl, base string) *igdDevice {
	for _, svc := range d.Services {
		if strings.Contains(svc.ServiceType, "WANIPConnection") ||
			strings.Contains(svc.ServiceType, "WANPPPConnection") {
			ctrl := svc.ControlURL
			if !strings.HasPrefix(ctrl, "http") {
				ctrl = base + "/" + strings.TrimLeft(ctrl, "/")
			}
			return &igdDevice{serviceType: svc.ServiceType, controlURL: ctrl}
		}
	}
	for _, sub := range d.SubDevs {
		if dev := findService(sub, base); dev != nil {
			return dev
		}
	}
	return nil
}

// ──────────────────────────────────────────────────────────────────────
// SOAP requests
// ──────────────────────────────────────────────────────────────────────

func (d *igdDevice) soap(action, body string) (string, error) {
	envelope := `<?xml version="1.0"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body>` +
		body + `</s:Body></s:Envelope>`

	req, err := http.NewRequest("POST", d.controlURL, strings.NewReader(envelope))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", `text/xml; charset="utf-8"`)
	req.Header.Set("SOAPAction", `"`+d.serviceType+`#`+action+`"`)

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(io.LimitReader(resp.Body, 64*1024))
	if err != nil {
		return "", err
	}
	if resp.StatusCode != 200 {
		return "", fmt.Errorf("SOAP %d: %s", resp.StatusCode, strings.TrimSpace(string(respBody)))
	}
	return string(respBody), nil
}

func (d *igdDevice) getExternalIP() (string, error) {
	resp, err := d.soap("GetExternalIPAddress",
		`<u:GetExternalIPAddress xmlns:u="`+d.serviceType+`"/>`)
	if err != nil {
		return "", err
	}
	start := strings.Index(resp, "<NewExternalIPAddress>")
	end := strings.Index(resp, "</NewExternalIPAddress>")
	if start < 0 || end <= start {
		return "", fmt.Errorf("IP externa no encontrada en respuesta SOAP")
	}
	return resp[start+22 : end], nil
}

func (d *igdDevice) addPortMapping(localIP string, port uint16) error {
	body := fmt.Sprintf(
		`<u:AddPortMapping xmlns:u="%s">`+
			`<NewRemoteHost></NewRemoteHost>`+
			`<NewExternalPort>%d</NewExternalPort>`+
			`<NewProtocol>TCP</NewProtocol>`+
			`<NewInternalPort>%d</NewInternalPort>`+
			`<NewInternalClient>%s</NewInternalClient>`+
			`<NewEnabled>1</NewEnabled>`+
			`<NewPortMappingDescription>NetNaval</NewPortMappingDescription>`+
			`<NewLeaseDuration>3600</NewLeaseDuration>`+
			`</u:AddPortMapping>`,
		d.serviceType, port, port, localIP,
	)
	_, err := d.soap("AddPortMapping", body)
	return err
}
