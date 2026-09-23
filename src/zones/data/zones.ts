import type { ZoneDefinition } from '../ZoneDefinition';
import { zone01Exhibits } from './zoneExhibits';

export const zoneDefinitions: readonly ZoneDefinition[] = [
  {
    id: 'ZONE_01', title: '水环境治理', englishTitle: 'WATER ENVIRONMENT',
    description: '汇聚水处理、资源循环与智慧水务技术', accent: '#39ddeb',
    // Enter high and far enough forward to frame all three bays as one exhibition,
    // with the central membrane stand anchoring (rather than dominating) the view.
    sceneOrigin: [0, 0, -42], entryPosition: [9.25, 5.4, -17.2], entryDirection: [0, -0.12, -1], cameraTarget: [0, 2.2, -44],
    exhibits: zone01Exhibits,
  },
  { id: 'ZONE_02', title: '固废资源化利用', englishTitle: 'RESOURCE CIRCULATION', description: '固废资源化与循环材料技术', accent: '#58e59a', sceneOrigin: [42, 0, -42], entryPosition: [42, 3.1, -18.2], entryDirection: [0, 0, -1], cameraTarget: [42, 2, -42], exhibits: [] },
  { id: 'ZONE_03', title: '清洁能源', englishTitle: 'CLEAN ENERGY', description: '清洁能源与智慧储能技术', accent: '#48e1c1', sceneOrigin: [84, 0, -42], entryPosition: [74.75, 3.1, -18.2], entryDirection: [0, 0, -1], cameraTarget: [84, 2, -42], exhibits: [] },
  { id: 'ZONE_04', title: '大气环境治理', englishTitle: 'AIR INTELLIGENCE', description: '大气感知与排放控制技术', accent: '#5dbef3', sceneOrigin: [126, 0, -42], entryPosition: [138.25, 3.1, -40.45], entryDirection: [-1, 0, 0], cameraTarget: [126, 2, -42], exhibits: [] },
  { id: 'ZONE_05', title: '生态修复与智慧监测', englishTitle: 'ECO RESTORATION', description: '生态修复、数字孪生与智慧监测技术', accent: '#76e69d', sceneOrigin: [168, 0, -42], entryPosition: [155.75, 3.1, -40.45], entryDirection: [1, 0, 0], cameraTarget: [168, 2, -42], exhibits: [] },
] as const;
