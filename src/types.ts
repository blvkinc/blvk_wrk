export type NoteType = 'text' | 'todo' | 'chat' | 'image' | 'drawing' | 'kanban' | 'iframe' | 'media';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  text: string;
  timestamp?: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface DrawingPath {
  points: Point[];
  type: 'pen' | 'eraser';
  width: number;
}

export interface KanbanColumn {
  id: string;
  title: string;
  tasks: KanbanTask[];
}

export interface KanbanTask {
  id: string;
  content: string;
  completed: boolean;
}

export interface CardType {
  id: string;
  type: NoteType;
  title: string;
  content: string;
  position: Point;
  connections: string[];
  
  // For drawings
  paths?: DrawingPath[];
  width?: number;
  height?: number;
  
  // For kanban boards
  columns?: KanbanColumn[];
  
  // For iframe/embedded websites
  url?: string;
  
  // For media files
  files?: {
    id: string;
    name: string;
    type: string;
    url: string;
    size: number;
  }[];
  
  // For todo and comment cards
  todoItems?: TodoItem[];
  comments?: Comment[];
  noteType?: NoteType;
}

export interface Connection {
  start: string;
  end: string;
}