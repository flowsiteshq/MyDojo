import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Trophy, Zap, Target, Layers, Gamepad2, ArrowLeft, Medal } from "lucide-react";
import GameTargetBlitz from "@/games/GameTargetBlitz";
import GameReactionStrike from "@/games/GameReactionStrike";
import GameBeltMemory from "@/games/GameBeltMemory";
import GameComboRush from "@/games/GameComboRush";

// ── Types ──────────────────────────────────────────────────────────────────
type ArcadeScreen = "checkin" | "menu" | "playing" | "leaderboard";
type GameId = "target-blitz" | "reaction-strike" | "belt-memory" | "combo-rush";

interface CheckedInStudent {
  enrollmentId: number;
  name: string;
}

// ── Game definitions ───────────────────────────────────────────────────────
const GAMES = [
  {
    id: "target-blitz" as GameId,
    name: "Target Blitz",
    desc: "Tap targets before they vanish!",
    emoji: "🎯",
    color: "#e10600",
    glow: "rgba(225,6,0,0.6)",
    bg: "from-red-950 to-black",
    icon: Target,
  },
  {
    id: "reaction-strike" as GameId,
    name: "Reaction Strike",
    desc: "Test your lightning-fast reflexes!",
    emoji: "⚡",
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.6)",
    bg: "from-blue-950 to-black",
    icon: Zap,
  },
  {
    id: "belt-memory" as GameId,
    name: "Belt Memory",
    desc: "Match the martial arts belts!",
    emoji: "🥋",
    color: "#a855f7",
    glow: "rgba(168,85,247,0.6)",
    bg: "from-purple-950 to-black",
    icon: Layers,
  },
  {
    id: "combo-rush" as GameId,
    name: "Combo Rush",
    desc: "Memorize and repeat the combo!",
    emoji: "🥊",
    color: "#22c55e",
    glow: "rgba(34,197,94,0.6)",
    bg: "from-green-950 to-black",
    icon: Gamepad2,
  },
];

