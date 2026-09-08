const { spawn } = require('node:child_process');
const cli = require.resolve('expo/bin/cli');
const child = spawn(process.execPath, [cli, 'start', '--web'], {
  stdio: 'inherit', env: { ...process.env, EXPO_PUBLIC_WEB_AD_DIAGNOSTICS: '1' },
});
child.on('error', error => { console.error(error); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code === null ? 1 : code; });
