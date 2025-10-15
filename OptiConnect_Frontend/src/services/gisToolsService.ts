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

      // Handle user filtering - send explicit filter parameter to backend
      if (filters?.userId !== undefined) {
        if (filters.userId === 'all') {
          params.filter = 'all'; // Backend will return ALL users' data
          console.log('🔍 Distance: Fetching ALL users data (filter=all)');
        } else if (filters.userId === 'me') {
          params.filter = 'me'; // Backend will return only current user's data
          console.log('🔍 Distance: Fetching MY data only (filter=me)');
        } else {
          params.filter = 'user'; // Backend will filter by specific userId
          params.userId = filters.userId;
          console.log('🔍 Distance: Fetching data for userId:', filters.userId, '(filter=user)');
        }
      }

      if (filters?.regionId) params.regionId = filters.regionId;
      if (filters?.page) params.page = filters.page;
      if (filters?.limit) params.limit = filters.limit;

      console.log('📤 Distance API request URL:', '/measurements/distance');
      console.log('📤 Distance API request params:', params);

      const response = await apiService.get<{ success: boolean; measurements: any[] }>(
        '/measurements/distance',
        { params }
      );

      const raw = response.data.measurements || [];
      // Normalize fields from backend (parse JSON strings)
      const measurements: DistanceMeasurement[] = raw.map((m: any) => ({
        ...m,
        points: typeof m.points === 'string' ? JSON.parse(m.points) : m.points,
        total_distance: Number(m.total_distance),
      }));

      console.log('📥 Distance API response:', {
        count: measurements.length,
        firstItem: measurements[0] || null
      });

      return measurements;
    } catch (error: any) {
      console.error('❌ Error fetching distance measurements:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
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

      // Handle user filtering - send explicit filter parameter to backend
      if (filters?.userId !== undefined) {
        if (filters.userId === 'all') {
          params.filter = 'all';
          console.log('🔍 Polygon: Fetching ALL users data (filter=all)');
        } else if (filters.userId === 'me') {
          params.filter = 'me';
          console.log('🔍 Polygon: Fetching MY data only (filter=me)');
        } else {
          params.filter = 'user';
          params.userId = filters.userId;
          console.log('🔍 Polygon: Fetching data for userId:', filters.userId, '(filter=user)');
        }
      }

      if (filters?.regionId) params.regionId = filters.regionId;

      console.log('📤 Polygon API request params:', params);

      const response = await apiService.get<{ success: boolean; polygons: any[] }>(
        '/drawings/polygon',
        { params }
      );

      const raw = response.data.polygons || [];
      const polygons: PolygonDrawing[] = raw.map((p: any) => ({
        ...p,
        coordinates: typeof p.coordinates === 'string' ? JSON.parse(p.coordinates) : p.coordinates,
        area: p.area !== null && p.area !== undefined ? Number(p.area) : undefined,
        perimeter: p.perimeter !== null && p.perimeter !== undefined ? Number(p.perimeter) : undefined,
      }));

      console.log('📥 Polygon API response count:', polygons.length);

      return polygons;
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

      // Handle user filtering - send explicit filter parameter to backend
      if (filters?.userId !== undefined) {
        if (filters.userId === 'all') {
          params.filter = 'all';
          console.log('🔍 Circle: Fetching ALL users data (filter=all)');
        } else if (filters.userId === 'me') {
          params.filter = 'me';
          console.log('🔍 Circle: Fetching MY data only (filter=me)');
        } else {
          params.filter = 'user';
          params.userId = filters.userId;
          console.log('🔍 Circle: Fetching data for userId:', filters.userId, '(filter=user)');
        }
      }

      if (filters?.regionId) params.regionId = filters.regionId;

      console.log('📤 Circle API request params:', params);

      const response = await apiService.get<{ success: boolean; circles: any[] }>(
        '/drawings/circle',
        { params }
      );

      const raw = response.data.circles || [];
      const circles: CircleDrawing[] = raw.map((c: any) => ({
        ...c,
        center_lat: Number(c.center_lat),
        center_lng: Number(c.center_lng),
        radius: Number(c.radius),
      }));

      console.log('📥 Circle API response count:', circles.length);

      return circles;
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

      // Handle user filtering - send explicit filter parameter to backend
      if (filters?.userId !== undefined) {
        if (filters.userId === 'all') {
          params.filter = 'all';
          console.log('🔍 SectorRF: Fetching ALL users data (filter=all)');
        } else if (filters.userId === 'me') {
          params.filter = 'me';
          console.log('🔍 SectorRF: Fetching MY data only (filter=me)');
        } else {
          params.filter = 'user';
          params.userId = filters.userId;
          console.log('🔍 SectorRF: Fetching data for userId:', filters.userId, '(filter=user)');
        }
      }

      if (filters?.regionId) params.regionId = filters.regionId;

      console.log('📤 SectorRF API request params:', params);

      const response = await apiService.get<{ success: boolean; sectors: any[] }>(
        '/rf/sectors',
        { params }
      );

      const raw = response.data.sectors || [];
      const sectors: SectorRF[] = raw.map((s: any) => ({
        ...s,
        tower_lat: Number(s.tower_lat),
        tower_lng: Number(s.tower_lng),
        azimuth: Number(s.azimuth),
        beamwidth: Number(s.beamwidth),
        radius: Number(s.radius),
        frequency: s.frequency !== null && s.frequency !== undefined ? Number(s.frequency) : s.frequency,
      }));

      console.log('📥 SectorRF API response count:', sectors.length);

      return sectors;
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

      // Handle user filtering - send explicit filter parameter to backend
      if (filters?.userId !== undefined) {
        if (filters.userId === 'all') {
          params.filter = 'all';
          console.log('🔍 Elevation: Fetching ALL users data (filter=all)');
        } else if (filters.userId === 'me') {
          params.filter = 'me';
          console.log('🔍 Elevation: Fetching MY data only (filter=me)');
        } else {
          params.filter = 'user';
          params.userId = filters.userId;
          console.log('🔍 Elevation: Fetching data for userId:', filters.userId, '(filter=user)');
        }
      }

      if (filters?.regionId) params.regionId = filters.regionId;

      console.log('📤 Elevation API request params:', params);

      const response = await apiService.get<{ success: boolean; profiles: any[] }>(
        '/elevation',
        { params }
      );

      const raw = response.data.profiles || [];
      const profiles: ElevationProfile[] = raw.map((p: any) => ({
        ...p,
        start_point: typeof p.start_point === 'string' ? JSON.parse(p.start_point) : p.start_point,
        end_point: typeof p.end_point === 'string' ? JSON.parse(p.end_point) : p.end_point,
        elevation_data: typeof p.elevation_data === 'string' ? JSON.parse(p.elevation_data) : p.elevation_data,
        total_distance: Number(p.total_distance),
        max_elevation: Number(p.max_elevation),
        min_elevation: Number(p.min_elevation),
      }));

      console.log('📥 Elevation API response:', {
        count: profiles.length,
        sample: profiles[0] || null
      });

      return profiles;
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
      console.log('📤 Creating elevation profile:', {
        profile_name: data.profile_name,
        total_distance: data.total_distance,
        max_elevation: data.max_elevation,
        min_elevation: data.min_elevation
      });

      const response = await apiService.post<{ success: boolean; profile: ElevationProfile }>(
        '/elevation/profiles', // Try alternate endpoint path
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

      console.log('✅ Elevation profile created successfully:', response.data);
      return response.data.profile || null;
    } catch (error: any) {
      console.error('❌ Error creating elevation profile:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        url: error.config?.url
      });

      // If 404, try fallback endpoint
      if (error.response?.status === 404) {
        try {
          console.log('🔄 Trying fallback endpoint: /elevation');
          const fallbackResponse = await apiService.post<{ success: boolean; profile: ElevationProfile }>(
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
          console.log('✅ Elevation profile created via fallback endpoint');
          return fallbackResponse.data.profile || null;
        } catch (fallbackError: any) {
          console.error('❌ Fallback endpoint also failed:', fallbackError.response?.data || fallbackError.message);
          throw new Error(`Backend endpoint not found. Please ensure the elevation profile API is properly configured. Error: ${fallbackError.response?.data?.message || fallbackError.message}`);
        }
      }

      throw new Error(error.response?.data?.message || 'Failed to save elevation profile to database');
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
   * Aggregated fetch via /datahub/all
   * Returns the same structure as getAllUserData but in a single request.
   */
  async getAllAggregated(filters?: GISToolsFilters) {
    try {
      const params: Record<string, any> = {};
      if (filters?.userId !== undefined) {
        if (filters.userId === 'all') {
          params.filter = 'all';
        } else if (filters.userId === 'me') {
          // no explicit filter needed; backend defaults to current user
        } else {
          params.filter = 'user';
          params.userId = filters.userId;
        }
      }
      if (filters?.regionId) params.regionId = filters.regionId;

      const resp = await apiService.get<{ success: boolean; data: any[] }>(
        '/datahub/all',
        { params }
      );

      const items = resp.data.data || [];

      const distanceMeasurements: DistanceMeasurement[] = [];
      const polygonDrawings: PolygonDrawing[] = [];
      const circleDrawings: CircleDrawing[] = [];
      const sectorRF: SectorRF[] = [];
      const elevationProfiles: ElevationProfile[] = [];

      items.forEach((item: any) => {
        const type = item.type || item.Type || '';
        switch (type) {
          case 'Distance':
            distanceMeasurements.push({
              ...item,
              points: typeof item.points === 'string' ? JSON.parse(item.points) : item.points,
              total_distance: Number(item.total_distance),
            });
            break;
          case 'Polygon':
            polygonDrawings.push({
              ...item,
              coordinates: typeof item.coordinates === 'string' ? JSON.parse(item.coordinates) : item.coordinates,
              area: item.area !== null && item.area !== undefined ? Number(item.area) : undefined,
              perimeter: item.perimeter !== null && item.perimeter !== undefined ? Number(item.perimeter) : undefined,
            });
            break;
          case 'Circle':
            circleDrawings.push({
              ...item,
              center_lat: Number(item.center_lat),
              center_lng: Number(item.center_lng),
              radius: Number(item.radius),
            });
            break;
          case 'SectorRF':
            sectorRF.push({
              ...item,
              tower_lat: Number(item.tower_lat),
              tower_lng: Number(item.tower_lng),
              azimuth: Number(item.azimuth),
              beamwidth: Number(item.beamwidth),
              radius: Number(item.radius),
              frequency: item.frequency !== null && item.frequency !== undefined ? Number(item.frequency) : item.frequency,
            });
            break;
          case 'Elevation':
            elevationProfiles.push({
              ...item,
              start_point: typeof item.start_point === 'string' ? JSON.parse(item.start_point) : item.start_point,
              end_point: typeof item.end_point === 'string' ? JSON.parse(item.end_point) : item.end_point,
              elevation_data: typeof item.elevation_data === 'string' ? JSON.parse(item.elevation_data) : item.elevation_data,
              total_distance: Number(item.total_distance),
              max_elevation: Number(item.max_elevation),
              min_elevation: Number(item.min_elevation),
            });
            break;
          case 'Infrastructure':
            // Not displayed on current Data Hub page sections, but keep mapping in case needed
            break;
          default:
            break;
        }
      });

      return {
        distanceMeasurements,
        polygonDrawings,
        circleDrawings,
        sectorRF,
        elevationProfiles,
        total: distanceMeasurements.length + polygonDrawings.length + circleDrawings.length + sectorRF.length + elevationProfiles.length
      };
    } catch (error) {
      console.error('Error fetching aggregated GIS data:', error);
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
