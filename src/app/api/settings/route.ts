import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/storage";

// GET: check if password is set (don't return actual password)
export async function GET() {
  const data = readData();
  return NextResponse.json({
    hasPassword: !!data.classPassword,
    classPassword: data.classPassword,
  });
}

// POST: various actions
export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = readData();

  switch (body.action) {
    case "verify-password": {
      const valid = !data.classPassword || body.password === data.classPassword;
      return NextResponse.json({ valid });
    }
    case "set-password": {
      data.classPassword = body.password || "";
      writeData(data);
      return NextResponse.json({ ok: true });
    }
    case "remove-password": {
      data.classPassword = "";
      writeData(data);
      return NextResponse.json({ ok: true });
    }
    case "verify-pin": {
      const valid = body.pin === (data.adminPin || "1234");
      return NextResponse.json({ valid });
    }
    case "change-pin": {
      if (body.currentPin !== (data.adminPin || "1234")) {
        return NextResponse.json({ error: "Sai PIN" }, { status: 403 });
      }
      data.adminPin = body.newPin;
      writeData(data);
      return NextResponse.json({ ok: true });
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
