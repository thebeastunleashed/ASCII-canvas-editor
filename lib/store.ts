import { create } from 'zustand';
import { BorderStyle } from './ascii-draw';

export type Tool = 'select' | 'rect' | 'line' | 'arrow' | 'diamond' | 'text' | 'freehand' | 'eraser';

export interface AppState {
  tool: Tool;
  borderStyle: BorderStyle;
  grid: Map<string, string>;
  history: Map<string, string>[];
  historyIndex: number;
  zoom: number;
  pan: { x: number; y: number };
  
  selection: { x: number, y: number, w: number, h: number } | null;
  selectedContent: Map<string, string> | null;
  
  setTool: (tool: Tool) => void;
  setBorderStyle: (style: BorderStyle) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setSelection: (selection: { x: number, y: number, w: number, h: number } | null) => void;
  setSelectedContent: (content: Map<string, string> | null) => void;
  
  commitDrawing: (drawing: Map<string, string>) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

export const useStore = create<AppState>((set) => ({
  tool: 'rect',
  borderStyle: 'single',
  grid: new Map(),
  history: [new Map()],
  historyIndex: 0,
  zoom: 1,
  pan: { x: 0, y: 0 },
  selection: null,
  selectedContent: null,
  
  setTool: (tool) => set({ tool, selection: null, selectedContent: null }),
  setBorderStyle: (borderStyle) => set({ borderStyle }),
  setZoom: (zoom) => set({ zoom }),
  setPan: (pan) => set({ pan }),
  setSelection: (selection) => set({ selection }),
  setSelectedContent: (selectedContent) => set({ selectedContent }),
  
  commitDrawing: (drawing) => set((state) => {
    const newGrid = new Map(state.grid);
    drawing.forEach((char, key) => {
      if (char === ' ' && state.tool === 'eraser') {
        newGrid.delete(key);
      } else if (char !== '') {
        newGrid.set(key, char);
      }
    });
    
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(newGrid);
    
    return {
      grid: newGrid,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    };
  }),
  
  undo: () => set((state) => {
    if (state.historyIndex > 0) {
      return {
        historyIndex: state.historyIndex - 1,
        grid: new Map(state.history[state.historyIndex - 1]),
      };
    }
    return state;
  }),
  
  redo: () => set((state) => {
    if (state.historyIndex < state.history.length - 1) {
      return {
        historyIndex: state.historyIndex + 1,
        grid: new Map(state.history[state.historyIndex + 1]),
      };
    }
    return state;
  }),
  
  clear: () => set((state) => {
    const newGrid = new Map();
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(newGrid);
    return {
      grid: newGrid,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    };
  }),
}));
