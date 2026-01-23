# 互動式 AI 履歷（PoC）

使用 **Vite + React + TypeScript** 建立的單頁應用，左側為 Chat Panel、右側為 Resume Panel。履歷資料由 `public/resume.json` 讀取，並以 DOMPurify 做 HTML 安全處理。

## 專案啟動

```bash
npm ci
npm run dev
```

## Build

```bash
npm run build
```

## GitHub Pages 部署說明

> 本專案已經包含 GitHub Actions 工作流程，推送到 `main` 後會自動部署。

### 第一次設定（必要）

1. 前往 GitHub repo 的 **Settings → Pages**
2. **Source** 選擇 **GitHub Actions**（首次必做，無法由 API 自動化）

### 部署結果

* 部署完成後，請到 GitHub **Actions** 頁面查看 workflow 執行結果。
* 成功的 job 會顯示 `page_url`，那就是你的線上網址。

## 專案結構

```
public/resume.json   # 履歷資料來源（複製自根目錄 JSON）
src/lib/llmClient.ts # mock AI client，未來可替換成 OpenAI/Gemini
src/App.tsx          # Chat + Resume 主要 UI
```

## GitHub Pages base 自動判斷

`vite.config.ts` 會根據 `GITHUB_REPOSITORY` 判斷：

* 若 repo 名稱為 `<owner>.github.io` → base = `/`
* 其他情況 → base = `/<repo>/`

因此可以同時支援 user pages 與 project pages。
