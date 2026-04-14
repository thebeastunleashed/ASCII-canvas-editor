'use client';

import React from 'react';
import Canvas from './Canvas';
import Toolbar from './Toolbar';
import { useStore } from '@/lib/store';

export default function Editor() {
  const { zoom, pan } = useStore();

  return (
    <div className="w-full h-screen flex flex-col bg-[#0f172a] text-slate-200 font-sans overflow-hidden">
      <Toolbar />
      <div className="flex-1 relative">
        <Canvas />
        
        {/* Status bar */}
        <div className="absolute bottom-4 left-4 flex items-center gap-4 text-xs text-slate-500 font-mono bg-[#1e293b]/80 px-3 py-1.5 rounded-md backdrop-blur-sm border border-slate-700/50 pointer-events-none">
          <div>Zoom: {Math.round(zoom * 100)}%</div>
          <div>Pan: {Math.round(pan.x)}, {Math.round(pan.y)}</div>
          <div>Space+Drag to Pan</div>
        </div>
      </div>
    </div>
  );
}
