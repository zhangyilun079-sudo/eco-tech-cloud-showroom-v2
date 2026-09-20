import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  LineBasicMaterial,
  LineSegments,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  RingGeometry,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
  TorusGeometry,
  Vector3,
} from 'three';

interface Metric {
  readonly label: string;
  readonly value: string;
  readonly unit: string;
  readonly color: string;
}

const METRICS: readonly Metric[] = [
  { label: 'AIR QUALITY', value: '42', unit: 'AQI · GOOD', color: '#64ddd4' },
  { label: 'WATER INDEX', value: '96.4', unit: '% OPTIMAL', color: '#6edfd0' },
  { label: 'ENERGY FLOW', value: '81', unit: '% RENEWABLE', color: '#8cdea8' },
  { label: 'ECO COVER', value: '73.8', unit: '% MONITORED', color: '#76e69d' },
];

/** Lightweight, self-contained visualisation for the showroom's central atrium. */
export class CentralDataCore extends Group {
  private readonly geometries: BufferGeometry[] = [];
  private readonly materials: Material[] = [];
  private readonly textures: Texture[] = [];
  private readonly globe = new Group();
  private readonly orbitRings = new Group();
  private readonly metricPanels = new Group();
  private readonly terminals = new Group();
  private elapsed = 0;

  public constructor() {
    super();
    this.name = 'Smart ecological data core';
    this.createPlatform();
    this.createGlobe();
    this.createMetricPanels();
    this.createTerminals();
    this.createIllumination();
  }

  public update(delta: number): void {
    this.elapsed += delta;
    this.globe.rotation.y += delta * 0.075;
    this.orbitRings.rotation.y -= delta * 0.045;
    this.orbitRings.rotation.z = Math.sin(this.elapsed * 0.18) * 0.08;
    this.terminals.children.forEach((terminal, index) => {
      terminal.position.y = 0.62 + Math.sin(this.elapsed * 1.1 + index) * 0.025;
    });
    this.metricPanels.position.y = Math.sin(this.elapsed * 0.65) * 0.035;
  }

  public dispose(): void {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.textures.forEach((texture) => texture.dispose());
    this.clear();
  }

  private createPlatform(): void {
    const surface = this.keepMaterial(new MeshPhysicalMaterial({
      color: '#08191c', roughness: 0.24, metalness: 0.72, clearcoat: 0.65,
      clearcoatRoughness: 0.24,
    }));
    const edge = this.keepMaterial(new MeshStandardMaterial({
      color: '#64d8cf', emissive: '#35b9b1', emissiveIntensity: 1.6, roughness: 0.3,
    }));
    const platformLayers = [
      { radius: 2.7, height: 0.16, y: 0.08 },
      { radius: 2.2, height: 0.24, y: 0.26 },
      { radius: 1.62, height: 0.18, y: 0.46 },
    ];
    platformLayers.forEach((layer, index) => {
      const platform = new Mesh(this.keepGeometry(new CylinderGeometry(layer.radius * 0.96, layer.radius, layer.height, 64)), surface);
      platform.name = `Layer ${index + 1} of ecological data island`;
      platform.position.y = layer.y;
      platform.castShadow = true;
      platform.receiveShadow = true;
      this.add(platform);
      const edgeRing = new Mesh(this.keepGeometry(new TorusGeometry(layer.radius * 0.98, 0.018, 5, 64)), edge);
      edgeRing.rotation.x = Math.PI / 2;
      edgeRing.position.y = layer.y + layer.height / 2;
      this.add(edgeRing);
    });

    const inlay = new Mesh(this.keepGeometry(new RingGeometry(1.48, 1.54, 64)), edge);
    inlay.rotation.x = -Math.PI / 2;
    inlay.position.y = 0.31;
    this.add(inlay);

    const support = new Mesh(this.keepGeometry(new CylinderGeometry(0.54, 0.72, 0.34, 48)), surface);
    support.position.y = 0.68;
    this.add(support);

    const dataShell = new Mesh(this.keepGeometry(new CylinderGeometry(1.34, 1.55, 2.5, 36, 1, true)), this.keepMaterial(new MeshPhysicalMaterial({
      color: '#57dfd5', emissive: '#1b8d89', emissiveIntensity: 0.16, transparent: true,
      opacity: 0.075, transmission: 0.78, roughness: 0.08, depthWrite: false, side: DoubleSide,
    })));
    dataShell.name = 'Transparent ecological data shell';
    dataShell.position.y = 1.73;
    this.add(dataShell);
  }

