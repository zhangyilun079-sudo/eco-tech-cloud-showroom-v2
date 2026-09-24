import {
  CanvasTexture, DoubleSide, Group, Mesh, MeshBasicMaterial, PlaneGeometry,
  SRGBColorSpace, Texture, TextureLoader,
} from 'three';
import { rtoAnnotations } from '../annotations/rtoAnnotations';

export type RtoAssetMode = 'reference-image' | 'real-gltf';

/**
 * Current source of truth: the user-supplied exhibit image itself.
 * A future verified 3D model can replace the provider while Viewer/Zone code
 * keeps using the same loadRtoAsset() contract.
 */
export const RTO_ASSET_MODE: RtoAssetMode = 'reference-image';
export const RTO_REFERENCE_IMAGE_URL = '/assets/images/rto-three-bed-reference.png';

const REFERENCE_PLANE_WIDTH = 10.5;
let referenceTexture: Promise<Texture> | null = null;

function getReferenceTexture(): Promise<Texture> {
  referenceTexture ??= new TextureLoader().loadAsync(RTO_REFERENCE_IMAGE_URL).then((texture) => {
    texture.colorSpace = SRGBColorSpace;
    texture.name = 'RTO original exhibit image';
    return texture;
  });
  return referenceTexture;
}

function readTextureSize(texture: Texture): { width: number; height: number } {
  const image = texture.image as {
    naturalWidth?: number;
    naturalHeight?: number;
    width?: number;
    height?: number;
  } | undefined;
  const width = image?.naturalWidth ?? image?.width ?? 1677;
  const height = image?.naturalHeight ?? image?.height ?? 1280;
  return {
    width: width > 0 ? width : 1677,
    height: height > 0 ? height : 1280,
  };
}

function createReferenceImageAsset(texture: Texture): Group {
  const root = new Group();
  root.name = 'RTO reference-image asset';

  const size = readTextureSize(texture);
  const planeWidth = REFERENCE_PLANE_WIDTH;
  const planeHeight = planeWidth * size.height / size.width;

  const imagePlane = new Mesh(
    new PlaneGeometry(planeWidth, planeHeight),
    new MeshBasicMaterial({
      map: texture,
      side: DoubleSide,
      toneMapped: false,
    }),
  );
  imagePlane.name = 'rto-reference-image';
  // Bottom-align the image so the exhibit sits naturally on the showcase base.
  imagePlane.position.y = planeHeight / 2;
  imagePlane.renderOrder = 1;
  root.add(imagePlane);

  rtoAnnotations.forEach((annotation, index) => {
    const regionWidth = annotation.bounds.width * planeWidth;
    const regionHeight = annotation.bounds.height * planeHeight;
    const region = new Mesh(
      new PlaneGeometry(regionWidth, regionHeight),
      new MeshBasicMaterial({
        color: '#55dca0',
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
        side: DoubleSide,
      }),
    );
    region.name = annotation.objectName;
    region.position.set(
      (annotation.bounds.x + annotation.bounds.width / 2 - 0.5) * planeWidth,
      (1 - annotation.bounds.y - annotation.bounds.height / 2) * planeHeight,
      0.025 + (annotation.interactionLayer ?? 1) * 0.003 + index * 0.00001,
    );
    region.renderOrder = 10 + (annotation.interactionLayer ?? 1);
    region.userData.rtoReferenceRegion = true;
    region.userData.normalizedBounds = annotation.bounds;
    region.userData.componentLabelAnchor = {
      x: 0,
      y: regionHeight / 2 + 0.16,
      z: 0.01,
    };
    root.add(region);
  });

  root.userData.assetMode = 'reference-image';
  root.userData.assetUrl = RTO_REFERENCE_IMAGE_URL;
  root.userData.referenceImageSize = size;
  root.userData.referencePlaneSize = { width: planeWidth, height: planeHeight };
  return root;
}

function createMissingReferencePanel(): Group {
  const root = new Group();
  root.name = 'RTO reference-image missing diagnostic';

  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 720;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = '#180c0c';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#ff775e';
    context.lineWidth = 5;
    context.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
    context.fillStyle = '#fff2ee';
    context.font = '600 46px sans-serif';
    context.fillText('RTO 原始展品图待部署', 86, 290);
    context.fillStyle = '#d6aaa0';
    context.font = '28px sans-serif';
    context.fillText('public/assets/images/rto-three-bed-reference.png', 86, 350);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const panel = new Mesh(
    new PlaneGeometry(10, 6),
    new MeshBasicMaterial({ map: texture, toneMapped: false, side: DoubleSide }),
  );
  panel.position.y = 3;
  panel.userData.ownedDiagnosticTexture = texture;
  root.add(panel);
  root.userData.assetMode = 'reference-image';
  root.userData.assetLoadFailed = true;
  return root;
}

/**
 * Returns one independently transformable RTO display instance.
 * Current mode uses the original exhibit image; a future verified GLTF can be
 * wired into the same factory without changing Viewer or zone routing.
 */
export async function loadRtoAsset(mode: RtoAssetMode = RTO_ASSET_MODE): Promise<Group> {
  if (mode === 'real-gltf') {
    throw new Error('RTO real-gltf mode is reserved until a verified source model is supplied.');
  }

  try {
    return createReferenceImageAsset(await getReferenceTexture());
  } catch (error) {
    console.error('[loadRtoAsset] Unable to load original RTO exhibit image.', error);
    return createMissingReferencePanel();
  }
}
