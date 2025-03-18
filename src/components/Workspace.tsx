import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { Plus, FileText, ListTodo, MessageSquare, Image, Layout, Globe, File, Move, Trash2 } from 'lucide-react';
import { useWorkspaceStore } from '../store';
import { Card } from './Card';
import { CardType, NoteType } from '../types';
import { DrawingLayer } from './DrawingLayer';
import { DrawingCard } from './DrawingCard';
import { KanbanCard } from './KanbanCard';
import { IframeCard } from './IframeCard';
import { MediaCard } from './MediaCard';
import { nanoid } from 'nanoid';

export const Workspace: React.FC = () => {
  const { cards, updateCardPosition, addCard, setSelectedCard, clearWorkspace } = useWorkspaceStore();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showNoteTypes, setShowNoteTypes] = useState(false);
  const [noteTypePosition, setNoteTypePosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [currentTool, setCurrentTool] = useState<'pen' | 'eraser' | null>(null);
  const [showHelp, setShowHelp] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHelp(false);
    }, 10000);
    return () => clearTimeout(timer);
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

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only use middle mouse button (button 1) for dragging the workspace
    if (currentTool || e.button !== 1) return;
    
    // Prevent default behavior like autoscroll with middle mouse
    e.preventDefault();
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  }, [currentTool, position.x, position.y]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setPosition({ x: newX, y: newY });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (currentTool) return;
    
    // Use two-finger gesture for workspace panning
    if (e.touches.length === 2) {
      e.preventDefault();
      
      // Calculate the midpoint of the two touches
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const midX = (touch1.clientX + touch2.clientX) / 2;
      const midY = (touch1.clientY + touch2.clientY) / 2;
      
      setIsDragging(true);
      setDragStart({
        x: midX - position.x,
        y: midY - position.y
      });
    }
  }, [currentTool, position.x, position.y]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || e.touches.length !== 2) return;
    
    // Calculate the midpoint of the two touches
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const midX = (touch1.clientX + touch2.clientX) / 2;
    const midY = (touch1.clientY + touch2.clientY) / 2;
    
    const newX = midX - dragStart.x;
    const newY = midY - dragStart.y;
    setPosition({ x: newX, y: newY });
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    } else {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    }
    
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleTouchMove, handleTouchEnd]);

  const handleNoteButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setNoteTypePosition({
      x: rect.left,
      y: rect.bottom
    });
    setShowNoteTypes(!showNoteTypes);
  };

  const handleAddNote = (type: NoteType) => {
    const centerX = window.innerWidth / 2 - position.x;
    const centerY = window.innerHeight / 2 - position.y;
    
    const newNote: CardType = {
      id: nanoid(),
      type,
      title: getDefaultTitle(type),
      content: '',
      position: { x: centerX, y: centerY },
      connections: []
    };
    
    addCard(newNote);
    setShowNoteTypes(false);
  };

  const getDefaultTitle = (type: NoteType): string => {
    switch (type) {
      case 'text': return 'Text Note';
      case 'todo': return 'Todo List';
      case 'chat': return 'Chat';
      case 'kanban': return 'Kanban Board';
      case 'iframe': return 'Web Page';
      case 'image': return 'Image';
      default: return 'Note';
    }
  };

  const handleAddImage = () => {
    // Create a file input to select an image
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (!target.files || target.files.length === 0) return;
      
      const file = target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (!event.target?.result) return;
        
        const centerX = window.innerWidth / 2 - position.x;
        const centerY = window.innerHeight / 2 - position.y;
        
        const newImageCard: CardType = {
          id: nanoid(),
          type: 'image',
          title: file.name,
          content: event.target.result as string,
          position: { x: centerX, y: centerY },
          connections: []
        };
        
        addCard(newImageCard);
      };
      
      reader.readAsDataURL(file);
    };
    
    input.click();
  };

  const handleAddMedia = () => {
    const centerX = window.innerWidth / 2 - position.x;
    const centerY = window.innerHeight / 2 - position.y;
    
    const newMediaCard: CardType = {
      id: nanoid(),
      type: 'media',
      title: 'Media Files',
      content: '',
      position: { x: centerX, y: centerY },
      connections: [],
      files: []
    };
    
    addCard(newMediaCard);
  };

  const handleAddWebPage = () => {
    const centerX = window.innerWidth / 2 - position.x;
    const centerY = window.innerHeight / 2 - position.y;
    
    const newIframeCard: CardType = {
      id: nanoid(),
      type: 'iframe',
      title: 'Web Page',
      content: '',
      position: { x: centerX, y: centerY },
      connections: [],
      url: ''
    };
    
    addCard(newIframeCard);
  };

  const handleClearWorkspace = () => {
    setShowClearModal(true);
  };

  const confirmClearWorkspace = () => {
    clearWorkspace();
    setShowClearModal(false);
  };

  const cancelClearWorkspace = () => {
    setShowClearModal(false);
  };

  const renderCard = (card: CardType) => {
    switch (card.type) {
      case 'drawing':
        return <DrawingCard key={card.id} card={card} />;
      case 'kanban':
        return <KanbanCard key={card.id} card={card} />;
      case 'iframe':
        return <IframeCard key={card.id} card={card} />;
      case 'media':
        return <MediaCard key={card.id} card={card} />;
      default:
        return <Card key={card.id} card={card} />;
    }
  };

  return (
    <div 
      ref={drop}
      onClick={handleWorkspaceClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={`relative w-full h-screen overflow-hidden ${isDragging ? 'cursor-move' : 'cursor-default'}`}
      title="Use middle mouse button to pan the workspace"
    >
      <DrawingLayer onToolChange={setCurrentTool} />
      <div 
        ref={containerRef}
        className="absolute inset-0"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          willChange: 'transform'
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
          {cards.map(renderCard)}
        </div>
      </div>
      
      {showHelp && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg minimal-border z-50 flex items-center gap-2 max-w-[300px]">
          <Move className="w-5 h-5 text-white" />
          <p className="text-xs text-white">
            {isMobile 
              ? "Use two fingers to pan the workspace" 
              : "Use middle mouse button to pan the workspace"}
          </p>
          <button 
            className="text-white/70 text-xs hover:text-white"
            onClick={() => setShowHelp(false)}
          >
            ✕
          </button>
        </div>
      )}
      
      <div className={`fixed ${isMobile ? 'bottom-4 left-4 right-4' : 'left-4 top-4'} flex ${isMobile ? 'flex-row justify-center' : 'flex-col'} gap-2 z-50`}>
        <button
          onClick={handleNoteButtonClick}
          className={`p-2.5 minimal-button rounded-lg transition-colors ${
            currentTool ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
          }`}
          title="Add Note (Click for options)"
          disabled={currentTool !== null}
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={handleAddImage}
          className={`p-2.5 minimal-button rounded-lg transition-colors ${
            currentTool ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
          }`}
          title="Add Image"
          disabled={currentTool !== null}
        >
          <Image className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={handleAddMedia}
          className={`p-2.5 minimal-button rounded-lg transition-colors ${
            currentTool ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
          }`}
          title="Add Media Files"
          disabled={currentTool !== null}
        >
          <File className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={handleAddWebPage}
          className={`p-2.5 minimal-button rounded-lg transition-colors ${
            currentTool ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
          }`}
          title="Add Web Page"
          disabled={currentTool !== null}
        >
          <Globe className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={handleClearWorkspace}
          className={`p-2.5 minimal-button rounded-lg transition-colors ${
            currentTool ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-500/20'
          }`}
          title="Clear Workspace"
          disabled={currentTool !== null}
        >
          <Trash2 className="w-5 h-5 text-red-400" />
        </button>
      </div>
      {showNoteTypes && !currentTool && (
        <div 
          ref={menuRef}
          className={`fixed minimal-menu rounded-lg p-1.5 z-[60] flex flex-col gap-1.5 minimal-border ${
            isMobile ? 'w-[200px] bottom-[1rem] left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-sm' : 'w-36'
          }`}
          style={!isMobile ? {
            left: `${noteTypePosition.x + 50}px`,
            top: `${noteTypePosition.y - 12}px`,
            transform: 'none',
          } : undefined}
        >
          <button
            onClick={() => handleAddNote('text')}
            className="minimal-button p-2 rounded flex items-center gap-2 hover:bg-white/5"
          >
            <FileText className="w-4 h-4 text-white" />
            <span className="text-white text-sm">Text Note</span>
          </button>
          <button
            onClick={() => handleAddNote('todo')}
            className="minimal-button p-2 rounded flex items-center gap-2 hover:bg-white/5"
          >
            <ListTodo className="w-4 h-4 text-white" />
            <span className="text-white text-sm">Todo List</span>
          </button>
          <button
            onClick={() => handleAddNote('chat')}
            className="minimal-button p-2 rounded flex items-center gap-2 hover:bg-white/5"
          >
            <MessageSquare className="w-4 h-4 text-white" />
            <span className="text-white text-sm">Chat</span>
          </button>
          <button
            onClick={() => handleAddNote('kanban')}
            className="minimal-button p-2 rounded flex items-center gap-2 hover:bg-white/5"
          >
            <Layout className="w-4 h-4 text-white" />
            <span className="text-white text-sm">Kanban Board</span>
          </button>
        </div>
      )}
      
      {/* Clear Workspace Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999]">
          <div className="minimal-border rounded-lg p-6 bg-black/90 max-w-sm">
            <h3 className="text-white text-lg font-medium mb-4">Clear Workspace</h3>
            <p className="text-white/80 mb-6">
              Are you sure you want to clear the workspace? This will delete all cards and cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={cancelClearWorkspace}
                className="minimal-button p-2 px-4 rounded-lg hover:bg-white/10 text-white"
              >
                Cancel
              </button>
              <button 
                onClick={confirmClearWorkspace}
                className="minimal-button p-2 px-4 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};