import { Studio } from '@/types/studio';

export const mockStudios: Studio[] = [
  {
    id: 'studio-001',
    name: '光影一号棚',
    type: '商业摄影棚',
    area: 120,
    capacity: 10,
    description: '专业商业摄影棚，配备全套灯光设备，适合产品摄影、人像写真等多种拍摄场景。层高4.5米，无影墙面积80平米。',
    pricePerHour: 380,
    deposit: 500,
    imageIds: [160, 201, 119],
    features: ['无影墙', '独立化妆间', '免费WiFi', '空调'],
    status: 'available',
    address: '朝阳区创意产业园A座101',
    contact: '138****8888',
    equipments: [
      { id: 'eq-001', name: '神牛DP600II闪光灯', category: 'lighting', quantity: 4, description: '600W专业闪光灯' },
      { id: 'eq-002', name: '柔光箱120cm', category: 'lighting', quantity: 6 },
      { id: 'eq-003', name: '反光伞', category: 'lighting', quantity: 4 },
      { id: 'eq-004', name: '纯色背景纸', category: 'background', quantity: 12, description: '白/黑/灰/红/蓝等12色' },
      { id: 'eq-005', name: '复古沙发', category: 'prop', quantity: 2 },
      { id: 'eq-006', name: '铁艺桌椅', category: 'prop', quantity: 3 }
    ]
  },
  {
    id: 'studio-002',
    name: '星空二号棚',
    type: '直播间/短视频棚',
    area: 80,
    capacity: 5,
    description: '专为直播和短视频打造的多功能棚，配备专业直播灯光、绿幕背景，支持多机位拍摄。',
    pricePerHour: 280,
    deposit: 300,
    imageIds: [3, 6, 8],
    features: ['绿幕背景', '直播灯光', '多机位', '化妆台'],
    status: 'available',
    address: '朝阳区创意产业园A座201',
    contact: '138****8888',
    equipments: [
      { id: 'eq-101', name: '爱图仕LS C300d II', category: 'lighting', quantity: 3, description: '300W影视灯' },
      { id: 'eq-102', name: '球形柔光罩', category: 'lighting', quantity: 3 },
      { id: 'eq-103', name: '绿幕背景', category: 'background', quantity: 1, description: '3x5米专业绿幕' },
      { id: 'eq-104', name: '补光灯环形', category: 'lighting', quantity: 4 },
      { id: 'eq-105', name: '直播桌', category: 'prop', quantity: 2 }
    ]
  },
  {
    id: 'studio-003',
    name: '云端三号棚',
    type: '人像写真棚',
    area: 100,
    capacity: 8,
    description: '专注人像写真的摄影棚，自然光+人工光结合，多种风格场景布置，适合个人写真、艺术照拍摄。',
    pricePerHour: 320,
    deposit: 400,
    imageIds: [64, 91, 177],
    features: ['自然光', '多场景', '独立更衣室', '茶水服务'],
    status: 'maintenance',
    address: '朝阳区创意产业园B座101',
    contact: '138****8888',
    equipments: [
      { id: 'eq-201', name: '保富图D2', category: 'lighting', quantity: 2, description: '1000W专业闪光灯' },
      { id: 'eq-202', name: '柔光箱', category: 'lighting', quantity: 8 },
      { id: 'eq-203', name: '复古背景', category: 'background', quantity: 6 },
      { id: 'eq-204', name: '花束道具', category: 'prop', quantity: 10 },
      { id: 'eq-205', name: '窗帘布景', category: 'background', quantity: 4 }
    ]
  },
  {
    id: 'studio-004',
    name: '矩阵四号棚',
    type: '大型活动棚',
    area: 200,
    capacity: 30,
    description: '超大型摄影棚，可容纳大型团队拍摄，适合时装秀、大型产品、团体照等场景。层高6米。',
    pricePerHour: 680,
    deposit: 1000,
    imageIds: [1080, 1082, 787],
    features: ['大面积', '高空间', '卸货平台', '专业灯光桁架'],
    status: 'available',
    address: '朝阳区创意产业园C座101',
    contact: '138****8888',
    equipments: [
      { id: 'eq-301', name: '布朗Move 1200', category: 'lighting', quantity: 6, description: '1200W电箱闪光灯' },
      { id: 'eq-302', name: '大型柔光箱', category: 'lighting', quantity: 4, description: '2x3米' },
      { id: 'eq-303', name: '反光板', category: 'lighting', quantity: 10 },
      { id: 'eq-304', name: '桁架系统', category: 'prop', quantity: 1, description: '10x8米' },
      { id: 'eq-305', name: '电动背景轴', category: 'background', quantity: 3 }
    ]
  },
  {
    id: 'studio-005',
    name: '简约五号棚',
    type: '电商产品棚',
    area: 60,
    capacity: 3,
    description: '专为电商产品拍摄设计的小型棚，配备专业产品拍摄台，适合小商品、服装平铺等拍摄。',
    pricePerHour: 180,
    deposit: 200,
    imageIds: [2, 9, 119],
    features: ['产品台', '静物拍摄', '免费用电', '平价实惠'],
    status: 'available',
    address: '朝阳区创意产业园B座201',
    contact: '138****8888',
    equipments: [
      { id: 'eq-401', name: '神牛SL60W', category: 'lighting', quantity: 3, description: 'LED常亮灯' },
      { id: 'eq-402', name: '拍摄台', category: 'prop', quantity: 2, description: '1x2米产品拍摄台' },
      { id: 'eq-403', name: '硫酸纸', category: 'lighting', quantity: 10 },
      { id: 'eq-404', name: '倒影板', category: 'prop', quantity: 4 },
      { id: 'eq-405', name: '静物支架', category: 'prop', quantity: 6 }
    ]
  }
];

export const getStudioById = (id: string): Studio | undefined => {
  return mockStudios.find(s => s.id === id);
};

export const getAvailableStudios = (): Studio[] => {
  return mockStudios.filter(s => s.status === 'available');
};
