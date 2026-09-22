const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const code = fs.readFileSync(path.join(__dirname, 'prepare-local-apk.cjs'), 'utf8');
const root = path.resolve(__dirname, '..');
const target = path.join(root, 'artifacts/b');
const jdk = 'C:/Program Files/Android/Android Studio/jbr/release';
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
// The actual helper executes against an in-memory filesystem and fake Git/toolchain.
// No active checkout, cache, credentials, package manager or compiler is accessed.
function fixture() {
  const source = {
    'app.json': JSON.stringify({expo:{version:'1.0.0',android:{versionCode:1},ios:{x:1},icon:'./assets/icon.png'}}, null, 2)+'\n',
    'package.json':'{\n  "version": "1.0.0",\n  "dependencies": {"example":"1.0.0"}\n}\n',
    'package-lock.json':'{\n  "lockfileVersion":3\n}\n',
    '.npmrc':'audit=false\n',
    'app.config.js':'module.exports = {};\n',
    'advertising.config.json':'{\n "production":true\n}\n',
    'plugins/demo.js':'module.exports = 1;\n',
    'modules/demo/Main.kt':'class Demo {\n}\n',
    'patches/demo.patch':'--- before\n+++ after\n',
    'assets/icon.png':Buffer.from([0xff, 13, 10, 0x80]),
    'screen.tsx':'export const title = "hello";\n'
  };
  const names=Object.keys(source).sort();
  const files=new Map();
  const key=p=>path.resolve(p);
  const put=(p,b)=>files.set(key(p),Buffer.isBuffer(b)?Buffer.from(b):Buffer.from(b));
  for(const [n,b] of Object.entries(source)) put(path.join(root,n),b);
  put(jdk,'fixture-jdk');
  const get=p=>{const b=files.get(key(p)); assert.ok(b, 'Unexpected read: '+p); return Buffer.from(b);};
  const exists=p=>files.has(key(p)) || [...files.keys()].some(n=>n.startsWith(key(p)+path.sep));
  const fakeFs={
    existsSync:exists, lstatSync:()=>({isSymbolicLink:()=>false}), mkdirSync:()=>{},
    readFileSync:(p,encoding)=>encoding?get(p).toString(encoding):get(p),
    writeFileSync:put, unlinkSync:p=>files.delete(key(p)),
    readdirSync:(p,options)=>options?.withFileTypes?[]:[...files.keys()].filter(n=>path.dirname(n)===key(p)).map(n=>path.basename(n))
  };
  const state=()=>JSON.parse(get(path.join(target,'.source-state.json')));
  const plan=()=>JSON.parse(get(path.join(target,'.source-plan.json')));
  const run=(phase='prepare',env={})=>{
    const exit={};
    const fakeProcess={argv:['node','prepare',phase],version:'v22.0.0',env:{LEDPOP_AD_PROFILE:'production',...env},exit:n=>{assert.equal(n,0);throw exit;}};
    const fakeGit=(exe,args)=>{
      assert.equal(exe,'git'); const command=args[2];
      if(command==='ls-files'||command==='ls-tree') return names.join('\0')+'\0';
      if(command==='rev-parse') return 'a'.repeat(40)+'\n';
      if(command==='status') return '';
      throw Error('Unexpected command '+command);
    };
    try {vm.runInNewContext(code,{__dirname,Buffer,process:fakeProcess,console:{log(){}},require:n=>{
      if(n==='node:fs')return fakeFs;
      if(n==='node:path')return path;
      if(n==='node:crypto')return crypto;
      if(n==='node:child_process')return {execFileSync:fakeGit};
      throw Error('Unexpected module '+n);
    }});}catch(e){if(e!==exit)throw e;}
    return plan();
  };
  const ready=()=>{run();put(path.join(target,'node_modules/.package-lock.json'),'{}');put(path.join(target,'android/app/build.gradle'),'fixture native');run('installed');run('native-ready');};
  const legacy=()=>{
    const dependency=['package.json','package-lock.json','.npmrc','patches/demo.patch'];
    const native=[...dependency,'app.json','advertising.config.json','app.config.js','plugins/demo.js','modules/demo/Main.kt','assets/icon.png'];
    const digest=(list,nativeConfig)=>sha(JSON.stringify([...new Set(list)].sort().map(n=>{
      let b=get(path.join(target,n));
      if(n==='app.json') {const app=JSON.parse(b);if(nativeConfig){delete app.expo.version;delete app.expo.android.versionCode;delete app.expo.ios;delete app.expo.web;}b=Buffer.from(JSON.stringify(app));}
      return [n,sha(b)];
    })));
    const old=state(); delete old.dependencyHashSchema; old.dependencyHash=digest(dependency,false);
    old.nativeHashSchema=2;
    const environment=sha(JSON.stringify([]));
    const toolchain=sha(JSON.stringify(['v22.0.0',[jdk,sha('fixture-jdk')]]));
    old.nativeHash=sha(digest(native,true)+environment+toolchain+'production');
    put(path.join(target,'.source-state.json'),JSON.stringify(old));
  };
  const priorSchema=()=>{
    const dependency=['package.json','package-lock.json','.npmrc','patches/demo.patch'];
    const native=[...dependency,'app.json','advertising.config.json','app.config.js','plugins/demo.js','modules/demo/Main.kt','assets/icon.png'];
    const digest=(list,nativeConfig)=>sha(JSON.stringify([...new Set(list)].sort().map(n=>{
      let b=get(path.join(target,n));
      if(n==='app.json') {const app=JSON.parse(b);if(nativeConfig){delete app.expo.version;delete app.expo.android.versionCode;delete app.expo.ios;delete app.expo.web;}b=Buffer.from(JSON.stringify(app));}
      return [n,sha(b)];
    })));
    const previous=state();previous.dependencyHashSchema=1;previous.dependencyHash=digest(dependency,false);previous.nativeHashSchema=3;
    const environment=sha(JSON.stringify([]));
    const toolchain=sha(JSON.stringify(['v22.0.0',[jdk,sha('fixture-jdk')]]));
    previous.nativeHash=sha(digest(native,true)+environment+toolchain+'production');
    put(path.join(target,'.source-state.json'),JSON.stringify(previous));
  };
  return {names,put,get,run,ready,legacy,priorSchema,state,plan,remove:name=>{names.splice(names.indexOf(name),1);files.delete(key(path.join(root,name)));},change:(name,text)=>put(path.join(root,name),text),target:p=>path.join(target,p)};
}
function flags(plan,install,native){assert.equal(plan.installRequired,install);assert.equal(plan.nativeRequired,native);}
test('fresh preparation requires both phases; a successful unchanged fixture reuses both',()=>{const f=fixture();flags(f.run(),true,true);f.ready();flags(f.run(),false,false);});
for(const legacy of [false,true]) test(`LF/CRLF reuse and byte-exact provenance (legacy=${legacy})`,()=>{
  const f=fixture(); f.ready(); if(legacy)f.legacy();
  for(const n of f.names.filter(n=>!n.startsWith('patches/')&&!n.endsWith('.png'))){f.change(n,f.get(path.join(root,n)).toString().replace(/\n/g,'\r\n'));}
  flags(f.run(),false,false);
  const inventory=JSON.parse(f.get(f.target('source-inputs.json')));
  assert.equal(inventory.files['package.json'],sha(f.get(path.join(root,'package.json'))));
  assert.deepEqual(f.get(f.target('package.json')),f.get(path.join(root,'package.json')));
  assert.equal(f.state().dependencyHashSchema,2);assert.equal(f.state().nativeHashSchema,4);
  flags(f.run(),false,false);
});
for(const [name,value,install,native] of [
 ['package.json','{"dependencies":{"example":"2.0.0"}}',true,true],
 ['package-lock.json','{"lockfileVersion":2}',true,true],
 ['.npmrc','audit=true\n',true,true],
 ['plugins/demo.js','module.exports = 2;\n',false,true],
 ['modules/demo/Main.kt','class Changed {}\n',false,true],
 ['screen.tsx','export const title = "changed";\n',false,false],
 ['patches/demo.patch','--- before\r\n+++ after\r\n',true,true],
 ['assets/icon.png',Buffer.from([0xff,10,0x80]),false,true]
])test(`real input change: ${name}`,()=>{const f=fixture();f.ready();f.change(name,value);flags(f.run(),install,native);});
test('failed install/native stages are never promoted as success',()=>{const f=fixture();f.ready();f.run('install-start');f.run('native-start');flags(f.run(),true,true);});
test('native-only failure preserves successful dependencies',()=>{const f=fixture();f.ready();f.run('native-start');flags(f.run(),false,true);});
test('legacy snapshot mismatch cannot acquire a successful normalized stamp',()=>{const f=fixture();f.ready();f.legacy();f.put(f.target('package.json'),'{}');flags(f.run(),true,true);});
test('legacy environment drift invalidates native migration',()=>{const f=fixture();f.ready();f.legacy();f.put(f.target('.env.local'),'FLAG=changed');flags(f.run(),false,true);});
test('toolchain drift invalidates legacy native migration',()=>{const f=fixture();f.ready();f.legacy();f.put(jdk,'changed-jdk');flags(f.run(),false,true);});
test('unknown schemas cannot be reused',()=>{const f=fixture();f.ready();const s=f.state();s.dependencyHashSchema=999;s.nativeHashSchema=999;f.put(f.target('.source-state.json'),JSON.stringify(s));flags(f.run(),true,true);});
test('ad profile changes require native preparation',()=>{const f=fixture();f.ready();flags(f.run('prepare',{LEDPOP_AD_PROFILE:'test'}),false,true);});
test('Android version-only changes preserve native reuse',()=>{const f=fixture();f.ready();const app=JSON.parse(f.get(path.join(root,'app.json')));app.expo.version='1.0.1';app.expo.android.versionCode=2;f.change('app.json',JSON.stringify(app));flags(f.run(),false,false);assert.equal(f.plan().versionCode,2);});
test('root package metadata version-only changes preserve dependency and native reuse',()=>{const f=fixture();f.ready();const pkg=JSON.parse(f.get(path.join(root,'package.json')));pkg.version='1.0.1';f.change('package.json',JSON.stringify(pkg));flags(f.run(),false,false);});
test('schema 1 and 3 migrate after a root package version-only change',()=>{const f=fixture();f.ready();f.priorSchema();const pkg=JSON.parse(f.get(path.join(root,'package.json')));pkg.version='1.0.1';f.change('package.json',JSON.stringify(pkg));flags(f.run(),false,false);assert.equal(f.state().dependencyHashSchema,2);assert.equal(f.state().nativeHashSchema,4);});
test('invalid UTF-8 source is not decoded and normalized',()=>{const f=fixture();f.change('plugins/demo.js',Buffer.from([255,13,10]));f.ready();f.change('plugins/demo.js',Buffer.from([255,10]));flags(f.run(),false,true);});

test('CRLF legacy snapshot migrates to LF source without rebuilding',()=>{
 const f=fixture();
 const names=f.names.filter(n=>!n.startsWith('patches/')&&!n.endsWith('.png'));
 for(const n of names) f.change(n,f.get(path.join(root,n)).toString().replace(/\n/g,'\r\n'));
 f.ready();f.legacy();
 for(const n of names) f.change(n,f.get(path.join(root,n)).toString().replace(/\r\n/g,'\n'));
 flags(f.run(),false,false);
});
for(const [name,install] of [['plugins/demo.js',false],['patches/demo.patch',true]])test(`deleted input still invalidates: ${name}`,()=>{
 const f=fixture();f.ready();f.remove(name);flags(f.run(),install,true);assert.ok(f.plan().removed.includes(name));
});
