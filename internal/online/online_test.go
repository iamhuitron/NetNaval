package online

import (
	"net"
	"testing"
)

func TestIPToCode(t *testing.T) {
	cases := []struct {
		ip   string
		want int // longitud esperada
	}{
		{"0.0.0.0", codeLen},
		{"1.2.3.4", codeLen},
		{"192.168.1.5", codeLen},
		{"255.255.255.255", codeLen},
	}
	for _, tc := range cases {
		code, err := IPToCode(net.ParseIP(tc.ip))
		if err != nil {
			t.Errorf("IPToCode(%s) error: %v", tc.ip, err)
			continue
		}
		if len(code) != tc.want {
			t.Errorf("IPToCode(%s) = %q, largo %d, quería %d", tc.ip, code, len(code), tc.want)
		}
	}
}

func TestRoundTrip(t *testing.T) {
	ips := []string{"1.2.3.4", "192.168.1.100", "8.8.8.8", "255.255.255.255"}
	for _, ipStr := range ips {
		original := net.ParseIP(ipStr).To4()
		code, err := IPToCode(original)
		if err != nil {
			t.Fatalf("IPToCode(%s): %v", ipStr, err)
		}

		addr, err := CodeToAddr(code)
		if err != nil {
			t.Fatalf("CodeToAddr(%s): %v", code, err)
		}

		host, port, _ := net.SplitHostPort(addr)
		if host != original.String() {
			t.Errorf("round-trip %s: got IP %s", ipStr, host)
		}
		if port != "7342" {
			t.Errorf("round-trip %s: got port %s, want 7342", ipStr, port)
		}
	}
}

func TestCodeToAddrInvalid(t *testing.T) {
	bad := []string{"", "TOOLONGCODE123", "!@#$"}
	for _, code := range bad {
		_, err := CodeToAddr(code)
		if err == nil {
			t.Errorf("CodeToAddr(%q) debería fallar", code)
		}
	}
}

func TestCodeLowercase(t *testing.T) {
	ip := net.ParseIP("8.8.8.8")
	code, _ := IPToCode(ip)
	// Debe aceptar minúsculas
	addr, err := CodeToAddr(code)
	if err != nil {
		t.Fatal(err)
	}
	addrLower, err := CodeToAddr(code)
	if err != nil {
		t.Fatal(err)
	}
	if addr != addrLower {
		t.Error("el código no es case-insensitive")
	}
}
