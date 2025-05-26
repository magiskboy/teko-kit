const path = require('path');
const rollup = require('rollup');
const resolve = require('rollup-plugin-node-resolve');
const peerDepsExternal = require('rollup-plugin-peer-deps-external');
const esbuild = require('rollup-plugin-esbuild');
const ts = require('typescript');
const inject = require('@rollup/plugin-inject');
const image = require('@rollup/plugin-image');
const url = require('@rollup/plugin-url');

const {
  STATIC_TEMPORARY_DIRECTORY,
  CDN_STATIC_PATH,
  DEFAULT_PACKAGE_OUTPUT,
} = require('./constants');

const extensions = ['.js', '.jsx', '.ts', '.tsx'];

// external and globals
// are required for 'umd' output
// which has not been tested.
const external = (id) =>
  !id.startsWith('.') &&
  !id.startsWith(process.platform === 'win32' ? path.resolve('/') : '/');

const isProduction = process.env.NODE_ENV === 'production';

class PackageBuilder {
  /**
   * @param {string} root
   * @param {import('rollup').RollupOptions} options
   */
  constructor(root, options) {
    const outdir = path.join(root, DEFAULT_PACKAGE_OUTPUT);

    if (typeof options.input === 'string') {
      options.input = path.join(root, options.input);
    } else {
      options.input = options.input.map((p) => path.join(root, p));
    }

    if (!options.external) {
      options.external = external;
    }

    options.plugins = (options.plugins ?? []).concat(
      peerDepsExternal(),
      resolve({ extensions }),
      esbuild.default({
        exclude: 'node_modules/*',
      }),
      inject({
        include: /\.tsx$/,
        modules: {
          React: 'react',
        },
      }),
      TypescriptPlugin({
        root,
        out: outdir,
      }),
      isProduction
        ? url({
            limit: 0,
            publicPath: CDN_STATIC_PATH,
            destDir: STATIC_TEMPORARY_DIRECTORY,
            emitFiles: true,
          })
        : image(),
    );

    if (!options.output) {
      options.output = [
        {
          format: 'cjs',
          dir: outdir,
          entryFileNames: '[name].js',
          preserveModules: true,
        },
        {
          format: 'es',
          dir: outdir,
          entryFileNames: '[name].es.js',
          preserveModules: true,
        },
      ];
    }

    options.onwarn = () => {};

    options.watch = {
      buildDelay: 300,
    };

    this.options = options;
    this.root = root;
  }

  async build() {
    const builder = await rollup.rollup(this.options);
    const outputOptions = Array.isArray(this.options.output)
      ? this.options.output
      : [this.options.output];
    await Promise.all(outputOptions.map(builder.write));
    await builder.close();
  }

  /**
   * @param {string} pkgName
   */
  async watch(pkgName) {
    const watcher = rollup.watch(this.options);

    watcher.on('change', (id, { event }) => {
      const filename = id.replace(`${this.root}/`, '');
      console.log(`[${pkgName}] [${event}] ${filename}`);
    });

    return new Promise((done) => {
      watcher.on('close', done);
    });
  }
}

/**
 * @param {object} opt
 * @param {string} opt.root
 * @param {string} opt.out
 */
function TypescriptPlugin(opt) {
  // ref: https://gist.github.com/jeremyben/4de4fdc40175d0f76892209e00ece98f
  function build(override) {
    const configFile = ts.findConfigFile(
      opt.root,
      ts.sys.fileExists,
      'tsconfig.json',
    );
    if (!configFile) {
      throw Error('tsconfig.json not found');
    }
    const { config } = ts.readConfigFile(configFile, ts.sys.readFile);

    // override
    config.compilerOptions = Object.assign(
      {},
      config.compilerOptions,
      override.compilerOptions,
    );
    if (override.include) config.include = override.include;
    if (override.exclude) config.exclude = override.exclude;
    if (override.files) config.files = override.files;
    if (override.extends) config.files = override.extends;

    const { options, fileNames, errors } = ts.parseJsonConfigFileContent(
      config,
      ts.sys,
      opt.root,
    );

    const program = ts.createProgram({
      options,
      rootNames: fileNames,
      configFileParsingDiagnostics: errors,
    });

    const { diagnostics, emitSkipped } = program.emit();

    const allDiagnostics = ts
      .getPreEmitDiagnostics(program)
      .concat(diagnostics, errors);

    if (allDiagnostics.length) {
      const formatHost = {
        getCanonicalFileName: (path) => path,
        getCurrentDirectory: ts.sys.getCurrentDirectory,
        getNewLine: () => ts.sys.newLine,
      };
      const message = ts.formatDiagnosticsWithColorAndContext(
        allDiagnostics,
        formatHost,
      );
      if (options.noEmitOnError) {
        console.error(message);
      }
    }

    if (
      emitSkipped ||
      (options.noEmitOnError &&
        allDiagnostics.some(
          (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
        ))
    ) {
      console.warn('\x1b[41m', 'Có lỗi xảy ra khi build package', opt.root);
      process.exit(1);
    }
  }
  return {
    name: 'TypescriptPlugin',

    /**
     * @param {import('rollup').InputOptions}
     */
    buildStart(option) {
      let input = option.input;
      if (typeof input === 'string') {
        input = [input];
      }

      build({
        compilerOptions: {
          noEmit: false,
        },
      });
    },
  };
}

module.exports = {
  PackageBuilder,
};
