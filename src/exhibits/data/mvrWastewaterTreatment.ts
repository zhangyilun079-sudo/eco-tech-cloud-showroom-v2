import type { ExhibitComponentDefinition, ExhibitDefinition, ExhibitVector3 } from '../ExhibitDefinition';

const component = (
  id: string,
  title: string,
  technicalRole: string,
  description: string,
  keyFeatures: readonly string[],
  position: ExhibitVector3,
  explodePosition: ExhibitVector3,
): ExhibitComponentDefinition => ({
  id,
  title,
  technicalRole,
  description,
  keyFeatures,
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
    component('mvr-evaporation-unit', 'MVR evaporation unit', 'Primary concentration', 'Compresses secondary vapor and reuses its heat to drive efficient wastewater evaporation.', ['Mechanical vapor recompression', 'Latent-heat recovery', 'High-efficiency concentration'], { x: 0.75, y: 2.4, z: -0.15 }, { x: 0, y: 0, z: -2.5 }),
    component('heat-exchanger-module', 'Heat exchanger module', 'Feed preheating and heat recovery', 'Recovers process heat to preheat feedwater and reduce the system energy demand.', ['Dual exchanger barrels', 'Counter-current heat transfer', 'Reduced steam demand'], { x: -1.72, y: 1.2, z: -0.45 }, { x: -4.2, y: 0, z: 0.3 }),
    component('crystallization-salt-separation-unit', 'Crystallization and salt separation unit', 'Salt crystallization and recovery', 'Controls crystal formation and separates concentrated salts from the remaining liquid stream.', ['Controlled nucleation', 'Solid-liquid separation', 'Recoverable salt output'], { x: 2.15, y: 1.75, z: 0.05 }, { x: 4.3, y: 0, z: 0.2 }),
    component('piping-system', 'Piping system', 'Process-fluid distribution', 'Connects process stages and routes feed, concentrate, vapor, condensate, and cleaning circuits.', ['Dedicated flow circuits', 'Corrosion-resistant routing', 'Serviceable connections'], { x: 0.2, y: 4.9, z: -0.15 }, { x: 0, y: 2.8, z: 0.2 }),
    component('pump-system', 'Pump system', 'Circulation and fluid transfer', 'Maintains circulation, transfer, and discharge flow across the treatment process.', ['Duty pump arrangement', 'Stable process pressure', 'Continuous circulation'], { x: -1.25, y: 0.5, z: 0.75 }, { x: -2.5, y: 0, z: 2.8 }),
    component('electrical-control-cabinet', 'Electrical control cabinet', 'Power and automation control', 'Houses power distribution, motor controls, and automation hardware for coordinated operation.', ['Central motor control', 'Protected power distribution', 'PLC-ready automation'], { x: 2.25, y: 1.15, z: 1.45 }, { x: 3.8, y: 0, z: 3.1 }),
    component('intelligent-monitoring-system', 'Intelligent monitoring system', 'Operational intelligence', 'Collects live process data, presents operating status, and supports alarms and optimization.', ['Live process telemetry', 'Alarm visualization', 'Performance optimization'], { x: 2.25, y: 1.45, z: 1.48 }, { x: 4.8, y: 2.2, z: 3.2 }),
  ],
} as const satisfies ExhibitDefinition;
