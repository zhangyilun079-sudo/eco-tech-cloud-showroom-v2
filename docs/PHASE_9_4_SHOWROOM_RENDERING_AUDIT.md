# Phase 9.4 showroom rendering audit

The Phase 9.4 audit is console-only and does not alter showroom visuals. Enable the existing profiler in DevTools:

```js
window.performanceDebug = true
```

Every two seconds, `showroomAudit` in the `[PerformanceDebug] runtime profile` message reports these showroom slices:

- `architecture`
- `centralDataCore`
- `zonePortals`
- `holographicElements`
- `digitalScreens`
- `decorativeStructures`
- `linesWireframeObjects`
- `transparentObjects`

Each slice includes visible object and mesh counts, rendered line primitives, triangles, estimated draw calls, and unique materials. The report also includes showroom-wide unique transparent-material and additive-blending-material counts, plus the visible `LineSegments` object count.

`linesWireframeObjects` and `transparentObjects` are intentionally cross-cutting slices: they overlap the ownership-oriented slices. This makes it possible to trace a high renderer line or call count back to a visual feature while separately measuring the rendering technique involved. Draw-call figures are estimates based on one call per visible renderable, or geometry group/material count for multi-material renderables; the renderer's `renderer.calls` remains the authoritative measured total.
