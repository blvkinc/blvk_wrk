import React, { useRef, useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { Image, FileText, Edit2, Check, Trash2, ListTodo, MessageSquare, Plus, Minus, X } from 'lucide-react';
import { CardType, TodoItem, Comment } from '../types';
import { useWorkspaceStore } from '../store';

interface CardProps {
  card: CardType;
}

export const Card: React.FC<CardProps> = ({ card }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(card.content);
  const [editedTitle, setEditedTitle] = useState(card.title);
  const [newTodo, setNewTodo] = useState('');
  const [newComment, setNewComment] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updateCardPosition, updateCardContent, updateCardTitle, updateTodoItems, addComment, deleteCard, setSelectedCard } = useWorkspaceStore();

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'card',
    item: { id: card.id, currentPosition: card.position },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [card.id, card.position]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    updateCardContent(card.id, editedContent);
    updateCardTitle(card.id, editedTitle);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(card.content);
    setEditedTitle(card.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isEditing && !(e.target as Element)?.closest('.card-container')) {
        handleSave();
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing]);

  const handleAddTodo = () => {
    if (newTodo.trim() && card.todoItems) {
      const newTodoItem = { id: Math.random().toString(36).substr(2, 9), text: newTodo, completed: false };
      updateTodoItems(card.id, [...card.todoItems, newTodoItem]);
      setNewTodo('');
    }
  };

  const handleToggleTodo = (todoId: string) => {
    if (card.todoItems) {
      const updatedTodos = card.todoItems.map(todo =>
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
      );
      updateTodoItems(card.id, updatedTodos);
    }
  };

  const handleDeleteTodo = (todoId: string) => {
    const updatedTodos = card.todoItems?.filter(todo => todo.id !== todoId);
    updateTodoItems(card.id, updatedTodos || []);
  };

  const handleAddComment = () => {
    if (newComment.trim() && card.comments) {
      const newCommentItem = { id: Math.random().toString(36).substr(2, 9), text: newComment };
      addComment(card.id, [...card.comments, newCommentItem]);
      setNewComment('');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          updateCardContent(card.id, event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const renderNoteContent = () => {
    if (card.type === 'image') {
      return (
        <>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <img
            src={card.content}
            alt={card.title}
            className="w-full h-32 object-cover rounded cursor-pointer"
            onClick={handleImageClick}
          />
        </>
      );
    }

    switch (card.noteType) {
      case 'todo':
        return isEditing ? (
          <div className="space-y-2">
            <div className="flex gap-1">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                placeholder="Add new todo..."
                className="minimal-input flex-1 text-white"
              />
              <button
                onClick={handleAddTodo}
                className="p-1 minimal-button rounded"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="space-y-1">
              {card.todoItems?.map((todo) => (
                <div key={todo.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggleTodo(todo.id)}
                    className="minimal-input"
                  />
                  <span className={`text-white ${todo.completed ? 'line-through' : ''}`}>
                    {todo.text}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTodo(todo.id);
                    }}
                    className="p-1 hover:bg-gray-700 rounded"
                  >
                    <Minus className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-1">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                placeholder="Add new todo..."
                className="minimal-input flex-1 text-white"
              />
              <button
                onClick={handleAddTodo}
                className="p-1 minimal-button rounded"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="space-y-1">
              {card.todoItems?.map((todo) => (
                <div key={todo.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggleTodo(todo.id)}
                    className="minimal-input"
                  />
                  <span className={`text-white ${todo.completed ? 'line-through' : ''}`}>
                    {todo.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'comment':
        return isEditing ? (
          <div className="space-y-2">
            <div className="flex gap-1">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                placeholder="Add new comment..."
                className="minimal-input flex-1 text-white"
              />
              <button
                onClick={handleAddComment}
                className="p-1 minimal-button rounded"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="space-y-2">
              {card.comments?.map((comment) => (
                <div key={comment.id} className="flex items-center gap-2 text-white">
                  <MessageSquare className="w-4 h-4" />
                  <span>{comment.text}</span>
                  {comment.timestamp && (
                    <span className="text-xs text-gray-400">
                      {new Date(comment.timestamp).toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-1">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                placeholder="Add new comment..."
                className="minimal-input flex-1 text-white"
              />
              <button
                onClick={handleAddComment}
                className="p-1 minimal-button rounded"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="space-y-2">
              {card.comments?.map((comment) => (
                <div key={comment.id} className="flex items-center gap-2 text-white">
                  <MessageSquare className="w-4 h-4" />
                  <span>{comment.text}</span>
                  {comment.timestamp && (
                    <span className="text-xs text-gray-400">
                      {new Date(comment.timestamp).toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return isEditing ? (
          <div className="card-content">
            <textarea
              ref={textareaRef}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="minimal-input w-full h-32 text-white"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ) : (
          <div onDoubleClick={handleDoubleClick} className="text-white whitespace-pre-wrap">
            {card.content}
          </div>
        );
    }
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
      <div className="minimal-border rounded-lg p-4 w-64 bg-black/80 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-2">
          {isEditing ? (
            <input
              ref={titleRef}
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="minimal-input w-full mr-2 text-white"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3 
              className="text-white font-medium cursor-text"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
            >
              {card.title}
            </h3>
          )}
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
        {isEditing ? (
          <div className="space-y-2">
            {renderNoteContent()}
            <div className="flex justify-end gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel();
                }}
                className="p-1 minimal-button rounded"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                className="p-1 minimal-button rounded"
              >
                <Check className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        ) : (
          renderNoteContent()
        )}
      </div>
    </div>
  );
};