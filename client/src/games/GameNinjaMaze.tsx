/**
 * GameNinjaMaze.tsx — Pac-Man style martial arts maze game (EFFECTS EDITION)
 *
 * NEW EFFECTS:
 * 🎆 Particle explosions on pellet collect, ghost eat, and ninja death
 * 📳 Screen shake on death and power-up
 * 💥 Floating score pop-ups (+10, +50, +200, COMBO x4!)
 * 🌟 Power-up radial glow pulse when star is collected
 * 👻 Ghost death burst (color-matched particle spray)
 * 🔥 Ninja movement trail (fading footprints)
 * ⚡ Combo multiplier display (x2, x4, x8 ghost chain)
 * 🌈 Scared ghost flicker + color shift
 * 🏯 Animated maze walls (subtle breathing glow)
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { RotateCcw, ArrowLeft, Trophy } from "lucide-react";

interface Props {
  onGameOver: (score: number) => void;
  onBack: () => void;
  highScore: number;
}

// ── Maze layout ────────────────────────────────────────────────────────────
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

interface Entity { x: number; y: number; dir: Dir; nextDir: Dir; }

interface Ghost {
  x: number; y: number; dir: Dir;
  scared: boolean; eaten: boolean;
  color: string; emoji: string;
  scatterTarget: { x: number; y: number };
  releaseDelay: number; released: boolean;
}

// ── Effect types ───────────────────────────────────────────────────────────
interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  color: string; size: number;
  gravity: number;
}

interface ScorePopup {
  x: number; y: number;
  text: string; color: string;
  life: number; maxLife: number;
  scale: number;
}

interface TrailDot {
  x: number; y: number;
  life: number; maxLife: number;
}

const GHOST_COLORS = ["#FF4444", "#FFB8FF", "#00FFFF", "#FFB852"];
const GHOST_EMOJIS = ["👹", "👺", "🤡", "💀"];

const GHOST_SPAWN: { x: number; y: number }[] = [
  { x: 9,  y: 10 },
  { x: 11, y: 10 },
  { x: 9,  y: 11 },
  { x: 11, y: 11 },
];

const SCATTER_TARGETS = [
  { x: 1,  y: 1  },
  { x: 19, y: 1  },
  { x: 1,  y: 19 },
  { x: 19, y: 19 },
];

const RELEASE_DELAYS = [0, 3000, 6000, 9000];
const CELL = 28;
const SPEED = 0.09;
const GHOST_SPEED = 0.07;
const SCARED_DURATION = 8000;

function deepCopyMaze(m: number[][]): number[][] { return m.map(row => [...row]); }
function countPellets(maze: number[][]): number {
  let n = 0;
  for (const row of maze) for (const c of row) if (c === 1 || c === 2) n++;
  return n;
}
function isWalkable(maze: number[][], col: number, row: number): boolean {
  const r = Math.round(row); const c = Math.round(col);
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
  return maze[r][c] !== 0;
}
function canMove(maze: number[][], x: number, y: number, dir: Dir): boolean {
  return isWalkable(maze, x + dir.x * 0.6, y + dir.y * 0.6);
}
function bfsDir(maze: number[][], fromX: number, fromY: number, toX: number, toY: number, currentDir: Dir): Dir {
  const sx = Math.round(fromX); const sy = Math.round(fromY);
  const tx = Math.round(toX);   const ty = Math.round(toY);
  if (sx === tx && sy === ty) return currentDir;
  const visited = new Set<string>();
  const queue: { x: number; y: number; firstDir: Dir }[] = [];
  visited.add(`${sx},${sy}`);
  for (const d of DIR_LIST) {
    const nx = sx + d.x; const ny = sy + d.y;
    if (isWalkable(maze, nx, ny) && !visited.has(`${nx},${ny}`)) {
      visited.add(`${nx},${ny}`);
      queue.push({ x: nx, y: ny, firstDir: d });
    }
  }
  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.x === tx && cur.y === ty) return cur.firstDir;
    for (const d of DIR_LIST) {
      const nx = cur.x + d.x; const ny = cur.y + d.y;
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
    x: pos.x, y: pos.y, dir: DIRS.up,
    scared: false, eaten: false,
    color: GHOST_COLORS[i], emoji: GHOST_EMOJIS[i],
    scatterTarget: SCATTER_TARGETS[i],
    releaseDelay: RELEASE_DELAYS[i],
    released: i === 0,
  }));
}

// ── Particle helpers ───────────────────────────────────────────────────────
function spawnParticles(
  particles: Particle[],
  cx: number, cy: number,
  count: number,
  color: string,
  speed = 3,
  size = 4,
  gravity = 0.1,
  life = 600
) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const spd = speed * (0.5 + Math.random());
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life, maxLife: life,
      color, size: size * (0.5 + Math.random()),
      gravity,
    });
  }
}

function spawnScorePopup(popups: ScorePopup[], cx: number, cy: number, text: string, color: string) {
  popups.push({ x: cx, y: cy, text, color, life: 900, maxLife: 900, scale: 1.4 });
}

export default function GameNinjaMaze({ onGameOver, onBack, highScore }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Effect state (kept in refs to avoid re-renders)
  const particlesRef = useRef<Particle[]>([]);
  const popupsRef    = useRef<ScorePopup[]>([]);
  const trailRef     = useRef<TrailDot[]>([]);
  const shakeRef     = useRef({ x: 0, y: 0, intensity: 0, duration: 0 });
  const powerGlowRef = useRef({ active: false, timer: 0, x: 0, y: 0 });

  const stateRef = useRef({
    maze: deepCopyMaze(BASE_MAZE),
    totalPellets: countPellets(BASE_MAZE),
    pelletsLeft: countPellets(BASE_MAZE),
    player: { x: 10, y: 16, dir: DIRS.left, nextDir: DIRS.left } as Entity,
    ghosts: makeGhosts(),
    score: 0, lives: 3, level: 1,
    scaredTimer: 0, ghostEatMultiplier: 1,
    gameOver: false, won: false, dying: false, dyingTimer: 0,
    elapsedMs: 0, frameCount: 0, started: false,
  });

  const [displayScore, setDisplayScore] = useState(0);
  const [displayLives, setDisplayLives] = useState(3);
  const [displayLevel, setDisplayLevel] = useState(1);
  const [comboDisplay, setComboDisplay] = useState(0);
  const [phase, setPhase] = useState<"ready"|"playing"|"dying"|"gameover"|"levelup">("ready");
  const animRef    = useRef<number>(0);
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
    s.scaredTimer = 0; s.ghostEatMultiplier = 1;
    s.dying = false; s.dyingTimer = 0; s.elapsedMs = 0; s.won = false;
    if (!keepScore) { s.score = 0; s.lives = 3; s.level = 1; }
    particlesRef.current = [];
    popupsRef.current = [];
    trailRef.current = [];
    shakeRef.current = { x: 0, y: 0, intensity: 0, duration: 0 };
    powerGlowRef.current = { active: false, timer: 0, x: 0, y: 0 };
  }, []);

  // ── Ghost movement ────────────────────────────────────────────────────────
  function moveGhost(ghost: Ghost, maze: number[][], playerX: number, playerY: number, level: number, dt: number) {
    if (!ghost.released) return;
    const speed = (GHOST_SPEED + level * 0.004) * (dt / 16.67);
    const cx = Math.round(ghost.x); const cy = Math.round(ghost.y);
    const atCenter = Math.abs(ghost.x - cx) < speed * 1.5 && Math.abs(ghost.y - cy) < speed * 1.5;

    if (atCenter) {
      ghost.x = cx; ghost.y = cy;
      if (ghost.scared) {
        const possible = DIR_LIST.filter(d => isWalkable(maze, cx + d.x, cy + d.y));
        if (possible.length > 0) ghost.dir = possible[Math.floor(Math.random() * possible.length)];
        ghost.x += ghost.dir.x * speed;
        ghost.y += ghost.dir.y * speed;
        return;
      }
      let targetX: number, targetY: number;
      if (Math.random() < 0.8) { targetX = playerX; targetY = playerY; }
      else { targetX = ghost.scatterTarget.x; targetY = ghost.scatterTarget.y; }
      const bestDir = bfsDir(maze, cx, cy, targetX, targetY, ghost.dir);
      if (isWalkable(maze, cx + bestDir.x, cy + bestDir.y)) {
        ghost.dir = bestDir;
      } else {
        const possible = DIR_LIST.filter(d => isWalkable(maze, cx + d.x, cy + d.y));
        if (possible.length > 0) ghost.dir = possible[Math.floor(Math.random() * possible.length)];
      }
    }
    const nx = ghost.x + ghost.dir.x * speed;
    const ny = ghost.y + ghost.dir.y * speed;
    if (isWalkable(maze, nx, ny)) { ghost.x = nx; ghost.y = ny; }
    else {
      ghost.x = Math.round(ghost.x); ghost.y = Math.round(ghost.y);
      const possible = DIR_LIST.filter(d => isWalkable(maze, ghost.x + d.x, ghost.y + d.y));
      if (possible.length > 0) ghost.dir = possible[Math.floor(Math.random() * possible.length)];
    }
  }

  // ── Draw ──────────────────────────────────────────────────────────────────
  function draw(ctx: CanvasRenderingContext2D, now: number, dt: number) {
    const s = stateRef.current;
    const W = COLS * CELL;
    const H = ROWS * CELL;

    // Screen shake
    const shake = shakeRef.current;
    if (shake.duration > 0) {
      shake.duration -= dt;
      shake.x = (Math.random() - 0.5) * shake.intensity;
      shake.y = (Math.random() - 0.5) * shake.intensity;
      if (shake.duration <= 0) { shake.x = 0; shake.y = 0; shake.intensity = 0; }
    }

    ctx.save();
    ctx.translate(shake.x, shake.y);

    // Background
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, W, H);

    // Power glow radial burst
    const pg = powerGlowRef.current;
    if (pg.active) {
      pg.timer -= dt;
      if (pg.timer <= 0) { pg.active = false; }
      else {
        const progress = 1 - pg.timer / 1200;
        const radius = progress * W * 0.8;
        const alpha = (1 - progress) * 0.35;
        const grad = ctx.createRadialGradient(pg.x, pg.y, 0, pg.x, pg.y, radius);
        grad.addColorStop(0, `rgba(255,215,0,${alpha})`);
        grad.addColorStop(0.5, `rgba(255,140,0,${alpha * 0.5})`);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      }
    }

    // Maze walls & pellets
    const wallGlow = 0.5 + 0.5 * Math.sin(now / 2000); // subtle breathing
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = s.maze[r][c];
        const px = c * CELL; const py = r * CELL;
        if (v === 0) {
          ctx.fillStyle = "#1a0a2e";
          ctx.fillRect(px, py, CELL, CELL);
          ctx.strokeStyle = `rgba(74,26,142,${0.4 + wallGlow * 0.3})`;
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 1, py + 1, CELL - 2, CELL - 2);
        } else if (v === 1) {
          // Belt token pellet with subtle glow
          ctx.shadowColor = "#ffd700";
          ctx.shadowBlur = 6;
          ctx.fillStyle = "#ffd700";
          ctx.beginPath();
          ctx.arc(px + CELL / 2, py + CELL / 2, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (v === 2) {
          const pulse = 0.7 + 0.3 * Math.sin(now / 250);
          const starSize = 14 * pulse;
          // Glow ring around power star
          ctx.shadowColor = "#ffd700";
          ctx.shadowBlur = 15 * pulse;
          ctx.font = `${starSize}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("⭐", px + CELL / 2, py + CELL / 2);
          ctx.shadowBlur = 0;
        }
      }
    }

    // Ninja trail
    const trail = trailRef.current;
    for (let i = trail.length - 1; i >= 0; i--) {
      const t = trail[i];
      t.life -= dt;
      if (t.life <= 0) { trail.splice(i, 1); continue; }
      const alpha = (t.life / t.maxLife) * 0.5;
      ctx.globalAlpha = alpha;
      ctx.font = `${Math.round(CELL * 0.5)}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("👣", t.x * CELL + CELL / 2, t.y * CELL + CELL / 2);
      ctx.globalAlpha = 1;
    }

    // Ghosts
    for (const g of s.ghosts) {
      if (g.eaten || !g.released) continue;
      const px = g.x * CELL; const py = g.y * CELL;
      ctx.font = `${CELL - 4}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (g.scared) {
        const flash = s.scaredTimer < 2000 && Math.floor(now / 250) % 2 === 0;
        // Scared ghost color shift
        const scaredProgress = 1 - s.scaredTimer / SCARED_DURATION;
        ctx.globalAlpha = flash ? 0.35 : 1;
        // Draw a colored circle behind the ghost when scared
        if (!flash) {
          const scaredColor = scaredProgress > 0.7 ? "#ff4444" : "#4444ff";
          ctx.shadowColor = scaredColor;
          ctx.shadowBlur = 12;
        }
        ctx.fillText("👻", px + CELL / 2, py + CELL / 2);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      } else {
        // Normal ghost with color glow
        ctx.shadowColor = g.color;
        ctx.shadowBlur = 10;
        ctx.fillText(g.emoji, px + CELL / 2, py + CELL / 2);
        ctx.shadowBlur = 0;
      }
    }

    // Player ninja
    if (!s.dying || s.dyingTimer < 900) {
      const px = s.player.x * CELL; const py = s.player.y * CELL;
      const spin = s.dying ? (s.dyingTimer / 900) * Math.PI * 6 : 0;
      const scale = s.dying ? Math.max(0, 1 - s.dyingTimer / 900) : 1;
      ctx.save();
      ctx.translate(px + CELL / 2, py + CELL / 2);
      ctx.rotate(spin);
      ctx.scale(scale, scale);
      // Ninja glow
      ctx.shadowColor = "#a855f7";
      ctx.shadowBlur = s.dying ? 0 : 12;
      ctx.font = `${CELL - 2}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🥷", 0, 0);
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Particles
    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.x += p.vx * (dt / 16.67);
      p.y += p.vy * (dt / 16.67);
      p.vy += p.gravity * (dt / 16.67);
      p.vx *= 0.97;
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    // Score popups
    const popups = popupsRef.current;
    for (let i = popups.length - 1; i >= 0; i--) {
      const pop = popups[i];
      pop.life -= dt;
      if (pop.life <= 0) { popups.splice(i, 1); continue; }
      const progress = 1 - pop.life / pop.maxLife;
      const alpha = pop.life / pop.maxLife;
      const scale = pop.scale * (1 + progress * 0.3);
      pop.y -= 0.8 * (dt / 16.67); // float upward
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(pop.x, pop.y);
      ctx.scale(scale, scale);
      ctx.font = `bold ${14}px 'Arial', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = pop.color;
      ctx.shadowColor = pop.color;
      ctx.shadowBlur = 8;
      ctx.fillText(pop.text, 0, 0);
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    ctx.restore(); // end shake transform
  }

  // ── Game loop ─────────────────────────────────────────────────────────────
  const loop = useCallback((now: number) => {
    const dt = Math.min(now - lastTimeRef.current, 50);
    lastTimeRef.current = now;
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    if (s.dying) {
      s.dyingTimer += dt;
      // Spawn death particles on first frame
      if (s.dyingTimer < dt * 2) {
        const px = s.player.x * CELL + CELL / 2;
        const py = s.player.y * CELL + CELL / 2;
        spawnParticles(particlesRef.current, px, py, 24, "#ff4444", 5, 5, 0.15, 800);
        spawnParticles(particlesRef.current, px, py, 16, "#ff8800", 3, 3, 0.1, 600);
        spawnParticles(particlesRef.current, px, py, 8, "#ffffff", 2, 2, 0.05, 400);
        shakeRef.current = { x: 0, y: 0, intensity: 10, duration: 500 };
      }
      draw(ctx, now, dt);
      if (s.dyingTimer > 1400) {
        s.lives--;
        if (s.lives <= 0) {
          s.gameOver = true;
          setPhase("gameover");
          onGameOver(s.score);
          return;
        }
        s.player = { x: 10, y: 16, dir: DIRS.left, nextDir: DIRS.left };
        s.ghosts = makeGhosts();
        s.elapsedMs = 0; s.dying = false; s.dyingTimer = 0;
        setDisplayLives(s.lives);
        setPhase("playing");
      }
      animRef.current = requestAnimationFrame(loop);
      return;
    }

    if (!s.started || s.gameOver) {
      draw(ctx, now, dt);
      animRef.current = requestAnimationFrame(loop);
      return;
    }

    s.elapsedMs += dt;

    // Release ghosts on schedule
    for (const g of s.ghosts) {
      if (!g.released && s.elapsedMs >= g.releaseDelay) {
        g.released = true;
        g.x = 10; g.y = 8; g.dir = DIRS.up;
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

    // Ninja trail (add a dot every ~8 frames)
    s.frameCount++;
    if (s.frameCount % 8 === 0) {
      trailRef.current.push({ x: p.x, y: p.y, life: 400, maxLife: 400 });
      if (trailRef.current.length > 20) trailRef.current.shift();
    }

    // Collect pellets
    const pr = Math.round(p.y); const pc = Math.round(p.x);
    if (pr >= 0 && pr < ROWS && pc >= 0 && pc < COLS) {
      const cell = s.maze[pr][pc];
      if (cell === 1) {
        s.maze[pr][pc] = 3;
        s.score += 10;
        s.pelletsLeft--;
        setDisplayScore(s.score);
        // Small pellet collect particles
        const cx = pc * CELL + CELL / 2; const cy = pr * CELL + CELL / 2;
        spawnParticles(particlesRef.current, cx, cy, 6, "#ffd700", 2, 2, 0.05, 300);
        spawnScorePopup(popupsRef.current, cx, cy - 10, "+10", "#ffd700");
      } else if (cell === 2) {
        s.maze[pr][pc] = 3;
        s.score += 50;
        s.pelletsLeft--;
        s.scaredTimer = SCARED_DURATION;
        s.ghostEatMultiplier = 1;
        for (const g of s.ghosts) { g.scared = true; g.eaten = false; }
        setDisplayScore(s.score);
        setComboDisplay(0);
        // Big power-up burst
        const cx = pc * CELL + CELL / 2; const cy = pr * CELL + CELL / 2;
        spawnParticles(particlesRef.current, cx, cy, 30, "#ffd700", 6, 6, 0.12, 800);
        spawnParticles(particlesRef.current, cx, cy, 20, "#ff8800", 4, 4, 0.08, 600);
        spawnParticles(particlesRef.current, cx, cy, 10, "#ffffff", 3, 3, 0.05, 400);
        spawnScorePopup(popupsRef.current, cx, cy - 15, "⭐ POWER UP! +50", "#ffd700");
        shakeRef.current = { x: 0, y: 0, intensity: 5, duration: 200 };
        powerGlowRef.current = { active: true, timer: 1200, x: cx, y: cy };
      }
    }

    // Scared timer
    if (s.scaredTimer > 0) {
      s.scaredTimer -= dt;
      if (s.scaredTimer <= 0) {
        s.scaredTimer = 0;
        for (const g of s.ghosts) g.scared = false;
        setComboDisplay(0);
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
          const pts = 200 * s.ghostEatMultiplier;
          s.score += pts;
          s.ghostEatMultiplier *= 2;
          setDisplayScore(s.score);
          setComboDisplay(s.ghostEatMultiplier);
          // Ghost death burst
          const gx = g.x * CELL + CELL / 2; const gy = g.y * CELL + CELL / 2;
          spawnParticles(particlesRef.current, gx, gy, 20, g.color, 5, 5, 0.08, 700);
          spawnParticles(particlesRef.current, gx, gy, 10, "#ffffff", 3, 2, 0.05, 400);
          const comboText = s.ghostEatMultiplier > 2
            ? `COMBO x${s.ghostEatMultiplier / 2}! +${pts}`
            : `+${pts}`;
          spawnScorePopup(popupsRef.current, gx, gy - 15, comboText,
            s.ghostEatMultiplier > 4 ? "#ff4444" : s.ghostEatMultiplier > 2 ? "#ff8800" : "#00ffff");
          shakeRef.current = { x: 0, y: 0, intensity: 4, duration: 150 };
        } else {
          s.dying = true; s.dyingTimer = 0;
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
      // Level up burst
      const cx = COLS * CELL / 2; const cy = ROWS * CELL / 2;
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          spawnParticles(particlesRef.current, cx + (Math.random()-0.5)*200, cy + (Math.random()-0.5)*200,
            15, ["#ffd700","#ff4444","#00ffff","#a855f7","#ff8800"][i], 4, 4, 0.06, 700);
        }, i * 150);
      }
      setTimeout(() => { s.started = true; setPhase("playing"); }, 2500);
    }

    draw(ctx, now, dt);
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
    setDisplayScore(0); setDisplayLives(3); setDisplayLevel(1); setComboDisplay(0);
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
        <div className="flex items-center gap-5">
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
          {comboDisplay > 2 && (
            <div className="text-center animate-pulse">
              <p className="text-red-400 font-black text-xl">x{comboDisplay / 2}</p>
              <p className="text-white/40 text-xs">COMBO</p>
            </div>
          )}
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
            <div className="text-7xl mb-4" style={{ filter: "drop-shadow(0 0 20px #a855f7)" }}>🥷</div>
            <h2 className="text-4xl font-black text-white uppercase tracking-widest mb-2">NINJA MAZE</h2>
            <p className="text-purple-300 text-lg mb-1">Collect all belt tokens</p>
            <p className="text-white/50 text-sm mb-6">Grab ⭐ to power up — then eat the Senseis for combo points!</p>
            <div className="flex gap-6 mb-8 text-sm text-white/60">
              <span>🥋 = 10 pts</span>
              <span>⭐ = 50 pts</span>
              <span>👻 = 200+ pts</span>
              <span>🔥 Combos = 2x/4x/8x</span>
            </div>
            <button
              onClick={startGame}
              className="px-10 py-4 rounded-2xl font-black text-xl text-white uppercase tracking-widest"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", boxShadow: "0 0 30px rgba(168,85,247,0.6)" }}
            >
              START GAME
            </button>
            <p className="text-white/30 text-xs mt-4">Arrow keys · Swipe · D-pad</p>
          </div>
        )}

        {phase === "levelup" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl"
            style={{ background: "rgba(0,0,0,0.7)" }}>
            <div className="text-6xl mb-3" style={{ filter: "drop-shadow(0 0 20px #ffd700)" }}>🏆</div>
            <h2 className="text-3xl font-black text-yellow-400 uppercase tracking-widest">LEVEL {displayLevel}!</h2>
            <p className="text-white/60 mt-2">Senseis are getting faster...</p>
          </div>
        )}

        {phase === "dying" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl pointer-events-none"
            style={{ background: "rgba(200,0,0,0.12)" }}>
            <div className="text-5xl" style={{ animation: "none" }}>💥</div>
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
