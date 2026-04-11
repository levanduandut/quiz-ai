import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "quiz-data.json");

interface AppData {
  classPassword: string;
  adminPin: string;
  exercises: ExerciseSet[];
  leaderboard: LeaderboardEntry[];
}

export interface ExerciseSet {
  id: string;
  name: string;
  createdAt: string;
  questions: Question[];
}

export interface Question {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface LeaderboardEntry {
  player: string;
  score: number;
  correctCount: number;
  total: number;
  subject: string;
  grade: string;
  topic?: string;
  date: string;
}

const DEFAULT_DATA: AppData = {
  classPassword: "",
  adminPin: "1234",
  exercises: [],
  leaderboard: [],
};

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readData(): AppData {
  ensureDir();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return { ...DEFAULT_DATA, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_DATA };
  }
}

export function writeData(data: AppData): void {
  ensureDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}
