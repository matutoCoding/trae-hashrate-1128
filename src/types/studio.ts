export interface Equipment {
  id: string;
  name: string;
  category: 'lighting' | 'prop' | 'background' | 'camera';
  quantity: number;
  description?: string;
}

export interface Studio {
  id: string;
  name: string;
  type: string;
  area: number;
  capacity: number;
  description: string;
  pricePerHour: number;
  deposit: number;
  equipments: Equipment[];
  imageIds: number[];
  features: string[];
  status: 'available' | 'maintenance' | 'closed';
  address: string;
  contact: string;
}

export type StudioStatus = Studio['status'];

export const STUDIO_STATUS_TEXT: Record<StudioStatus, string> = {
  available: '营业中',
  maintenance: '维护中',
  closed: '已关闭'
};

export const STUDIO_STATUS_COLOR: Record<StudioStatus, string> = {
  available: '#059669',
  maintenance: '#D97706',
  closed: '#64748B'
};

export const EQUIPMENT_CATEGORY_TEXT: Record<Equipment['category'], string> = {
  lighting: '灯光设备',
  prop: '道具',
  background: '背景',
  camera: '摄影器材'
};