// ── Check-in gate ──────────────────────────────────────────────────────────
function CheckInGate({ onCheckedIn, onSkip }: {
  onCheckedIn: (student: CheckedInStudent) => void;
  onSkip: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const utils = trpc.useUtils();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const isPhone = /^\d{7,}$/.test(query.replace(/\D/g, ""));
      if (isPhone) {
        const r = await utils.kiosk.searchByPhone.fetch({ phone: query.trim() });
        if (r) setResults([r]);
        else setError("No account found.");
      } else {
        const r = await utils.kiosk.searchByName.fetch({ name: query.trim() });
        if (r && r.length > 0) setResults(r);
        else setError("No students found. Try a different name.");
      }
    } catch (e: any) {
      setError(e?.message || "Search failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ background: "radial-gradient(ellipse at center, #1a0000 0%, #000 100%)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-7xl mb-4">🎮</div>
          <h1 className="text-white font-black text-4xl uppercase tracking-wider mb-2">Dojo Arcade</h1>
          <p className="text-white/60">Enter your name or phone to track your scores</p>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Name or phone number..."
            className="flex-1 px-4 py-3 rounded-xl text-white placeholder-white/30 text-lg outline-none"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
            autoFocus
          />
          <button onClick={handleSearch} disabled={loading}
            className="px-6 py-3 rounded-xl font-bold text-white uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #e10600, #ff4400)" }}>
            {loading ? "..." : "Find"}
          </button>
        </div>

        {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

        {results.length > 0 && (
          <div className="space-y-2 mb-6">
            {results.map((r, i) => (
              <button key={i}
                onClick={() => onCheckedIn({
                  enrollmentId: r.id,
                  name: r.studentName || r.customerName || r.name || "Student",
                })}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all active:scale-98"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-lg text-white"
                  style={{ background: "linear-gradient(135deg, #e10600, #ff4400)" }}>
                  {(r.studentName || r.customerName || r.name || "?").charAt(0)}
                </div>
                <div>
                  <p className="text-white font-bold">{r.studentName || r.customerName || r.name}</p>
                  <p className="text-white/40 text-sm">{r.program || "Member"}</p>
                </div>
                <ArrowLeft className="ml-auto w-5 h-5 text-white/40 rotate-180" />
              </button>
            ))}
          </div>
        )}

        <button onClick={onSkip}
          className="w-full py-3 rounded-xl font-bold text-white/50 uppercase tracking-wider transition-all active:scale-95"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          Play as Guest
        </button>
      </div>
    </div>
  );
}

// ── Game menu ──────────────────────────────────────────────────────────────
function GameMenu({
  student,
  onSelectGame,
  onLeaderboard,
  onBack,
}: {
  student: CheckedInStudent | null;
  onSelectGame: (id: GameId) => void;
  onLeaderboard: () => void;
  onBack: () => void;
}) {
  // Fetch student's personal high scores
  const { data: studentScores } = trpc.arcade.getStudentScores.useQuery(
    { enrollmentId: student?.enrollmentId ?? 0 },
    { enabled: !!student?.enrollmentId }
  );

  const highScoreMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (!studentScores) return map;
    for (const s of studentScores) {
      if (!map[s.gameId] || s.score > map[s.gameId]) {
        map[s.gameId] = s.score;
      }
    }
    return map;
  }, [studentScores]);

  return (
    <div className="min-h-screen flex flex-col p-6"
      style={{ background: "radial-gradient(ellipse at center, #0d0d0d 0%, #000 100%)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack}
          className="flex items-center gap-2 text-white/50 hover:text-white text-sm uppercase tracking-wider transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="text-center">
          <h1 className="text-white font-black text-2xl uppercase tracking-wider">🎮 Dojo Arcade</h1>
          {student && (
            <p className="text-white/50 text-sm">Playing as <span className="text-white font-bold">{student.name}</span></p>
          )}
        </div>
        <button onClick={onLeaderboard}
          className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 text-sm uppercase tracking-wider transition-colors">
          <Trophy className="w-4 h-4" /> Board
        </button>
      </div>

      {/* Game grid */}
      <div className="grid grid-cols-2 gap-4 flex-1">
        {GAMES.map(game => {
          const hs = highScoreMap[game.id] ?? 0;
          return (
            <button key={game.id} onClick={() => onSelectGame(game.id)}
              className="relative rounded-2xl p-6 flex flex-col items-center gap-3 text-center transition-all active:scale-95 overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${game.color}20 0%, rgba(0,0,0,0.8) 100%)`,
                border: `2px solid ${game.color}40`,
                boxShadow: `0 0 20px ${game.glow}`,
              }}>
              {/* Glow orb */}
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20 blur-2xl"
                style={{ background: game.color, transform: "translate(30%, -30%)" }} />
              <div className="text-5xl">{game.emoji}</div>
              <div>
                <p className="text-white font-black text-lg uppercase tracking-wide">{game.name}</p>
                <p className="text-white/50 text-xs mt-0.5">{game.desc}</p>
              </div>
              {hs > 0 && (
                <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                  <Trophy className="w-3 h-3" /> {hs} pts
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Leaderboard ────────────────────────────────────────────────────────────
function Leaderboard({ onBack }: { onBack: () => void }) {
  const [activeGame, setActiveGame] = useState<GameId>("target-blitz");
  const { data: scores, isLoading } = trpc.arcade.getLeaderboard.useQuery({
    gameId: activeGame,
    limit: 10,
  });

  const game = GAMES.find(g => g.id === activeGame)!;

  return (
    <div className="min-h-screen flex flex-col p-6"
      style={{ background: "radial-gradient(ellipse at center, #0d0d0d 0%, #000 100%)" }}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack}
          className="flex items-center gap-2 text-white/50 hover:text-white text-sm uppercase tracking-wider transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-white font-black text-2xl uppercase tracking-wider flex-1 text-center">
          🏆 Leaderboard
        </h1>
        <div className="w-16" />
      </div>

      {/* Game tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {GAMES.map(g => (
          <button key={g.id} onClick={() => setActiveGame(g.id)}
            className="flex-shrink-0 px-4 py-2 rounded-xl font-bold text-sm uppercase tracking-wider transition-all"
            style={{
              background: activeGame === g.id ? g.color : "rgba(255,255,255,0.08)",
              color: activeGame === g.id ? "#fff" : "rgba(255,255,255,0.5)",
              border: `1px solid ${activeGame === g.id ? g.color : "rgba(255,255,255,0.1)"}`,
            }}>
            {g.emoji} {g.name}
          </button>
        ))}
      </div>

      {/* Scores */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white/40">Loading...</p>
        </div>
      ) : !scores || scores.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="text-6xl opacity-30">🏆</div>
          <p className="text-white/40 text-lg">No scores yet — be the first!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {scores.map((s, i) => {
            const medals = ["🥇", "🥈", "🥉"];
            const medal = medals[i] ?? `#${i + 1}`;
            return (
              <div key={s.id}
                className="flex items-center gap-4 px-5 py-4 rounded-xl"
                style={{
                  background: i === 0 ? `${game.color}20` : "rgba(255,255,255,0.05)",
                  border: `1px solid ${i === 0 ? `${game.color}40` : "rgba(255,255,255,0.08)"}`,
                }}>
                <span className="text-2xl w-8 text-center">{medal}</span>
                <div className="flex-1">
                  <p className="text-white font-bold">{s.studentName}</p>
                  <p className="text-white/40 text-xs">
                    {new Date(s.playedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-xl" style={{ color: game.color }}>{s.score}</p>
                  <p className="text-white/30 text-xs">pts</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main KioskArcade ───────────────────────────────────────────────────────
export default function KioskArcade() {
  const [screen, setScreen] = useState<ArcadeScreen>("checkin");
  const [student, setStudent] = useState<CheckedInStudent | null>(null);
  const [activeGame, setActiveGame] = useState<GameId | null>(null);

  const saveScore = trpc.arcade.saveScore.useMutation();

  const handleCheckedIn = (s: CheckedInStudent) => {
    setStudent(s);
    setScreen("menu");
  };

  const handleSkip = () => {
    setStudent(null);
    setScreen("menu");
  };

  const handleSelectGame = (id: GameId) => {
    setActiveGame(id);
    setScreen("playing");
  };

  const handleGameOver = async (score: number) => {
    if (!activeGame) return;
    const game = GAMES.find(g => g.id === activeGame)!;
    if (student) {
      try {
        await saveScore.mutateAsync({
          enrollmentId: student.enrollmentId,
          studentName: student.name,
          gameId: activeGame,
          gameName: game.name,
          score,
          level: 1,
          duration: 30,
          checkedIn: 0,
        });
      } catch (e) {
        console.error("Failed to save score:", e);
      }
    }
    // Stay on the game's gameover screen — game component handles "play again" / "back"
  };

  const handleBackToMenu = () => {
    setActiveGame(null);
    setScreen("menu");
  };

  // ── Render ──
  if (screen === "checkin") {
    return <CheckInGate onCheckedIn={handleCheckedIn} onSkip={handleSkip} />;
  }

  if (screen === "leaderboard") {
    return <Leaderboard onBack={() => setScreen("menu")} />;
  }

  if (screen === "playing" && activeGame) {
    const game = GAMES.find(g => g.id === activeGame)!;
    const highScore = 0; // Could fetch from student scores if needed

    const commonProps = {
      onGameOver: handleGameOver,
      onBack: handleBackToMenu,
      highScore,
    };

    return (
      <div className="w-screen h-screen overflow-hidden">
        {activeGame === "target-blitz" && <GameTargetBlitz {...commonProps} />}
        {activeGame === "reaction-strike" && <GameReactionStrike {...commonProps} />}
        {activeGame === "belt-memory" && <GameBeltMemory {...commonProps} />}
        {activeGame === "combo-rush" && <GameComboRush {...commonProps} />}
      </div>
    );
  }

  return (
    <GameMenu
      student={student}
      onSelectGame={handleSelectGame}
      onLeaderboard={() => setScreen("leaderboard")}
      onBack={() => setScreen("checkin")}
    />
  );
}
