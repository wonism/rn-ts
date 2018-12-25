const { spawn } = require('child_process');
const dargs = require('dargs');

const noop = function () {};
const isWin = process.platform === 'win32';

const command = async (packages, opt, cb) => {
  if (typeof opt === 'function') {
    cb = opt;
    opt = {};
  } else {
    opt = opt || {};
  }

  cb = cb || noop;

  if (!Array.isArray(packages)) {
    throw new TypeError('packages should be an array');
  }

  if (packages.length === 0) {
    return process.nextTick(function () {
      noop();
    });
  }

  const npmCmd = isWin ? 'npm.cmd' : 'npm';
  const yarnCmd = isWin ? 'yarn.cmd' : 'yarn';

  const spawnArgs = {
    cwd: opt.cwd,
    env: opt.env || process.env,
    stdio: opt.stdio,
    shell: true,
  };

  try {
    const args = ['add', ...packages, '-D'];
    const proc = spawn(yarnCmd, args, spawnArgs);

    proc.on('close', cb);

    return proc;
  } catch (e) {
    const args = ['install', ...packages, '-D'];
    const proc = spawn(npmCmd, args, spawnArgs);

    proc.on('close', cb);

    return proc;
  }
}

module.exports = command;
