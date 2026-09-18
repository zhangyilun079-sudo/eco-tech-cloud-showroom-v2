import { Camera, Object3D, Raycaster, Vector2 } from 'three';

interface RaycastManagerOptions {
  readonly camera: Camera;
  readonly canvas: HTMLCanvasElement;
  readonly getTargets: () => readonly Object3D[];
  readonly onHover: (target: Object3D | null) => void;
  readonly onClick: (target: Object3D) => void;
}

/** Converts pointer input into hover and click events without interfering with camera drags. */
export class RaycastManager {
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();
  private readonly pointerDown = new Vector2();
  private readonly options: RaycastManagerOptions;

  public constructor(options: RaycastManagerOptions) {
    this.options = options;
    options.canvas.addEventListener('pointermove', this.handlePointerMove);
    options.canvas.addEventListener('pointerdown', this.handlePointerDown);
    options.canvas.addEventListener('pointerup', this.handlePointerUp);
    options.canvas.addEventListener('pointerleave', this.handlePointerLeave);
  }

  public dispose(): void {
    const { canvas } = this.options;
    canvas.removeEventListener('pointermove', this.handlePointerMove);
    canvas.removeEventListener('pointerdown', this.handlePointerDown);
    canvas.removeEventListener('pointerup', this.handlePointerUp);
    canvas.removeEventListener('pointerleave', this.handlePointerLeave);
  }

  private readonly handlePointerMove = (event: PointerEvent): void => {
    this.updatePointer(event);
    this.options.onHover(this.pick());
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.pointerDown.set(event.clientX, event.clientY);
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (this.pointerDown.distanceTo(new Vector2(event.clientX, event.clientY)) > 5) return;
    this.updatePointer(event);
    const target = this.pick();
    if (target) this.options.onClick(target);
  };

  private readonly handlePointerLeave = (): void => {
    this.options.onHover(null);
  };

  private updatePointer(event: PointerEvent): void {
    const bounds = this.options.canvas.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
    );
  }

  private pick(): Object3D | null {
    this.raycaster.setFromCamera(this.pointer, this.options.camera);
    return this.raycaster.intersectObjects([...this.options.getTargets()], false)[0]?.object ?? null;
  }
}
