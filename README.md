# EcoSphere Virtual Showroom

A maintainable Three.js and TypeScript foundation for an eco-technology virtual showroom. The first milestone includes a generated exhibition hall, an orbit camera, professional lighting, and a lightweight information panel—without model-file dependencies or a UI framework.

## Getting started

```bash
npm install
npm run dev
```

Create an optimized production build with `npm run build`.

## Architecture

- `core/` owns the renderer, camera, lighting, animation loop, and resize lifecycle.
- `showroom/` generates the procedural hall and will compose future exhibit layouts.
- `exhibits/` defines the contract and base class for interactive exhibits.
- `ExhibitViewer` owns the transition between `SHOWROOM` and `EXHIBIT` modes, including camera restoration and exhibit-only rotation/zoom input.
- `ui/` owns DOM-based interface components, kept separate from the 3D scene.

The showroom uses only procedural Three.js geometry; no Blender or GLB assets are required.

Select the `ZONE_01` hotspot to open the procedural equipment placeholder. Drag to rotate it, use the mouse wheel to zoom, and select **Return to showroom** to restore the exact previous showroom camera view.
