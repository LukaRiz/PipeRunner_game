// renderer.js — all Canvas drawing
"use strict";

// Color palette
const COLORS = {
    sky: "#87CEEB",
    skyGradientTop: "#5BA3D9",
    ground: "#8B5E3C",
    grass: "#4CAF50",
    grassDark: "#388E3C",
    pipe: "#2E7D32",
    pipeHighlight: "#43A047",
    pipeDark: "#1B5E20",
    pipeLip: "#1B5E20",
    plant: "#43A047",
    plantDark: "#2E7D32",
    plantDanger: "#C62828",
    coin: "#FFD600",
    coinShine: "#FFFF00",
    coinDark: "#F9A825",
    playerBody: "#1565C0",
    playerLegs: "#0D47A1",
    playerFace: "#FFCC80",
    playerEye: "#1A237E",
    playerHat: "#B71C1C",
    cloud: "#FFFFFF",
    cloudShadow: "#E0E0E0",
    hud: "#FFFFFF",
    hudShadow: "#333333",
};

// Cloud data (repeating pattern)
const CLOUD_PATTERN = [
    { rx: 80, ry: 30, w: 60, h: 22 },
    { rx: 220, ry: 50, w: 80, h: 26 },
    { rx: 380, ry: 20, w: 50, h: 18 },
    { rx: 480, ry: 45, w: 70, h: 24 },
];
const CLOUD_REPEAT = 600;

