/**
 * Search Service
 * Handles all search operations: places, coordinates, saved data, imported data
 */

import { parseCoordinates, calculateDistance } from '../utils/coordinateParser';
import {
  SearchQuery,
  SearchResult,
  SearchType,
  SearchSource,
} from '../types/search.types';

export class SearchService {
  private map: google.maps.Map;
  private placesService: google.maps.places.PlacesService;

  constructor(map: google.maps.Map) {
    this.map = map;
    this.placesService = new google.maps.places.PlacesService(map);
  }

  /**
   * Main search function - determines type and routes to appropriate handler
   */
  async search(query: string, type?: SearchType): Promise<SearchResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const trimmedQuery = query.trim();

    // Auto-detect type if not specified
    if (!type) {
      type = this.detectSearchType(trimmedQuery);
    }

    switch (type) {
      case 'coordinates':
        return this.searchCoordinates(trimmedQuery);
      case 'place':
        return this.searchPlaces(trimmedQuery);
      case 'savedData':
        return this.searchSavedData(trimmedQuery);
      case 'imported':
        return this.searchImportedData(trimmedQuery);
      default:
        return this.searchAll(trimmedQuery);
    }
  }

  /**
   * Auto-detect search type from query pattern
   */
  private detectSearchType(query: string): SearchType {
    // Check if it's coordinates
    const coordPatterns = [
      /^-?\d+\.?\d*[,\s]+-?\d+\.?\d*$/, // Decimal
      /^-?\d+\.?\d*°?\s*[NS][,\s]+-?\d+\.?\d*°?\s*[EW]$/i, // Degrees
      /^\d+°\d+'[\d.]+"\s*[NS]\s+\d+°\d+'[\d.]+"\s*[EW]$/i, // DMS
      /@-?\d+\.?\d*,-?\d+\.?\d*/, // URL
    ];

    for (const pattern of coordPatterns) {
      if (pattern.test(query)) {
        return 'coordinates';
      }
    }

    // Default to place search
    return 'place';
  }

  /**
   * Search for coordinates
   */
  private async searchCoordinates(query: string): Promise<SearchResult[]> {
    const parsed = parseCoordinates(query);
    if (!parsed) {
      return [];
    }

    const { lat, lng } = parsed;

    // Get place name via reverse geocoding
    const geocoder = new google.maps.Geocoder();

    return new Promise((resolve) => {
      geocoder.geocode(
        { location: { lat, lng } },
        (results, status) => {
          if (status === 'OK' && results && results[0]) {
            resolve([
              {
                id: `coord_${Date.now()}`,
                name: results[0].formatted_address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                type: 'coordinates',
                location: { lat, lng },
                address: results[0].formatted_address,
                placeId: results[0].place_id,
                source: 'coordinates',
              },
            ]);
          } else {
            // Return coordinate without address
            resolve([
              {
                id: `coord_${Date.now()}`,
                name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                type: 'coordinates',
                location: { lat, lng },
                source: 'coordinates',
              },
            ]);
          }
        }
      );
    });
  }

  /**
   * Search for places using Google Places API (with fallback)
   */
  private async searchPlaces(query: string): Promise<SearchResult[]> {
    try {
      // Try new Places API first
      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      if (apiKey) {
        const response = await fetch(
          `https://places.googleapis.com/v1/places:searchText`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": apiKey,
              "X-Goog-FieldMask":
                "places.displayName,places.formattedAddress,places.location,places.id,places.types"
            },
            body: JSON.stringify({
              textQuery: `${query} India`,
              regionCode: "IN",
              maxResultCount: 10
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.places && data.places.length > 0) {
            const searchResults: SearchResult[] = data.places.map((place: any) => {
              const location = {
                lat: place.location.latitude,
                lng: place.location.longitude,
              };

              const center = this.map.getCenter();
              const distance = center
                ? calculateDistance(
                    { lat: center.lat(), lng: center.lng() },
                    location
                  )
                : undefined;

              return {
                id: place.id,
                name: place.displayName?.text || 'Unknown Place',
                type: 'place' as SearchType,
                location,
                address: place.formattedAddress || '',
                placeId: place.id,
                source: 'places' as SearchSource,
                distance,
              };
            });

            return searchResults.sort((a, b) => (a.distance || 0) - (b.distance || 0));
          }
        }
      }
    } catch (error) {
      console.error('Places API error, using Geocoding fallback:', error);
    }

    // Fallback to Geocoding API
    return new Promise((resolve) => {
      const geocoder = new google.maps.Geocoder();

      geocoder.geocode(
        {
          address: `${query}, India`,
          componentRestrictions: { country: "IN" }
        },
        (results, status) => {
          if (status === "OK" && results && results.length > 0) {
            const searchResults: SearchResult[] = results
              .slice(0, 10)
              .map((result) => {
                const location = {
                  lat: result.geometry.location.lat(),
                  lng: result.geometry.location.lng(),
                };

                const center = this.map.getCenter();
                const distance = center
                  ? calculateDistance(
                      { lat: center.lat(), lng: center.lng() },
                      location
                    )
                  : undefined;

                return {
                  id: result.place_id || `geocode_${Date.now()}_${Math.random()}`,
                  name: result.address_components[0]?.long_name || result.formatted_address.split(",")[0],
                  type: 'place' as SearchType,
                  location,
                  address: result.formatted_address,
                  placeId: result.place_id,
                  source: 'places' as SearchSource,
                  distance,
                };
              })
              .sort((a, b) => (a.distance || 0) - (b.distance || 0));

            resolve(searchResults);
          } else {
            resolve([]);
          }
        }
      );
    });
  }

  /**
   * Search through saved GIS data
   */
  private async searchSavedData(query: string): Promise<SearchResult[]> {
    try {
      const queryLower = query.toLowerCase();
      const results: SearchResult[] = [];

      // Search Distance Measurements
      const distances = JSON.parse(localStorage.getItem('gis_distance_measurements') || '[]');
      distances.forEach((item: any) => {
        if (item.name?.toLowerCase().includes(queryLower)) {
          // Use first point for location
          const points = item.points || [];
          const location = points.length > 0 ? points[0] : { lat: 0, lng: 0 };
          results.push({
            id: item.id,
            name: item.name,
            type: 'savedData' as SearchType,
            location,
            address: `Distance: ${item.totalDistance || 0}m`,
            data: { ...item, type: 'Distance' },
            source: 'saved' as SearchSource,
          });
        }
      });

      // Search Polygons
      const polygons = JSON.parse(localStorage.getItem('gis_polygons') || '[]');
      polygons.forEach((item: any) => {
        if (item.name?.toLowerCase().includes(queryLower)) {
          // Calculate center of vertices for location
          const vertices = item.vertices || item.path || [];
          let location = { lat: 0, lng: 0 };
          if (vertices.length > 0) {
            let latSum = 0, lngSum = 0;
            vertices.forEach((v: any) => {
              latSum += v.lat;
              lngSum += v.lng;
            });
            location = { lat: latSum / vertices.length, lng: lngSum / vertices.length };
          }
          results.push({
            id: item.id,
            name: item.name,
            type: 'savedData' as SearchType,
            location,
            address: `Polygon: ${item.area || 0}m²`,
            data: { ...item, type: 'Polygon' },
            source: 'saved' as SearchSource,
          });
        }
      });

      // Search Circles
      const circles = JSON.parse(localStorage.getItem('gis_circles') || '[]');
      circles.forEach((item: any) => {
        if (item.name?.toLowerCase().includes(queryLower)) {
          const location = item.center || { lat: 0, lng: 0 };
          results.push({
            id: item.id,
            name: item.name,
            type: 'savedData' as SearchType,
            location,
            address: `Circle: ${item.radius || 0}m radius`,
            data: { ...item, type: 'Circle' },
            source: 'saved' as SearchSource,
          });
        }
      });

      // Search Elevation Profiles
      const elevations = JSON.parse(localStorage.getItem('gis_elevation_profiles') || '[]');
      elevations.forEach((item: any) => {
        if (item.name?.toLowerCase().includes(queryLower)) {
          // Use first point for location
          const points = item.points || [];
          const location = points.length > 0 ? points[0] : { lat: 0, lng: 0 };
          results.push({
            id: item.id,
            name: item.name,
            type: 'savedData' as SearchType,
            location,
            address: `Elevation Profile`,
            data: { ...item, type: 'Elevation' },
            source: 'saved' as SearchSource,
          });
        }
      });

      // Search Infrastructure
      const infrastructures = JSON.parse(localStorage.getItem('gis_infrastructures') || '[]');
      infrastructures.forEach((item: any) => {
        if (item.name?.toLowerCase().includes(queryLower) || item.notes?.toLowerCase().includes(queryLower)) {
          // Use coordinates property (matching LayerManager)
          const location = item.coordinates || item.location || { lat: 0, lng: 0 };

          // Format address if it's an object
          let addressStr = '';
          if (item.address && typeof item.address === 'object') {
            const addr = item.address;
            addressStr = [addr.street, addr.city, addr.state, addr.pincode]
              .filter(Boolean)
              .join(', ');
          } else {
            addressStr = item.address || item.notes || '';
          }

          results.push({
            id: item.id,
            name: item.name,
            type: 'savedData' as SearchType,
            location,
            address: addressStr,
            data: { ...item, type: 'Infrastructure' },
            source: 'saved' as SearchSource,
          });
        }
      });

      return results;
    } catch (error) {
      console.error('Error searching saved data:', error);
      return [];
    }
  }

  /**
   * Search through imported files (KML, GeoJSON, etc.)
   */
  private async searchImportedData(query: string): Promise<SearchResult[]> {
    try {
      const queryLower = query.toLowerCase();
      const results: SearchResult[] = [];

      // Search Infrastructure items with source "KML" (imported data)
      const infrastructures = JSON.parse(localStorage.getItem('gis_infrastructures') || '[]');
      infrastructures.forEach((item: any) => {
        if (item.source === 'KML' && (item.name?.toLowerCase().includes(queryLower) || item.notes?.toLowerCase().includes(queryLower))) {
          // Use coordinates property first (matching LayerManager)
          const location = item.coordinates || item.location || item.position || { lat: 0, lng: 0 };

          // Format address if it's an object
          let addressStr = '';
          if (item.address && typeof item.address === 'object') {
            const addr = item.address;
            addressStr = [addr.street, addr.city, addr.state, addr.pincode]
              .filter(Boolean)
              .join(', ');
          } else {
            addressStr = item.address || item.notes || 'Imported from KML';
          }

          results.push({
            id: item.id,
            name: item.name,
            type: 'imported' as SearchType,
            location,
            address: addressStr,
            data: { ...item, type: 'Infrastructure' },
            source: 'imported' as SearchSource,
          });
        }
      });

      return results;
    } catch (error) {
      console.error('Error searching imported data:', error);
      return [];
    }
  }

  /**
   * Search across all sources
   */
  private async searchAll(query: string): Promise<SearchResult[]> {
    const [places, saved, imported] = await Promise.all([
      this.searchPlaces(query),
      this.searchSavedData(query),
      this.searchImportedData(query),
    ]);

    // Combine and deduplicate results
    const allResults = [...places, ...saved, ...imported];

    // Sort by relevance (places first, then by distance if available)
    return allResults.sort((a, b) => {
      if (a.source === 'places' && b.source !== 'places') return -1;
      if (a.source !== 'places' && b.source === 'places') return 1;
      return (a.distance || Infinity) - (b.distance || Infinity);
    });
  }

  /**
   * Get India bounds for restricting search
   */
  private getIndiaBounds(): google.maps.LatLngBounds {
    return new google.maps.LatLngBounds(
      new google.maps.LatLng(6.4627, 68.1097), // Southwest
      new google.maps.LatLng(35.5087, 97.3953) // Northeast
    );
  }

  /**
   * Get place details by place ID
   */
  async getPlaceDetails(placeId: string): Promise<google.maps.places.PlaceResult | null> {
    return new Promise((resolve) => {
      this.placesService.getDetails(
        {
          placeId: placeId,
          fields: ['name', 'formatted_address', 'geometry', 'photos', 'rating', 'opening_hours', 'website', 'formatted_phone_number'],
        },
        (result, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && result) {
            resolve(result);
          } else {
            resolve(null);
          }
        }
      );
    });
  }
}

export default SearchService;
