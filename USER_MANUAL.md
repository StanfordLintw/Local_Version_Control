# Local Version Control 使用手冊

這份手冊只講實際操作流程，目標是讓你用這個平台把「本機上的專案」提交到 GitHub 或 GitLab。

## 先理解這個平台在做什麼

這個平台不是雲端版控服務，它是你電腦上的 Git 圖形介面。

它的運作方式是：

1. 你先選一個本機資料夾
2. 平台在那個資料夾裡執行 Git 指令
3. 你透過畫面做 `stage`、`commit`、`add remote`、`push`

所以重點不是「GitHub 上有沒有先建 repository」，而是「你本機選到的資料夾是不是 Git repository」。

## 使用前準備

開始前請先確認：

- 已安裝 Git
- 已安裝 Node.js
- 平台已啟動
- 你有一個本機專案資料夾，例如 `D:\Projects\LINEOA`

另外建議先設定 Git 身分，否則 commit 常會失敗：

```powershell
git config --global user.name "你的名字"
git config --global user.email "你的GitHub或GitLab信箱"
```

可用以下指令確認：

```powershell
git config --get user.name
git config --get user.email
```

## 第一次把本機專案上傳到 GitHub

以下是最常見的使用情境。

### 步驟 1: 在 GitHub 建立 repository

先到 GitHub 建一個新的 repository。

例如：

- Repository name: `LINEOA`
- URL: `https://github.com/StanfordLintw/LINEOA.git`

這一步只是在遠端建立倉庫，不會自動接管你電腦上的資料夾。

### 步驟 2: 在平台設定工作目錄

打開平台後，在工作目錄欄位選到你的本機專案根目錄，例如：

```text
D:\Projects\LINEOA
```

注意：

- 要選專案根目錄
- 不要選錯到上一層資料夾
- 不要只選到某個子資料夾

### 步驟 3: 初始化 Git repository

如果這個資料夾原本不是 Git repo，請在平台按 `Init`。

這一步等同於：

```powershell
git init
```

初始化成功後，這個資料夾裡就會有 `.git`，之後才能新增 remote、commit、push。

### 步驟 4: 檢查檔案狀態

初始化後，平台應該會列出你的專案檔案變更。

常見狀態：

- `untracked`: 新檔案，還沒加入 Git
- `modified`: 檔案有修改
- `staged`: 已加入暫存區，準備 commit

### 步驟 5: Stage 檔案

如果你是第一次上傳整個專案，通常直接按 `Stage All` 就可以。

如果你只想提交部分檔案，也可以個別選擇。

### 步驟 6: Commit

在 Commit 訊息欄位輸入說明，例如：

```text
Initial commit
```

然後按 `Commit`。

如果這一步失敗，優先檢查：

- 是否已設定 `user.name`
- 是否已設定 `user.email`
- 是否真的有 staged 檔案

### 步驟 7: 新增 Remote

在 Remote 區塊按 `新增`，填入：

- 名稱: `origin`
- URL: `https://github.com/StanfordLintw/LINEOA.git`

建議第一個 remote 都用 `origin`。

這一步成功的前提是：

- 目前工作目錄必須是 Git repo
- 也就是該資料夾裡已經有 `.git`

如果這一步出現：

```text
fatal: not a git repository (or any of the parent directories): .git
```

表示你目前選到的資料夾不是 Git repo，請回到步驟 2 和步驟 3。

### 步驟 8: Push 到 GitHub

在 Push 區塊選：

- Remote: `origin`
- Branch: `main` 或目前分支名稱

然後按 `Push`。

如果這是第一次推送，常見會需要登入或授權 GitHub。

## 如果本機專案還沒有 main 分支

有些新初始化的 repo 預設分支可能是 `master`。

如果你的 GitHub 倉庫想用 `main`，可以在終端機先執行：

```powershell
git branch -M main
```

之後再從平台做 push，或直接用指令做第一次推送：

```powershell
git push -u origin main
```

## 日常使用流程

之後你每次使用這個平台，大致就是這個流程：

1. 選擇本機專案資料夾
2. 看哪些檔案有變更
3. Stage 要提交的檔案
4. 輸入 commit 訊息
5. Commit
6. Push 到 GitHub 或 GitLab

## GitLab 的做法也一樣

如果是 GitLab，差別只在 remote URL 不同。

例如：

```text
https://gitlab.com/你的帳號/專案名.git
```

平台操作流程完全一樣：

1. 選本機專案資料夾
2. Init
3. Stage
4. Commit
5. Add Remote
6. Push

## 常見錯誤與原因

### 1. `fatal: not a git repository`

原因：

- 目前工作目錄不是 Git repo

處理方式：

- 確認平台選的是正確的專案根目錄
- 先按 `Init`

### 2. 無法 commit

原因通常是：

- 沒有 staged 檔案
- 沒設定 Git 身分

請先確認：

```powershell
git config --get user.name
git config --get user.email
```

### 3. 無法 push

原因通常是：

- remote 沒設定
- branch 選錯
- GitHub / GitLab 認證失敗

這跟 remote 是否為 private 沒有直接關係。

private repo 可以正常 `add remote`，真正會卡的是 `push` 時的登入授權。

### 4. GitHub 已建立 repo，但平台還是不能用

原因：

- 你只建立了遠端 repo
- 但本機資料夾還沒有初始化 Git

正確理解：

- GitHub repo 是遠端
- 你的本機專案資料夾是本地 repo
- 平台是操作本地 repo，再把內容推到遠端

## 建議的第一次操作範例

假設你的本機專案在：

```text
D:\Projects\LINEOA
```

GitHub 倉庫是：

```text
https://github.com/StanfordLintw/LINEOA.git
```

你在平台中的操作順序應該是：

1. 選工作目錄 `D:\Projects\LINEOA`
2. 按 `Init`
3. 按 `Stage All`
4. 輸入 `Initial commit`
5. 按 `Commit`
6. 新增 Remote
7. 名稱填 `origin`
8. URL 填 `https://github.com/StanfordLintw/LINEOA.git`
9. 在 Push 區選 `origin`
10. 選 `main` 或目前分支
11. 按 `Push`

## 建議補充

如果你想讓這個平台更適合新手，後續建議補這幾個功能：

- 當前資料夾不是 Git repo 時，明確顯示提示
- 第一次使用時提供操作精靈
- 在 commit 失敗時直接提示缺少 `user.name` 或 `user.email`
- 在 push 失敗時顯示認證問題說明

## 手冊結論

請記住一句話：

先選本機專案資料夾，讓它成為 Git repo，再把它連到 GitHub 或 GitLab。

不是先有 GitHub repository，平台就會自動能 commit。
