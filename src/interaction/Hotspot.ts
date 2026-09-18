import { CanvasTexture, Group, Sprite, SpriteMaterial, SRGBColorSpace, Vector3 } from 'three';

export interface HotspotOptions {
  readonly id: string;
  readonly position: Vector3;
  readonly title: string;
  readonly description: string;
  readonly onClick?: (hotspot: Hotspot) => void;
}

/** A lightweight, billboarded interaction target that can be placed anywhere in the hall. */
export class Hotspot {
  public readonly id: string;
  public readonly title: string;
  public readonly description: string;
  public readonly object = new Group();
  public readonly target: Sprite;
  public isHovered = false;

  private readonly texture: CanvasTexture;
  private readonly material: SpriteMaterial;
  private readonly onClick?: (hotspot: Hotspot) => void;
  private elapsed = 0;

  public constructor(options: HotspotOptions) {
    this.id = options.id;
    this.title = options.title;
    this.description = options.description;
    this.onClick = options.onClick;
    this.object.name = `${this.id} hotspot`;
    this.object.position.copy(options.position);

    this.texture = this.createTexture();
    this.material = new SpriteMaterial({
      map: this.texture,
      color: '#b9ffe0',
      opacity: 0.72,
      transparent: true,
      depthWrite: false,
      depthTest: true,
    });
    this.target = new Sprite(this.material);
    this.target.name = `${this.id} hotspot target`;
    this.target.scale.setScalar(0.72);
    this.target.userData.hotspot = this;
    this.object.add(this.target);
  }

  public setHovered(hovered: boolean): void {
    if (this.isHovered === hovered) return;
    this.isHovered = hovered;
    this.material.color.set(hovered ? '#ffffff' : '#b9ffe0');
    this.material.opacity = hovered ? 1 : 0.72;
    this.target.scale.setScalar(hovered ? 0.94 : 0.72);
  }

  public click(): void {
    this.onClick?.(this);
  }

  public update(deltaSeconds: number): void {
    this.elapsed += deltaSeconds;
    if (!this.isHovered) {
      const scale = 0.72 + Math.sin(this.elapsed * 2) * 0.035;
      this.target.scale.setScalar(scale);
    }
  }

  public dispose(): void {
    this.texture.dispose();
    this.material.dispose();
    this.object.clear();
  }

  private createTexture(): CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (context) {
      context.strokeStyle = 'rgba(183, 255, 222, .92)';
      context.lineWidth = 4;
      context.beginPath();
      context.arc(64, 64, 38, 0, Math.PI * 2);
      context.stroke();
      context.fillStyle = 'rgba(183, 255, 222, .2)';
      context.beginPath();
      context.arc(64, 64, 28, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#eafff5';
      context.beginPath();
      context.arc(64, 64, 7, 0, Math.PI * 2);
      context.fill();
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }
}
