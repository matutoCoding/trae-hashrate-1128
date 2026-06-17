import { create } from 'zustand';
import { Studio, Equipment } from '@/types/studio';
import { mockStudios } from '@/data/studios';

interface StudioState {
  studios: Studio[];
  currentStudio: Studio | null;
  loading: boolean;
  initialized: boolean;

  initStudios: () => void;
  fetchStudios: () => Promise<void>;
  fetchStudioById: (id: string) => Promise<Studio | undefined>;
  setCurrentStudio: (studio: Studio | null) => void;
  getEquipmentsByCategory: (studioId: string, category: Equipment['category']) => Equipment[];
  getStudioById: (id: string) => Studio | undefined;
}

export const useStudioStore = create<StudioState>((set, get) => ({
  studios: [],
  currentStudio: null,
  loading: false,
  initialized: false,

  initStudios: () => {
    if (get().initialized) return;
    set({ studios: [...mockStudios], initialized: true });
    console.log('[StudioStore] 初始化影棚数据，共', mockStudios.length, '个');
  },

  fetchStudios: async () => {
    const { initialized, initStudios } = get();
    if (!initialized) {
      initStudios();
    }
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 200));
    set({ loading: false });
    console.log('[StudioStore] 影棚列表加载完成，共', get().studios.length, '个');
  },

  fetchStudioById: async (id: string) => {
    const { initialized, initStudios, getStudioById } = get();
    if (!initialized) {
      initStudios();
    }
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 150));
    const studio = getStudioById(id);
    if (studio) {
      set({ currentStudio: studio });
    }
    set({ loading: false });
    console.log('[StudioStore] 影棚详情加载完成:', studio?.name);
    return studio;
  },

  getStudioById: (id: string): Studio | undefined => {
    return get().studios.find(s => s.id === id);
  },

  setCurrentStudio: (studio: Studio | null) => {
    set({ currentStudio: studio });
  },

  getEquipmentsByCategory: (studioId: string, category: Equipment['category']) => {
    const studio = get().studios.find(s => s.id === studioId) || get().currentStudio;
    if (!studio) return [];
    return studio.equipments.filter(e => e.category === category);
  }
}));
