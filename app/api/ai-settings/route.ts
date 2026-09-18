import { NextResponse } from "next/server";
import { getDoc, patchDoc, setDoc } from "@/lib/store";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const DEFAULTS = {
  provider: "gemini",
  openaiKey: "",
  openaiModel: "gpt-4o-mini",
  geminiKey: "",
  geminiModel: "gemini-3.8-flash",
  claudeKey: "",
  claudeModel: "claude-3-7-sonnet-20250219",
  openrouterKey: "",
  openrouterModel: "deepseek/deepseek-chat",
  customName: "DeepSeek / Custom AI",
  customBaseUrl: "https://api.deepseek.com/v1",
  customKey: "",
  customModel: "deepseek-chat",
  assistantName: "Portfolio Assistant",
  greeting: "Hi! I'm here to answer any questions about this portfolio. Ask me anything!",
};

// Public: non-sensitive fields only (no API keys).
export async function GET() {
  try {
    const data = await getDoc<Record<string, string>>("ai-settings", DEFAULTS);
    const {
      assistantName,
      greeting,
      provider,
      openaiModel,
      geminiModel,
      claudeModel,
      openrouterModel,
      customName,
      customModel,
    } = data;
    return NextResponse.json({
      assistantName: assistantName || DEFAULTS.assistantName,
      greeting: greeting || DEFAULTS.greeting,
      provider: provider || DEFAULTS.provider,
      openaiModel: openaiModel || DEFAULTS.openaiModel,
      geminiModel: geminiModel || DEFAULTS.geminiModel,
      claudeModel: claudeModel || DEFAULTS.claudeModel,
      openrouterModel: openrouterModel || DEFAULTS.openrouterModel,
      customName: customName || DEFAULTS.customName,
      customModel: customModel || DEFAULTS.customModel,
    });
  } catch {
    return NextResponse.json(
      {
        assistantName: DEFAULTS.assistantName,
        greeting: DEFAULTS.greeting,
        provider: DEFAULTS.provider,
        geminiModel: DEFAULTS.geminiModel,
      },
      { status: 200 }
    );
  }
}

// Admin-only: full settings including keys.
export async function POST() {
  const jar = await cookies();
  if (!jar.get("admin_session")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const data = await getDoc<Record<string, string>>("ai-settings", DEFAULTS);
    return NextResponse.json({ ...DEFAULTS, ...data });
  } catch (err) {
    console.error("Failed to load AI settings:", err);
    return NextResponse.json(DEFAULTS, { status: 200 });
  }
}

export async function PUT(req: Request) {
  const jar = await cookies();
  if (!jar.get("admin_session")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as Record<string, string>;
    const current = await getDoc<Record<string, string>>("ai-settings", DEFAULTS);

    // Merge settings: only preserve existing keys if the incoming value is explicitly undefined/null
    const merged: Record<string, string> = { ...DEFAULTS, ...current };
    for (const [k, v] of Object.entries(body)) {
      if (v !== undefined) {
        merged[k] = v;
      }
    }

    await setDoc("ai-settings", merged);
    return NextResponse.json({
      ok: true,
      updatedAt: new Date().toISOString(),
      provider: merged.provider,
      settings: merged,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to save AI settings";
    console.error("AI settings save error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
