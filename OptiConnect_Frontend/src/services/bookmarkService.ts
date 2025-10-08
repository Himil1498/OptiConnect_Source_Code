/**
 * Bookmark Service
 * Handles bookmark CRUD operations and category management
 */

import { Bookmark, BookmarkCategory } from '../types/search.types';

const BOOKMARKS_KEY = 'gis_bookmarks';
const CATEGORIES_KEY = 'gis_bookmark_categories';

export class BookmarkService {
  /**
   * Get all bookmarks
   */
  getBookmarks(): Bookmark[] {
    try {
      const data = localStorage.getItem(BOOKMARKS_KEY);
      if (!data) return [];

      const bookmarks = JSON.parse(data);
      // Convert date strings back to Date objects
      return bookmarks.map((b: any) => ({
        ...b,
        createdAt: new Date(b.createdAt),
        updatedAt: new Date(b.updatedAt),
      }));
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      return [];
    }
  }

  /**
   * Get bookmark by ID
   */
  getBookmark(id: string): Bookmark | null {
    const bookmarks = this.getBookmarks();
    return bookmarks.find((b) => b.id === id) || null;
  }

  /**
   * Add new bookmark
   */
  addBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>): Bookmark {
    const bookmarks = this.getBookmarks();

    const newBookmark: Bookmark = {
      ...bookmark,
      id: `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    bookmarks.push(newBookmark);
    this.saveBookmarks(bookmarks);

    return newBookmark;
  }

  /**
   * Update existing bookmark
   */
  updateBookmark(id: string, updates: Partial<Bookmark>): Bookmark | null {
    const bookmarks = this.getBookmarks();
    const index = bookmarks.findIndex((b) => b.id === id);

    if (index === -1) return null;

    const updatedBookmark: Bookmark = {
      ...bookmarks[index],
      ...updates,
      id: bookmarks[index].id, // Prevent ID change
      createdAt: bookmarks[index].createdAt, // Preserve creation date
      updatedAt: new Date(),
    };

    bookmarks[index] = updatedBookmark;
    this.saveBookmarks(bookmarks);

    return updatedBookmark;
  }

  /**
   * Delete bookmark
   */
  deleteBookmark(id: string): boolean {
    const bookmarks = this.getBookmarks();
    const filtered = bookmarks.filter((b) => b.id !== id);

    if (filtered.length === bookmarks.length) {
      return false; // No bookmark found
    }

    this.saveBookmarks(filtered);
    return true;
  }

  /**
   * Delete multiple bookmarks
   */
  deleteBookmarks(ids: string[]): number {
    const bookmarks = this.getBookmarks();
    const filtered = bookmarks.filter((b) => !ids.includes(b.id));
    const deletedCount = bookmarks.length - filtered.length;

    this.saveBookmarks(filtered);
    return deletedCount;
  }

  /**
   * Search bookmarks
   */
  searchBookmarks(query: string): Bookmark[] {
    const bookmarks = this.getBookmarks();
    const queryLower = query.toLowerCase();

    return bookmarks.filter((b) => {
      return (
        b.name.toLowerCase().includes(queryLower) ||
        b.description?.toLowerCase().includes(queryLower) ||
        b.category?.toLowerCase().includes(queryLower)
      );
    });
  }

  /**
   * Get bookmarks by category
   */
  getBookmarksByCategory(category: string): Bookmark[] {
    const bookmarks = this.getBookmarks();
    return bookmarks.filter((b) => b.category === category);
  }

  /**
   * Check if bookmark exists for location
   */
  isBookmarked(lat: number, lng: number, tolerance: number = 0.0001): boolean {
    const bookmarks = this.getBookmarks();
    return bookmarks.some((b) => {
      const latDiff = Math.abs(b.location.lat - lat);
      const lngDiff = Math.abs(b.location.lng - lng);
      return latDiff < tolerance && lngDiff < tolerance;
    });
  }

  /**
   * Save bookmarks to localStorage
   */
  private saveBookmarks(bookmarks: Bookmark[]): void {
    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    } catch (error) {
      console.error('Error saving bookmarks:', error);
      throw new Error('Failed to save bookmarks');
    }
  }

  /**
   * Get all categories
   */
  getCategories(): BookmarkCategory[] {
    try {
      const data = localStorage.getItem(CATEGORIES_KEY);
      if (!data) {
        return this.getDefaultCategories();
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      return this.getDefaultCategories();
    }
  }

  /**
   * Add new category
   */
  addCategory(category: Omit<BookmarkCategory, 'id'>): BookmarkCategory {
    const categories = this.getCategories();

    const newCategory: BookmarkCategory = {
      ...category,
      id: `category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    categories.push(newCategory);
    this.saveCategories(categories);

    return newCategory;
  }

  /**
   * Update category
   */
  updateCategory(id: string, updates: Partial<BookmarkCategory>): BookmarkCategory | null {
    const categories = this.getCategories();
    const index = categories.findIndex((c) => c.id === id);

    if (index === -1) return null;

    const updatedCategory: BookmarkCategory = {
      ...categories[index],
      ...updates,
      id: categories[index].id, // Prevent ID change
    };

    categories[index] = updatedCategory;
    this.saveCategories(categories);

    return updatedCategory;
  }

  /**
   * Delete category
   */
  deleteCategory(id: string): boolean {
    const categories = this.getCategories();
    const filtered = categories.filter((c) => c.id !== id);

    if (filtered.length === categories.length) {
      return false;
    }

    // Remove category from all bookmarks
    const bookmarks = this.getBookmarks();
    const category = categories.find((c) => c.id === id);
    if (category) {
      bookmarks.forEach((b) => {
        if (b.category === category.name) {
          b.category = undefined;
        }
      });
      this.saveBookmarks(bookmarks);
    }

    this.saveCategories(filtered);
    return true;
  }

  /**
   * Save categories to localStorage
   */
  private saveCategories(categories: BookmarkCategory[]): void {
    try {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving categories:', error);
      throw new Error('Failed to save categories');
    }
  }

  /**
   * Get default categories
   */
  private getDefaultCategories(): BookmarkCategory[] {
    return [
      { id: 'cat_work', name: 'Work', color: '#3B82F6', icon: '💼' },
      { id: 'cat_personal', name: 'Personal', color: '#10B981', icon: '🏠' },
      { id: 'cat_travel', name: 'Travel', color: '#F59E0B', icon: '✈️' },
      { id: 'cat_favorites', name: 'Favorites', color: '#EF4444', icon: '⭐' },
      { id: 'cat_other', name: 'Other', color: '#6B7280', icon: '📍' },
    ];
  }

  /**
   * Export bookmarks to JSON
   */
  exportBookmarks(): string {
    const bookmarks = this.getBookmarks();
    const categories = this.getCategories();

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      bookmarks,
      categories,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import bookmarks from JSON
   */
  importBookmarks(jsonData: string, merge: boolean = false): { success: boolean; count: number; error?: string } {
    try {
      const importData = JSON.parse(jsonData);

      if (!importData.bookmarks || !Array.isArray(importData.bookmarks)) {
        return { success: false, count: 0, error: 'Invalid format' };
      }

      let bookmarks = importData.bookmarks.map((b: any) => ({
        ...b,
        createdAt: new Date(b.createdAt),
        updatedAt: new Date(b.updatedAt),
      }));

      if (merge) {
        // Merge with existing bookmarks
        const existing = this.getBookmarks();
        const existingIds = new Set(existing.map((b) => b.id));

        // Add only new bookmarks
        bookmarks = bookmarks.filter((b: Bookmark) => !existingIds.has(b.id));
        bookmarks = [...existing, ...bookmarks];
      }

      this.saveBookmarks(bookmarks);

      // Import categories if available
      if (importData.categories && Array.isArray(importData.categories)) {
        if (merge) {
          const existingCategories = this.getCategories();
          const existingCategoryIds = new Set(existingCategories.map((c) => c.id));
          const newCategories = importData.categories.filter(
            (c: BookmarkCategory) => !existingCategoryIds.has(c.id)
          );
          this.saveCategories([...existingCategories, ...newCategories]);
        } else {
          this.saveCategories(importData.categories);
        }
      }

      return { success: true, count: bookmarks.length };
    } catch (error) {
      console.error('Error importing bookmarks:', error);
      return { success: false, count: 0, error: 'Failed to parse data' };
    }
  }

  /**
   * Clear all bookmarks
   */
  clearAllBookmarks(): number {
    const bookmarks = this.getBookmarks();
    const count = bookmarks.length;
    this.saveBookmarks([]);
    return count;
  }

  /**
   * Get bookmark statistics
   */
  getStatistics(): {
    total: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
  } {
    const bookmarks = this.getBookmarks();

    const stats = {
      total: bookmarks.length,
      byType: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
    };

    bookmarks.forEach((b) => {
      // Count by type
      stats.byType[b.type] = (stats.byType[b.type] || 0) + 1;

      // Count by category
      const category = b.category || 'Uncategorized';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    });

    return stats;
  }
}

export default BookmarkService;
