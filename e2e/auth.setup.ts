import { test as setup } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const authFile = path.join(__dirname, '.auth', 'student.json');

setup('authenticate student portal', async ({ page, baseURL }) => {
  const loginId = process.env.E2E_PORTAL_LOGIN_ID?.trim();
  const password = process.env.E2E_PORTAL_PASSWORD;

  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  if (!loginId || !password) {
    await page.context().storageState({ path: authFile });
    return;
  }

  const res = await page.request.post(`${baseURL}/api/auth/login`, {
    data: { loginId, password },
  });

  if (!res.ok()) {
    throw new Error(`E2E login failed: HTTP ${res.status()}`);
  }

  await page.context().storageState({ path: authFile });
});
