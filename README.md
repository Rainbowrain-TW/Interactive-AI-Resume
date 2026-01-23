# 互動式 AI 履歷（PoC）

這是一個使用 **Vite + React + TypeScript** 的單頁互動式履歷展示 PoC。介面左側為 Chat Panel，右側為履歷渲染區，資料來源為 `public/resume.json`。

## 功能特色

- 左側 25% Chat Panel（訊息列表 + 輸入框 + 送出）
- 右側 75% Resume Panel（從 JSON 渲染履歷）
- 兩側獨立捲動，手機版（<= 768px）會堆疊顯示
- 主色調：royalblue，留白與可讀性優先
- 使用 DOMPurify 安全處理 HTML 再渲染
- Vite base 會根據 GitHub Pages user/project pages 自動判斷

## 本機開發

```bash
npm ci
npm run dev
```

## 產出靜態檔

```bash
npm run build
```

## GitHub Pages 部署

此專案已內建 GitHub Actions workflow（`.github/workflows/deploy.yml`）：

- push 到 `main` 會自動 build 並部署至 GitHub Pages。
- **第一次使用請到 GitHub repo 的 Settings → Pages → Source 選擇「GitHub Actions」**。
- 部署完成後，可在 GitHub Actions 的部署 job 內看到 `page_url`（即實際網址）。

## Vite base 自動判斷規則

`vite.config.ts` 會讀取 `GITHUB_REPOSITORY`：

- 若 repo 名稱是 `<owner>.github.io`（user pages），`base` = `/`。
- 否則（project pages），`base` = `/<repo>/`。

## 資料來源

請將履歷 JSON 放在 `public/resume.json`（已附檔），前端以以下方式讀取：

```ts
fetch(`${import.meta.env.BASE_URL}resume.json`)
```

## （可選）使用 gh CLI

若環境中已安裝 `gh` 且設定 `GH_TOKEN`，可自行建立/連結 GitHub repo 並 push `main`。若無法自動設定 Pages Source，請依上方指引手動設定。
