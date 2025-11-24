#!/bin/bash

# Script de démarrage du RPG Quest System

echo "🎮 RPG Quest System - Démarrage"
echo "================================"
echo ""

# Vérifier si MongoDB est en cours d'exécution
echo "📊 Vérification de MongoDB..."
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB n'est pas en cours d'exécution."
    echo "   Veuillez démarrer MongoDB avant de continuer."
    exit 1
fi
echo "✅ MongoDB est en cours d'exécution"
echo ""

# Démarrer le backend
echo "🚀 Démarrage du backend..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances backend..."
    npm install
fi
npm run dev &
BACKEND_PID=$!
echo "✅ Backend démarré (PID: $BACKEND_PID)"
cd ..
echo ""

# Attendre que le backend soit prêt
echo "⏳ Attente du backend..."
sleep 3
echo ""

# Démarrer le frontend
echo "🎨 Démarrage du frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances frontend..."
    npm install
fi
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend démarré (PID: $FRONTEND_PID)"
cd ..
echo ""

echo "================================"
echo "✨ Application démarrée avec succès!"
echo ""
echo "📍 Backend:  http://localhost:3000"
echo "📍 Frontend: http://localhost:5173"
echo ""
echo "Pour arrêter l'application, appuyez sur Ctrl+C"
echo "================================"

# Attendre les processus
wait
