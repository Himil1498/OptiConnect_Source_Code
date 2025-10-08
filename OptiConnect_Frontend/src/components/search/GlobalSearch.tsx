/**
 * Global Search Component
 * Main search interface with multi-source search capabilities
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import SearchService from "../../services/searchService";
import BookmarkService from "../../services/bookmarkService";
import SearchHistoryService from "../../services/searchHistoryService";
import { createVisualizationForEntry } from "../../utils/mapVisualization";
import {
  SearchResult,
  SearchType,
  SearchQuery
} from "../../types/search.types";

interface GlobalSearchProps {
  map: google.maps.Map | null;
  onResultSelect?: (result: SearchResult) => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ map, onResultSelect }) => {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("place");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchQuery[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [currentOverlays, setCurrentOverlays] = useState<
    google.maps.MVCObject[]
  >([]);
  const [dialogMessage, setDialogMessage] = useState<string | null>(null);

  const searchService = useRef<SearchService | null>(null);
  const bookmarkService = useRef<BookmarkService | null>(null);
  const historyService = useRef<SearchHistoryService | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search panel on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
        setShowHistory(false);
        setShowBookmarks(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isExpanded]);

  const showDialog = (message: string) => {
    setDialogMessage(message);
    setTimeout(() => setDialogMessage(null), 3000);
  };

  useEffect(() => {
    if (map) {
      searchService.current = new SearchService(map);
      bookmarkService.current = new BookmarkService();
      historyService.current = new SearchHistoryService();
      loadRecentSearches();
    }
  }, [map]);

  // Listen for bookmark deletion events from map
  useEffect(() => {
    const handleBookmarkDeleted = () => {
      loadBookmarks();
      showDialog("✅ Bookmark deleted successfully!");
    };

    window.addEventListener("bookmarkDeleted", handleBookmarkDeleted);
    return () =>
      window.removeEventListener("bookmarkDeleted", handleBookmarkDeleted);
  }, []);

  const loadRecentSearches = () => {
    if (historyService.current) {
      const recent = historyService.current.getRecent(5);
      setRecentSearches(recent);
    }
  };

  const loadBookmarks = () => {
    if (bookmarkService.current) {
      const allBookmarks = bookmarkService.current.getBookmarks();
      setBookmarks(allBookmarks);
    }
  };

  const handleBookmarkClick = (bookmark: any) => {
    // Clear existing overlays
    clearAllOverlays();

    // Navigate to bookmark location
    if (map) {
      map.panTo(bookmark.location);
      map.setZoom(15);
    }

    // Create data entry format for visualization
    const entry = {
      id: bookmark.id,
      type: "Bookmark",
      name: bookmark.name,
      createdAt: bookmark.createdAt,
      data: {
        ...bookmark,
        type: "Bookmark"
      }
    };

    // Use the same visualization as Map Layers Control
    if (map) {
      const overlays = createVisualizationForEntry(
        entry,
        map,
        bookmarkService.current || undefined
      );
      setCurrentOverlays(overlays);
    }
  };

  const performSearch = useCallback(
    async (searchQuery: string, type?: SearchType) => {
      if (!searchQuery.trim() || !searchService.current) return;

      setIsSearching(true);
      setIsExpanded(true);

      try {
        const searchResults = await searchService.current.search(
          searchQuery,
          type
        );
        setResults(searchResults);

        // Save to history
        if (historyService.current && searchResults.length > 0) {
          const historyEntry: SearchQuery = {
            id: `search_${Date.now()}`,
            query: searchQuery,
            type: type || "place",
            timestamp: new Date(),
            results: searchResults
          };
          historyService.current.addToHistory(historyEntry);
          loadRecentSearches();
        }
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(value, searchType);
      }, 500);
    } else {
      setResults([]);
      // Don't close the search box, just clear results
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      performSearch(query, searchType);
    } else if (e.key === "Escape") {
      clearSearch();
    }
  };

  const clearAllOverlays = () => {
    currentOverlays.forEach((overlay) => {
      if (overlay instanceof google.maps.Marker) {
        overlay.setMap(null);
      } else if (overlay instanceof google.maps.Polyline) {
        overlay.setMap(null);
      } else if (overlay instanceof google.maps.Polygon) {
        overlay.setMap(null);
      } else if (overlay instanceof google.maps.Circle) {
        overlay.setMap(null);
      } else if (overlay instanceof google.maps.InfoWindow) {
        overlay.close();
      }
    });
    setCurrentOverlays([]);
  };

  const handleResultClick = (result: SearchResult) => {
    // Clear existing overlays first
    clearAllOverlays();

    // For saved/imported data, use the detailed visualization
    if (result.source === "saved" || result.source === "imported") {
      // Create data entry format
      const entry = {
        id: result.id,
        type: result.data?.type || "Infrastructure",
        name: result.name,
        createdAt: result.data?.createdAt || new Date(),
        data: result.data
      };

      // Navigate to location
      if (map) {
        map.panTo(result.location);

        // Set appropriate zoom based on type
        let zoom = 15;
        if (entry.type === "Distance" || entry.type === "Elevation") {
          zoom = 12;
        } else if (entry.type === "Polygon") {
          zoom = 13;
        } else if (entry.type === "Circle") {
          const radius = result.data?.radius || 1000;
          zoom = radius > 10000 ? 10 : radius > 5000 ? 11 : 13;
        }
        map.setZoom(zoom);

        // Create detailed visualization
        const overlays = createVisualizationForEntry(
          entry,
          map,
          bookmarkService.current || undefined
        );
        setCurrentOverlays(overlays);
      }
    } else {
      // For place/coordinate searches, use gradient style marker
      if (map) {
        map.panTo(result.location);
        map.setZoom(15);
      }

      const marker = new google.maps.Marker({
        position: result.location,
        map: map,
        animation: google.maps.Animation.DROP,
        title: result.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: result.type === "coordinates" ? "#6366F1" : "#3B82F6",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 2
        },
        label: {
          text: result.type === "coordinates" ? "📍" : "📌",
          color: "#FFFFFF",
          fontSize: "14px"
        }
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; max-width: 350px; font-family: system-ui, -apple-system, sans-serif;">
            <div style="background: linear-gradient(135deg, ${
              result.type === "coordinates"
                ? "#6366F1 0%, #4F46E5"
                : "#3B82F6 0%, #2563EB"
            } 100%); color: white; padding: 12px; margin: -12px -12px 12px -12px; border-radius: 8px 8px 0 0;">
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <span style="font-size: 20px; margin-right: 8px;">${
                  result.type === "coordinates" ? "📍" : "📌"
                }</span>
                <h3 style="margin: 0; font-size: 18px; font-weight: 700;">${
                  result.name
                }</h3>
              </div>
              <p style="margin: 0; font-size: 12px; opacity: 0.9;">${
                result.type === "coordinates" ? "Coordinates" : "Place"
              }</p>
            </div>
            ${
              result.address
                ? `
            <div style="background: #EFF6FF; padding: 10px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #3B82F6;">
              <p style="margin: 0; font-size: 13px; color: #1F2937;"><strong>📫 Address:</strong><br/>${result.address}</p>
            </div>
            `
                : ""
            }
            ${
              result.location
                ? `
            <div style="background: #F9FAFB; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
              <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; font-size: 13px;">
                <span style="color: #6B7280; font-weight: 500;">📌 Coordinates:</span>
                <span style="color: #1F2937; font-weight: 600; font-family: monospace;">${result.location.lat.toFixed(
                  6
                )}, ${result.location.lng.toFixed(6)}</span>
              </div>
            </div>
            `
                : ""
            }
            <div style="margin-top: 10px; display: flex; gap: 8px; justify-content: center;">
              <button id="bookmark-btn-${
                result.id
              }" style="padding: 8px 16px; font-size: 13px; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);">
                ⭐ Bookmark
              </button>
            </div>
            <div style="border-top: 1px solid #E5E7EB; padding-top: 8px; margin-top: 8px;">
              <p style="margin: 0; font-size: 11px; color: #9CA3AF; text-align: center;">Click on map to close</p>
            </div>
          </div>
        `
      });

      infoWindow.open(map, marker);

      // Add bookmark functionality
      google.maps.event.addListenerOnce(infoWindow, "domready", () => {
        const bookmarkBtn = document.getElementById(
          `bookmark-btn-${result.id}`
        );
        if (bookmarkBtn && bookmarkService.current) {
          bookmarkBtn.addEventListener("click", () => {
            bookmarkService.current?.addBookmark({
              name: result.name,
              type: result.type,
              location: result.location,
              description: result.address
            });
            showDialog("✅ Bookmark added successfully!");
          });
        }
      });

      setCurrentOverlays([marker]);
    }

    // Don't close search box after selecting result
    // setIsExpanded(false);
    // setQuery("");
    // setResults([]);

    if (onResultSelect) {
      onResultSelect(result);
    }
  };

  const handleRecentSearchClick = (searchQuery: SearchQuery) => {
    setQuery(searchQuery.query);
    setSearchType(searchQuery.type);
    performSearch(searchQuery.query, searchQuery.type);
    setShowHistory(false);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setIsExpanded(false);
    setShowHistory(false);
  };

  const handleTypeChange = (type: SearchType) => {
    setSearchType(type);
    if (query.trim()) {
      performSearch(query, type);
    }
  };

  return (
    <div className="relative" ref={searchContainerRef}>
      {/* Dialog Notification */}
      {dialogMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 animate-fade-in-down">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl px-6 py-3 flex items-center gap-3">
            <span className="text-lg">
              {dialogMessage.includes("✅") ? "✅" : "ℹ️"}
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {dialogMessage.replace("✅ ", "").replace("ℹ️ ", "")}
            </span>
          </div>
        </div>
      )}

      {/* Search Button (Always Visible) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Global Search"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>

      {/* Search Panel (Expanded State) */}
      {isExpanded && (
        <div className="absolute left-0 top-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-5 w-[480px]">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Global Search
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowBookmarks(!showBookmarks);
                  if (!showBookmarks) loadBookmarks();
                  setShowHistory(false);
                  setQuery("");
                  setResults([]);
                }}
                className={`${
                  showBookmarks
                    ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                    : "text-gray-600 dark:text-gray-400"
                } hover:text-yellow-600 dark:hover:text-yellow-400 px-2 py-1 rounded hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors`}
                title="View Bookmarks"
              >
                <svg
                  className="w-5 h-5"
                  fill={showBookmarks ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
              </button>
              {currentOverlays.length > 0 && (
                <button
                  onClick={clearAllOverlays}
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-400 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Clear all markers from map"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
              <button
                onClick={() => {
                  setIsExpanded(false);
                  setQuery("");
                  setResults([]);
                  setShowHistory(false);
                  setShowBookmarks(false);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Close"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowHistory(true)}
                placeholder="Search places, coordinates, data..."
                className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />

              {query && (
                <button
                  onClick={clearSearch}
                  className="ml-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title="Clear"
                >
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}

              <button
                onClick={() => setShowHistory(!showHistory)}
                className="ml-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Search History"
              >
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Search Type Selector */}
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleTypeChange("place")}
                className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap transition-colors ${
                  searchType === "place"
                    ? "bg-blue-500 text-white shadow-sm"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                🔍 Places
              </button>
              <button
                onClick={() => handleTypeChange("coordinates")}
                className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap transition-colors ${
                  searchType === "coordinates"
                    ? "bg-blue-500 text-white shadow-sm"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                📍 Coordinates
              </button>
              <button
                onClick={() => handleTypeChange("savedData")}
                className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap transition-colors ${
                  searchType === "savedData"
                    ? "bg-blue-500 text-white shadow-sm"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                💾 Saved
              </button>
              <button
                onClick={() => handleTypeChange("imported")}
                className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap transition-colors ${
                  searchType === "imported"
                    ? "bg-blue-500 text-white shadow-sm"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                📁 Imported
              </button>
            </div>
          </div>

          {/* Recent Searches / Results */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="max-h-[320px] overflow-y-auto">
              {/* Loading State */}
              {isSearching && (
                <div className="p-4 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Searching...
                  </p>
                </div>
              )}

              {/* Bookmarks */}
              {!isSearching && showBookmarks && (
                <div className="p-2">
                  <p className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center justify-between">
                    <span>⭐ Saved Bookmarks</span>
                    <span className="text-blue-500">
                      {bookmarks.length} total
                    </span>
                  </p>
                  {bookmarks.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-4xl mb-2">⭐</div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No bookmarks yet
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Search for places and click "⭐ Bookmark" to save them
                      </p>
                    </div>
                  ) : (
                    bookmarks.map((bookmark) => (
                      <button
                        key={bookmark.id}
                        onClick={() => handleBookmarkClick(bookmark)}
                        className="w-full flex items-start gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-left border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                            <span className="text-white text-sm">⭐</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {bookmark.name}
                            </h4>
                            {bookmark.category && (
                              <span className="flex-shrink-0 px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                                {bookmark.category}
                              </span>
                            )}
                          </div>
                          {bookmark.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {bookmark.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              {bookmark.location.lat.toFixed(4)},{" "}
                              {bookmark.location.lng.toFixed(4)}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              {new Date(
                                bookmark.createdAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Recent Searches */}
              {!isSearching &&
                !showBookmarks &&
                showHistory &&
                recentSearches.length > 0 &&
                results.length === 0 && (
                  <div className="p-2">
                    <p className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Recent Searches
                    </p>
                    {recentSearches.map((search) => (
                      <button
                        key={search.id}
                        onClick={() => handleRecentSearchClick(search)}
                        className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-left"
                      >
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {search.query}
                        </span>
                        <span className="ml-auto text-xs text-gray-400">
                          {search.results.length} results
                        </span>
                      </button>
                    ))}
                  </div>
                )}

              {/* Search Results */}
              {!isSearching && results.length > 0 && (
                <div className="p-2">
                  <p className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Results ({results.length})
                  </p>
                  {results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className="w-full flex items-start gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-left"
                    >
                      <div className="mt-1">
                        <span className="text-lg">
                          {result.source === "places"
                            ? "📍"
                            : result.source === "coordinates"
                            ? "🎯"
                            : result.source === "saved"
                            ? "💾"
                            : "📁"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {result.name}
                        </p>
                        {result.address && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {result.address}
                          </p>
                        )}
                      </div>
                      {result.distance && (
                        <div className="text-xs text-gray-400 whitespace-nowrap">
                          {result.distance.toFixed(1)} km
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* No Results */}
              {!isSearching &&
                query &&
                results.length === 0 &&
                !showHistory && (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No results found
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
