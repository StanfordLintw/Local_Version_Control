# 🏗️ 史丹專屬版控平台 — 架構說明文件

## 📋 專案概述

這是一個**本機 Web 版本控制平台**，讓使用者透過圖形化介面操作 Git，
一鍵推送程式碼到 GitHub、GitLab、Gitee 等平台。

### 核心理念
- ✅ 不需要記 Git 指令，點按鈕就能完成版控操作
- ✅ 支援同時推送到多個遠端平台
- ✅ 視覺化 commit 歷史、diff 檢視、檔案架構瀏覽

---

## 🧱 技術架構圖

```
┌──────────────────────────────────────────────────────┐
│                    瀏覽器 (Frontend)                   │
│                                                       │
│   index.html ─── style.css ─── app.js                │
│   (結構)         (樣式)        (邏輯)                  │
│                                                       │
│   功能模組:                                            │
│   ├── 工作目錄設定 + 資料夾瀏覽器                       │
│   ├── 檔案變更列表 (Stage / Unstage)                   │
│   ├── Commit 歷史 (查看 diff / 回退 / 建立分支)        │
│   ├── Push 推送 + Pull 同步                            │
│   ├── Remote 管理 (新增 / 移除)                        │
│   ├── 專案程式碼瀏覽器 (檔案樹 + 程式碼檢視)            │
│   └── 說明文件 + FAQ                                   │
│                                                       │
│              HTTP API (fetch)                         │
│                    ↓ ↑                                │
├──────────────────────────────────────────────────────┤
│                   Node.js (Backend)                    │
│                                                       │
│   server.js (Express)                                 │
│   ├── 靜態檔案服務 (public/)                           │
│   ├── Git API 端點 (child_process.execFile)            │
│   └── 檔案系統 API (fs)                                │
│                                                       │
│              shell 呼叫                                │
│                    ↓ ↑                                │
├──────────────────────────────────────────────────────┤
│                   Git CLI                              │
│                                                       │
│   git status / add / commit / push / pull / log ...   │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## 📁 檔案結構

```
Stanford_Version_Control/
├── server.js              # 後端主程式 (Express + Git API)
├── package.json           # 專案依賴和腳本
├── .gitignore             # Git 忽略規則
├── ARCHITECTURE.md        # 本文件 — 架構說明
├── public/                # 前端靜態檔案
│   ├── index.html         # 頁面結構 (HTML)
│   ├── style.css          # 樣式設計 (CSS)
│   └── app.js             # 前端邏輯 (JavaScript)
└── node_modules/          # npm 依賴 (不版控)
```

---

## 🔧 後端 API 端點 (`server.js`)

### 核心函式

| 函式 | 說明 |
|------|------|
| `gitExec(args, cwd)` | 執行 Git 命令的工具函式，回傳 Promise |

### API 路由清單

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/set-workdir` | 設定工作目錄路徑 |
| GET  | `/api/workdir` | 取得目前工作目錄 |
| POST | `/api/init` | 初始化 Git repo |
| GET  | `/api/status` | 取得檔案變更狀態 |
| POST | `/api/add` | Stage 暫存檔案 |
| POST | `/api/unstage` | 取消暫存 |
| POST | `/api/commit` | Commit 提交 |
| GET  | `/api/log` | 取得 commit 歷史 |
| GET  | `/api/branches` | 取得分支列表 |
| GET  | `/api/remotes` | 取得 remote 列表 |
| POST | `/api/remote/add` | 新增 remote |
| POST | `/api/remote/remove` | 移除 remote |
| POST | `/api/push` | Push 到指定 remote |
| POST | `/api/push-all` | Push 到所有 remote |
| POST | `/api/pull` | Pull 同步遠端 |
| POST | `/api/checkout` | 切換到指定 commit (reset / branch) |
| POST | `/api/revert` | 安全回退指定 commit |
| GET  | `/api/show` | 查看 commit diff 詳情 |
| GET  | `/api/browse` | 瀏覽本機資料夾 |
| GET  | `/api/files` | 取得專案檔案樹 |
| GET  | `/api/file-content` | 讀取檔案內容 |

---

## 🎨 前端架構 (`public/`)

### HTML 結構 (`index.html`)

