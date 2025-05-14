#!/bin/bash

echo "Installation et configuration de 42AMI..."

# Se déplacer dans le dossier de l'application
cd app

# Installer les dépendances
echo "Installation des dépendances..."
npm install

# Lancer l'application en mode développement
echo "Lancement de l'application..."
npm run dev 