const Renderer = {
    canvas: null,
    ctx: null,
    W: 480,
    H: 270,

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.ctx.imageSmoothingEnabled = false;
    },

    clear() {
        this.ctx.clearRect(0, 0, this.W, this.H);
    },

    drawBackground(cameraX) {
        const ctx = this.ctx;

        // Sky gradient
        const grad = ctx.createLinearGradient(0, 0, 0, this.H * 0.75);
        grad.addColorStop(0, COLORS.skyGradientTop);
        grad.addColorStop(1, COLORS.sky);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.W, this.H);

        // Clouds (parallax at 20% scroll speed)
        this._drawClouds(ctx, cameraX * 0.2);
    },

    _drawClouds(ctx, scrollX) {
        ctx.fillStyle = COLORS.cloudShadow;
        for (const cloud of CLOUD_PATTERN) {
            const baseX = cloud.rx - (scrollX % CLOUD_REPEAT);
            // Draw cloud at this position and repeat across screen
            for (let offset = -CLOUD_REPEAT; offset <= this.W + CLOUD_REPEAT; offset += CLOUD_REPEAT) {
                const cx = baseX + offset;
                if (cx > -cloud.w - 20 && cx < this.W + 20) {
                    this._drawCloud(ctx, cx + 2, cloud.ry + 2, cloud.w, cloud.h, COLORS.cloudShadow);
                    this._drawCloud(ctx, cx, cloud.ry, cloud.w, cloud.h, COLORS.cloud);
                }
            }
        }
    },

    _drawCloud(ctx, x, y, w, h, color) {
        ctx.fillStyle = color;
        // Main body
        ctx.fillRect(x + Math.floor(w * 0.2), y + Math.floor(h * 0.4), Math.floor(w * 0.6), Math.floor(h * 0.6));
        // Left bump
        ctx.fillRect(x, y + Math.floor(h * 0.5), Math.floor(w * 0.4), Math.floor(h * 0.5));
        // Right bump
        ctx.fillRect(x + Math.floor(w * 0.6), y + Math.floor(h * 0.5), Math.floor(w * 0.4), Math.floor(h * 0.5));
        // Top middle bump
        ctx.fillRect(x + Math.floor(w * 0.3), y, Math.floor(w * 0.4), Math.floor(h * 0.6));
    },

    drawGround(cameraX, groundY) {
        const ctx = this.ctx;
        const screenGroundY = groundY - 0; // groundY is already in canvas coords

        // Earth/dirt
        ctx.fillStyle = COLORS.ground;
        ctx.fillRect(0, screenGroundY, this.W, this.H - screenGroundY);

        // Grass strip
        ctx.fillStyle = COLORS.grass;
        ctx.fillRect(0, screenGroundY, this.W, 6);

        // Grass detail — alternating dark pixels
        ctx.fillStyle = COLORS.grassDark;
        const tileW = 8;
        const startTile = Math.floor(cameraX / tileW);
        for (let i = startTile - 1; i < startTile + Math.ceil(this.W / tileW) + 2; i++) {
            const tileX = i * tileW - (cameraX % tileW);
            if (i % 2 === 0) {
                ctx.fillRect(tileX, screenGroundY, 3, 3);
            }
        }
    },

    drawPipes(pipeDataArray, cameraX, groundY) {
        const ctx = this.ctx;

        for (const pipe of pipeDataArray) {
            const sx = pipe.x - cameraX;
            if (sx > this.W + 50 || sx + pipe.pipeW < -50) continue;

            // Pipe body
            ctx.fillStyle = COLORS.pipe;
            ctx.fillRect(sx, pipe.pipeTop, pipe.pipeW, pipe.pipeH);

            // Pipe highlight (left edge)
            ctx.fillStyle = COLORS.pipeHighlight;
            ctx.fillRect(sx + 2, pipe.pipeTop, 4, pipe.pipeH);

            // Pipe dark right edge
            ctx.fillStyle = COLORS.pipeDark;
            ctx.fillRect(sx + pipe.pipeW - 4, pipe.pipeTop, 4, pipe.pipeH);

            // Pipe lip (top rim)
            ctx.fillStyle = COLORS.pipeLip;
            ctx.fillRect(sx - 2, pipe.pipeTop, pipe.pipeW + 4, 6);
            ctx.fillStyle = COLORS.pipeHighlight;
            ctx.fillRect(sx, pipe.pipeTop + 2, 4, 4);

            // Draw plant
            this._drawPlant(ctx, pipe, sx);
        }
    },

    _drawPlant(ctx, pipe, sx) {
        const p = pipe.plant;
        // Only draw when partially or fully visible above pipe
        if (p.state === "HIDDEN" || p.state === "COOLDOWN") return;

        const plantX = sx + (pipe.pipeW - pipe.plantW) / 2;
        const plantY = p.y;
        const pW = pipe.plantW;
        const pipeTopY = pipe.pipeTop;

        // Clip plant to pipe opening (don't draw below pipe top)
        const visibleH = pipeTopY - plantY;
        if (visibleH <= 0) return;

        // Stem
        ctx.fillStyle = COLORS.plant;
        ctx.fillRect(plantX + Math.floor(pW * 0.4), plantY, Math.floor(pW * 0.2), visibleH);

        // Head (only if it's above the pipe)
        if (plantY + 14 < pipeTopY) {
            const headH = Math.min(14, pipeTopY - plantY);
            // Body of head
            ctx.fillStyle = COLORS.plant;
            ctx.fillRect(plantX, plantY, pW, headH);
            // Dark mouth
            ctx.fillStyle = COLORS.plantDark;
            ctx.fillRect(plantX + 2, plantY + Math.floor(headH * 0.55), pW - 4, Math.floor(headH * 0.3));
            // Red/danger spots
            ctx.fillStyle = COLORS.plantDanger;
            ctx.fillRect(plantX + Math.floor(pW * 0.15), plantY + 2, 3, 3);
            ctx.fillRect(plantX + Math.floor(pW * 0.65), plantY + 2, 3, 3);
        }
    },

    drawCoins(coins, cameraX, coinSize) {
        const ctx = this.ctx;
        const t = Date.now() / 1000;

        for (const coin of coins) {
            if (coin.collected) continue;
            const sx = coin.x - cameraX;
            if (sx < -coinSize - 5 || sx > this.W + 5) continue;

            // Animated shimmer
            const shimmer = Math.sin(t * 4 + coin.x * 0.05) > 0.3;

            ctx.fillStyle = shimmer ? COLORS.coinShine : COLORS.coin;
            ctx.fillRect(sx, coin.y, coinSize, coinSize);

            // Coin border
            ctx.fillStyle = COLORS.coinDark;
            ctx.fillRect(sx, coin.y, coinSize, 1);
            ctx.fillRect(sx, coin.y + coinSize - 1, coinSize, 1);
            ctx.fillRect(sx, coin.y, 1, coinSize);
            ctx.fillRect(sx + coinSize - 1, coin.y, 1, coinSize);

            // Shine pixel
            if (shimmer) {
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(sx + 1, coin.y + 1, 2, 2);
            }
        }
    },

    drawPlayer(player, cameraX) {
        const ctx = this.ctx;
        const sx = player.x - cameraX;
        const sy = player.y;
        const W = player.W;
        const H = player.H;
        const frame = player.animFrame;
        const onGround = player.onGround;
        const facingRight = player.facingRight;

        // Leg animation
        const legOffsets = onGround ? [
            [0, 0, 0, 0],    // frame 0: stand
            [-1, 1, 0, 0],   // frame 1
            [-2, 2, -1, 1],  // frame 2
            [-1, 1, 0, 0],   // frame 3
        ] : [[-3, 3, 0, 0]]; // jump frame

        const legOff = legOffsets[Math.min(frame, legOffsets.length - 1)] || [0, 0, 0, 0];

        // Mirror if facing left
        ctx.save();
        if (!facingRight) {
            ctx.translate(sx + W / 2, 0);
            ctx.scale(-1, 1);
            ctx.translate(-(sx + W / 2), 0);
        }

        // --- Draw player body ---
        // Hat
        ctx.fillStyle = COLORS.playerHat;
        ctx.fillRect(sx + 4, sy, W - 8, 7);
        ctx.fillRect(sx + 2, sy + 4, W - 4, 5);

        // Head
        ctx.fillStyle = COLORS.playerFace;
        ctx.fillRect(sx + 3, sy + 7, W - 6, 11);

        // Eye
        ctx.fillStyle = COLORS.playerEye;
        ctx.fillRect(sx + W - 9, sy + 10, 3, 3);

        // Body
        ctx.fillStyle = COLORS.playerBody;
        ctx.fillRect(sx + 2, sy + 17, W - 4, 10);

        // Legs
        ctx.fillStyle = COLORS.playerLegs;
        // Left leg
        ctx.fillRect(sx + 3, sy + H - 8 + legOff[0], 8, 8);
        // Right leg
        ctx.fillRect(sx + W - 11, sy + H - 8 + legOff[1], 8, 8);

        // Shoe highlight
        ctx.fillStyle = "#000000";
        ctx.fillRect(sx + 3, sy + H - 2, 8, 2);
        ctx.fillRect(sx + W - 11, sy + H - 2, 8, 2);

        ctx.restore();
    },

    drawHUD(score, coins, highScore) {
        const ctx = this.ctx;
        ctx.font = "8px monospace";

        const texts = [
            { text: `SCORE:${score}`, x: 4 },
            { text: `COINS:${String(coins).padStart(2, "0")}`, x: 160 },
            { text: `BEST:${highScore}`, x: 310 },
        ];

        for (const t of texts) {
            // Shadow
            ctx.fillStyle = COLORS.hudShadow;
            ctx.fillText(t.text, t.x + 1, 9);
            // Text
            ctx.fillStyle = COLORS.hud;
            ctx.fillText(t.text, t.x, 8);
        }
    },

    drawPauseOverlay() {
        const ctx = this.ctx;
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(0, 0, this.W, this.H);
        ctx.font = "bold 16px monospace";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.fillText("PAUSED", this.W / 2, this.H / 2 - 8);
        ctx.font = "8px monospace";
        ctx.fillText("Press ESC to continue", this.W / 2, this.H / 2 + 8);
        ctx.textAlign = "left";
    },
};
