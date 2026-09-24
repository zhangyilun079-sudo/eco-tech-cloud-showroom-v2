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
  private readonly clickPosition = new Vector2();
  private moveFrameId: number | null = null;
  private latestMoveEvent: PointerEvent | null = null;

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
    if (this.moveFrameId !== null) cancelAnimationFrame(this.moveFrameId);
  }

  private readonly handlePointerMove = (event: PointerEvent): void => {
    // Pointer events can arrive much faster than display refresh. Coalesce them
    // so at most one raycast runs for a rendered frame.
    this.latestMoveEvent = event;
    if (this.moveFrameId !== null) return;
    this.moveFrameId = requestAnimationFrame(() => {
      this.moveFrameId = null;
      if (!this.latestMoveEvent) return;
      this.updatePointer(this.latestMoveEvent);
      this.options.onHover(this.pick());
      this.latestMoveEvent = null;
    });
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.pointerDown.set(event.clientX, event.clientY);
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    this.clickPosition.set(event.clientX, event.clientY);
    if (this.pointerDown.distanceTo(this.clickPosition) > 5) return;
    this.updatePointer(event);
    const target = this.pick();
    if (target) this.options.onClick(target);
  };

  private readonly handlePointerLeave = (): void => {
    this.latestMoveEvent = null;
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
    // Three.js does not mutate this array despite its mutable parameter type.
    return this.raycaster.intersectObjects(this.options.getTargets() as Object3D[], false)[0]?.object ?? null;
  }
}
