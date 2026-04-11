import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/storage";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({
    hasPassword: !!settings.classPassword,
    classPassword: settings.classPassword,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const settings = await getSettings();

  switch (body.action) {
    case "verify-password": {
      const valid = !settings.classPassword || body.password === settings.classPassword;
      return NextResponse.json({ valid });
    }
    case "set-password": {
      settings.classPassword = body.password || "";
      await saveSettings(settings);
      return NextResponse.json({ ok: true });
    }
    case "remove-password": {
      settings.classPassword = "";
      await saveSettings(settings);
      return NextResponse.json({ ok: true });
    }
    case "verify-pin": {
      const valid = body.pin === (settings.adminPin || "1234");
      return NextResponse.json({ valid });
    }
    case "change-pin": {
      if (body.currentPin !== (settings.adminPin || "1234")) {
        return NextResponse.json({ error: "Sai PIN" }, { status: 403 });
      }
      settings.adminPin = body.newPin;
      await saveSettings(settings);
      return NextResponse.json({ ok: true });
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
