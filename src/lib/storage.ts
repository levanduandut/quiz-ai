import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

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

// --- Exercises ---

export async function getExercises(): Promise<ExerciseSet[]> {
  return (await redis.get<ExerciseSet[]>("exercises")) || [];
}

export async function saveExercises(exercises: ExerciseSet[]): Promise<void> {
  await redis.set("exercises", exercises);
}

// --- Leaderboard ---

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  return (await redis.get<LeaderboardEntry[]>("leaderboard")) || [];
}

export async function saveLeaderboard(lb: LeaderboardEntry[]): Promise<void> {
  await redis.set("leaderboard", lb);
}

// --- Settings ---

interface Settings {
  classPassword: string;
  adminPin: string;
}

export async function getSettings(): Promise<Settings> {
  const s = await redis.get<Settings>("settings");
  return s || { classPassword: "", adminPin: "1234" };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await redis.set("settings", settings);
}
