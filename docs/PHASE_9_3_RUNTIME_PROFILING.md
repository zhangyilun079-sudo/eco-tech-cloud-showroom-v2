# Phase 9.3 runtime profiling

The profiler is intentionally console-only and makes no visual UI changes. Enable it in DevTools:

```js
window.performanceDebug = true
```

Every two seconds, `[PerformanceDebug] runtime profile` reports FPS, FPS change, renderer draw statistics, renderer memory, visible scene objects/meshes/materials, module object totals, and active animation task IDs.

Disable one feature at a time, wait for the next report, and inspect `toggleFpsChanges`:

```js
window.performanceDebugFeatures.shadows = false
window.performanceDebugFeatures.animations = false
window.performanceDebugFeatures.hotspots = false
window.performanceDebugFeatures.postprocessing = false
```

Set a property back to `true` to restore it. Camera controls and view transitions stay active while scene animations are disabled so each comparison remains navigable. The application currently has no postprocessing pass; its switch is retained as an explicit zero-cost control hypothesis.

Turn reporting and all overrides off with:

```js
window.performanceDebug = false
```
