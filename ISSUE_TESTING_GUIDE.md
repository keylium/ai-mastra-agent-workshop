# GitHub Issue テスト実行ガイド

このプロジェクトでは、GitHubのissueコメントに書かれたテスト計画を自動で読み取り、Browser Useを使って実際にブラウザでテストを実行できます。

## セットアップ完了項目

✅ Browser Test Agent (`src/agents/browser-agent.ts`)
✅ Issue Comments Tool (`src/tools/github/get-issue-comments-tool.ts`)
✅ Browser Test Executor with Issue Reading capability
✅ CLI Script for Issue-based Testing (`scripts/run-issue-tests.js`)

## 使用方法

### 1. GitHubIssueにテスト計画を書く

GitHubのissueまたはissueコメントに以下のような形式でテスト計画を記載：

```markdown
## テスト計画

1. ホームページにアクセスして、ログインボタンをクリック
2. ユーザー名 "test@example.com" とパスワード "password123" でログイン
3. ダッシュボードが表示されることを確認
4. プロフィール設定ページにアクセス
5. 名前を "テストユーザー" に変更して保存
6. 変更が正常に保存されたことを確認

### 期待結果
- すべてのステップでエラーが発生しないこと
- ユーザー情報が正常に更新されること
```

または、チェックボックス形式でも可能：

```markdown
# Test Cases

- [ ] ログイン機能のテスト：正常なログインができること
- [ ] データ入力テスト：フォームに正常にデータを入力できること  
- [ ] ナビゲーションテスト：各ページ間の移動が正常に動作すること
```

### 2. コマンドラインから実行

```bash
# 基本的な使用方法
npm run test:issue https://github.com/owner/repo/issues/123

# ターゲットURLを指定して実行
npm run test:issue https://github.com/owner/repo/issues/123 https://myapp.vercel.app

# または直接スクリプトを実行
node scripts/run-issue-tests.js https://github.com/owner/repo/issues/123 https://example.com
```

### 3. プログラムから実行

```typescript
import { BrowserTestExecutor } from "./src/agents/browser-agent";

const executor = new BrowserTestExecutor();

// Issueからテスト計画を読み取って実行
const results = await executor.executeTestPlanFromIssue(
  "https://github.com/owner/repo/issues/123",
  "https://myapp.com"
);

console.log('Test results:', results);
```

### 4. Browser Agentを直接使用

```typescript
import { browserAgent } from "./src/agents/browser-agent";

const result = await browserAgent.generate(
  "Execute the test plan from GitHub issue https://github.com/owner/repo/issues/123 on https://myapp.com"
);

console.log('Agent response:', result.text);
```

## 機能

### テスト計画の自動検出
- Issue本文やコメントからテスト計画を自動検出
- 日本語・英語両方に対応
- 番号付きリスト、チェックボックス、マークダウン形式に対応

### テストケースの解析
- 複数のテストケースを自動で分離
- 各テストケースの詳細説明を抽出
- ステップバイステップの実行

### Browser Use連携
- 実際のブラウザでテストを自動実行
- スクリーンショット付きの実行ログ
- エラー時の詳細な失敗理由

### 結果レポート
- 各テストケースの成功/失敗状況
- 詳細な実行ログ
- 統計情報（成功率など）

## 環境変数

実行には以下の環境変数が必要です：

```bash
GITHUB_TOKEN=github_pat_xxx...        # GitHub API access
BROWSER_USE_API_KEY=bu_xxx...         # Browser Use API key
```

## サポートするテスト計画形式

1. **番号付きリスト**
   ```
   1. 最初のテストステップ
   2. 次のテストステップ
   ```

2. **チェックボックス**
   ```
   - [ ] テストケース1
   - [ ] テストケース2
   ```

3. **マークダウンヘッダー**
   ```
   ## Test Case 1
   説明...
   
   ## Test Case 2
   説明...
   ```

4. **自由形式**
   ```
   任意のテスト計画をここに記述
   複数行にわたって詳細を記載可能
   ```

## トラブルシューティング

### 403 Forbidden エラー
- `GITHUB_TOKEN`の権限を確認
- Issueへのアクセス権限があることを確認

### テスト計画が見つからない
- Issue内にテスト関連のキーワードが含まれているか確認
- コメントにテスト計画が記載されているか確認

### Browser Use実行エラー
- `BROWSER_USE_API_KEY`が正しく設定されているか確認
- ターゲットURLがアクセス可能か確認

## 例

実際の使用例：

```bash
# 実際のGitHub Issueからテスト実行
npm run test:issue https://github.com/keylium/ai-mastra-agent-workshop/issues/1 https://scrum-board-navy.vercel.app
```

この機能により、GitHubのissueに記載されたテスト計画を自動で読み取り、Browser Useを使って実際のブラウザでテストを実行できます。