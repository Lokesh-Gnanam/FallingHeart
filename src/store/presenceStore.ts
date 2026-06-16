import { create } from 'zustand';

interface PresenceData {
  online: boolean;
  lastSeen: string;
}

interface PresenceState {
  presenceMap: Record<string, PresenceData>;
  updateUserPresence: (userId: string, online: boolean, lastSeen: string) => void;
  setPresenceMap: (map: Record<string, PresenceData>) => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  presenceMap: {},
  updateUserPresence: (userId, online, lastSeen) => {
    set((state) => ({
      presenceMap: {
        ...state.presenceMap,
        [userId]: { online, lastSeen },
      },
    }));
  },
  setPresenceMap: (presenceMap) => set({ presenceMap }),
}));
