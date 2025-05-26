# Kit

A fast and efficient build tool for monorepos, designed to replace slow `yarn foreach` builds by utilizing a single Node.js runtime with intelligent dependency resolution.

## 🚀 Features

- **Fast Monorepo Builds**: Single Node.js process eliminates the overhead of spawning multiple runtimes
- **Dependency-Aware Building**: Automatically resolves and builds packages in the correct order based on internal dependencies
- **Modern Build Stack**: Powered by Rollup + esbuild for optimal performance and bundle size
- **TypeScript Support**: Built-in TypeScript compilation with declaration file generation
- **Watch Mode**: Hot reload during development with file change detection
- **i18n Automation**: Automatically extracts Vietnamese text and transforms it into i18n function calls
- **CDN Integration**: Upload static assets to Google Cloud Storage with cache busting
- **Release Management**: Generate release notes from git commits with JIRA ticket extraction
- **Multi-format Output**: Generates both CommonJS and ES modules

## 📦 Installation

```bash
npm install @teko/kit
```

## 🛠️ Usage

### Build Commands

```bash
# Build all packages in monorepo
kit build-packages

# Build a specific package
kit build-package <package-path>

# Watch all packages for changes
kit watch-packages

# Watch a specific package
kit watch-package <package-path>
```

### Development Workflow

```bash
# Start development with hot reload
kit watch-packages

# Build for production
NODE_ENV=production kit build-packages
```

### i18n Extraction

Automatically extract Vietnamese text and convert to i18n calls:

```bash
kit extract-lang <source-dir> <output-dir> <namespace>
```

**Before:**
```tsx
const message = "Xin chào thế giới";
const template = `Có ${count} sản phẩm`;
```

**After:**
```tsx
import { t } from './i18n';

const message = t("Xin chào thế giới");
const template = t("Có {{count}} sản phẩm", { count });
```

### CDN Upload

Upload static assets to Google Cloud Storage:

```bash
# Set credentials as environment variable
export GCS_CRED="<base64-encoded-credentials>"

# Upload directory to CDN
kit upload-cdn <source-dir> <destination-path>
```

### Release Notes

Generate release notes with JIRA integration:

```bash
# Compare branches and extract JIRA tickets
kit release-notes <target-branch> [source-branch]
```

### Cache Management

Clear CDN cache for multiple domains:

```bash
kit clear-cache
```

## 📁 Project Structure

Each package in your monorepo should have:

```
packages/
├── package-a/
│   ├── package.json
│   ├── rollup.config.js    # Build configuration
│   └── src/
└── package-b/
    ├── package.json
    ├── rollup.config.js
    └── src/
```

### Package Configuration

Create a `rollup.config.js` in each package:

```javascript
module.exports = {
  input: 'src/index.ts',
  // Additional Rollup options...
};
```

## 🔧 Configuration

### Environment Variables

- `NODE_ENV`: Set to `production` for optimized builds
- `GCS_CRED`: Base64-encoded Google Cloud Storage credentials for CDN upload

### Build Output

- **CommonJS**: `dist/[name].js`
- **ES Modules**: `dist/[name].es.js`
- **TypeScript Declarations**: `dist/[name].d.ts`

## 🏗️ How It Works

### Dependency Resolution

1. Scans all packages in the monorepo
2. Builds a dependency graph based on `@teko/*` internal dependencies
3. Uses Observer pattern to build packages in correct order
4. Leaf packages (no dependencies) are built first
5. Dependent packages are automatically built when their dependencies complete

### Build Pipeline

1. **TypeScript Compilation**: Generates declaration files
2. **Rollup Bundling**: Creates optimized bundles with esbuild
3. **Asset Processing**: Handles images and static files
4. **React Integration**: Auto-injects React imports for JSX

## 🎯 Performance Benefits

- **Single Runtime**: Eliminates Node.js startup overhead
- **Parallel Processing**: Builds independent packages simultaneously
- **Smart Caching**: Only rebuilds changed packages and their dependents
- **Fast Bundling**: esbuild provides near-instant compilation

## 📋 Requirements

- Node.js 14+
- TypeScript projects with `tsconfig.json`
- Rollup configuration file in each package

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT

## 🔗 Related Tools

- [Rollup](https://rollupjs.org/) - Module bundler
- [esbuild](https://esbuild.github.io/) - Fast JavaScript bundler
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript

---

Built with ❤️ for efficient monorepo development
