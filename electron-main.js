const { app, BrowserWindow, dialog, shell } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;
const PORT = 3000;

function startServer() {
    return new Promise((resolve, reject) => {
        // Fork the Express server as a child process
        serverProcess = fork(path.join(__dirname, 'server.js'), [], {
            env: { ...process.env, PORT: PORT, ELECTRON: '1' },
            silent: true,
        });

        serverProcess.stdout.on('data', (data) => {
            console.log(`Server: ${data}`);
            if (data.toString().includes('版本控制平台已啟動')) {
                resolve();
            }
        });

        serverProcess.stderr.on('data', (data) => {
            console.error(`Server Error: ${data}`);
        });

        serverProcess.on('error', (err) => {
            reject(err);
        });

        // Resolve after 3 seconds as fallback
        setTimeout(resolve, 3000);
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 900,
        minHeight: 600,
        title: '史丹專屬版控平台',
        titleBarStyle: 'hiddenInset',
        backgroundColor: '#0a0a1a',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, 'public', 'icon.png'),
    });

    mainWindow.loadURL(`http://localhost:${PORT}`);

    // Open external links in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(async () => {
    try {
        await startServer();
    } catch (err) {
        console.error('Failed to start server:', err);
        dialog.showErrorBox('啟動失敗', '無法啟動伺服器: ' + err.message);
        app.quit();
        return;
    }
    createWindow();
});

app.on('window-all-closed', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
    app.quit();
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

app.on('before-quit', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
});
