import { create } from 'zustand';
import { FlowRecord, ReconcileResult, DiscrepancyRecord, DiscrepancyLog, PhotographerSettlement } from '@/types/reconcile';
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
  reopenDiscrepancy: (discrepancyId: string, remark: string, operator: string) => Promise<boolean>;
  getDiscrepancyById: (id: string) => DiscrepancyRecord | undefined;
  getRecentlyHandledDiscrepancies: (limit?: number) => DiscrepancyRecord[];
  getPhotographerSettlements: (startDate?: string, endDate?: string) => PhotographerSettlement[];
  getSettlementByPhotographer: (photographerId: string, startDate?: string, endDate?: string) => {
    settlement: PhotographerSettlement;
    flows: FlowRecord[];
    discrepancies: DiscrepancyRecord[];
  } | null;
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

    const createDiscrepancyBase = (type: DiscrepancyRecord['type'], remark: string) => ({
      type,
      status: 'pending' as const,
      remark,
      logs: [] as DiscrepancyLog[]
    });

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
            platformAmount: pf.amount,
            photographerAmount: phf.amount,
            diffAmount: pf.amount - phf.amount,
            ...createDiscrepancyBase('type_mismatch', `类型不匹配：平台${pf.type}，摄影师${phf.type}`)
          });
        } else {
          discrepancies.push({
            platformFlow: pf,
            photographerFlow: phf,
            orderNo: pf.orderNo,
            platformAmount: pf.amount,
            photographerAmount: phf.amount,
            diffAmount: pf.amount - phf.amount,
            ...createDiscrepancyBase('amount_mismatch', `金额不匹配：平台${pf.amount}，摄影师${phf.amount}`)
          });
        }
        photographerMap.delete(pf.orderNo);
      } else {
        discrepancies.push({
          platformFlow: pf,
          photographerFlow: undefined,
          orderNo: pf.orderNo,
          platformAmount: pf.amount,
          photographerAmount: 0,
          diffAmount: pf.amount,
          ...createDiscrepancyBase('missing_photographer', `平台有记录，摄影师无记录：${pf.subject} ${pf.amount}元`)
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
        platformAmount: 0,
        photographerAmount: phf.amount,
        diffAmount: -phf.amount,
        ...createDiscrepancyBase('missing_platform', `摄影师有记录，平台无记录：${phf.subject} ${phf.amount}元`)
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

    const now = new Date().toISOString();
    const newDiscrepancies = discrepancies.map((d, i) => {
      const discId = `disc-${Date.now()}-${i}`;
      const initialLog: DiscrepancyLog = {
        id: `log-${Date.now()}-${i}-init`,
        discrepancyId: discId,
        action: 'created',
        operator: '系统',
        remark: '自动对账发现差异',
        createdAt: now
      };
      return {
        ...d,
        id: discId,
        reconcileId: newReconcile.id,
        createdAt: now,
        logs: [...d.logs, initialLog]
      };
    });

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

    const now = new Date().toISOString();
    const newLog: DiscrepancyLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      discrepancyId,
      action: 'resolved',
      operator: resolvedBy,
      remark: resolution,
      createdAt: now
    };

    set(state => ({
      discrepancies: state.discrepancies.map(d =>
        d.id === discrepancyId
          ? {
              ...d,
              status: 'resolved',
              resolution,
              resolvedBy,
              resolvedAt: now,
              logs: [...d.logs, newLog]
            }
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

    const now = new Date().toISOString();
    const newLog: DiscrepancyLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      discrepancyId,
      action: 'ignored',
      operator: resolvedBy,
      remark,
      createdAt: now
    };

    set(state => ({
      discrepancies: state.discrepancies.map(d =>
        d.id === discrepancyId
          ? {
              ...d,
              status: 'ignored',
              remark,
              resolvedBy,
              resolvedAt: now,
              logs: [...d.logs, newLog]
            }
          : d
      )
    }));

    console.log('[ReconcileStore] 差异已忽略:', discrepancyId, '处理人:', resolvedBy);
    return true;
  },

  reopenDiscrepancy: async (discrepancyId: string, remark: string, operator: string) => {
    const { initialized, initReconcile } = get();
    if (!initialized) {
      initReconcile();
    }

    await new Promise(resolve => setTimeout(resolve, 250));

    const now = new Date().toISOString();
    const newLog: DiscrepancyLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      discrepancyId,
      action: 'reopened',
      operator,
      remark,
      createdAt: now
    };

    set(state => ({
      discrepancies: state.discrepancies.map(d =>
        d.id === discrepancyId
          ? {
              ...d,
              status: 'pending',
              resolvedBy: undefined,
              resolvedAt: undefined,
              resolution: undefined,
              logs: [...d.logs, newLog]
            }
          : d
      )
    }));

    console.log('[ReconcileStore] 差异已重新打开:', discrepancyId, '操作人:', operator);
    return true;
  },

  getRecentlyHandledDiscrepancies: (limit?: number): DiscrepancyRecord[] => {
    const { discrepancies } = get();
    const handled = discrepancies.filter(d => d.status !== 'pending' && d.resolvedAt);
    const sorted = handled.sort(
      (a, b) => new Date(b.resolvedAt!).getTime() - new Date(a.resolvedAt!).getTime()
    );
    return limit ? sorted.slice(0, limit) : sorted;
  },

  getPhotographerSettlements: (startDate?: string, endDate?: string): PhotographerSettlement[] => {
    const { initialized, initReconcile, platformFlows, photographerFlows, discrepancies } = get();
    if (!initialized) {
      initReconcile();
    }

    const filterByDate = (record: { transactionTime?: string; createdAt: string }) => {
      const time = record.transactionTime || record.createdAt;
      if (startDate && time < startDate) return false;
      if (endDate && time > endDate + ' 23:59:59') return false;
      return true;
    };

    const filteredPlatformFlows = platformFlows.filter(filterByDate);
    const filteredPhotographerFlows = photographerFlows.filter(filterByDate);
    const filteredDiscrepancies = discrepancies.filter(d => filterByDate({ createdAt: d.createdAt }));

    const photographerMap = new Map<string, PhotographerSettlement>();

    const addOrUpdatePhotographer = (photographerId: string, photographerName: string) => {
      if (!photographerMap.has(photographerId)) {
        photographerMap.set(photographerId, {
          photographerId,
          photographerName: photographerName || '未知摄影师',
          platformIncome: 0,
          platformExpense: 0,
          platformNet: 0,
          photographerIncome: 0,
          photographerExpense: 0,
          photographerNet: 0,
          diffAmount: 0,
          orderCount: 0,
          discrepancyCount: 0,
          pendingDiscrepancyCount: 0
        });
      }
      return photographerMap.get(photographerId)!;
    };

    filteredPlatformFlows.forEach(flow => {
      if (flow.photographerId) {
        const s = addOrUpdatePhotographer(flow.photographerId, flow.photographerName || '');
        if (flow.type === 'income') {
          s.platformIncome += flow.amount;
        } else {
          s.platformExpense += flow.amount;
        }
        s.orderCount++;
      }
    });

    filteredPhotographerFlows.forEach(flow => {
      if (flow.photographerId) {
        const s = addOrUpdatePhotographer(flow.photographerId, flow.photographerName || '');
        if (flow.type === 'income') {
          s.photographerIncome += flow.amount;
        } else {
          s.photographerExpense += flow.amount;
        }
      }
    });

    filteredDiscrepancies.forEach(disc => {
      if (disc.platformFlow?.photographerId) {
        const s = addOrUpdatePhotographer(
          disc.platformFlow.photographerId,
          disc.platformFlow.photographerName || ''
        );
        s.discrepancyCount++;
        if (disc.status === 'pending') {
          s.pendingDiscrepancyCount++;
        }
      } else if (disc.photographerFlow?.photographerId) {
        const s = addOrUpdatePhotographer(
          disc.photographerFlow.photographerId,
          disc.photographerFlow.photographerName || ''
        );
        s.discrepancyCount++;
        if (disc.status === 'pending') {
          s.pendingDiscrepancyCount++;
        }
      }
    });

    const settlements = Array.from(photographerMap.values()).map(s => ({
      ...s,
      platformNet: s.platformIncome - s.platformExpense,
      photographerNet: s.photographerIncome - s.photographerExpense,
      diffAmount: (s.platformIncome - s.platformExpense) - (s.photographerIncome - s.photographerExpense)
    }));

    return settlements.sort((a, b) => Math.abs(b.diffAmount) - Math.abs(a.diffAmount));
  },

  getSettlementByPhotographer: (photographerId: string, startDate?: string, endDate?: string) => {
    const { initialized, initReconcile, platformFlows, photographerFlows, discrepancies } = get();
    if (!initialized) {
      initReconcile();
    }

    const filterByDate = (record: { transactionTime?: string; createdAt: string }) => {
      const time = record.transactionTime || record.createdAt;
      if (startDate && time < startDate) return false;
      if (endDate && time > endDate + ' 23:59:59') return false;
      return true;
    };

    const allSettlements = get().getPhotographerSettlements(startDate, endDate);
    const settlement = allSettlements.find(s => s.photographerId === photographerId);

    if (!settlement) return null;

    const flows = [
      ...platformFlows.filter(f => f.photographerId === photographerId && filterByDate(f)),
      ...photographerFlows.filter(f => f.photographerId === photographerId && filterByDate(f))
    ].sort((a, b) =>
      new Date(b.transactionTime || b.createdAt).getTime() -
      new Date(a.transactionTime || a.createdAt).getTime()
    );

    const discList = discrepancies.filter(d =>
      (d.platformFlow?.photographerId === photographerId ||
       d.photographerFlow?.photographerId === photographerId) &&
      filterByDate({ createdAt: d.createdAt })
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { settlement, flows, discrepancies: discList };
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
