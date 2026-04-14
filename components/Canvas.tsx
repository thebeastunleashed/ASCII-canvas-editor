import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { drawRect, drawSmartLine, drawArrow, drawDiamond, Point } from '@/lib/ascii-draw';

const FONT_FAMILY = '"JetBrains Mono", "Fira Code", monospace';
const FONT_SIZE = 16;
const CHAR_WIDTH = 9.6;
const CHAR_HEIGHT = 19.2;

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { tool, borderStyle, grid, commitDrawing, zoom, pan, setPan, setZoom, selection, setSelection, selectedContent, setSelectedContent } = useStore();
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [preview, setPreview] = useState<Map<string, string>>(new Map());
  
  const [charSize, setCharSize] = useState({ w: CHAR_WIDTH, h: CHAR_HEIGHT });
  const [isPanning, setIsPanning] = useState(false);
  const [isMovingSelection, setIsMovingSelection] = useState(false);
  const [selectionOffset, setSelectionOffset] = useState<Point>({ x: 0, y: 0 });
  const [lastMousePos, setLastMousePos] = useState<Point | null>(null);
  const [textInput, setTextInput] = useState<{ x: number, y: number, text: string } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
    const metrics = ctx.measureText('M');
    const w = metrics.width;
    const h = FONT_SIZE * 1.2;
    setCharSize({ w, h });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeObserver = new ResizeObserver(() => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        render();
      }
    });
    resizeObserver.observe(canvas.parentElement!);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);
      
      ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
      ctx.textBaseline = 'top';
      
      ctx.fillStyle = '#e2e8f0';
      grid.forEach((char, key) => {
        const [x, y] = key.split(',').map(Number);
        // Don't draw if it's currently selected and being moved
        if (selectedContent && selectedContent.has(key)) return;
        ctx.fillText(char, x * charSize.w, y * charSize.h);
      });

      if (selectedContent) {
        ctx.fillStyle = '#fcd34d'; // amber-300
        selectedContent.forEach((char, key) => {
          const [x, y] = key.split(',').map(Number);
          ctx.fillText(char, (x + selectionOffset.x) * charSize.w, (y + selectionOffset.y) * charSize.h);
        });
      }

      ctx.fillStyle = '#38bdf8';
      preview.forEach((char, key) => {
        const [x, y] = key.split(',').map(Number);
        ctx.fillText(char, x * charSize.w, y * charSize.h);
      });

      if (selection) {
        ctx.strokeStyle = '#38bdf8';
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
          (selection.x + selectionOffset.x) * charSize.w, 
          (selection.y + selectionOffset.y) * charSize.h, 
          selection.w * charSize.w, 
          selection.h * charSize.h
        );
        ctx.setLineDash([]);
      }

      if (textInput) {
        ctx.fillStyle = '#38bdf8';
        for (let i = 0; i < textInput.text.length; i++) {
          ctx.fillText(textInput.text[i], (textInput.x + i) * charSize.w, textInput.y * charSize.h);
        }
        ctx.fillRect((textInput.x + textInput.text.length) * charSize.w, textInput.y * charSize.h, charSize.w, charSize.h);
      }

      ctx.restore();
    };

    let animationFrameId: number;
    const loop = () => {
      render();
      animationFrameId = requestAnimationFrame(loop);
    };
    loop();
    
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [grid, preview, pan, zoom, charSize, textInput, selection, selectedContent, selectionOffset]);

  const getGridPoint = (e: React.MouseEvent | MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const adjustedX = (mouseX - pan.x) / zoom;
    const adjustedY = (mouseY - pan.y) / zoom;
    
    return {
      x: Math.floor(adjustedX / charSize.w),
      y: Math.floor(adjustedY / charSize.h),
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      return;
    }

    if (e.button !== 0) return;

    const pt = getGridPoint(e);
    
    if (tool === 'select') {
      if (selection && 
          pt.x >= selection.x + selectionOffset.x && 
          pt.x < selection.x + selectionOffset.x + selection.w &&
          pt.y >= selection.y + selectionOffset.y && 
          pt.y < selection.y + selectionOffset.y + selection.h) {
        // Clicked inside selection, start moving
        setIsMovingSelection(true);
        setStartPoint(pt);
        return;
      }
      
      // Clicked outside, commit previous selection if moved
      if (selectedContent && (selectionOffset.x !== 0 || selectionOffset.y !== 0)) {
        const newDrawing = new Map();
        selectedContent.forEach((char, key) => {
          const [x, y] = key.split(',').map(Number);
          newDrawing.set(`${x + selectionOffset.x},${y + selectionOffset.y}`, char);
          // Erase original
          newDrawing.set(`${x},${y}`, ' ');
        });
        commitDrawing(newDrawing);
      }
      
      setSelection(null);
      setSelectedContent(null);
      setSelectionOffset({ x: 0, y: 0 });
      
      setIsDrawing(true);
      setStartPoint(pt);
      return;
    }
    
    if (tool === 'text') {
      if (textInput) {
        const newDrawing = new Map();
        for (let i = 0; i < textInput.text.length; i++) {
          newDrawing.set(`${textInput.x + i},${textInput.y}`, textInput.text[i]);
        }
        commitDrawing(newDrawing);
      }
      setTextInput({ x: pt.x, y: pt.y, text: '' });
      return;
    }

    if (textInput) {
      const newDrawing = new Map();
      for (let i = 0; i < textInput.text.length; i++) {
        newDrawing.set(`${textInput.x + i},${textInput.y}`, textInput.text[i]);
      }
      commitDrawing(newDrawing);
      setTextInput(null);
    }

    setIsDrawing(true);
    setStartPoint(pt);
    
    if (tool === 'freehand' || tool === 'eraser') {
      const newPreview = new Map();
      newPreview.set(`${pt.x},${pt.y}`, tool === 'eraser' ? ' ' : '█');
      setPreview(newPreview);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isPanning && lastMousePos) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setPan({ x: pan.x + dx, y: pan.y + dy });
      setLastMousePos({ x: e.clientX, y: e.clientY });
      return;
    }

    if (!startPoint) return;

    const pt = getGridPoint(e);

    if (isMovingSelection && selection) {
      setSelectionOffset({
        x: pt.x - startPoint.x,
        y: pt.y - startPoint.y
      });
      return;
    }

    if (!isDrawing) return;

    let newPreview = new Map<string, string>();

    if (tool === 'select') {
      const minX = Math.min(startPoint.x, pt.x);
      const maxX = Math.max(startPoint.x, pt.x);
      const minY = Math.min(startPoint.y, pt.y);
      const maxY = Math.max(startPoint.y, pt.y);
      
      setSelection({
        x: minX,
        y: minY,
        w: maxX - minX + 1,
        h: maxY - minY + 1
      });
      return;
    }

    if (tool === 'rect') {
      newPreview = drawRect(startPoint, pt, borderStyle);
    } else if (tool === 'line') {
      newPreview = drawSmartLine(startPoint, pt);
    } else if (tool === 'arrow') {
      newPreview = drawArrow(startPoint, pt);
    } else if (tool === 'diamond') {
      newPreview = drawDiamond(startPoint, pt, borderStyle);
    } else if (tool === 'freehand' || tool === 'eraser') {
      newPreview = new Map(preview);
      newPreview.set(`${pt.x},${pt.y}`, tool === 'eraser' ? ' ' : '█');
    }

    setPreview(newPreview);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isPanning) {
      setIsPanning(false);
      setLastMousePos(null);
      return;
    }

    if (isMovingSelection) {
      setIsMovingSelection(false);
      if (selection) {
        setSelection({
          ...selection,
          x: selection.x + selectionOffset.x,
          y: selection.y + selectionOffset.y
        });
      }
      setStartPoint(null);
      return;
    }

    if (!isDrawing) return;

    setIsDrawing(false);
    
    if (tool === 'select' && selection) {
      // Extract selected content
      const content = new Map<string, string>();
      grid.forEach((char, key) => {
        const [x, y] = key.split(',').map(Number);
        if (x >= selection.x && x < selection.x + selection.w &&
            y >= selection.y && y < selection.y + selection.h) {
          content.set(key, char);
        }
      });
      setSelectedContent(content);
      setStartPoint(null);
      return;
    }

    commitDrawing(preview);
    setPreview(new Map());
    setStartPoint(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(Math.max(0.1, Math.min(5, zoom * zoomDelta)));
    } else {
      setPan({ x: pan.x - e.deltaX, y: pan.y - e.deltaY });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (textInput) {
        if (e.key === 'Enter' || e.key === 'Escape') {
          const newDrawing = new Map();
          for (let i = 0; i < textInput.text.length; i++) {
            newDrawing.set(`${textInput.x + i},${textInput.y}`, textInput.text[i]);
          }
          commitDrawing(newDrawing);
          setTextInput(null);
        } else if (e.key === 'Backspace') {
          setTextInput(prev => prev ? { ...prev, text: prev.text.slice(0, -1) } : null);
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          setTextInput(prev => prev ? { ...prev, text: prev.text + e.key } : null);
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          useStore.getState().redo();
        } else {
          useStore.getState().undo();
        }
        return;
      }
      
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'v': useStore.getState().setTool('select'); break;
          case 'r': useStore.getState().setTool('rect'); break;
          case 'd': useStore.getState().setTool('diamond'); break;
          case 'l': useStore.getState().setTool('line'); break;
          case 'a': useStore.getState().setTool('arrow'); break;
          case 't': useStore.getState().setTool('text'); break;
          case 'p': useStore.getState().setTool('freehand'); break;
          case 'e': useStore.getState().setTool('eraser'); break;
          case 'escape':
            useStore.getState().setSelection(null);
            useStore.getState().setSelectedContent(null);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [textInput, commitDrawing]);

  return (
    <div className="w-full h-full overflow-hidden bg-[#0f172a] relative cursor-crosshair"
         onWheel={handleWheel}>
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full outline-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        tabIndex={0}
      />
    </div>
  );
}
