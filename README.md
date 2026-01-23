# 互動式 AI 履歷 PoC (Vite + React + TypeScript)

這是一個「互動式 AI 履歷」的 PoC，左側為 Chat Panel，右側為 Resume Panel，並且已內建 GitHub Pages 自動部署設定。

## 功能特色

- **單頁 Web App**：左側 Chat (25%) / 右側 Resume (75%)，兩側獨立捲動。
- **RWD**：螢幕寬度 <= 768px 時改為上下堆疊。
- **履歷渲染**：從 `public/resume.json` 載入履歷，支援 `hidden: true` 過濾。
- **XSS 防護**：HTML 字串會經 DOMPurify 清洗後再渲染。
- **Mock AI**：預留 `src/lib/llmClient.ts` 介面，可替換成 OpenAI/Gemini 等 LLM。

## 專案啟動

```bash
npm ci
npm run dev
```

> 開發模式啟動後，首頁會自動載入 `public/resume.json` 並顯示「Chat/Resume」雙欄。

## Build

```bash
npm run build
```

## GitHub Pages 部署

### 1) 設定 GitHub Pages Source

首次部署時，請到 GitHub 專案頁面：

`Settings → Pages → Source` 選擇 **GitHub Actions**。

> 若無法透過 API 自動設定（例如沒有權限/Token），請手動完成此步驟。

### 2) 自動部署流程

- Push 到 `main` 會觸發 `.github/workflows/deploy.yml`
- 使用官方 Pages Actions：
  - `actions/upload-pages-artifact`
  - `actions/deploy-pages`

### 3) 查看部署網址

Actions 的 job 會輸出 `page_url`，即為你的部署網址。

## GitHub Pages base 自動判斷

`vite.config.ts` 會依 `process.env.GITHUB_REPOSITORY` 自動設定 base：

- User pages：`<owner>.github.io` → base = `/`
- Project pages：`<owner>/<repo>` → base = `/<repo>/`

## 履歷資料來源

- 根目錄的 `johnny-zhou_20260121_0016.json` 已複製到 `public/resume.json`
- 前端使用 `fetch(`${import.meta.env.BASE_URL}resume.json`)` 載入

## Mock AI 說明

目前為簡易關鍵字比對，從履歷內容抓取摘要回覆。未來可替換 `src/lib/llmClient.ts` 以接入 OpenAI / Gemini 等模型。
