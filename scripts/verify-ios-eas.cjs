// Signing and archive checks must execute on the macOS worker that built the IPA.
if (process.env.EAS_BUILD_PLATFORM === 'ios') {
  require('node:child_process').execFileSync('python3', [
    require('node:path').join(__dirname, 'verify-ios-eas.py'),
  ], { stdio: 'inherit' });
}
