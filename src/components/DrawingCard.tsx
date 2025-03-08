import React from 'react';
import { useDrag } from 'react-dnd';
import { Trash2 } from 'lucide-react';
import { CardType } from '../types';
import { useWorkspaceStore } from '../store';

interface DrawingCardProps {
  card: CardType;
}

export const DrawingCard: React.FC<DrawingCardProps> = ({ card }) => {
  const { deleteCard } = useWorkspaceStore();
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'card',
    item: { id: card.id, currentPosition: card.position },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [card.id, card.position]);

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
      <div className="minimal-border rounded-lg p-4 bg-black/80 backdrop-blur-sm">
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
          width={card.width}
          height={card.height}
          viewBox={`0 0 ${card.width} ${card.height}`}
          className="min-w-[100px] min-h-[100px]"
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
      </div>
    </div>
  );
}; 