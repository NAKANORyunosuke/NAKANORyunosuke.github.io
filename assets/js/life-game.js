class lifeGame {
    canvas = null;
    ctx = null;
    gridSize = 10;
    cells = 0;
    max = 0;
    board = null;
    torus = false;
    density = 0.2;

    constructor({
        boxSize = 500,
        gridSize = 10,
        torus = false,
        density = 0.2,
        canvasId = "life-game-box",
    } = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) throw new Error("canvas が見つかりません");
        this.ctx = this.canvas.getContext("2d");

        this.gridSize = gridSize;
        this.torus = torus;
        this.density = density;

        this.initBoard(boxSize);
        this.randomize(this.density);
        this.drawBoard();
    }

    initBoard(boxSize) {
        this.cells = Math.floor(boxSize / this.gridSize);
        const actualSize = this.cells * this.gridSize;
        this.canvas.width = actualSize;
        this.canvas.height = actualSize;

        this.max = this.cells + 1;

        this.board = Array.from({ length: this.cells + 2 }, () =>
            Array(this.cells + 2).fill(0)
        );
    }

    clearBoard() {
        for (let x = 0; x <= this.max; x++) this.board[x].fill(0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    randomize(p = 0.2) {
        for (let x = 1; x < this.max; x++) {
            for (let y = 1; y < this.max; y++) {
                this.board[x][y] = Math.random() < p ? 1 : 0;
            }
        }
    }

    setPattern(originX, originY, coords) {
        for (const [dx, dy] of coords) {
            const x = originX + dx,
                y = originY + dy;
            if (x >= 1 && x < this.max && y >= 1 && y < this.max)
                this.board[x][y] = 1;
        }
    }

    countLiveCell(x, y, board) {
        let count = 0;
        if (this.torus) {
            const W = this.cells;
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = ((x - 1 + dx + W) % W) + 1;
                    const ny = ((y - 1 + dy + W) % W) + 1;
                    count += board[nx][ny];
                }
            }
        } else {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = x + dx,
                        ny = y + dy;
                    if (nx >= 1 && nx < this.max && ny >= 1 && ny < this.max) {
                        count += board[nx][ny];
                    }
                }
            }
        }
        return count;
    }

    updateBoard() {
        const old = this.board;
        const next = Array.from({ length: this.cells + 2 }, () =>
            Array(this.cells + 2).fill(0)
        );

        for (let x = 1; x < this.max; x++) {
            for (let y = 1; y < this.max; y++) {
                const n = this.countLiveCell(x, y, old);
                const alive = old[x][y] === 1;
                next[x][y] = alive
                    ? n === 2 || n === 3
                        ? 1
                        : 0
                    : n === 3
                    ? 1
                    : 0;
            }
        }
        this.board = next;
    }

    drawBoard() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let x = 1; x < this.max; x++) {
            for (let y = 1; y < this.max; y++) {
                if (this.board[x][y] === 1) {
                    this.ctx.fillRect(
                        (x - 1) * this.gridSize,
                        (y - 1) * this.gridSize,
                        this.gridSize,
                        this.gridSize
                    );
                }
            }
        }
    }
}

let game = null;
let rafId = null;
let paused = false;
let intervalMs = 50;
let last = 0;
const boxSize = 500;

function loop(now) {
    if (!game) return;
    if (!paused && now - last >= intervalMs) {
        last = now;
        game.updateBoard();
        game.drawBoard();
    }
    rafId = requestAnimationFrame(loop);
}

function start(opts = {}) {
    if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
    if (game) {
        game.clearBoard();
    }

    game = new lifeGame(opts);

    paused = false;
    last = performance.now();
    rafId = requestAnimationFrame(loop);
}

function pause() {
    paused = true;
}
function resume() {
    if (game) {
        paused = false;
    }
}
function stop() {
    if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
    if (game) {
        game.clearBoard();
        game = null;
    }
}

function setSpeed(ms) {
    intervalMs = Math.max(0, ms | 0);
}
function setTorus(flag) {
    if (game) game.torus = !!flag;
}
