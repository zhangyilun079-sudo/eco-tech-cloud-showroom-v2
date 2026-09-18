import { Clock, Color, Fog, Scene } from 'three';
import { ExhibitRegistry } from '../exhibits/ExhibitRegistry';
import { HotspotManager } from '../interaction/HotspotManager';
import { Showroom } from '../showroom/Showroom';
import { InfoPanel } from '../ui/InfoPanel';
import { CameraController } from './CameraController';
import { LightingRig } from './LightingRig';
import { RendererManager } from './RendererManager';

export class ShowroomApplication {
  private readonly scene = new Scene();
  private readonly renderer: RendererManager;
  private readonly camera: CameraController;
  private readonly showroom = new Showroom();
  private readonly exhibits = new ExhibitRegistry();
  private readonly infoPanel: InfoPanel;
  private readonly hotspots: HotspotManager;
  private readonly clock = new Clock();
  private animationFrameId: number | null = null;

  public constructor(private readonly container: HTMLElement) {
    this.renderer = new RendererManager(container);
    this.camera = new CameraController(this.renderer.renderer.domElement);
    this.infoPanel = new InfoPanel(container, () => this.camera.reset());
    this.hotspots = new HotspotManager(
      this.showroom.zones,
      this.camera.camera,
      this.renderer.renderer.domElement,
      this.infoPanel,
    );

    this.scene.background = new Color('#07120f');
    this.scene.fog = new Fog('#07120f', 22, 46);
    this.scene.add(new LightingRig(), this.showroom.group, this.exhibits.group, this.hotspots.group);

    window.addEventListener('resize', this.handleResize);
    this.handleResize();
  }

  public start(): void {
    if (this.animationFrameId !== null) return;
    this.clock.start();
    this.animate();
  }

  public dispose(): void {
    if (this.animationFrameId !== null) cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.handleResize);
    this.showroom.dispose();
    this.exhibits.dispose();
    this.hotspots.dispose();
    this.infoPanel.dispose();
    this.camera.dispose();
    this.renderer.dispose();
  }

  private readonly handleResize = (): void => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.resize(width, height);
    this.renderer.resize(width, height);
  };

  private readonly animate = (): void => {
    const delta = Math.min(this.clock.getDelta(), 0.1);
    this.camera.update();
    this.exhibits.update(delta);
    this.hotspots.update(delta);
    this.renderer.renderer.render(this.scene, this.camera.camera);
    this.animationFrameId = requestAnimationFrame(this.animate);
  };
}
