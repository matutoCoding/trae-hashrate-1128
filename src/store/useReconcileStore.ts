import { create } from 'zustand';
import { FlowRecord, ReconcileResult, DiscrepancyRecord } from '@/types/reconcile';
import {
  mockPlatformFlows,
  mockPhotographerFlows,
  mockReconcileResults
} from '@/data/flows';
import { mockDiscrepancies } from '@/data/discrepancies';

interface ReconcileState {
  platformFlows: FlowRecord[];
  photographerFlows: FlowRecord[];
  reconcileResults: ReconcileResult[];
  discrepancies: DiscrepancyRecord[];
  currentReconcile: ReconcileResult | null;
  currentDiscrepancy: DiscrepancyRecord | null;
  loading: boolean;
  selectedPeriod: string;
  initialized: boolean;

  initReconcile: () => void;
  fetchFlows: () => Promise<void>;
  fetchFlowsBySource: (source: 'platform' | 'photographer') => Promise<void>;
  fetchReconcileResults: () => Promise<void>;
  fetchDiscrepancies: (status?: string) => Promise<void>;
  runReconciliation: (startDate: string, endDate: string) => Promise<ReconcileResult>;
  resolveDiscrepancy: (discrepancyId: string, resolution: string, resolvedBy: string) => Promise<boolean>;
  ignoreDiscrepancy: (discrepancyId: string, remark: string, resolvedBy: string) => Promise<boolean>;
  getDiscrepancyById: (id: string) => DiscrepancyRecord | undefined;
  compareFlows: (platformFlows: FlowRecord[], photographerFlows: FlowRecord[]) => {
    matched: FlowRecord[];
    discrepancies: Omit<DiscrepancyRecord, 'id' | 'reconcileId' | 'createdAt'>[];
  };
  getSummary: () => {
    platformTotal: number;
    photographerTotal: number;
    diff: number;
    matchedCount: number;
    discrepancyCount: number;
    pendingDiscrepancyCount: number;
  };
}

