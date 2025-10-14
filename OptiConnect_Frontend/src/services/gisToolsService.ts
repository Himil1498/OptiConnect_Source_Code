import { apiService } from './apiService';

/**
 * GIS Tools Service
 * Handles all GIS tool data with backend integration
 * Supports user-wise data storage and Admin/Manager filtering
 */

// ==================== TYPE DEFINITIONS ====================

export interface DistanceMeasurement {
  id?: number;
  user_id?: number;
  region_id?: number;
  measurement_name: string;
  points: Array<{ lat: number; lng: number }>;
  total_distance: number;
  unit?: 'meters' | 'kilometers' | 'miles';
  map_snapshot_url?: string;
  notes?: string;
  is_saved?: boolean;
  created_at?: string;
  updated_at?: string;
  // Frontend fields
  createdBy?: string;
  username?: string;
}

export interface PolygonDrawing {
  id?: number;
  user_id?: number;
  region_id?: number;
  polygon_name: string;
  coordinates: Array<{ lat: number; lng: number }>;
  area?: number;
  perimeter?: number;
  fill_color: string;
  stroke_color: string;
  opacity: number;
  properties?: Record<string, any>;
  notes?: string;
  is_saved?: boolean;
  created_at?: string;
  updated_at?: string;
  // Frontend fields
  createdBy?: string;
  username?: string;
}

export interface CircleDrawing {
  id?: number;
  user_id?: number;
  region_id?: number;
  circle_name: string;
  center_lat: number;
  center_lng: number;
  radius: number;
  fill_color: string;
  stroke_color: string;
  opacity: number;
  properties?: Record<string, any>;
  notes?: string;
  is_saved?: boolean;
  created_at?: string;
  updated_at?: string;
  // Frontend fields
  createdBy?: string;
  username?: string;
}

export interface SectorRF {
  id?: number;
  user_id?: number;
  region_id?: number;
  sector_name: string;
  tower_lat: number;
  tower_lng: number;
  azimuth: number;
  beamwidth: number;
  radius: number;
  frequency: number;
  power?: number;
  antenna_height?: number;
  antenna_type?: string;
  fill_color: string;
  stroke_color: string;
  opacity: number;
  properties?: Record<string, any>;
  notes?: string;
  is_saved?: boolean;
  created_at?: string;
  updated_at?: string;
  // Frontend fields
  createdBy?: string;
  username?: string;
}

export interface ElevationProfile {
  id?: number;
  user_id?: number;
  region_id?: number;
  profile_name: string;
  start_point: { lat: number; lng: number };
  end_point: { lat: number; lng: number };
  elevation_data: Array<{ distance: number; elevation: number; lat: number; lng: number }>;
  total_distance: number;
  max_elevation: number;
  min_elevation: number;
  notes?: string;
  is_saved?: boolean;
  created_at?: string;
  updated_at?: string;
  // Frontend fields
  createdBy?: string;
  username?: string;
}

export interface GISToolsFilters {
  userId?: number | 'all' | 'me';
  regionId?: number;
  page?: number;
  limit?: number;
  search?: string;
}

// ==================== DISTANCE MEASUREMENT APIs ====================

class DistanceMeasurementService {
  /**
   * Get all distance measurements with optional filters
   * Admin/Manager can specify userId to see other users' data
   */
  async getAll(filters?: GISToolsFilters): Promise<DistanceMeasurement[]> {
    try {
      const params: Record<string, any> = {};

      if (filters?.userId && filters.userId !== 'me' && filters.userId !== 'all') {
        params.userId = filters.userId;
      }
      if (filters?.regionId) params.regionId = filters.regionId;
      if (filters?.page) params.page = filters.page;
      if (filters?.limit) params.limit = filters.limit;

      const response = await apiService.get<{ success: boolean; measurements: DistanceMeasurement[] }>(
        '/measurements/distance',
        { params }
      );

      return response.data.measurements || [];
    } catch (error) {
      console.error('Error fetching distance measurements:', error);
      return [];
    }
  }

