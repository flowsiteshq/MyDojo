export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

// ─── Belt Rank Progression ────────────────────────────────────────────────────
export const BELT_RANKS = [
  "No Belt",
  "White Belt",
  "Yellow Belt",
  "Orange Belt",
  "Green Belt",
  "Advanced Green",
  "Blue Belt",
  "Advanced Blue",
  "Purple Belt",
  "Advanced Purple",
  "Brown Belt",
  "Advanced Brown",
  "Probationary Black",
  "Black Belt 1st Dan",
  "Black Belt 2nd Dan",
  "Black Belt 3rd Dan",
  "Black Belt 4th Dan",
  "Black Belt 5th Dan",
  "Black Belt 6th Dan",
] as const;

export type BeltRank = (typeof BELT_RANKS)[number];

// ─── Stripe Color Cycle ───────────────────────────────────────────────────────
/**
 * Each stripe POSITION cycles through these colors as phases are completed.
 * Phase 1 = White stripe, Phase 2 = Yellow stripe, Phase 3 = Red stripe, Phase 4 = Black stripe.
 * The new stripe is placed directly OVER the old one on the same position.
 */
export const STRIPE_COLORS = ["white", "yellow", "red", "black"] as const;
export type StripeColor = (typeof STRIPE_COLORS)[number];

/** Hex values for each stripe color (used in UI) */
export const STRIPE_COLOR_HEX: Record<StripeColor, string> = {
  white:  "#f3f4f6",
  yellow: "#fbbf24",
  red:    "#ef4444",
  black:  "#1f2937",
};

// ─── Belt Exam Fee ────────────────────────────────────────────────────────────
export const BELT_EXAM_FEE = 49;

// ─── In-Class vs Exam Belts ───────────────────────────────────────────────────
/**
 * Belts awarded by the instructor in class (no exam, no fee).
 * No Belt → White Belt → Yellow Belt → Orange Belt are all in-class.
 */
export const IN_CLASS_BELTS: readonly string[] = [
  "No Belt",
  "White Belt",
  "Yellow Belt",
];

/**
 * Belts that require a belt exam AND the $49 exam fee to advance.
 * Orange Belt is the first exam belt (Orange → Green).
 */
export const EXAM_REQUIRED_BELTS: readonly string[] = [
  "Orange Belt",
  "Green Belt",
  "Advanced Green",
  "Blue Belt",
  "Advanced Blue",
  "Purple Belt",
  "Advanced Purple",
  "Brown Belt",
  "Advanced Brown",
  "Probationary Black",
  "Black Belt 1st Dan",
  "Black Belt 2nd Dan",
  "Black Belt 3rd Dan",
  "Black Belt 4th Dan",
  "Black Belt 5th Dan",
];

// ─── Stripe Position Counts ───────────────────────────────────────────────────
/**
 * Beginner belts (White, Yellow, Orange):
 *   4 stripe POSITIONS on the belt.
 *   Each position cycles through 4 colors (phases) = 16 classes total.
 *   Display: single row of 4 dots.
 */
export const BEGINNER_STRIPE_POSITIONS = 4;

/**
 * Advanced belts (Green and above):
 *   8 stripe POSITIONS on the belt (4 top + 4 bottom).
 *   Each position cycles through 4 colors (phases) = 32 classes total.
 *   Display: 4 dots on top row + 4 dots on bottom row.
 */
export const ADVANCED_STRIPE_POSITIONS = 8;

/** Number of color phases per position (always 4: White→Yellow→Red→Black) */
export const STRIPE_PHASES = 4;

/** No Belt → White Belt requires only 1 class (awarded in next class). */
export const NO_BELT_CLASSES_REQUIRED = 1;

/** Beginner belts: 4 positions × 4 phases = 16 classes total */
export const BEGINNER_CLASSES_REQUIRED = BEGINNER_STRIPE_POSITIONS * STRIPE_PHASES; // 16

/** Advanced belts: 8 positions × 4 phases = 32 classes total */
export const ADVANCED_CLASSES_REQUIRED = ADVANCED_STRIPE_POSITIONS * STRIPE_PHASES; // 32

