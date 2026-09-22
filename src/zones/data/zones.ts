import type { ZoneDefinition } from '../ZoneDefinition';

export const zoneDefinitions: readonly ZoneDefinition[] = [
  {
    id: 'ZONE_01', title: '水环境治理', englishTitle: 'WATER ENVIRONMENT',
    description: '汇聚水处理、资源循环与智慧水务技术', accent: '#39ddeb',
    sceneOrigin: [0, 0, -42], entryPosition: [9.25, 3, -18.7], entryDirection: [0.15, 0, -1], cameraTarget: [0, 2.8, -43.5],
    exhibitAnchors: [
      { id: 'MVR_WASTEWATER', label: '高盐有机废水MVR蒸发分盐及资源化利用技术', position: [-7.2, 0, -42], status: 'connected' },
      { id: 'MEMBRANE_SEPARATION', label: '膜分离处理技术', position: [0, 0, -45], status: 'placeholder' },
      { id: 'SMART_WATER_MONITORING', label: '智慧水务监测技术', position: [7.2, 0, -42], status: 'placeholder' },
    ],
  },
  { id: 'ZONE_02', title: '固废资源化利用', englishTitle: 'RESOURCE CIRCULATION', description: '固废资源化与循环材料技术', accent: '#58e59a', sceneOrigin: [42, 0, -42], entryPosition: [42, 3.1, -18.2], entryDirection: [0, 0, -1], cameraTarget: [42, 2, -42], exhibitAnchors: [] },
  { id: 'ZONE_03', title: '清洁能源', englishTitle: 'CLEAN ENERGY', description: '清洁能源与智慧储能技术', accent: '#48e1c1', sceneOrigin: [84, 0, -42], entryPosition: [74.75, 3.1, -18.2], entryDirection: [0, 0, -1], cameraTarget: [84, 2, -42], exhibitAnchors: [] },
  { id: 'ZONE_04', title: '大气环境治理', englishTitle: 'AIR INTELLIGENCE', description: '大气感知与排放控制技术', accent: '#5dbef3', sceneOrigin: [126, 0, -42], entryPosition: [138.25, 3.1, -40.45], entryDirection: [-1, 0, 0], cameraTarget: [126, 2, -42], exhibitAnchors: [] },
  { id: 'ZONE_05', title: '生态修复与智慧监测', englishTitle: 'ECO RESTORATION', description: '生态修复、数字孪生与智慧监测技术', accent: '#76e69d', sceneOrigin: [168, 0, -42], entryPosition: [155.75, 3.1, -40.45], entryDirection: [1, 0, 0], cameraTarget: [168, 2, -42], exhibitAnchors: [] },
] as const;