  /**
   * Get single distance measurement by ID
   */
  async getById(id: number): Promise<DistanceMeasurement | null> {
    try {
      const response = await apiService.get<{ success: boolean; measurement: DistanceMeasurement }>(
        `/measurements/distance/${id}`
      );
      return response.data.measurement || null;
    } catch (error) {
      console.error('Error fetching distance measurement:', error);
      return null;
    }
  }

  /**
   * Create new distance measurement
   */
  async create(data: Partial<DistanceMeasurement>): Promise<DistanceMeasurement | null> {
    try {
      const response = await apiService.post<{ success: boolean; measurement: DistanceMeasurement }>(
        '/measurements/distance',
        {
          measurement_name: data.measurement_name,
          points: data.points,
          total_distance: data.total_distance,
          unit: data.unit || 'meters',
          region_id: data.region_id,
          notes: data.notes,
          is_saved: true
        }
      );
      return response.data.measurement || null;
    } catch (error) {
      console.error('Error creating distance measurement:', error);
      throw error;
    }
  }

  /**
   * Update distance measurement
   */
  async update(id: number, data: Partial<DistanceMeasurement>): Promise<boolean> {
    try {
      await apiService.put(`/measurements/distance/${id}`, data);
      return true;
    } catch (error) {
      console.error('Error updating distance measurement:', error);
      return false;
    }
  }

  /**
   * Delete distance measurement
   */
  async delete(id: number): Promise<boolean> {
    try {
      await apiService.delete(`/measurements/distance/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting distance measurement:', error);
      return false;
    }
  }
}

// ==================== POLYGON DRAWING APIs ====================

class PolygonDrawingService {
  async getAll(filters?: GISToolsFilters): Promise<PolygonDrawing[]> {
    try {
      const params: Record<string, any> = {};

      if (filters?.userId && filters.userId !== 'me' && filters.userId !== 'all') {
        params.userId = filters.userId;
      }
      if (filters?.regionId) params.regionId = filters.regionId;

      const response = await apiService.get<{ success: boolean; polygons: PolygonDrawing[] }>(
        '/drawings/polygon',
        { params }
      );

      return response.data.polygons || [];
    } catch (error) {
      console.error('Error fetching polygon drawings:', error);
      return [];
    }
  }

  async getById(id: number): Promise<PolygonDrawing | null> {
    try {
      const response = await apiService.get<{ success: boolean; polygon: PolygonDrawing }>(
        `/drawings/polygon/${id}`
      );
      return response.data.polygon || null;
    } catch (error) {
      console.error('Error fetching polygon drawing:', error);
      return null;
    }
  }

  async create(data: Partial<PolygonDrawing>): Promise<PolygonDrawing | null> {
    try {
      const response = await apiService.post<{ success: boolean; polygon: PolygonDrawing }>(
        '/drawings/polygon',
        {
          polygon_name: data.polygon_name,
          coordinates: data.coordinates,
          area: data.area,
          perimeter: data.perimeter,
          fill_color: data.fill_color,
          stroke_color: data.stroke_color,
          opacity: data.opacity,
          region_id: data.region_id,
          properties: data.properties,
          notes: data.notes,
          is_saved: true
        }
      );
      return response.data.polygon || null;
    } catch (error) {
      console.error('Error creating polygon drawing:', error);
      throw error;
    }
  }

  async update(id: number, data: Partial<PolygonDrawing>): Promise<boolean> {
    try {
      await apiService.put(`/drawings/polygon/${id}`, data);
      return true;
    } catch (error) {
      console.error('Error updating polygon drawing:', error);
      return false;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await apiService.delete(`/drawings/polygon/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting polygon drawing:', error);
      return false;
    }
  }
}

// ==================== CIRCLE DRAWING APIs ====================

class CircleDrawingService {
  async getAll(filters?: GISToolsFilters): Promise<CircleDrawing[]> {
    try {
      const params: Record<string, any> = {};

      if (filters?.userId && filters.userId !== 'me' && filters.userId !== 'all') {
        params.userId = filters.userId;
      }
      if (filters?.regionId) params.regionId = filters.regionId;

      const response = await apiService.get<{ success: boolean; circles: CircleDrawing[] }>(
        '/drawings/circle',
        { params }
      );

      return response.data.circles || [];
    } catch (error) {
      console.error('Error fetching circle drawings:', error);
      return [];
    }
  }

