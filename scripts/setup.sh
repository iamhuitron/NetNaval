#!/usr/bin/env bash
# NetNaval — Setup inicial (ejecutar una sola vez después de clonar)
set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}✓${NC}  $1"; }
warn()  { echo -e "${YELLOW}!${NC}  $1"; }
die()   { echo -e "${RED}✗${NC}  $1"; exit 1; }

echo ""
echo "  NETNAVAL — Setup"
echo "  ────────────────"
echo ""

# Requisitos
command -v go   >/dev/null 2>&1 || die "Go no encontrado. Instala Go 1.22+ → https://go.dev/dl/"
command -v node >/dev/null 2>&1 || die "Node.js no encontrado. Instala Node 20+ → https://nodejs.org/"
command -v npm  >/dev/null 2>&1 || die "npm no encontrado."

info "Go $(go version | awk '{print $3}')"
info "Node $(node --version)"

# Wails CLI
if ! command -v wails >/dev/null 2>&1; then
    warn "Wails CLI no encontrado. Instalando..."
    go install github.com/wailsapp/wails/v2/cmd/wails@latest
    export PATH=$PATH:$(go env GOPATH)/bin
fi
info "Wails OK"

# Módulos Go
echo ""
echo "  → Dependencias Go (primer run: 1-2 min)..."
go mod tidy
info "go mod tidy OK"

# Frontend
echo "  → Paquetes npm..."
(cd frontend && npm install --silent)
info "npm install OK"

# Checks
echo "  → TypeScript..."
(cd frontend && npx tsc --noEmit)
info "TypeScript OK"

echo "  → Tests Go..."
go test ./internal/... -count=1 -q
info "Tests OK"

echo ""
echo "  ✅  Listo. Ejecuta:  make dev  o  wails dev"
echo ""
