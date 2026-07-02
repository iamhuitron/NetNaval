# NetNaval — Makefile
# Uso: make <target>

.PHONY: setup dev build test lint clean help

## setup: Instala Wails CLI, descarga módulos Go e instala paquetes npm
setup:
	@echo "→ Instalando Wails CLI..."
	go install github.com/wailsapp/wails/v2/cmd/wails@latest
	@echo "→ Descargando dependencias Go..."
	go mod tidy
	@echo "→ Instalando dependencias del frontend..."
	cd frontend && npm install
	@echo "✓ Setup completo. Ejecuta 'make dev' para iniciar."

## dev: Inicia la app en modo desarrollo con hot-reload
dev:
	wails dev

## build: Compila el binario de producción en build/bin/
build:
	wails build

## test: Corre los tests unitarios de Go
test:
	go test ./internal/... -v -count=1

## test-short: Tests rápidos sin salida detallada
test-short:
	go test ./internal/... -count=1

## lint: Vet de todos los paquetes Go
lint:
	go vet ./...

## typecheck: Verifica TypeScript sin compilar
typecheck:
	cd frontend && npx tsc --noEmit

## clean: Limpia artefactos de build
clean:
	rm -rf build/bin frontend/dist

## help: Muestra esta ayuda
help:
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## /  /'
