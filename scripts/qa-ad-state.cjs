const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function harness() {
  let now = 1_000_000, sequence = 0;
  const timers = new Map();
  const env = {
    Date: class extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } },
    setTimeout(fn, delay) { const id = ++sequence; timers.set(id, { at: now + delay, fn }); return id; },
    clearTimeout(id) { timers.delete(id); },
    __DEV__: false, console,
  };
  return {
    env, timers, now: () => now,
    advance(ms) { const end = now + ms; for (;;) { const next = [...timers].filter(([,t]) => t.at <= end).sort((a,b) => a[1].at-b[1].at)[0]; if (!next) break; timers.delete(next[0]); now = next[1].at; next[1].fn(); } now = end; },
    load(file, deps = {}) {
      const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
      const exports = {};
      vm.runInNewContext(code, { ...env, exports, require(id) { if (!(id in deps)) throw Error('Unmocked boundary: '+id); return deps[id]; } }, { filename: file });
      return exports;
    },
  };
}
const flush = async () => { for (let n=0;n<12;n++) await Promise.resolve(); };
function banner() { const h=harness(); return { ...h, api:h.load('ads/bannerState.ts'), token:Symbol('owner') }; }
function rewarded() {
  const h=harness(), ads=[], appListeners=new Set(); let rewards=0, shows=0, premium='free', prepare=async()=>{}, show=async()=>{};
  const app={currentState:'active',addEventListener(_name,fn){appListeners.add(fn);return {remove(){appListeners.delete(fn);}};}};
  const api=h.load('ads/rewardedState.ts',{
    './AdClient':{rewardedAdEvents:{loaded:'loaded',opened:'opened',earnedReward:'earned',closed:'closed',error:'error'},
      createNativeRewardedAd(){const handlers=new Map();const ad={loaded:false,load(){ad.loadTime=h.now();},addAdEventListener(name,fn){handlers.set(name,fn);return()=>handlers.delete(name);},emit(name){if(name==='loaded')ad.loaded=true;handlers.get(name)?.();},handlers};ads.push(ad);return ad;},
      beginRewardedPresentation:()=>prepare(),endRewardedPresentation:async()=>{},showRewardedAd:async ad=>{shows++;return show(ad);}},
    '@/ads/adConfiguration':{getAdConfiguration:()=>({rewarded:'test-boundary-only'})},
    '@/ads/initializeMobileAds':{initializeMobileAds:async()=>{},getMobileAdsState:()=> 'ready',retryMobileAdsInitialization(){}},
    '@/ads/adTrace':{recordAdEvent(){}},'@/utils/ApiClient':{getPremiumSnapshot:()=>({entitlement:premium})},
    'react-native':{AppState:app,Platform:{OS:'android'}},
  });
  api.subscribeRewardedState(()=>{},()=>rewards++);
  return {...h,api,ads,rewards:()=>rewards,shows:()=>shows,setPrepare(fn){prepare=fn;},setShow(fn){show=fn;},setPremium(v){premium=v;},background(){app.currentState='background';appListeners.forEach(fn=>fn('background'));}};
}

