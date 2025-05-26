#!/usr/bin/env node

const path = require('path');
const { buildPackages, buildPackage } = require('../src/cmd/build-package');
const { watchPackages, watchPackage } = require('../src/cmd/watch-package');
const { CDNUploader } = require('../src/cmd/upload-static-file');
const { releaseNotes } = require('../src/cmd/release-notes');
const { extractTranslation } = require('../src/cmd/i18n-extract');
const { clearCache } = require('../src/cmd/clear-cache');

async function main(argv) {
  const [cmdName, ...args] = argv;
  const cwd = process.cwd();

  const startTime = Date.now();
  process.on('beforeExit', () => {
    const elaps = Date.now() - startTime;
    const seconds = Math.ceil(elaps / 1000);
    const mili = elaps % 1000;
    console.log(`Execution in ${seconds > 0 ? `${seconds}s` : ''}${mili}ms`);
  });

  switch (cmdName) {
    case 'build-packages':
      const pkgRoot = path.join(cwd, 'packages');
      buildPackages(pkgRoot).then(code => {
        process.exit(code);
      })
      break;
    case 'build-package':
      buildPackage(path.join(cwd, args[0])).then((code) => {
        if (code !== 0) {
          console.log('Build package failed');
        }
      });
      break;
    case 'watch-packages':
      watchPackages(path.join(cwd, 'packages')).then((code) => {
        if (code === 1) {
          console.error('Error occurs when watching');
        }
      });
      break;
    case 'watch-package':
      watchPackage(path.join(cwd, args[0]));
      break;
    case 'upload-cdn':
      const credentialsContent = process.env.GCS_CRED;
      if (!credentialsContent) {
        console.log('Missing GCS_CRED');
        process.exit(1);
      }

      const credentials = JSON.parse(
        Buffer.from(credentialsContent, 'base64').toString('ascii'),
      );

      const [dir, basePath] = args;
      const uploader = new CDNUploader(credentials, () => process.exit(1));
      uploader.upload(path.join(process.cwd(), dir), basePath);
      break;
    case 'release-notes':
      releaseNotes(args);
      break;
    case 'extract-lang':
      extractTranslation(args);
      break;
    case 'clear-cache':
      clearCache();
      break;
    default:
      console.log('build-packages [root of packages]');
      console.log('build-package [root of package]');
      console.log('upload-cdn [source dir] [destination path]');
      console.log('release-notes [dest branch] [src branch, default `master`]');
      console.log('extract-lang [source dir] [dist dir] [lang dir]');
      console.log('clear-cache');
  }
}

const argv = process.argv.slice(2);
main(argv);
