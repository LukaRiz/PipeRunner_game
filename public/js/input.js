// input.js — keyboard and touch input handling
"use strict";

const Input = {
    keys: {},
    justPressed: {},

    init() {
        document.addEventListener("keydown", (e) => {
            if (!this.keys[e.code]) {
                this.justPressed[e.code] = true;
            }
            this.keys[e.code] = true;

            // Prevent default for game keys to avoid page scrolling
            if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
                e.preventDefault();
            }
        });

        document.addEventListener("keyup", (e) => {
            this.keys[e.code] = false;
        });
    },

    // Call at end of each frame to clear "just pressed" state
    clearJustPressed() {
        this.justPressed = {};
    },

    isDown(code) {
        return !!this.keys[code];
    },

    wasJustPressed(code) {
        return !!this.justPressed[code];
    },

    // Convenience helpers
    isLeftDown() {
        return this.isDown("ArrowLeft") || this.isDown("KeyA");
    },

    isRightDown() {
        return this.isDown("ArrowRight") || this.isDown("KeyD");
    },

    isJumpDown() {
        return this.isDown("Space") || this.isDown("ArrowUp") || this.isDown("KeyW");
    },

    wasJumpJustPressed() {
        return this.wasJustPressed("Space") || this.wasJustPressed("ArrowUp") || this.wasJustPressed("KeyW");
    },

    wasEscJustPressed() {
        return this.wasJustPressed("Escape");
    },

    // Mobile virtual buttons state (set from HTML buttons)
    mobile: {
        left: false,
        right: false,
        jump: false,
        jumpJustPressed: false,
    },

    isMobileLeftDown() {
        return this.mobile.left;
    },

    isMobileRightDown() {
        return this.mobile.right;
    },

    isMobileJumpDown() {
        return this.mobile.jump;
    },

    isMobileJumpJustPressed() {
        const v = this.mobile.jumpJustPressed;
        this.mobile.jumpJustPressed = false;
        return v;
    },

    // Combined helpers
    isMovingLeft() {
        return this.isLeftDown() || this.isMobileLeftDown();
    },

    isMovingRight() {
        return this.isRightDown() || this.isMobileRightDown();
    },

    isJumping() {
        return this.wasJumpJustPressed() || this.isMobileJumpJustPressed();
    },
};
