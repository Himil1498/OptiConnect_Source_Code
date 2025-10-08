/**
 * Phase 4: GIS Tools Type Definitions
 * Complete type system for all GIS tools
 */

// ===== 4.1 Distance Measurement Tool =====
export interface DistanceMeasurement {
  id: string;
  name: string;
  points: Array<{
    lat: number;
    lng: number;
    label: string; // A, B, C, etc.
  }>;
  totalDistance: number; // in meters
  segments: Array<{
    distance: number; // in meters
    from: string; // point label
    to: string; // point label
  }>;
  createdAt: Date;
  updatedAt: Date;
  streetViewEnabled: boolean;
  color?: string;
  description?: string;
}

// ===== 4.2 Polygon Drawing Tool =====
export interface PolygonData {
  id: string;
  name: string;
  vertices: Array<{
    lat: number;
    lng: number;
  }>;
  area: number; // in square meters
  perimeter: number; // in meters
  color: string;
  fillOpacity: number;
  strokeWeight: number;
  createdAt: Date;
  updatedAt: Date;
  description?: string;
}

// ===== 4.3 Radius (Circle) Drawing Tool =====
export interface CircleData {
  id: string;
  name: string;
  center: {
    lat: number;
    lng: number;
  };
  radius: number; // in meters
  perimeter: number; // in meters
  area: number; // in square meters
  color: string;
  fillOpacity: number;
  strokeWeight: number;
  createdAt: Date;
  updatedAt: Date;
  description?: string;
}

// ===== 4.4 Elevation Profile Tool =====
export interface ElevationProfile {
  id: string;
  name: string;
  points: Array<{
    lat: number;
    lng: number;
  }>;
  elevationData: Array<{
    elevation: number; // in meters
    resolution: number;
    location: {
      lat: number;
      lng: number;
    };
    distance: number; // from start point in meters
  }>;
  highPoint: {
    elevation: number;
    location: {
      lat: number;
      lng: number;
    };
  };
  lowPoint: {
    elevation: number;
    location: {
      lat: number;
      lng: number;
    };
  };
  totalDistance: number;
  elevationGain: number; // total ascent
  elevationLoss: number; // total descent
  graph: {
    type: 'line';
    data: any;
    options: any;
  };
  createdAt: Date;
  updatedAt: Date;
  description?: string;
}

// ===== 4.5 Sector RF Tool =====
export interface SectorRFData {
  id: string;
  name: string;
  center: {
    lat: number;
    lng: number;
  };
  radius: number; // in meters
  azimuth: number; // direction in degrees (0-360, 0 = North)
  beamwidth: number; // angle width in degrees (e.g., 30, 60, 90, 120)

  // Tower/Site information
  towerId?: string;
  towerName?: string;
  sectorName?: string; // e.g., "Sector A", "Alpha"

  // RF Technical Details
  frequency?: number; // in MHz
  bandwidth?: number; // in MHz
  technology?: '2G' | '3G' | '4G' | '5G' | 'Wi-Fi' | 'Other';
  antennaHeight?: number; // in meters
  transmitPower?: number; // in dBm
  gain?: number; // antenna gain in dBi
  tilt?: number; // mechanical/electrical tilt in degrees

  // Coverage area calculations
  area: number; // in square meters
  arcLength: number; // length of the arc in meters

  // Visualization
  color: string;
  fillOpacity: number;
  strokeWeight: number;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  description?: string;
  status?: 'Active' | 'Inactive' | 'Planned' | 'Testing';
}

// ===== 4.6 Infrastructure Management Tool =====
export type InfrastructureType = 'POP' | 'SubPOP';
export type InfrastructureSource = 'KML' | 'Manual';

export interface Infrastructure {
  id: string;
  type: InfrastructureType;
  name: string;
  uniqueId: string; // e.g., "POP.3mRVeZ" or "SUBPOP.4nKLpQ"
  networkId: string; // e.g., "BHARAT-POP.3mRVeZ"
  refCode?: string; // Reference Code
  coordinates: {
    lat: number;
    lng: number;
  };
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  contactName: string;
  contactNo: string;
  contactEmail?: string;

  // Rental Information
  isRented: boolean;
  rentAmount?: number;
  agreementDates?: {
    start: Date;
    end: Date;
  };
  landlordName?: string;
  landlordContact?: string;

  // Technical Details
  structureType: 'Tower' | 'Building' | 'Ground' | 'Rooftop' | 'Other';
  height?: number; // in meters
  upsAvailability: boolean;
  upsCapacity?: string;
  backupCapacity: string; // battery backup hours or KVA
  powerSource: 'Grid' | 'Solar' | 'Hybrid' | 'Generator';
  natureOfBusiness?: string; // e.g., "LBO", "Enterprise", etc.

  // Equipment Details
  equipmentList?: Array<{
    name: string;
    model: string;
    quantity: number;
    installDate?: Date;
  }>;

