# Sunshine Power Website

A modern React website for Sunshine Power, a solar energy company based in Jaipur, Rajasthan. The website showcases solar installation services, expert consultation, maintenance, and government subsidy assistance.

## 🌞 Features

- **Modern React & TypeScript** - Built with Vite for fast development
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Solar Calculator** - ROI calculator for solar installations
- **Contact Forms** - Lead generation and service requests
- **WhatsApp Integration** - Direct communication with customers
- **Netlify Functions** - Serverless backend for form handling

## 🚀 Quick Start with GitHub Codespaces

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/ankitbaloda/sunshinepower-website)

1. Click the badge above or go to the repository
2. Click "Code" → "Codespaces" → "Create codespace on main"
3. Wait for the environment to set up automatically
4. Run `npm run dev` to start the development server

> See [CODESPACES.md](./CODESPACES.md) for detailed Codespaces setup and usage instructions.

## 🛠️ Local Development

### Prerequisites

- Node.js 18+ 
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/ankitbaloda/sunshinepower-website.git

# Navigate to project directory
cd sunshinepower-website

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 🏗️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Netlify Functions
- **Hosting**: Netlify
- **Development**: GitHub Codespaces ready

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── utils/              # Utility functions and constants
├── types/              # TypeScript type definitions
└── main.tsx           # Application entry point

netlify/
├── functions/          # Serverless functions
└── lib/               # Shared backend utilities

public/                # Static assets
```

## 🌐 Deployment

The project is configured for Netlify deployment:

1. Connect your GitHub repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Set up environment variables for Netlify functions

## 📄 License

This project is proprietary software developed for Sunshine Power.

---

Built with ❤️ by Sunshine Power Team