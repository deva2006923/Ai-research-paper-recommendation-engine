# Halo Recommendation Engine - Frontend Client

This is the React (Vite) frontend application built with the architectural design system **"Halo"**. It connects to the FastAPI backend service for paper publication searches, open-source repository scanning, tech stack architectural mapping, and starter code scaffolding.

## Design System: "Halo"
Halo is a dark, structural, architectural design system with strict tokens applied as CSS custom properties:
- **Canvas Base**: `#0A0B0F` (`--background`)
- **Panels & Cards**: `#14151C` (`--surface`), `#1E2029` (`--elevated`)
- **Borders & Dividers**: `#2A2D38` (`--border`), `#3A3D4A` (`--border-strong`)
- **Brand Primary**: `#5B6BFF` (`--primary`), `#7886FF` (`--primary-hover`)
- **Signal Signals**: Success Lime (`#2BE08C`), Warning Amber (`#F5D547`), Error Magenta (`#FF3A5C`), Info Aqua (`#3DD7E5`)
- **Typography**: Inter (UI text, headers), JetBrains Mono (metrics, codes)
- **Shape Corner Radius**: 6px (`sm` checkboxes), 10px (`md` buttons/inputs), 16px (`lg` cards), 24px (`xl` hero panels)

---

## Features Built

### 1. Interactive Stagger Animations
- **SplitText Headline**: Implements custom GSAP-driven text staggering to animate the hero headline word-by-word on page load.
- **ElectricBorder Input**: Wraps the description box in a rotating glowing border highlighting the action area with Halo primary indigo.
- **ScrollStack Cards**: Packs papers, repos, and architectural recommendation card screens into a sticky overlay stacking scroll layout.

### 2. Multi-Tiered Views
- **Login screen**: Styled OAuth panel supporting both standard Google client validation and local development Mock sign-ins.
- **Input screen**: Rich description area with scan limit configurations.
- **Results report**: Shows concurrently parsed academic summaries and repository lists, together with custom sparklines.
- **AI Assistant Drawer**: Persistent right-hand drawer tracking chat histories and session-based conversations.
- **Admin stats**: Grid of Stat Tiles drawing SVG polyline sparklines and aggregate database counts.

---

## Setup & Running Locally

### 1. Installation
Navigate into the frontend directory:
```bash
cd frontend
```

Install packages:
```bash
npm install
```

### 2. Configure Backend Connection
The application communicates with the FastAPI server running at `http://localhost:8000`. You can configure this endpoint inside `src/services/api.js`.

### 3. Run Development Server
Launch the development server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Build for Production
Bundle the assets:
```bash
npm run build
```
Verify the build generates the compiled HTML, CSS, and JS chunks in the `/dist` directory.
