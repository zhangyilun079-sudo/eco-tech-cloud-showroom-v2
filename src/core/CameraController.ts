import { PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class CameraController {
  public readonly camera: PerspectiveCamera;
  public readonly controls: OrbitControls;

  public constructor(canvas: HTMLCanvasElement) {
    this.camera = new PerspectiveCamera(48, 1, 0.1, 120);
    this.camera.position.set(10, 6.5, 13);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.set(0, 2.2, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 27;
    this.controls.maxPolarAngle = Math.PI * 0.48;
    this.controls.minPolarAngle = Math.PI * 0.16;
    this.controls.enablePan = false;
    this.controls.update();
  }

  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public update(): void {
    this.controls.update();
  }

  public reset(): void {
    this.camera.position.set(10, 6.5, 13);
    this.controls.target.copy(new Vector3(0, 2.2, 0));
    this.controls.update();
  }

  public dispose(): void {
    this.controls.dispose();
  }
}
