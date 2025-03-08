export type NoteType = 'normal' | 'todo' | 'comment';

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

export interface CardType {
  id: string;
  type: 'note' | 'image' | 'drawing';
  title: string;
  content: string;
  position: {
    x: number;
    y: number;
  };
  connections: string[];
  noteType?: NoteType;
  todoItems?: TodoItem[];
  comments?: Comment[];
  paths?: DrawingPath[];
  width?: number;
  height?: number;
}

export interface Connection {
  start: string;
  end: string;
}