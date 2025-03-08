import React, { useEffect, useRef, useState } from 'react';
import { Pencil, Eraser } from 'lucide-react';
import { useWorkspaceStore } from '../store';
import { Point, DrawingPath } from '../types';

type Tool = 'pen' | 'eraser' | null;

interface DrawingLayerProps {
  onToolChange?: (tool: Tool) => void;
}

export const DrawingLayer: React.FC<DrawingLayerProps> = ({ onToolChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<Tool>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const { addCard } = useWorkspaceStore();

  // Notify parent of tool changes
  useEffect(() => {
    onToolChange?.(currentTool);
  }, [currentTool, onToolChange]);

  // Redraw all paths on canvas
  const redrawCanvas = () => {
    if (!context || !canvasRef.current) return;
    
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    paths.forEach(path => {
      context.beginPath();
      context.strokeStyle = 'white';
      context.lineWidth = path.width;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      
      path.points.forEach((point, index) => {
        if (index === 0) {
          context.moveTo(point.x, point.y);
        } else {
          context.lineTo(point.x, point.y);
        }
      });
      
      if (path.type === 'pen') {
        context.globalCompositeOperation = 'source-over';
        context.stroke();
      } else {
        context.globalCompositeOperation = 'destination-out';
        context.stroke();
      }
    });
    
    // Reset composite operation
    context.globalCompositeOperation = 'source-over';
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      redrawCanvas();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Get context
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = 'white';
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 2;
      setContext(ctx);
    }

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Convert current drawing to a card when tool is deselected
  useEffect(() => {
    if (!currentTool && paths.length > 0 && context) {
      // Calculate bounding box using all paths to maintain eraser effects
      const allPoints = paths.flatMap(path => path.points);
      const xs = allPoints.map(p => p.x);
      const ys = allPoints.map(p => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const width = maxX - minX;
      const height = maxY - minY;

      // Adjust all paths relative to bounding box
      const adjustedPaths = paths.map(path => ({
        ...path,
        points: path.points.map(p => ({
          x: p.x - minX,
          y: p.y - minY
        }))
      }));

      // Only create card if there are actual drawing paths
      if (adjustedPaths.some(path => path.type === 'pen' as Tool)) {
        // Create new drawing card
        addCard({
          id: Math.random().toString(36).substr(2, 9),
          type: 'drawing',
          title: 'Drawing',
          content: '',
          position: { x: minX, y: minY },
          connections: [],
          paths: adjustedPaths,
          width,
          height
        });
      }

      // Clear canvas and paths
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      setPaths([]);
    }
  }, [currentTool, paths, context, addCard]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!currentTool || !context) return;
    
    setIsDrawing(true);
    const position = getEventPosition(e);
    setCurrentPath([position]);

    context.beginPath();
    context.moveTo(position.x, position.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentTool || !context) return;

    const position = getEventPosition(e);
    setCurrentPath(prev => [...prev, position]);
    
    if (currentTool === 'eraser') {
      context.globalCompositeOperation = 'destination-out';
      context.lineWidth = 20;
    } else {
      context.globalCompositeOperation = 'source-over';
      context.lineWidth = 2;
    }

    context.lineTo(position.x, position.y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing || !currentTool || currentPath.length === 0) return;

    // Add current path to paths array
    setPaths(prev => [...prev, {
      points: currentPath,
      type: currentTool,
      width: currentTool === 'pen' ? 2 : 20
    }]);

    setIsDrawing(false);
    setCurrentPath([]);
  };

  const getEventPosition = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    if ('touches' in e) {
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`fixed inset-0 ${currentTool ? 'z-40' : '-z-10'} touch-none`}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <div className="fixed left-4 top-32 flex flex-col gap-2 z-50">
        <button
          onClick={() => setCurrentTool(currentTool === 'pen' ? null : 'pen')}
          className={`p-2.5 minimal-button rounded-lg transition-colors ${
            currentTool === 'pen' 
              ? 'bg-white/20 ring-2 ring-white ring-offset-1 ring-offset-black' 
              : 'hover:bg-white/10'
          }`}
          title="Pen Tool"
        >
          <Pencil className="w-5 h-5 text-white" />
        </button>
        {currentTool === 'pen' && (
          <button
            onClick={() => setCurrentTool('eraser')}
            className={`p-2.5 minimal-button rounded-lg transition-colors ${
              currentTool === 'eraser' 
                ? 'bg-white/20 ring-2 ring-white ring-offset-1 ring-offset-black' 
                : 'hover:bg-white/10'
            }`}
            title="Eraser Tool"
          >
            <Eraser className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
    </>
  );
}; 