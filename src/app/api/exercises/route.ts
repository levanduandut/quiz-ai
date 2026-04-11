import { NextRequest, NextResponse } from "next/server";
import { getExercises, saveExercises } from "@/lib/storage";

export async function GET() {
  const exercises = await getExercises();
  return NextResponse.json(exercises);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const exercises = await getExercises();

  const set = {
    id: body.id || crypto.randomUUID(),
    name: body.name,
    createdAt: body.createdAt || new Date().toISOString(),
    questions: body.questions,
  };

  const index = exercises.findIndex((s) => s.id === set.id);
  if (index >= 0) {
    exercises[index] = set;
  } else {
    exercises.push(set);
  }

  await saveExercises(exercises);
  return NextResponse.json(set);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const exercises = await getExercises();
  await saveExercises(exercises.filter((s) => s.id !== id));
  return NextResponse.json({ ok: true });
}
