#!/usr/bin/env node
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs-extra');
const chalk = require('chalk');
const argv = require('yargs');
const updateNotifier = require('update-notifier');
const defaultConfig = require('./config');
const install = require('./install');
const rntsPkg = require('../package.json');

const { log } = console;

const currentPath = process.cwd();
const jsonOptions = {
  spaces: 2,
};
const buildTs = {
  'build:ts': 'concurrently -r \"tsc -w\" node_modules/react-native/local-cli/cli.js start',
};

const configure = async () => {
  const filename = 'tsconfig.json';

  log(chalk.yellow(`Configuring ${chalk.underline(filename)}...`));

  await fs.readFile(
    path.resolve(currentPath, filename),
    { encoding: 'utf8' },
    async (err, str) => {
      if (err) {
        await fs.outputJson(
          path.resolve(currentPath, filename),
          defaultConfig,
          jsonOptions
        );
      } else {
        try {
          const json = JSON.parse(str);

          if (typeof json !== 'object') {
            throw new Error(`invalid ${filename}`);
          }

          if (!json.compilerOptions) {
            await fs.outputJson(
              path.resolve(currentPath, filename),
              {
                ...json,
                compilerOptions: {
                  rootDir: defaultConfig.compilerOptions.rootDir,
                  outDir: defaultConfig.compilerOptions.outDir,
                },
              },
              jsonOptions
            );
          } else {
            await fs.outputJson(
              path.resolve(currentPath, filename),
              {
                ...json,
                compilerOptions: {
                  rootDir: defaultConfig.compilerOptions.rootDir,
                  outDir: defaultConfig.compilerOptions.outDir,
                  ...json.compilerOptions,
                },
              },
              jsonOptions
            );
          }
        } catch (e) {
          log(`invalid ${filename}`);
        }
      }
    }
  );
};

const editNpmScripts = async () => {
  const filename = 'package.json';
  const pkg = await fs.readJson(
    path.resolve(currentPath, filename),
    { encoding: 'utf8' },
  );

  log(chalk.red(`Editing ${chalk.underline('npm scripts')}...`));

  if (pkg.scripts) {
    const newPkg = {
      ...pkg,
      scripts: {
        ...pkg.scripts,
        ...buildTs,
      },
    };

    await fs.outputJson(
      path.resolve(currentPath, filename),
      newPkg,
      jsonOptions
    );
  } else {
    const newPkg = {
      ...pkg,
      scripts: {
        ...buildTs,
      },
    };

    await fs.outputJson(
      path.resolve(currentPath, filename),
      newPkg,
      jsonOptions
    );
  }
};

const getTsconfig = async () => {
  const tsconfig = await fs.readJson(
    path.resolve(currentPath, 'tsconfig.json'),
    { encoding: 'utf8' }
  );

  return tsconfig;
};

const changeImportFrom = async () => {
  const filename = 'index.js';

  log(chalk.magenta(`Change ${chalk.underline('import App from ...')}...`));

  const app = (await fs.readFile(
    path.resolve(currentPath, filename),
    { encoding: 'utf8' }
  )) || '';

  const { outDir } = (await getTsconfig()).compilerOptions;

  const newApp = app.replace(/^import App from '\.\/App';$/m, `import App from './${outDir}/App';`);

  await fs.writeFileSync(
    path.resolve(currentPath, filename),
    newApp,
    { encoding: 'utf8' }
  );
};

const moveApp = async () => {
  const { rootDir } = (await getTsconfig()).compilerOptions;

  log(chalk.blue(`Move ${chalk.underline('App.js')} into ${chalk.underline(rootDir)}...`));

  try {
    await fs.ensureDir(
      path.resolve(currentPath, 'src'),
      {
        recursive: true,
      }
    );

    await fs.move(
      path.resolve(currentPath, 'App.js'),
      path.resolve(currentPath, `${rootDir}/App.tsx`),
      {
        overwrite: true,
      }
    );
  } catch (e) {}
};

const compile = async () => {
  log(chalk.green(`Compile ${chalk.underline('source files')}...`));

  await spawn('tsc');
};

const installDependencies = async (packages) => {
  await configure();

  log(chalk.cyan(`Installing ${chalk.underline(packages.join(', '))}...`));

  install(
    packages,
    {
      cwd: currentPath,
      stdio: [0, 1, 2],
    },
    async function cb() {
      await editNpmScripts();
      await changeImportFrom();
      await moveApp();
      await compile();
    }
  );
};

const init = async () => {
  await installDependencies(['concurrently', 'typescript', '@types/react', '@types/react-native']);
};

const notifier = updateNotifier({ pkg: rntsPkg });
notifier.notify();

argv
  .version(rntsPkg.version)
  .command(['init', 'set', 'start', 'i', 's'], 'Set up the typescript configuration', {}, init)
  .demandCommand(1, 'Pass --help to see all available commands and options')
  .alias('v', 'version')
  .alias('h', 'help')
  .epilog('Written by wonism https://wonism.github.io')
  .argv;
