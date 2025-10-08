// Search Types
export type SearchType = 'place' | 'coordinates' | 'savedData' | 'imported';
export type SearchSource = 'places' | 'saved' | 'imported' | 'coordinates';

export interface SearchQuery {
  id: string;
  query: string;
  type: SearchType;
  timestamp: Date;
  results: SearchResult[];
}

export interface SearchResult {
  id: string;
  name: string;
  type: SearchType;
  location: google.maps.LatLngLiteral;
  address?: string;
  placeId?: string;
  data?: any;
  source: SearchSource;
  distance?: number; // Distance from current location in km
}

export interface Bookmark {
  id: string;
  name: string;
  description?: string;
  type: SearchType;
  location: google.maps.LatLngLiteral;
  category?: string;
  data?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchHistory {
  queries: SearchQuery[];
  maxSize: number;
}

export interface SearchState {
  query: string;
  type: SearchType;
  results: SearchResult[];
  history: SearchQuery[];
  bookmarks: Bookmark[];
  isSearching: boolean;
  selectedResult: SearchResult | null;
}

export interface BookmarkCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
}
