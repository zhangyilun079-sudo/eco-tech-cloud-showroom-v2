import { MathUtils, Object3D, Vector3 } from 'three';

export interface ExplosionTransformTransition {
  readonly object: Object3D;
  readonly from: Vector3;
  readonly to: Vector3;
}

/** Lightweight position tween used by exploded-view controllers. */
export class ExplosionAnimation {
  private transitions: readonly ExplosionTransformTransition[] = [];
  private elapsed = 0;
  private duration = 0;

  public get isRunning(): boolean {
    return this.transitions.length > 0;
  }

  public start(transitions: readonly ExplosionTransformTransition[], durationSeconds = 0.65): void {
    this.transitions = transitions;
    this.elapsed = 0;
    this.duration = Math.max(0, durationSeconds);
    if (this.duration === 0) this.finish();
  }

  public update(deltaSeconds: number): void {
    if (!this.isRunning) return;
    this.elapsed = Math.min(this.elapsed + Math.max(0, deltaSeconds), this.duration);
    const progress = this.duration === 0 ? 1 : this.elapsed / this.duration;
    const easedProgress = MathUtils.smoothstep(progress, 0, 1);
    for (const transition of this.transitions) {
      transition.object.position.lerpVectors(transition.from, transition.to, easedProgress);
    }
    if (progress === 1) this.transitions = [];
  }

  public finish(): void {
    for (const transition of this.transitions) transition.object.position.copy(transition.to);
    this.transitions = [];
  }
}