/** Belts that use the beginner stripe layout (4 positions, 16 classes) */
export const BEGINNER_STRIPE_BELTS: readonly string[] = [
  "No Belt",
  "White Belt",
  "Yellow Belt",
  "Orange Belt",
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

/** Returns whether the belt is awarded in class (no exam required). */
export function isInClassBelt(currentBelt: string): boolean {
  return IN_CLASS_BELTS.includes(currentBelt);
}

/** Returns whether the belt requires an exam to advance. */
export function requiresBeltExam(currentBelt: string): boolean {
  return EXAM_REQUIRED_BELTS.includes(currentBelt);
}

/** Returns the next belt rank, or null if at the top. */
export function nextBeltRank(currentBelt: string): string | null {
  const idx = BELT_RANKS.indexOf(currentBelt as BeltRank);
  if (idx === -1 || idx >= BELT_RANKS.length - 1) return null;
  return BELT_RANKS[idx + 1];
}

/** Returns the number of stripe positions for the given belt (4 for beginners, 8 for advanced). */
export function stripePositions(currentBelt: string): number {
  return BEGINNER_STRIPE_BELTS.includes(currentBelt)
    ? BEGINNER_STRIPE_POSITIONS
    : ADVANCED_STRIPE_POSITIONS;
}

/** Returns the total classes required to complete all phases for the given belt. */
export function totalClassesRequired(currentBelt: string): number {
  if (currentBelt === 'No Belt') return NO_BELT_CLASSES_REQUIRED;
  return stripePositions(currentBelt) * STRIPE_PHASES;
}

/** Alias used by belt-ready notification trigger */
export function classesRequiredForNextBelt(currentBelt: string): number {
  return totalClassesRequired(currentBelt);
}

/**
 * Computes the current color of each stripe position given the number of classes
 * attended at the current belt.
 *
 * Logic:
 *   - There are N positions (4 for beginners, 8 for advanced).
 *   - Each class fills one position in order (position 0, 1, 2, ... N-1, then wraps to next phase).
 *   - After N classes (phase 1 complete), the cycle restarts: each position advances to the next color.
 *   - A position's color = STRIPE_COLORS[phase - 1] if it has been filled in the current phase,
 *     or STRIPE_COLORS[phase - 2] (previous phase color) if not yet reached in the current phase.
 *
 * Returns an array of N objects: { filled: boolean, color: StripeColor | null }
 * where `filled` means the position has been earned in the CURRENT phase,
 * and `color` is the color the dot should display (null = empty/unearned first phase).
 */
export function computeStripePositions(
  currentBelt: string,
  classesAtBelt: number
): Array<{ filled: boolean; color: StripeColor | null; phaseColor: StripeColor }> {
  const n = stripePositions(currentBelt);
  const total = n * STRIPE_PHASES;
  const capped = Math.min(classesAtBelt, total);

  // Which phase are we in? (0-indexed: 0 = phase 1, 3 = phase 4)
  const currentPhaseIdx = Math.min(Math.floor(capped / n), STRIPE_PHASES - 1);
  // How many positions have been filled in the current phase?
  const filledInCurrentPhase = capped % n;
  // If all phases complete, all positions are filled with black
  const allComplete = classesAtBelt >= total;

  return Array.from({ length: n }, (_, i) => {
    // The color this position CURRENTLY shows on the physical belt:
    // If we've passed this position in the current phase → current phase color
    // Otherwise → previous phase color (or null if phase 0 and not yet filled)
    let displayPhaseIdx: number;
    if (allComplete) {
      displayPhaseIdx = STRIPE_PHASES - 1; // all black
    } else if (i < filledInCurrentPhase) {
      displayPhaseIdx = currentPhaseIdx; // earned in current phase
    } else {
      displayPhaseIdx = currentPhaseIdx - 1; // still showing previous phase color
    }

    const filled = allComplete || i < filledInCurrentPhase;
    const phaseColor = STRIPE_COLORS[currentPhaseIdx]; // color of the current phase
    const color: StripeColor | null = displayPhaseIdx < 0 ? null : STRIPE_COLORS[displayPhaseIdx];

    return { filled, color, phaseColor };
  });
}

/**
 * Returns a simple progress summary for the backend getProgressStats procedure.
 */
export function computeStripeProgress(currentBelt: string, classesAtBelt: number): {
  phase: number;
  stripesInPhase: number;
  stripesPerPhase: number;
  totalRequired: number;
  allPhasesComplete: boolean;
  positions: Array<{ filled: boolean; color: StripeColor | null; phaseColor: StripeColor }>;
  isAdvanced: boolean;
} {
  const n = stripePositions(currentBelt);
  const total = n * STRIPE_PHASES;
  const capped = Math.min(classesAtBelt, total);
  const currentPhaseIdx = Math.min(Math.floor(capped / n), STRIPE_PHASES - 1);
  const filledInCurrentPhase = capped % n;
  const allPhasesComplete = classesAtBelt >= total;
  const positions = computeStripePositions(currentBelt, classesAtBelt);

  return {
    phase: currentPhaseIdx + 1,
    stripesInPhase: filledInCurrentPhase,
    stripesPerPhase: n,
    totalRequired: total,
    allPhasesComplete,
    positions,
    isAdvanced: !BEGINNER_STRIPE_BELTS.includes(currentBelt),
  };
}
