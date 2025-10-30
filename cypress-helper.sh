#!/bin/bash

# Script de ayuda para ejecutar pruebas Cypress
# Uso: ./cypress-helper.sh [comando]

echo "🚀 Cypress Testing Helper - InduKitchen"
echo "========================================"
echo ""

show_menu() {
    echo "Selecciona una opción:"
    echo ""
    echo "1) Abrir Cypress en modo interactivo"
    echo "2) Ejecutar todas las pruebas (headless)"
    echo "3) Ejecutar pruebas con cobertura"
    echo "4) Ejecutar solo pruebas de autenticación"
    echo "5) Ejecutar solo pruebas de productos"
    echo "6) Ejecutar solo pruebas de carrito"
    echo "7) Ejecutar solo pruebas de admin"
    echo "8) Ver reporte de cobertura"
    echo "9) Limpiar archivos de prueba (videos, screenshots)"
    echo "10) Verificar instalación"
    echo "0) Salir"
    echo ""
    read -p "Opción: " option

    case $option in
        1)
            echo "🎨 Abriendo Cypress en modo interactivo..."
            npm run e2e:open
            ;;
        2)
            echo "🏃 Ejecutando todas las pruebas..."
            npm run e2e
            ;;
        3)
            echo "📊 Ejecutando pruebas con cobertura..."
            npm run cypress:coverage
            echo ""
            echo "✅ Cobertura generada en: coverage-cypress/"
            read -p "¿Abrir reporte HTML? (s/n): " open_report
            if [ "$open_report" = "s" ]; then
                open coverage-cypress/index.html 2>/dev/null || xdg-open coverage-cypress/index.html 2>/dev/null || echo "Abre manualmente: coverage-cypress/index.html"
            fi
            ;;
        4)
            echo "🔐 Ejecutando pruebas de autenticación..."
            npx cypress run --spec "cypress/e2e/auth.cy.ts"
            ;;
        5)
            echo "📦 Ejecutando pruebas de productos..."
            npx cypress run --spec "cypress/e2e/products.cy.ts"
            ;;
        6)
            echo "🛒 Ejecutando pruebas de carrito..."
            npx cypress run --spec "cypress/e2e/cart.cy.ts"
            ;;
        7)
            echo "⚙️ Ejecutando pruebas de admin..."
            npx cypress run --spec "cypress/e2e/admin.cy.ts"
            ;;
        8)
            echo "📈 Abriendo reporte de cobertura..."
            if [ -f "coverage-cypress/index.html" ]; then
                open coverage-cypress/index.html 2>/dev/null || xdg-open coverage-cypress/index.html 2>/dev/null || echo "Abre manualmente: coverage-cypress/index.html"
            else
                echo "❌ No hay reporte de cobertura. Ejecuta la opción 3 primero."
            fi
            ;;
        9)
            echo "🧹 Limpiando archivos de prueba..."
            rm -rf cypress/videos cypress/screenshots .nyc_output coverage-cypress
            echo "✅ Archivos limpiados"
            ;;
        10)
            echo "🔍 Verificando instalación..."
            echo ""
            echo "Node version:"
            node --version
            echo ""
            echo "NPM version:"
            npm --version
            echo ""
            echo "Cypress:"
            npx cypress version
            echo ""
            echo "Dependencias de Cypress:"
            npm list cypress @cypress/code-coverage nyc istanbul-lib-coverage | grep -E "cypress|nyc|istanbul"
            echo ""
            echo "✅ Verificación completa"
            ;;
        0)
            echo "👋 ¡Hasta luego!"
            exit 0
            ;;
        *)
            echo "❌ Opción inválida"
            ;;
    esac

    echo ""
    echo "========================================"
    read -p "Presiona Enter para volver al menú..."
    show_menu
}

# Si se pasa un argumento, ejecutar directamente
if [ $# -gt 0 ]; then
    case $1 in
        open)
            npm run e2e:open
            ;;
        run)
            npm run e2e
            ;;
        coverage)
            npm run cypress:coverage
            ;;
        clean)
            rm -rf cypress/videos cypress/screenshots .nyc_output coverage-cypress
            echo "✅ Archivos limpiados"
            ;;
        *)
            echo "Comandos disponibles: open, run, coverage, clean"
            echo "O ejecuta sin argumentos para ver el menú interactivo"
            ;;
    esac
else
    show_menu
fi
