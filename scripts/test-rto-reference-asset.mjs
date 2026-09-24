import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const loader = read('src/exhibits/loaders/loadRtoAsset.ts');
const annotations = read('src/exhibits/annotations/rtoAnnotations.ts');
const model = read('src/exhibits/models/rto/RtoTreatmentModel.ts');
const zoneStand = read('src/zones/components/ZoneExhibitStand.ts');

test('RTO defaults to the original reference image and has no obsolete GLB dependency', () => {
  assert.match(loader, /RTO_ASSET_MODE:\s*RtoAssetMode\s*=\s*'reference-image'/);
  assert.match(loader, /\/assets\/images\/rto-three-bed-reference\.png/);
  assert.doesNotMatch(loader, /rto-three-bed-master|RTO_MASTER_ASSET_URL/);
});

test('RTO front view is locked until a verified real 3D model exists', () => {
  for (const field of ['minRotationY', 'maxRotationY', 'minRotationX', 'maxRotationX']) {
    assert.match(model, new RegExp(`${field}:\\s*0`));
  }
  assert.match(model, /autoRotate:\s*false/);
});

test('ten image-space component regions are declared', () => {
  const ids = [...annotations.matchAll(/componentId:\s*'([^']+)'/g)].map((match) => match[1]);
  assert.deepEqual(ids, [
    'thermal-bed-a', 'thermal-bed-b', 'thermal-bed-c', 'combustion-chamber', 'burner',
    'blower-fan', 'heat-exchanger', 'exhaust-stack', 'valve-manifold', 'pipeline-network',
  ]);
  assert.match(annotations, /NormalizedImageRect/);
});

test('ZONE_04 uses the same RTO model while facing its image toward the zone approach', () => {
  assert.match(zoneStand, /new RtoTreatmentModel\(rtoTreatmentDefinition\)/);
  assert.match(zoneStand, /assetInstance\.rotation\.y\s*=\s*Math\.PI\s*\/\s*2/);
  assert.match(zoneStand, /root\.position\.set\(3\.35,\s*2\.45,\s*0\)/);
});
