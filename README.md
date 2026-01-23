# 互動式 AI 履歷（PoC）

此專案是以 **Vite + React + TypeScript** 打造的單頁互動式履歷。左側 Chat Panel、右側 Resume Panel，可在手機寬度下切換顯示。履歷資料由 `public/resume.json` 載入。

## 功能摘要

- 左側 Chat Panel：訊息列表＋輸入框＋送出（mock AI）
- 右側 Resume Panel：從 JSON 渲染履歷（DOMPurify 清理 HTML）
- Royalblue 主色、乾淨簡約版面、左右欄位可獨立捲動
- 小於 768px 時切換成 Tabs（Chat / Resume）

## 使用方式

```bash
npm ci
npm run dev
```

建置：

```bash
npm run build
```

## 履歷資料

已將根目錄的 `johnny-zhou_20260121_0016.json` 複製至 `public/resume.json`。

前端載入時使用：

```ts
fetch(`${import.meta.env.BASE_URL}resume.json`)
```

確保 GitHub Pages 子路徑下能正確載入。

## GitHub Pages 部署（必做設定）

### Vite base 自動判斷

`vite.config.ts` 會透過 `process.env.GITHUB_REPOSITORY` 判斷 base：

- 若 repo 為 `<owner>.github.io`（user pages）→ `base = '/'`
- 其他 repo（project pages）→ `base = '/<repo>/'`

### Actions 部署流程

已提供 `.github/workflows/deploy.yml`，在 `main` 分支 push 時：

1. 安裝依賴並 build
2. 上傳 dist 作為 Pages artifact
3. 使用 `actions/deploy-pages@v4` 部署

### 首次啟用 GitHub Pages

> 若無法透過 API 自動啟用，請手動設定：

1. 前往 GitHub Repo → **Settings → Pages**
2. Source 選擇 **GitHub Actions**

部署成功後，Actions job 會顯示 `page_url`，即為 Pages 網址。

## 可選自動化（若環境允許）

若環境具備 `gh` CLI 且提供 `GH_TOKEN`，可嘗試自動建立/連結 GitHub repo 並 push `main`。
若沒有相關權限或工具，請依照上述手動設定即可。
