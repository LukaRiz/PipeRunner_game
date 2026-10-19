// game.js — main game loop, state, collision and score
"use strict";

// Internal canvas resolution
const CANVAS_W = 480;
const CANVAS_H = 270;
const GROUND_Y = CANVAS_H - 40; // y position of the ground surface

// Max dt cap to prevent huge jumps after tab switch
const MAX_DT = 0.05; // 50ms = 20 FPS minimum

const Game = {
    canvas: null,
    state: "menu",         // "menu" | "playing" | "paused" | "gameover"
    rafId: null,
    lastTimestamp: null,

    score: 0,
    highScore: 0,

    cameraX: 0,

    init(canvas) {
        this.canvas = canvas;
        Renderer.init(canvas);
        Input.init();
        this.highScore = getHighScore();
        this._setupCanvasScaling();
        window.addEventListener("resize", () => this._setupCanvasScaling());
    },

    _setupCanvasScaling() {
        // Scale canvas to fill window while maintaining aspect ratio
        const canvas = this.canvas;
        const ratio = CANVAS_W / CANVAS_H;
        const winRatio = window.innerWidth / window.innerHeight;
        let displayW, displayH;
        if (winRatio > ratio) {
            displayH = window.innerHeight;
            displayW = Math.floor(displayH * ratio);
        } else {
            displayW = window.innerWidth;
            displayH = Math.floor(displayW / ratio);
        }
        canvas.style.width = displayW + "px";
        canvas.style.height = displayH + "px";
    },

    startGame() {
        this._stopLoop();
        this.state = "playing";
        this.score = 0;
        this.cameraX = 0;

        Player.init(GROUND_Y);
        Obstacles.init(GROUND_Y);
        Collectibles.init(GROUND_Y);

        // Position camera so player is slightly left of center
        this.cameraX = Player.x - 120;

        this.lastTimestamp = null;
        this.rafId = requestAnimationFrame((ts) => this._loop(ts));
    },

    _stopLoop() {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    },

    _loop(timestamp) {
        if (this.state !== "playing" && this.state !== "paused") return;

        // Calculate delta time
        if (this.lastTimestamp === null) this.lastTimestamp = timestamp;
        let dt = (timestamp - this.lastTimestamp) / 1000;
        this.lastTimestamp = timestamp;
        dt = Math.min(dt, MAX_DT); // cap dt

        if (this.state === "playing") {
            this._update(dt);
        }

        this._render();

        // Schedule next frame only if still running
        if (this.state === "playing" || this.state === "paused") {
            this.rafId = requestAnimationFrame((ts) => this._loop(ts));
        }
    },

    _update(dt) {
        // Pause toggle
        if (Input.wasEscJustPressed()) {
            this.state = "paused";
            Input.clearJustPressed();
            return;
        }

        Player.update(dt, GROUND_Y);

        // Update camera: follow player, keep player at ~1/4 of screen width
        const targetCamX = Player.x - Math.floor(CANVAS_W / 4);
        this.cameraX = Math.max(0, targetCamX);

        Obstacles.update(dt, this.cameraX);
        Collectibles.update(dt, this.cameraX);

        // Collect coins
        const playerBounds = Player.getBounds();
        Collectibles.checkCollection(playerBounds);

        // Calculate score
        this.score = Math.floor(Player.distanceTravelled / 10) + Collectibles.coinsCollected * 50;

        // Check plant collisions
        const plantBounds = Obstacles.getActivePlantBounds();
        for (const pb of plantBounds) {
            if (aabbOverlap(playerBounds, pb)) {
                this._triggerGameOver();
                break;
            }
        }

        // Check fall off world
        if (Player.y > CANVAS_H + 50) {
            this._triggerGameOver();
        }

        Input.clearJustPressed();
    },

    resumeGame() {
        if (this.state !== "paused") return;
        this.state = "playing";
        this.lastTimestamp = null; // reset dt to avoid jump
        this.rafId = requestAnimationFrame((ts) => this._loop(ts));
    },

    _triggerGameOver() {
        this.state = "gameover";
        this.highScore = saveHighScore(this.score);
        this._stopLoop();
        // Render one final frame
        this._render();
        // Show game over screen
        showGameOver(this.score, Collectibles.coinsCollected, this.highScore);
    },

    _render() {
        Renderer.clear();
        Renderer.drawBackground(this.cameraX);
        Renderer.drawGround(this.cameraX, GROUND_Y);
        Renderer.drawPipes(Obstacles.getPipeData(), this.cameraX, GROUND_Y);
        Renderer.drawCoins(Collectibles.getCoins(), this.cameraX, Collectibles.getCoinSize());
        Renderer.drawPlayer(Player, this.cameraX);
        Renderer.drawHUD(this.score, Collectibles.coinsCollected, this.highScore);

        if (this.state === "paused") {
            Renderer.drawPauseOverlay();
        }
    },

    getHighScoreValue() {
        return this.highScore;
    },
};

// Shared AABB helper (also used by collectibles.js and obstacles.js)
function aabbOverlap(a, b) {
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
}
