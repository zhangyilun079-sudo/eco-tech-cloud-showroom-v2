import {
  AmbientLight,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  RectAreaLight,
} from 'three';

export class LightingRig extends Group {
  public constructor() {
    super();
    this.name = 'Professional lighting rig';

    const skyFill = new HemisphereLight(new Color('#d9f4ed'), new Color('#28312e'), 1.6);
    const ambient = new AmbientLight('#b9d5cc', 0.45);

    const sun = new DirectionalLight('#fff5df', 3.1);
    sun.position.set(-7, 11, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 35;
    sun.shadow.camera.left = -14;
    sun.shadow.camera.right = 14;
    sun.shadow.camera.top = 12;
    sun.shadow.camera.bottom = -12;
    sun.shadow.bias = -0.00015;

    const architecturalLight = new RectAreaLight('#b7ffe4', 15, 5, 3);
    architecturalLight.position.set(0, 6.8, -8.8);
    architecturalLight.lookAt(0, 2, 0);

    this.add(skyFill, ambient, sun, architecturalLight);
  }
}
