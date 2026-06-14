
import { HistoryItem } from '../types';

const HISTORY_KEY = 'ai_nqs_query_history_v3'; // Bumped version for clean engine launch

export const historyDb = {
  getAll: (): HistoryItem[] => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error reading history database:", error);
      return [];
    }
  },

  add: (item: HistoryItem): HistoryItem[] => {
    try {
      const currentHistory = historyDb.getAll();
      const updatedHistory = [item, ...currentHistory.slice(0, 49)]; // Keep last 50
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
      return updatedHistory;
    } catch (error) {
      console.error("Error writing to history database:", error);
      return [];
    }
  },

  clear: (): HistoryItem[] => {
    try {
      localStorage.removeItem(HISTORY_KEY);
      // Ensure it's really gone by clearing all possible variations
      localStorage.removeItem('ai_nqs_query_history_v1');
      localStorage.removeItem('ai_nqs_query_history_v2');
      return [];
    } catch (error) {
      console.error("Error clearing history database:", error);
      return [];
    }
  }
};
