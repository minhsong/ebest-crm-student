/** Đảm bảo @ebest/crm-api-types đã build dist/ trước next build. */
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const appRoot = path.resolve(__dirname, '..');
const pkgDir = path.join(appRoot, '..', 'ebest-crm-api', 'packages', 'crm-api-types');
const distMain = path.join(pkgDir, 'dist', 'student', 'mock-test-online', 'index.js');
const distTypes = path.join(pkgDir, 'dist', 'student', 'mock-test-online', 'index.d.ts');
const LOG = '[ebest-student-portal]';

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

if (!exists(pkgDir)) {
  console.error(`${LOG} Không tìm thấy ${pkgDir}. Cần monorepo umbrella (ebest-crm-api cùng cấp).`);
  process.exit(1);
}

if (!exists(path.join(appRoot, 'node_modules', '@ebest', 'crm-api-types'))) {
  console.error(`${LOG} Thiếu @ebest/crm-api-types trong node_modules — chạy npm install.`);
  process.exit(1);
}

if (exists(distMain) && exists(distTypes)) {
  process.exit(0);
}

console.log(`${LOG} Building @ebest/crm-api-types...`);
execSync('npm run build', { cwd: pkgDir, stdio: 'inherit', env: process.env });

if (!exists(distMain)) {
  console.error(`${LOG} Build thất bại: thiếu ${distMain}`);
  process.exit(1);
}
