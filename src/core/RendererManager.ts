import { ACESFilmicToneMapping, PCFSoftShadowMap, SRGBColorSpace, WebGLRenderer } from 'three';

export class RendererManager {
  public readonly renderer: WebGLRenderer;

  public constructor(container: HTMLElement) {
    this.renderer = new WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.domElement.setAttribute('aria-label', 'Interactive 3D eco technology showroom');
    container.prepend(this.renderer.domElement);
  }

  public resize(width: number, height: number): void {
    this.renderer.setSize(width, height, false);
  }

  public dispose(): void {
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
