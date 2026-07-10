/**
 * Đảm bảo @ebest/game-* có trong node_modules và đã build dist/
 * trước `next build` (file:../ebest-game/... cần monorepo + dist).
 */
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const appRoot = path.resolve(__dirname, '..');
const gamePackagesRoot = path.join(appRoot, '..', 'ebest-game');
const LOG = '[ebest-student-portal]';

const SCOPED_PACKAGES = [
  '@ebest/game-engine-core',
  '@ebest/game-vocabulary-drill',
];

const PACKAGE_DIRS = ['game-engine-core', 'game-vocabulary-drill'];

const PACKAGE_DIST_CHECKS = {
  'game-engine-core': {
    files: ['index.js', 'index.d.ts'],
  },
  'game-vocabulary-drill': {
    files: ['index.js', 'catalog/vocabulary-drill.catalog.d.ts'],
    fileContains: {
      'catalog/vocabulary-drill.catalog.d.ts': 'speed_run',
    },
  },
};

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function readPkgName(pkgDir) {
  const raw = fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8');
  return JSON.parse(raw).name;
}

function ensureNodeModulesLinks() {
  const missing = SCOPED_PACKAGES.filter((name) => {
    const parts = name.split('/');
    return !exists(path.join(appRoot, 'node_modules', ...parts));
  });

  if (missing.length === 0) return;

  console.error(
    [
      '',
      `${LOG} Thiếu package game trong node_modules:`,
      ...missing.map((n) => `  - ${n}`),
      '',
      'Chạy `npm install` trong ebest-student-portal (cần ebest-game/ cùng cấp).',
      '',
    ].join('\n'),
  );
  process.exit(1);
}

function packageDistIsComplete(pkgDir, dirName) {
  const check = PACKAGE_DIST_CHECKS[dirName];
  if (!check) {
    return exists(path.join(pkgDir, 'dist', 'index.js'));
  }

  for (const rel of check.files) {
    if (!exists(path.join(pkgDir, 'dist', rel))) {
      return false;
    }
  }

  if (check.fileContains) {
    for (const [rel, needle] of Object.entries(check.fileContains)) {
      const filePath = path.join(pkgDir, 'dist', rel);
      if (!exists(filePath)) return false;
      const text = fs.readFileSync(filePath, 'utf8');
      if (!text.includes(needle)) return false;
    }
  }

  return true;
}

function buildPackageIfNeeded(dirName) {
  const pkgDir = path.join(gamePackagesRoot, dirName);

  if (!exists(pkgDir)) {
    console.error(`${LOG} Không tìm thấy ${pkgDir}. Cần monorepo ebest-game/ cùng cấp.`);
    process.exit(1);
  }

  if (packageDistIsComplete(pkgDir, dirName)) {
    return;
  }

  const pkgName = readPkgName(pkgDir);
  console.log(`${LOG} Building ${pkgName} (dist thiếu hoặc lỗi thời)...`);
  execSync('npm run build', {
    cwd: pkgDir,
    stdio: 'inherit',
    env: process.env,
  });
}

function main() {
  ensureNodeModulesLinks();

  if (!exists(gamePackagesRoot)) {
    for (const name of SCOPED_PACKAGES) {
      const parts = name.split('/');
      const linked = path.join(appRoot, 'node_modules', ...parts);
      if (!exists(path.join(linked, 'dist', 'index.js'))) {
        console.error(`${LOG} ${name} thiếu dist/index.js`);
        process.exit(1);
      }
    }
    return;
  }

  for (const dir of PACKAGE_DIRS) {
    buildPackageIfNeeded(dir);
  }
}

main();
