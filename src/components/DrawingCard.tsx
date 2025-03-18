import React, { useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { Trash2, ArrowDownRight } from 'lucide-react';
import { CardType } from '../types';
import { useWorkspaceStore } from '../store';

interface DrawingCardProps {
  card: CardType;
}

export const DrawingCard: React.FC<DrawingCardProps> = ({ card }) => {
  const { deleteCard, updateCard } = useWorkspaceStore();
  const [isResizing, setIsResizing] = useState(false);
  const [cardSize, setCardSize] = useState({
    width: card.width || 300,
    height: card.height || 300
  });
  const [startResize, setStartResize] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'card',
    item: { id: card.id, currentPosition: card.position },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !isResizing,
  }), [card.id, card.position, isResizing]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const deltaX = e.clientX - startResize.x;
      const deltaY = e.clientY - startResize.y;
      
      const newWidth = Math.max(100, startSize.width + deltaX);
      const newHeight = Math.max(100, startSize.height + deltaY);
      
      setCardSize({
        width: newWidth,
        height: newHeight
      });
    };
    
    const handleMouseUp = () => {
      if (isResizing) {
        updateCard({
          ...card,
          width: cardSize.width,
          height: cardSize.height
        });
        setIsResizing(false);
      }
    };
    
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, startResize, startSize, cardSize, card, updateCard]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsResizing(true);
    setStartResize({ x: e.clientX, y: e.clientY });
    setStartSize({ 
      width: cardSize.width, 
      height: cardSize.height 
    });
  };

  if (!card.paths || !card.width || !card.height) return null;

  const renderPath = (path: typeof card.paths[0], maskId?: string) => {
    const d = path.points.reduce((acc, point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      return `${acc} L ${point.x} ${point.y}`;
    }, '');

    return (
      <path
        key={d}
        d={d}
        stroke={maskId ? 'black' : 'white'}
        strokeWidth={path.width}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  };

  const penPaths = card.paths.filter(path => path.type === 'pen');
  const eraserPaths = card.paths.filter(path => path.type === 'eraser');
  const maskId = `mask-${card.id}`;

  return (
    <div
      ref={drag}
      className={`absolute card-container ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      style={{
        left: card.position.x,
        top: card.position.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div 
        className="minimal-border rounded-lg p-4 bg-black/80 backdrop-blur-sm"
        style={{ position: 'relative' }}
      >
        <div className="flex justify-end mb-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteCard(card.id);
            }}
            className="p-1 minimal-button rounded hover:bg-red-500/20"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
        <svg
          width={cardSize.width}
          height={cardSize.height}
          viewBox={`0 0 ${card.width} ${card.height}`}
          className="min-w-[100px] min-h-[100px]"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <mask id={maskId}>
              <rect width="100%" height="100%" fill="white"/>
              {eraserPaths.map(path => renderPath(path, maskId))}
            </mask>
          </defs>
          <g mask={`url(#${maskId})`}>
            {penPaths.map(path => renderPath(path))}
          </g>
        </svg>
        
        {/* Resize Handle */}
        <div 
          className="absolute bottom-1 right-1 cursor-nwse-resize opacity-30 hover:opacity-100 transition-opacity"
          onMouseDown={handleResizeStart}
          title="Resize"
        >
          <ArrowDownRight className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  );
}; 