import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard, saveLeaderboard } from "@/lib/storage";

export async function GET() {
  const lb = await getLeaderboard();
  return NextResponse.json(lb);
}

export async function POST(req: NextRequest) {
  const entry = await req.json();
  const lb = await getLeaderboard();

  const existingIndex = lb.findIndex(
    (e) =>
      e.player === entry.player &&
      (entry.isTeacher
        ? e.isTeacher && e.topic === entry.topic
        : !e.isTeacher && e.subject === entry.subject && e.grade === entry.grade),
  );

  if (existingIndex >= 0) {
    if (entry.score > lb[existingIndex].score) {
      lb[existingIndex] = entry;
    }
  } else {
    lb.push(entry);
  }

  lb.sort((a, b) => b.score - a.score);
  await saveLeaderboard(lb.slice(0, 100));
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await saveLeaderboard([]);
  return NextResponse.json({ ok: true });
}