  // Connectivity
  connectedTo?: string[]; // IDs of connected POPs
  bandwidth?: string;

  // Metadata
  source: InfrastructureSource;
  kmlFileName?: string; // if from KML
  createdBy?: string;
  createdOn: Date;
  updatedOn: Date;
  status: 'Active' | 'Inactive' | 'Maintenance' | 'Planned' | 'RFS';
  notes?: string;
}

// ===== Tool State Management =====
export interface GISToolsState {
  distanceMeasurements: DistanceMeasurement[];
  polygons: PolygonData[];
  circles: CircleData[];
  elevationProfiles: ElevationProfile[];
  infrastructures: Infrastructure[];
  sectorRFs: SectorRFData[];

  // Active tool
  activeTool: GISToolType | null;

  // Selected items
  selectedItem: {
    type: GISToolType;
    id: string;
  } | null;
}

export type GISToolType =
  | 'distance'
  | 'polygon'
  | 'circle'
  | 'elevation'
  | 'infrastructure'
  | 'sectorRF'
  | 'none';

// ===== Tool Actions =====
export interface ToolAction {
  type: 'create' | 'edit' | 'delete' | 'view' | 'undo';
  toolType: GISToolType;
  data?: any;
}

// ===== KML Import =====
export interface KMLImportResult {
  success: boolean;
  itemsImported: number;
  errors: string[];
  infrastructures: Infrastructure[];
}

// ===== Filter Options =====
export interface InfrastructureFilters {
  type?: InfrastructureType;
  source?: InfrastructureSource;
  status?: Infrastructure['status'];
  state?: string;
  city?: string;
  searchTerm?: string;
}

// ===== Chart Configuration =====
export interface ChartConfig {
  type: 'line' | 'bar' | 'scatter';
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
      fill?: boolean;
    }>;
  };
  options: {
    responsive: boolean;
    maintainAspectRatio: boolean;
    scales?: any;
    plugins?: any;
  };
}

// ===== Export/Import =====
export interface GISToolsExport {
  version: string;
  exportDate: Date;
  distanceMeasurements: DistanceMeasurement[];
  polygons: PolygonData[];
  circles: CircleData[];
  elevationProfiles: ElevationProfile[];
  infrastructures: Infrastructure[];
}

// ===== Phase 5: Data Hub =====
export type DataHubEntryType = 'Distance' | 'Polygon' | 'Circle' | 'Elevation' | 'Infrastructure' | 'SectorRF';
export type DataHubSource = 'Manual' | 'Import';
export type ExportFormat = 'XLSX' | 'CSV' | 'KML' | 'KMZ' | 'JSON';

export interface DataHubEntry {
  id: string;
  type: DataHubEntryType;
  name: string;
  createdAt: Date;
  savedAt: Date;
  fileSize: number; // in bytes
  source: DataHubSource;
  data: DistanceMeasurement | PolygonData | CircleData | ElevationProfile | Infrastructure | SectorRFData;
  description?: string;
  tags?: string[];
}

export interface DataHubStats {
  totalEntries: number;
  totalSize: number; // in bytes
  byType: {
    Distance: number;
    Polygon: number;
    Circle: number;
    Elevation: number;
    Infrastructure: number;
    SectorRF: number;
  };
  bySource: {
    Manual: number;
    Import: number;
  };
}

export interface DataHubFilters {
  type?: DataHubEntryType;
  source?: DataHubSource;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
  tags?: string[];
}

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  selectedIds?: string[];
}

// ===== Undo/Redo History =====
export interface HistoryState {
  past: GISToolsState[];
  present: GISToolsState;
  future: GISToolsState[];
}

// ===== Tool Configuration =====
export interface ToolConfig {
  distanceMeasurement: {
    defaultColor: string;
    showLabels: boolean;
    streetViewEnabled: boolean;
    maxPoints: number;
  };
  polygon: {
    defaultColor: string;
    defaultFillOpacity: number;
    defaultStrokeWeight: number;
    minVertices: number;
  };
  circle: {
    defaultColor: string;
    defaultFillOpacity: number;
    defaultStrokeWeight: number;
    minRadius: number;
    maxRadius: number;
  };
  elevation: {
    samplePoints: number;
    chartHeight: number;
    showGrid: boolean;
  };
  infrastructure: {
    popIcon: string;
    subPopIcon: string;
    kmlPopIcon: string;
    kmlSubPopIcon: string;
  };
  sectorRF: {
    defaultColor: string;
    defaultFillOpacity: number;
    defaultStrokeWeight: number;
    defaultRadius: number; // in meters
    defaultBeamwidth: number; // in degrees
    minRadius: number;
    maxRadius: number;
    presetBeamwidths: number[]; // e.g., [30, 60, 90, 120, 180]
  };
}