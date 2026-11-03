const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
(async()=>{
 const source=fs.readFileSync('contexts/settingsContext.tsx','utf8');
 const ast=ts.createSourceFile('settings.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 let effect;
 function visit(n){if(ts.isCallExpression(n)&&n.expression.getText(ast)==='useEffect'&&n.arguments[0]?.getText(ast).includes('AppState.addEventListener')) effect=n.arguments[0].getText(ast);ts.forEachChild(n,visit)}visit(ast);
 assert.ok(effect);let listener,removed=false,clock=1000,state={proMode:2000,other:'preserved'};
 const js=ts.transpileModule('const effect='+effect,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText+'\neffect()';
 const cleanup=vm.runInNewContext(js,{AppState:{addEventListener:(_,fn)=>{listener=fn;return {remove(){removed=true}}}},Date:{now:()=>clock},setProClock:()=>{},setUI:fn=>{state=fn(state)}});
 listener('background');assert.equal(state.proMode,2000);
 listener('active');assert.equal(state.proMode,2000);
 clock=3000;listener('active');assert.equal(state.proMode,null);assert.equal(state.other,'preserved');
 state.proMode=5000;listener('active');assert.equal(state.proMode,5000);cleanup();assert.equal(removed,true);
 const storageCode=ts.transpileModule(fs.readFileSync('utils/proModeStorage.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 for(const qa of [false,true]){const values=new Map([['@led_banner_pro_mode_expiry_v1','9000']]);const exports={};vm.runInNewContext(storageCode,{exports,process:{env:{EXPO_PUBLIC_REWARD_EXPIRY_QA:String(qa)}},require:()=>({__esModule:true,default:{getItem:async k=>values.get(k),setItem:async(k,v)=>values.set(k,v),removeItem:async k=>values.delete(k)}})});assert.equal(exports.PRO_REWARD_DURATION_MS,qa?30000:7200000);await exports.writeProModeExpiry(1234);assert.equal(await exports.readProModeExpiry(),1234);await exports.writeProModeExpiry(null);if(qa)assert.equal(values.get('@led_banner_pro_mode_expiry_v1'),'9000')}
 console.log('Foreground expiry, renewed deadline, cleanup and QA storage isolation passed');
})().catch(e=>{console.error(e);process.exitCode=1});

