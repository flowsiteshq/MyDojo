export interface QuizOption {
  id: string;
  label: string;
  icon?: string;
  nextQuestionId?: string; // If null, this leads to a result
  resultId?: string; // The ID of the program recommended
}

export interface QuizQuestion {
  id: string;
  text: string;
  subtext?: string;
  options: QuizOption[];
}

export interface ProgramResult {
  id: string;
  name: string;
  description: string;
  image: string;
  link: string;
  benefits: string[];
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: "q1",
    text: "Who are we looking for today?",
    subtext: "Select the person interested in training.",
    options: [
      { id: "child", label: "My Child", icon: "Baby", nextQuestionId: "q2_child" },
      { id: "adult", label: "Myself / Adult", icon: "User", nextQuestionId: "q2_adult" },
      { id: "family", label: "The Whole Family", icon: "Users", resultId: "family" }
    ]
  },
  {
    id: "q2_child",
    text: "How old is your child?",
    subtext: "We have age-specific programs for optimal learning.",
    options: [
      { id: "3-5", label: "3 - 5 Years Old", resultId: "little-ninjas" },
      { id: "6-12", label: "6 - 12 Years Old", nextQuestionId: "q3_school_age" },
      { id: "13+", label: "13+ Years Old", resultId: "teens-adults" }
    ]
  },
  {
    id: "q3_school_age",
    text: "What type of program?",
    subtext: "We offer both traditional classes and after-school care.",
    options: [
      { id: "martial-arts", label: "Martial Arts Classes", icon: "Zap", resultId: "dragon-kids" },
      { id: "after-school", label: "After School Pickup", icon: "Bus", resultId: "after-school" }
    ]
  },
  {
    id: "q2_adult",
    text: "What is your primary goal?",
    subtext: "Help us tailor the experience to your needs.",
    options: [
      { id: "fitness", label: "Get Fit & Burn Fat", icon: "Zap", resultId: "kickboxing" },
      { id: "defense", label: "Learn Self-Defense", icon: "Shield", resultId: "teens-adults" },
      { id: "stress", label: "Stress Relief", icon: "Smile", resultId: "kickboxing" }
    ]
  }
];

export const programResults: Record<string, ProgramResult> = {
  "little-ninjas": {
    id: "little-ninjas",
    name: "Little Ninjas",
    description: "Our specialized program for ages 3-5 focuses on listening skills, balance, and coordination in a fun, safe environment.",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/CRAvhHhQitQViikb.jpg",
    link: "/programs/little-ninjas",
    benefits: ["Improved Focus", "Better Balance", "Fun & Safe"]
  },
  "dragon-kids": {
    id: "dragon-kids",
    name: "Dragon Kids",
    description: "For ages 6-12, this program builds confidence, discipline, and self-defense skills that translate to better grades and behavior.",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/jRfpjBmwhTaRoIDg.jpg",
    link: "/programs/core-kids",
    benefits: ["Confidence Building", "Bully Prevention", "Discipline"]
  },
  "after-school": {
    id: "after-school",
    name: "After School Program",
    description: "We pick up your child from school! Includes homework time, martial arts classes, and character development in a safe environment.",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/ZCQGReaYeOoQyxkc.jpg",
    link: "/programs/after-school",
    benefits: ["School Pickup", "Homework Help", "Daily Martial Arts"]
  },
  "teens-adults": {
    id: "teens-adults",
    name: "Teens & Adults Martial Arts",
    description: "A comprehensive martial arts curriculum that combines traditional values with modern self-defense techniques.",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/BDzwdVVYGfFwFaEO.png",
    link: "/programs/teens",
    benefits: ["Real Self-Defense", "Stress Relief", "Full Body Workout"]
  },
  "kickboxing": {
    id: "kickboxing",
    name: "Fitness Kickboxing",
    description: "High-energy, calorie-burning workouts that get you in the best shape of your life without the contact of sparring.",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/fqJvsNaCyZStNXye.jpg",
    link: "/programs/adults",
    benefits: ["Burn 800+ Calories", "Tone Muscle", "High Energy"]
  },
  "family": {
    id: "family",
    name: "Family Classes",
    description: "Train together! Our family classes allow parents and children to bond while learning valuable skills side-by-side.",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/QCDmgxbjdlfUOCPT.jpg",
    link: "/programs",
    benefits: ["Family Bonding", "Shared Goals", "Convenient Schedule"]
  }
};
