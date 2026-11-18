const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const flush = async () => { for (let n = 0; n < 60; n++) await Promise.resolve(); };
function deferred() { let resolve, reject; const promise = new Promise((yes,no)=>{resolve=yes;reject=no;}); return {promise,resolve,reject}; }
function harness(platform = 'ios') {
  const sku = 'premium', saved = new Map();
  const app = { currentState: 'active' };
  let onError, onPurchase;
  const sdk = {
    ErrorCode: { AlreadyOwned:'owned', DeferredPayment:'deferred', Pending:'pending', UserCancelled:'cancelled', ServiceDisconnected:'service-disconnected', ConnectionClosed:'connection-closed', NotPrepared:'not-prepared' },
    purchaseUpdatedListener(fn) { onPurchase=fn; return {remove(){}}; },
    purchaseErrorListener(fn) { onError=fn; return {remove(){}}; },
    initConnection:async()=>true, endConnection:async()=>true, getAvailablePurchases:async()=>[],
    getStorefront:async()=>'USA', fetchProducts:async()=>[{
      id:sku,type:'in-app',platform:'ios',typeIOS:'non-consumable',displayPrice:'$4.99',currency:'USD',price:4.99,
    }],
    requestPurchase:async()=>undefined, restorePurchases:async()=>{},
    currentEntitlementIOS:async()=>null,isTransactionVerifiedIOS:async()=>true,finishTransaction:async()=>{},
  };
  const deps = {
    '@react-native-async-storage/async-storage':{__esModule:true,default:{getItem:async k=>saved.get(k)??null,setItem:async(k,v)=>{saved.set(k,v);},removeItem:async k=>{saved.delete(k);}}},
    '@/constants/premium':{PREMIUM_PRODUCT_IDS:{ios:sku,android:sku},PREMIUM_ANDROID_PURCHASE_OPTION_ID:'buy'},
    'expo':{requireNativeModule(){assert.equal(platform,'android');return {verify:async()=>true};}},
    'react-native':{AppState:app,Platform:{OS:platform}},
    '@amplitude/analytics-react-native':{},'expo-file-system':{},'expo-iap':sdk,
  };
  const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../utils/ApiClient.ts'),'utf8'),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  }).outputText;
  const exports={};
  vm.runInNewContext(code,{exports,require(id){assert.ok(id in deps,id);return deps[id];},console:{warn(){}},queueMicrotask,process:{env:{EXPO_PUBLIC_GOOGLE_PLAY_LICENSE_KEY:'qa-public-key'}}});
  return {api:exports,sdk,app,saved,error:e=>onError(e),purchase:p=>onPurchase(p)};
}
async function ready(h) { h.api.setPremiumShopVisible(true); await h.api.refreshPremium(); assert.equal(h.api.getPremiumSnapshot().entitlement,'free'); }
test('Shop: leaving and reopening during preflight never opens a stale payment sheet',async()=>{
 const h=harness();await ready(h);const quote=deferred();let requests=0;
 const products=await h.sdk.fetchProducts();h.sdk.fetchProducts=()=>quote.promise;h.sdk.requestPurchase=async()=>{requests++;};
 const buy=h.api.buyPremium(h.api.getPremiumSnapshot().price);await flush();
 h.api.setPremiumShopVisible(false);h.api.setPremiumShopVisible(true);quote.resolve(products);await buy;
 assert.equal(requests,0);assert.equal(h.api.getPremiumSnapshot().operation,'idle');
});
test('Shop: foreground loss during preflight never opens payment sheet',async()=>{
 const h=harness();await ready(h);const quote=deferred();let requests=0;
 const products=await h.sdk.fetchProducts();h.sdk.fetchProducts=()=>quote.promise;h.sdk.requestPurchase=async()=>{requests++;};
 const buy=h.api.buyPremium(h.api.getPremiumSnapshot().price);await flush();h.app.currentState='background';
 quote.resolve(products);await buy;assert.equal(requests,0);
});
test('Shop: asynchronous cancellation without productId keeps purchase lock until dispatch finishes',async()=>{
 const h=harness();await ready(h);const result=deferred();let requests=0;
 h.sdk.requestPurchase=()=>{requests++;return result.promise;};
 const buy=h.api.buyPremium(h.api.getPremiumSnapshot().price);await flush();assert.equal(requests,1);
 h.error({code:'cancelled'});await flush();
 assert.equal(h.api.getPremiumSnapshot().notice,'cancelled');assert.equal(h.api.getPremiumSnapshot().operation,'purchasing');
 await h.api.buyPremium(h.api.getPremiumSnapshot().price);assert.equal(requests,1);
 result.resolve();await buy;assert.equal(h.api.getPremiumSnapshot().operation,'idle');
});
test('Shop: pending callback persists without granting access or unlocking another purchase',async()=>{
 const h=harness();await ready(h);const result=deferred();h.sdk.requestPurchase=()=>result.promise;
 const buy=h.api.buyPremium(h.api.getPremiumSnapshot().price);await flush();h.error({code:'pending'});await flush();
 assert.equal(h.api.getPremiumSnapshot().paymentPending,true);assert.equal(h.api.getPremiumSnapshot().entitlement,'free');
 assert.equal(h.saved.size,1);result.resolve();await buy;assert.equal(h.api.getPremiumSnapshot().notice,'pending');
});
test('Shop: unrelated and unattributed query errors do not change purchase state',async()=>{
 const h=harness();await ready(h);h.error({code:'cancelled'});h.error({code:'pending',productId:'another'});await flush();
 assert.equal(h.api.getPremiumSnapshot().notice,null);assert.equal(h.api.getPremiumSnapshot().paymentPending,false);
});
test('Shop: verified ownership survives a late purchase error',async()=>{
 const h=harness();await ready(h);const purchase={id:'transaction',productId:'premium',store:'apple',purchaseState:'purchased'};
 h.sdk.currentEntitlementIOS=async()=>purchase;h.purchase(purchase);await flush();
 assert.equal(h.api.getPremiumSnapshot().entitlement,'owned');h.error({code:'cancelled',productId:'premium'});await flush();
 assert.equal(h.api.getPremiumSnapshot().entitlement,'owned');assert.equal(h.api.getPremiumSnapshot().notice,'purchased');
});
test('Shop: failed refresh and restore release only their own operation',async()=>{
 const h=harness();await ready(h);h.sdk.getAvailablePurchases=async()=>{throw Error('Store unavailable');};
 await h.api.refreshPremium();assert.equal(h.api.getPremiumSnapshot().operation,'idle');assert.equal(h.api.getPremiumSnapshot().notice,'unavailable');
 await h.api.restorePremium();assert.equal(h.api.getPremiumSnapshot().operation,'idle');assert.equal(h.api.getPremiumSnapshot().notice,'error');
});

