/**
 * GameNinjaMaze.tsx
 * Pac-Man style martial arts maze game for the MyDojo kiosk.
 *
 * 🥷 Ninja (player) collects belt tokens and power-ups through a dojo maze.
 * 👹 Enemy Senseis chase the ninja — collect a power star to turn them into ghosts!
 * Lives: 3  |  Levels: speed & enemies increase each level  |  Score saved on game over.
 *
 * Ghost fix: Ghosts spawn on open corridor cells and use BFS pathfinding to exit
 * and chase the player. Each ghost has a unique scatter target so they spread out.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { RotateCcw, ArrowLeft, Trophy } from "lucide-react";

interface Props {
  onGameOver: (score: number) => void;
  onBack: () => void;
  highScore: number;
}

// ── Maze layout ────────────────────────────────────────────────────────────
// 0 = wall, 1 = pellet, 2 = power pellet, 3 = empty corridor
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
  [0,0,0,0,1,0,3,0,3,3,3,3,3,0,3,0,1,0,0,0,0],
  [1,1,1,1,1,3,3,0,3,3,3,3,3,0,3,3,1,1,1,1,1],
  [0,0,0,0,1,0,3,0,3,3,3,3,3,0,3,0,1,0,0,0,0],
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
const DIR_LIST = Object.values(DIRS);

interface Entity {
  x: number;
  y: number;
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
  // BFS target for scatter mode
  scatterTarget: { x: number; y: number };
  // release delay in ms — stagger ghost exits
  releaseDelay: number;
  released: boolean;
}

const GHOST_COLORS = ["#FF4444", "#FFB8FF", "#00FFFF", "#FFB852"];
const GHOST_EMOJIS = ["👹", "👺", "🤡", "💀"];

// Ghosts spawn on open corridor cells spread across the maze
const GHOST_SPAWN: { x: number; y: number }[] = [
  { x: 9,  y: 10 },  // center
  { x: 11, y: 10 },  // center-right
  { x: 9,  y: 11 },  // center-bottom-left
  { x: 11, y: 11 },  // center-bottom-right
];

// Scatter corners — each ghost retreats to a different corner
const SCATTER_TARGETS = [
  { x: 1,  y: 1  },  // top-left
  { x: 19, y: 1  },  // top-right
  { x: 1,  y: 19 },  // bottom-left
  { x: 19, y: 19 },  // bottom-right
];

// Stagger ghost releases: 0, 3, 6, 9 seconds
const RELEASE_DELAYS = [0, 3000, 6000, 9000];

const CELL = 28;
const SPEED = 0.09;
const GHOST_SPEED = 0.07;
const SCARED_DURATION = 8000;

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
  return maze[r][c] !== 0;
}

function canMove(maze: number[][], x: number, y: number, dir: Dir): boolean {
  return isWalkable(maze, x + dir.x * 0.6, y + dir.y * 0.6);
}

// BFS to find best next direction toward target
function bfsDir(maze: number[][], fromX: number, fromY: number, toX: number, toY: number, currentDir: Dir): Dir {
  const sx = Math.round(fromX);
  const sy = Math.round(fromY);
  const tx = Math.round(toX);
  const ty = Math.round(toY);
  if (sx === tx && sy === ty) return currentDir;

  // BFS
  const visited = new Set<string>();
  const queue: { x: number; y: number; firstDir: Dir }[] = [];
  visited.add(`${sx},${sy}`);

  for (const d of DIR_LIST) {
    const nx = sx + d.x;
    const ny = sy + d.y;
    if (isWalkable(maze, nx, ny) && !visited.has(`${nx},${ny}`)) {
      visited.add(`${nx},${ny}`);
      queue.push({ x: nx, y: ny, firstDir: d });
    }
  }

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.x === tx && cur.y === ty) return cur.firstDir;
    for (const d of DIR_LIST) {
      const nx = cur.x + d.x;
      const ny = cur.y + d.y;
      const key = `${nx},${ny}`;
      if (isWalkable(maze, nx, ny) && !visited.has(key)) {
        visited.add(key);
        queue.push({ x: nx, y: ny, firstDir: cur.firstDir });
      }
    }
  }
  return currentDir;
}

function makeGhosts(): Ghost[] {
  return GHOST_SPAWN.map((pos, i) => ({
    x: pos.x,
    y: pos.y,
    dir: DIRS.up,
    scared: false,
    eaten: false,
    color: GHOST_COLORS[i],
    emoji: GHOST_EMOJIS[i],
    scatterTarget: SCATTER_TARGETS[i],
    releaseDelay: RELEASE_DELAYS[i],
    released: i === 0, // first ghost releases immediately
  }));
}

export default function GameNinjaMaze({ onGameOver, onBack, highScore }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    maze: deepCopyMaze(BASE_MAZE),
    totalPellets: countPellets(BASE_MAZE),
    pelletsLeft: countPellets(BASE_MAZE),
    player: { x: 10, y: 16, dir: DIRS.left, nextDir: DIRS.left } as Entity,
    ghosts: makeGhosts(),
    score: 0,
    lives: 3,
    level: 1,
    scaredTimer: 0,
    ghostEatMultiplier: 1,
    gameOver: false,
    won: false,
    dying: false,
    dyingTimer: 0,
    elapsedMs: 0,   // total ms since game started — used for ghost release timing
    frameCount: 0,
    started: false,
  });

  const [displayScore, setDisplayScore] = useState(0);
  const [displayLives, setDisplayLives] = useState(3);
  const [displayLevel, setDisplayLevel] = useState(1);
  const [phase, setPhase] = useState<"ready" | "playing" | "dying" | "gameover" | "levelup">("ready");
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // ── Key handling ──────────────────────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (!s.started || s.gameOver || s.dying) return;
      if (e.key === "ArrowUp")    { e.preventDefault(); s.player.nextDir = DIRS.up; }
      if (e.key === "ArrowDown")  { e.preventDefault(); s.player.nextDir = DIRS.down; }
      if (e.key === "ArrowLeft")  { e.preventDefault(); s.player.nextDir = DIRS.left; }
      if (e.key === "ArrowRight") { e.preventDefault(); s.player.nextDir = DIRS.right; }
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
    s.ghosts = makeGhosts();
    s.scaredTimer = 0;
    s.ghostEatMultiplier = 1;
    s.dying = false;
    s.dyingTimer = 0;
    s.elapsedMs = 0;
    s.won = false;
    if (!keepScore) { s.score = 0; s.lives = 3; s.level = 1; }
  }, []);

  // ── Ghost movement ────────────────────────────────────────────────────────
  function moveGhost(ghost: Ghost, maze: number[][], playerX: number, playerY: number, level: number, dt: number) {
    if (!ghost.released) return;

    const speed = (GHOST_SPEED + level * 0.004) * (dt / 16.67);

    // Snap to grid when close enough to center
    const cx = Math.round(ghost.x);
    const cy = Math.round(ghost.y);
    const atCenter = Math.abs(ghost.x - cx) < speed * 1.5 && Math.abs(ghost.y - cy) < speed * 1.5;

    if (atCenter) {
      ghost.x = cx;
      ghost.y = cy;

      // Choose next direction via BFS
      let targetX: number, targetY: number;
      if (ghost.scared) {
        // Run away — pick random open direction
        const possible = DIR_LIST.filter(d => isWalkable(maze, cx + d.x, cy + d.y));
        if (possible.length > 0) {
          ghost.dir = possible[Math.floor(Math.random() * possible.length)];
        }
        ghost.x += ghost.dir.x * speed;
        ghost.y += ghost.dir.y * speed;
        return;
      } else {
        // Chase player (with 80% probability) or scatter (20%)
        if (Math.random() < 0.8) {
          targetX = playerX;
          targetY = playerY;
        } else {
          targetX = ghost.scatterTarget.x;
          targetY = ghost.scatterTarget.y;
        }
      }

      const bestDir = bfsDir(maze, cx, cy, targetX, targetY, ghost.dir);
      // Verify the chosen direction is actually walkable
      if (isWalkable(maze, cx + bestDir.x, cy + bestDir.y)) {
        ghost.dir = bestDir;
      } else {
        // Fallback: pick any walkable direction
        const possible = DIR_LIST.filter(d => isWalkable(maze, cx + d.x, cy + d.y));
        if (possible.length > 0) ghost.dir = possible[Math.floor(Math.random() * possible.length)];
      }
    }

    // Move in current direction
    const nx = ghost.x + ghost.dir.x * speed;
    const ny = ghost.y + ghost.dir.y * speed;
    if (isWalkable(maze, nx, ny)) {
      ghost.x = nx;
      ghost.y = ny;
    } else {
      // Snap and pick new direction
      ghost.x = Math.round(ghost.x);
      ghost.y = Math.round(ghost.y);
      const possible = DIR_LIST.filter(d => isWalkable(maze, ghost.x + d.x, ghost.y + d.y));
      if (possible.length > 0) ghost.dir = possible[Math.floor(Math.random() * possible.length)];
    }
  }

  // ── Draw ──────────────────────────────────────────────────────────────────
  function draw(ctx: CanvasRenderingContext2D, now: number) {
    const s = stateRef.current;
    const W = COLS * CELL;
    const H = ROWS * CELL;

    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, W, H);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = s.maze[r][c];
        const px = c * CELL;
        const py = r * CELL;
        if (v === 0) {
          ctx.fillStyle = "#1a0a2e";
          ctx.fillRect(px, py, CELL, CELL);
          ctx.strokeStyle = "#4a1a8e";
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 1, py + 1, CELL - 2, CELL - 2);
        } else if (v === 1) {
          ctx.fillStyle = "#ffd700";
          ctx.beginPath();
          ctx.arc(px + CELL / 2, py + CELL / 2, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (v === 2) {
          const pulse = 0.6 + 0.4 * Math.sin(now / 300);
          ctx.font = `${14 * pulse}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("⭐", px + CELL / 2, py + CELL / 2);
        }
      }
    }

    // Ghosts
    for (const g of s.ghosts) {
      if (g.eaten) continue;
      if (!g.released) continue;
      const px = g.x * CELL;
      const py = g.y * CELL;
      ctx.font = `${CELL - 4}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (g.scared) {
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
    const dt = Math.min(now - lastTimeRef.current, 50); // cap dt at 50ms to avoid huge jumps
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
        s.player = { x: 10, y: 16, dir: DIRS.left, nextDir: DIRS.left };
        s.ghosts = makeGhosts();
        s.elapsedMs = 0;
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

    s.elapsedMs += dt;

    // Release ghosts on schedule
    for (const g of s.ghosts) {
      if (!g.released && s.elapsedMs >= g.releaseDelay) {
        g.released = true;
        // Move ghost to a corridor exit point
        g.x = 10;
        g.y = 8;
        g.dir = DIRS.up;
      }
    }

    // Move player
    const p = s.player;
    const speed = (SPEED + s.level * 0.005) * (dt / 16.67);
    if (canMove(s.maze, p.x, p.y, p.nextDir)) p.dir = p.nextDir;
    if (canMove(s.maze, p.x, p.y, p.dir)) {
      p.x += p.dir.x * speed;
      p.y += p.dir.y * speed;
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
      moveGhost(g, s.maze, p.x, p.y, s.level, dt);
    }

    // Collision detection
    for (const g of s.ghosts) {
      if (g.eaten || !g.released) continue;
      const dist = Math.hypot(g.x - p.x, g.y - p.y);
      if (dist < 0.75) {
        if (g.scared) {
          g.eaten = true;
          s.score += 200 * s.ghostEatMultiplier;
          s.ghostEatMultiplier *= 2;
          setDisplayScore(s.score);
        } else {
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
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={`text-xl ${i < displayLives ? "opacity-100" : "opacity-20"}`}>🥷</span>
            ))}
          </div>
          <div className="text-center">
            <p className="text-yellow-400 font-black text-2xl tabular-nums">{displayScore.toLocaleString()}</p>
            <p className="text-white/40 text-xs">SCORE</p>
          </div>
          <div className="text-center">
            <p className="text-purple-400 font-black text-2xl">{displayLevel}</p>
            <p className="text-white/40 text-xs">LEVEL</p>
          </div>
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
            <p className="text-white/30 text-xs mt-4">Use arrow keys, swipe, or D-pad to move</p>
          </div>
        )}

        {phase === "levelup" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl"
            style={{ background: "rgba(0,0,0,0.7)" }}>
            <div className="text-6xl mb-3">🏆</div>
            <h2 className="text-3xl font-black text-yellow-400 uppercase tracking-widest">LEVEL {displayLevel}!</h2>
            <p className="text-white/60 mt-2">Senseis are getting faster...</p>
          </div>
        )}

        {phase === "dying" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl pointer-events-none"
            style={{ background: "rgba(200,0,0,0.15)" }}>
            <div className="text-5xl animate-bounce">💥</div>
          </div>
        )}

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

      {/* D-pad */}
      <div className="mt-3 grid grid-cols-3 gap-1" style={{ width: 120 }}>
        {[
          { label: "↑", dir: "up",    col: 2, row: 1 },
          { label: "←", dir: "left",  col: 1, row: 2 },
          { label: "↓", dir: "down",  col: 2, row: 3 },
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
