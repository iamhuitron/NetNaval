#!/usr/bin/env bash
# NetNaval — Limpieza total y rebuild desde cero
# Usar cuando algo se ve "raro" o desactualizado en la app (build viejo,
# caché de Vite, caché de Go, etc).
set -e

echo "🧹 Limpiando TODOS los artefactos de build…"

# Frontend: dist, caché de Vite, caché de node_modules/.vite
rm -rf frontend/dist
rm -rf frontend/.vite
rm -rf frontend/node_modules/.vite

# Wails: binarios de producción
rm -rf build/bin

# Bindings auto-generados de Wails (se regeneran solos en el próximo wails dev/build)
rm -rf frontend/wailsjs

echo "✓ Artefactos eliminados"
echo ""
echo "🔨 Reconstruyendo frontend desde cero…"
cd frontend
npm run build
cd ..
echo "✓ Frontend reconstruido"

echo ""
echo "🔍 Verificando que las 3 opciones de modo estén en el bundle…"
JS=$(ls frontend/dist/assets/*.js)
for label in "vs CPU" "Red local" "En Línea"; do
  if grep -qF "$label" "$JS"; then
    echo "  ✓ '$label'"
  else
    echo "  ✗ '$label' — FALTA, hay un problema más profundo"
    exit 1
  fi
done

echo ""
echo "✅ Todo limpio y verificado. Ahora ejecuta:"
echo ""
echo "   wails dev      (desarrollo)"
echo "   wails build -clean   (producción, fuerza limpieza del caché de Go también)"
echo ""
