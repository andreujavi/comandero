import { app, BrowserWindow } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serverProcess;

function startBackend() {
    const serverPath = path.join(__dirname, 'server.js');
    serverProcess = spawn(process.execPath, [serverPath], {
        cwd: __dirname,
        stdio: 'ignore'
    });
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        autoHideMenuBar: true
    });
    win.loadURL('https://comandero-6yq6.onrender.com');
}

app.whenReady().then(() => {
    startBackend();
    setTimeout(createWindow, 800);
});

app.on('will-quit', () => {
    if (serverProcess) serverProcess.kill();
});
