import { create } from 'zustand';

const useSearchStore = create((set) => ({
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q })
}));

export default useSearchStore;


