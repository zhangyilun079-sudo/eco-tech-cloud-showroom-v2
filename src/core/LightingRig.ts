import {
  AmbientLight,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  RectAreaLight,
  SpotLight,
  Object3D,
} from 'three';

export class LightingRig extends Group {
  public constructor() {
    super();
    this.name = 'Intelligent hall low-key lighting rig';

    const skyFill = new HemisphereLight(new Color('#315d66'), new Color('#020608'), 0.52);
    const ambient = new AmbientLight('#92cbc8', 0.1);

    const sun = new DirectionalLight('#b7edeb', 0.48);
    sun.position.set(-8, 13, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 35;
    sun.shadow.camera.left = -14;
    sun.shadow.camera.right = 14;
    sun.shadow.camera.top = 12;
    sun.shadow.camera.bottom = -12;
    sun.shadow.bias = -0.00015;

    const architecturalLight = new RectAreaLight('#68d9dc', 3.2, 11, 3.5);
    architecturalLight.position.set(0, 7.4, -9.5);
    architecturalLight.lookAt(0, 2, 0);

    const entranceFill = new RectAreaLight('#79dedb', 2.7, 12, 5);
    entranceFill.position.set(0, 6.4, 14.5);
    entranceFill.lookAt(0, 2.2, 5);

    const arrivalFill = new RectAreaLight('#75dfb8', 1.8, 9, 2.5);
    arrivalFill.position.set(0, 3.2, 18.4);
    arrivalFill.lookAt(0, 0, 13.5);

    const portalWashLeft = new SpotLight('#75efe1', 14, 14, Math.PI / 8, 0.82, 1.5);
    portalWashLeft.position.set(-5.4, 7.9, 16.5);
    const portalTargetLeft = new Object3D();
    portalTargetLeft.position.set(-5.4, 3.5, 13.7);
    portalWashLeft.target = portalTargetLeft;
    const portalWashRight = new SpotLight('#79eeb5', 14, 14, Math.PI / 8, 0.82, 1.5);
    portalWashRight.position.set(5.4, 7.9, 16.5);
    const portalTargetRight = new Object3D();
    portalTargetRight.position.set(5.4, 3.5, 13.7);
    portalWashRight.target = portalTargetRight;

    // Narrow, soft spotlights keep each display bay legible without competing
    // with the architectural daylight or turning the room into a glowing set.
    const bayPositions: readonly [number, number, number][] = [
      [-8.4, 6.5, -6.8], [0, 6.5, -6.8], [8.4, 6.5, -6.8],
      [-11.2, 6.1, 1.25], [11.2, 6.1, 1.25],
    ];
    bayPositions.forEach(([x, y, z], index) => {
      const target = new Object3D();
      target.position.set(x, 0.8, index < 3 ? -8.25 : 1.25);
      const spot = new SpotLight(index % 2 ? '#66eab0' : '#63dcf0', 10, 10, Math.PI / 7, 0.78, 1.75);
      spot.position.set(x, y, z);
      spot.target = target;
      this.add(spot, target);
    });

    // Broad, low-energy wall grazers reveal the cylinder and its ribs without
    // flattening the dark shell or competing with the display accents.
    for (const x of [-9, 0, 9]) {
      const grazer = new RectAreaLight('#376f78', 1.35, 4.8, 5.6);
      grazer.position.set(x, 4.1, -13.2);
      grazer.lookAt(x * 0.72, 4, -14.6);
      this.add(grazer);
    }

    this.add(
      skyFill, ambient, sun, architecturalLight, entranceFill, arrivalFill,
      portalWashLeft, portalTargetLeft, portalWashRight, portalTargetRight,
    );
  }
}
