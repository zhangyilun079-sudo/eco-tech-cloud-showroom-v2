import {
  AdditiveBlending,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  ConeGeometry,
  Group,
  Line,
  LineBasicMaterial,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from 'three';
import type { ExhibitProcessStepDefinition } from '../ExhibitDefinition';

interface AnimatedIndicator {
  readonly mesh: Mesh;
  readonly offset: number;
}

/** Owns process highlighting and lightweight, local-space flow graphics. */
export class ProcessVisualizer {
  private readonly overlay = new Group();
  private readonly components = new Map<string, Object3D>();
  private readonly originalMaterials = new Map<Mesh, Material | Material[]>();
  private curve: CatmullRomCurve3 | null = null;
  private indicators: AnimatedIndicator[] = [];
  private elapsed = 0;
  private speed = 0.2;

  public constructor(private readonly root: Object3D) {
    this.overlay.name = 'process-flow-visualization';
    this.overlay.renderOrder = 10;
    root.add(this.overlay);
    root.children.forEach((object) => {
      const id = object.userData.componentId as string | undefined;
      if (id) this.components.set(id, object);
    });
  }

  public show(step: ExhibitProcessStepDefinition): void {
    this.clearFlow();
    this.applyHighlight(step);
    if (step.processPath.length < 2) return;
    this.curve = new CatmullRomCurve3(step.processPath.map((point) => new Vector3(point.x, point.y, point.z)), false, 'centripetal');
    const color = new Color(step.visualState.color);
    const lineGeometry = new BufferGeometry().setFromPoints(this.curve.getPoints(80));
    const glow = new Line(lineGeometry, new LineBasicMaterial({ color, transparent: true, opacity: 0.82, blending: AdditiveBlending, depthWrite: false }));
    glow.userData.processResource = true;
    this.overlay.add(glow);
    const indicatorGeometry = new ConeGeometry(0.09, 0.24, 8);
    const indicatorMaterial = new MeshBasicMaterial({ color, transparent: true, opacity: 0.95, blending: AdditiveBlending, depthWrite: false });
    this.indicators = Array.from({ length: 7 }, (_, index) => {
      const mesh = new Mesh(indicatorGeometry, indicatorMaterial);
      mesh.userData.processResource = index === 0;
      this.overlay.add(mesh);
      return { mesh, offset: index / 7 };
    });
    this.speed = step.visualState.particleSpeed ?? 0.2;
    this.elapsed = 0;
    this.overlay.visible = true;
    this.update(0);
  }

  public update(deltaSeconds: number): void {
    if (!this.curve) return;
    this.elapsed += deltaSeconds * this.speed;
    for (const indicator of this.indicators) {
      const progress = (this.elapsed + indicator.offset) % 1;
      indicator.mesh.position.copy(this.curve.getPointAt(progress));
      const tangent = this.curve.getTangentAt(progress).normalize();
      indicator.mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), tangent);
      const pulse = 0.8 + Math.sin((this.elapsed + indicator.offset) * Math.PI * 2) * 0.18;
      indicator.mesh.scale.setScalar(pulse);
    }
  }

  public reset(): void {
    this.clearFlow();
    this.restoreMaterials();
  }

  public dispose(): void {
    this.reset();
    this.root.remove(this.overlay);
  }

  private applyHighlight(step: ExhibitProcessStepDefinition): void {
    this.restoreMaterials();
    const activeIds = new Set(step.relatedComponents);
    this.components.forEach((component, id) => component.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      this.originalMaterials.set(object, object.material);
      const materials = (Array.isArray(object.material) ? object.material : [object.material]).map((material) => {
        const clone = material.clone();
        clone.transparent = true;
        clone.opacity = activeIds.has(id) ? 1 : 0.16;
        clone.depthWrite = activeIds.has(id);
        if (clone instanceof MeshStandardMaterial && activeIds.has(id)) {
          clone.emissive.set(step.visualState.color);
          clone.emissiveIntensity = 0.42;
        }
        return clone;
      });
      object.material = Array.isArray(object.material) ? materials : materials[0]!;
    }));
  }

  private restoreMaterials(): void {
    this.originalMaterials.forEach((material, mesh) => {
      const current = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      current.forEach((item) => item.dispose());
      mesh.material = material;
    });
    this.originalMaterials.clear();
  }

  private clearFlow(): void {
    this.overlay.children.forEach((child) => {
      if (child instanceof Line || child instanceof Mesh) {
        child.geometry.dispose();
        if (child.userData.processResource) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material) => material.dispose());
        }
      }
    });
    this.overlay.clear();
    this.overlay.visible = false;
    this.curve = null;
    this.indicators = [];
  }
}
