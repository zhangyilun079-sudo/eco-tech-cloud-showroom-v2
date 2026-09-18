import { MathUtils, Object3D, Vector3 } from 'three';

export interface ExplosionTransformTransition {
  readonly object: Object3D;
  readonly from: Vector3;
  readonly to: Vector3;
  /** Delay lets the process modules separate in a readable technical sequence. */
  readonly delay?: number;
}

/** Lightweight position tween used by exploded-view controllers. */
export class ExplosionAnimation {
  private transitions: readonly ExplosionTransformTransition[] = [];
  private elapsed = 0;
  private duration = 0;

  public get isRunning(): boolean {
    return this.transitions.length > 0;
  }

  public start(transitions: readonly ExplosionTransformTransition[], durationSeconds = 1.05): void {
    this.transitions = transitions;
    this.elapsed = 0;
    this.duration = Math.max(0, durationSeconds);
    if (this.duration === 0) this.finish();
  }

  public update(deltaSeconds: number): void {
    if (!this.isRunning) return;
    this.elapsed = Math.min(this.elapsed + Math.max(0, deltaSeconds), this.duration);
    for (const transition of this.transitions) {
      const delay = MathUtils.clamp(transition.delay ?? 0, 0, 0.8);
      const localProgress = this.duration === 0
        ? 1
        : MathUtils.clamp((this.elapsed / this.duration - delay) / (1 - delay), 0, 1);
      // Smootherstep eases both acceleration and braking for a measured, technical motion.
      const easedProgress = localProgress ** 3 * (localProgress * (localProgress * 6 - 15) + 10);
      transition.object.position.lerpVectors(transition.from, transition.to, easedProgress);
    }
    const progress = this.duration === 0 ? 1 : this.elapsed / this.duration;
    if (progress === 1) this.transitions = [];
  }

  public finish(): void {
    for (const transition of this.transitions) transition.object.position.copy(transition.to);
    this.transitions = [];
  }
}