test('banner: 6/12 second retries, 10+60 second extra cycle, then stop',()=>{
 const {api:a,token:t,advance,now}=banner();a.claimBanner(t);a.requestBanner(t);
 for(let cycle=0;cycle<2;cycle++){
  for(let attempt=1;attempt<=3;attempt++){
   const s=a.getBannerState();assert.equal(s.attempt,cycle*3+attempt);assert.equal(s.phase,'loading');assert.equal(a.bannerFailed(t,s.requestId),true);
   assert.equal(a.bannerFailed(t,s.requestId),false);
   if(attempt<3){const delay=attempt===1?6000:12000;advance(delay-1);a.requestBanner(t);assert.equal(a.getBannerState().phase,'waiting');advance(1);a.requestBanner(t);}
  }
  assert.equal(a.getBannerState().messageUntil,now()+10000);
  if(cycle===0){advance(10000);assert.equal(a.getBannerState().dueAt-now(),60000);advance(59999);a.requestBanner(t);assert.equal(a.getBannerState().attempt,3);advance(1);a.requestBanner(t);}
 }
 advance(1e6);a.requestBanner(t);assert.equal(a.getBannerState().attempt,6);assert.equal(a.getBannerState().dueAt,null);
 a.releaseBanner(t);const t2=Symbol();a.claimBanner(t2);a.requestBanner(t2);assert.equal(a.getBannerState().attempt,6);
});
test('banner: remount preserves remaining retry deadline and rejects stale owner/callback',()=>{
 const {api:a,token:t,advance}=banner();a.claimBanner(t);a.requestBanner(t);const id=a.getBannerState().requestId;a.bannerFailed(t,id);advance(2000);a.releaseBanner(t);
 const u=Symbol();a.claimBanner(u);advance(3999);a.requestBanner(u);assert.equal(a.getBannerState().attempt,1);advance(1);a.requestBanner(u);assert.equal(a.getBannerState().attempt,2);
 assert.equal(a.bannerLoaded(t,id),false);assert.equal(a.bannerFailed(u,id),false);assert.equal(a.claimBanner(Symbol()),false);
});
test('banner: loaded view survives refresh failure; later successful placement may start anew',()=>{
 const {api:a,token:t}=banner();a.claimBanner(t);a.requestBanner(t);const id=a.getBannerState().requestId;a.bannerLoaded(t,id);assert.equal(a.bannerFailed(t,id),false);assert.equal(a.getBannerState().phase,'loaded');a.releaseBanner(t);a.claimBanner(t);a.requestBanner(t);assert.equal(a.getBannerState().attempt,1);assert.ok(a.getBannerState().requestId>id);
});
test('banner: cancelling third in-flight request cannot reset budget or invent failure',()=>{
 const {api:a,token:t,advance}=banner();a.claimBanner(t);for(let i=0;i<3;i++){a.requestBanner(t);a.releaseBanner(t);advance(12000);a.claimBanner(t);}a.requestBanner(t);assert.equal(a.getBannerState().phase,'stopped');assert.equal(a.getBannerState().attempt,3);assert.equal(a.getBannerState().messageUntil,0);
});
test('rewarded: startup deduplicates and terminal failure needs manual retry without auto-show',async()=>{
 const h=rewarded(),a=h.api;a.loadRewardedAd();a.loadRewardedAd();await flush();assert.equal(h.ads.length,1);
 for(let i=0;i<3;i++){h.ads[i].emit('error');h.ads[i].emit('error');if(i<2){const delay=i===0?6000:12000;h.advance(delay-1);assert.equal(h.ads.length,i+1);h.advance(1);assert.equal(h.ads.length,i+2);}}
 assert.equal(a.getAdSnapshot().failed,true);assert.equal(a.getAdSnapshot().canRetry,true);a.loadRewardedAd();h.advance(999999);await flush();assert.equal(h.ads.length,3);a.retryRewarded();await flush();assert.equal(h.ads.length,4);h.ads[3].emit('loaded');assert.equal(a.isRewardedReady(),true);assert.equal(h.shows(),0);
});
test('rewarded: exactly one show, next preload, and one reward after opened/earned/closed',async()=>{
 const h=rewarded(),a=h.api;a.loadRewardedAd();await flush();h.ads[0].emit('loaded');a.showRewarded();a.showRewarded();await flush();assert.equal(h.shows(),1);
 h.ads[0].emit('opened');h.ads[0].emit('opened');assert.equal(h.ads.length,2);h.ads[1].emit('loaded');h.ads[0].emit('earned');assert.equal(h.rewards(),0);h.ads[0].emit('closed');h.ads[0].emit('closed');assert.equal(h.rewards(),1);assert.equal(a.isRewardedReady(),true);assert.equal(h.shows(),1);
});
test('rewarded: early close grants no reward and loading alone never presents',async()=>{
 const h=rewarded(),a=h.api;a.loadRewardedAd();await flush();h.ads[0].emit('loaded');assert.equal(h.shows(),0);a.showRewarded();await flush();h.ads[0].emit('opened');h.ads[0].emit('closed');assert.equal(h.rewards(),0);
});
test('rewarded: show rejection fails immediately and does not retry show',async()=>{
 const h=rewarded(),a=h.api;h.setShow(async()=>{throw Error('show rejected');});a.loadRewardedAd();await flush();h.ads[0].emit('loaded');a.showRewarded();await flush();assert.equal(a.getAdSnapshot().showFailed,true);h.advance(60000);assert.equal(h.shows(),1);assert.equal(h.rewards(),0);
});
test('rewarded: background during native preparation cancels presentation',async()=>{
 const h=rewarded(),a=h.api;let resolve;h.setPrepare(()=>new Promise(r=>resolve=r));a.loadRewardedAd();await flush();h.ads[0].emit('loaded');a.showRewarded();h.background();resolve();await flush();assert.equal(h.shows(),0);assert.equal(a.getAdSnapshot().showFailed,true);
});
test('rewarded: expired ready ad is never shown',async()=>{
 const h=rewarded(),a=h.api;a.loadRewardedAd();await flush();h.ads[0].emit('loaded');h.advance(3600001);assert.equal(a.isRewardedReady(),false);a.showRewarded();await flush();assert.equal(h.shows(),0);
});
test('rewarded: suspend cancels retries and rejects stale SDK callbacks',async()=>{
 const h=rewarded(),a=h.api;a.loadRewardedAd();await flush();const stale=h.ads[0].handlers.get('loaded');h.ads[0].emit('error');a.suspendRewardedAds();h.advance(60000);stale();assert.equal(h.ads.length,1);assert.equal(a.isRewardedReady(),false);assert.equal(h.rewards(),0);
});
test('rewarded: non-free entitlement prevents SDK loads and shows',async()=>{
 const h=rewarded();h.setPremium('premium');h.api.loadRewardedAd();h.api.showRewarded();await flush();assert.equal(h.ads.length,0);assert.equal(h.shows(),0);
});
test('rewarded: readiness is rechecked after asynchronous native preparation',async()=>{
 const h=rewarded(),a=h.api;let resolve;h.setPrepare(()=>new Promise(r=>resolve=r));a.loadRewardedAd();await flush();h.ads[0].emit('loaded');a.showRewarded();h.ads[0].loaded=false;resolve();await flush();assert.equal(h.shows(),0);assert.equal(a.getAdSnapshot().showFailed,true);
});
test('rewarded: expiry during asynchronous native preparation cancels show',async()=>{
 const h=rewarded(),a=h.api;let resolve;h.setPrepare(()=>new Promise(r=>resolve=r));a.loadRewardedAd();await flush();h.ads[0].emit('loaded');a.showRewarded();h.advance(3600001);resolve();await flush();assert.equal(h.shows(),0);assert.equal(a.getAdSnapshot().showFailed,true);
});
test('SDK initialization: shared promise, bounded 6/12 retries, manual recovery',async()=>{
 const h=harness();let calls=0,ready=false;
 const a=h.load('ads/initializeMobileAds.ts',{'react':{useSyncExternalStore(){}},'./AdClient':{initializeAdSdk:async()=>{calls++;if(!ready)throw Error('offline');return [{state:1}];}},'./adConfiguration':{getAdConfiguration:()=>({})},'./adTrace':{recordAdEvent(){}}});
 const first=a.initializeMobileAds(),second=a.initializeMobileAds();assert.equal(first,second);let rejected=false;first.catch(()=>rejected=true);await flush();assert.equal(calls,1);h.advance(5999);await flush();assert.equal(calls,1);h.advance(1);await flush();assert.equal(calls,2);h.advance(12000);await flush();assert.equal(calls,3);assert.equal(a.getMobileAdsState(),'failed');assert.equal(rejected,true);
 await a.initializeMobileAds().catch(()=>{});assert.equal(calls,3);ready=true;a.retryMobileAdsInitialization();await a.initializeMobileAds();assert.equal(a.getMobileAdsState(),'ready');assert.equal(calls,4);
});
test('SDK initialization: cancel invalidates an unresolved SDK completion',async()=>{
 const h=harness();let resolve;
 const a=h.load('ads/initializeMobileAds.ts',{'react':{useSyncExternalStore(){}},'./AdClient':{initializeAdSdk:()=>new Promise(r=>resolve=r)},'./adConfiguration':{getAdConfiguration:()=>({})},'./adTrace':{recordAdEvent(){}}});
 const pending=a.initializeMobileAds();pending.catch(()=>{});await flush();a.suspendMobileAdsInitialization();resolve([{state:1}]);await flush();assert.equal(a.getMobileAdsState(),'idle');assert.equal(h.timers.size,0);
});
function web(enabled=true,outcome='success'){
 const h=harness();h.env.queueMicrotask=queueMicrotask;let state='loading';const listeners=new Set(),events=[];
 const select=value=>{state=value;listeners.forEach(fn=>fn());};
 const a=h.load('ads/AdClient.web.ts',{'./adTrace':{recordAdEvent(){}},'./webAdDiagnostics.web':{WEB_AD_DIAGNOSTICS:enabled,getWebAdState:()=>state,getWebAdOutcome:()=>outcome,selectWebAdState:select,subscribeWebAdState:fn=>{listeners.add(fn);return()=>listeners.delete(fn);}}});
 return {a,events,select,create:()=>a.createRewardedAd(e=>events.push(e))};
}
test('web diagnostics: explicit ready then one ordered event flow, never auto-show',async()=>{
 const h=web(),ad=h.create();ad.show();assert.equal(h.events.length,0);h.select('ready');assert.deepEqual(h.events,['LOADED']);ad.show();ad.show();await flush();assert.deepEqual(h.events,['LOADED','OPENED','EARNED','CLOSED']);
});
test('web diagnostics: disabled mode throws, failure cannot earn',async()=>{
 assert.throws(()=>web(false).create(),/disabled/);const h=web(true,'failure'),ad=h.create();h.select('ready');ad.show();await flush();assert.deepEqual(h.events,['LOADED','ERROR']);
});
test('web diagnostics: dispose and state replacement cancel pending events',async()=>{
 for(const dispose of [true,false]){const h=web(),ad=h.create();h.select('ready');ad.show();if(dispose)ad.dispose();else h.select('loading');await flush();assert.deepEqual(h.events,['LOADED']);}
});
test('ad trace: production console silent, local buffer bounded, errors retained',()=>{
 const h=harness();let logs=0;h.env.console={info(){logs++;}};const a=h.load('ads/adTrace.ts',{'react-native':{Platform:{OS:'android'}}});
 for(let i=0;i<125;i++)a.recordAdEvent('banner','failed',{attempt:i},Object.assign(new Error('network unavailable'),{code:'network'}));
 assert.equal(logs,0);assert.equal(a.getAdTrace().length,120);assert.equal(a.getAdTrace()[0].attempt,5);assert.equal(a.getAdTrace()[0].errorMessage,'network unavailable');
});
test('preset model: text spacing, deep copies, migration and non-Pro cleanup preserve input',()=>{
 const h=harness();const deps={'@/constants/colorPalette':h.load('constants/colorPalette.tsx'),'@/constants/pixelLed':h.load('constants/pixelLed.ts'),'@/utils/viewMode':h.load('utils/viewMode.ts')};
 const a=h.load('contexts/settings/presetModel.ts',deps);const original=JSON.parse(JSON.stringify(a.DEFAULT_BANNER_CONFIG));original.content.previewText='  라라라  하늘\n A  B ';original.appearance.letterSpacing=24;original.appearance.effectSelectedItems=['Blink','Glow'];original.appearance.fontByLocale.ko='noto_sans_kr';
 const before=JSON.stringify(original),snap=a.presetFromConfig(original);snap.appearance.effectParamValues.Glow=99;snap.appearance.fontByLocale.ko='changed';assert.equal(JSON.stringify(original),before);const restored=a.configFromPreset(a.presetFromConfig(original),'one');assert.equal(restored.content.previewText,original.content.previewText);assert.equal(restored.appearance.letterSpacing,24);
 const cleaned=a.nonProSanitize(original);assert.equal(cleaned.content.previewText,original.content.previewText);assert.equal(cleaned.appearance.letterSpacing,24);assert.equal(JSON.stringify(original),before);assert.equal(cleaned.appearance.effectSelectedItems.includes('Glow'),false);assert.equal(cleaned.appearance.effectSelectedItems.includes('Blink'),true);
 assert.equal(a.normalizePreviewTextMaxLines(' A  B\r\n라라라 하늘'),' A  B\n라라라 하늘');assert.equal(a.normalizePreviewTextMaxLines('1\n2\n3\n4'),null);
 const old=a.normalizePresetSlot({content:{previewText:'  X  Y '},appearance:{letterSpacing:17}});assert.equal(old.content.previewText,'  X  Y ');assert.equal(old.appearance.letterSpacing,17);
});
