// Called by the signing-verified wrapper. Never runs a build or downloads credentials.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const target = path.join(root, 'artifacts', 'b');
const statePath = path.join(target, '.source-state.json');
const planPath = path.join(target, '.source-plan.json');
const phase = process.argv[2];
const nativeHashSchema = 2;
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const git = args => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
// Only generated directories listed in .gitignore are excluded; user source/assets are inventoried.
const excluded = name => /^(?:artifacts|node_modules|android|ios|\.git|\.expo|dist|web-build|credentials)(?:\/|$)/.test(name) ||
  /(?:^|\/)(?:\.env(?:\..*)?|credentials\.json)$/.test(name) && name !== '.env.example' ||
  /\.(?:jks|keystore|p12|p8|pem|key|mobileprovision)$/.test(name);
function safePath(base, name) {
  if (!name || path.isAbsolute(name) || name.includes('\\') || name.split('/').some(p => p === '..' || p === '.')) throw Error('Invalid source path');
  const full = path.resolve(base, name);
  if (!full.startsWith(base + path.sep) || excluded(name)) throw Error('Source path outside managed scope');
  let cursor = base;
  for (const part of name.split('/')) {
    cursor = path.join(cursor, part);
    if (fs.existsSync(cursor) && fs.lstatSync(cursor).isSymbolicLink()) throw Error('Linked paths cannot be synchronized');
  }
  return full;
}
for (const dir of [root, path.join(root, 'artifacts'), target]) {
  if (fs.existsSync(dir) && fs.lstatSync(dir).isSymbolicLink()) throw Error('Build root must not be a link');
}
if (phase !== 'prepare') {
  if (!['install-start', 'native-start', 'installed', 'native-ready'].includes(phase)) throw Error('Unknown preparation phase');
  const state = readJson(statePath);
  const plan = readJson(planPath);
  if (phase === 'install-start') state.dependencyHash = null;
  else if (phase === 'native-start') {
    state.nativeHash = null;
    state.nativeHashSchema = null;
    state.adProfile = null;
  }
  else if (phase === 'installed') state.dependencyHash = plan.dependencyHash;
  else {
    state.nativeHash = plan.nativeHash;
    state.nativeHashSchema = plan.nativeHashSchema;
    state.adProfile = plan.adProfile;
  }
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  process.exit(0);
}
fs.mkdirSync(target, { recursive: true });
const requestedRevision = process.env.LEDPOP_BUILD_REVISION;
const sourceRevision = requestedRevision ? git(['rev-parse', '--verify', requestedRevision + '^{commit}']).trim() : null;
const sourceOverrides = JSON.parse(process.env.LEDPOP_BUILD_OVERRIDES || '[]');
if (!Array.isArray(sourceOverrides) || sourceOverrides.some(n => typeof n !== 'string')) throw Error('Invalid source overrides');
sourceOverrides.forEach(n => safePath(root, n));
const sourceBytes = name => sourceRevision && !sourceOverrides.includes(name)
  ? execFileSync('git', ['-C', root, 'show', sourceRevision + ':' + name], { maxBuffer: 64 * 1024 * 1024 })
  : fs.readFileSync(safePath(root, name));
const files = [...new Set(git(sourceRevision
  ? ['ls-tree', '-r', '--name-only', '-z', sourceRevision]
  : ['ls-files', '--cached', '--others', '--exclude-standard', '-z']).split('\0'))]
  .filter(name => name && !excluded(name) && (sourceRevision || fs.existsSync(safePath(root, name)))).sort();
const app = JSON.parse(sourceBytes('app.json').toString('utf8'));
function androidNativeAppConfig(value) {
  const normalized = JSON.parse(JSON.stringify(value));
  delete normalized.expo.version;
  if (normalized.expo.android) delete normalized.expo.android.versionCode;
  delete normalized.expo.ios;
  delete normalized.expo.web;
  return normalized;
}
const oldAppPath = path.join(target, 'app.json');
const versionCode = process.argv[3] ? Number(process.argv[3]) : app.expo.android.versionCode ??
  (fs.existsSync(oldAppPath) ? readJson(oldAppPath).expo.android.versionCode : undefined);
