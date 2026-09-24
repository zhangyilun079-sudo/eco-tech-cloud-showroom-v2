# RTO reference image asset

The current RTO exhibit is intentionally driven by the user's original exhibit image rather than guessed 3D geometry.

Deploy the unchanged source image at:

`public/assets/images/rto-three-bed-reference.png`

The runtime URL is:

`/assets/images/rto-three-bed-reference.png`

Do not substitute a redrawn or simplified RTO image. Viewer and ZONE_04 use the same asset provider so their default appearance stays identical.

When a verified original 3D model is supplied later, switch the RTO asset provider from `reference-image` to `real-gltf` without rewriting Viewer, Zone, hotspot, or navigation code.
