# Phase 9.2 — runtime performance

## Frame work

`AnimationScheduler` is now the only path for scene-system frame updates. Each
task declares when it is active: showroom and hotspot motion only runs in the
main hall; zone motion only runs in zone mode; viewer, explosion, process, and
label updates only run while their animation or tracked label is active.
Dormant exhibit models no longer receive empty `update()` calls.

The render loop remains continuous because the visible showroom, zone, and
exhibit presentations contain authored ambient motion. This keeps the existing
visual treatment intact while removing unrelated CPU work from each frame.

## Raycasting / BVH decision

`three-mesh-bvh` was evaluated but is not introduced for the current hotspot
system:

- main-hall hotspots are five `Sprite` proxies, for which a triangle BVH cannot
  help;
- zone exhibits use a small set of simple proxy meshes;
- component picking already raycasts a prefiltered list of component meshes,
  and the procedural MVR/RTO geometry is created and released on demand;
- building and retaining bounds trees would add startup/memory cost and disposal
  complexity without addressing the dominant pointer-event frequency cost.

Instead, pointer moves are coalesced to one raycast per animation frame, the
click path reuses its vector, and target arrays are passed without cloning.
BVH should be reconsidered if imported, high-poly GLTF meshes replace these
procedural/proxy targets.

## Renderer

- WebGL requests the high-performance adapter preference.
- Antialiasing remains enabled to preserve the authored appearance.
- device pixel ratio is capped at `1.5`; compared with a `2.0` cap this bounds
  fragment work to 56.25% at high-DPI while retaining multisample edge quality.
- the existing soft shadow map and lighting are preserved to avoid a visual
  change. The single main directional shadow remains the appropriate tradeoff.

`renderer.info` is logged after the first rendered frame and every five seconds
thereafter as `[RendererInfo]`, with `drawCalls`, `triangles`, `textures`, and
`geometries`. This makes mode-specific GPU load and resource cleanup observable
without per-frame console overhead.
