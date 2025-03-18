import { create } from 'zustand';
import { CardType, TodoItem, Comment } from './types';
import { nanoid } from 'nanoid';
import { supabase } from './lib/supabase';

export interface WorkspaceState {
  cards: CardType[];
  selectedCard: string | null;
  isSyncing: boolean;
  isCloudSaved: boolean;
  lastSyncedAt: Date | null;
  addCard: (card: CardType) => void;
  updateCardPosition: (id: string, x: number, y: number) => void;
  updateCard: (card: CardType) => void;
  updateCardContent: (id: string, content: string) => void;
  updateCardTitle: (id: string, title: string) => void;
  updateTodoItems: (id: string, todoItems: TodoItem[]) => void;
  addComment: (id: string, comments: Comment[]) => void;
  deleteCard: (id: string) => void;
  setSelectedCard: (id: string | null) => void;
  clearWorkspace: () => void;
  saveWorkspaceToCloud: (userId: string) => Promise<void>;
  loadWorkspaceFromCloud: (userId: string) => Promise<void>;
  syncWorkspace: (userId: string) => Promise<void>;
  mergeWorkspaces: (cloudCards: CardType[], preferCloudData?: boolean) => void;
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

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  cards: loadCards(),
  selectedCard: null,
  isSyncing: false,
  isCloudSaved: false,
  lastSyncedAt: null,

  addCard: (card) => set((state) => {
    const newCards = [...state.cards, card];
    saveCards(newCards);
    return { 
      cards: newCards,
      isCloudSaved: false
    };
  }),

  updateCardPosition: (id, x, y) => set((state) => {
    const newCards = state.cards.map((card) =>
      card.id === id ? { ...card, position: { x, y } } : card
    );
    saveCards(newCards);
    return { 
      cards: newCards,
      isCloudSaved: false
    };
  }),

  updateCard: (updatedCard) => set((state) => {
    const newCards = state.cards.map((card) =>
      card.id === updatedCard.id ? updatedCard : card
    );
    saveCards(newCards);
    return { 
      cards: newCards,
      isCloudSaved: false
    };
  }),

  updateCardContent: (id, content) => set((state) => {
    const newCards = state.cards.map((card) =>
      card.id === id ? { ...card, content } : card
    );
    saveCards(newCards);
    return { 
      cards: newCards,
      isCloudSaved: false
    };
  }),

  updateCardTitle: (id, title) => set((state) => {
    const newCards = state.cards.map((card) =>
      card.id === id ? { ...card, title } : card
    );
    saveCards(newCards);
    return { 
      cards: newCards,
      isCloudSaved: false
    };
  }),

  updateTodoItems: (id, todoItems) => set((state) => {
    const newCards = state.cards.map((card) =>
      card.id === id ? { ...card, todoItems } : card
    );
    saveCards(newCards);
    return { 
      cards: newCards,
      isCloudSaved: false
    };
  }),

  addComment: (id, comments) => set((state) => {
    const newCards = state.cards.map((card) =>
      card.id === id ? { ...card, comments } : card
    );
    saveCards(newCards);
    return { 
      cards: newCards,
      isCloudSaved: false
    };
  }),

  deleteCard: (id) => set((state) => {
    const newCards = state.cards.filter((card) => card.id !== id);
    saveCards(newCards);
    return {
      cards: newCards,
      selectedCard: state.selectedCard === id ? null : state.selectedCard,
      isCloudSaved: false
    };
  }),

  setSelectedCard: (id) => set({ selectedCard: id }),

  clearWorkspace: () => set(() => {
    saveCards([]);
    return { 
      cards: [], 
      selectedCard: null,
      isCloudSaved: false
    };
  }),

  saveWorkspaceToCloud: async (userId) => {
    set({ isSyncing: true });
    
    try {
      const cards = get().cards;
      
      // First check if the user already has a workspace
      const { data: existingWorkspace } = await supabase
        .from('workspaces')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (existingWorkspace) {
        // Update existing workspace
        await supabase
          .from('workspaces')
          .update({
            cards_data: cards,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingWorkspace.id);
      } else {
        // Create new workspace
        await supabase
          .from('workspaces')
          .insert({
            user_id: userId,
            cards_data: cards,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
      
      set({ 
        isCloudSaved: true,
        lastSyncedAt: new Date()
      });
    } catch (error) {
      console.error('Error saving workspace to cloud:', error);
    } finally {
      set({ isSyncing: false });
    }
  },
  
  loadWorkspaceFromCloud: async (userId) => {
    set({ isSyncing: true });
    
    try {
      const { data: workspace, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }
      
      if (workspace && workspace.cards_data) {
        const cloudCards = workspace.cards_data as CardType[];
        
        // Always use cloud data when explicitly loading from cloud
        saveCards(cloudCards);
        set({ 
          cards: cloudCards,
          isCloudSaved: true,
          lastSyncedAt: new Date(workspace.updated_at)
        });
      } else {
        // No cloud data found, but we've checked
        set({ isCloudSaved: true, lastSyncedAt: new Date() });
      }
    } catch (error) {
      console.error('Error loading workspace from cloud:', error);
    } finally {
      set({ isSyncing: false });
    }
  },

  syncWorkspace: async (userId) => {
    set({ isSyncing: true });
    
    try {
      // First, get cloud workspace
      const { data: workspace, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }
      
      if (workspace && workspace.cards_data) {
        // We have cloud data, perform merge with preference to cloud data
        const cloudCards = workspace.cards_data as CardType[];
        get().mergeWorkspaces(cloudCards, true);
      } else {
        // No cloud data, just save current state to cloud
        await get().saveWorkspaceToCloud(userId);
      }
    } catch (error) {
      console.error('Error syncing workspace:', error);
    } finally {
      set({ isSyncing: false });
    }
  },

  mergeWorkspaces: (cloudCards, preferCloudData = false) => {
    const localCards = get().cards;
    
    // Create maps for easier lookup
    const localCardsMap = new Map(localCards.map(card => [card.id, card]));
    const cloudCardsMap = new Map(cloudCards.map(card => [card.id, card]));
    
    // Create merged cards array
    const mergedCards: CardType[] = [];
    
    // Add all cloud cards first if we prefer cloud data
    if (preferCloudData) {
      for (const [id, cloudCard] of cloudCardsMap.entries()) {
        mergedCards.push(cloudCard);
      }
      
      // Add local cards that don't exist in cloud
      for (const [id, localCard] of localCardsMap.entries()) {
        if (!cloudCardsMap.has(id)) {
          mergedCards.push(localCard);
        }
      }
    } else {
      // Original merge logic - prefer local data
      // Add all local cards
      for (const [id, localCard] of localCardsMap.entries()) {
        mergedCards.push(localCard);
      }
      
      // Add cloud-only cards
      for (const [id, cloudCard] of cloudCardsMap.entries()) {
        if (!localCardsMap.has(id)) {
          mergedCards.push(cloudCard);
        }
      }
    }
    
    // Update localStorage and state
    saveCards(mergedCards);
    set({ 
      cards: mergedCards,
      isCloudSaved: true,
      lastSyncedAt: new Date()
    });
    
    // Save the merged workspace back to the cloud if we preferred local data
    if (!preferCloudData) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          get().saveWorkspaceToCloud(data.user.id);
        }
      });
    }
  }
}));