export interface BeltLevel {
  id: string;
  color: string;
  name: string;
  title: string;
  description: string;
  values: string[];
  skills: string[];
  textColor: string; // For the belt text
  borderColor: string; // For the belt border
}

export const beltLevels: BeltLevel[] = [
  {
    id: "white",
    color: "#ffffff",
    name: "White Belt",
    title: "The Beginning",
    description: "The journey of a thousand miles begins with a single step. White belt represents purity and an open mind, ready to learn.",
    values: ["Respect", "Focus", "Listening"],
    skills: ["Basic Stance", "Front Kick", "First Form"],
    textColor: "#000000",
    borderColor: "#e5e7eb"
  },
  {
    id: "yellow",
    color: "#facc15",
    name: "Yellow Belt",
    title: "The Foundation",
    description: "Like a seed receiving its first sunlight, the student begins to grow. Basic techniques are refined and confidence starts to build.",
    values: ["Confidence", "Discipline", "Effort"],
    skills: ["Roundhouse Kick", "Basic Blocks", "Self-Defense 1"],
    textColor: "#000000",
    borderColor: "#ca8a04"
  },
  {
    id: "orange",
    color: "#f97316",
    name: "Orange Belt",
    title: "The Spark",
    description: "Momentum builds as the student's physical skills improve. The sun warms the earth, preparing it for new growth.",
    values: ["Perseverance", "Courage", "Intensity"],
    skills: ["Side Kick", "Combinations", "Sparring Basics"],
    textColor: "#ffffff",
    borderColor: "#c2410c"
  },
  {
    id: "green",
    color: "#22c55e",
    name: "Green Belt",
    title: "The Growth",
    description: "The plant begins to sprout leaves. Skills become more fluid, and the student starts to understand the deeper meaning of movement.",
    values: ["Patience", "Control", "Balance"],
    skills: ["Hook Kick", "Advanced Forms", "Grappling Basics"],
    textColor: "#ffffff",
    borderColor: "#15803d"
  },
  {
    id: "blue",
    color: "#3b82f6",
    name: "Blue Belt",
    title: "The Sky",
    description: "The plant grows toward the sky. The student aims higher, refining their technique and developing mental toughness.",
    values: ["Integrity", "Loyalty", "Spirit"],
    skills: ["Jump Kicks", "Advanced Sparring", "Board Breaking"],
    textColor: "#ffffff",
    borderColor: "#1d4ed8"
  },
  {
    id: "brown",
    color: "#78350f",
    name: "Brown Belt",
    title: "The Earth",
    description: "The tree has strong roots in the earth. The student is grounded, powerful, and preparing for the final step to mastery.",
    values: ["Humility", "Leadership", "Dedication"],
    skills: ["Spin Kicks", "Multiple Attackers", "Teaching Basics"],
    textColor: "#ffffff",
    borderColor: "#451a03"
  },
  {
    id: "black",
    color: "#000000",
    name: "Black Belt",
    title: "The Master",
    description: "The opposite of white, signifying maturity and proficiency. But it is not the end—it is a new beginning of deeper understanding.",
    values: ["Honor", "Excellence", "Indomitable Spirit"],
    skills: ["Mastery of Forms", "Advanced Self-Defense", "Mentorship"],
    textColor: "#ffffff",
    borderColor: "#000000"
  }
];