  private createGlobe(): void {
    this.globe.name = 'Environmental monitoring globe';
    this.globe.position.y = 2.05;

    const shell = this.keepMaterial(new MeshPhysicalMaterial({
      color: '#75e6dd', emissive: '#1c8f8d', emissiveIntensity: 0.11,
      transparent: true, opacity: 0.075, transmission: 0.62, roughness: 0.12,
      thickness: 0.16, depthWrite: false, side: DoubleSide,
    }));
    const grid = this.keepMaterial(new MeshBasicMaterial({
      color: '#66dcd4', transparent: true, opacity: 0.2, wireframe: true,
      depthWrite: false, blending: AdditiveBlending,
    }));
    const sphereGeometry = this.keepGeometry(new SphereGeometry(1.02, 28, 18));
    const globeShell = new Mesh(sphereGeometry, shell);
    const globeGrid = new Mesh(sphereGeometry, grid);
    globeShell.name = 'Transparent environmental globe';
    globeGrid.scale.setScalar(1.008);
    this.globe.add(globeShell, globeGrid);

    const axisMaterial = this.keepMaterial(new LineBasicMaterial({
      color: '#8be7c0', transparent: true, opacity: 0.5,
    }));
    const axisGeometry = this.keepGeometry(new BufferGeometry().setFromPoints([
      new Vector3(0, -1.28, 0),
      new Vector3(0, 1.28, 0),
    ]));
    this.globe.add(new LineSegments(axisGeometry, axisMaterial));
    this.add(this.globe);

    const ringMaterial = this.keepMaterial(new MeshBasicMaterial({
      color: '#7ce4d7', transparent: true, opacity: 0.32, depthWrite: false,
    }));
    this.orbitRings.name = 'Ecological data orbital rings';
    this.orbitRings.position.y = 2.05;
    const orbitalConfigurations = [
      { radius: 1.3, rotation: [Math.PI / 2, 0, 0] },
      { radius: 1.48, rotation: [Math.PI / 2.8, 0.25, Math.PI / 7] },
      { radius: 1.68, rotation: [Math.PI / 2.35, -0.4, -Math.PI / 5] },
      { radius: 1.9, rotation: [Math.PI / 1.9, 0.2, Math.PI / 3] },
    ];
    orbitalConfigurations.forEach((configuration, index) => {
      const ring = new Mesh(this.keepGeometry(new TorusGeometry(configuration.radius, index === 3 ? 0.008 : 0.012, 5, 72)), ringMaterial);
      ring.name = `Live data orbital ring ${index + 1}`;
      ring.rotation.set(...configuration.rotation as [number, number, number]);
      this.orbitRings.add(ring);
    });
    this.add(this.orbitRings);
  }

  private createMetricPanels(): void {
    this.metricPanels.name = 'Floating environmental metric panels';
    const panelGeometry = this.keepGeometry(new PlaneGeometry(1.28, 0.58));
    METRICS.forEach((metric, index) => {
      const texture = this.createMetricTexture(metric);
      const material = this.keepMaterial(new MeshBasicMaterial({
        map: texture, transparent: true, opacity: 0.82, depthWrite: false, side: DoubleSide,
      }));
      const panel = new Mesh(panelGeometry, material);
      const angle = index * Math.PI * 2 / METRICS.length + Math.PI / 4;
      panel.name = `${metric.label} metric panel`;
      panel.position.set(Math.cos(angle) * 1.92, 2.05 + (index % 2 === 1 ? 0.3 : -0.1), Math.sin(angle) * 1.92);
      panel.rotation.y = angle - Math.PI / 2;
      this.metricPanels.add(panel);
    });
    this.add(this.metricPanels);
  }

  private createTerminals(): void {
    this.terminals.name = 'Surrounding interactive environmental terminals';
    const body = this.keepMaterial(new MeshStandardMaterial({ color: '#0a1b1e', metalness: 0.72, roughness: 0.26 }));
    const screen = this.keepMaterial(new MeshPhysicalMaterial({
      color: '#65e3d7', emissive: '#3ad0c4', emissiveIntensity: 0.9, transparent: true,
      opacity: 0.28, transmission: 0.35, roughness: 0.1,
    }));
    for (let index = 0; index < 6; index += 1) {
      const angle = index / 6 * Math.PI * 2;
      const terminal = new Group();
      terminal.name = `Interactive monitoring terminal ${index + 1}`;
      terminal.position.set(Math.cos(angle) * 3.28, 0.62, Math.sin(angle) * 3.28);
      terminal.rotation.y = -angle + Math.PI / 2;
      const stem = new Mesh(this.keepGeometry(new BoxGeometry(0.12, 0.78, 0.14)), body);
      stem.position.y = -0.23;
      const display = new Mesh(this.keepGeometry(new BoxGeometry(0.74, 0.5, 0.045)), screen);
      display.rotation.x = -0.28;
      display.position.y = 0.28;
      const status = new Mesh(this.keepGeometry(new BoxGeometry(0.48, 0.025, 0.055)), screen);
      status.position.set(0, 0.25, 0.045);
      terminal.add(stem, display, status);
      this.terminals.add(terminal);
    }
    this.add(this.terminals);
  }

  private createMetricTexture(metric: Metric): CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 232;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = 'rgba(6, 40, 43, 0.76)';
      context.fillRect(2, 2, 508, 228);
      context.strokeStyle = 'rgba(113, 226, 211, 0.72)';
      context.lineWidth = 3;
      context.strokeRect(2, 2, 508, 228);
      context.fillStyle = metric.color;
      context.fillRect(25, 30, 5, 172);
      context.font = '600 30px Arial, sans-serif';
      context.fillText(metric.label, 54, 62);
      context.font = '300 84px Arial, sans-serif';
      context.fillText(metric.value, 52, 153);
      context.fillStyle = 'rgba(221, 255, 249, 0.72)';
      context.font = '500 22px Arial, sans-serif';
      context.fillText(metric.unit, 55, 195);
      context.fillStyle = metric.color;
      for (let i = 0; i < 8; i += 1) context.fillRect(330 + i * 18, 178 - i * 7, 9, 17 + i * 7);
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    this.textures.push(texture);
    return texture;
  }

  private createIllumination(): void {
    const haloMaterial = this.keepMaterial(new MeshBasicMaterial({
      color: new Color('#56ddd1'), transparent: true, opacity: 0.075,
      depthWrite: false, blending: AdditiveBlending,
    }));
    const halo = new Mesh(this.keepGeometry(new CylinderGeometry(0.7, 1.02, 1.45, 32, 1, true)), haloMaterial);
    halo.position.y = 1.15;
    this.add(halo);
    const light = new PointLight('#65e3d7', 4.2, 4.6, 2);
    light.position.y = 1.5;
    this.add(light);
  }

  private keepGeometry<T extends BufferGeometry>(geometry: T): T {
    this.geometries.push(geometry);
    return geometry;
  }

  private keepMaterial<T extends Material>(material: T): T {
    this.materials.push(material);
    return material;
  }
}
