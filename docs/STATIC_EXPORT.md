# Static Export Guide

This project includes a dedicated tool for exporting the application as a static site. This allows you to host the application on any static file server (Nginx, Apache, Vercel, Netlify, S3, etc.) without requiring a Node.js runtime.

## Quick Start

To export the project, run the following command from the project root:

```bash
node scripts/export-static.js
```

By default, this will perform an **incremental export** to the `out/` directory.

## Export Script Usage

The script `scripts/export-static.js` supports several arguments:

```bash
node scripts/export-static.js [options]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--mode <full|incremental>` | **full**: Cleans cache and output directory before building. **incremental**: Retains cache for faster builds. | `incremental` |
| `--out-dir <path>` | Specifies a custom output directory. | `out` |

### Examples

**Full Clean Export:**
```bash
node scripts/export-static.js --mode full
```

**Export to Custom Directory:**
```bash
node scripts/export-static.js --out-dir ./dist
```

**Full Export to Custom Directory:**
```bash
node scripts/export-static.js --mode full --out-dir ./build
```

## Output Structure

The export process generates a static site structure in the output directory:

```
out/
  ├── _next/           # Static assets (JS, CSS, Media)
  ├── index.html       # Home page
  ├── login.html       # Login page
  ├── ...              # Other pages
  └── export_report.json # Export summary report
```

### Export Report

A JSON report (`export_report.json`) is generated after every export, containing:
- Timestamp
- Mode used
- Total file count and size
- List of all exported files

## Configuration

The static export is configured in `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // Required for static export if not using an image loader
  },
};
```

## Important Considerations & Troubleshooting

### 1. Server Actions
Next.js Static Export **does not support Server Actions** (`use server`).
All server-side logic (database calls, cookie setting, etc.) has been refactored to Client-Side API calls.
- **Authentication**: Tokens are stored in `localStorage` instead of HTTP-only cookies (for the static frontend).
- **API Calls**: The application communicates with the external API (`dataapi.aipopshort.com`) directly from the browser.

### 2. Dynamic Routes
Dynamic routes must be known at build time. If you add new dynamic routes, you may need to implement `generateStaticParams`.

### 3. Image Optimization
The default Next.js Image Optimization API requires a server. `images.unoptimized = true` is set to bypass this. Images will be served as-is.

### 4. 404 Page
A `404.html` is generated. Configure your web server to serve this file for missing resources.

## Testing

To verify the export integrity:

```bash
node scripts/verify-export.test.js
```

This script checks for the existence of key files and validates the export report.