export const useReconcileStore = create<ReconcileState>((set, get) => ({
  platformFlows: [],
  photographerFlows: [],
  reconcileResults: [],
  discrepancies: [],
  currentReconcile: null,
  currentDiscrepancy: null,
  loading: false,
  selectedPeriod: 'today',
  initialized: false,

  initReconcile: () => {
    if (get().initialized) return;
    set({
      platformFlows: [...mockPlatformFlows],
      photographerFlows: [...mockPhotographerFlows],
      reconcileResults: [...mockReconcileResults],
      discrepancies: [...mockDiscrepancies],
      initialized: true
    });
    console.log('[ReconcileStore] 初始化对账数据，共', mockPlatformFlows.length, '条平台流水，',
                mockPhotographerFlows.length, '条摄影师流水，',
                mockDiscrepancies.length, '条差异记录');
  },

  fetchFlows: async () => {
    const { initialized, initReconcile } = get();
    if (!initialized) {
      initReconcile();
    }
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 200));
    set({ loading: false });
    console.log('[ReconcileStore] 流水数据加载完成');
  },

  fetchFlowsBySource: async (source: 'platform' | 'photographer') => {
    const { initialized, initReconcile } = get();
    if (!initialized) {
      initReconcile();
    }
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 150));
    set({ loading: false });
  },

  fetchReconcileResults: async () => {
    const { initialized, initReconcile } = get();
    if (!initialized) {
      initReconcile();
    }
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 200));
    set(state => ({
      reconcileResults: [...state.reconcileResults].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      loading: false
    }));
    console.log('[ReconcileStore] 对账结果加载完成，共', get().reconcileResults.length, '条');
  },

  fetchDiscrepancies: async (_status?: string) => {
    const { initialized, initReconcile } = get();
    if (!initialized) {
      initReconcile();
    }
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 200));
    set(state => ({
      discrepancies: [...state.discrepancies].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      loading: false
    }));
    console.log('[ReconcileStore] 差异记录加载完成，共', get().discrepancies.length, '条');
  },

  getDiscrepancyById: (id: string): DiscrepancyRecord | undefined => {
    return get().discrepancies.find(d => d.id === id);
  },

  compareFlows: (platformFlows: FlowRecord[], photographerFlows: FlowRecord[]) => {
    const matched: FlowRecord[] = [];
    const discrepancies: Omit<DiscrepancyRecord, 'id' | 'reconcileId' | 'createdAt'>[] = [];

    const platformMap = new Map(platformFlows.map(f => [f.orderNo, f]));
    const photographerMap = new Map(photographerFlows.map(f => [f.orderNo, f]));

    platformFlows.forEach(pf => {
      const phf = photographerMap.get(pf.orderNo);
      if (phf) {
        if (Math.abs(pf.amount - phf.amount) < 0.01 && pf.type === phf.type) {
          matched.push(pf);
        } else if (pf.type !== phf.type) {
          discrepancies.push({
            platformFlow: pf,
            photographerFlow: phf,
            orderNo: pf.orderNo,
            type: 'type_mismatch',
            platformAmount: pf.amount,
            photographerAmount: phf.amount,
            diffAmount: pf.amount - phf.amount,
            status: 'pending',
            remark: `类型不匹配：平台${pf.type}，摄影师${phf.type}`
          });
        } else {
          discrepancies.push({
            platformFlow: pf,
            photographerFlow: phf,
            orderNo: pf.orderNo,
            type: 'amount_mismatch',
            platformAmount: pf.amount,
            photographerAmount: phf.amount,
            diffAmount: pf.amount - phf.amount,
            status: 'pending',
            remark: `金额不匹配：平台${pf.amount}，摄影师${phf.amount}`
          });
        }
        photographerMap.delete(pf.orderNo);
      } else {
        discrepancies.push({
          platformFlow: pf,
          photographerFlow: undefined,
          orderNo: pf.orderNo,
          type: 'missing_photographer',
          platformAmount: pf.amount,
          photographerAmount: 0,
          diffAmount: pf.amount,
          status: 'pending',
          remark: `平台有记录，摄影师无记录：${pf.subject} ${pf.amount}元`
        });
      }
      platformMap.delete(pf.orderNo);
    });

    photographerFlows.forEach(phf => {
      if (platformMap.has(phf.orderNo)) return;
      discrepancies.push({
        platformFlow: undefined,
        photographerFlow: phf,
        orderNo: phf.orderNo,
        type: 'missing_platform',
        platformAmount: 0,
        photographerAmount: phf.amount,
        diffAmount: -phf.amount,
        status: 'pending',
        remark: `摄影师有记录，平台无记录：${phf.subject} ${phf.amount}元`
      });
    });

    console.log('[ReconcileStore] 对账完成：匹配', matched.length, '条，差异', discrepancies.length, '条');
    return { matched, discrepancies };
  },

  runReconciliation: async (startDate: string, endDate: string) => {
    const { initialized, initReconcile } = get();
    if (!initialized) {
      initReconcile();
    }

    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { platformFlows, photographerFlows } = get();
    const { matched, discrepancies } = get().compareFlows(platformFlows, photographerFlows);

    const platformTotalIncome = platformFlows.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
    const platformTotalExpense = platformFlows.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
    const photographerTotalIncome = photographerFlows.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
    const photographerTotalExpense = photographerFlows.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);

    const newReconcile: ReconcileResult = {
      id: `recon-${Date.now()}`,
      period: `${startDate} 至 ${endDate}`,
      startDate,
      endDate,
      platformTotalIncome,
      platformTotalExpense,
      platformNetAmount: platformTotalIncome - platformTotalExpense,
      photographerTotalIncome,
      photographerTotalExpense,
      photographerNetAmount: photographerTotalIncome - photographerTotalExpense,
      matchedCount: matched.length,
      discrepancyCount: discrepancies.length,
      status: 'completed',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    const newDiscrepancies = discrepancies.map((d, i) => ({
      ...d,
      id: `disc-${Date.now()}-${i}`,
      reconcileId: newReconcile.id,
      createdAt: new Date().toISOString()
    }));

    set(state => ({
      reconcileResults: [newReconcile, ...state.reconcileResults],
      discrepancies: [...newDiscrepancies, ...state.discrepancies],
      loading: false
    }));

    console.log('[ReconcileStore] 对账任务完成:', newReconcile.id, '新增差异:', newDiscrepancies.length, '条');
    return newReconcile;
  },

  resolveDiscrepancy: async (discrepancyId: string, resolution: string, resolvedBy: string) => {
    const { initialized, initReconcile } = get();
    if (!initialized) {
      initReconcile();
    }

    await new Promise(resolve => setTimeout(resolve, 250));

    set(state => ({
      discrepancies: state.discrepancies.map(d =>
        d.id === discrepancyId
          ? { ...d, status: 'resolved', resolution, resolvedBy, resolvedAt: new Date().toISOString() }
          : d
      )
    }));

    console.log('[ReconcileStore] 差异已解决:', discrepancyId, '处理人:', resolvedBy);
    return true;
  },

  ignoreDiscrepancy: async (discrepancyId: string, remark: string, resolvedBy: string) => {
    const { initialized, initReconcile } = get();
    if (!initialized) {
      initReconcile();
    }

    await new Promise(resolve => setTimeout(resolve, 250));

    set(state => ({
      discrepancies: state.discrepancies.map(d =>
        d.id === discrepancyId
          ? { ...d, status: 'ignored', remark, resolvedBy, resolvedAt: new Date().toISOString() }
          : d
      )
    }));

    console.log('[ReconcileStore] 差异已忽略:', discrepancyId, '处理人:', resolvedBy);
    return true;
  },

  getSummary: () => {
    const { platformFlows, photographerFlows, discrepancies } = get();

    const platformTotal = platformFlows.reduce((sum, f) => sum + (f.type === 'income' ? f.amount : -f.amount), 0);
    const photographerTotal = photographerFlows.reduce((sum, f) => sum + (f.type === 'income' ? f.amount : -f.amount), 0);
    const pendingCount = discrepancies.filter(d => d.status === 'pending').length;

    return {
      platformTotal,
      photographerTotal,
      diff: platformTotal - photographerTotal,
      matchedCount: platformFlows.length,
      discrepancyCount: discrepancies.length,
      pendingDiscrepancyCount: pendingCount
    };
  }
}));
