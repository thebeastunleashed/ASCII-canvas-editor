import React from 'react';
import { useStore, Tool } from '@/lib/store';
import { BorderStyle } from '@/lib/ascii-draw';
import { 
  MousePointer2, 
  Square, 
  Minus, 
  ArrowRight, 
  Diamond, 
  Type, 
  Pen, 
  Eraser,
  Undo,
  Redo,
  Trash2,
  Copy
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const tools: { id: Tool; icon: React.ElementType; label: string }[] = [
  { id: 'select', icon: MousePointer2, label: 'Select / Pan (V)' },
  { id: 'rect', icon: Square, label: 'Rectangle (R)' },
  { id: 'diamond', icon: Diamond, label: 'Diamond (D)' },
  { id: 'line', icon: Minus, label: 'Line (L)' },
  { id: 'arrow', icon: ArrowRight, label: 'Arrow (A)' },
  { id: 'text', icon: Type, label: 'Text (T)' },
  { id: 'freehand', icon: Pen, label: 'Freehand (P)' },
  { id: 'eraser', icon: Eraser, label: 'Eraser (E)' },
];

const borderStyles: { id: BorderStyle; label: string; preview: string }[] = [
  { id: 'single', label: 'Single', preview: '┌─┐' },
  { id: 'double', label: 'Double', preview: '╔═╗' },
  { id: 'rounded', label: 'Rounded', preview: '╭─╮' },
  { id: 'ascii', label: 'ASCII', preview: '+-+' },
];

export default function Toolbar() {
  const { tool, setTool, borderStyle, setBorderStyle, undo, redo, clear, grid } = useStore();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (grid.size === 0) return;
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    grid.forEach((_, key) => {
      const [x, y] = key.split(',').map(Number);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });

    let result = '';
    for (let y = minY; y <= maxY; y++) {
      let row = '';
      for (let x = minX; x <= maxX; x++) {
        row += grid.get(`${x},${y}`) || ' ';
      }
      result += row.trimEnd() + '\n';
    }

    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#1e293b] p-2 rounded-xl shadow-2xl border border-slate-700/50 backdrop-blur-md z-10">
      <div className="flex items-center gap-1">
        {tools.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              title={t.label}
              className={cn(
                "p-2 rounded-lg transition-colors",
                tool === t.id 
                  ? "bg-sky-500/20 text-sky-400" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </div>

      <div className="w-px h-6 bg-slate-700 mx-1" />

      <div className="flex items-center gap-1">
        {borderStyles.map((s) => (
          <button
            key={s.id}
            onClick={() => setBorderStyle(s.id)}
            title={`Border: ${s.label}`}
            className={cn(
              "px-2 py-1 rounded-lg text-sm font-mono transition-colors",
              borderStyle === s.id 
                ? "bg-sky-500/20 text-sky-400" 
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            )}
          >
            {s.preview}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-slate-700 mx-1" />

      <div className="flex items-center gap-1">
        <button onClick={undo} title="Undo (Ctrl+Z)" className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
          <Undo size={20} />
        </button>
        <button onClick={redo} title="Redo (Ctrl+Shift+Z)" className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
          <Redo size={20} />
        </button>
        <button onClick={clear} title="Clear Canvas" className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors">
          <Trash2 size={20} />
        </button>
      </div>

      <div className="w-px h-6 bg-slate-700 mx-1" />

      <button 
        onClick={handleCopy}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
          copied 
            ? "bg-emerald-500/20 text-emerald-400" 
            : "bg-sky-500 hover:bg-sky-400 text-white"
        )}
      >
        <Copy size={18} />
        {copied ? 'Copied!' : 'Copy ASCII'}
      </button>
    </div>
  );
}
