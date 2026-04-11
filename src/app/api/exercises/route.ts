import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/storage";

export async function GET() {
  const data = readData();
  return NextResponse.json(data.exercises);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = readData();

  const set = {
    id: body.id || crypto.randomUUID(),
    name: body.name,
    createdAt: body.createdAt || new Date().toISOString(),
    questions: body.questions,
  };

  const index = data.exercises.findIndex((s) => s.id === set.id);
  if (index >= 0) {
    data.exercises[index] = set;
  } else {
    data.exercises.push(set);
  }

  writeData(data);
  return NextResponse.json(set);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const data = readData();
  data.exercises = data.exercises.filter((s) => s.id !== id);
  writeData(data);
  return NextResponse.json({ ok: true });
}
