# Performance baseline — 2026-09-08

## Current status

Measurement requested for preview and fullscreen playback. No Android device was listed by adb devices -l. No frame-time, memory or React render-count sample has been collected. No new build, app installation, optimization or Amplitude console change was performed.

The supplied Amplitude screenshot identifies LED POP project 818873. The API key in artifacts/b/.env.local matches the supplied key; the repository root has neither .env nor .env.local. Key values are intentionally omitted. Screenshot event totals do not establish current event delivery or runtime performance.

## Capture protocol

1. Identify connected device, Android version, refresh rate, installed application version/build provenance and build mode before capture. The previously delivered 85a61d6 APK predates the current EffectSection extraction and other source edits.
2. Record language, text, font, line mode, motion speed and selected effects. Keep these fixed between comparison runs. Record thermal conditions and whether ads or font downloads are active.
3. After assets/fonts settle, capture preview and fullscreen separately for 30 seconds each, three runs per scenario. Record transitions separately. Include a plain-text baseline and the actual effect combination the user wants evaluated; do not bypass locked features.
4. Use Android system tracing/Perfetto to inspect the relevant app/Skia presentation surface. Report frame duration median/p95/p99 and missed presentation deadlines only when the trace contains the necessary data. React commit count and JavaScript callback frequency are not displayed FPS.
5. Use dumpsys meminfo for process PSS and available heap categories before/after each run. Report sampled memory separately from any continuous trace peak; snapshots cannot prove the true peak or absence of leaks.
6. Capture React component renders/commits with React Native DevTools in a compatible debugging/profiling build. Record the component scope (PreviewPanel, LedBannerFullScreen and related subtrees), commits and render duration. Development overhead prevents direct equivalence with release frame-time/memory results. Ordinary release builds do not expose DevTools.
7. Preserve raw traces and samples under artifacts with device/build/scenario metadata. Missing metrics remain unmeasured. No performance optimization is justified until a bottleneck is observed.

## References

- React Native DevTools: https://reactnative.dev/docs/react-native-devtools
- Build-mode limitations: https://reactnative.dev/docs/debugging
- Android memory inspection: https://developer.android.com/topic/performance/memory/guide/tools-overview
