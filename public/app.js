// ══════════════════════════════════════════════════════
//  Stanford Version Control — Frontend Application
// ══════════════════════════════════════════════════════

const API = '';

// ─── State ──────────────────────────────────────────────
let state = {
    workdir: '',
    branch: '—',
    isGitRepo: false,
    files: [],
    remotes: [],
    commits: [],
    branches: [],
    selectedFiles: new Set(),
};

// ─── DOM Elements ───────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const dom = {
    workdirInput: $('#workdir-input'),
    btnSetWorkdir: $('#btn-set-workdir'),
    btnInitRepo: $('#btn-init-repo'),
    branchBadge: $('#current-branch'),
    statusDot: $('#status-dot'),
    statModified: $('#stat-modified'),
    statAdded: $('#stat-added'),
    statStaged: $('#stat-staged'),
    statRemotes: $('#stat-remotes'),
    fileList: $('#file-list'),
    fileCountBadge: $('#file-count-badge'),
    commitList: $('#commit-list'),
    remoteList: $('#remote-list'),
    commitMessage: $('#commit-message'),
    pushRemote: $('#push-remote'),
    pushBranch: $('#push-branch'),
    btnStageAll: $('#btn-stage-all'),
    btnUnstageAll: $('#btn-unstage-all'),
    btnSelectAll: $('#btn-select-all'),
    btnRefresh: $('#btn-refresh'),
    btnRefreshLog: $('#btn-refresh-log'),
    btnCommit: $('#btn-commit'),
    btnPush: $('#btn-push'),
    btnPushAll: $('#btn-push-all'),
    btnAddRemoteModal: $('#btn-add-remote-modal'),
    btnCancelRemote: $('#btn-cancel-remote'),
    btnConfirmRemote: $('#btn-confirm-remote'),
    modalAddRemote: $('#modal-add-remote'),
    remoteNameInput: $('#remote-name-input'),
    remoteUrlInput: $('#remote-url-input'),
    toastContainer: $('#toast-container'),
    loadingOverlay: $('#loading-overlay'),
    loadingText: $('#loading-text'),
    // Folder browser
    btnBrowseFolder: $('#btn-browse-folder'),
    modalBrowseFolder: $('#modal-browse-folder'),
    browseCurrentPath: $('#browse-current-path'),
    browseList: $('#browse-list'),
    btnBrowseUp: $('#btn-browse-up'),
    btnBrowseHome: $('#btn-browse-home'),
    btnBrowseCancel: $('#btn-browse-cancel'),
    btnBrowseSelect: $('#btn-browse-select'),
    // Help
    btnHelp: $('#btn-help'),
    modalHelp: $('#modal-help'),
    btnCloseHelp: $('#btn-close-help'),
    // Diff viewer
    modalDiff: $('#modal-diff'),
    diffHeader: $('#diff-header'),
    diffContent: $('#diff-content'),
    btnCloseDiff: $('#btn-close-diff'),
    // Pull
    btnPull: $('#btn-pull'),
};

// ─── Browse State ───────────────────────────────────────
let browseState = {
    currentPath: '',
    parentPath: null,
    entries: [],
};

// ─── API Helpers ────────────────────────────────────────
async function apiGet(path) {
    const res = await fetch(`${API}${path}`);
    return res.json();
}

