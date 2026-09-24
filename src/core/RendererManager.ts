import { ACESFilmicToneMapping, PCFSoftShadowMap, SRGBColorSpace, WebGLRenderer } from 'three';

export class RendererManager {
  public readonly renderer: WebGLRenderer;
  private lastInfoReport = -Infinity;

  public constructor(container: HTMLElement) {
    this.renderer = new WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
    });
    // 2x DPR renders four times as many fragments and was the main interaction
    // bottleneck on common integrated GPUs. 1.5 keeps edge AA while bounding fill rate.
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.domElement.setAttribute('aria-label', '交互式三维生态科技展厅');
    container.prepend(this.renderer.domElement);
  }

  public resize(width: number, height: number): void {
    this.renderer.setSize(width, height, false);
  }

  /** Periodic, low-overhead visibility into the actual GPU workload. */
  public reportInfo(elapsedSeconds: number): void {
    if (elapsedSeconds - this.lastInfoReport < 5) return;
    this.lastInfoReport = elapsedSeconds;
    const { render, memory } = this.renderer.info;
    console.info('[RendererInfo]', {
      drawCalls: render.calls,
      triangles: render.triangles,
      textures: memory.textures,
      geometries: memory.geometries,
    });
  }

  public dispose(): void {
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
