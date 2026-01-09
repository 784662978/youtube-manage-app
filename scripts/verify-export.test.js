const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();
const REPORT_PATH = path.join(ROOT_DIR, 'out', 'export_report.json');

describe('Static Export Verification', () => {
    
    test('Export report should exist', (t) => {
        assert.ok(fs.existsSync(REPORT_PATH), 'Report file should exist');
    });

    test('Export report should contain valid summary', (t) => {
        if (!fs.existsSync(REPORT_PATH)) return;

        const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
        
        assert.ok(report.success, 'Export should be marked as success');
        assert.ok(report.summary.totalFiles > 0, 'Total files should be > 0');
        assert.ok(report.files.length > 0, 'Files list should not be empty');
        
        // Check for index.html (home page)
        const hasIndex = report.files.some(f => f.path === 'index.html' || f.path === 'index.html');
        assert.ok(hasIndex, 'Should export index.html');

        // Check for login.html (login page)
        const hasLogin = report.files.some(f => f.path === 'login.html');
        assert.ok(hasLogin, 'Should export login.html');
    });

});
