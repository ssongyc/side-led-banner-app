"""Verify and retain this EAS iOS build on its macOS worker; no store upload."""
import datetime
import hashlib
import json
import os
from pathlib import Path
import plistlib
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = Path.cwd()
OUT = ROOT / 'ios/build'
BUNDLE = 'com.sunnyinnolab.ledpop'
TEAM = 'GWBS3Q4W36'
CERT = '8C4C9DBF780896028CEF1040B259A72B48456BCAAE8A4C9EF9EEE74BE43B768B'
RECORD = {'status': 'failed', 'platform': 'ios', 'runtime': 'unverified',
          'buildId': os.environ.get('EAS_BUILD_ID'),
          'gitCommit': os.environ.get('EAS_BUILD_GIT_COMMIT_HASH'), 'completedChecks': []}

def require(value, message):
    if not value:
        raise RuntimeError(message)

def run(*args, cwd=None):
    result = subprocess.run(args, cwd=cwd, capture_output=True)
    if result.returncode:
        raise RuntimeError(Path(args[0]).name + ' failed: ' + result.stderr.decode(errors='replace')[:1600])
    return result.stdout

def digest(path):
    value = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            value.update(chunk)
    return value.hexdigest()

def uuids(binary):
    return set(re.findall(r'UUID: ([0-9A-Fa-f-]+)', run('xcrun', 'dwarfdump', '--uuid', str(binary)).decode()))

def verify_app(app, work):
    info = plistlib.loads((app / 'Info.plist').read_bytes())
    source = json.loads((ROOT / 'app.json').read_text())['expo']
    require(info['CFBundleIdentifier'] == BUNDLE == source['ios']['bundleIdentifier'], 'Bundle ID mismatch')
    require(info['CFBundleShortVersionString'] == source['version'], 'Marketing version mismatch')
    require(str(info['CFBundleVersion']) == source['ios']['buildNumber'], 'Build number mismatch')
    require(int(re.search(r'iphoneos(\d+)', info['DTSDKName']).group(1)) >= 26, 'iOS SDK below 26')
    require(info.get('ITSAppUsesNonExemptEncryption') is False, 'Export compliance value mismatch')
    require(info.get('GADApplicationIdentifier') == 'ca-app-pub-3506417530430977~1773312905', 'AdMob App ID mismatch')
    require(info.get('NSAppTransportSecurity', {}).get('NSAllowsArbitraryLoads') is not True, 'Arbitrary network loads enabled')
    for nested in app.rglob('*'):
        if nested.suffix in ('.framework', '.appex', '.dylib'):
            run('codesign', '--verify', '--strict', '--verbose=2', str(nested))
    run('codesign', '--verify', '--deep', '--strict', '--verbose=2', str(app))
    run('codesign', '-d', '--extract-certificates', str(app), cwd=work)
    require(digest(work / 'codesign0').upper() == CERT, 'Signer differs from approved certificate')
    run('openssl', 'x509', '-inform', 'DER', '-in', str(work / 'codesign0'), '-checkend', '0', '-noout')
    ent = plistlib.loads(run('codesign', '-d', '--entitlements', ':-', str(app)))
    require(ent.get('application-identifier') == TEAM + '.' + BUNDLE and
            ent.get('com.apple.developer.team-identifier') == TEAM and
            not ent.get('get-task-allow', False), 'Signed entitlements mismatch')
    profile = plistlib.loads(run('security', 'cms', '-D', '-i', str(app / 'embedded.mobileprovision')))
    require(profile['TeamIdentifier'] == [TEAM] and
            profile['Entitlements'].get('application-identifier') == TEAM + '.' + BUNDLE and
            not profile['Entitlements'].get('get-task-allow', False) and
            not profile.get('ProvisionedDevices') and not profile.get('ProvisionsAllDevices'), 'Store profile mismatch')
    require(profile['ExpirationDate'] > datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None) and
            CERT in [hashlib.sha256(c).hexdigest().upper() for c in profile['DeveloperCertificates']], 'Profile expired or signer mismatch')
    run('python3', str(ROOT / 'scripts/verify-ios-react-frameworks.py'), str(app), '--expected-bundle-id', BUNDLE)
    binary = app / info['CFBundleExecutable']
    require('arm64' in run('xcrun', 'lipo', '-archs', str(binary)).decode().split(), 'arm64 missing')
    return info, binary

