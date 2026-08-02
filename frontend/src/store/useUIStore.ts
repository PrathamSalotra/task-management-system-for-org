import { create } from 'zustand';

export interface UIFilterState {
  status?: string;
  priority?: string;
  search?: string;
}

export interface UIStoreState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  activeFilter: UIFilterState;
  setFilter: (filter: Partial<UIFilterState>) => void;
  clearFilters: () => void;
}

export const useUIStore = create<UIStoreState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  selectedProjectId: null,
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  activeFilter: {},
  setFilter: (filter) =>
    set((state) => ({
      activeFilter: { ...state.activeFilter, ...filter },
    })),
  clearFilters: () => set({ activeFilter: {} }),
}));