if (!Number.isSafeInteger(versionCode) || versionCode < 1) throw Error('Supply -VersionCode for the first local build');
app.expo.android.versionCode = versionCode;
const contents = new Map(files.map(name => [name, name === 'app.json'
  ? Buffer.from(JSON.stringify(app, null, 2) + '\n') : sourceBytes(name)]));
const dependencyNames = ['package.json', 'package-lock.json', '.npmrc', ...files.filter(n => n.startsWith('patches/'))];
const nativeAssets = new Set();
function collectAssets(value) {
  if (typeof value === 'string' && value.startsWith('./assets/')) nativeAssets.add(value.slice(2));
  else if (Array.isArray(value)) value.forEach(collectAssets);
  else if (value && typeof value === 'object') Object.values(value).forEach(collectAssets);
}
collectAssets(androidNativeAppConfig(app));
if (fs.existsSync(oldAppPath)) collectAssets(androidNativeAppConfig(readJson(oldAppPath)));
const nativeFile = name => /^(?:app\.config\.|react-native\.config\.|expo-module\.config\.)/.test(name) ||
  /^(?:plugins|modules|patches)\//.test(name) || nativeAssets.has(name);
const state = fs.existsSync(statePath) ? readJson(statePath) : null;
let previousFiles = state?.files;
let bootstrap = false;
if (!previousFiles) {
  const revisionPath = path.join(target, 'source-revision.txt');
  if (fs.existsSync(revisionPath)) {
    const revision = fs.readFileSync(revisionPath, 'utf8').trim();
    if (!/^[a-f0-9]{40}$/.test(revision)) throw Error('Invalid previous source revision');
    previousFiles = git(['ls-tree', '-r', '--name-only', '-z', revision]).split('\0').filter(n => n && !excluded(n));
    const logPath = path.join(target, 'gradle-release.log');
    bootstrap = fs.existsSync(logPath) && /BUILD SUCCESSFUL/.test(fs.readFileSync(logPath, 'utf8'));
  } else {
    if (fs.existsSync(oldAppPath) || fs.existsSync(path.join(target, 'android'))) throw Error('Existing build lacks a source inventory');
    previousFiles = [];
  }
}
dependencyNames.push(...previousFiles.filter(n => n.startsWith('patches/')));
const nativeNames = [...new Set(['app.json', 'advertising.config.json', ...dependencyNames, ...files.filter(nativeFile), ...previousFiles.filter(nativeFile)])].sort();
// Config/plugin changes conservatively invalidate native output. Dynamic config may read any asset.
if (files.some(n => n.startsWith('app.config.'))) nativeNames.push(...files.filter(n => n.startsWith('assets/')));
function digest(names, fromSource, normalizeNativeConfig = false) {
  return hash(JSON.stringify([...new Set(names)].sort().map(name => {
    const file = safePath(target, name);
    let content = fromSource ? contents.get(name) : fs.existsSync(file) ? fs.readFileSync(file) : undefined;
    if (name === 'app.json' && content) {
      const parsed = JSON.parse(content.toString());
      content = Buffer.from(JSON.stringify(normalizeNativeConfig ? androidNativeAppConfig(parsed) : parsed));
    }
    return [name, content ? hash(content) : null];
  })));
}
const dependencyHash = digest(dependencyNames, true);
// Hash the preserved local environment without copying or logging values.
const envNames = fs.readdirSync(target).filter(n => /^\.env(?:\..*)?$/.test(n)).sort();
const environmentHash = hash(JSON.stringify(envNames.map(n => [n, hash(fs.readFileSync(path.join(target, n)))])));
const sdkRoot = 'C:/Users/ssong/AppData/Local/Android/Sdk';
const sdkMetadata = ['build-tools', 'platforms', 'ndk', 'cmake'].flatMap(group =>
  fs.readdirSync(path.join(sdkRoot, group), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(sdkRoot, group, entry.name, 'source.properties'))
).sort();
const toolchainHash = hash(JSON.stringify([
  process.version,
  ...['C:/Program Files/Android/Android Studio/jbr/release', ...sdkMetadata].map(file => {
    if (!fs.existsSync(file)) throw Error('Required local toolchain metadata is missing: ' + file);
    return [file, hash(fs.readFileSync(file))];
  }),
]));
const adProfile = process.env.LEDPOP_AD_PROFILE ?? 'production';
const nativeHash = hash(digest(nativeNames, true, true) + environmentHash + toolchainHash + adProfile);
const previousDependencyHash = state?.dependencyHash ?? (bootstrap ? digest(dependencyNames, false) : null);
const previousPlan = fs.existsSync(planPath) ? readJson(planPath) : null;
const recordedProfile = state?.adProfile ??
  (state?.nativeHash && previousPlan?.nativeHash === state.nativeHash ? previousPlan.adProfile : null);