try:
    require(sys.platform == 'darwin', 'This verifier requires the macOS build worker')
    OUT.mkdir(parents=True, exist_ok=True)
    ipas = list(OUT.glob('*.ipa'))
    require(len(ipas) == 1, 'Expected exactly one exported IPA')
    ipa = ipas[0]
    RECORD['ipaSha256'] = digest(ipa)
    with tempfile.TemporaryDirectory(prefix='ledpop-verification-') as temporary:
        work = Path(temporary)
        run('ditto', '-x', '-k', str(ipa), str(work))
        apps = list((work / 'Payload').glob('*.app'))
        require(len(apps) == 1, 'Expected exactly one application')
        app = apps[0]
        ipa_info = plistlib.loads((app / 'Info.plist').read_bytes())
        archives = []
        for archive in (Path.home() / 'Library/Developer/Xcode/Archives').glob('*/*.xcarchive'):
            for original in (archive / 'Products/Applications').glob('*.app'):
                data = plistlib.loads((original / 'Info.plist').read_bytes())
                if all(data.get(k) == ipa_info.get(k) for k in
                       ('CFBundleIdentifier', 'CFBundleShortVersionString', 'CFBundleVersion')):
                    archives.append((archive, original))
        require(len(archives) == 1, 'Expected one matching original Xcode archive')
        archive, original = archives[0]
        retained = OUT / 'LedPop.xcarchive.zip'
        require(not retained.exists(), 'Refusing to overwrite retained archive')
        # Preserve original output and dSYMs before any verifier can reject it.
        run('ditto', '-c', '-k', '--keepParent', str(archive), str(retained))
        RECORD['archiveSha256'] = digest(retained)
        if not list(OUT.glob('*.dSYM.zip')):
            require((archive / 'dSYMs').is_dir(), 'Original archive dSYMs missing')
            run('ditto', '-c', '-k', '--keepParent', str(archive / 'dSYMs'), str(OUT / 'LedPop.dSYM.zip'))
        for name, target in [('ipa-cert', app), ('archive-cert', original)]:
            cert_work = work / name
            cert_work.mkdir()
            info, binary = verify_app(target, cert_work)
            if name == 'ipa-cert':
                ipa_binary = binary
            else:
                require(uuids(binary) == uuids(ipa_binary) and uuids(binary), 'Archive/IPA UUID mismatch')
        RECORD['completedChecks'].extend(['identity-version-sdk', 'strict-signatures', 'signer-profile-entitlements',
                                          'react-dynamic-frameworks', 'original-archive-ipa-uuid'])
        symbols = work / 'symbols'
        for packed in OUT.glob('*.dSYM.zip'):
            run('ditto', '-x', '-k', str(packed), str(symbols))
        matching = list(symbols.glob('**/Contents/Resources/DWARF/' + info['CFBundleExecutable']))
        require(any(uuids(p) == uuids(ipa_binary) for p in matching), 'Matching app dSYM missing')
        config = json.loads((app / 'EXConstants.bundle/app.config').read_text())
        ads = config['extra']['advertising']
        expected = json.loads((ROOT / 'advertising.config.json').read_text())['production']
        require(ads == {'profile': 'production', **expected}, 'Packaged production ad configuration mismatch')
        require(os.environ.get('EXPO_PUBLIC_UMP_EEA_TEST_DEVICE') == 'disabled' and
                os.environ.get('EXPO_PUBLIC_WEB_AD_DIAGNOSTICS') == '0', 'QA flags enabled')
        require((app / 'main.jsbundle').stat().st_size > 0, 'Release JS missing')
        lock = ROOT / 'ios/Podfile.lock'
        pod_text = lock.read_text()
        for pod in ['RNGoogleMobileAds', 'Google-Mobile-Ads-SDK', 'GoogleUserMessagingPlatform', 'PlaybackTextLayer']:
            require(pod in pod_text, 'Missing native dependency: ' + pod)
        require(list(app.rglob('PrivacyInfo.xcprivacy')), 'No privacy manifests packaged')
        RECORD['completedChecks'].extend(['matching-dsym', 'production-ads-normal-ump-config', 'native-pods-resources'])
        RECORD.update(status='passed', version=info['CFBundleShortVersionString'], build=info['CFBundleVersion'],
                      certificateSha256=CERT, signature='passed', symbols='passed', ads='passed',
                      sdk=info['DTSDKName'], podLockSha256=digest(lock))
except Exception as error:
    RECORD['error'] = str(error) if isinstance(error, RuntimeError) else type(error).__name__
    raise
finally:
    OUT.mkdir(parents=True, exist_ok=True)
    RECORD['checkedAtUtc'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    (OUT / 'ios-verification.json').write_text(json.dumps(RECORD, indent=2) + '\n')
    print(json.dumps(RECORD))
