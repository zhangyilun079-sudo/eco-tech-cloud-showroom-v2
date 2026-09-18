import type { ExhibitComponentDefinition, ExhibitDefinition, ExhibitVector3 } from '../ExhibitDefinition';

const component = (
  id: string,
  title: string,
  description: string,
  position: ExhibitVector3,
  explodePosition: ExhibitVector3,
): ExhibitComponentDefinition => ({
  id,
  title,
  description,
  objectReference: null,
  position,
  rotation: { x: 0, y: 0, z: 0, order: 'XYZ' },
  explodePosition,
  label: {
    title,
    description,
    anchorPosition: { x: position.x, y: position.y + 1.5, z: position.z },
  },
});

/**
 * Phase 4.3-A data for the first production exhibit. Coordinates are layout
 * guides only; they do not represent final geometry or engineering dimensions.
 */
export const mvrWastewaterTreatmentDefinition = {
  id: 'high-salt-wastewater-mvr-system',
  title: 'High-salt organic wastewater MVR evaporation, salt separation and resource utilization system',
  technologyCategory: 'Industrial wastewater treatment and resource recovery',
  description: 'An integrated treatment system that concentrates high-salinity organic wastewater, separates crystallized salts, and recovers reusable water and material resources.',
  processOverview: 'Wastewater is preheated through heat recovery, concentrated by mechanical vapor recompression, and directed to controlled crystallization. Separated salts are collected for downstream resource use while condensate is recovered for reuse. Pumps, automated controls, and intelligent monitoring coordinate the complete process.',
  keyFeatures: [
    'Energy-efficient vapor recompression and latent-heat reuse',
    'Integrated evaporation, crystallization, and salt separation',
    'Recovered condensate and salts support circular resource use',
    'Automated process control with continuous operating-data visibility',
  ],
  impactLabel: 'WATER RECOVERY · SALT RESOURCE UTILIZATION',
  components: [
    component('mvr-evaporation-unit', 'MVR evaporation unit', 'Compresses secondary vapor and reuses its heat to drive efficient wastewater evaporation.', { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -2.5 }),
    component('heat-exchanger-module', 'Heat exchanger module', 'Recovers process heat to preheat feedwater and reduce the system energy demand.', { x: -2.2, y: 0, z: 0.3 }, { x: -4.2, y: 0, z: 0.3 }),
    component('crystallization-salt-separation-unit', 'Crystallization and salt separation unit', 'Controls crystal formation and separates concentrated salts from the remaining liquid stream.', { x: 2.2, y: 0, z: 0.2 }, { x: 4.3, y: 0, z: 0.2 }),
    component('piping-system', 'Piping system', 'Connects process stages and routes feed, concentrate, vapor, condensate, and cleaning circuits.', { x: 0, y: 0.8, z: 0.2 }, { x: 0, y: 2.8, z: 0.2 }),
    component('pump-system', 'Pump system', 'Maintains circulation, transfer, and discharge flow across the treatment process.', { x: -1.3, y: 0, z: 1.2 }, { x: -2.5, y: 0, z: 2.8 }),
    component('electrical-control-cabinet', 'Electrical control cabinet', 'Houses power distribution, motor controls, and automation hardware for coordinated operation.', { x: 2.1, y: 0, z: 1.5 }, { x: 3.8, y: 0, z: 3.1 }),
    component('intelligent-monitoring-system', 'Intelligent monitoring system', 'Collects live process data, presents operating status, and supports alarms and optimization.', { x: 2.8, y: 1.1, z: 1.4 }, { x: 4.8, y: 2.2, z: 3.2 }),
  ],
} as const satisfies ExhibitDefinition;
