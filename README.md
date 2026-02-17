# AI Compare

複数のAI（ChatGPT, Claude, Zari）の回答を並べて比較できるWebアプリです。

## 機能

- 質問を入力すると、3つのAIに同時にリクエスト
- 回答を3カラムで並べて比較表示
- 応答時間の計測
- 履歴機能（ローカルストレージに保存）
- Basic認証付き

## 対応AI

| AI | モデル | 備考 |
|---|---|---|
| ChatGPT | gpt-4o | OpenAI API |
| Claude | claude-sonnet-4-20250514 | Anthropic API |
| Zari | claude-sonnet-4-20250514 | Claude API経由（後でOpenClaw APIに変更可） |

## セットアップ

```bash
npm install
```

## 環境変数

`.env.local` に以下を設定:

```
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
BASIC_AUTH_USER=oyamada
BASIC_AUTH_PASSWORD=aicompare2026
```

## 開発

```bash
npm run dev
```

## デプロイ

Vercelにデプロイする際は、環境変数をVercelの設定画面で設定してください。

## 今後の予定

- [ ] Gemini対応
- [ ] OpenClaw API経由でのZari連携
- [ ] 回答のエクスポート機能
