const express = require('express');
const cors = require('cors');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Current working directory for git operations
let currentWorkDir = '';

// Helper: execute a git command in the working directory
function gitExec(args, cwd) {
    return new Promise((resolve, reject) => {
        if (!cwd || !fs.existsSync(cwd)) {
            return reject(new Error('工作目錄未設定或不存在'));
        }
        execFile('git', args, { cwd, maxBuffer: 1024 * 1024 * 10, env: { ...process.env, LANG: 'en_US.UTF-8' } }, (error, stdout, stderr) => {
            if (error) {
                return reject(new Error(stderr || error.message));
            }
            resolve(stdout.trim());
        });
    });
}

// ─── API: Set working directory ───────────────────────────────────
app.post('/api/set-workdir', (req, res) => {
    const { workdir } = req.body;
    if (!workdir) {
        return res.status(400).json({ success: false, message: '請提供工作目錄路徑' });
    }
    const resolvedPath = path.resolve(workdir);
    if (!fs.existsSync(resolvedPath)) {
        return res.status(400).json({ success: false, message: `目錄不存在: ${resolvedPath}` });
    }
    currentWorkDir = resolvedPath;
    res.json({ success: true, workdir: currentWorkDir });
});

// ─── API: Get current working directory ───────────────────────────
app.get('/api/workdir', (req, res) => {
    res.json({ workdir: currentWorkDir });
});

