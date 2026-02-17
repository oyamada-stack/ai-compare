import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { ai, question } = await request.json();

    if (!question || !ai) {
      return NextResponse.json({ error: "Missing question or ai parameter" }, { status: 400 });
    }

    let response: string;

    switch (ai) {
      case "chatgpt":
        response = await askChatGPT(question);
        break;
      case "claude":
        response = await askClaude(question);
        break;
      case "zari":
        response = await askZari(question);
        break;
      default:
        return NextResponse.json({ error: "Unknown AI" }, { status: 400 });
    }

    return NextResponse.json({ response });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("API Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

async function askChatGPT(question: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: question }],
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenAI API error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices[0]?.message?.content || "";
}

async function askClaude(question: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("Anthropic API key not configured");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: question }],
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Anthropic API error: ${res.status}`);
  }

  const data = await res.json();
  return data.content[0]?.text || "";
}

async function askZari(question: string): Promise<string> {
  // For now, Zari uses the same Claude API with a system prompt
  // In the future, this can be replaced with OpenClaw API
  if (!ANTHROPIC_API_KEY) {
    throw new Error("Anthropic API key not configured");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: "あなたはZariというAIアシスタントです。親しみやすく、日本語で丁寧に回答してください。",
      messages: [{ role: "user", content: question }],
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Zari API error: ${res.status}`);
  }

  const data = await res.json();
  return data.content[0]?.text || "";
}
