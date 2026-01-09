const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const DEFAULT_OUT_DIR = 'out';
const ARGS = process.argv.slice(2);

// Parse arguments
let customOutDir = null;
let mode = 'incremental'; // default: incremental

for (let i = 0; i < ARGS.length; i++) {
  if (ARGS[i] === '--out-dir' && ARGS[i + 1]) {
    customOutDir = ARGS[i + 1];
    i++;
  } else if (ARGS[i] === '--mode' && ARGS[i + 1]) {
    mode = ARGS[i + 1];
    i++;
  }
}

const ROOT_DIR = process.cwd();
// If customOutDir is absolute, use it, otherwise resolve relative to ROOT_DIR
const OUT_DIR = customOutDir 
  ? (path.isAbsolute(customOutDir) ? customOutDir : path.resolve(ROOT_DIR, customOutDir))
  : path.join(ROOT_DIR, DEFAULT_OUT_DIR);
const NEXT_CACHE_DIR = path.join(ROOT_DIR, '.next');
const DEFAULT_NEXT_OUT = path.join(ROOT_DIR, 'out');

console.log('========================================');
console.log('      Static Export Tool v1.0           ');
console.log('========================================');
console.log(`Mode: ${mode}`);
console.log(`Target Output Directory: ${OUT_DIR}`);
console.log(`Root Directory: ${ROOT_DIR}`);
console.log('----------------------------------------');

// 1. Handle Full Mode (Clean)
if (mode === 'full') {
  console.log('[1/4] Full mode enabled. Cleaning cache and output directories...');
  
  if (fs.existsSync(NEXT_CACHE_DIR)) {
    console.log(`  - Removing ${NEXT_CACHE_DIR}`);
    try {
      fs.rmSync(NEXT_CACHE_DIR, { recursive: true, force: true });
    } catch (e) {
      console.warn(`  ! Warning: Could not remove .next cache: ${e.message}`);
    }
  }
  
  // Clean target output dir if it exists
  if (fs.existsSync(OUT_DIR)) {
    console.log(`  - Removing ${OUT_DIR}`);
    try {
      fs.rmSync(OUT_DIR, { recursive: true, force: true });
    } catch (e) {
        console.warn(`  ! Warning: Could not remove output dir: ${e.message}`);
    }
  }
  
  // Also clean default 'out' if it's different and exists, to avoid confusion
  if (OUT_DIR !== DEFAULT_NEXT_OUT && fs.existsSync(DEFAULT_NEXT_OUT)) {
      try {
        fs.rmSync(DEFAULT_NEXT_OUT, { recursive: true, force: true });
      } catch (e) {}
  }
} else {
    console.log('[1/4] Incremental mode. Keeping cache.');
}

// 2. Run Build
console.log('[2/4] Running Next.js Build...');
try {
  // Use npx to ensure we use local next version
  execSync('npx next build', { stdio: 'inherit', cwd: ROOT_DIR });
} catch (error) {
  console.error('\n❌ Build failed!');
  process.exit(1);
}

// 3. Handle Output Directory Move
console.log('[3/4] Processing Output Directory...');
if (OUT_DIR !== DEFAULT_NEXT_OUT) {
    if (fs.existsSync(DEFAULT_NEXT_OUT)) {
        console.log(`  - Moving build output from 'out' to '${customOutDir}'...`);
        
        // Ensure parent dir exists
        const parentDir = path.dirname(OUT_DIR);
        if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir, { recursive: true });
        }

        // If target exists (e.g. from incremental build), we might need to merge or overwrite.
        // For simplicity, we remove target and move. 
        // In incremental mode, Next.js updates 'out'. If we moved 'out' previously, 'out' is fresh.
        // So we just move the fresh 'out' to the target location.
        
        if (fs.existsSync(OUT_DIR)) {
             fs.rmSync(OUT_DIR, { recursive: true, force: true });
        }
        
        fs.renameSync(DEFAULT_NEXT_OUT, OUT_DIR);
    } else {
        console.error(`❌ Error: Default output directory 'out' not found. Build might have failed or configured differently.`);
        process.exit(1);
    }
} else {
    console.log('  - Output directory is default (out). No move required.');
}

// 4. Generate Report
console.log('[4/4] Generating Export Report...');
generateReport(OUT_DIR);

function generateReport(dir) {
    const report = {
        timestamp: new Date().toISOString(),
        mode,
        outputDirectory: dir,
        success: true,
        summary: {
            totalFiles: 0,
            totalSizeBytes: 0,
            totalSizeFormatted: '',
            byType: {}
        },
        files: []
    };

    try {
        if (!fs.existsSync(dir)) {
            throw new Error(`Directory ${dir} does not exist`);
        }

        function scan(directory) {
            const items = fs.readdirSync(directory);
            for (const item of items) {
                const fullPath = path.join(directory, item);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    scan(fullPath);
                } else {
                    const ext = path.extname(item).toLowerCase() || 'no-ext';
                    const relativePath = path.relative(dir, fullPath);
                    
                    // Add to files list (optional: might be too large for huge projects, but fine here)
                    report.files.push({
                        path: relativePath.replace(/\\/g, '/'), // normalize separators
                        size: stat.size,
                        type: ext
                    });

                    report.summary.totalFiles++;
                    report.summary.totalSizeBytes += stat.size;
                    report.summary.byType[ext] = (report.summary.byType[ext] || 0) + 1;
                }
            }
        }

        scan(dir);

        // Format size
        report.summary.totalSizeFormatted = (report.summary.totalSizeBytes / 1024 / 1024).toFixed(2) + ' MB';

        // Write report
        const reportPath = path.join(dir, 'export_report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('----------------------------------------');
        console.log('✅ Export Completed Successfully!');
        console.log(`   Total Files: ${report.summary.totalFiles}`);
        console.log(`   Total Size:  ${report.summary.totalSizeFormatted}`);
        console.log(`   Report:      ${reportPath}`);
        console.log('----------------------------------------');

    } catch (e) {
        console.error(`❌ Failed to generate report: ${e.message}`);
        // Don't fail the whole process just for report
    }
}
