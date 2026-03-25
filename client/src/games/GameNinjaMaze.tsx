/**
 * GameNinjaMaze.tsx
 * Pac-Man style martial arts maze game for the MyDojo kiosk.
 *
 * 🥷 Ninja (player) collects belt tokens (🥋) and power-ups (⭐) through a dojo maze.
 * 👹 Enemy Senseis chase the ninja — collect a power star to turn them into ghosts and eat them!
 * Lives: 3  |  Levels: speed & enemies increase each level  |  Score saved on game over.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { RotateCcw, ArrowLeft, Trophy, Heart } from "lucide-react";

interface Props {
  onGameOver: (score: number) => void;
  onBack: () => void;
  highScore: number;
}

// ── Maze layout ────────────────────────────────────────────────────────────
// 0 = wall, 1 = pellet, 2 = power pellet, 3 = empty, 4 = ghost house door
const COLS = 21;
const ROWS = 21;

const BASE_MAZE: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0],
  [0,2,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,2,0],
  [0,1,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,1,0,1,0,0,0,0,0,0,0,1,0,1,0,0,1,0],
  [0,1,1,1,1,0,1,1,1,0,0,0,1,1,1,0,1,1,1,1,0],
  [0,0,0,0,1,0,0,0,3,0,0,0,3,0,0,0,1,0,0,0,0],
  [0,0,0,0,1,0,3,3,3,3,3,3,3,3,3,0,1,0,0,0,0],
  [0,0,0,0,1,0,3,0,0,4,4,4,0,0,3,0,1,0,0,0,0],
  [1,1,1,1,1,3,3,0,3,3,3,3,3,0,3,3,1,1,1,1,1],
  [0,0,0,0,1,0,3,0,0,0,0,0,0,0,3,0,1,0,0,0,0],
  [0,0,0,0,1,0,3,3,3,3,3,3,3,3,3,0,1,0,0,0,0],
  [0,0,0,0,1,0,3,0,0,0,0,0,0,0,3,0,1,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,1,0],
  [0,2,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,2,0],
  [0,0,1,0,1,0,1,0,0,0,0,0,0,0,1,0,1,0,1,0,0],
  [0,1,1,1,1,0,1,1,1,0,0,0,1,1,1,0,1,1,1,1,0],
  [0,1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,1,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

type Dir = { x: number; y: number };
const DIRS: Record<string, Dir> = {
  up:    { x: 0, y: -1 },
  down:  { x: 0, y: 1 },
  left:  { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

interface Entity {
  x: number;  // grid col (float for smooth movement)
  y: number;  // grid row (float)
  dir: Dir;
  nextDir: Dir;
}

interface Ghost {
  x: number;
  y: number;
  dir: Dir;
  scared: boolean;
  eaten: boolean;
  color: string;
  emoji: string;
}

const GHOST_COLORS = ["#FF4444", "#FFB8FF", "#00FFFF", "#FFB852"];
const GHOST_EMOJIS = ["👹", "👺", "🤡", "💀"];
const GHOST_START = [
  { x: 9, y: 9 }, { x: 10, y: 9 }, { x: 11, y: 9 }, { x: 10, y: 10 },
];

const CELL = 28; // px per cell
const SPEED = 0.08; // cells per frame
const GHOST_SPEED = 0.065;
const SCARED_DURATION = 8000; // ms

function deepCopyMaze(m: number[][]): number[][] {
  return m.map(row => [...row]);
}

function countPellets(maze: number[][]): number {
  let n = 0;
  for (const row of maze) for (const c of row) if (c === 1 || c === 2) n++;
  return n;
}

function isWalkable(maze: number[][], col: number, row: number): boolean {
  const r = Math.round(row);
  const c = Math.round(col);
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
  const v = maze[r][c];
  return v !== 0 && v !== 4;
}

function canMove(maze: number[][], x: number, y: number, dir: Dir): boolean {
  const nx = x + dir.x * 0.5;
  const ny = y + dir.y * 0.5;
  return isWalkable(maze, nx, ny);
}

export default function GameNinjaMaze({ onGameOver, onBack, highScore }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    maze: deepCopyMaze(BASE_MAZE),
    totalPellets: countPellets(BASE_MAZE),
    pelletsLeft: countPellets(BASE_MAZE),
    player: { x: 10, y: 16, dir: DIRS.left, nextDir: DIRS.left } as Entity,
    ghosts: GHOST_START.map((pos, i) => ({
      x: pos.x, y: pos.y,
      dir: DIRS.up,
      scared: false, eaten: false,
      color: GHOST_COLORS[i],
      emoji: GHOST_EMOJIS[i],
    })) as Ghost[],
    score: 0,
    lives: 3,
    level: 1,
    scaredTimer: 0,
    ghostEatMultiplier: 1,
    gameOver: false,
    won: false,
    dying: false,
    dyingTimer: 0,
    frameCount: 0,
    started: false,
  });
  const [displayScore, setDisplayScore] = useState(0);
  const [displayLives, setDisplayLives] = useState(3);
  const [displayLevel, setDisplayLevel] = useState(1);
  const [phase, setPhase] = useState<"ready" | "playing" | "dying" | "gameover" | "levelup">("ready");
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());

  // ── Key handling ──────────────────────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      const s = stateRef.current;
      if (!s.started || s.gameOver || s.dying) return;
      if (e.key === "ArrowUp")    s.player.nextDir = DIRS.up;
      if (e.key === "ArrowDown")  s.player.nextDir = DIRS.down;
      if (e.key === "ArrowLeft")  s.player.nextDir = DIRS.left;
      if (e.key === "ArrowRight") s.player.nextDir = DIRS.right;
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  // ── Touch swipe ───────────────────────────────────────────────────────────
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const s = stateRef.current;
    if (!s.started || s.gameOver || s.dying) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      s.player.nextDir = dx > 0 ? DIRS.right : DIRS.left;
    } else {
      s.player.nextDir = dy > 0 ? DIRS.down : DIRS.up;
    }
    touchStart.current = null;
  };

  // ── Reset level ───────────────────────────────────────────────────────────
  const resetLevel = useCallback((keepScore = true) => {
    const s = stateRef.current;
    s.maze = deepCopyMaze(BASE_MAZE);
    s.totalPellets = countPellets(BASE_MAZE);
    s.pelletsLeft = s.totalPellets;
    s.player = { x: 10, y: 16, dir: DIRS.left, nextDir: DIRS.left };
    s.ghosts = GHOST_START.map((pos, i) => ({
      x: pos.x, y: pos.y,
      dir: DIRS.up,
      scared: false, eaten: false,
      color: GHOST_COLORS[i],
      emoji: GHOST_EMOJIS[i],
    }));
    s.scaredTimer = 0;
    s.ghostEatMultiplier = 1;
    s.dying = false;
    s.dyingTimer = 0;
    s.won = false;
    if (!keepScore) { s.score = 0; s.lives = 3; s.level = 1; }
  }, []);

  // ── Ghost AI ──────────────────────────────────────────────────────────────
  function moveGhost(ghost: Ghost, maze: number[][], playerX: number, playerY: number, level: number) {
    const speed = GHOST_SPEED + level * 0.005;
    // Try to move in current dir; if blocked, pick new dir
    const nx = ghost.x + ghost.dir.x * speed;
    const ny = ghost.y + ghost.dir.y * speed;
    const blocked = !isWalkable(maze, nx, ny);

    if (!blocked) {
      ghost.x = nx;
      ghost.y = ny;
      // At grid center, maybe change direction (chase or scatter)
      const cx = Math.round(ghost.x);
      const cy = Math.round(ghost.y);
      if (Math.abs(ghost.x - cx) < speed && Math.abs(ghost.y - cy) < speed) {
        ghost.x = cx; ghost.y = cy;
        // Choose next direction
        const possible = Object.values(DIRS).filter(d => {
          const rev = ghost.dir.x === -d.x && ghost.dir.y === -d.y;
          if (rev) return false;
          return isWalkable(maze, cx + d.x, cy + d.y);
        });
        if (possible.length === 0) {
          // reverse
          ghost.dir = { x: -ghost.dir.x, y: -ghost.dir.y };
        } else if (ghost.scared) {
          // random when scared
          ghost.dir = possible[Math.floor(Math.random() * possible.length)];
        } else {
          // Chase player
          const sorted = possible.sort((a, b) => {
            const da = Math.hypot(cx + a.x - playerX, cy + a.y - playerY);
            const db = Math.hypot(cx + b.x - playerX, cy + b.y - playerY);
            return da - db;
          });
          ghost.dir = sorted[0];
        }
      }
    } else {
      // Snap to grid and pick new dir
      ghost.x = Math.round(ghost.x);
      ghost.y = Math.round(ghost.y);
      const possible = Object.values(DIRS).filter(d => isWalkable(maze, ghost.x + d.x, ghost.y + d.y));
      if (possible.length > 0) ghost.dir = possible[Math.floor(Math.random() * possible.length)];
    }
  }

  // ── Draw ──────────────────────────────────────────────────────────────────
  function draw(ctx: CanvasRenderingContext2D, now: number) {
    const s = stateRef.current;
    const W = COLS * CELL;
    const H = ROWS * CELL;

    // Background
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, W, H);

    // Maze walls & pellets
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = s.maze[r][c];
        const px = c * CELL;
        const py = r * CELL;
        if (v === 0) {
          // Wall — dojo tile
          ctx.fillStyle = "#1a0a2e";
          ctx.fillRect(px, py, CELL, CELL);
          ctx.strokeStyle = "#4a1a8e";
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 1, py + 1, CELL - 2, CELL - 2);
        } else if (v === 1) {
          // Belt token pellet
          ctx.fillStyle = "#ffd700";
          ctx.beginPath();
          ctx.arc(px + CELL / 2, py + CELL / 2, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (v === 2) {
          // Power pellet — pulsing star
          const pulse = 0.6 + 0.4 * Math.sin(now / 300);
          ctx.font = `${14 * pulse}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("⭐", px + CELL / 2, py + CELL / 2);
        } else if (v === 4) {
          // Ghost house door
          ctx.fillStyle = "#ff69b4";
          ctx.fillRect(px + 4, py + CELL / 2 - 2, CELL - 8, 4);
        }
      }
    }

    // Ghosts
    for (const g of s.ghosts) {
      if (g.eaten) continue;
      const px = g.x * CELL;
      const py = g.y * CELL;
      ctx.font = `${CELL - 4}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (g.scared) {
        // Flashing when about to un-scare
        const flash = s.scaredTimer < 2000 && Math.floor(now / 300) % 2 === 0;
        ctx.globalAlpha = flash ? 0.4 : 1;
        ctx.fillText("👻", px + CELL / 2, py + CELL / 2);
        ctx.globalAlpha = 1;
      } else {
        ctx.fillText(g.emoji, px + CELL / 2, py + CELL / 2);
      }
    }

    // Player ninja
    if (!s.dying || s.dyingTimer < 800) {
      const px = s.player.x * CELL;
      const py = s.player.y * CELL;
      const spin = s.dying ? (s.dyingTimer / 800) * Math.PI * 4 : 0;
      ctx.save();
      ctx.translate(px + CELL / 2, py + CELL / 2);
      ctx.rotate(spin);
      ctx.font = `${CELL - 2}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🥷", 0, 0);
      ctx.restore();
    }
  }

  // ── Game loop ─────────────────────────────────────────────────────────────
  const loop = useCallback((now: number) => {
    const dt = now - lastTimeRef.current;
    lastTimeRef.current = now;
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    if (s.dying) {
      s.dyingTimer += dt;
      draw(ctx, now);
      if (s.dyingTimer > 1200) {
        s.lives--;
        if (s.lives <= 0) {
          s.gameOver = true;
          setPhase("gameover");
          onGameOver(s.score);
          return;
        }
        // Reset positions only
        s.player = { x: 10, y: 16, dir: DIRS.left, nextDir: DIRS.left };
        s.ghosts = GHOST_START.map((pos, i) => ({
          x: pos.x, y: pos.y, dir: DIRS.up,
          scared: false, eaten: false,
          color: GHOST_COLORS[i], emoji: GHOST_EMOJIS[i],
        }));
        s.dying = false;
        s.dyingTimer = 0;
        setDisplayLives(s.lives);
        setPhase("playing");
      }
      animRef.current = requestAnimationFrame(loop);
      return;
    }

    if (!s.started || s.gameOver) {
      draw(ctx, now);
      animRef.current = requestAnimationFrame(loop);
      return;
    }

    // Move player
    const p = s.player;
    const speed = SPEED + s.level * 0.005;
    if (canMove(s.maze, p.x, p.y, p.nextDir)) p.dir = p.nextDir;
    if (canMove(s.maze, p.x, p.y, p.dir)) {
      p.x += p.dir.x * speed;
      p.y += p.dir.y * speed;
      // Tunnel wrap
      if (p.x < 0) p.x = COLS - 1;
      if (p.x >= COLS) p.x = 0;
    }

    // Collect pellets
    const pr = Math.round(p.y);
    const pc = Math.round(p.x);
    if (pr >= 0 && pr < ROWS && pc >= 0 && pc < COLS) {
      const cell = s.maze[pr][pc];
      if (cell === 1) {
        s.maze[pr][pc] = 3;
        s.score += 10;
        s.pelletsLeft--;
        setDisplayScore(s.score);
      } else if (cell === 2) {
        s.maze[pr][pc] = 3;
        s.score += 50;
        s.pelletsLeft--;
        s.scaredTimer = SCARED_DURATION;
        s.ghostEatMultiplier = 1;
        for (const g of s.ghosts) { g.scared = true; g.eaten = false; }
        setDisplayScore(s.score);
      }
    }

    // Scared timer
    if (s.scaredTimer > 0) {
      s.scaredTimer -= dt;
      if (s.scaredTimer <= 0) {
        s.scaredTimer = 0;
        for (const g of s.ghosts) g.scared = false;
      }
    }

    // Move ghosts
    for (const g of s.ghosts) {
      if (g.eaten) continue;
      moveGhost(g, s.maze, p.x, p.y, s.level);
    }

    // Collision detection
    for (const g of s.ghosts) {
      if (g.eaten) continue;
      const dist = Math.hypot(g.x - p.x, g.y - p.y);
      if (dist < 0.7) {
        if (g.scared) {
          // Eat ghost
          g.eaten = true;
          s.score += 200 * s.ghostEatMultiplier;
          s.ghostEatMultiplier *= 2;
          setDisplayScore(s.score);
        } else {
          // Ninja dies
          s.dying = true;
          s.dyingTimer = 0;
          setPhase("dying");
        }
      }
    }

    // Level complete
    if (s.pelletsLeft <= 0) {
      s.level++;
      setDisplayLevel(s.level);
      setPhase("levelup");
      s.started = false;
      resetLevel(true);
      setTimeout(() => {
        s.started = true;
        setPhase("playing");
      }, 2000);
    }

    draw(ctx, now);
    animRef.current = requestAnimationFrame(loop);
  }, [onGameOver, resetLevel]);

  // ── Start game loop ───────────────────────────────────────────────────────
  useEffect(() => {
    lastTimeRef.current = performance.now();
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [loop]);

  const startGame = () => {
    resetLevel(false);
    stateRef.current.started = true;
    setDisplayScore(0);
    setDisplayLives(3);
    setDisplayLevel(1);
    setPhase("playing");
  };

  const W = COLS * CELL;
  const H = ROWS * CELL;

  return (
    <div
      className="w-screen h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 100%)" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header HUD */}
      <div className="flex items-center justify-between w-full px-4 py-2 max-w-2xl">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-6">
          {/* Lives */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={`text-xl ${i < displayLives ? "opacity-100" : "opacity-20"}`}>🥷</span>
            ))}
          </div>
          {/* Score */}
          <div className="text-center">
            <p className="text-yellow-400 font-black text-2xl tabular-nums">{displayScore.toLocaleString()}</p>
            <p className="text-white/40 text-xs">SCORE</p>
          </div>
          {/* Level */}
          <div className="text-center">
            <p className="text-purple-400 font-black text-2xl">{displayLevel}</p>
            <p className="text-white/40 text-xs">LEVEL</p>
          </div>
          {/* High score */}
          <div className="flex items-center gap-1 text-amber-400">
            <Trophy className="w-4 h-4" />
            <span className="font-bold text-sm">{Math.max(highScore, displayScore).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative" style={{ width: W, height: H }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="block rounded-xl"
          style={{ border: "2px solid rgba(138,43,226,0.6)", boxShadow: "0 0 40px rgba(138,43,226,0.4)" }}
        />

        {/* Ready overlay */}
        {phase === "ready" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl"
            style={{ background: "rgba(0,0,0,0.82)" }}>
            <div className="text-7xl mb-4">🥷</div>
            <h2 className="text-4xl font-black text-white uppercase tracking-widest mb-2">NINJA MAZE</h2>
            <p className="text-purple-300 text-lg mb-1">Collect all belt tokens</p>
            <p className="text-white/50 text-sm mb-6">Avoid the Senseis — grab ⭐ to turn them into ghosts!</p>
            <div className="flex gap-6 mb-8 text-sm text-white/60">
              <span>🥋 = 10 pts</span>
              <span>⭐ = 50 pts</span>
              <span>👻 = 200+ pts</span>
            </div>
            <button
              onClick={startGame}
              className="px-10 py-4 rounded-2xl font-black text-xl text-white uppercase tracking-widest"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", boxShadow: "0 0 30px rgba(168,85,247,0.6)" }}
            >
              START GAME
            </button>
            <p className="text-white/30 text-xs mt-4">Use arrow keys or swipe to move</p>
          </div>
        )}

        {/* Level up overlay */}
        {phase === "levelup" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl"
            style={{ background: "rgba(0,0,0,0.7)" }}>
            <div className="text-6xl mb-3">🏆</div>
            <h2 className="text-3xl font-black text-yellow-400 uppercase tracking-widest">LEVEL {displayLevel}!</h2>
            <p className="text-white/60 mt-2">Senseis are getting faster...</p>
          </div>
        )}

        {/* Dying overlay */}
        {phase === "dying" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl pointer-events-none"
            style={{ background: "rgba(200,0,0,0.15)" }}>
            <div className="text-5xl animate-bounce">💥</div>
          </div>
        )}

        {/* Game over overlay */}
        {phase === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl"
            style={{ background: "rgba(0,0,0,0.88)" }}>
            <div className="text-6xl mb-3">💀</div>
            <h2 className="text-4xl font-black text-red-400 uppercase tracking-widest mb-1">GAME OVER</h2>
            <p className="text-white/60 mb-1">Final Score</p>
            <p className="text-5xl font-black text-yellow-400 mb-2">{displayScore.toLocaleString()}</p>
            {displayScore > highScore && (
              <div className="flex items-center gap-2 text-yellow-300 mb-4">
                <Trophy className="w-5 h-5" />
                <span className="font-bold">New High Score!</span>
              </div>
            )}
            <div className="flex gap-4 mt-4">
              <button
                onClick={startGame}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white"
                style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
              >
                <RotateCcw className="w-4 h-4" /> Play Again
              </button>
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white/70 border border-white/20"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            </div>
          </div>
        )}
      </div>

      {/* D-pad for touch */}
      <div className="mt-3 grid grid-cols-3 gap-1" style={{ width: 120 }}>
        {[
          { label: "↑", dir: "up", col: 2, row: 1 },
          { label: "←", dir: "left", col: 1, row: 2 },
          { label: "↓", dir: "down", col: 2, row: 3 },
          { label: "→", dir: "right", col: 3, row: 2 },
        ].map(({ label, dir, col, row }) => (
          <button
            key={dir}
            onTouchStart={(e) => {
              e.preventDefault();
              const s = stateRef.current;
              if (s.started && !s.gameOver && !s.dying) s.player.nextDir = DIRS[dir];
            }}
            onClick={() => {
              const s = stateRef.current;
              if (s.started && !s.gameOver && !s.dying) s.player.nextDir = DIRS[dir];
            }}
            className="w-9 h-9 rounded-lg text-white font-black text-lg flex items-center justify-center select-none"
            style={{
              gridColumn: col, gridRow: row,
              background: "rgba(138,43,226,0.4)",
              border: "1px solid rgba(168,85,247,0.5)",
            }}
          >
            {label}
          </button>
        ))}
        <div style={{ gridColumn: 2, gridRow: 2 }} />
      </div>
    </div>
  );
}
