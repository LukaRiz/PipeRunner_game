# Pipe Runner

A simple endless pixel-art 2D platformer. Avoid dangerous plants emerging from pipes, collect coins, and beat your high score!

## Local Setup

### Requirements

- Node.js 20 or newer
- npm

### Installation

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Controls

| Key | Action |
|---|---|
| `A` or `←` | Move left |
| `D` or `→` | Move right |
| `Space`, `W`, or `↑` | Jump |
| `ESC` | Pause / Resume |

## Scoring

```
score = Math.floor(distanceTravelled / 10) + coinsCollected * 50
```

## Render Deployment

1. Push the project to a GitHub repository (excluding `node_modules`).
2. In Render, choose **New → Blueprint** and select the repository.
3. Render will read [`render.yaml`](./render.yaml) and configure the service automatically.
4. Deploy. The game will be available at the Render-provided URL.

Alternatively, create a **Web Service** manually with:

- **Runtime:** Node
- **Build Command:** `npm ci`
- **Start Command:** `npm start`
- **Health Check Path:** `/health`

No database or environment secrets are required.

## Features

- Endless pixel-art platformer world
- Pipe plants that rise, stay visible, and descend
- Coin collecting
- Distance + coin based scoring
- High score persistence via `localStorage`
- Main menu, gameplay, and game over screens
- Responsive canvas scaling with nearest-neighbor rendering
