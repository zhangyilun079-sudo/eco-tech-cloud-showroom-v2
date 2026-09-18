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
  title: '高盐有机废水 MVR 蒸发分盐与资源化利用系统',
  technologyCategory: '工业废水治理与资源回收',
  description: '面向高盐有机废水的集成化处理系统，通过浓缩、结晶分盐与水资源回收，实现污染物减量和资源循环利用。',
  processOverview: '废水经余热回收预热后，进入机械蒸汽再压缩单元进行高效浓缩，并转入受控结晶环节。分离后的盐类可用于后续资源化利用，冷凝水则回收再用；泵组、自动控制及智能监测系统协同保障全流程稳定运行。',
  keyFeatures: [
    '高效蒸汽再压缩与潜热循环利用',
    '蒸发、结晶与分盐工艺一体化',
    '冷凝水及盐类回收助力资源循环利用',
    '自动化过程控制与运行数据连续监测',
  ],
  impactLabel: '水资源回收 · 盐类资源化利用',
  processSteps: [
    {
      id: 'wastewater-pretreatment',
      title: '废水预处理',
      description: '原水经泵组稳定输送，并通过换热器回收系统余热完成预热，为后续蒸发浓缩建立稳定的进料条件。',
      relatedComponents: ['pump-system', 'heat-exchanger-module', 'piping-system'],
      processPath: [{ x: -1.9, y: 0.62, z: 0.75 }, { x: -1.9, y: 1.08, z: 0.75 }, { x: -0.6, y: 1.08, z: 0.25 }, { x: -1.72, y: 1.55, z: -0.45 }],
      visualState: { color: '#4de4ff', particleSpeed: 0.18, label: '原水进料' },
    },
    {
      id: 'mvr-evaporation-concentration',
      title: 'MVR 蒸发浓缩',
      description: '机械蒸汽再压缩单元提升二次蒸汽的温度与压力，循环利用潜热，使废水在较低外部能耗下持续浓缩。',
      relatedComponents: ['mvr-evaporation-unit', 'heat-exchanger-module'],
      processPath: [{ x: -1.72, y: 1.55, z: -0.45 }, { x: -3.15, y: 1.55, z: -0.45 }, { x: -3.15, y: 3.72, z: -0.45 }, { x: 0.75, y: 3.72, z: -0.15 }],
      visualState: { color: '#65f5bd', particleSpeed: 0.22, label: '蒸汽潜热循环' },
    },
    {
      id: 'crystallization-salt-separation',
      title: '结晶与分盐',
      description: '浓缩液进入结晶分盐单元，通过受控成核与固液分离形成可回收盐类，并降低残余液体体积。',
      relatedComponents: ['crystallization-salt-separation-unit'],
      processPath: [{ x: 0.75, y: 4.72, z: -0.15 }, { x: 0.75, y: 5.08, z: -0.15 }, { x: 2.15, y: 5.08, z: 0.05 }, { x: 2.15, y: 3.25, z: 0.05 }],
      visualState: { color: '#ffc857', particleSpeed: 0.16, label: '浓缩液输送' },
    },
    {
      id: 'resource-recovery',
      title: '资源回收',
      description: '分离盐类进入资源化利用环节，蒸汽冷凝水回用于生产；智能监测与电气控制保障回收过程稳定运行。',
      relatedComponents: ['intelligent-monitoring-system', 'electrical-control-cabinet', 'piping-system'],
      processPath: [{ x: 2.15, y: 0.62, z: 0.05 }, { x: 2.15, y: 0.62, z: 1.05 }, { x: -0.55, y: 0.62, z: 1.05 }],
      visualState: { color: '#a4ff7a', particleSpeed: 0.2, label: '回收产物流向' },
    },
  ],
  components: [
    component('mvr-evaporation-unit', 'MVR 蒸发单元', '核心浓缩处理', '压缩二次蒸汽并循环利用其热能，驱动废水高效蒸发浓缩。', ['机械蒸汽再压缩', '潜热回收利用', '高效浓缩处理'], { x: 0.75, y: 2.4, z: -0.15 }, { x: 0, y: 0, z: -2.5 }),
    component('heat-exchanger-module', '换热器模块', '进料预热与热能回收', '回收工艺余热并预热进水，有效降低系统整体能耗。', ['双筒式换热结构', '逆流换热工艺', '降低蒸汽需求'], { x: -1.72, y: 1.2, z: -0.45 }, { x: -4.2, y: 0, z: 0.3 }),
    component('crystallization-salt-separation-unit', '结晶分盐单元', '盐类结晶与回收', '精准调控晶体形成过程，从浓缩液中分离并回收盐类物质。', ['可控成核过程', '高效固液分离', '盐类产物可回收'], { x: 2.15, y: 1.75, z: 0.05 }, { x: 4.3, y: 0, z: 0.2 }),
    component('piping-system', '工艺管路系统', '工艺流体输送与分配', '连接各处理环节，输送进料、浓缩液、蒸汽、冷凝水及清洗介质。', ['独立流体回路', '耐腐蚀管路设计', '便于检修的连接结构'], { x: 0.2, y: 4.9, z: -0.15 }, { x: 0, y: 2.8, z: 0.2 }),
    component('pump-system', '泵组系统', '循环与流体输送', '维持处理流程所需的循环、转运及排放流量。', ['工作泵组配置', '稳定工艺压力', '连续循环运行'], { x: -1.25, y: 0.5, z: 0.75 }, { x: -2.5, y: 0, z: 2.8 }),
    component('electrical-control-cabinet', '电气控制柜', '供配电与自动化控制', '集成配电、机电控制及自动化硬件，实现系统协同运行。', ['集中式电机控制', '安全配电防护', '支持 PLC 自动控制'], { x: 2.25, y: 1.15, z: 1.45 }, { x: 3.8, y: 0, z: 3.1 }),
    component('intelligent-monitoring-system', '智能监测系统', '运行状态智能感知', '实时采集工艺数据、呈现运行状态，并为异常预警及效能优化提供支持。', ['工艺数据实时采集', '异常预警可视化', '运行效能优化'], { x: 2.25, y: 1.45, z: 1.48 }, { x: 4.8, y: 2.2, z: 3.2 }),
  ],
} as const satisfies ExhibitDefinition;