```
index.html
├── Header (標題 + FAQ / 說明 按鈕 + 分支狀態)
├── Workdir Bar (路徑輸入 + 瀏覽 + 設定 + Init)
├── Stats Row (修改/新增/已暫存/Remote 數量)
├── Main Grid (左右雙欄)
│   ├── 左: 檔案變更 + Commit 歷史
│   └── 右: Commit 輸入 + Push 推送 + Remote 管理
├── File Browser (檔案樹 + 程式碼檢視)
├── Modals (彈出視窗)
│   ├── 新增 Remote
│   ├── 資料夾瀏覽器
│   ├── Diff 檢視器
│   ├── FAQ 常見問題
│   └── 使用說明
├── Toast 通知
└── Loading 遮罩
```

### CSS 設計系統 (`style.css`)

- **色彩**: 深色主題 + CSS Variables
- **效果**: Glassmorphism, 漸層, 微動畫
- **字型**: Inter (UI) + JetBrains Mono (程式碼)
- **響應式**: 1024px / 640px 斷點

### JavaScript 架構 (`app.js`)

```
app.js
├── State (應用狀態: workdir, files, commits, remotes...)
├── DOM Elements (所有 UI 元素的引用)
├── API Helpers (apiGet / apiPost)
├── Toast / Loading (通知和載入動畫)
├── Render 函式
│   ├── renderStats()       — 統計數字
│   ├── renderFileList()    — 檔案變更列表
│   ├── renderCommitList()  — Commit 歷史 (含 diff/回退 按鈕)
│   ├── renderRemoteList()  — Remote 列表
│   ├── renderPushSelects() — Push 下拉選單
│   └── renderFileTree()    — 專案檔案樹
├── Data Fetching (fetchStatus / fetchRemotes / fetchLog / fetchFiles)
├── Actions (setWorkdir / commit / push / pull / stageAll / checkout...)
├── File Browser (fetchFiles / renderFileTree / viewFileContent)
├── Folder Browser (browseTo / renderBrowseList)
├── Event Bindings (按鈕事件 + 鍵盤快捷鍵)
└── Auto-refresh (每 10 秒自動刷新狀態)
```

---

## 🔄 資料流

```
使用者操作 (點擊按鈕)
    ↓
app.js 呼叫 apiPost/apiGet
    ↓
server.js 接收 HTTP 請求
    ↓
gitExec() 呼叫 Git CLI
    ↓
回傳結果 (JSON)
    ↓
app.js 更新 state + 重新 render UI
```

---

## 🚀 如何啟動

```bash
# 安裝依賴
npm install

# 啟動伺服器
node server.js

# 開啟瀏覽器
# http://localhost:3000
```

---

## 🛠️ 如何擴充

### 新增 API 端點
1. 在 `server.js` 中新增 `app.get()` 或 `app.post()` 路由
2. 使用 `gitExec()` 執行 Git 命令
3. 回傳 `res.json({ success: true, ... })`
4. 注意：新路由必須放在 `app.get('*')` 之前

### 新增 UI 功能
1. 在 `index.html` 新增 HTML 結構
2. 在 `style.css` 新增樣式
3. 在 `app.js` 的 `dom` 物件中加入 DOM 引用
4. 新增對應的 render 函式和事件綁定

### 新增 Modal
參考現有的 modal 結構：
```html
<div class="modal-overlay" id="modal-xxx">
  <div class="modal modal-lg">
    <div class="modal-title">標題</div>
    <!-- 內容 -->
    <div class="modal-actions">
      <button class="btn btn-primary" id="btn-close-xxx">關閉</button>
    </div>
  </div>
</div>
```

---

## 📝 設計決策

1. **為什麼用 Node.js + Express？**
   - 輕量、快速啟動、原生支援 `child_process` 執行 Git 命令

2. **為什麼不用前端框架 (React/Vue)？**
   - 專案規模適中，原生 JS 足夠且更輕量，不需要額外的建構工具

3. **為什麼不部署到雲端？**
   - 工具需要存取本機的 Git 專案，雲端無法做到

4. **安全性考量**
   - 僅限 localhost 使用，Git 命令在本機執行
   - 檔案讀取限制在工作目錄內
