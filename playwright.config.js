const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests/browser',
    timeout: 15000,
    use: {
        browserName: 'chromium',
    },
});