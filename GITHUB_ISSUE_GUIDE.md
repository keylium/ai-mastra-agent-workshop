# GitHub Issue作成 - Mastra使用ガイド

このプロジェクトでは、Mastraを使用してGitHubのissueを自動作成できます。

## セットアップ完了項目

✅ GitHub API クライアント (`src/mastra/github-client.ts`)
✅ Issue作成ツール (`src/tools/github/create-issue-tool.ts`) 
✅ Issue作成エージェント (`src/agents/issue-agent.ts`)
✅ Mastra設定にエージェント追加済み

## 使用方法

### 1. 基本的な使い方

```typescript
import { issueAgent } from "../agents/issue-agent";

const result = await issueAgent.generate(
  "Create an issue for repository 'owner/repo-name' with title 'Bug: Login not working' and description 'Users cannot login due to 404 error' with labels 'bug' and 'high-priority'"
);
```

### 2. 日本語でのissue作成

```typescript
const result = await issueAgent.generate(
  "リポジトリ 'keylium/ai-mastra-agent-workshop' に新しいissueを作成してください。タイトルは'ログイン機能の不具合'、内容は'ユーザーがログインしようとするとエラーが発生します'、ラベルは'bug'と'urgent'を付けてください。"
);
```

### 3. 機能リクエストの作成

```typescript
const result = await issueAgent.generate(
  "Create a feature request for 'owner/repo' to add user dashboard with profile management, activity history, and settings. Add labels 'enhancement' and 'frontend'"
);
```

## 実行方法

1. 環境変数が設定されていることを確認:
   - `GITHUB_TOKEN`: GitHubのPersonal Access Token
   - `OPENAI_API_KEY`: OpenAI APIキー

2. 例を実行:
```bash
npm run dev
# または
npx tsx src/examples/create-issue-example.ts
```

## 利用可能なパラメータ

- **owner**: リポジトリオーナー (必須)
- **repo**: リポジトリ名 (必須)  
- **title**: issue タイトル (必須)
- **body**: issue 本文 (オプション)
- **labels**: ラベルの配列 (オプション)
- **assignees**: 担当者の配列 (オプション)

## よくあるラベル

- `bug`: バグ報告
- `enhancement`: 機能追加・改善
- `documentation`: ドキュメント関連
- `good first issue`: 初心者向け
- `help wanted`: ヘルプ募集  
- `question`: 質問
- `wontfix`: 修正しない

## 注意事項

- GitHubトークンには該当リポジトリへの書き込み権限が必要です
- プライベートリポジトリの場合は適切なアクセス権限が必要です
- APIレート制限にご注意ください

## トラブルシューティング

### 403 Forbidden エラー
- GitHubトークンの権限を確認してください
- リポジトリへのアクセス権限があることを確認してください

### 404 Not Found エラー  
- リポジトリのowner/repo名が正しいことを確認してください
- リポジトリが存在し、アクセス可能であることを確認してください