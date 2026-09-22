import type { ZoneDefinition } from '../ZoneDefinition';

export const zoneDefinitions: readonly ZoneDefinition[] = [
  {
    id: 'ZONE_01', title: '水环境治理', englishTitle: 'WATER ENVIRONMENT',
    description: '汇聚水处理、资源循环与智慧水务技术', accent: '#39ddeb',
    sceneOrigin: [0, 0, -42], entryPosition: [0, 4.7, -25.5], cameraPosition: [1.8, 4.9, -28.5], cameraTarget: [0, 2.8, -40.5],
    exhibitAnchors: [{ id: 'MVR_WASTEWATER', label: 'MVR 与水环境展品入口', position: [0, 0, -42] }],
  },
  { id: 'ZONE_02', title: '固废资源化利用', englishTitle: 'RESOURCE CIRCULATION', description: '固废资源化与循环材料技术', accent: '#58e59a', sceneOrigin: [42, 0, -42], entryPosition: [42, 4.8, -25], cameraPosition: [42, 5, -28], cameraTarget: [42, 2, -42], exhibitAnchors: [] },
  { id: 'ZONE_03', title: '清洁能源', englishTitle: 'CLEAN ENERGY', description: '清洁能源与智慧储能技术', accent: '#48e1c1', sceneOrigin: [84, 0, -42], entryPosition: [84, 4.8, -25], cameraPosition: [84, 5, -28], cameraTarget: [84, 2, -42], exhibitAnchors: [] },
  { id: 'ZONE_04', title: '大气环境治理', englishTitle: 'AIR INTELLIGENCE', description: '大气感知与排放控制技术', accent: '#5dbef3', sceneOrigin: [126, 0, -42], entryPosition: [126, 4.8, -25], cameraPosition: [126, 5, -28], cameraTarget: [126, 2, -42], exhibitAnchors: [] },
  { id: 'ZONE_05', title: '生态修复与智慧监测', englishTitle: 'ECO RESTORATION', description: '生态修复、数字孪生与智慧监测技术', accent: '#76e69d', sceneOrigin: [168, 0, -42], entryPosition: [168, 4.8, -25], cameraPosition: [168, 5, -28], cameraTarget: [168, 2, -42], exhibitAnchors: [] },
] as const;
