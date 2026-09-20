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
    this.name = 'Daylight exhibition lighting rig';

    const skyFill = new HemisphereLight(new Color('#f4fdff'), new Color('#91aaa7'), 1.3);
    const ambient = new AmbientLight('#eaf8f5', 0.34);

    const sun = new DirectionalLight('#fffdf4', 2.35);
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

    const architecturalLight = new RectAreaLight('#c9fff5', 8, 11, 3.5);
    architecturalLight.position.set(0, 7.4, -9.5);
    architecturalLight.lookAt(0, 2, 0);

    const entranceFill = new RectAreaLight('#e8fbff', 5, 12, 4);
    entranceFill.position.set(0, 6.2, 10);
    entranceFill.lookAt(0, 1.5, 0);

    this.add(skyFill, ambient, sun, architecturalLight, entranceFill);
  }
}
