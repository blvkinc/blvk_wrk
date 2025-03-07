import { create } from 'zustand';
import { CardType, TodoItem, Comment } from './types';

interface WorkspaceState {
  cards: CardType[];
  selectedCardId: string | null;
  addCard: (card: CardType) => void;
  updateCardPosition: (id: string, x: number, y: number) => void;
  updateCardContent: (id: string, content: string) => void;
  updateCardTitle: (id: string, title: string) => void;
  updateTodoItems: (id: string, todoItems: TodoItem[]) => void;
  addComment: (id: string, comments: Comment[]) => void;
  deleteCard: (id: string) => void;
  setSelectedCard: (id: string | null) => void;
}

// Load initial cards from localStorage
const loadCards = (): CardType[] => {
  if (typeof window === 'undefined') return [];
  const savedCards = localStorage.getItem('workspace-cards');
  return savedCards ? JSON.parse(savedCards) : [];
};

// Save cards to localStorage
const saveCards = (cards: CardType[]) => {
  localStorage.setItem('workspace-cards', JSON.stringify(cards));
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  cards: loadCards(),
  selectedCardId: null,
  addCard: (card) => 
    set((state) => {
      const newCards = [...state.cards, card];
      saveCards(newCards);
      return { cards: newCards };
    }),
  updateCardPosition: (id, x, y) =>
    set((state) => {
      const newCards = state.cards.map((card) =>
        card.id === id ? { ...card, position: { x, y } } : card
      );
      saveCards(newCards);
      return { cards: newCards };
    }),
  updateCardContent: (id, content) =>
    set((state) => {
      const newCards = state.cards.map((card) =>
        card.id === id ? { ...card, content } : card
      );
      saveCards(newCards);
      return { cards: newCards };
    }),
  updateCardTitle: (id, title) =>
    set((state) => {
      const newCards = state.cards.map((card) =>
        card.id === id ? { ...card, title } : card
      );
      saveCards(newCards);
      return { cards: newCards };
    }),
  updateTodoItems: (id, todoItems) =>
    set((state) => {
      const newCards = state.cards.map((card) =>
        card.id === id ? { ...card, todoItems } : card
      );
      saveCards(newCards);
      return { cards: newCards };
    }),
  addComment: (id, comments) =>
    set((state) => {
      const newCards = state.cards.map((card) =>
        card.id === id ? { ...card, comments } : card
      );
      saveCards(newCards);
      return { cards: newCards };
    }),
  deleteCard: (id) =>
    set((state) => {
      const newCards = state.cards.filter((card) => card.id !== id);
      saveCards(newCards);
      return { cards: newCards };
    }),
  setSelectedCard: (id) => set({ selectedCardId: id }),
}));