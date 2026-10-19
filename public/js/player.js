// player.js — player physics, movement and animation
"use strict";

const Player = {
    // Dimensions
    W: 24,
    H: 32,

    // Physics constants
    MOVE_SPEED: 180,        // px/s
    JUMP_VELOCITY: -380,    // px/s (negative = up)
    GRAVITY: 1000,          // px/s²

    // State
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    onGround: false,
    facingRight: true,

    // Animation
    animFrame: 0,
    animTimer: 0,
    animInterval: 0.12, // seconds per frame
    ANIM_FRAMES_RUN: 4,

    // Distance tracking
    distanceTravelled: 0,
    startX: 0,

    init(groundY) {
        // Place player on the ground, slightly left of center
        this.x = 80;
        this.y = groundY - this.H;
        this.vx = 0;
        this.vy = 0;
        this.onGround = true;
        this.facingRight = true;
        this.animFrame = 0;
        this.animTimer = 0;
        this.distanceTravelled = 0;
        this.startX = this.x;
    },

    update(dt, groundY) {
        // Movement
        if (Input.isMovingLeft()) {
            this.vx = -this.MOVE_SPEED;
            this.facingRight = false;
        } else if (Input.isMovingRight()) {
            this.vx = this.MOVE_SPEED;
            this.facingRight = true;
        } else {
            this.vx = 0;
        }

        // Jump
        if (this.onGround && Input.isJumping()) {
            this.vy = this.JUMP_VELOCITY;
            this.onGround = false;
        }

        // Gravity
        this.vy += this.GRAVITY * dt;

        // Apply velocity
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Ground collision
        if (this.y + this.H >= groundY) {
            this.y = groundY - this.H;
            this.vy = 0;
            this.onGround = true;
        }

        // Update distance (only forward movement counts)
        if (this.x > this.startX + this.distanceTravelled) {
            this.distanceTravelled = this.x - this.startX;
        }

        // Animation update
        if (this.onGround && this.vx !== 0) {
            this.animTimer += dt;
            if (this.animTimer >= this.animInterval) {
                this.animTimer -= this.animInterval;
                this.animFrame = (this.animFrame + 1) % this.ANIM_FRAMES_RUN;
            }
        } else if (!this.onGround) {
            this.animFrame = 1; // jump/fall frame
        } else {
            this.animFrame = 0; // idle
            this.animTimer = 0;
        }
    },

    getBounds() {
        // Slightly inset hitbox for fairness
        return {
            x: this.x + 3,
            y: this.y + 2,
            w: this.W - 6,
            h: this.H - 2,
        };
    },
};
