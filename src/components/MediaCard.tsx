import React, { useState, useRef } from 'react';
import { useDrag } from 'react-dnd';
import { Trash2, Upload, File, Music, Video, Image as ImageIcon, X } from 'lucide-react';
import { CardType } from '../types';
import { useWorkspaceStore } from '../store';

interface MediaCardProps {
  card: CardType;
}

export const MediaCard: React.FC<MediaCardProps> = ({ card }) => {
  const { deleteCard, updateCard } = useWorkspaceStore();
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [files, setFiles] = useState<{
    id: string;
    name: string;
    type: string;
    url: string;
    size: number;
  }[]>(card.files || []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'card',
    item: { id: card.id, currentPosition: card.position },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [card.id, card.position]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList: FileList) => {
    const newFiles = Array.from(fileList).map(file => {
      const fileUrl = URL.createObjectURL(file);
      return {
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        type: file.type,
        url: fileUrl,
        size: file.size
      };
    });

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    
    updateCard({
      ...card,
      files: updatedFiles,
      title: card.title || 'Media Files'
    });
  };

  const handleRemoveFile = (id: string) => {
    const updatedFiles = files.filter(file => file.id !== id);
    setFiles(updatedFiles);
    
    updateCard({
      ...card,
      files: updatedFiles
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="w-6 h-6 text-purple-400" />;
    if (fileType.startsWith('video/')) return <Video className="w-6 h-6 text-blue-400" />;
    if (fileType.startsWith('audio/')) return <Music className="w-6 h-6 text-green-400" />;
    return <File className="w-6 h-6 text-white" />;
  };

  const renderFilePreview = (file: typeof files[0]) => {
    if (file.type.startsWith('image/')) {
      return (
        <img 
          src={file.url} 
          alt={file.name} 
          className="w-full h-24 object-cover rounded mb-2"
        />
      );
    }
    
    if (file.type.startsWith('video/')) {
      return (
        <video 
          src={file.url} 
          controls
          className="w-full h-24 object-cover rounded mb-2"
        />
      );
    }
    
    if (file.type.startsWith('audio/')) {
      return (
        <audio 
          src={file.url} 
          controls
          className="w-full rounded mb-2"
        />
      );
    }
    
    return (
      <div className="flex items-center justify-center h-24 bg-white/5 rounded mb-2">
        {getFileIcon(file.type)}
      </div>
    );
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
      <div className="minimal-border rounded-lg p-4 bg-black/80 backdrop-blur-sm w-[350px]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-medium">{card.title || 'Media Files'}</h3>
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
        
        <div 
          className={`border-2 border-dashed rounded-lg p-4 mb-4 transition-colors ${
            isDraggingFile ? 'border-white/50 bg-white/5' : 'border-white/20'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center cursor-pointer">
            <Upload className="w-8 h-8 text-white/70 mb-2" />
            <p className="text-white/70 text-sm text-center">
              Drag & drop files or click to upload
            </p>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileInputChange} 
            multiple 
          />
        </div>
        
        {files.length > 0 && (
          <div className="max-h-[300px] overflow-y-auto">
            {files.map(file => (
              <div key={file.id} className="mb-3 bg-white/5 rounded-lg p-2">
                {renderFilePreview(file)}
                <div className="flex justify-between items-center">
                  <div className="flex items-start gap-2">
                    {getFileIcon(file.type)}
                    <div>
                      <p className="text-white text-sm font-medium truncate max-w-[220px]">
                        {file.name}
                      </p>
                      <p className="text-white/50 text-xs">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(file.id);
                    }}
                    className="p-1 minimal-button rounded hover:bg-red-500/20"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 