// ─── API: Initialize git repo ─────────────────────────────────────
app.post('/api/init', async (req, res) => {
    try {
        const output = await gitExec(['init'], currentWorkDir);
        res.json({ success: true, message: output });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── API: Git status ──────────────────────────────────────────────
app.get('/api/status', async (req, res) => {
    try {
        // Get current branch
        let branch = '';
        try {
            branch = await gitExec(['rev-parse', '--abbrev-ref', 'HEAD'], currentWorkDir);
        } catch {
            branch = '(no branch)';
        }

        // Get status in porcelain format
        const statusRaw = await gitExec(['status', '--porcelain', '-uall'], currentWorkDir);
        const files = statusRaw
            ? statusRaw.split('\n').map(line => {
                const indexStatus = line.charAt(0);
                const workTreeStatus = line.charAt(1);
                const filePath = line.substring(3);
                let status = 'modified';
                if (indexStatus === '?' || workTreeStatus === '?') status = 'untracked';
                else if (indexStatus === 'A') status = 'added';
                else if (indexStatus === 'D' || workTreeStatus === 'D') status = 'deleted';
                else if (indexStatus === 'R') status = 'renamed';

                const staged = indexStatus !== ' ' && indexStatus !== '?';

                return { path: filePath, status, staged, indexStatus, workTreeStatus };
            })
            : [];

        // Check if it's a git repo
        let isGitRepo = true;
        try {
            await gitExec(['rev-parse', '--is-inside-work-tree'], currentWorkDir);
        } catch {
            isGitRepo = false;
        }

        res.json({ branch, files, isGitRepo, workdir: currentWorkDir });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── API: List remotes ────────────────────────────────────────────
app.get('/api/remotes', async (req, res) => {
    try {
        const raw = await gitExec(['remote', '-v'], currentWorkDir);
        const remotes = {};
        if (raw) {
            raw.split('\n').forEach(line => {
                const parts = line.split(/\s+/);
                if (parts.length >= 2) {
                    const name = parts[0];
                    const url = parts[1];
                    const type = parts[2] ? parts[2].replace(/[()]/g, '') : '';
                    if (!remotes[name]) {
                        remotes[name] = { name, urls: {} };
                    }
                    remotes[name].urls[type] = url;
                }
            });
        }
        res.json({ remotes: Object.values(remotes) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── API: Add remote ──────────────────────────────────────────────
app.post('/api/remote/add', async (req, res) => {
    try {
        const { name, url } = req.body;
        if (!name || !url) {
            return res.status(400).json({ success: false, message: '請提供 remote 名稱和 URL' });
        }
        const output = await gitExec(['remote', 'add', name, url], currentWorkDir);
        res.json({ success: true, message: `已新增 remote: ${name}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── API: Remove remote ──────────────────────────────────────────
app.post('/api/remote/remove', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: '請提供 remote 名稱' });
        }
        await gitExec(['remote', 'remove', name], currentWorkDir);
        res.json({ success: true, message: `已移除 remote: ${name}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── API: Git add ─────────────────────────────────────────────────
app.post('/api/add', async (req, res) => {
    try {
        const { files } = req.body; // array of file paths, or empty/null for all
        if (files && files.length > 0) {
            await gitExec(['add', ...files], currentWorkDir);
            res.json({ success: true, message: `已暫存 ${files.length} 個檔案` });
        } else {
            await gitExec(['add', '-A'], currentWorkDir);
            res.json({ success: true, message: '已暫存所有變更' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── API: Git unstage ─────────────────────────────────────────────
app.post('/api/unstage', async (req, res) => {
    try {
        const { files } = req.body;
        if (files && files.length > 0) {
            await gitExec(['reset', 'HEAD', ...files], currentWorkDir);
            res.json({ success: true, message: `已取消暫存 ${files.length} 個檔案` });
        } else {
            await gitExec(['reset', 'HEAD'], currentWorkDir);
            res.json({ success: true, message: '已取消暫存所有檔案' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── API: Git commit ──────────────────────────────────────────────
app.post('/api/commit', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ success: false, message: '請提供 commit message' });
        }
        const output = await gitExec(['commit', '-m', message], currentWorkDir);
        res.json({ success: true, message: output });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── API: Git push ────────────────────────────────────────────────
app.post('/api/push', async (req, res) => {
    try {
        const { remote, branch, force } = req.body;
        if (!remote) {
            return res.status(400).json({ success: false, message: '請選擇要推送的 remote' });
        }
        const args = ['push', remote];
        if (branch) args.push(branch);
        if (force) args.push('--force');

        const output = await gitExec(args, currentWorkDir);
        res.json({ success: true, message: output || `成功推送到 ${remote}${branch ? '/' + branch : ''}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── API: Push to all remotes ─────────────────────────────────────
app.post('/api/push-all', async (req, res) => {
    try {
        const { branch } = req.body;
        const raw = await gitExec(['remote'], currentWorkDir);
        if (!raw) {
            return res.status(400).json({ success: false, message: '沒有設定任何 remote' });
        }
        const remotes = raw.split('\n').filter(r => r.trim());
        const results = [];
        for (const remote of remotes) {
            try {
                const args = ['push', remote];
                if (branch) args.push(branch);
                await gitExec(args, currentWorkDir);
                results.push({ remote, success: true, message: `成功推送到 ${remote}` });
            } catch (err) {
                results.push({ remote, success: false, message: err.message });
            }
        }
        res.json({ success: true, results });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── API: Git log ─────────────────────────────────────────────────
app.get('/api/log', async (req, res) => {
    try {
        const count = parseInt(req.query.count) || 20;
        const raw = await gitExec(
            ['log', `--max-count=${count}`, '--pretty=format:%H|%h|%an|%ae|%ar|%s'],
            currentWorkDir
        );
        const commits = raw
            ? raw.split('\n').map(line => {
                const [hash, shortHash, author, email, date, ...msgParts] = line.split('|');
                return { hash, shortHash, author, email, date, message: msgParts.join('|') };
            })
            : [];
        res.json({ commits });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── API: List branches ──────────────────────────────────────────
app.get('/api/branches', async (req, res) => {
    try {
        const raw = await gitExec(['branch', '-a'], currentWorkDir);
        const branches = raw
            ? raw.split('\n').map(line => {
                const current = line.startsWith('*');
                const name = line.replace(/^\*?\s+/, '').trim();
                return { name, current };
            })
            : [];
        res.json({ branches });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── API: Git diff for a file ─────────────────────────────────────
app.get('/api/diff', async (req, res) => {
    try {
        const { file, staged } = req.query;
        const args = ['diff'];
        if (staged === 'true') args.push('--cached');
        if (file) args.push(file);
        const output = await gitExec(args, currentWorkDir);
        res.json({ diff: output });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── API: Browse directories ──────────────────────────────────────
app.get('/api/browse', (req, res) => {
    try {
        const targetPath = req.query.path || require('os').homedir();
        const resolvedPath = path.resolve(targetPath);

        if (!fs.existsSync(resolvedPath)) {
            return res.status(400).json({ success: false, message: `路徑不存在: ${resolvedPath}` });
        }

        const stat = fs.statSync(resolvedPath);
        if (!stat.isDirectory()) {
            return res.status(400).json({ success: false, message: '指定路徑不是資料夾' });
        }

        const entries = [];
        const items = fs.readdirSync(resolvedPath, { withFileTypes: true });
        for (const item of items) {
            if (item.name.startsWith('.')) continue; // skip hidden
            if (item.isDirectory()) {
                entries.push({
                    name: item.name,
                    path: path.join(resolvedPath, item.name),
                    isDir: true,
                });
            }
        }

        // Sort directories alphabetically
        entries.sort((a, b) => a.name.localeCompare(b.name));

        // Get parent path
        const parentPath = path.dirname(resolvedPath);

        res.json({
            success: true,
            currentPath: resolvedPath,
            parentPath: parentPath !== resolvedPath ? parentPath : null,
            entries,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── API: Git checkout (restore to specific commit) ───────────────
app.post('/api/checkout', async (req, res) => {
    try {
        const { hash, createBranch } = req.body;
        if (!hash) {
            return res.status(400).json({ success: false, message: '請提供 commit hash' });
        }

        if (createBranch) {
            // Create a new branch at the specified commit
            const branchName = `restore-${hash.substring(0, 7)}`;
            await gitExec(['checkout', '-b', branchName, hash], currentWorkDir);
            res.json({ success: true, message: `已建立並切換到分支: ${branchName}` });
        } else {
            // Hard reset to the commit
            await gitExec(['reset', '--hard', hash], currentWorkDir);
            res.json({ success: true, message: `已回到 commit: ${hash.substring(0, 7)}` });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── API: Git pull ────────────────────────────────────────────────
app.post('/api/pull', async (req, res) => {
    try {
        const { remote, branch } = req.body;
        const args = ['pull'];
        if (remote) args.push(remote);
        if (branch) args.push(branch);
        const output = await gitExec(args, currentWorkDir);
        res.json({ success: true, message: output || '已同步最新版本' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── API: Git revert (safe undo) ──────────────────────────────────
app.post('/api/revert', async (req, res) => {
    try {
        const { hash } = req.body;
        if (!hash) {
            return res.status(400).json({ success: false, message: '請提供 commit hash' });
        }
        const output = await gitExec(['revert', '--no-edit', hash], currentWorkDir);
        res.json({ success: true, message: output || `已安全回退 commit: ${hash.substring(0, 7)}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── API: Git show (commit details) ───────────────────────────────
app.get('/api/show', async (req, res) => {
    try {
        const { hash } = req.query;
        if (!hash) {
            return res.status(400).json({ success: false, message: '請提供 commit hash' });
        }
        // Get commit info
        const info = await gitExec(
            ['show', '--stat', '--format=%H|%h|%an|%ae|%ar|%s', hash],
            currentWorkDir
        );
        // Get the diff
        const diff = await gitExec(['show', '--format=', hash], currentWorkDir);
        res.json({ success: true, info, diff });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── API: List project files (tree) ───────────────────────────────
app.get('/api/files', async (req, res) => {
    try {
        // Use git ls-files to get tracked files, fall back to find
        let fileList;
        try {
            const output = await gitExec(['ls-files'], currentWorkDir);
            fileList = output.split('\n').filter(f => f.trim());
        } catch {
            // Not a git repo or no files tracked, use fs
            const walk = (dir, prefix = '') => {
                const results = [];
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
                    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
                    if (entry.isDirectory()) {
                        results.push(...walk(path.join(dir, entry.name), rel));
                    } else {
                        results.push(rel);
                    }
                }
                return results;
            };
            fileList = walk(currentWorkDir);
        }

        // Build tree structure
        const tree = [];
        const folderMap = {};
        fileList.forEach(filePath => {
            const parts = filePath.split('/');
            if (parts.length === 1) {
                tree.push({ name: parts[0], type: 'file', path: filePath });
            } else {
                const folder = parts[0];
                if (!folderMap[folder]) {
                    folderMap[folder] = { name: folder, type: 'folder', path: folder, children: [] };
                    tree.push(folderMap[folder]);
                }
                folderMap[folder].children.push({
                    name: parts.slice(1).join('/'),
                    type: 'file',
                    path: filePath,
                });
            }
        });

        res.json({ success: true, files: tree, total: fileList.length });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── API: Get file content ────────────────────────────────────────
app.get('/api/file-content', (req, res) => {
    try {
        const { file } = req.query;
        if (!file) {
            return res.status(400).json({ success: false, message: '請提供檔案路徑' });
        }
        const fullPath = path.join(currentWorkDir, file);
        // Security: ensure path is within workdir
        if (!fullPath.startsWith(currentWorkDir)) {
            return res.status(403).json({ success: false, message: '禁止存取此路徑' });
        }
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ success: false, message: '檔案不存在' });
        }
        const stat = fs.statSync(fullPath);
        if (stat.size > 500000) {
            return res.json({ success: true, content: '(檔案過大，無法預覽)', language: 'text' });
        }
        const content = fs.readFileSync(fullPath, 'utf-8');
        // Detect language from extension
        const ext = path.extname(file).toLowerCase().replace('.', '');
        const langMap = {
            js: 'javascript', ts: 'typescript', py: 'python',
            html: 'html', css: 'css', json: 'json',
            md: 'markdown', sh: 'bash', yml: 'yaml', yaml: 'yaml',
            xml: 'xml', sql: 'sql', go: 'go', rs: 'rust',
            java: 'java', rb: 'ruby', php: 'php', swift: 'swift',
        };
        res.json({ success: true, content, language: langMap[ext] || 'text', size: stat.size });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── Fallback: serve index.html ───────────────────────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 版本控制平台已啟動: http://localhost:${PORT}`);
});