  async getById(id: number): Promise<CircleDrawing | null> {
    try {
      const response = await apiService.get<{ success: boolean; circle: CircleDrawing }>(
        `/drawings/circle/${id}`
      );
      return response.data.circle || null;
    } catch (error) {
      console.error('Error fetching circle drawing:', error);
      return null;
    }
  }

  async create(data: Partial<CircleDrawing>): Promise<CircleDrawing | null> {
    try {
      const response = await apiService.post<{ success: boolean; circle: CircleDrawing }>(
        '/drawings/circle',
        {
          circle_name: data.circle_name,
          center_lat: data.center_lat,
          center_lng: data.center_lng,
          radius: data.radius,
          fill_color: data.fill_color,
          stroke_color: data.stroke_color,
          opacity: data.opacity,
          region_id: data.region_id,
          properties: data.properties,
          notes: data.notes,
          is_saved: true
        }
      );
      return response.data.circle || null;
    } catch (error) {
      console.error('Error creating circle drawing:', error);
      throw error;
    }
  }

  async update(id: number, data: Partial<CircleDrawing>): Promise<boolean> {
    try {
      await apiService.put(`/drawings/circle/${id}`, data);
      return true;
    } catch (error) {
      console.error('Error updating circle drawing:', error);
      return false;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await apiService.delete(`/drawings/circle/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting circle drawing:', error);
      return false;
    }
  }
}

// ==================== SECTOR RF APIs ====================

class SectorRFService {
  async getAll(filters?: GISToolsFilters): Promise<SectorRF[]> {
    try {
      const params: Record<string, any> = {};

      if (filters?.userId && filters.userId !== 'me' && filters.userId !== 'all') {
        params.userId = filters.userId;
      }
      if (filters?.regionId) params.regionId = filters.regionId;

      const response = await apiService.get<{ success: boolean; sectors: SectorRF[] }>(
        '/rf/sectors',
        { params }
      );

      return response.data.sectors || [];
    } catch (error) {
      console.error('Error fetching RF sectors:', error);
      return [];
    }
  }

  async getById(id: number): Promise<SectorRF | null> {
    try {
      const response = await apiService.get<{ success: boolean; sector: SectorRF }>(
        `/rf/sectors/${id}`
      );
      return response.data.sector || null;
    } catch (error) {
      console.error('Error fetching RF sector:', error);
      return null;
    }
  }

  async create(data: Partial<SectorRF>): Promise<SectorRF | null> {
    try {
      const response = await apiService.post<{ success: boolean; sector: SectorRF }>(
        '/rf/sectors',
        {
          sector_name: data.sector_name,
          tower_lat: data.tower_lat,
          tower_lng: data.tower_lng,
          azimuth: data.azimuth,
          beamwidth: data.beamwidth,
          radius: data.radius,
          frequency: data.frequency,
          power: data.power,
          antenna_height: data.antenna_height,
          antenna_type: data.antenna_type,
          fill_color: data.fill_color,
          stroke_color: data.stroke_color,
          opacity: data.opacity,
          region_id: data.region_id,
          properties: data.properties,
          notes: data.notes,
          is_saved: true
        }
      );
      return response.data.sector || null;
    } catch (error) {
      console.error('Error creating RF sector:', error);
      throw error;
    }
  }

  async update(id: number, data: Partial<SectorRF>): Promise<boolean> {
    try {
      await apiService.put(`/rf/sectors/${id}`, data);
      return true;
    } catch (error) {
      console.error('Error updating RF sector:', error);
      return false;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await apiService.delete(`/rf/sectors/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting RF sector:', error);
      return false;
    }
  }

  async calculateCoverage(id: number): Promise<any> {
    try {
      const response = await apiService.post(`/rf/sectors/${id}/calculate`);
      return response.data;
    } catch (error) {
      console.error('Error calculating RF coverage:', error);
      return null;
    }
  }
}

// ==================== ELEVATION PROFILE APIs ====================

class ElevationProfileService {
  async getAll(filters?: GISToolsFilters): Promise<ElevationProfile[]> {
    try {
      const params: Record<string, any> = {};

      if (filters?.userId && filters.userId !== 'me' && filters.userId !== 'all') {
        params.userId = filters.userId;
      }
      if (filters?.regionId) params.regionId = filters.regionId;

      const response = await apiService.get<{ success: boolean; profiles: ElevationProfile[] }>(
        '/elevation',
        { params }
      );

      return response.data.profiles || [];
    } catch (error) {
      console.error('Error fetching elevation profiles:', error);
      return [];
    }
  }

