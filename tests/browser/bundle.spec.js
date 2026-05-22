const { test, expect } = require('@playwright/test');
const path = require('path');

const HOST = process.env.BOLT_HOST ?? 'localhost';
const PORT = process.env.BOLT_PORT ?? '7687';
const USER = process.env.BOLT_USER ?? 'neo4j';
const PASSWORD = process.env.BOLT_PASSWORD ?? 'nothing123';
const SCHEME = process.env.BOLT_AUTH_SCHEME ?? 'basic';

const htmlFile = path.resolve(__dirname, 'test.html');
const params = new URLSearchParams({ host: HOST, port: PORT, user: USER, password: PASSWORD, scheme: SCHEME });

test('bundled driver connects and queries in browser', async ({ page }) => {
    page.on('console', msg => console.log(`[browser] ${msg.text()}`));
    page.on('pageerror', err => console.error(`[browser error] ${err.message}`));

    await page.goto(`file:///${htmlFile}?${params}`);

    await page.waitForFunction(() => window.__testResult !== undefined, { timeout: 10000 });

    const result = await page.evaluate(() => window.__testResult);

    if (!result.success) {
        throw new Error(`Driver failed in browser: ${result.error}`);
    }

    expect(result.records).toEqual([{ num: 1 }]);
});
