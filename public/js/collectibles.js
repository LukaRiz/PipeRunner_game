// collectibles.js — coin spawning, collection and removal
"use strict";

const COIN_SIZE = 8;
const COIN_SPACING_MIN = 200;
const COIN_SPACING_MAX = 400;
// Heights above ground at which coins can appear (in internal px)
const COIN_HEIGHTS = [30, 60, 90, 120]; // offset above ground

const Collectibles = {
    coins: [],      // { x, y, collected }
    coinsCollected: 0,

    init(groundY) {
        this.groundY = groundY;
        this.coins = [];
        this.coinsCollected = 0;
        // Seed some coins ahead of player start
        let nextX = 200;
        for (let i = 0; i < 10; i++) {
            this._spawnCoin(nextX);
            nextX += COIN_SPACING_MIN + Math.random() * (COIN_SPACING_MAX - COIN_SPACING_MIN);
        }
        this._nextSpawnX = nextX;
    },

    _spawnCoin(x) {
        const heightOffset = COIN_HEIGHTS[Math.floor(Math.random() * COIN_HEIGHTS.length)];
        this.coins.push({
            x: x,
            y: this.groundY - heightOffset - COIN_SIZE,
            collected: false,
        });
    },

    update(dt, cameraX) {
        // Spawn coins ahead of visible area
        const spawnAhead = cameraX + 700;
        while (this._nextSpawnX < spawnAhead) {
            this._spawnCoin(this._nextSpawnX);
            this._nextSpawnX += COIN_SPACING_MIN + Math.random() * (COIN_SPACING_MAX - COIN_SPACING_MIN);
        }

        // Remove coins far behind camera
        this.coins = this.coins.filter(c => !c.collected && c.x > cameraX - 100);
    },

    // Check player AABB against coins, collect and return count delta
    checkCollection(playerBounds) {
        let collected = 0;
        for (const coin of this.coins) {
            if (coin.collected) continue;
            if (aabbOverlap(playerBounds, { x: coin.x, y: coin.y, w: COIN_SIZE, h: COIN_SIZE })) {
                coin.collected = true;
                this.coinsCollected++;
                collected++;
            }
        }
        return collected;
    },

    getCoins() {
        return this.coins;
    },

    getCoinSize() {
        return COIN_SIZE;
    },
};

function aabbOverlap(a, b) {
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
}