  async getById(id: number): Promise<ElevationProfile | null> {
    try {
      const response = await apiService.get<{ success: boolean; profile: ElevationProfile }>(
        `/elevation/${id}`
      );
      return response.data.profile || null;
    } catch (error) {
      console.error('Error fetching elevation profile:', error);
      return null;
    }
  }

  async create(data: Partial<ElevationProfile>): Promise<ElevationProfile | null> {
    try {
      const response = await apiService.post<{ success: boolean; profile: ElevationProfile }>(
        '/elevation',
        {
          profile_name: data.profile_name,
          start_point: data.start_point,
          end_point: data.end_point,
          elevation_data: data.elevation_data,
          total_distance: data.total_distance,
          max_elevation: data.max_elevation,
          min_elevation: data.min_elevation,
          region_id: data.region_id,
          notes: data.notes,
          is_saved: true
        }
      );
      return response.data.profile || null;
    } catch (error) {
      console.error('Error creating elevation profile:', error);
      throw error;
    }
  }

  async update(id: number, data: Partial<ElevationProfile>): Promise<boolean> {
    try {
      await apiService.put(`/elevation/${id}`, data);
      return true;
    } catch (error) {
      console.error('Error updating elevation profile:', error);
      return false;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await apiService.delete(`/elevation/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting elevation profile:', error);
      return false;
    }
  }
}

// ==================== COMBINED GIS TOOLS SERVICE ====================

class GISToolsService {
  distanceMeasurements = new DistanceMeasurementService();
  polygonDrawings = new PolygonDrawingService();
  circleDrawings = new CircleDrawingService();
  sectorRF = new SectorRFService();
  elevationProfiles = new ElevationProfileService();

  /**
   * Get all GIS data for a user (for Data Hub)
   * Admin/Manager can specify userId to see other users' data
   */
  async getAllUserData(filters?: GISToolsFilters) {
    try {
      const [distances, polygons, circles, sectors, elevations] = await Promise.all([
        this.distanceMeasurements.getAll(filters),
        this.polygonDrawings.getAll(filters),
        this.circleDrawings.getAll(filters),
        this.sectorRF.getAll(filters),
        this.elevationProfiles.getAll(filters)
      ]);

      return {
        distanceMeasurements: distances,
        polygonDrawings: polygons,
        circleDrawings: circles,
        sectorRF: sectors,
        elevationProfiles: elevations,
        total: distances.length + polygons.length + circles.length + sectors.length + elevations.length
      };
    } catch (error) {
      console.error('Error fetching all user GIS data:', error);
      return {
        distanceMeasurements: [],
        polygonDrawings: [],
        circleDrawings: [],
        sectorRF: [],
        elevationProfiles: [],
        total: 0
      };
    }
  }

  /**
   * Get summary statistics for Data Hub
   */
  async getStatistics(filters?: GISToolsFilters) {
    const data = await this.getAllUserData(filters);

    return {
      totalItems: data.total,
      distanceMeasurements: data.distanceMeasurements.length,
      polygonDrawings: data.polygonDrawings.length,
      circleDrawings: data.circleDrawings.length,
      sectorRF: data.sectorRF.length,
      elevationProfiles: data.elevationProfiles.length
    };
  }
}

// Export singleton instance
export const gisToolsService = new GISToolsService();

// Export individual services for direct access
export const distanceMeasurementService = gisToolsService.distanceMeasurements;
export const polygonDrawingService = gisToolsService.polygonDrawings;
export const circleDrawingService = gisToolsService.circleDrawings;
export const sectorRFService = gisToolsService.sectorRF;
export const elevationProfileService = gisToolsService.elevationProfiles;
