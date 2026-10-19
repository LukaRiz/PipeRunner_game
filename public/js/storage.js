// storage.js — high score persistence via localStorage
"use strict";

const HIGH_SCORE_KEY = "pipeRunnerHighScore";

function getHighScore() {
    try {
        return Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
    } catch (e) {
        return 0;
    }
}

function saveHighScore(score) {
    try {
        const current = getHighScore();
        if (score > current) {
            localStorage.setItem(HIGH_SCORE_KEY, String(score));
            return score;
        }
        return current;
    } catch (e) {
        return getHighScore();
    }
}
