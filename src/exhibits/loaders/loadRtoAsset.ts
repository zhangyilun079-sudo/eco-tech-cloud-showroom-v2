import { Group, Mesh, type Object3D } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { rtoAnnotations } from '../annotations/rtoAnnotations';

export const RTO_MASTER_ASSET_URL = '/assets/models/rto-three-bed-master.glb';

let masterAsset: Promise<Object3D> | null = null;

function getMasterAsset(): Promise<Object3D> {
  masterAsset ??= new GLTFLoader().loadAsync(RTO_MASTER_ASSET_URL).then(({ scene }) => {
    scene.name = 'RTO three-bed master asset';
    scene.traverse((object) => {
      if (object instanceof Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    return scene;
  });
  return masterAsset;
}

/** Creates an independently transformable instance backed by one cached GLB. */
export async function loadRtoAsset(): Promise<Group> {
  const instance = new Group();
  const asset = clone(await getMasterAsset());
  instance.name = 'RTO high-fidelity asset instance';
  instance.userData.assetUrl = RTO_MASTER_ASSET_URL;
  instance.userData.annotations = rtoAnnotations;
  instance.add(asset);
  return instance;
}
