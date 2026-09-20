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

    const skyFill = new HemisphereLight(new Color('#2d5961'), new Color('#020608'), 0.46);
    const ambient = new AmbientLight('#9cded9', 0.12);

    const sun = new DirectionalLight('#b7edeb', 0.55);
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

    const architecturalLight = new RectAreaLight('#68e9e4', 4.2, 11, 3.5);
    architecturalLight.position.set(0, 7.4, -9.5);
    architecturalLight.lookAt(0, 2, 0);

    const entranceFill = new RectAreaLight('#79d9dd', 1.8, 12, 4);
    entranceFill.position.set(0, 6.2, 10);
    entranceFill.lookAt(0, 1.5, 0);

    // Narrow, soft spotlights keep each display bay legible without competing
    // with the architectural daylight or turning the room into a glowing set.
    const bayPositions: readonly [number, number, number][] = [
      [-8.4, 6.5, -6.8], [0, 6.5, -6.8], [8.4, 6.5, -6.8],
      [-11.2, 6.1, 1.25], [11.2, 6.1, 1.25],
    ];
    bayPositions.forEach(([x, y, z], index) => {
      const target = new Object3D();
      target.position.set(x, 0.8, index < 3 ? -8.25 : 1.25);
      const spot = new SpotLight(index % 2 ? '#66eab0' : '#63dcf0', 12, 10, Math.PI / 7, 0.72, 1.65);
      spot.position.set(x, y, z);
      spot.target = target;
      this.add(spot, target);
    });

    this.add(skyFill, ambient, sun, architecturalLight, entranceFill);
  }
}
