import React, { useState, useRef, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { Trash2, ArrowDownRight } from 'lucide-react';
import { CardType, TodoItem, Comment } from '../types';
import { useWorkspaceStore } from '../store';

interface CardProps {
  card: CardType;
}

export const Card: React.FC<CardProps> = ({ card }) => {
  const { deleteCard, updateCard, updateCardContent } = useWorkspaceStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editedTitle, setEditedTitle] = useState(card.title);
  const [editedContent, setEditedContent] = useState(card.content);
  const [isResizing, setIsResizing] = useState(false);
  const [cardSize, setCardSize] = useState({
    width: card.width || 300,
    height: card.height || 'auto'
  });
  const [startResize, setStartResize] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'card',
    item: { id: card.id, currentPosition: card.position },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !isResizing && !isEditingContent,
  }), [card.id, card.position, isResizing, isEditingContent]);

  useEffect(() => {
    if (isEditing && titleRef.current) {
      titleRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    if (isEditingContent && contentRef.current) {
      contentRef.current.focus();
      
      // Put cursor at the end of the text
      const length = contentRef.current.value.length;
      contentRef.current.setSelectionRange(length, length);
    }
  }, [isEditingContent]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const deltaX = e.clientX - startResize.x;
      const deltaY = e.clientY - startResize.y;
      
      const newWidth = Math.max(200, startSize.width + deltaX);
      const newHeight = typeof startSize.height === 'number' 
        ? Math.max(100, startSize.height + deltaY)
        : 100;
      
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
          height: typeof cardSize.height === 'number' ? cardSize.height : 300
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditedTitle(card.title);
    }
  };

  const handleContentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleContentSave();
    }
  };

  const handleTitleSave = () => {
    if (editedTitle.trim() !== '') {
      updateCard({
        ...card,
        title: editedTitle.trim()
      });
    }
    setIsEditing(false);
  };

  const handleContentSave = () => {
    updateCardContent(card.id, editedContent);
    setIsEditingContent(false);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsResizing(true);
    setStartResize({ x: e.clientX, y: e.clientY });
    setStartSize({ 
      width: cardSize.width, 
      height: typeof cardSize.height === 'string' ? 0 : cardSize.height 
    });
  };

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
        className="minimal-border rounded-lg p-4 bg-black/80 backdrop-blur-sm flex flex-col"
        style={{ 
          width: cardSize.width,
          height: cardSize.height !== 'auto' ? cardSize.height : undefined,
          minHeight: '80px',
          maxHeight: typeof cardSize.height === 'number' ? cardSize.height : undefined,
          resize: 'none',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div className="flex justify-between items-center mb-2 flex-shrink-0">
          {isEditing ? (
            <input
              ref={titleRef}
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleTitleSave}
              className="minimal-input w-full mr-2 text-white"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3 
              className="text-white font-medium cursor-text truncate max-w-[calc(100%-30px)]"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              title={card.title}
            >
              {card.title}
            </h3>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteCard(card.id);
            }}
            className="p-1 minimal-button rounded hover:bg-red-500/20 flex-shrink-0"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>

        {isEditingContent ? (
          <textarea
            ref={contentRef}
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            onKeyDown={handleContentKeyDown}
            onBlur={handleContentSave}
            className="minimal-input text-white text-sm w-full h-full resize-none flex-grow"
            style={{
              background: 'transparent', 
              border: 'none',
              outline: 'none',
              color: 'white',
              minHeight: '60px',
              maxHeight: typeof cardSize.height === 'number' ? 
                `${cardSize.height - 70}px` : '400px',
            }}
            onClick={(e) => e.stopPropagation()}
            placeholder="Type your note here..."
          />
        ) : (
          <div 
            className="text-white text-sm whitespace-pre-wrap overflow-y-auto flex-grow cursor-text"
            style={{ 
              maxHeight: typeof cardSize.height === 'number' ? 
                `${cardSize.height - 70}px` : '400px',
              overflowY: 'auto',
              overflowX: 'hidden',
              wordBreak: 'break-word',
              msOverflowStyle: 'none',
              scrollbarWidth: 'thin',
              paddingRight: '3px'
            }}
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingContent(true);
              setEditedContent(card.content);
            }}
          >
            {card.content || <span className="text-white/50">Click to add content</span>}
          </div>
        )}
        
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