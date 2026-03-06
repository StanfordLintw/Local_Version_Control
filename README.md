# 史丹專屬版控平台 (Version Control Upload Platform)

這是一個本機 Web 版本的 Git 版本控制介面，讓使用者可以透過直覺的圖形化介面（GUI）來操作 Git，輕鬆地將本地專案一鍵推送到 GitHub、GitLab 或 Gitee 等平台。

## 🌟 核心功能

- **視覺化操作**：不需記憶 Git 指令，點擊按鈕就能完成 `add`、`commit`、`push`、`pull`。
- **Commit Diff 檢視**：可視化查看每個 Commit 新增、修改或刪除的程式碼行數。
- **專案程式碼瀏覽**：直接在瀏覽器中查看專案資料夾結構與檔案內容。
- **支援多個 Remote**：可同時管理並推送到多個遠端平台。
- **Electron 桌面應用支援**：可打包成獨立的 Mac `.app` 或 Windows `.exe` 執行檔。

---

## 🚀 系統需求

在開始之前，請確保你的電腦已安裝以下軟體：

1. **[Node.js](https://nodejs.org/)** (建議安裝 18.x 或以上版本) - 用於執行後端伺服器
2. **[Git](https://git-scm.com/)** - 系統必須安裝 Git 才能執行版控操作

---

## 📥 下載與安裝

### 1. 下載專案 (Clone)

請開啟你的終端機 (Terminal / 命命提示字元)，並執行以下指令將專案下載到本機：

```bash
# 從 GitHub 下載
git clone https://github.com/StanfordLintw/Local_Version_Control.git

# 或者從 GitLab 下載
git clone https://gitlab.com/StanfordLintw/local_version_control.git
```

### 2. 進入專案目錄

```bash
cd Local_Version_Control
```

### 3. 安裝依賴套件 (Install Dependencies)

此專案使用 Node.js，需要安裝 `express` 和 `cors` 等套件。請執行：

```bash
npm install
```

---

## 💻 如何執行與使用

### 方法一：啟動 Web 版本 (建議開發時使用)

在終端機中執行：

```bash
npm start
```
或是
```bash
node server.js
```

啟動後，開啟你的瀏覽器，輸入網址：  
👉 **`http://localhost:3000`**

### 方法二：透過 Electron 啟動桌面版

如果你想以獨立視窗的方式開啟（像一般的應用程式）：

```bash
npm run electron
```

---

## 📦 如何打包成桌面應用程式 (Mac / Windows)

如果你想將這個平台打包成安裝檔，讓其他沒有安裝 Node.js 的人也能使用，請執行以下指令：

```bash
# 打包成 Mac 版本 (.dmg / .app)
npm run build:mac

# 打包成 Windows 版本 (.exe)
npm run build:win

# 同時打包 Mac 與 Windows 版本
npm run build:all
```

> 打包完成後，安裝檔會被放置在專案目錄下的 `dist/` 資料夾中。

---

## 📖 基礎使用教學

1. **設定工作目錄**：在畫面上方輸入或瀏覽選擇你要進行版本控制的本地專案資料夾路徑。
2. **新增檔案 (Stage)**：在「檔案變更」區塊，點擊「Stage All」或勾選想要儲存的檔案。
3. **提交變更 (Commit)**：在右側的 Commit 區塊，輸入一段描述（例如："更新首頁標題"），然後點擊 「Commit」。
4. **推送到遠端 (Push)**：
   - 先在「Remote 管理」新增你的 GitHub/GitLab 專案網址。
   - 選擇 Remote 和 分支（通常是 master 或 main），點擊「Push 推送」。

> 更詳細的操作說明，請點擊畫面右上角的「❓ 說明」按鈕查看。
