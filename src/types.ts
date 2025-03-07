export type NoteType = 'normal' | 'todo' | 'comment';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  text: string;
  timestamp?: Date;
}

export interface CardType {
  id: string;
  type: 'note' | 'image';
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
}

export interface Connection {
  start: string;
  end: string;
}