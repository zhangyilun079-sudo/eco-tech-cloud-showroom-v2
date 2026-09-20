import { MOUSE, PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Begin above and beyond the arrival threshold. The wide entrance perspective
// establishes the unobstructed hall, data core, and several perimeter bays in
// one view before the visitor starts navigating.
const INITIAL_CAMERA_POSITION = new Vector3(8.8, 8.6, 21.5);
const INITIAL_TARGET = new Vector3(0, 1.65, -1.5);
const MIN_TARGET = new Vector3(-11, 0.75, -9);
const MAX_TARGET = new Vector3(11, 5, 9);

export interface CameraState {
  readonly position: Vector3;
  readonly target: Vector3;
}

export class CameraController {
  public readonly camera: PerspectiveCamera;
  public readonly controls: OrbitControls;
  private readonly constrainedTarget = new Vector3();
  private readonly targetCorrection = new Vector3();
  private readonly canvas: HTMLCanvasElement;
  private readonly preventContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
  };

  public constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.camera = new PerspectiveCamera(56, 1, 0.1, 120);
    this.camera.position.copy(INITIAL_CAMERA_POSITION);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.copy(INITIAL_TARGET);
    // Direct manipulation is intentional: the view must stop with the pointer,
    // rather than continuing to drift around precision exhibits.
    this.controls.enableDamping = false;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 34;
    this.controls.maxPolarAngle = Math.PI * 0.48;
    this.controls.minPolarAngle = Math.PI * 0.16;
    this.controls.enablePan = true;
    this.controls.panSpeed = 1.15;
    this.controls.screenSpacePanning = true;
    this.controls.enableZoom = true;
    this.controls.mouseButtons.LEFT = MOUSE.ROTATE;
    this.controls.mouseButtons.MIDDLE = MOUSE.DOLLY;
    this.controls.mouseButtons.RIGHT = MOUSE.PAN;
    this.canvas.addEventListener('contextmenu', this.preventContextMenu);
    this.controls.update();
  }

  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public update(): void {
    this.controls.update();
    if (this.controls.enabled) this.constrainTargetToShowroom();
  }

  public captureState(): CameraState {
    return { position: this.camera.position.clone(), target: this.controls.target.clone() };
  }

  public applyState(state: CameraState): void {
    this.camera.position.copy(state.position);
    this.controls.target.copy(state.target);
    this.camera.lookAt(state.target);
  }

  public setNavigationEnabled(enabled: boolean): void {
    this.controls.enabled = enabled;
  }

  public reset(): void {
    this.camera.position.copy(INITIAL_CAMERA_POSITION);
    this.controls.target.copy(INITIAL_TARGET);
    this.controls.update();
  }

  public dispose(): void {
    this.canvas.removeEventListener('contextmenu', this.preventContextMenu);
    this.controls.dispose();
  }

  private constrainTargetToShowroom(): void {
    this.constrainedTarget.copy(this.controls.target).clamp(MIN_TARGET, MAX_TARGET);
    this.targetCorrection.subVectors(this.constrainedTarget, this.controls.target);

    if (this.targetCorrection.lengthSq() === 0) return;

    this.controls.target.copy(this.constrainedTarget);
    this.camera.position.add(this.targetCorrection);
  }
}
