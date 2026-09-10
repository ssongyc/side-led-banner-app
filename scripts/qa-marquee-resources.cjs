const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function harness() {
  let cursor = 0, recordings = 0, paints = 0;
  const memo = [];
  const useMemo = (fn, deps) => {
    const i = cursor++;
    if (!memo[i] || deps.some((v, j) => !Object.is(v, memo[i].deps[j]))) memo[i] = { deps, value: fn() };
    return memo[i].value;
  };
  function load(file, modules) {
    const exports = {};
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
    vm.runInNewContext(code, { exports, require: name => { assert.ok(name in modules, name); return modules[name]; } });
    return exports;
  }
  const tile = load('hooks/useTilePicture.ts', {
    react: { useMemo }, '@shopify/react-native-skia': { FilterMode: { Nearest: 0, Linear: 1 } },
    '@/utils/glyphLedPanels': { computeGlyphLedPanels: () => [] },
    '@/utils/recordTile': {
      computeEffectSpace: () => 2, computeMarqueeTilePeriod: p => p.textWidthPx + p.spacerPx + p.effectBleedPx,
      resolveMarqueeStripWidth: (w, p) => w + p * 2,
      recordTile: args => ({ id: ++recordings, args }),
      makeMarqueeStripPaint: (picture, ...args) => ({ id: ++paints, picture, args }),
    },
  });
  const hook = load('components/animation/useMarqueeCanvasProps.ts', { '@/hooks/useTilePicture': tile });
  return { render: p => { cursor = 0; return hook.useMarqueeCanvasProps(p); }, counts: () => ({ recordings, paints }) };
}
function props() {
  return { canvas: { skiaTextBlob: {}, skiaTextBlobs: [{}], skiaTextWidth: 400, skiaCanvasLayout: { width: 360, height: 700 }, skiaGlyphPositions: [], skiaFont: {} },
    effects: { isPixelEffect: false, isPixelTextDots: false, isPixelColorMix: false, pixelShaderSize: 5, pixelTextShaderUniforms: {}, pixelMaskDilateRadius: 1, pixelMaskErodeRadius: 0, pixelGlyphPadCells: 1, pixelContentUpscaleFactor: 2, isGlowEffect: false, glowBlurRadius: 3, glowLayerColor: '#fff', skiaStrokeWidthPx: 2, pixelOutlineRings: 0 },
    blinkOpacity: 1, spacer: 20, previewTextColor: '#000', hasBgPhoto: false, dropShadow: 20, backgroundColor: '#fff' };
}
test('screen-owned resources survive unchanged layout objects and repeated renders', () => {
  const h = harness(), p = props(), first = h.render(p);
  for (let i = 0; i < 20; i++) {
    const next = h.render({ ...p, canvas: { ...p.canvas, skiaCanvasLayout: { width: 360, height: 700 } } });
    assert.equal(next.tilePaints.stripPaint, first.tilePaints.stripPaint);
  }
  assert.deepEqual(h.counts(), { recordings: 1, paints: 1 });
});
test('text, appearance and height changes replace resources', () => {
  const h = harness(), p = props(); let previous = h.render(p).tilePaints.stripPaint;
  for (const change of [() => { p.canvas.skiaTextBlobs = [{}]; }, () => { p.previewTextColor = '#f00'; }, () => { p.canvas.skiaCanvasLayout.height = 600; }]) {
    change(); const next = h.render(p).tilePaints.stripPaint; assert.notEqual(next, previous); previous = next;
  }
  assert.equal(h.counts().recordings, 4);
});
test('pixel and glow preserve separate layers, upscale and shadow parameters', () => {
  const h = harness(), p = props(); p.effects.isPixelEffect = true; p.effects.isPixelTextDots = true; p.effects.isGlowEffect = true;
  const result = h.render(p).tilePaints;
  assert.equal(result.stripPaint.picture.args.layerMode, 'textOnly');
  assert.equal(result.stripPaint.picture.args.upscaleFactor, 2);
  assert.equal(result.stripPaint.picture.args.dropShadowBlur, 1);
  assert.equal(result.glowStripPaint.picture.args.layerMode, 'glowOnly');
  assert.equal(h.counts().recordings, 2);
});
test('preview and fullscreen own independent resources', () => {
  const preview = harness(), fullscreen = harness(), p = props();
  assert.notEqual(preview.render(p).tilePaints.stripPaint, fullscreen.render(p).tilePaints.stripPaint);
});
