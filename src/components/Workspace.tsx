import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { Plus, FileText, ListTodo, MessageSquare, Image } from 'lucide-react';
import { useWorkspaceStore } from '../store';
import { Card } from './Card';
import { CardType, NoteType } from '../types';

export const Workspace: React.FC = () => {
  const { cards, updateCardPosition, addCard, setSelectedCard } = useWorkspaceStore();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showNoteTypes, setShowNoteTypes] = useState(false);
  const [noteTypePosition, setNoteTypePosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [, drop] = useDrop(() => ({
    accept: 'card',
    drop: (item: { id: string; currentPosition: { x: number; y: number } }, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      
      if (delta) {
        const newX = Math.round(item.currentPosition.x + delta.x);
        const newY = Math.round(item.currentPosition.y + delta.y);
        updateCardPosition(item.id, newX, newY);
      }
    }
  }), [updateCardPosition]);

  const handleWorkspaceClick = useCallback((e: React.MouseEvent) => {
    if (menuRef.current?.contains(e.target as Node)) {
      return;
    }
    setSelectedCard(null);
    setShowNoteTypes(false);
  }, [setSelectedCard]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || isMobile) { // Middle mouse button or touch
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging) {
      const touch = e.touches[0];
      const newX = touch.clientX - dragStart.x;
      const newY = touch.clientY - dragStart.y;
      
      const maxOffset = window.innerWidth * 1.5;
      const minOffset = -maxOffset;
      
      const constrainedX = Math.max(minOffset, Math.min(maxOffset, newX));
      const constrainedY = Math.max(minOffset, Math.min(maxOffset, newY));
      
      setPosition({ x: constrainedX, y: constrainedY });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      const maxOffset = window.innerWidth * 1.5;
      const minOffset = -maxOffset;
      
      const constrainedX = Math.max(minOffset, Math.min(maxOffset, newX));
      const constrainedY = Math.max(minOffset, Math.min(maxOffset, newY));
      
      setPosition({ x: constrainedX, y: constrainedY });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleAddNote = useCallback((noteType: NoteType) => {
    const newCard: CardType = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'note',
      title: 'New Note',
      content: noteType === 'todo' ? '' : 'New note...',
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      connections: [],
      noteType,
      todoItems: noteType === 'todo' ? [] : undefined,
      comments: noteType === 'comment' ? [] : undefined,
    };
    addCard(newCard);
    setShowNoteTypes(false);
  }, [addCard]);

  const handleAddImage = useCallback(() => {
    const newCard: CardType = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'image',
      title: 'Image',
      content: 'https://source.unsplash.com/random/800x600',
      position: { x: Math.random() * 200 + 400, y: Math.random() * 200 + 100 },
      connections: [],
    };
    addCard(newCard);
  }, [addCard]);

  const handleNoteButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setNoteTypePosition({ x: e.clientX, y: e.clientY });
    setShowNoteTypes(!showNoteTypes);
  };

  return (
    <div 
      ref={drop}
      onClick={handleWorkspaceClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className="relative w-full h-screen overflow-hidden touch-none"
    >
      <div 
        ref={containerRef}
        className="absolute inset-0"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          willChange: 'transform',
          touchAction: 'none'
        }}
      >
        <div 
          className="absolute inset-0 dotted-grid"
          style={{
            animation: isDragging ? 'none' : 'gridMove 20s linear infinite',
            willChange: 'transform'
          }}
        />
        <div className="absolute inset-0">
          {cards.map((card) => (
            <Card key={card.id} card={card} />
          ))}
        </div>
      </div>
      <div className={`fixed ${isMobile ? 'bottom-4 left-4 right-4' : 'left-4 top-4'} flex ${isMobile ? 'flex-row justify-center' : 'flex-col'} gap-2 z-50`}>
        <button
          onClick={handleNoteButtonClick}
          className="p-2.5 minimal-button rounded-lg transition-colors hover:bg-white/10"
          title="Add Note (Click for options)"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={handleAddImage}
          className="p-2.5 minimal-button rounded-lg transition-colors hover:bg-white/10"
          title="Add Image"
        >
          <Image className="w-5 h-5 text-white" />
        </button>
      </div>
      {showNoteTypes && (
        <div 
          ref={menuRef}
          className={`fixed minimal-menu rounded-lg p-1.5 z-50 flex flex-col gap-1.5 minimal-border w-36 ${
            isMobile ? 'bottom-24 left-1/2 -translate-x-1/2' : ''
          }`}
          style={!isMobile ? {
            left: `${noteTypePosition.x + 50}px`,
            top: `${noteTypePosition.y - 12}px`,
            transform: 'none',
          } : undefined}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddNote('normal');
            }}
            className="p-2 minimal-button rounded flex items-center gap-2 w-full hover:bg-white/10 transition-colors"
          >
            <FileText className="w-4 h-4 text-white" />
            <span className="text-white text-sm">Normal Note</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddNote('todo');
            }}
            className="p-2 minimal-button rounded flex items-center gap-2 w-full hover:bg-white/10 transition-colors"
          >
            <ListTodo className="w-4 h-4 text-white" />
            <span className="text-white text-sm">Todo List</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddNote('comment');
            }}
            className="p-2 minimal-button rounded flex items-center gap-2 w-full hover:bg-white/10 transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-white" />
            <span className="text-white text-sm">Comment Note</span>
          </button>
        </div>
      )}
    </div>
  );
};