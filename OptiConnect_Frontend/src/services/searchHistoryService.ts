/**
 * Search History Service
 * Manages search history with localStorage persistence
 */

import { SearchQuery } from '../types/search.types';

const HISTORY_KEY = 'gis_search_history';
const MAX_HISTORY_SIZE = 50;

export class SearchHistoryService {
  private maxSize: number;

  constructor(maxSize: number = MAX_HISTORY_SIZE) {
    this.maxSize = maxSize;
  }

  /**
   * Get all search history
   */
  getHistory(): SearchQuery[] {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      if (!data) return [];

      const history = JSON.parse(data);
      // Convert date strings back to Date objects
      return history.map((h: any) => ({
        ...h,
        timestamp: new Date(h.timestamp),
      }));
    } catch (error) {
      console.error('Error loading search history:', error);
      return [];
    }
  }

  /**
   * Add search query to history
   */
  addToHistory(query: SearchQuery): void {
    try {
      let history = this.getHistory();

      // Remove duplicate if exists
      history = history.filter((h) => h.query.toLowerCase() !== query.query.toLowerCase());

      // Add new query at the beginning
      history.unshift(query);

      // Limit size
      if (history.length > this.maxSize) {
        history = history.slice(0, this.maxSize);
      }

      this.saveHistory(history);
    } catch (error) {
      console.error('Error adding to search history:', error);
    }
  }

  /**
   * Remove specific search from history
   */
  removeFromHistory(id: string): boolean {
    try {
      const history = this.getHistory();
      const filtered = history.filter((h) => h.id !== id);

      if (filtered.length === history.length) {
        return false; // Not found
      }

      this.saveHistory(filtered);
      return true;
    } catch (error) {
      console.error('Error removing from search history:', error);
      return false;
    }
  }

  /**
   * Clear all search history
   */
  clearHistory(): number {
    try {
      const history = this.getHistory();
      const count = history.length;
      this.saveHistory([]);
      return count;
    } catch (error) {
      console.error('Error clearing search history:', error);
      return 0;
    }
  }

  /**
   * Get recent searches (last N)
   */
  getRecent(limit: number = 10): SearchQuery[] {
    const history = this.getHistory();
    return history.slice(0, limit);
  }

  /**
   * Search within history
   */
  searchHistory(query: string): SearchQuery[] {
    const history = this.getHistory();
    const queryLower = query.toLowerCase();

    return history.filter((h) => h.query.toLowerCase().includes(queryLower));
  }

  /**
   * Get searches by type
   */
  getByType(type: string): SearchQuery[] {
    const history = this.getHistory();
    return history.filter((h) => h.type === type);
  }

  /**
   * Get popular searches (most frequent)
   */
  getPopular(limit: number = 5): Array<{ query: string; count: number }> {
    const history = this.getHistory();
    const queryCount = new Map<string, number>();

    history.forEach((h) => {
      const queryLower = h.query.toLowerCase();
      queryCount.set(queryLower, (queryCount.get(queryLower) || 0) + 1);
    });

    return Array.from(queryCount.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Save history to localStorage
   */
  private saveHistory(history: SearchQuery[]): void {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving search history:', error);
      throw new Error('Failed to save search history');
    }
  }

  /**
   * Export history to JSON
   */
  exportHistory(): string {
    const history = this.getHistory();

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      history,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import history from JSON
   */
  importHistory(
    jsonData: string,
    merge: boolean = false
  ): { success: boolean; count: number; error?: string } {
    try {
      const importData = JSON.parse(jsonData);

      if (!importData.history || !Array.isArray(importData.history)) {
        return { success: false, count: 0, error: 'Invalid format' };
      }

      let history = importData.history.map((h: any) => ({
        ...h,
        timestamp: new Date(h.timestamp),
      }));

      if (merge) {
        const existing = this.getHistory();
        const existingIds = new Set(existing.map((h) => h.id));

        // Add only new entries
        history = history.filter((h: SearchQuery) => !existingIds.has(h.id));
        history = [...existing, ...history];

        // Sort by timestamp (newest first)
        history.sort((a: SearchQuery, b: SearchQuery) => b.timestamp.getTime() - a.timestamp.getTime());

        // Limit size
        if (history.length > this.maxSize) {
          history = history.slice(0, this.maxSize);
        }
      }

      this.saveHistory(history);
      return { success: true, count: history.length };
    } catch (error) {
      console.error('Error importing search history:', error);
      return { success: false, count: 0, error: 'Failed to parse data' };
    }
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    total: number;
    byType: Record<string, number>;
    today: number;
    thisWeek: number;
  } {
    const history = this.getHistory();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      total: history.length,
      byType: {} as Record<string, number>,
      today: 0,
      thisWeek: 0,
    };

    history.forEach((h) => {
      // Count by type
      stats.byType[h.type] = (stats.byType[h.type] || 0) + 1;

      // Count today
      if (h.timestamp >= today) {
        stats.today++;
      }

      // Count this week
      if (h.timestamp >= weekAgo) {
        stats.thisWeek++;
      }
    });

    return stats;
  }
}

export default SearchHistoryService;
