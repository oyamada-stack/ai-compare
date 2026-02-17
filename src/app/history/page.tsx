"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

const AI_COLORS: Record<string, string> = {
  chatgpt: "from-green-500 to-emerald-600",
  claude: "from-orange-500 to-amber-600",
  zari: "from-purple-500 to-violet-600",
};

const AI_NAMES: Record<string, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  zari: "Zari",
};

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("ai-compare-history");
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  const deleteItem = (id: string) => {
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    localStorage.setItem("ai-compare-history", JSON.stringify(updated));
    if (selectedItem?.id === id) setSelectedItem(null);
  };

  const clearAll = () => {
    if (confirm("すべての履歴を削除しますか？")) {
      setHistory([]);
      localStorage.removeItem("ai-compare-history");
      setSelectedItem(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              ← 戻る
            </Link>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              履歴
            </h1>
          </div>
          {history.length > 0 && (
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              🗑️ 全削除
            </button>
          )}
        </header>

        {history.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p className="text-xl mb-4">履歴がありません</p>
            <Link href="/" className="text-blue-400 hover:underline">
              質問してみる →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4 max-h-[80vh] overflow-y-auto">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-4 bg-slate-800 rounded-xl cursor-pointer transition-all hover:bg-slate-700 ${
                    selectedItem?.id === item.id ? "ring-2 ring-blue-500" : ""
                  }`}
                >
                  <p className="text-sm text-slate-400 mb-2">{formatDate(item.timestamp)}</p>
                  <p className="line-clamp-2">{item.question}</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteItem(item.id);
                      }}
                      className="text-xs px-2 py-1 bg-red-600/50 hover:bg-red-600 rounded transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-2">
              {selectedItem ? (
                <div className="space-y-6">
                  <div className="bg-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-2">質問</h3>
                    <p className="text-slate-300 whitespace-pre-wrap">{selectedItem.question}</p>
                    <p className="text-xs text-slate-500 mt-2">{formatDate(selectedItem.timestamp)}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {(["chatgpt", "claude", "zari"] as const).map((ai) => (
                      <div key={ai} className="bg-slate-800 rounded-xl overflow-hidden">
                        <div className={`p-3 bg-gradient-to-r ${AI_COLORS[ai]}`}>
                          <h3 className="font-bold">{AI_NAMES[ai]}</h3>
                          {selectedItem.responses[ai].responseTime && (
                            <p className="text-xs opacity-80">
                              応答時間: {(selectedItem.responses[ai].responseTime! / 1000).toFixed(2)}秒
                            </p>
                          )}
                        </div>
                        <div className="p-4 max-h-[300px] overflow-y-auto">
                          {selectedItem.responses[ai].error ? (
                            <p className="text-red-400">{selectedItem.responses[ai].error}</p>
                          ) : (
                            <p className="whitespace-pre-wrap text-sm">{selectedItem.responses[ai].content || "（回答なし）"}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-500 bg-slate-800 rounded-xl">
                  <p>左のリストから履歴を選択してください</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
