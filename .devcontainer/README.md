# Development Container Configuration

This directory contains the configuration for GitHub Codespaces and VS Code Dev Containers.

## What's Included

- **Node.js 20** with TypeScript support
- **Essential VS Code Extensions**:
  - ESLint for code linting
  - Prettier for code formatting
  - Tailwind CSS IntelliSense
  - TypeScript support
  - Auto Rename Tag
  - Path IntelliSense
  - Live Server support

## Getting Started

1. Open this repository in GitHub Codespaces or VS Code with Dev Containers extension
2. The container will automatically:
   - Install all npm dependencies
   - Configure Git settings
   - Set up the development environment
3. Run `npm run dev` to start the development server
4. The server will be accessible on port 5173 (automatically forwarded)

## Ports

- **5173**: Development server (Vite)
- **4173**: Preview server (Vite preview)

## Environment Variables

- `NODE_ENV`: Set to "development"

The development environment is optimized for React TypeScript development with hot reload, ESLint, and Prettier integration.