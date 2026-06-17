import { FlowRecord, ReconcileResult } from '@/types/reconcile';
import { formatDate } from '@/utils/date';

const today = formatDate(new Date());
const yesterday = formatDate(new Date(Date.now() - 86400000));

export const mockPlatformFlows: FlowRecord[] = [
  {
    id: 'pf-001',
    orderNo: 'ORD202506170001',
    type: 'income',
    amount: 1140.00,
    subject: '影棚租赁费',
    description: '光影一号棚 2025-06-17 09:00-12:00',
    source: 'platform',
    relatedBookingId: 'bk-001',
    relatedStudioId: 'studio-001',
    relatedStudioName: '光影一号棚',
    photographerId: 'p-001',
    photographerName: '李摄影师',
    transactionTime: '2025-06-17 09:00:00',
    createdAt: '2025-06-17 09:00:00'
  },
  {
    id: 'pf-002',
    orderNo: 'ORD202506170002',
    type: 'income',
    amount: 1140.00,
    subject: '影棚租赁费',
    description: '光影一号棚 2025-06-17 14:00-17:00',
    source: 'platform',
    relatedBookingId: 'bk-002',
    relatedStudioId: 'studio-001',
    relatedStudioName: '光影一号棚',
    photographerId: 'p-002',
    photographerName: '王摄影师',
    transactionTime: '2025-06-17 14:00:00',
    createdAt: '2025-06-17 14:00:00'
  },
  {
    id: 'pf-003',
    orderNo: 'ORD202506170003',
    type: 'expense',
    amount: 380.00,
    subject: '超时退款',
    description: '光影一号棚 超时未到，扣除押金后退款',
    source: 'platform',
    relatedBookingId: 'bk-003',
    relatedStudioId: 'studio-001',
    relatedStudioName: '光影一号棚',
    transactionTime: '2025-06-17 18:15:00',
    createdAt: '2025-06-17 18:15:00'
  },
  {
    id: 'pf-004',
    orderNo: 'ORD202506170004',
    type: 'income',
    amount: 840.00,
    subject: '影棚租赁费',
    description: '星空二号棚 2025-06-17 10:00-13:00',
    source: 'platform',
    relatedBookingId: 'bk-004',
    relatedStudioId: 'studio-002',
    relatedStudioName: '星空二号棚',
    photographerId: 'p-001',
    photographerName: '李摄影师',
    transactionTime: '2025-06-17 10:00:00',
    createdAt: '2025-06-17 10:00:00'
  },
  {
    id: 'pf-005',
    orderNo: 'ORD202506170005',
    type: 'income',
    amount: 1120.00,
    subject: '影棚租赁费',
    description: '星空二号棚 2025-06-17 14:00-18:00',
    source: 'platform',
    relatedBookingId: 'bk-005',
    relatedStudioId: 'studio-002',
    relatedStudioName: '星空二号棚',
    transactionTime: '2025-06-17 14:00:00',
    createdAt: '2025-06-17 14:00:00'
  },
  {
    id: 'pf-006',
    orderNo: 'ORD202506170006',
    type: 'income',
    amount: 6800.00,
    subject: '影棚租赁费',
    description: '矩阵四号棚 2025-06-18 08:00-18:00',
    source: 'platform',
    relatedBookingId: 'bk-006',
    relatedStudioId: 'studio-004',
    relatedStudioName: '矩阵四号棚',
    photographerId: 'p-003',
    photographerName: '陈摄影师',
    transactionTime: '2025-06-17 10:00:00',
    createdAt: '2025-06-17 10:00:00'
  },
  {
    id: 'pf-007',
    orderNo: 'ORD202506170007',
    type: 'income',
    amount: 540.00,
    subject: '影棚租赁费',
    description: '简约五号棚 2025-06-17 09:00-12:00',
    source: 'platform',
    relatedBookingId: 'bk-007',
    relatedStudioId: 'studio-005',
    relatedStudioName: '简约五号棚',
    transactionTime: '2025-06-17 09:00:00',
    createdAt: '2025-06-17 09:00:00'
  }
];

