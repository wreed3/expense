import { create } from 'zustand';

export interface CalculationHistoryItem {
  expression: string;
  result: number;
  timestamp: number;
}

interface CalculatorState {
  display: string;
  memory: number;
  history: CalculationHistoryItem[];
  isOpen: boolean;
  activeInputId: string | null;

  // Actions
  setDisplay: (value: string) => void;
  appendToDisplay: (value: string) => void;
  clearDisplay: () => void;
  backspace: () => void;
  addToHistory: (expression: string, result: number) => void;
  clearHistory: () => void;
  setMemory: (value: number) => void;
  addToMemory: (value: number) => void;
  subtractFromMemory: (value: number) => void;
  clearMemory: () => void;
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  setActiveInput: (id: string | null) => void;
}

export const useCalculatorStore = create<CalculatorState>((set) => ({
  display: '0',
  memory: 0,
  history: [],
  isOpen: false,
  activeInputId: null,

  setDisplay: (value) => set({ display: value }),
  
  appendToDisplay: (value) =>
    set((state) => ({
      display: state.display === '0' ? value : state.display + value,
    })),

  clearDisplay: () => set({ display: '0' }),

  backspace: () =>
    set((state) => ({
      display: state.display.length > 1 ? state.display.slice(0, -1) : '0',
    })),

  addToHistory: (expression, result) =>
    set((state) => ({
      history: [
        { expression, result, timestamp: Date.now() },
        ...state.history.slice(0, 49), // Keep last 50
      ],
    })),

  clearHistory: () => set({ history: [] }),

  setMemory: (value) => set({ memory: value }),

  addToMemory: (value) =>
    set((state) => ({ memory: state.memory + value })),

  subtractFromMemory: (value) =>
    set((state) => ({ memory: state.memory - value })),

  clearMemory: () => set({ memory: 0 }),

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

  setOpen: (open) => set({ isOpen: open }),

  setActiveInput: (id) => set({ activeInputId: id }),
}));