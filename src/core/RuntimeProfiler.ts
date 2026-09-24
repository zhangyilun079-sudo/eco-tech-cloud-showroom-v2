import { Light, Material, Mesh, Object3D, Scene, WebGLRenderer } from 'three';

export interface PerformanceDebugControls {
  enabled: boolean;
  shadows: boolean;
  animations: boolean;
  hotspots: boolean;
  postprocessing: boolean;
}

declare global {
  interface Window {
    performanceDebug: PerformanceDebugControls;
    /** @deprecated Use window.performanceDebug directly. */
    performanceDebugFeatures: PerformanceDebugControls;
  }
}

interface RuntimeProfilerOptions {
  renderer: WebGLRenderer;
  scene: Scene;
  modules: Record<string, Object3D>;
  hotspots: Object3D;
  getAnimationObjects: () => readonly string[];
  setPostprocessingEnabled: (enabled: boolean) => boolean;
}

const REPORT_INTERVAL_MS = 2000;
const FEATURE_KEYS = ['shadows', 'animations', 'hotspots', 'postprocessing'] as const;
type FeatureKey = typeof FEATURE_KEYS[number];

export class RuntimeProfiler {
  private frameCount = 0;
  private periodStartedAt = performance.now();
  private previousFps: number | null = null;
  private readonly pendingFeatureChanges = new Map<FeatureKey, number | null>();
  private readonly appliedFeatures: Record<FeatureKey, boolean>;
  private readonly shadowLights = new Map<Light, boolean>();
  private readonly controls: PerformanceDebugControls;

  public constructor(private readonly options: RuntimeProfilerOptions) {
    const previous = window.performanceDebug as PerformanceDebugControls | boolean | undefined;
    this.controls = typeof previous === 'object' ? previous : {
      enabled: previous === true,
      shadows: true,
      animations: true,
      hotspots: true,
      postprocessing: false,
    };
    // Accessors retain the old `window.performanceDebug = true/false` workflow
    // while making the requested window.performanceDebug.animations API real.
    Object.defineProperty(window, 'performanceDebug', {
      configurable: true,
      get: () => this.controls,
      set: (value: boolean | PerformanceDebugControls) => {
        if (typeof value === 'boolean') this.controls.enabled = value;
        else Object.assign(this.controls, value);
      },
    });
    Object.defineProperty(window, 'performanceDebugFeatures', {
      configurable: true,
      get: () => this.controls,
      set: (value: PerformanceDebugControls) => Object.assign(this.controls, value),
    });
    this.options.scene.traverse((object) => {
      if (object instanceof Light && object.castShadow) this.shadowLights.set(object, true);
    });
    this.appliedFeatures = Object.fromEntries(
      FEATURE_KEYS.map((key) => [key, this.effectiveFeature(key)]),
    ) as Record<FeatureKey, boolean>;
    this.applyFeatureToggles();
    console.info('[PerformanceDebug] Toggle window.performanceDebug.{shadows, animations, hotspots, postprocessing}; set .enabled = true for reports.');
  }

  public get animationsEnabled(): boolean { return this.controls.animations; }
  public get hotspotsEnabled(): boolean { return this.controls.hotspots; }

  /** Applies controls before scheduled updates and rendering in the current frame. */
  public applyFeatureToggles(): void {
    const shadowsEnabled = this.controls.shadows;
    this.options.renderer.shadowMap.enabled = shadowsEnabled;
    this.options.renderer.shadowMap.autoUpdate = shadowsEnabled;
    this.shadowLights.forEach((original, light) => { light.castShadow = shadowsEnabled && original; });
    this.options.hotspots.visible = this.controls.hotspots;
    const postprocessingActive = this.options.setPostprocessingEnabled(this.controls.postprocessing);

    for (const key of FEATURE_KEYS) {
      const current = key === 'postprocessing' ? postprocessingActive : this.controls[key];
      if (current === this.appliedFeatures[key]) continue;
      console.info(`[PerformanceDebug] ${key} ${current ? 'enabled' : 'disabled'}; FPS delta will appear in the next report.`);
      this.pendingFeatureChanges.set(key, this.previousFps);
      this.appliedFeatures[key] = current;
    }
  }

  public update(now = performance.now()): void {
    if (!this.controls.enabled) {
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
    this.options.renderer.shadowMap.autoUpdate = true;
    this.shadowLights.forEach((original, light) => { light.castShadow = original; });
    this.options.hotspots.visible = true;
    this.options.setPostprocessingEnabled(true);
  }

  private effectiveFeature(key: FeatureKey): boolean {
    if (key === 'postprocessing') return this.options.setPostprocessingEnabled(this.controls[key]);
    return this.controls[key];
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
    const modules = Object.fromEntries(Object.entries(this.options.modules).map(([name, root]) => [name, this.countVisible(root)]));
    const activeAnimations = this.options.getAnimationObjects();
    const toggleFpsChanges = Object.fromEntries([...this.pendingFeatureChanges].map(([feature, baseline]) => [
      feature, baseline === null ? 'baseline unavailable' : Number((fps - baseline).toFixed(1)),
    ]));

    console.info('[PerformanceDebug] runtime profile', {
      fps: Number(fps.toFixed(1)),
      fpsChange: this.previousFps === null ? 'baseline' : Number((fps - this.previousFps).toFixed(1)),
      renderer: { calls: render.calls, triangles: render.triangles, points: render.points, lines: render.lines, geometries: memory.geometries, textures: memory.textures },
      scene: { visibleObjects: visibleObjects.length, visibleMeshes: visibleObjects.filter((object) => object instanceof Mesh).length, materials: materials.size },
      modules: { ...modules, animationObjects: activeAnimations.length },
      activeAnimations,
      features: { ...this.appliedFeatures },
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
