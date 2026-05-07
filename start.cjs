const { spawn, execSync } = require('child_process');
const { existsSync } = require('fs');
const { join } = require('path');
const http = require('http');

const ROOT = __dirname;
const isWin = process.platform === 'win32';

function findCmd(name) {
  const cmdPath = join(ROOT, 'node_modules', '.bin', name + (isWin ? '.cmd' : ''));
  if (existsSync(cmdPath)) return cmdPath;
  return name;
}

(async () => {
  // 1. Check node_modules
  if (!existsSync(join(ROOT, 'node_modules'))) {
    console.log('Installing dependencies...');
    const install = spawn('npm', ['install'], { cwd: ROOT, stdio: 'inherit' });
    await new Promise((resolve, reject) => {
      install.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error('npm install failed'));
      });
    });
  }

  const tsxCmd = findCmd('tsx');
  const viteCmd = findCmd('vite');

  // 2. Start backend
  const backend = isWin
    ? spawn('cmd.exe', ['/c', tsxCmd, 'server/index.ts'], { cwd: ROOT, stdio: 'inherit' })
    : spawn(process.execPath, [tsxCmd, 'server/index.ts'], { cwd: ROOT, stdio: 'inherit' });

  // 3. Start frontend
  const frontend = isWin
    ? spawn('cmd.exe', ['/c', viteCmd], { cwd: ROOT, stdio: 'inherit' })
    : spawn(process.execPath, [viteCmd], { cwd: ROOT, stdio: 'inherit' });

  // 4. Wait for Vite to be ready, then open browser
  function waitForServer(url, maxRetries = 30) {
    return new Promise((resolve) => {
      let retries = 0;
      const check = () => {
        http
          .get(url, () => resolve(true))
          .on('error', () => {
            if (++retries < maxRetries) setTimeout(check, 500);
            else resolve(false);
          });
      };
      check();
    });
  }

  function openBrowser(url) {
    const platform = process.platform;
    let cmd;
    if (platform === 'win32') {
      cmd = `start "" "${url}"`;
    } else if (platform === 'darwin') {
      cmd = `open "${url}"`;
    } else {
      cmd = `xdg-open "${url}"`;
    }
    execSync(cmd, { stdio: 'ignore' });
  }

  // Poll for frontend readiness
  setTimeout(async () => {
    const ready = await waitForServer('http://localhost:5173');
    if (ready) {
      console.log('\n✨ Dashboard ready at http://localhost:5173\n');
      openBrowser('http://localhost:5173');
    } else {
      console.log(
        '\n⚠  Frontend may not be ready. Open http://localhost:5173 manually.\n'
      );
    }
  }, 2000);

  // 5. Cleanup on exit
  let cleaned = false;
  function cleanup() {
    if (cleaned) return;
    cleaned = true;
    console.log('\nShutting down...');
    try { backend.kill('SIGTERM'); } catch {}
    try { frontend.kill('SIGTERM'); } catch {}
    process.exit(0);
  }

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);
})();