let previousNativeHash = null;
if (state?.nativeHashSchema === nativeHashSchema && state?.nativeHash) {
  previousNativeHash = state.nativeHash;
} else if (state?.nativeHash && recordedProfile === adProfile && fs.existsSync(path.join(target, 'android', 'app', 'build.gradle'))) {
  // Migrate an old successful stamp by hashing the actual preserved Android inputs.
  previousNativeHash = hash(digest(nativeNames, false, true) + environmentHash + toolchainHash + adProfile);
}
const plan = {
  adProfile,
  revision: sourceRevision ?? git(['rev-parse', 'HEAD']).trim(),
  dirty: sourceRevision ? sourceOverrides.length > 0 : git(['status', '--porcelain', '-z']).length > 0,
  sourceOverrides,
  versionCode, dependencyHash, nativeHash, nativeHashSchema,
  installRequired: dependencyHash !== previousDependencyHash || !fs.existsSync(path.join(target, 'node_modules', '.package-lock.json')),
  nativeRequired: nativeHash !== previousNativeHash || !fs.existsSync(path.join(target, 'android', 'app', 'build.gradle')),
  changed: [], removed: [],
};
// Persist an inventory BEFORE mutation, retaining successful dependency/native stamps on failure.
fs.writeFileSync(statePath, JSON.stringify({ files: [...new Set([...previousFiles, ...files])], dependencyHash: previousDependencyHash, nativeHash: previousNativeHash, nativeHashSchema: previousNativeHash ? nativeHashSchema : null, adProfile: previousNativeHash ? adProfile : null }, null, 2));
for (const name of files) {
  const dest = safePath(target, name);
  const content = contents.get(name);
  if (fs.existsSync(dest) && hash(fs.readFileSync(dest)) === hash(content)) continue;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content);
  plan.changed.push(name);
}
for (const name of previousFiles) {
  if (contents.has(name)) continue;
  const dest = safePath(target, name);
  if (fs.existsSync(dest)) { fs.unlinkSync(dest); plan.removed.push(name); }
}
fs.writeFileSync(statePath, JSON.stringify({ files, dependencyHash: previousDependencyHash, nativeHash: previousNativeHash, nativeHashSchema: previousNativeHash ? nativeHashSchema : null, adProfile: previousNativeHash ? adProfile : null }, null, 2));
fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));
fs.writeFileSync(path.join(target, 'source-revision.txt'), plan.revision + '\n');
fs.writeFileSync(path.join(target, 'source-inputs.json'), JSON.stringify({ sourceOverrides: plan.sourceOverrides, adProfile: plan.adProfile, revision: plan.revision, dirty: plan.dirty, versionCode, files: Object.fromEntries([...contents].map(([n, b]) => [n, hash(b)])) }, null, 2));
console.log(JSON.stringify({ changed: plan.changed.length, removed: plan.removed.length, installRequired: plan.installRequired, nativeRequired: plan.nativeRequired, versionCode }));
