import React, { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Trash2, Plus, CheckSquare, Square, Move } from 'lucide-react';
import { CardType, KanbanColumn, KanbanTask } from '../types';
import { useWorkspaceStore } from '../store';
import { nanoid } from 'nanoid';

interface KanbanCardProps {
  card: CardType;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ card }) => {
  const { updateCard, deleteCard } = useWorkspaceStore();
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [editingTask, setEditingTask] = useState<{columnId: string, taskId: string} | null>(null);
  const [newTaskContent, setNewTaskContent] = useState('');
  const [draggingTask, setDraggingTask] = useState<{columnId: string, taskId: string} | null>(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'card',
    item: { id: card.id, currentPosition: card.position },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [card.id, card.position]);

  // Initialize columns if they don't exist
  if (!card.columns) {
    updateCard({
      ...card,
      columns: [
        { id: nanoid(6), title: 'To Do', tasks: [] },
        { id: nanoid(6), title: 'In Progress', tasks: [] },
        { id: nanoid(6), title: 'Done', tasks: [] }
      ]
    });
    return null;
  }

  const handleAddColumn = () => {
    const newColumn: KanbanColumn = {
      id: nanoid(6),
      title: 'New Column',
      tasks: []
    };
    
    updateCard({
      ...card,
      columns: [...card.columns!, newColumn]
    });
    
    setEditingColumn(newColumn.id);
    setNewColumnTitle('New Column');
  };

  const handleSaveColumnTitle = (columnId: string) => {
    if (!newColumnTitle.trim()) {
      setEditingColumn(null);
      return;
    }
    
    updateCard({
      ...card,
      columns: card.columns!.map(col => 
        col.id === columnId 
          ? { ...col, title: newColumnTitle.trim() }
          : col
      )
    });
    
    setEditingColumn(null);
  };

  const handleAddTask = (columnId: string) => {
    const newTask: KanbanTask = {
      id: nanoid(6),
      content: '',
      completed: false
    };
    
    updateCard({
      ...card,
      columns: card.columns!.map(col => 
        col.id === columnId 
          ? { ...col, tasks: [...col.tasks, newTask] }
          : col
      )
    });
    
    setEditingTask({ columnId, taskId: newTask.id });
    setNewTaskContent('');
  };

  const handleSaveTaskContent = (columnId: string, taskId: string) => {
    if (!newTaskContent.trim()) {
      // If task content is empty, remove the task
      updateCard({
        ...card,
        columns: card.columns!.map(col => 
          col.id === columnId 
            ? { ...col, tasks: col.tasks.filter(task => task.id !== taskId) }
            : col
        )
      });
    } else {
      updateCard({
        ...card,
        columns: card.columns!.map(col => 
          col.id === columnId 
            ? { 
                ...col, 
                tasks: col.tasks.map(task => 
                  task.id === taskId 
                    ? { ...task, content: newTaskContent.trim() }
                    : task
                )
              }
            : col
        )
      });
    }
    
    setEditingTask(null);
  };

  const handleDeleteColumn = (columnId: string) => {
    updateCard({
      ...card,
      columns: card.columns!.filter(col => col.id !== columnId)
    });
  };

  const handleDeleteTask = (columnId: string, taskId: string) => {
    updateCard({
      ...card,
      columns: card.columns!.map(col => 
        col.id === columnId 
          ? { ...col, tasks: col.tasks.filter(task => task.id !== taskId) }
          : col
      )
    });
  };

  const handleToggleTaskComplete = (columnId: string, taskId: string) => {
    updateCard({
      ...card,
      columns: card.columns!.map(col => 
        col.id === columnId 
          ? { 
              ...col, 
              tasks: col.tasks.map(task => 
                task.id === taskId 
                  ? { ...task, completed: !task.completed }
                  : task
              )
            }
          : col
      )
    });
  };

  const handleMoveTask = (sourceColId: string, taskId: string, targetColId: string) => {
    // Find the task to move
    const sourceColumn = card.columns!.find(col => col.id === sourceColId);
    if (!sourceColumn) return;

    const taskToMove = sourceColumn.tasks.find(task => task.id === taskId);
    if (!taskToMove) return;

    // Remove from source column and add to target column
    updateCard({
      ...card,
      columns: card.columns!.map(col => {
        if (col.id === sourceColId) {
          return {
            ...col,
            tasks: col.tasks.filter(task => task.id !== taskId)
          };
        }
        if (col.id === targetColId) {
          return {
            ...col,
            tasks: [...col.tasks, taskToMove]
          };
        }
        return col;
      })
    });
  };

  // Task drop functionality
  const TaskDropTarget = ({ columnId }: { columnId: string }) => {
    const [{ isOver }, drop] = useDrop(() => ({
      accept: 'task',
      drop: (item: { columnId: string, taskId: string }) => {
        if (item.columnId !== columnId) {
          handleMoveTask(item.columnId, item.taskId, columnId);
        }
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }), [columnId]);

    return (
      <div 
        ref={drop} 
        className={`w-full min-h-[20px] rounded transition-colors ${isOver ? 'bg-white/10' : ''}`}
      />
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
      <div className="minimal-border rounded-lg p-4 bg-black/80 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-medium">{card.title || 'Kanban Board'}</h3>
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
        
        <div className="flex gap-4 overflow-x-auto pb-2 max-w-[600px]">
          {card.columns!.map((column) => (
            <div key={column.id} className="min-w-[200px] max-w-[200px] flex flex-col">
              <div className="flex justify-between items-center mb-2">
                {editingColumn === column.id ? (
                  <input
                    type="text"
                    className="minimal-input text-white text-sm w-full"
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    onBlur={() => handleSaveColumnTitle(column.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveColumnTitle(column.id);
                      if (e.key === 'Escape') setEditingColumn(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <h4 
                    className="text-white text-sm font-medium cursor-pointer"
                    onClick={() => {
                      setEditingColumn(column.id);
                      setNewColumnTitle(column.title);
                    }}
                  >
                    {column.title}
                  </h4>
                )}
                <button
                  onClick={() => handleDeleteColumn(column.id)}
                  className="minimal-button p-0.5 rounded hover:bg-red-500/20"
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                </button>
              </div>
              
              <div className="bg-white/5 rounded p-2 flex flex-col gap-2 mb-2 min-h-[100px]">
                <TaskDropTarget columnId={column.id} />
                
                {column.tasks.map((task) => (
                  <div key={task.id} className="relative">
                    {editingTask?.columnId === column.id && editingTask?.taskId === task.id ? (
                      <textarea
                        className="minimal-input text-white text-xs w-full min-h-[60px] resize-none"
                        value={newTaskContent}
                        onChange={(e) => setNewTaskContent(e.target.value)}
                        onBlur={() => handleSaveTaskContent(column.id, task.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSaveTaskContent(column.id, task.id);
                          }
                          if (e.key === 'Escape') setEditingTask(null);
                        }}
                        autoFocus
                      />
                    ) : (
                      <div 
                        className="bg-black/30 p-2 rounded flex gap-2 items-start min-h-[40px] group"
                      >
                        <button
                          onClick={() => handleToggleTaskComplete(column.id, task.id)}
                          className="minimal-button p-0.5 rounded hover:bg-white/10 mt-0.5"
                        >
                          {task.completed ? (
                            <CheckSquare className="w-3 h-3 text-green-400" />
                          ) : (
                            <Square className="w-3 h-3 text-white" />
                          )}
                        </button>
                        
                        <div 
                          className={`flex-1 text-xs ${task.completed ? 'text-white/50 line-through' : 'text-white'} cursor-pointer`}
                          onClick={() => {
                            setEditingTask({ columnId: column.id, taskId: task.id });
                            setNewTaskContent(task.content);
                          }}
                        >
                          {task.content}
                        </div>
                        
                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="minimal-button p-0.5 rounded hover:bg-white/10 cursor-move"
                            onMouseDown={() => setDraggingTask({ columnId: column.id, taskId: task.id })}
                          >
                            <Move className="w-3 h-3 text-white" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(column.id, task.id)}
                            className="minimal-button p-0.5 rounded hover:bg-red-500/20 ml-1"
                          >
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {draggingTask && draggingTask.columnId === column.id && draggingTask.taskId === task.id && (
                      <div 
                        className="absolute inset-0 z-10 cursor-move"
                        {...useDrag(() => ({
                          type: 'task',
                          item: { columnId: column.id, taskId: task.id },
                          end: () => setDraggingTask(null),
                          collect: (monitor) => ({
                            isDragging: monitor.isDragging(),
                          }),
                        }))[1]}
                      />
                    )}
                  </div>
                ))}
                
                <TaskDropTarget columnId={column.id} />
                
                <button
                  onClick={() => handleAddTask(column.id)}
                  className="minimal-button p-1 rounded hover:bg-white/10 text-xs text-white flex items-center gap-1 self-start mt-1"
                >
                  <Plus className="w-3 h-3" />
                  Add task
                </button>
              </div>
            </div>
          ))}
          
          <div className="min-w-[100px]">
            <button
              onClick={handleAddColumn}
              className="minimal-button p-1 rounded hover:bg-white/10 text-xs text-white flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add column
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 