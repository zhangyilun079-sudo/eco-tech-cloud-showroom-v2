import { MathUtils, Vector2, Vector3 } from 'three';
import type { CameraController, CameraState } from '../core/CameraController';
import { ViewMode, type ViewModeState } from '../core/ViewMode';
import type { InfoPanel } from '../ui/InfoPanel';
import type { Exhibit } from './Exhibit';

const TRANSITION_DURATION = 0.85;

interface Transition {
  readonly from: CameraState;
  readonly to: CameraState;
  elapsed: number;
  readonly onComplete?: () => void;
}

export class ExhibitViewer {
  private activeExhibit: Exhibit | null = null;
  private showroomCameraState: CameraState | null = null;
  private transition: Transition | null = null;
  private pointerId: number | null = null;
  private readonly pointerPosition = new Vector2();
  private zoomDistance = 5.2;

  public constructor(
    private readonly cameraController: CameraController,
    private readonly canvas: HTMLCanvasElement,
    private readonly viewMode: ViewModeState,
    private readonly infoPanel: InfoPanel,
    private readonly onReturnToShowroom: () => void,
  ) {
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    canvas.addEventListener('pointercancel', this.handlePointerUp);
    canvas.addEventListener('wheel', this.handleWheel, { passive: false });
  }

  public enter(exhibit: Exhibit, position: Vector3): void {
    if (this.viewMode.mode !== ViewMode.SHOWROOM) return;

    this.viewMode.set(ViewMode.EXHIBIT);
    this.showroomCameraState = this.cameraController.captureState();
    this.cameraController.setNavigationEnabled(false);
    this.activeExhibit = exhibit;
    exhibit.object.position.copy(position);
    exhibit.object.rotation.set(0, -0.25, 0);
    exhibit.object.visible = true;
    this.zoomDistance = 5.2;

    const target = position.clone().add(new Vector3(0, 1.35, 0));
    const destination = { position: target.clone().add(new Vector3(0, 0.65, this.zoomDistance)), target };
    this.beginTransition(destination);
    this.infoPanel.showExhibit(exhibit.metadata);
    this.canvas.classList.add('is-exhibit-mode');
  }

  public exit(): void {
    if (this.viewMode.mode !== ViewMode.EXHIBIT || !this.showroomCameraState) return;
    this.pointerId = null;
    this.beginTransition(this.showroomCameraState, () => {
      if (this.activeExhibit) this.activeExhibit.object.visible = false;
      this.activeExhibit = null;
      this.showroomCameraState = null;
      this.viewMode.set(ViewMode.SHOWROOM);
      this.cameraController.setNavigationEnabled(true);
      this.onReturnToShowroom();
    });
    this.infoPanel.hideExhibit();
    this.canvas.classList.remove('is-exhibit-mode');
  }

  public update(deltaSeconds: number): void {
    if (!this.transition) return;
    this.transition.elapsed = Math.min(this.transition.elapsed + deltaSeconds, TRANSITION_DURATION);
    const linearProgress = this.transition.elapsed / TRANSITION_DURATION;
    const easedProgress = linearProgress * linearProgress * (3 - 2 * linearProgress);
    this.cameraController.applyState({
      position: this.transition.from.position.clone().lerp(this.transition.to.position, easedProgress),
      target: this.transition.from.target.clone().lerp(this.transition.to.target, easedProgress),
    });
    if (linearProgress === 1) {
      const completion = this.transition.onComplete;
      this.transition = null;
      completion?.();
    }
  }

  public dispose(): void {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
    this.canvas.removeEventListener('wheel', this.handleWheel);
  }

  private beginTransition(to: CameraState, onComplete?: () => void): void {
    this.transition = { from: this.cameraController.captureState(), to, elapsed: 0, onComplete };
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (this.viewMode.mode !== ViewMode.EXHIBIT || this.transition || event.button !== 0) return;
    this.pointerId = event.pointerId;
    this.pointerPosition.set(event.clientX, event.clientY);
    this.canvas.setPointerCapture(event.pointerId);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId || !this.activeExhibit) return;
    const deltaX = event.clientX - this.pointerPosition.x;
    const deltaY = event.clientY - this.pointerPosition.y;
    this.activeExhibit.object.rotation.y += deltaX * 0.009;
    this.activeExhibit.object.rotation.x = MathUtils.clamp(
      this.activeExhibit.object.rotation.x + deltaY * 0.005,
      -0.3,
      0.3,
    );
    this.pointerPosition.set(event.clientX, event.clientY);
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    this.pointerId = null;
    if (this.canvas.hasPointerCapture(event.pointerId)) this.canvas.releasePointerCapture(event.pointerId);
  };

  private readonly handleWheel = (event: WheelEvent): void => {
    if (this.viewMode.mode !== ViewMode.EXHIBIT || this.transition || !this.activeExhibit) return;
    event.preventDefault();
    this.zoomDistance = MathUtils.clamp(this.zoomDistance + event.deltaY * 0.004, 3.4, 7.2);
    const target = this.activeExhibit.object.position.clone().add(new Vector3(0, 1.35, 0));
    this.cameraController.applyState({
      position: target.clone().add(new Vector3(0, 0.65, this.zoomDistance)),
      target,
    });
  };
}
