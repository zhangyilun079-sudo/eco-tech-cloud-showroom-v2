import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const loader = read('src/exhibits/loaders/loadRtoAsset.ts');
const annotations = read('src/exhibits/annotations/rtoAnnotations.ts');
const model = read('src/exhibits/models/rto/RtoTreatmentModel.ts');
const zoneStand = read('src/zones/components/ZoneExhibitStand.ts');

test('RTO uses the original exhibit image to build a genuine semantic 3D relief', () => {
  assert.match(loader, /RTO_ASSET_MODE:\s*RtoAssetMode\s*=\s*'reference-relief'/);
  assert.match(loader, /\/assets\/images\/rto-three-bed-reference\.png/);
  assert.match(loader, /createFrontGeometry/);
  assert.match(loader, /createBodyGeometry/);
  assert.match(loader, /rtoReliefDepth/);
  assert.doesNotMatch(loader, /rto-three-bed-master|RTO_MASTER_ASSET_URL/);
});

test('RTO allows only limited inspection rotation because unseen surfaces are inferred', () => {
  assert.match(model, /minRotationY:\s*-0\.24/);
  assert.match(model, /maxRotationY:\s*0\.24/);
  assert.match(model, /minRotationX:\s*-0\.08/);
  assert.match(model, /maxRotationX:\s*0\.08/);
  assert.match(model, /autoRotate:\s*false/);
});

test('ten image-space component regions partition the relief and frame-support catches the remainder', () => {
  const ids = [...annotations.matchAll(/componentId:\s*'([^']+)'/g)].map((match) => match[1]);
  assert.deepEqual(ids, [
    'thermal-bed-a', 'thermal-bed-b', 'thermal-bed-c', 'combustion-chamber', 'burner',
    'blower-fan', 'heat-exchanger', 'exhaust-stack', 'valve-manifold', 'pipeline-network',
  ]);
  assert.match(loader, /'frame-support'/);
  assert.match(annotations, /NormalizedImageRect/);
});

test('ZONE_04 uses the same RTO model and faces its 3D relief toward the zone approach', () => {
  assert.match(zoneStand, /new RtoTreatmentModel\(rtoTreatmentDefinition\)/);
  assert.match(zoneStand, /assetInstance\.rotation\.y\s*=\s*Math\.PI\s*\/\s*2/);
  assert.match(zoneStand, /root\.position\.set\(3\.35,\s*2\.45,\s*0\)/);
});
