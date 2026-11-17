const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const flush = async () => { for (let n = 0; n < 60; n++) await Promise.resolve(); };
function deferred() { let resolve, reject; const promise = new Promise((yes,no)=>{resolve=yes;reject=no;}); return {promise,resolve,reject}; }
function harness() {
  const sku = 'premium', saved = new Map();
  const app = { currentState: 'active' };
  let onError, onPurchase;
  const sdk = {
    ErrorCode: { AlreadyOwned:'owned', DeferredPayment:'deferred', Pending:'pending', UserCancelled:'cancelled' },
    purchaseUpdatedListener(fn) { onPurchase=fn; return {remove(){}}; },
    purchaseErrorListener(fn) { onError=fn; return {remove(){}}; },
    initConnection:async()=>true, getAvailablePurchases:async()=>[],
    getStorefront:async()=>'USA', fetchProducts:async()=>[{
      id:sku,type:'in-app',platform:'ios',typeIOS:'non-consumable',displayPrice:'$4.99',currency:'USD',price:4.99,
    }],
    requestPurchase:async()=>undefined, restorePurchases:async()=>{},
    currentEntitlementIOS:async()=>null,isTransactionVerifiedIOS:async()=>true,finishTransaction:async()=>{},
  };
  const deps = {
    '@react-native-async-storage/async-storage':{__esModule:true,default:{getItem:async k=>saved.get(k)??null,setItem:async(k,v)=>{saved.set(k,v);},removeItem:async k=>{saved.delete(k);}}},
    '@/constants/premium':{PREMIUM_PRODUCT_IDS:{ios:sku},PREMIUM_ANDROID_PURCHASE_OPTION_ID:'buy'},
    'expo':{requireNativeModule(){throw Error('Unexpected Android verification');}},
    'react-native':{AppState:app,Platform:{OS:'ios'}},
    '@amplitude/analytics-react-native':{},'expo-file-system':{},'expo-iap':sdk,
  };
  const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../utils/ApiClient.ts'),'utf8'),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  }).outputText;
  const exports={};
  vm.runInNewContext(code,{exports,require(id){assert.ok(id in deps,id);return deps[id];},console:{warn(){}},queueMicrotask,process:{env:{}}});
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
