import { Material, Mesh, Object3D, Scene, WebGLRenderer } from 'three';

export interface PerformanceDebugFeatures {
  shadows: boolean;
  animations: boolean;
  hotspots: boolean;
  postprocessing: boolean;
}

declare global {
  interface Window {
    performanceDebug: boolean;
    performanceDebugFeatures: PerformanceDebugFeatures;
  }
}

interface RuntimeProfilerOptions {
  renderer: WebGLRenderer;
  scene: Scene;
  modules: Record<string, Object3D>;
  hotspots: Object3D;
  getAnimationObjects: () => readonly string[];
}

const REPORT_INTERVAL_MS = 2000;

export class RuntimeProfiler {
  private frameCount = 0;
  private periodStartedAt = performance.now();
  private previousFps: number | null = null;
  private readonly pendingFeatureChanges = new Map<keyof PerformanceDebugFeatures, number | null>();
  private readonly appliedFeatures: PerformanceDebugFeatures;

  public constructor(private readonly options: RuntimeProfilerOptions) {
    window.performanceDebug = window.performanceDebug ?? false;
    window.performanceDebugFeatures = window.performanceDebugFeatures ?? {
      shadows: true,
      animations: true,
      hotspots: true,
      postprocessing: true,
    };
    this.appliedFeatures = { ...window.performanceDebugFeatures };
    console.info('[PerformanceDebug] Set window.performanceDebug = true, then toggle window.performanceDebugFeatures.{shadows, animations, hotspots, postprocessing}.');
  }

  public get animationsEnabled(): boolean {
    return !window.performanceDebug || window.performanceDebugFeatures.animations;
  }

  public update(now = performance.now()): void {
    this.applyFeatureToggles();
    if (!window.performanceDebug) {
      this.frameCount = 0;
      this.periodStartedAt = now;
      this.previousFps = null;
      return;
    }

    this.frameCount += 1;
    const duration = now - this.periodStartedAt;
    if (duration < REPORT_INTERVAL_MS) return;
    const fps = this.frameCount * 1000 / duration;
    this.report(fps);
    this.previousFps = fps;
    this.frameCount = 0;
    this.periodStartedAt = now;
  }

  public dispose(): void {
    this.options.renderer.shadowMap.enabled = true;
    this.options.hotspots.visible = true;
  }

  private applyFeatureToggles(): void {
    const features = window.performanceDebugFeatures;
    for (const key of Object.keys(features) as (keyof PerformanceDebugFeatures)[]) {
      if (features[key] === this.appliedFeatures[key]) continue;
      console.info(`[PerformanceDebug] ${key} ${features[key] ? 'enabled' : 'disabled'}; FPS delta will appear in the next report.`);
      this.pendingFeatureChanges.set(key, this.previousFps);
      this.appliedFeatures[key] = features[key];
    }
    const debugging = window.performanceDebug;
    this.options.renderer.shadowMap.enabled = !debugging || features.shadows;
    this.options.hotspots.visible = !debugging || features.hotspots;
    // There is currently no postprocessing pass. Keeping this flag in the
    // profiling API makes that zero-cost hypothesis explicit in reports.
  }

  private report(fps: number): void {
    const visibleObjects: Object3D[] = [];
    const materials = new Set<Material>();
    this.options.scene.traverseVisible((object) => {
      visibleObjects.push(object);
      if (!(object instanceof Mesh)) return;
      const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
      meshMaterials.forEach((material) => materials.add(material));
    });
    const { render, memory } = this.options.renderer.info;
    const modules = Object.fromEntries(Object.entries(this.options.modules).map(([name, root]) => [
      name,
      this.countVisible(root),
    ]));
    const activeAnimations = this.options.getAnimationObjects();
    const toggleFpsChanges = Object.fromEntries([...this.pendingFeatureChanges].map(([feature, baseline]) => [
      feature,
      baseline === null ? 'baseline unavailable' : Number((fps - baseline).toFixed(1)),
    ]));

    console.info('[PerformanceDebug] runtime profile', {
      fps: Number(fps.toFixed(1)),
      fpsChange: this.previousFps === null ? 'baseline' : Number((fps - this.previousFps).toFixed(1)),
      renderer: {
        calls: render.calls, triangles: render.triangles, points: render.points, lines: render.lines,
        geometries: memory.geometries, textures: memory.textures,
      },
      scene: {
        visibleObjects: visibleObjects.length,
        visibleMeshes: visibleObjects.filter((object) => object instanceof Mesh).length,
        materials: materials.size,
      },
      modules: { ...modules, animationObjects: activeAnimations.length },
      activeAnimations,
      features: { ...window.performanceDebugFeatures },
      toggleFpsChanges,
    });
    this.pendingFeatureChanges.clear();
  }

  private countVisible(root: Object3D): number {
    if (!root.visible) return 0;
    let count = 0;
    root.traverseVisible(() => { count += 1; });
    return count;
  }
}
