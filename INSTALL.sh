#!/usr/bin/env bash
# NetNaval — Instalación limpia
# Ejecutar DESDE EL DIRECTORIO QUE CONTIENE la carpeta netnaval
# Ejemplo:  cd ~/Proyectos && bash netnaval/INSTALL.sh
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

echo ""
echo -e "${CYAN}  NETNAVAL — Instalación limpia${NC}"
echo "  ────────────────────────────────"
echo ""

# Verificar requisitos
command -v go   >/dev/null 2>&1 || { echo -e "${RED}✗ Go no encontrado — instala Go 1.22+ desde https://go.dev/dl/${NC}"; exit 1; }
command -v node >/dev/null 2>&1 || { echo -e "${RED}✗ Node.js no encontrado — instala Node 20+ desde https://nodejs.org/${NC}"; exit 1; }
command -v npm  >/dev/null 2>&1 || { echo -e "${RED}✗ npm no encontrado${NC}"; exit 1; }

if ! command -v wails >/dev/null 2>&1; then
  echo -e "${YELLOW}! Wails no encontrado, instalando...${NC}"
  go install github.com/wailsapp/wails/v2/cmd/wails@latest
  export PATH=$PATH:$(go env GOPATH)/bin
fi

echo -e "${GREEN}✓ Go $(go version | awk '{print $3}')${NC}"
echo -e "${GREEN}✓ Node $(node --version)${NC}"
echo -e "${GREEN}✓ Wails $(wails version 2>/dev/null | head -1 || echo 'instalado')${NC}"
echo ""

# Ir al directorio raíz del proyecto
cd "$(dirname "$0")"
PROJECT_DIR="$(pwd)"
echo "  Directorio: $PROJECT_DIR"
echo ""

echo "  → Limpiando artefactos anteriores..."
rm -rf frontend/dist frontend/.vite frontend/node_modules/.vite frontend/wailsjs build/bin
echo -e "${GREEN}  ✓ Limpieza completada${NC}"

echo "  → Descargando dependencias Go..."
go mod tidy
echo -e "${GREEN}  ✓ go mod tidy OK${NC}"

echo "  → Instalando paquetes npm..."
cd frontend && npm install --silent && cd ..
echo -e "${GREEN}  ✓ npm install OK${NC}"

echo "  → Compilando frontend..."
cd frontend && npm run build > /dev/null 2>&1 && cd ..
echo -e "${GREEN}  ✓ Frontend compilado${NC}"

echo "  → Verificando los 3 modos de juego en el bundle..."
JS=$(ls frontend/dist/assets/*.js)
OK=true
for label in "vs CPU" "Red local" "En Línea"; do
  if grep -qF "$label" "$JS"; then
    echo -e "${GREEN}    ✓ '$label'${NC}"
  else
    echo -e "${RED}    ✗ '$label' — ERROR: no está en el bundle${NC}"
    OK=false
  fi
done

if [ "$OK" != "true" ]; then
  echo -e "${RED}✗ El bundle tiene errores. Algo salió mal.${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}  ✅ Listo. Ahora ejecuta:${NC}"
echo ""
echo "       wails dev"
echo ""
echo "  Para Windows: asegúrate de que $(go env GOPATH)\\bin esté en el PATH"
echo "  Para confirmar que es la versión nueva: busca 'v4' en la esquina inferior del menú"
echo ""
