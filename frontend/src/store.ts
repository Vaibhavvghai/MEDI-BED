import { create } from 'zustand';

interface Bed {
  id: number;
  bedNumber: string;
  wardType: string;
  status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED';
  floor: number;
  hospitalId: number;
}

interface AppState {
  token: string | null;
  activePatient: any | null;
  activeUser: { id: number, role: string, hospitalId?: number, name?: string } | null;
  bedsCache: Record<number, Bed>; // id to Bed map
  setToken: (token: string) => void;
  setActiveUser: (user: any) => void;
  setActivePatient: (patient: any) => void;
  patchBedStatus: (bedId: number, status: Bed['status']) => void;
  setBeds: (beds: Bed[]) => void;
}

export const useStore = create<AppState>((set) => ({
  token: null,
  activePatient: null,
  activeUser: null,
  bedsCache: {},
  setToken: (token) => set({ token }),
  setActiveUser: (user) => set({ activeUser: user }),
  setActivePatient: (patient) => set({ activePatient: patient }),
  patchBedStatus: (bedId, status) => set((state) => ({
    bedsCache: {
      ...state.bedsCache,
      [bedId]: {
        ...state.bedsCache[bedId],
        status
      }
    }
  })),
  setBeds: (beds) => {
    const map: Record<number, Bed> = {};
    beds.forEach(b => map[b.id] = b);
    set({ bedsCache: map });
  }
}));
