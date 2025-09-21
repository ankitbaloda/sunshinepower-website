#!/bin/bash

# Sunshine Power Website - Development Setup Script
# This script sets up the development environment for GitHub Codespaces

echo "🌞 Setting up Sunshine Power Website Development Environment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Update browserslist
echo "🔄 Updating browserslist database..."
npx update-browserslist-db@latest

echo "✅ Setup complete!"
echo ""
echo "🚀 Quick Start Commands:"
echo "  npm run dev     - Start development server"
echo "  npm run build   - Build for production"
echo "  npm run lint    - Run ESLint"
echo "  npm run preview - Preview production build"
echo ""
echo "🌐 Development server will be available on port 5173 (or 5174 if 5173 is busy)"
echo "📱 Preview server will be available on port 4173"
echo ""
echo "Happy coding! 🚀"