import { create } from 'zustand';

interface Novel {
  id: number;
  title: string;
  genre: string;
}

interface AppState {
  selectedNovel: Novel | null;
  setSelectedNovel: (novel: Novel | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedNovel: null,
  setSelectedNovel: (novel) => set({ selectedNovel: novel }),
}));
