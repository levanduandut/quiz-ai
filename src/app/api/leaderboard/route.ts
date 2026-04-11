import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/storage";

export async function GET() {
  const data = readData();
  return NextResponse.json(data.leaderboard);
}

export async function POST(req: NextRequest) {
  const entry = await req.json();
  const data = readData();

  const existingIndex = data.leaderboard.findIndex(
    (e) =>
      e.player === entry.player &&
      e.subject === entry.subject &&
      (entry.subject === "teacher"
        ? e.topic === entry.topic
        : e.grade === entry.grade),
  );

  if (existingIndex >= 0) {
    if (entry.score > data.leaderboard[existingIndex].score) {
      data.leaderboard[existingIndex] = entry;
    }
  } else {
    data.leaderboard.push(entry);
  }

  data.leaderboard.sort((a, b) => b.score - a.score);
  data.leaderboard = data.leaderboard.slice(0, 100);

  writeData(data);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const data = readData();
  data.leaderboard = [];
  writeData(data);
  return NextResponse.json({ ok: true });
}
