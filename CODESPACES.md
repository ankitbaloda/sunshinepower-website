# Development with GitHub Codespaces

This project is configured to work seamlessly with GitHub Codespaces for instant cloud-based development.

## 🚀 Quick Start with Codespaces

1. **Open in Codespaces**: Click the "Code" button on the GitHub repository and select "Open with Codespaces"
2. **Create new Codespace**: If you don't have one, click "Create codespace on main"
3. **Wait for setup**: The environment will automatically install dependencies and configure the development environment
4. **Start developing**: Run `npm run dev` to start the development server

## 🛠️ Development Environment

The Codespace includes:
- **Node.js 20** with npm
- **VS Code extensions** for React, TypeScript, and Tailwind CSS
- **Prettier** for code formatting
- **ESLint** for code linting
- **Git** and **GitHub CLI** pre-installed

## 📦 Available Commands

```bash
npm run dev     # Start development server (http://localhost:5173)
npm run build   # Build for production
npm run lint    # Run ESLint
npm run preview # Preview production build (http://localhost:4173)
```

## 🔧 VS Code Settings

The devcontainer includes optimized VS Code settings for:
- Auto-formatting on save with Prettier
- TypeScript IntelliSense
- Tailwind CSS autocomplete
- ESLint integration
- Auto import organization

## 🌐 Port Forwarding

The Codespace automatically forwards:
- **Port 5173**: Development server (primary)
- **Port 5174**: Development server (fallback)
- **Port 4173**: Preview server

These ports will be accessible through the VS Code Ports panel.

## 💡 Tips

- The setup script runs automatically when the Codespace is created
- All dependencies are pre-installed
- Changes are automatically saved to your fork/branch
- Use the integrated terminal for running commands