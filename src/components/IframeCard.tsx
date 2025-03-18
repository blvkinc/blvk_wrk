import React, { useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { Trash2, Maximize2, Minimize2, RefreshCw, Link, AlertTriangle, ExternalLink, ArrowDownRight } from 'lucide-react';
import { CardType } from '../types';
import { useWorkspaceStore } from '../store';

interface IframeCardProps {
  card: CardType;
}

export const IframeCard: React.FC<IframeCardProps> = ({ card }) => {
  const { deleteCard, updateCard } = useWorkspaceStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [urlInput, setUrlInput] = useState(card.url || '');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [cardSize, setCardSize] = useState({
    width: card.width || 400,
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
    canDrag: !isExpanded && !isResizing,
  }), [card.id, card.position, isExpanded, isResizing]);

  // Reset error state when URL changes
  useEffect(() => {
    setLoadError(false);
  }, [card.url]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const deltaX = e.clientX - startResize.x;
      const deltaY = e.clientY - startResize.y;
      
      const newWidth = Math.max(200, startSize.width + deltaX);
      const newHeight = Math.max(150, startSize.height + deltaY);
      
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
    if (isExpanded) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    setIsResizing(true);
    setStartResize({ x: e.clientX, y: e.clientY });
    setStartSize({ 
      width: cardSize.width, 
      height: cardSize.height 
    });
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let url = urlInput.trim();
    if (!url) return;
    
    // Add https:// if not present
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    
    updateCard({
      ...card,
      url: url,
      title: card.title || new URL(url).hostname,
    });
    
    setIsEditing(false);
    setLoadError(false);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setLoadError(false);
    // Force iframe to reload by temporarily setting the URL to empty
    updateCard({
      ...card,
      url: '',
    });
    
    setTimeout(() => {
      updateCard({
        ...card,
        url: card.url,
      });
      setIsLoading(false);
    }, 100);
  };

  const handleIframeError = () => {
    setLoadError(true);
    setIsLoading(false);
  };

  const openInNewTab = () => {
    if (card.url) {
      window.open(card.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      ref={drag}
      className={`absolute card-container ${isDragging ? 'opacity-50' : 'opacity-100'} ${isExpanded ? 'z-[999]' : ''}`}
      style={{
        left: card.position.x,
        top: card.position.y,
        transform: isExpanded ? 'none' : 'translate(-50%, -50%)',
        ...(isExpanded ? {
          top: '50%',
          left: '50%',
          width: '90vw',
          height: '90vh',
          transform: 'translate(-50%, -50%)',
        } : {}),
      }}
    >
      <div 
        className={`minimal-border rounded-lg p-4 bg-black/80 backdrop-blur-sm ${isExpanded ? 'w-full h-full' : ''}`}
        style={{ position: 'relative' }}
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-white font-medium text-sm truncate max-w-[250px]">
            {card.title || 'Web Page'}
            {card.url && (
              <span className="text-white/50 text-xs ml-2">
                {new URL(card.url).hostname}
              </span>
            )}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={handleRefresh}
              className="p-1 minimal-button rounded hover:bg-white/10"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-white ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={openInNewTab}
              className="p-1 minimal-button rounded hover:bg-white/10"
              title="Open in new tab"
              disabled={!card.url}
            >
              <ExternalLink className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 minimal-button rounded hover:bg-white/10"
              title={isExpanded ? 'Minimize' : 'Expand'}
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4 text-white" />
              ) : (
                <Maximize2 className="w-4 h-4 text-white" />
              )}
            </button>
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
        </div>
        
        {isEditing || !card.url ? (
          <form onSubmit={handleUrlSubmit} className="mb-2">
            <div className="flex gap-2">
              <input
                type="text"
                className="minimal-input text-white text-sm w-full"
                placeholder="Enter website URL"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                className="p-1 minimal-button rounded hover:bg-white/10"
              >
                <Link className="w-4 h-4 text-white" />
              </button>
            </div>
          </form>
        ) : (
          <div className="relative">
            {loadError ? (
              <div 
                className="w-full bg-black/50 rounded flex flex-col items-center justify-center p-6 min-h-[300px]"
                style={{ 
                  width: isExpanded ? '100%' : cardSize.width + 'px',
                  height: isExpanded ? 'calc(90vh-90px)' : cardSize.height + 'px' 
                }}
              >
                <AlertTriangle className="w-10 h-10 text-yellow-500 mb-4" />
                <p className="text-white/80 text-sm text-center mb-4">
                  Unable to load this website. It may be due to:
                </p>
                <ul className="text-white/70 text-xs list-disc mb-4 pl-4">
                  <li>Content Security Policy restrictions</li>
                  <li>Website not allowing iframe embedding</li>
                  <li>Cross-origin resource sharing limitations</li>
                </ul>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 minimal-button rounded hover:bg-white/10 text-xs text-white"
                  >
                    Edit URL
                  </button>
                  <button
                    onClick={openInNewTab}
                    className="p-2 minimal-button rounded hover:bg-white/10 text-xs text-white flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" /> Open in new tab
                  </button>
                </div>
              </div>
            ) : (
              <>
                <iframe
                  src={card.url}
                  className="w-full bg-white rounded border-0"
                  style={{ 
                    width: isExpanded ? '100%' : cardSize.width + 'px',
                    height: isExpanded ? 'calc(90vh-90px)' : cardSize.height + 'px' 
                  }}
                  title={card.title || 'Embedded Web Page'}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
                  loading="lazy"
                  onError={handleIframeError}
                  onLoad={() => setIsLoading(false)}
                />
                <div className="absolute bottom-2 right-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 minimal-button rounded bg-black/70 hover:bg-black/90"
                    title="Edit URL"
                  >
                    <Link className="w-3 h-3 text-white" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Resize Handle - only visible when not expanded */}
        {!isExpanded && (
          <div 
            className="absolute bottom-1 right-1 cursor-nwse-resize opacity-30 hover:opacity-100 transition-opacity"
            onMouseDown={handleResizeStart}
            title="Resize"
          >
            <ArrowDownRight className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}; 