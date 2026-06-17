import { DiscrepancyRecord } from '@/types/reconcile';
import { mockPlatformFlows, mockPhotographerFlows } from './flows';

export const mockDiscrepancies: DiscrepancyRecord[] = [
  {
    id: 'disc-001',
    reconcileId: 'recon-002',
    platformFlow: mockPlatformFlows.find(f => f.orderNo === 'ORD202506170002'),
    photographerFlow: mockPhotographerFlows.find(f => f.orderNo === 'ORD202506170002'),
    orderNo: 'ORD202506170002',
    type: 'amount_mismatch',
    platformAmount: 1140.00,
    photographerAmount: 1100.00,
    diffAmount: 40.00,
    status: 'pending',
    remark: '平台记录1140元，摄影师记录1100元，差额40元',
    createdAt: '2025-06-17 02:02:00'
  },
  {
    id: 'disc-002',
    reconcileId: 'recon-002',
    platformFlow: mockPlatformFlows.find(f => f.orderNo === 'ORD202506170003'),
    photographerFlow: undefined,
    orderNo: 'ORD202506170003',
    type: 'missing_photographer',
    platformAmount: -380.00,
    photographerAmount: 0,
    diffAmount: -380.00,
    status: 'pending',
    remark: '平台有退款记录380元，摄影师无对应记录',
    createdAt: '2025-06-17 02:02:00'
  },
  {
    id: 'disc-003',
    reconcileId: 'recon-002',
    platformFlow: mockPlatformFlows.find(f => f.orderNo === 'ORD202506170006'),
    photographerFlow: undefined,
    orderNo: 'ORD202506170006',
    type: 'missing_photographer',
    platformAmount: 6800.00,
    photographerAmount: 0,
    diffAmount: 6800.00,
    status: 'pending',
    remark: '平台有收款记录6800元，摄影师无对应记录（明日订单）',
    createdAt: '2025-06-17 02:02:00'
  },
  {
    id: 'disc-004',
    reconcileId: 'recon-002',
    platformFlow: undefined,
    photographerFlow: mockPhotographerFlows.find(f => f.orderNo === 'ORD202506170008'),
    orderNo: 'ORD202506170008',
    type: 'missing_platform',
    platformAmount: 0,
    photographerAmount: 200.00,
    diffAmount: -200.00,
    status: 'pending',
    remark: '摄影师有额外服务收入200元，平台无对应记录',
    createdAt: '2025-06-17 02:02:00'
  },
  {
    id: 'disc-005',
    reconcileId: 'recon-001',
    orderNo: 'ORD202506160010',
    type: 'amount_mismatch',
    platformAmount: 1500.00,
    photographerAmount: 1450.00,
    diffAmount: 50.00,
    status: 'resolved',
    resolvedBy: '管理员',
    resolvedAt: '2025-06-17 09:30:00',
    resolution: '已核实，差额为平台优惠券抵扣，已补充说明',
    createdAt: '2025-06-17 02:02:00'
  },
  {
    id: 'disc-006',
    reconcileId: 'recon-001',
    orderNo: 'ORD202506160015',
    type: 'other',
    platformAmount: 0,
    photographerAmount: 300.00,
    diffAmount: -300.00,
    status: 'ignored',
    resolvedBy: '管理员',
    resolvedAt: '2025-06-17 10:15:00',
    resolution: '摄影师私下收费，已记录警告，本次忽略',
    createdAt: '2025-06-17 02:02:00'
  }
];

export const getDiscrepancies = (status?: string): DiscrepancyRecord[] => {
  if (status) {
    return mockDiscrepancies.filter(d => d.status === status);
  }
  return mockDiscrepancies;
};

export const getDiscrepancyById = (id: string): DiscrepancyRecord | undefined => {
  return mockDiscrepancies.find(d => d.id === id);
};

export const getDiscrepanciesByReconcile = (reconcileId: string): DiscrepancyRecord[] => {
  return mockDiscrepancies.filter(d => d.reconcileId === reconcileId);
};
