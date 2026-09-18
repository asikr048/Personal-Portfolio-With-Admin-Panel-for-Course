import { NextResponse } from "next/server";
import { getDoc } from "@/lib/store";

export const dynamic = "force-dynamic";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AiSettings {
  provider: string;
  openaiKey: string;
  openaiModel: string;
  geminiKey: string;
  geminiModel: string;
  claudeKey: string;
  claudeModel: string;
  openrouterKey: string;
  openrouterModel: string;
  customName?: string;
  customBaseUrl?: string;
  customKey?: string;
  customModel?: string;
  assistantName: string;
}

// Build the full site context from all stored documents
async function buildSiteContext(): Promise<string> {
  try {
    const config = await getDoc<Record<string, string>>("config", {});
    const projects = await getDoc<{ items: Record<string, unknown>[] }>("projects", { items: [] });
    const career = await getDoc<{
      intro: string;
      sections: { title: string; items: Record<string, string>[] }[];
    }>("career", { intro: "", sections: [] });
    const skills = await getDoc<{ groups: { name: string; items: string[] }[] }>("skills", { groups: [] });

    const projectList = (projects.items || [])
      .map(
        (p) =>
          `• ${p.title} (${p.category}, ${p.year}): ${p.description}. Tech: ${((p.tech as string[]) || []).join(
            ", "
          )}. ${p.link ? `Link: ${p.link}` : ""}`
      )
      .join("\n");

    const careerList = (career.sections || [])
      .map(
        (s) =>
          `${s.title}:\n` +
          (s.items || [])
            .map((i) => `  • ${i.title} at ${i.org || "N/A"} (${i.years}) — ${i.type}`)
            .join("\n")
      )
      .join("\n\n");

    const skillList = (skills.groups || [])
      .map((g) => `${g.name}: ${(g.items || []).join(", ")}`)
      .join("\n");

    return `
=== PORTFOLIO OWNER PROFILE ===
Name: ${config.heroTitle || "N/A"}
Role/Title: ${config.heroSubtitle || "N/A"}
Location: ${config.location || "N/A"}
Email: ${config.email || "N/A"}
About: ${config.aboutText || "N/A"}
GitHub: ${config.github || "N/A"}
LinkedIn: ${config.linkedin || "N/A"}
Twitter: ${config.twitter || "N/A"}

=== PROJECTS ===
${projectList || "No projects listed."}

=== CAREER & EDUCATION ===
${careerList || "No career info listed."}

=== SKILLS ===
${skillList || "No skills listed."}
`.trim();
  } catch {
    return "Portfolio data unavailable.";
  }
}

// ── Provider callers ──────────────────────────────────────────────

async function callOpenAI(key: string, model: string, systemPrompt: string, messages: Message[]): Promise<string> {
  let modelId = (model || "").trim();
  if (!modelId || modelId.startsWith("gpt-4.1")) modelId = "gpt-4o-mini";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key.trim()}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: 600,
      temperature: 0.5,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "No response.";
}

async function callGemini(key: string, model: string, systemPrompt: string, messages: Message[]): Promise<string> {
  let modelId = (model || "").trim();
  // Normalize if deprecated or invalid preview model
  if (!modelId || modelId === "gemini-2.5-pro" || modelId === "gemini-2.5-flash") {
    modelId = "gemini-2.0-flash";
  }

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${key.trim()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 600, temperature: 0.5 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response.";
}

async function callClaude(key: string, model: string, systemPrompt: string, messages: Message[]): Promise<string> {
  let modelId = (model || "").trim();
  if (!modelId || modelId.includes("4-5") || modelId.includes("4-6")) {
    modelId = "claude-3-5-haiku-20241022";
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key.trim(),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 600,
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? "No response.";
}

async function callOpenRouter(
  key: string,
  model: string,
  systemPrompt: string,
  messages: Message[]
): Promise<string> {
  const modelId = (model || "deepseek/deepseek-chat").trim();
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key.trim()}`,
      "HTTP-Referer": "https://portfolio.local",
      "X-Title": "Portfolio AI Assistant",
    },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: 600,
      temperature: 0.5,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "No response.";
}

// Support any OpenAI-compatible custom endpoint (DeepSeek, Groq, Ollama, Perplexity, etc.)
async function callCustom(
  baseUrl: string,
  key: string,
  model: string,
  systemPrompt: string,
  messages: Message[]
): Promise<string> {
  const cleanBase = (baseUrl || "").trim().replace(/\/+$/, "");
  if (!cleanBase) throw new Error("Custom AI Base URL is required.");

  const url = cleanBase.endsWith("/chat/completions") ? cleanBase : `${cleanBase}/chat/completions`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (key && key.trim()) {
    headers["Authorization"] = `Bearer ${key.trim()}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: (model || "default").trim(),
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: 600,
      temperature: 0.5,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Custom AI error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "No response from Custom AI.";
}

// ── Main handler ─────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { messages }: { messages: Message[] } = await req.json();

    if (!messages?.length) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    const settings = await getDoc<AiSettings>("ai-settings", {} as AiSettings);
    const siteContext = await buildSiteContext();

    const systemPrompt = `You are a concise AI assistant for a personal portfolio website. Answer questions about the portfolio owner using ONLY the data below.

Rules:
- Use ONLY the data provided. Never invent details.
- If info isn't in the data, say: "I don't have that info — reach out via the contact page."
- Keep replies short (2-4 sentences max). Be friendly and professional.
- Don't mention you're an AI or discuss your model/technology.

PORTFOLIO DATA:
${siteContext}
END DATA`;

    const provider = (settings.provider || "gemini").toLowerCase();

    let reply: string;

    if (provider === "openai") {
      if (!settings.openaiKey) {
        throw new Error("OpenAI API key not configured. Please add it in Admin AI Settings.");
      }
      reply = await callOpenAI(settings.openaiKey, settings.openaiModel, systemPrompt, messages);
    } else if (provider === "gemini") {
      if (!settings.geminiKey) {
        throw new Error("Gemini API key not configured. Please add it in Admin AI Settings.");
      }
      reply = await callGemini(settings.geminiKey, settings.geminiModel, systemPrompt, messages);
    } else if (provider === "claude") {
      if (!settings.claudeKey) {
        throw new Error("Claude API key not configured. Please add it in Admin AI Settings.");
      }
      reply = await callClaude(settings.claudeKey, settings.claudeModel, systemPrompt, messages);
    } else if (provider === "openrouter") {
      if (!settings.openrouterKey) {
        throw new Error("OpenRouter API key not configured. Please add it in Admin AI Settings.");
      }
      reply = await callOpenRouter(settings.openrouterKey, settings.openrouterModel, systemPrompt, messages);
    } else if (provider === "custom") {
      if (!settings.customBaseUrl) {
        throw new Error("Custom AI Base URL not configured. Please add it in Admin AI Settings.");
      }
      reply = await callCustom(
        settings.customBaseUrl,
        settings.customKey || "",
        settings.customModel || "default",
        systemPrompt,
        messages
      );
    } else {
      throw new Error(`AI provider '${provider}' is not supported. Please configure a provider in Admin AI Settings.`);
    }

    return NextResponse.json({ reply });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
