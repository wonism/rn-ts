#!/usr/bin/env node
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const argv = require('yargs');
const updateNotifier = require('update-notifier');
const defaultConfig = require('./config');
const install = require('./install');
const pkg = require('../package.json');

const { log } = console;

const currentPath = process.cwd();
const jsonOptions = {
  spaces: 2,
};
const buildTs = {
  'build:ts': 'concurrently -r \"tsc -w\" node_modules/react-native/local-cli/cli.js start',
};

const installDependencies = (packages) => {
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
    }
  );
};

const configure = async () => {
  const filename = 'tsconfig.json';

  log(chalk.yellow(`Configuring ${chalk.underline('tsconfig.json')}...`));

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
            throw new Error('invalid tsconfig.json');
          }

          if (!json.compilerOptions) {
            await fs.outputJson(
              path.resolve(currentPath, filename),
              {
                ...json,
                compilerOptions: {
                  outDir: defaultConfig.compilerOptions.outDir,
                },
              },
              jsonOptions
            );
          } else if (!json.compilerOptions.outDir) {
            await fs.outputJson(
              path.resolve(currentPath, filename),
              {
                ...json,
                compilerOptions: {
                  ...json.compilerOptions,
                  outDir: defaultConfig.compilerOptions.outDir,
                },
              },
              jsonOptions
            );
          }
        } catch (e) {
          log('invalid tsconfig.json');
        }
      }
    }
  );
};

const editNpmScripts = async () => {
  const { scripts } = pkg;

  log(chalk.red(`Editing ${chalk.underline('npm scripts')}...`));

  if (scripts) {
    const newPkg = {
      ...pkg,
      scripts: {
        ...scripts,
        ...buildTs,
      },
    };

    await fs.outputJson(
      path.resolve(currentPath, 'package.json'),
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
      path.resolve(currentPath, 'package.json'),
      newPkg,
      jsonOptions
    );
  }
};

const changeImportFrom = async () => {
  const filename = 'index.js';

  log(chalk.magenta(`Change ${chalk.underline('import App from ...')}`));

  const app = await fs.readFile(
    path.resolve(currentPath, filename),
    { encoding: 'utf8' }
  );

  const { outDir } = (await fs.readJson(
    path.resolve(currentPath, 'tsconfig.json'),
    { encoding: 'utf8' },
  )).compilerOptions;

  const newApp = app.replace(/^import App from '\.\/App';$/m, `import App from './${outDir}/App';`);

  await fs.writeFileSync(
    path.resolve(currentPath, filename),
    newApp,
    { encoding: 'utf8' }
  );
};

const init = async () => {
  await configure();
  await installDependencies(['concurrently', 'typescript']);
};

const notifier = updateNotifier({ pkg });
notifier.notify();

argv
  .version(pkg.version)
  .command(['init', 'set', 'start', 'i', 's'], 'Set up the typescript configuration', {}, init)
  .demandCommand(1, 'Pass --help to see all available commands and options')
  .alias('v', 'version')
  .alias('h', 'help')
  .epilog('Written by wonism https://wonism.github.io')
  .argv;
