import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_DM_CHANNEL = "D0AB9MLKM36"; // oyamadaさんのDM

interface SlackResponse {
  ok: boolean;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { ai, question, allResponses } = await request.json();

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
      case "slack_notify":
        // 全AIの回答をSlackに送信
        await sendToSlack(question, allResponses);
        return NextResponse.json({ success: true });
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
  // Zariへの質問はSlack経由で送信
  // 回答は非同期でSlackに届く
  if (!SLACK_BOT_TOKEN) {
    throw new Error("Slack Bot Token not configured");
  }

  try {
    const message = `🤖 *AI Compare からの質問:*\n\n> ${question}\n\n_↑ 上記の質問にZariとして回答してください_`;
    
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      },
      body: JSON.stringify({
        channel: SLACK_DM_CHANNEL,
        text: message,
        unfurl_links: false,
      }),
    });

    const data: SlackResponse = await res.json();
    if (!data.ok) {
      console.error("Slack API error:", data.error);
      throw new Error(`Slack error: ${data.error}`);
    }

    return "💜 Zariに質問を送信しました！Slackで回答を確認してください。";
  } catch (error) {
    console.error("Failed to send to Slack:", error);
    return "⚠️ Slackへの送信に失敗しました。後で確認してください。";
  }
}

async function sendToSlack(
  question: string,
  responses: {
    chatgpt?: { content: string; responseTime?: number; error?: string };
    claude?: { content: string; responseTime?: number; error?: string };
    zari?: { content: string; responseTime?: number; error?: string };
  }
): Promise<void> {
  if (!SLACK_BOT_TOKEN) {
    console.error("Slack Bot Token not configured, skipping notification");
    return;
  }

  const truncate = (text: string, maxLength: number = 500): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...（続きはWebで）";
  };

  const formatResponse = (name: string, emoji: string, data?: { content: string; responseTime?: number; error?: string }): string => {
    if (!data) return `${emoji} *${name}:* _未回答_`;
    if (data.error) return `${emoji} *${name}:* ⚠️ エラー: ${data.error}`;
    const time = data.responseTime ? ` _(${(data.responseTime / 1000).toFixed(1)}秒)_` : "";
    return `${emoji} *${name}:*${time}\n${truncate(data.content)}`;
  };

  const message = `🤖 *AI Compare の結果*\n\n*質問:*\n> ${question}\n\n---\n\n${formatResponse("ChatGPT", "📗", responses.chatgpt)}\n\n---\n\n${formatResponse("Claude", "📙", responses.claude)}\n\n---\n\n${formatResponse("Zari", "💜", responses.zari)}`;

  try {
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      },
      body: JSON.stringify({
        channel: SLACK_DM_CHANNEL,
        text: message,
        unfurl_links: false,
      }),
    });

    const data: SlackResponse = await res.json();
    if (!data.ok) {
      console.error("Slack API error:", data.error);
    }
  } catch (error) {
    console.error("Failed to send summary to Slack:", error);
  }
}
