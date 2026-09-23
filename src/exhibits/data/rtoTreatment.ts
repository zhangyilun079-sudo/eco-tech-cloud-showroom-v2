import type { ExhibitComponentDefinition, ExhibitDefinition, ExhibitVector3 } from '../ExhibitDefinition';

const component = (
  id: string,
  title: string,
  technicalRole: string,
  description: string,
  keyFeatures: readonly string[],
  position: ExhibitVector3,
  explodePosition: ExhibitVector3,
  anchorOffset = 1.25,
): ExhibitComponentDefinition => ({
  id,
  title,
  technicalRole,
  description,
  keyFeatures,
  objectReference: { assetId: 'rto-treatment', objectName: id },
  position,
  rotation: { x: 0, y: 0, z: 0, order: 'XYZ' },
  explodePosition,
  label: {
    title,
    description,
    anchorPosition: { x: position.x, y: position.y + anchorOffset, z: position.z },
  },
});

/** Phase 8.1 production data for the three-bed regenerative thermal oxidizer. */
export const rtoTreatmentDefinition = {
  id: 'three-bed-rto-treatment-system',
  title: '三床式 RTO 废气处理系统',
  technologyCategory: '工业废气治理',
  description: '采用三座蓄热床交替执行预热、吹扫和蓄热，通过高温氧化分解工业有机废气，并回收烟气热量。',
  processOverview: '风机将有机废气送入切换阀组，气流进入处于进气状态的蓄热床预热，在顶部燃烧室完成氧化；净化后的高温气体经另一蓄热床释放热量后由排气管路排出，第三床同步吹扫，阀组周期切换以维持连续运行。',
  keyFeatures: ['三床交替运行，降低切换波动', '陶瓷蓄热体回收氧化余热', '燃烧室高温氧化处理 VOCs', '阀组联锁控制保障连续稳定运行'],
  impactLabel: 'VOCs 深度治理 · 余热循环利用',
  technologyOverview: {
    title: '三床式蓄热氧化技术',
    category: '减污降碳 · 大气治理',
    summary: '以三床轮换和蓄热换向提高热效率，实现工业有机废气稳定氧化净化。',
  },
  technicalAdvantages: [
    { title: '高效蓄热', description: '三组陶瓷蓄热床交替吸热与放热，回收净化烟气中的热量。', relatedComponents: ['thermal-bed-a', 'thermal-bed-b', 'thermal-bed-c'] },
    { title: '稳定氧化', description: '燃烧器补充热量，燃烧室提供均匀、稳定的高温反应空间。', relatedComponents: ['combustion-chamber', 'burner'] },
    { title: '连续换向', description: '切换阀组协调进气、排气与吹扫支路，减少未处理气体逸出。', relatedComponents: ['valve-manifold', 'pipeline-network'] },
  ],
  technologyMetrics: [
    { label: '运行方式', value: '三床轮换', note: '进气、排气、吹扫周期切换', relatedComponents: ['thermal-bed-a', 'thermal-bed-b', 'thermal-bed-c', 'valve-manifold'] },
    { label: '热量利用', value: '蓄热回收', note: '降低燃烧器持续补热需求', relatedComponents: ['combustion-chamber', 'thermal-bed-a', 'thermal-bed-b', 'thermal-bed-c'] },
    { label: '处理对象', value: '工业 VOCs', note: '实际参数按废气组分进行工程设计', relatedComponents: ['combustion-chamber', 'burner'] },
  ],
  applications: ['涂装', '印刷包装', '精细化工', '电子制造', '工业园区废气治理'],
  economicIndicators: [
    { title: '节能机制', value: '余热循环', description: '利用陶瓷蓄热体回收烟气显热，减少辅助燃料消耗。' },
    { title: '运行组织', value: '连续轮换', description: '三床与阀组协同，支持连续废气处理。' },
    { title: '维护方式', value: '分区检修', description: '床体、阀组和风机采用独立组件化布置。' },
  ],
  processSteps: [
    {
      id: 'rto-intake', title: '废气增压与分配',
      description: '待处理废气经风机增压后进入总管，由切换阀组分配至当前进气蓄热床。',
      relatedComponents: ['blower-fan', 'heat-exchanger', 'pipeline-network', 'valve-manifold'],
      processPath: [{ x: -5.2, y: 0.78, z: 1.25 }, { x: -3.9, y: 0.78, z: 1.25 }, { x: -3.9, y: 0.78, z: 0 }, { x: -2.35, y: 0.78, z: 0 }],
      visualState: { color: '#4ddff1', particleSpeed: 0.2, label: '有机废气进气' },
    },
    {
      id: 'rto-preheat', title: '蓄热床预热',
      description: '废气自下而上通过进气床，与陶瓷蓄热体换热后升温并进入顶部燃烧室。',
      relatedComponents: ['thermal-bed-a', 'pipeline-network'],
      processPath: [{ x: -2.35, y: 0.78, z: 0 }, { x: -2.35, y: 2.4, z: 0 }, { x: -2.35, y: 4.65, z: 0 }, { x: 0, y: 5.15, z: 0 }],
      visualState: { color: '#ffd166', particleSpeed: 0.17, label: '升温预热' },
    },
    {
      id: 'rto-oxidation', title: '高温氧化',
      description: '预热废气在燃烧器辅助下于燃烧室充分氧化，转化为净化后的高温气体。',
      relatedComponents: ['combustion-chamber', 'burner'],
      processPath: [{ x: -2.35, y: 5.15, z: 0 }, { x: 0, y: 5.15, z: 0 }, { x: 2.35, y: 5.15, z: 0 }],
      visualState: { color: '#ff7b38', particleSpeed: 0.24, label: '氧化反应' },
    },
    {
      id: 'rto-heat-recovery', title: '蓄热与净化排放',
      description: '高温净化气体流经排气床并向蓄热体释放热量，再由阀组汇入排气管路；第三床执行吹扫准备下一周期。',
      relatedComponents: ['thermal-bed-b', 'thermal-bed-c', 'valve-manifold', 'pipeline-network', 'exhaust-stack'],
      processPath: [{ x: 2.35, y: 5.15, z: 0 }, { x: 2.35, y: 2.4, z: 0 }, { x: 2.35, y: 0.78, z: 0 }, { x: 4.1, y: 0.78, z: 0 }, { x: 5.35, y: 2.2, z: 0 }],
      visualState: { color: '#72efb3', particleSpeed: 0.19, label: '余热回收与排气' },
    },
  ],
  components: [
    component('thermal-bed-a', '蓄热床 A', '进气预热 / 周期换向', '陶瓷蓄热体在进气周期释放热量，将有机废气预热至接近氧化温度。', ['陶瓷蓄热介质', '保温床体', '周期换向运行'], { x: -2.35, y: 2.45, z: 0 }, { x: -3.8, y: 0, z: 0 }),
    component('thermal-bed-b', '蓄热床 B', '排气蓄热 / 周期换向', '吸收净化高温气体的显热并储存，为下一进气周期提供预热能量。', ['高比表面积填料', '高温余热回收', '低压降气流通道'], { x: 0, y: 2.45, z: 0 }, { x: 0, y: 0, z: 2.7 }),
    component('thermal-bed-c', '蓄热床 C', '吹扫缓冲 / 周期换向', '在床层切换前进行净化气吹扫，降低残留有机废气直接进入排气侧的风险。', ['独立吹扫状态', '三床连续运行', '降低切换排放波动'], { x: 2.35, y: 2.45, z: 0 }, { x: 3.8, y: 0, z: 0 }),
    component('combustion-chamber', '顶部燃烧室', '高温氧化反应', '横跨三座蓄热床的保温反应室，为 VOCs 氧化提供稳定温度与停留空间。', ['一体式顶部腔体', '耐火保温内衬', '均匀气流组织'], { x: 0, y: 5.15, z: 0 }, { x: 0, y: 2.3, z: 0 }, 0.8),
    component('burner', '燃烧器', '启炉与温度补偿', '在启动或废气热值不足时提供补充热量，维持燃烧室反应条件。', ['自动比例调节', '火焰监测', '安全联锁'], { x: -3.7, y: 5.25, z: 0 }, { x: -5.2, y: 1.5, z: 0 }, 0.65),
    component('blower-fan', '左侧离心风机', '废气输送与系统压差维持', '为废气克服换热器、管路、阀门和蓄热床阻力提供稳定动力。', ['离心叶轮可见', '减振基座', '流量调节'], { x: -4.9, y: 1.05, z: 1.2 }, { x: -6.5, y: 0, z: 2.8 }, 0.8),
    component('heat-exchanger', '前置热交换器', '进气预换热', '回收可利用热量并稳定进入 RTO 的废气温度，内部换热管束以剖面形式展示。', ['多管束换热', '检修式壳体', '热量回收接口'], { x: -5.18, y: 3.35, z: -0.62 }, { x: -6.4, y: 1.5, z: -1.8 }, 0.8),
    component('valve-manifold', '底部切换阀组', '进排气换向控制', '通过六组联锁阀门周期切换三座床体的进气、排气和吹扫状态。', ['六阀联锁', '快速密封切换', '检修隔离设计'], { x: 0, y: 0.82, z: 0.15 }, { x: 0, y: -0.45, z: 3.2 }, 0.9),
    component('pipeline-network', '三色工艺管网', '工艺气体输送', '红色进气、紫色净化气与黄色辅助管线连接风机、阀组、三座床体及烟囱。', ['红色进气总管', '紫色出气总管', '黄色辅助管路'], { x: 0, y: 1.05, z: 0 }, { x: 0, y: 2.8, z: -2.7 }, 1.15),
    component('exhaust-stack', '净化气排气筒', '净化气高位排放', '汇集完成氧化和热回收的净化气体，并通过独立排气筒排放。', ['独立竖向烟囱', '顶部防雨帽', '法兰检修段'], { x: 5.18, y: 3.2, z: -1.42 }, { x: 6.4, y: 0.7, z: -1.5 }, 0.8),
    component('frame-support', '钢制框架支撑', '设备承载与检修支撑', '承载床体、燃烧室及管线，并保持剖开展示所需的结构稳定感。', ['型钢底座', '立柱横梁', '模块化承载'], { x: 0, y: 3, z: -1.1 }, { x: 0, y: 0, z: -3.2 }, 0.8),
  ],
} as const satisfies ExhibitDefinition;
