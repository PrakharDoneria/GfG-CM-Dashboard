import { execSync } from 'node:child_process';
import { existsSync, renameSync, rmSync } from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const apiDir = path.join(projectRoot, 'app', 'api');
const backupDir = path.join(projectRoot, '.api-cloudflare-build');

function moveDirectory(fromPath, toPath) {
  if (existsSync(toPath)) {
    rmSync(toPath, { recursive: true, force: true });
  }

  if (existsSync(fromPath)) {
    renameSync(fromPath, toPath);
    return true;
  }

  return false;
}

const apiMoved = moveDirectory(apiDir, backupDir);

try {
  execSync('npx next build', {
    stdio: 'inherit',
    env: process.env,
  });
} finally {
  if (apiMoved && existsSync(backupDir)) {
    if (existsSync(apiDir)) {
      rmSync(apiDir, { recursive: true, force: true });
    }

    renameSync(backupDir, apiDir);
  }
}