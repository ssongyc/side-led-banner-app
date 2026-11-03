const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
(async()=>{
 const ads=[],listeners=new Set(),timers=new Map();let clock=0,serial=0,shows=0,grants=0;
 const app={currentState:'active',addEventListener:(_,fn)=>{listeners.add(fn);return{remove:()=>listeners.delete(fn)}}};
 const events={loaded:'loaded',opened:'opened',closed:'closed',error:'error',earnedReward:'reward'};
 const native={rewardedAdEvents:events,createNativeRewardedAd(){const callbacks=new Map();const ad={loaded:false,googleRewardOrderGuaranteed:true,load(){},addAdEventListener(e,fn){callbacks.set(e,fn);return()=>callbacks.delete(e)},emit(e){if(e==='loaded')ad.loaded=true;callbacks.get(e)?.()},callbacks};ads.push(ad);return ad},disposeRewardedAd(){},beginRewardedPresentation:async()=>{},endRewardedPresentation:()=>{},showRewardedAd:async()=>{shows++}};
 const consent={isAdConsentAllowed:()=>true,canRetryAdConsent:()=>false,registerConsentLifecycle:()=>()=>{},subscribeAdConsent:()=>()=>{},prepareAdConsentRetry(){}};
 const init={initializeMobileAds:async()=>{},getMobileAdsState:()=> 'ready',subscribeMobileAdsState:()=>()=>{},isMobileAdsLoadDelayed:()=>false,retryMobileAdsInitialization(){}};
 const exports={};const code=ts.transpileModule(fs.readFileSync('ads/rewardedState.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 vm.runInNewContext(code,{exports,console,__DEV__:false,Date,performance:{now:()=>clock},setTimeout:(fn,delay)=>{timers.set(++serial,{fn,delay});return serial},clearTimeout:id=>timers.delete(id),require(name){if(name.includes('adConsent'))return consent;if(name.endsWith('AdClient'))return native;if(name.includes('adConfiguration'))return{getAdConfiguration:()=>({rewarded:'demo'})};if(name.includes('initializeMobileAds'))return init;if(name.includes('adTrace'))return{recordAdEvent(){}};if(name.includes('ApiClient'))return{getPremiumSnapshot:()=>({entitlement:'free'})};if(name.includes('showFailure'))return{isConfirmedPreShowFailure:()=>false};if(name==='react-native')return{AppState:app,Platform:{OS:'android'}};throw Error(name)}});
 const flush=async()=>{await Promise.resolve();await Promise.resolve()};
 exports.subscribeRewardedState(()=>{},()=>grants++);exports.loadRewardedAd();await flush();assert.equal(ads.length,1);ads[0].emit('loaded');exports.showRewarded();exports.showRewarded();await flush();assert.equal(shows,1);
 ads[0].emit('opened');assert.equal(ads.length,2);ads[1].emit('loaded');const earned=ads[0].callbacks.get('reward');ads[0].emit('closed');earned();earned();assert.equal(grants,1);
 app.currentState='background';listeners.forEach(fn=>fn('background'));exports.showRewarded();await flush();assert.equal(shows,1);
 app.currentState='active';listeners.forEach(fn=>fn('active'));assert.equal(exports.getAdSnapshot().loaded,true);exports.showRewarded();await flush();assert.equal(shows,2);ads[1].emit('opened');ads[1].emit('reward');ads[1].emit('closed');assert.equal(grants,2);
 ads[2].emit('loaded');clock=3600001;listeners.forEach(fn=>fn('active'));exports.showRewarded();await flush();assert.equal(shows,2);assert.equal(exports.getAdSnapshot().expired,true);exports.loadRewardedAd({restartFailed:true});await flush();assert.equal(ads.length,4);assert.equal(shows,2);
 console.log('Real rewarded controller: overlap, late/double reward, background, next slot and expiry recovery passed');
})().catch(e=>{console.error(e);process.exitCode=1});
