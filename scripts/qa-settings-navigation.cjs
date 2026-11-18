const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../app/settings.tsx'), 'utf8');
const ast = ts.createSourceFile('settings.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let back, focus;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'goBack') back = node.initializer.arguments[0].getText(ast);
  if (ts.isCallExpression(node) && node.expression.getText(ast) === 'useFocusEffect' && node.getText(ast).includes('hardwareBackPress')) focus = node.arguments[0].arguments[0].getText(ast);
  ts.forEachChild(node, visit);
}
visit(ast);
assert.ok(back && focus, 'Actual Settings handlers must be present');
function harness(os = 'android', hasHistory = false) {
  const calls = []; let listener, removed = false;
  const router = {canGoBack:()=>hasHistory,back:()=>calls.push('back'),replace:p=>calls.push(p)};
  const code = ts.transpileModule(`const goBack=${back};const focus=${focus};exports.goBack=goBack;exports.focus=focus;`, {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
  const exports = {};
  vm.runInNewContext(code, {exports,router,Platform:{OS:os},BackHandler:{addEventListener(name,fn){assert.equal(name,'hardwareBackPress');listener=fn;return {remove(){removed=true;listener=undefined;}};}}});
  return {api:exports,calls,hardware:()=>listener?.(),hasListener:()=>Boolean(listener),removed:()=>removed,setHistory:value=>{hasHistory=value;}};
}
test('Settings header Back preserves existing stack history',()=>{
 const h=harness('android',true);h.api.goBack();assert.deepEqual(h.calls,['back']);
});
test('standalone Settings header Back opens the editor',()=>{
 const h=harness();h.api.goBack();assert.deepEqual(h.calls,['/']);
});
test('standalone Android Back is consumed and opens the editor',()=>{
 const h=harness();const cleanup=h.api.focus();assert.equal(h.hardware(),true);assert.deepEqual(h.calls,['/']);cleanup();
});
test('Android Back with history remains owned by normal navigation',()=>{
 const h=harness('android',true);h.api.focus();assert.equal(h.hardware(),false);assert.deepEqual(h.calls,[]);
});
test('history is checked at the actual Back press and listener is removed on blur',()=>{
 const h=harness('android',true);const cleanup=h.api.focus();h.setHistory(false);assert.equal(h.hardware(),true);cleanup();assert.equal(h.removed(),true);assert.equal(h.hasListener(),false);
});
test('iOS and web never register an Android hardware Back listener',()=>{
 for(const os of ['ios','web']){const h=harness(os);assert.equal(h.api.focus(),undefined);assert.equal(h.hasListener(),false);h.api.goBack();assert.deepEqual(h.calls,['/']);}
});
