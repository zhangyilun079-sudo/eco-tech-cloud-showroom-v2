# Phase 9.1 — initial scene allocation

The counts below compare the scene graph immediately after
`ShowroomApplication` construction, before the first zone or exhibit is opened.
They count Three.js `Object3D`, `Mesh`, and `Texture` instances removed from that
initial path. Shared application roots that remain empty are not counted as
removed.

| Initial allocation | Phase 9.0 | Phase 9.1 | Change |
| --- | ---: | ---: | ---: |
| Exhibit/zone `Object3D` instances | 421 | 0 | -421 |
| Exhibit/zone meshes | 382 | 0 | -382 |
| Exhibit/zone textures | 19 | 0 | -19 |

Phase 9.0 constructed both complete exhibit models (356 objects, 333 meshes,
17 canvas textures) and both zone environments (65 objects, 49 meshes, two
canvas textures) during application startup. Phase 9.1 retains only metadata
and empty scene roots at startup. A selected zone owns its environment and
lightweight preview resources until the visitor returns to the showroom; a
selected exhibit owns its full model and controllers until its Viewer exit
transition completes.
