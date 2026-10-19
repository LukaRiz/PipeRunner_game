// obstacles.js — pipes and dangerous plants
"use strict";

// Plant states
const PlantState = {
    HIDDEN: "HIDDEN",
    RISING: "RISING",
    EXPOSED: "EXPOSED",
    FALLING: "FALLING",
    COOLDOWN: "COOLDOWN",
};

// Pipe dimensions
const PIPE_W = 32;
const PIPE_H = 48;  // visible pipe height above ground
const PLANT_W = 20;
const PLANT_H = 28;

// Min spacing between pipes
const PIPE_SPACING_MIN = 500;
const PIPE_SPACING_MAX = 720;

// Animation timing (seconds)
const RISE_TIME = 0.5;
const EXPOSED_TIME = 1.0;
const FALL_TIME = 0.5;
const COOLDOWN_MIN = 1.5;
const COOLDOWN_MAX = 3.5;

const Obstacles = {
    pipes: [],   // { x, pipeTop, plant: { state, timer, y, cooldownDuration } }

    init(groundY) {
        this.groundY = groundY;
        this.pipes = [];
        // Spawn initial pipes ahead of player start position
        let nextX = 480; // first pipe well ahead
        for (let i = 0; i < 6; i++) {
            this._spawnPipe(nextX);
            nextX += this._randomSpacing();
        }
    },

    _randomSpacing() {
        return PIPE_SPACING_MIN + Math.random() * (PIPE_SPACING_MAX - PIPE_SPACING_MIN);
    },

    _spawnPipe(x) {
        const pipeTop = this.groundY - PIPE_H;
        const cooldown = COOLDOWN_MIN + Math.random() * (COOLDOWN_MAX - COOLDOWN_MIN);
        this.pipes.push({
            x: x,
            pipeTop: pipeTop,
            plant: {
                state: PlantState.COOLDOWN,
                timer: cooldown * 0.5 + Math.random() * cooldown * 0.5, // stagger start
                cooldownDuration: cooldown,
                y: pipeTop, // plant y (top of plant)
            },
        });
    },

    update(dt, cameraX) {
        // Ensure there are always pipes ahead
        if (this.pipes.length > 0) {
            const lastPipe = this.pipes[this.pipes.length - 1];
            const screenRight = cameraX + 600; // a bit past screen edge
            if (lastPipe.x < screenRight) {
                this._spawnPipe(lastPipe.x + this._randomSpacing());
            }
        }

        // Remove pipes that are far behind camera
        this.pipes = this.pipes.filter(p => p.x > cameraX - 300);

        // Update each pipe's plant
        for (const pipe of this.pipes) {
            this._updatePlant(pipe, dt);
        }
    },

    _updatePlant(pipe, dt) {
        const p = pipe.plant;
        p.timer -= dt;

        switch (p.state) {
            case PlantState.HIDDEN:
                // Should not sit here long; immediately transition to RISING
                p.state = PlantState.RISING;
                p.timer = RISE_TIME;
                p.y = pipe.pipeTop; // start at pipe top
                break;

            case PlantState.RISING:
                if (p.timer <= 0) {
                    p.state = PlantState.EXPOSED;
                    p.timer = EXPOSED_TIME;
                    p.y = pipe.pipeTop - PLANT_H;
                } else {
                    // Interpolate upward: 0=inside pipe, 1=fully out
                    const progress = 1 - (p.timer / RISE_TIME);
                    p.y = pipe.pipeTop - progress * PLANT_H;
                }
                break;

            case PlantState.EXPOSED:
                p.y = pipe.pipeTop - PLANT_H;
                if (p.timer <= 0) {
                    p.state = PlantState.FALLING;
                    p.timer = FALL_TIME;
                }
                break;

            case PlantState.FALLING:
                if (p.timer <= 0) {
                    p.state = PlantState.COOLDOWN;
                    p.timer = COOLDOWN_MIN + Math.random() * (COOLDOWN_MAX - COOLDOWN_MIN);
                    p.y = pipe.pipeTop;
                } else {
                    const progress = 1 - (p.timer / FALL_TIME);
                    p.y = pipe.pipeTop - PLANT_H + progress * PLANT_H;
                }
                break;

            case PlantState.COOLDOWN:
                p.y = pipe.pipeTop;
                if (p.timer <= 0) {
                    p.state = PlantState.RISING;
                    p.timer = RISE_TIME;
                    p.y = pipe.pipeTop;
                }
                break;
        }
    },

    // Returns bounding box for a plant only when it's dangerous (exposed above pipe)
    getActivePlantBounds() {
        const bounds = [];
        for (const pipe of this.pipes) {
            const p = pipe.plant;
            if (p.state === PlantState.RISING || p.state === PlantState.EXPOSED || p.state === PlantState.FALLING) {
                // Only the visible part above the pipe top is dangerous
                const visibleTop = p.y;
                const visibleBottom = pipe.pipeTop;
                if (visibleBottom > visibleTop) {
                    bounds.push({
                        x: pipe.x + (PIPE_W - PLANT_W) / 2,
                        y: visibleTop,
                        w: PLANT_W,
                        h: visibleBottom - visibleTop,
                    });
                }
            }
        }
        return bounds;
    },

    // Returns bounding boxes for all pipe bodies (for rendering only)
    getPipeData() {
        return this.pipes.map(pipe => ({
            x: pipe.x,
            pipeTop: pipe.pipeTop,
            pipeW: PIPE_W,
            pipeH: PIPE_H,
            plant: pipe.plant,
            plantW: PLANT_W,
            plantH: PLANT_H,
        }));
    },
};