export const mockPhotographerFlows: FlowRecord[] = [
  {
    id: 'phf-001',
    orderNo: 'ORD202506170001',
    type: 'income',
    amount: 1140.00,
    subject: '影棚服务收入',
    description: '光影一号棚 2025-06-17 09:00-12:00',
    source: 'photographer',
    relatedBookingId: 'bk-001',
    relatedStudioId: 'studio-001',
    relatedStudioName: '光影一号棚',
    photographerId: 'p-001',
    photographerName: '李摄影师',
    transactionTime: '2025-06-17 09:00:00',
    createdAt: '2025-06-17 09:00:00'
  },
  {
    id: 'phf-002',
    orderNo: 'ORD202506170002',
    type: 'income',
    amount: 1100.00,
    subject: '影棚服务收入',
    description: '光影一号棚 2025-06-17 14:00-17:00',
    source: 'photographer',
    relatedBookingId: 'bk-002',
    relatedStudioId: 'studio-001',
    relatedStudioName: '光影一号棚',
    photographerId: 'p-002',
    photographerName: '王摄影师',
    transactionTime: '2025-06-17 14:00:00',
    createdAt: '2025-06-17 14:00:00'
  },
  {
    id: 'phf-003',
    orderNo: 'ORD202506170004',
    type: 'income',
    amount: 840.00,
    subject: '影棚服务收入',
    description: '星空二号棚 2025-06-17 10:00-13:00',
    source: 'photographer',
    relatedBookingId: 'bk-004',
    relatedStudioId: 'studio-002',
    relatedStudioName: '星空二号棚',
    photographerId: 'p-001',
    photographerName: '李摄影师',
    transactionTime: '2025-06-17 10:00:00',
    createdAt: '2025-06-17 10:00:00'
  },
  {
    id: 'phf-004',
    orderNo: 'ORD202506170005',
    type: 'income',
    amount: 1120.00,
    subject: '影棚服务收入',
    description: '星空二号棚 2025-06-17 14:00-18:00',
    source: 'photographer',
    relatedBookingId: 'bk-005',
    relatedStudioId: 'studio-002',
    relatedStudioName: '星空二号棚',
    transactionTime: '2025-06-17 14:00:00',
    createdAt: '2025-06-17 14:00:00'
  },
  {
    id: 'phf-005',
    orderNo: 'ORD202506170007',
    type: 'income',
    amount: 540.00,
    subject: '影棚服务收入',
    description: '简约五号棚 2025-06-17 09:00-12:00',
    source: 'photographer',
    relatedBookingId: 'bk-007',
    relatedStudioId: 'studio-005',
    relatedStudioName: '简约五号棚',
    transactionTime: '2025-06-17 09:00:00',
    createdAt: '2025-06-17 09:00:00'
  },
  {
    id: 'phf-006',
    orderNo: 'ORD202506170008',
    type: 'income',
    amount: 200.00,
    subject: '额外服务收入',
    description: '设备租赁附加费',
    source: 'photographer',
    transactionTime: '2025-06-17 15:30:00',
    createdAt: '2025-06-17 15:30:00'
  }
];

export const mockReconcileResults: ReconcileResult[] = [
  {
    id: 'recon-001',
    period: '2025年6月16日',
    startDate: yesterday,
    endDate: yesterday,
    platformTotalIncome: 8500.00,
    platformTotalExpense: 500.00,
    platformNetAmount: 8000.00,
    photographerTotalIncome: 8450.00,
    photographerTotalExpense: 0.00,
    photographerNetAmount: 8450.00,
    matchedCount: 8,
    discrepancyCount: 2,
    status: 'completed',
    createdAt: '2025-06-17 02:00:00',
    completedAt: '2025-06-17 02:05:00'
  },
  {
    id: 'recon-002',
    period: '2025年6月17日',
    startDate: today,
    endDate: today,
    platformTotalIncome: 11580.00,
    platformTotalExpense: 380.00,
    platformNetAmount: 11200.00,
    photographerTotalIncome: 4940.00,
    photographerTotalExpense: 0.00,
    photographerNetAmount: 4940.00,
    matchedCount: 4,
    discrepancyCount: 4,
    status: 'completed',
    createdAt: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'),
    completedAt: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
  }
];

export const getAllFlows = (): FlowRecord[] => {
  return [...mockPlatformFlows, ...mockPhotographerFlows].sort(
    (a, b) => new Date(b.transactionTime).getTime() - new Date(a.transactionTime).getTime()
  );
};

export const getFlowsBySource = (source: 'platform' | 'photographer'): FlowRecord[] => {
  const flows = source === 'platform' ? mockPlatformFlows : mockPhotographerFlows;
  return flows.sort(
    (a, b) => new Date(b.transactionTime).getTime() - new Date(a.transactionTime).getTime()
  );
};