async function readyAndroid() {
 const h=harness('android');
 h.sdk.fetchProducts=async()=>[{id:'premium',type:'in-app',platform:'android',discountOffers:[{
  purchaseOptionIdAndroid:'buy',offerTokenAndroid:'qa-offer',displayPrice:'$4.99',currency:'USD',price:4.99,
 }]}];
 await ready(h);return h;
}
for(const error of [{code:'service-disconnected'},{code:'connection-closed'},{code:'not-prepared'},new Error('Billing client not ready')]) {
 test('Shop Android: disconnected query recovers on next explicit refresh '+(error.code??error.message),async()=>{
  const h=await readyAndroid();let resets=0,inits=0,queries=0;
  h.sdk.endConnection=async()=>{resets++;return true;};h.sdk.initConnection=async()=>{inits++;return true;};
  h.sdk.getAvailablePurchases=async()=>{queries++;throw error;};
  await h.api.refreshPremium();assert.equal(h.api.getPremiumSnapshot().notice,'unavailable');
  assert.equal(resets,0);assert.equal(inits,0);assert.equal(queries,1);
  h.sdk.getAvailablePurchases=async()=>[];
  await Promise.all([h.api.refreshPremium(),h.api.refreshPremium()]);
  assert.equal(resets,1);assert.equal(inits,1);assert.equal(h.api.getPremiumSnapshot().entitlement,'free');
  assert.equal(h.api.getPremiumSnapshot().notice,null);assert.ok(h.api.getPremiumSnapshot().price);
 });
}
test('Shop Android: ordinary query failure preserves owned access and does not reset connection',async()=>{
 const h=await readyAndroid();let resets=0;
 const purchase={id:'order',productId:'premium',store:'google',purchaseState:'purchased',purchaseToken:'qa-token',dataAndroid:'qa-data',signatureAndroid:'qa-signature',isAcknowledgedAndroid:true};
 h.sdk.getAvailablePurchases=async()=>[purchase];await h.api.refreshPremium();
 h.sdk.endConnection=async()=>{resets++;return true;};h.sdk.getAvailablePurchases=async()=>{throw Error('Network unavailable');};
 await h.api.refreshPremium();assert.equal(h.api.getPremiumSnapshot().entitlement,'owned');assert.equal(resets,0);
});
test('Shop Android: manual restore reconnects, acknowledges non-consumable once and survives refresh',async()=>{
 const h=await readyAndroid();let resets=0,finishes=0;
 h.sdk.getAvailablePurchases=async()=>{throw {code:'not-prepared'};};await h.api.refreshPremium();
 h.sdk.endConnection=async()=>{resets++;return true;};
 const purchase={id:'order',productId:'premium',store:'google',purchaseState:'purchased',purchaseToken:'qa-token',dataAndroid:'qa-data',signatureAndroid:'qa-signature',isAcknowledgedAndroid:false};
 h.sdk.getAvailablePurchases=async()=>[purchase];h.sdk.finishTransaction=async args=>{assert.equal(args.isConsumable,false);finishes++;};
 await h.api.restorePremium();assert.equal(resets,1);assert.equal(finishes,1);assert.equal(h.api.getPremiumSnapshot().notice,'restored');
 await h.api.refreshPremium();assert.equal(finishes,1);assert.equal(h.api.getPremiumSnapshot().entitlement,'owned');
});
test('Shop Android: failed reconnect remains visible and next manual attempt can recover',async()=>{
 const h=await readyAndroid();h.sdk.getAvailablePurchases=async()=>{throw {code:'not-prepared'};};await h.api.refreshPremium();
 h.sdk.endConnection=async()=>{throw Error('Disconnect failed');};await h.api.restorePremium();
 assert.equal(h.api.getPremiumSnapshot().notice,'error');assert.equal(h.api.getPremiumSnapshot().operation,'idle');
 h.sdk.endConnection=async()=>true;h.sdk.getAvailablePurchases=async()=>[];await h.api.restorePremium();
 assert.equal(h.api.getPremiumSnapshot().notice,'nothingToRestore');
});
