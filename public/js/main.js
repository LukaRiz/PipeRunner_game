// main.js — initialization and UI screen management
"use strict";

// ---- Screen elements ----
let menuScreen, gameScreen, gameOverScreen;
let canvas;
let btnStart, btnRestart, btnMenu;
let btnLeft, btnRight, btnJump;
let elBestMenu, elScoreGO, elCoinsGO, elBestGO;

function showScreen(name) {
    menuScreen.classList.toggle("hidden", name !== "menu");
    gameScreen.classList.toggle("hidden", name !== "game");
    gameOverScreen.classList.toggle("hidden", name !== "gameover");
}

function showMenu() {
    showScreen("menu");
    elBestMenu.textContent = "BEST: " + getHighScore();
}

function showGameplay() {
    showScreen("game");
}

function showGameOver(score, coins, highScore) {
    elScoreGO.textContent = "SCORE: " + score;
    elCoinsGO.textContent = "COINS: " + String(coins).padStart(2, "0");
    elBestGO.textContent = "BEST: " + highScore;
    showScreen("gameover");
}

// ---- Mobile controls ----
function bindMobileButton(btn, key) {
    btn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        Input.mobile[key] = true;
        if (key === "jump") Input.mobile.jumpJustPressed = true;
    }, { passive: false });
    btn.addEventListener("touchend", (e) => {
        e.preventDefault();
        Input.mobile[key] = false;
    }, { passive: false });
    // Also support mouse for desktop testing
    btn.addEventListener("mousedown", () => {
        Input.mobile[key] = true;
        if (key === "jump") Input.mobile.jumpJustPressed = true;
    });
    btn.addEventListener("mouseup", () => { Input.mobile[key] = false; });
    btn.addEventListener("mouseleave", () => { Input.mobile[key] = false; });
}

// ---- Main Menu canvas preview ----
function drawMenuPlayer() {
    const previewCanvas = document.getElementById("menuCanvas");
    if (!previewCanvas) return;
    const ctx = previewCanvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 48, 64);

    // Simple static player illustration for menu
    const sx = 12, sy = 4;
    // Hat
    ctx.fillStyle = "#B71C1C";
    ctx.fillRect(sx + 4, sy, 16, 7);
    ctx.fillRect(sx + 2, sy + 4, 20, 5);
    // Head
    ctx.fillStyle = "#FFCC80";
    ctx.fillRect(sx + 3, sy + 7, 18, 11);
    // Eye
    ctx.fillStyle = "#1A237E";
    ctx.fillRect(sx + 15, sy + 10, 3, 3);
    // Body
    ctx.fillStyle = "#1565C0";
    ctx.fillRect(sx + 2, sy + 17, 20, 10);
    // Legs
    ctx.fillStyle = "#0D47A1";
    ctx.fillRect(sx + 3, sy + 26, 8, 8);
    ctx.fillRect(sx + 13, sy + 26, 8, 8);
    // Shoes
    ctx.fillStyle = "#000000";
    ctx.fillRect(sx + 3, sy + 32, 8, 2);
    ctx.fillRect(sx + 13, sy + 32, 8, 2);
}

// ---- Init ----
window.addEventListener("DOMContentLoaded", () => {
    menuScreen = document.getElementById("menuScreen");
    gameScreen = document.getElementById("gameScreen");
    gameOverScreen = document.getElementById("gameOverScreen");
    canvas = document.getElementById("gameCanvas");

    btnStart = document.getElementById("btnStart");
    btnRestart = document.getElementById("btnRestart");
    btnMenu = document.getElementById("btnMenu");
    btnLeft = document.getElementById("btnLeft");
    btnRight = document.getElementById("btnRight");
    btnJump = document.getElementById("btnJump");

    elBestMenu = document.getElementById("bestScore");
    elScoreGO = document.getElementById("finalScore");
    elCoinsGO = document.getElementById("finalCoins");
    elBestGO = document.getElementById("finalBest");

    // Set canvas internal resolution
    canvas.width = 480;
    canvas.height = 270;

    Game.init(canvas);

    // Mobile control buttons
    bindMobileButton(btnLeft, "left");
    bindMobileButton(btnRight, "right");
    bindMobileButton(btnJump, "jump");

    // Button handlers
    btnStart.addEventListener("click", () => {
        showGameplay();
        Game.startGame();
    });

    btnRestart.addEventListener("click", () => {
        showGameplay();
        Game.startGame();
    });

    btnMenu.addEventListener("click", () => {
        Game._stopLoop();
        Game.state = "menu";
        showMenu();
    });

    // ESC during gameplay (keyboard resume handled in game loop)
    // Also handle ESC when paused — show a resume action
    document.addEventListener("keydown", (e) => {
        if (e.code === "Escape" && Game.state === "paused") {
            Game.resumeGame();
        }
    });

    drawMenuPlayer();
    showMenu();
});
