import { create } from 'zustand';

interface Tick {
  time: number;
  price: number;
}

interface MarketState {
  ticks: Tick[];
  addTick: (tick: Tick) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  ticks: [],
  addTick: (tick) => set((state) => ({ 
    ticks: [...state.ticks.slice(-999), tick] 
  })),
}));
