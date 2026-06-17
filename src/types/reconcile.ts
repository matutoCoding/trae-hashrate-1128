export interface FlowRecord {
  id: string;
  orderNo: string;
  type: 'income' | 'expense';
  amount: number;
  subject: string;
  description: string;
  source: 'platform' | 'photographer';
  relatedBookingId?: string;
  relatedStudioId?: string;
  relatedStudioName?: string;
  photographerId?: string;
  photographerName?: string;
  transactionTime: string;
  createdAt: string;
}

export type FlowSource = FlowRecord['source'];
export type FlowType = FlowRecord['type'];

export const FLOW_SOURCE_TEXT: Record<FlowSource, string> = {
  platform: '平台',
  photographer: '摄影师'
};

export const FLOW_TYPE_TEXT: Record<FlowType, string> = {
  income: '收入',
  expense: '支出'
};

export interface ReconcileResult {
  id: string;
  period: string;
  startDate: string;
  endDate: string;
  platformTotalIncome: number;
  platformTotalExpense: number;
  platformNetAmount: number;
  photographerTotalIncome: number;
  photographerTotalExpense: number;
  photographerNetAmount: number;
  matchedCount: number;
  discrepancyCount: number;
  status: 'pending' | 'processing' | 'completed';
  createdAt: string;
  completedAt?: string;
}

export interface DiscrepancyLog {
  id: string;
  discrepancyId: string;
  action: 'created' | 'resolved' | 'ignored' | 'reopened';
  operator: string;
  remark: string;
  createdAt: string;
}

export interface DiscrepancyRecord {
  id: string;
  reconcileId: string;
  platformFlow?: FlowRecord;
  photographerFlow?: FlowRecord;
  orderNo: string;
  type: 'amount_mismatch' | 'missing_platform' | 'missing_photographer' | 'type_mismatch' | 'other';
  platformAmount: number;
  photographerAmount: number;
  diffAmount: number;
  status: 'pending' | 'resolved' | 'ignored';
  resolvedBy?: string;
  resolvedAt?: string;
  resolution?: string;
  remark?: string;
  logs: DiscrepancyLog[];
  createdAt: string;
}

export type DiscrepancyType = DiscrepancyRecord['type'];
export type DiscrepancyStatus = DiscrepancyRecord['status'];

export const DISCREPANCY_TYPE_TEXT: Record<DiscrepancyType, string> = {
  amount_mismatch: '金额不符',
  missing_platform: '平台缺单',
  missing_photographer: '摄影师缺单',
  type_mismatch: '类型不符',
  other: '其他差异'
};

export const DISCREPANCY_STATUS_TEXT: Record<DiscrepancyStatus, string> = {
  pending: '待处理',
  resolved: '已解决',
  ignored: '已忽略'
};

export const DISCREPANCY_STATUS_COLOR: Record<DiscrepancyStatus, string> = {
  pending: '#DC2626',
  resolved: '#059669',
  ignored: '#64748B'
};

export type DiscrepancyLogAction = DiscrepancyLog['action'];

export const DISCREPANCY_LOG_ACTION_TEXT: Record<DiscrepancyLogAction, string> = {
  created: '创建差异',
  resolved: '标记解决',
  ignored: '忽略差异',
  reopened: '重新打开'
};

export const DISCREPANCY_LOG_ACTION_COLOR: Record<DiscrepancyLogAction, string> = {
  created: '#64748B',
  resolved: '#059669',
  ignored: '#64748B',
  reopened: '#DC2626'
};

export interface PhotographerSettlement {
  photographerId: string;
  photographerName: string;
  platformIncome: number;
  platformExpense: number;
  platformNet: number;
  photographerIncome: number;
  photographerExpense: number;
  photographerNet: number;
  diffAmount: number;
  orderCount: number;
  discrepancyCount: number;
  pendingDiscrepancyCount: number;
}

export interface SettlementFilter {
  startDate: string;
  endDate: string;
}

export interface SettlementSheet {
  id: string;
  photographerId: string;
  photographerName: string;
  startDate: string;
  endDate: string;
  platformReceivable: number;
  photographerReceivable: number;
  diffAdjustment: number;
  adjustedAmount: number;
  pendingDiscrepancyCount: number;
  status: 'draft' | 'pending_payment' | 'paid' | 'cancelled';
  createdBy: string;
  createdAt: string;
  confirmedAt?: string;
  paidAt?: string;
  cancelledAt?: string;
  remark?: string;
}

export type SettlementSheetStatus = SettlementSheet['status'];

export const SETTLEMENT_SHEET_STATUS_TEXT: Record<SettlementSheetStatus, string> = {
  draft: '草稿',
  pending_payment: '待打款',
  paid: '已打款',
  cancelled: '已取消'
};

export const SETTLEMENT_SHEET_STATUS_COLOR: Record<SettlementSheetStatus, string> = {
  draft: '#D97706',
  pending_payment: '#2563EB',
  paid: '#059669',
  cancelled: '#94A3B8'
};
