# RTO source image asset

The current RTO exhibit uses the user's original exhibit image as the verified front-view texture for a **real multi-part 3D relief reconstruction**.

Runtime source:

`public/assets/images/rto-three-bed-reference.png`

The loader:
- samples the image,
- removes only border-connected white background,
- partitions visible pixels into semantic components,
- builds separate front surfaces plus real side/depth geometry,
- keeps those component groups addressable for hotspots and exploded-view motion,
- allows limited rotation so the visitor can see real parallax and depth.

This is not a flat billboard. The original image remains the front-view truth because only one source view is currently available; unseen back surfaces are intentionally treated as inferred.

When a verified original 3D model becomes available, switch the asset provider from `reference-relief` to `real-gltf` without rewriting Viewer, Zone, hotspot, process, or navigation code.
