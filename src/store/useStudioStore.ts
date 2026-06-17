import { create } from 'zustand';
import { Studio, Equipment } from '@/types/studio';
import { mockStudios, getStudioById, getAvailableStudios } from '@/data/studios';

interface StudioState {
  studios: Studio[];
  currentStudio: Studio | null;
  loading: boolean;
  fetchStudios: () => Promise<void>;
  fetchStudioById: (id: string) => Promise<Studio | undefined>;
  setCurrentStudio: (studio: Studio | null) => void;
  getEquipmentsByCategory: (studioId: string, category: Equipment['category']) => Equipment[];
}

export const useStudioStore = create<StudioState>((set, get) => ({
  studios: [],
  currentStudio: null,
  loading: false,

  fetchStudios: async () => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 300));
    set({ studios: getAvailableStudios(), loading: false });
    console.log('[StudioStore] 影棚列表加载完成，共', getAvailableStudios().length, '个');
  },

  fetchStudioById: async (id: string) => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 200));
    const studio = getStudioById(id);
    if (studio) {
      set({ currentStudio: studio });
    }
    set({ loading: false });
    console.log('[StudioStore] 影棚详情加载完成:', studio?.name);
    return studio;
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