async function apiPost(path, body = {}) {
    const res = await fetch(`${API}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    return res.json();
}

// ─── Toast System ───────────────────────────────────────
function showToast(message, type = 'info', duration = 4000) {
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('exit');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ─── Loading ────────────────────────────────────────────
function showLoading(text = '處理中...') {
    dom.loadingText.textContent = text;
    dom.loadingOverlay.classList.add('active');
}

function hideLoading() {
    dom.loadingOverlay.classList.remove('active');
}

// ─── Detect Platform ────────────────────────────────────
function detectPlatform(url) {
    if (!url) return 'other';
    const u = url.toLowerCase();
    if (u.includes('github')) return 'github';
    if (u.includes('gitlab')) return 'gitlab';
    if (u.includes('gitee')) return 'gitee';
    if (u.includes('bitbucket')) return 'bitbucket';
    return 'other';
}

function platformLabel(platform) {
    const labels = {
        github: 'GitHub',
        gitlab: 'GitLab',
        gitee: 'Gitee',
        bitbucket: 'Bitbucket',
        other: 'Other',
    };
    return labels[platform] || 'Other';
}

// ─── Render: Stats ──────────────────────────────────────
function renderStats() {
    const modified = state.files.filter(f => f.status === 'modified').length;
    const added = state.files.filter(f => f.status === 'added' || f.status === 'untracked').length;
    const staged = state.files.filter(f => f.staged).length;
    dom.statModified.textContent = modified;
    dom.statAdded.textContent = added;
    dom.statStaged.textContent = staged;
    dom.statRemotes.textContent = state.remotes.length;
    dom.fileCountBadge.textContent = state.files.length;
}

// ─── Render: File List ──────────────────────────────────
function renderFileList() {
    if (state.files.length === 0) {
        dom.fileList.innerHTML = `
      <li class="empty-state">
        <span class="icon">✨</span>
        <span class="message">${state.isGitRepo ? '工作區很乾淨，沒有任何變更！' : '請先設定工作目錄'}</span>
      </li>`;
        return;
    }

    dom.fileList.innerHTML = state.files.map((file, idx) => {
        const statusLabel = file.staged ? 'staged' : file.status;
        const statusClass = file.staged ? 'staged' : file.status;
        const checked = state.selectedFiles.has(file.path) ? 'checked' : '';
        return `
      <li class="file-item">
        <input type="checkbox" data-file-idx="${idx}" data-file-path="${file.path}" ${checked} />
        <span class="file-status ${statusClass}">${statusLabel}</span>
        <span class="file-path" title="${file.path}">${file.path}</span>
      </li>`;
    }).join('');

    // Bind checkbox events
    dom.fileList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const path = e.target.dataset.filePath;
            if (e.target.checked) {
                state.selectedFiles.add(path);
            } else {
                state.selectedFiles.delete(path);
            }
        });
    });
}

// ─── Render: Commit List ────────────────────────────────
function renderCommitList() {
    if (state.commits.length === 0) {
        dom.commitList.innerHTML = `
      <li class="empty-state">
        <span class="icon">📭</span>
        <span class="message">尚無 Commit 紀錄</span>
      </li>`;
        return;
    }

    dom.commitList.innerHTML = state.commits.map(c => `
    <li class="commit-item">
      <span class="commit-hash">${c.shortHash}</span>
      <div class="commit-info">
        <div class="commit-message">${escapeHtml(c.message)}</div>
        <div class="commit-meta">
          <span>👤 ${escapeHtml(c.author)}</span>
          <span>🕐 ${c.date}</span>
        </div>
      </div>
      <div class="commit-actions">
        <button class="btn btn-ghost btn-sm" data-view-hash="${c.hash}" title="查看變更內容">🔍 查看</button>
        <button class="btn btn-warning btn-sm" data-checkout-hash="${c.hash}" title="回到此版本">⏪ 回到此版</button>
        <button class="btn btn-ghost btn-sm" data-branch-hash="${c.hash}" title="從此 commit 建立新分支">⤴️ 建立分支</button>
      </div>
    </li>
  `).join('');

    // Bind view, checkout & branch buttons
    dom.commitList.querySelectorAll('[data-view-hash]').forEach(btn => {
        btn.addEventListener('click', () => viewCommitDiff(btn.dataset.viewHash));
    });
    dom.commitList.querySelectorAll('[data-checkout-hash]').forEach(btn => {
        btn.addEventListener('click', () => checkoutCommit(btn.dataset.checkoutHash, false));
    });
    dom.commitList.querySelectorAll('[data-branch-hash]').forEach(btn => {
        btn.addEventListener('click', () => checkoutCommit(btn.dataset.branchHash, true));
    });
}

// ─── Render: Remote List ────────────────────────────────
function renderRemoteList() {
    if (state.remotes.length === 0) {
        dom.remoteList.innerHTML = `
      <li class="empty-state">
        <span class="icon">🔗</span>
        <span class="message">尚無設定 Remote。點擊「+ 新增」來新增。</span>
      </li>`;
        return;
    }

    dom.remoteList.innerHTML = state.remotes.map(r => {
        const url = r.urls.fetch || r.urls.push || '';
        const platform = detectPlatform(url);
        return `
      <li class="remote-item">
        <div class="remote-info">
          <span class="remote-platform ${platform}">${platformLabel(platform)}</span>
          <span class="remote-name">${escapeHtml(r.name)}</span>
          <span class="remote-url" title="${escapeHtml(url)}">${escapeHtml(url)}</span>
        </div>
        <button class="btn btn-danger btn-sm" data-remove-remote="${r.name}">移除</button>
      </li>`;
    }).join('');

    // Bind remove buttons
    dom.remoteList.querySelectorAll('[data-remove-remote]').forEach(btn => {
        btn.addEventListener('click', () => removeRemote(btn.dataset.removeRemote));
    });
}

// ─── Render: Push selects ───────────────────────────────
function renderPushSelects() {
    // Remote select
    const currentRemote = dom.pushRemote.value;
    dom.pushRemote.innerHTML = '<option value="">選擇 remote...</option>';
    state.remotes.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.name;
        opt.textContent = r.name;
        if (r.name === currentRemote) opt.selected = true;
        dom.pushRemote.appendChild(opt);
    });

    // Branch select
    const currentBranch = dom.pushBranch.value;
    dom.pushBranch.innerHTML = '<option value="">選擇分支...</option>';
    state.branches.forEach(b => {
        if (b.name.includes('remotes/')) return; // skip remote branches
        const opt = document.createElement('option');
        opt.value = b.name;
        opt.textContent = b.name;
        if (b.current || b.name === currentBranch) opt.selected = true;
        dom.pushBranch.appendChild(opt);
    });
}

// ─── Data Fetching ──────────────────────────────────────
async function fetchStatus() {
    try {
        const data = await apiGet('/api/status');
        state.branch = data.branch || '—';
        state.files = data.files || [];
        state.isGitRepo = data.isGitRepo;
        dom.branchBadge.textContent = state.branch;

        if (state.isGitRepo) {
            dom.statusDot.className = 'status-dot connected';
            dom.statusDot.title = '已連線 Git Repo';
        } else {
            dom.statusDot.className = 'status-dot disconnected';
            dom.statusDot.title = '非 Git Repo';
        }

        renderStats();
        renderFileList();
    } catch (err) {
        console.error('fetchStatus error:', err);
    }
}

async function fetchRemotes() {
    try {
        const data = await apiGet('/api/remotes');
        state.remotes = data.remotes || [];
        renderRemoteList();
        renderPushSelects();
        renderStats();
    } catch (err) {
        console.error('fetchRemotes error:', err);
    }
}

async function fetchLog() {
    try {
        const data = await apiGet('/api/log');
        state.commits = data.commits || [];
        renderCommitList();
    } catch (err) {
        console.error('fetchLog error:', err);
    }
}

async function fetchBranches() {
    try {
        const data = await apiGet('/api/branches');
        state.branches = data.branches || [];
        renderPushSelects();
    } catch (err) {
        console.error('fetchBranches error:', err);
    }
}

async function refreshAll() {
    await Promise.all([fetchStatus(), fetchRemotes(), fetchLog(), fetchBranches()]);
}

// ─── Actions ────────────────────────────────────────────

// Set workdir
async function setWorkdir() {
    const workdir = dom.workdirInput.value.trim();
    if (!workdir) {
        showToast('請輸入工作目錄路徑', 'warning');
        return;
    }
    showLoading('設定工作目錄...');
    try {
        const data = await apiPost('/api/set-workdir', { workdir });
        if (data.success) {
            state.workdir = data.workdir;
            showToast(`工作目錄已設定：${data.workdir}`, 'success');
            await refreshAll();
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('設定失敗：' + err.message, 'error');
    }
    hideLoading();
}

// Init repo
async function initRepo() {
    showLoading('初始化 Git Repo...');
    try {
        const data = await apiPost('/api/init');
        if (data.success) {
            showToast('Git Repo 初始化成功！', 'success');
            await refreshAll();
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('初始化失敗：' + err.message, 'error');
    }
    hideLoading();
}

// Stage all
async function stageAll() {
    showLoading('暫存變更...');
    try {
        const data = await apiPost('/api/add');
        if (data.success) {
            showToast(data.message, 'success');
            await fetchStatus();
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('Stage 失敗：' + err.message, 'error');
    }
    hideLoading();
}

// Stage selected
async function stageSelected() {
    const files = Array.from(state.selectedFiles);
    if (files.length === 0) {
        showToast('請先選擇要暫存的檔案', 'warning');
        return;
    }
    showLoading('暫存選擇的檔案...');
    try {
        const data = await apiPost('/api/add', { files });
        if (data.success) {
            showToast(data.message, 'success');
            state.selectedFiles.clear();
            await fetchStatus();
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('Stage 失敗：' + err.message, 'error');
    }
    hideLoading();
}

// Unstage all
async function unstageAll() {
    showLoading('取消暫存...');
    try {
        const data = await apiPost('/api/unstage');
        if (data.success) {
            showToast(data.message, 'success');
            await fetchStatus();
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('Unstage 失敗：' + err.message, 'error');
    }
    hideLoading();
}

// Commit
async function commit() {
    const message = dom.commitMessage.value.trim();
    if (!message) {
        showToast('請輸入 Commit Message', 'warning');
        dom.commitMessage.focus();
        return;
    }
    showLoading('Commit 中...');
    try {
        const data = await apiPost('/api/commit', { message });
        if (data.success) {
            showToast('Commit 成功！', 'success');
            dom.commitMessage.value = '';
            await Promise.all([fetchStatus(), fetchLog()]);
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('Commit 失敗：' + err.message, 'error');
    }
    hideLoading();
}

// Push
async function push() {
    const remote = dom.pushRemote.value;
    const branch = dom.pushBranch.value;
    if (!remote) {
        showToast('請選擇要推送的 Remote', 'warning');
        return;
    }
    showLoading(`推送到 ${remote}...`);
    try {
        const data = await apiPost('/api/push', { remote, branch });
        if (data.success) {
            showToast(data.message || `成功推送到 ${remote}！`, 'success');
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('Push 失敗：' + err.message, 'error');
    }
    hideLoading();
}

// Push to all
async function pushAll() {
    const branch = dom.pushBranch.value;
    showLoading('推送到所有 Remote...');
    try {
        const data = await apiPost('/api/push-all', { branch });
        if (data.success && data.results) {
            data.results.forEach(r => {
                showToast(
                    `${r.remote}: ${r.message}`,
                    r.success ? 'success' : 'error',
                    5000
                );
            });
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('Push All 失敗：' + err.message, 'error');
    }
    hideLoading();
}

// Add remote
async function addRemote() {
    const name = dom.remoteNameInput.value.trim();
    const url = dom.remoteUrlInput.value.trim();
    if (!name || !url) {
        showToast('請填寫 Remote 名稱和 URL', 'warning');
        return;
    }
    showLoading('新增 Remote...');
    try {
        const data = await apiPost('/api/remote/add', { name, url });
        if (data.success) {
            showToast(data.message, 'success');
            dom.remoteNameInput.value = '';
            dom.remoteUrlInput.value = '';
            dom.modalAddRemote.classList.remove('active');
            await fetchRemotes();
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('新增失敗：' + err.message, 'error');
    }
    hideLoading();
}

// Remove remote
async function removeRemote(name) {
    if (!confirm(`確定要移除 remote「${name}」嗎？`)) return;
    showLoading(`移除 Remote: ${name}...`);
    try {
        const data = await apiPost('/api/remote/remove', { name });
        if (data.success) {
            showToast(data.message, 'success');
            await fetchRemotes();
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('移除失敗：' + err.message, 'error');
    }
    hideLoading();
}

// Select all files
function selectAllFiles() {
    const allSelected = state.selectedFiles.size === state.files.length;
    if (allSelected) {
        state.selectedFiles.clear();
    } else {
        state.files.forEach(f => state.selectedFiles.add(f.path));
    }
    renderFileList();
}

// Checkout commit
async function checkoutCommit(hash, createBranch) {
    const action = createBranch
        ? `從 commit ${hash.substring(0, 7)} 建立新分支`
        : `回到 commit ${hash.substring(0, 7)}（警告：後續的變更將會丟失）`;
    if (!confirm(`確定要${action}嗎？`)) return;

    showLoading(createBranch ? '建立分支中...' : '回到指定版本...');
    try {
        const data = await apiPost('/api/checkout', { hash, createBranch });
        if (data.success) {
            showToast(data.message, 'success');
            await refreshAll();
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('Checkout 失敗：' + err.message, 'error');
    }
    hideLoading();
}

// View commit diff
async function viewCommitDiff(hash) {
    dom.modalDiff.classList.add('active');
    dom.diffHeader.textContent = '載入中...';
    dom.diffContent.innerHTML = '載入中...';

    try {
        const data = await apiGet(`/api/show?hash=${encodeURIComponent(hash)}`);
        if (data.success) {
            // Parse info header
            const infoLines = data.info.split('\n');
            const firstLine = infoLines[0] || '';
            const parts = firstLine.split('|');
            const shortHash = parts[1] || hash.substring(0, 7);
            const author = parts[2] || '';
            const date = parts[4] || '';
            const message = parts.slice(5).join('|') || '';
            dom.diffHeader.innerHTML = `
        <strong>${escapeHtml(message)}</strong><br>
        <span>👤 ${escapeHtml(author)} · 🕐 ${date} · #${shortHash}</span>
      `;

            // Render diff with syntax highlighting
            const diffLines = data.diff.split('\n');
            dom.diffContent.innerHTML = diffLines.map(line => {
                const escaped = escapeHtml(line);
                if (line.startsWith('+')) {
                    return `<span class="diff-line-add">${escaped}</span>`;
                } else if (line.startsWith('-')) {
                    return `<span class="diff-line-del">${escaped}</span>`;
                } else if (line.startsWith('@@')) {
                    return `<span class="diff-line-info">${escaped}</span>`;
                } else {
                    return escaped + '\n';
                }
            }).join('');
        } else {
            dom.diffContent.textContent = data.message || '無法載入';
        }
    } catch (err) {
        dom.diffContent.textContent = '載入失敗：' + err.message;
    }
}

// Pull
async function pull() {
    showLoading('拉取遠端變更...');
    try {
        const data = await apiPost('/api/pull');
        if (data.success) {
            showToast(data.message || '成功拉取遠端變更！', 'success');
            await refreshAll();
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('Pull 失敗：' + err.message, 'error');
    }
    hideLoading();
}

// ─── Utility ────────────────────────────────────────────
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ─── Folder Browser ────────────────────────────────────
async function browseTo(targetPath) {
    try {
        const url = targetPath
            ? `/api/browse?path=${encodeURIComponent(targetPath)}`
            : '/api/browse';
        const data = await apiGet(url);
        if (data.success) {
            browseState.currentPath = data.currentPath;
            browseState.parentPath = data.parentPath;
            browseState.entries = data.entries;
            dom.browseCurrentPath.textContent = data.currentPath;
            renderBrowseList();
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('瀏覽失敗：' + err.message, 'error');
    }
}

function renderBrowseList() {
    if (browseState.entries.length === 0) {
        dom.browseList.innerHTML = `
      <li class="empty-state" style="padding: 30px 20px;">
        <span class="message">此資料夾沒有子目錄</span>
      </li>`;
        return;
    }

    dom.browseList.innerHTML = browseState.entries.map(entry => `
    <li class="browse-item" data-path="${escapeHtml(entry.path)}">
      <span class="folder-icon">📁</span>
      <span class="folder-name">${escapeHtml(entry.name)}</span>
    </li>
  `).join('');

    // Click = select, double-click = enter directory
    dom.browseList.querySelectorAll('.browse-item').forEach(item => {
        item.addEventListener('click', () => {
            dom.browseList.querySelectorAll('.browse-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            browseState.currentPath = item.dataset.path;
            dom.browseCurrentPath.textContent = item.dataset.path;
        });
        item.addEventListener('dblclick', () => {
            browseTo(item.dataset.path);
        });
    });
}

// ─── Event Binding ──────────────────────────────────────
dom.btnSetWorkdir.addEventListener('click', setWorkdir);
dom.workdirInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') setWorkdir();
});
dom.btnInitRepo.addEventListener('click', initRepo);
dom.btnStageAll.addEventListener('click', stageAll);
dom.btnUnstageAll.addEventListener('click', unstageAll);
dom.btnSelectAll.addEventListener('click', selectAllFiles);
dom.btnRefresh.addEventListener('click', () => refreshAll());
dom.btnRefreshLog.addEventListener('click', () => fetchLog());
dom.btnCommit.addEventListener('click', commit);
dom.btnPush.addEventListener('click', push);
dom.btnPushAll.addEventListener('click', pushAll);
dom.btnPull.addEventListener('click', pull);

// Folder Browser
dom.btnBrowseFolder.addEventListener('click', () => {
    dom.modalBrowseFolder.classList.add('active');
    browseTo(dom.workdirInput.value.trim() || '');
});
dom.btnBrowseCancel.addEventListener('click', () => {
    dom.modalBrowseFolder.classList.remove('active');
});
dom.modalBrowseFolder.addEventListener('click', (e) => {
    if (e.target === dom.modalBrowseFolder) {
        dom.modalBrowseFolder.classList.remove('active');
    }
});
dom.btnBrowseUp.addEventListener('click', () => {
    if (browseState.parentPath) {
        browseTo(browseState.parentPath);
    }
});
dom.btnBrowseHome.addEventListener('click', () => {
    browseTo('');
});
dom.btnBrowseSelect.addEventListener('click', () => {
    if (browseState.currentPath) {
        dom.workdirInput.value = browseState.currentPath;
        dom.modalBrowseFolder.classList.remove('active');
        setWorkdir();
    }
});

// Modal
dom.btnAddRemoteModal.addEventListener('click', () => {
    dom.modalAddRemote.classList.add('active');
    dom.remoteNameInput.focus();
});
dom.btnCancelRemote.addEventListener('click', () => {
    dom.modalAddRemote.classList.remove('active');
});
dom.btnConfirmRemote.addEventListener('click', addRemote);
dom.modalAddRemote.addEventListener('click', (e) => {
    if (e.target === dom.modalAddRemote) {
        dom.modalAddRemote.classList.remove('active');
    }
});

// Keyboard shortcut: Enter in remote URL field to confirm
dom.remoteUrlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addRemote();
});

// Keyboard shortcut: Ctrl+Enter in commit message to commit
dom.commitMessage.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') commit();
});

// Help modal
dom.btnHelp.addEventListener('click', () => {
    dom.modalHelp.classList.add('active');
});
dom.btnCloseHelp.addEventListener('click', () => {
    dom.modalHelp.classList.remove('active');
});
dom.modalHelp.addEventListener('click', (e) => {
    if (e.target === dom.modalHelp) {
        dom.modalHelp.classList.remove('active');
    }
});

// Diff modal
dom.btnCloseDiff.addEventListener('click', () => {
    dom.modalDiff.classList.remove('active');
});
dom.modalDiff.addEventListener('click', (e) => {
    if (e.target === dom.modalDiff) {
        dom.modalDiff.classList.remove('active');
    }
});

// ─── Auto-refresh ───────────────────────────────────────
let refreshInterval = null;

function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
        if (state.workdir) {
            fetchStatus();
        }
    }, 10000); // refresh every 10 seconds
}

// ─── Init ───────────────────────────────────────────────
async function init() {
    // Check if workdir was already set (e.g., server restart)
    try {
        const data = await apiGet('/api/workdir');
        if (data.workdir) {
            state.workdir = data.workdir;
            dom.workdirInput.value = data.workdir;
            await refreshAll();
        }
    } catch (err) {
        console.error('Init error:', err);
    }
    startAutoRefresh();
}

init();
