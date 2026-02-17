"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface AIResponse {
  model: string;
  content: string;
  loading: boolean;
  error?: string;
  responseTime?: number;
}

interface HistoryItem {
  id: string;
  question: string;
  responses: {
    chatgpt: { content: string; responseTime?: number; error?: string };
    claude: { content: string; responseTime?: number; error?: string };
    zari: { content: string; responseTime?: number; error?: string };
  };
  timestamp: number;
}

const AI_CONFIGS = [
  { id: "chatgpt", name: "ChatGPT", model: "gpt-4o", color: "from-green-500 to-emerald-600" },
  { id: "claude", name: "Claude", model: "claude-sonnet-4-20250514", color: "from-orange-500 to-amber-600" },
  { id: "zari", name: "Zari", model: "claude-sonnet-4-20250514", color: "from-purple-500 to-violet-600" },
];

export default function Home() {
  const [question, setQuestion] = useState("");
  const [responses, setResponses] = useState<Record<string, AIResponse>>({
    chatgpt: { model: "gpt-4o", content: "", loading: false },
    claude: { model: "claude-sonnet-4-20250514", content: "", loading: false },
    zari: { model: "claude-sonnet-4-20250514", content: "", loading: false },
  });
  const [isAsking, setIsAsking] = useState(false);

  const askAI = async (aiId: string, q: string): Promise<{ content: string; responseTime: number; error?: string }> => {
    const startTime = Date.now();
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ai: aiId, question: q }),
      });
      const data = await res.json();
      const responseTime = Date.now() - startTime;
      if (!res.ok) throw new Error(data.error || "Unknown error");
      return { content: data.response, responseTime };
    } catch (err: unknown) {
      const error = err as Error;
      return { content: "", responseTime: Date.now() - startTime, error: error.message };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isAsking) return;

    setIsAsking(true);
    setResponses({
      chatgpt: { model: "gpt-4o", content: "", loading: true },
      claude: { model: "claude-sonnet-4-20250514", content: "", loading: true },
      zari: { model: "claude-sonnet-4-20250514", content: "", loading: true },
    });

    const promises = AI_CONFIGS.map(async (ai) => {
      const result = await askAI(ai.id, question);
      setResponses((prev) => ({
        ...prev,
        [ai.id]: {
          ...prev[ai.id],
          content: result.content,
          loading: false,
          error: result.error,
          responseTime: result.responseTime,
        },
      }));
      return { id: ai.id, ...result };
    });

    const results = await Promise.all(promises);
    
    // Save to history
    const historyItem: HistoryItem = {
      id: Date.now().toString(),
      question,
      responses: {
        chatgpt: { content: results.find(r => r.id === "chatgpt")?.content || "", responseTime: results.find(r => r.id === "chatgpt")?.responseTime, error: results.find(r => r.id === "chatgpt")?.error },
        claude: { content: results.find(r => r.id === "claude")?.content || "", responseTime: results.find(r => r.id === "claude")?.responseTime, error: results.find(r => r.id === "claude")?.error },
        zari: { content: results.find(r => r.id === "zari")?.content || "", responseTime: results.find(r => r.id === "zari")?.responseTime, error: results.find(r => r.id === "zari")?.error },
      },
      timestamp: Date.now(),
    };

    const existing = JSON.parse(localStorage.getItem("ai-compare-history") || "[]");
    localStorage.setItem("ai-compare-history", JSON.stringify([historyItem, ...existing].slice(0, 100)));
    
    setIsAsking(false);
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            AI Compare
          </h1>
          <Link
            href="/history"
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            📜 履歴
          </Link>
        </header>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-4">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="質問を入力してください..."
              className="flex-1 p-4 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              disabled={isAsking}
            />
            <button
              type="submit"
              disabled={isAsking || !question.trim()}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold transition-all"
            >
              {isAsking ? "送信中..." : "質問する"}
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {AI_CONFIGS.map((ai) => (
            <div key={ai.id} className="bg-slate-800 rounded-xl overflow-hidden">
              <div className={`p-4 bg-gradient-to-r ${ai.color}`}>
                <h2 className="text-lg font-bold">{ai.name}</h2>
                <p className="text-sm opacity-80">{ai.model}</p>
              </div>
              <div className="p-4 min-h-[300px]">
                {responses[ai.id].loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                  </div>
                ) : responses[ai.id].error ? (
                  <div className="text-red-400">
                    <p className="font-semibold">エラー</p>
                    <p className="text-sm">{responses[ai.id].error}</p>
                  </div>
                ) : responses[ai.id].content ? (
                  <>
                    {responses[ai.id].responseTime && (
                      <p className="text-xs text-slate-400 mb-2">
                        応答時間: {(responses[ai.id].responseTime! / 1000).toFixed(2)}秒
                      </p>
                    )}
                    <div className="markdown-content whitespace-pre-wrap text-sm">
                      {responses[ai.id].content}
                    </div>
                  </>
                ) : (
                  <p className="text-slate-500 text-center mt-20">質問を入力してください</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>※ Gemini は後日追加予定</p>
        </div>
      </div>
    </main>
  );
}
