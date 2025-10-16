import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store';
import UserFilterControl from '../components/common/UserFilterControl';
import { gisToolsService } from '../services/gisToolsService';
import { apiService } from '../services/apiService';
import { getUserAssignedRegionsSync, detectStateFromCoordinates } from '../utils/regionMapping';
import type {
  DistanceMeasurement,
  PolygonDrawing,
  CircleDrawing,
  SectorRF,
  ElevationProfile
} from '../services/gisToolsService';

/**
 * GIS Data Hub - Enhanced Version with Backend Integration
 * Centralized view of all GIS tool data with user filtering
 */
const GISDataHub: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<number | 'all' | 'me'>('me');
  const [activeTab, setActiveTab] = useState<'all' | 'distance' | 'polygon' | 'circle' | 'sector' | 'elevation' | 'infrastructure'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Data states
  const [distanceMeasurements, setDistanceMeasurements] = useState<DistanceMeasurement[]>([]);
  const [polygonDrawings, setPolygonDrawings] = useState<PolygonDrawing[]>([]);
  const [circleDrawings, setCircleDrawings] = useState<CircleDrawing[]>([]);
  const [sectorRF, setSectorRF] = useState<SectorRF[]>([]);
  const [elevationProfiles, setElevationProfiles] = useState<ElevationProfile[]>([]);
  const [infrastructureItems, setInfrastructureItems] = useState<any[]>([]);

  // Modal states
  const [viewDetailsModal, setViewDetailsModal] = useState<{ isOpen: boolean; data: any; type: string }>({
    isOpen: false,
    data: null,
    type: ''
  });
  const [editModal, setEditModal] = useState<{ isOpen: boolean; data: any; type: string }>({
    isOpen: false,
    data: null,
    type: ''
  });
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    type: string;
    id: number | null;
    itemName: string;
    userId?: number;
  }>({
    isOpen: false,
    type: '',
    id: null,
    itemName: '',
    userId: undefined
  });

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    distanceMeasurements: 0,
    polygonDrawings: 0,
    circleDrawings: 0,
    sectorRF: 0,
    elevationProfiles: 0,
    infrastructureItems: 0
  });

  // Load data when user filter changes
  useEffect(() => {
    loadData();
  }, [selectedUserId]);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔍 Loading GIS data with filter:', { selectedUserId, userInfo: user?.id });
      const filters = { userId: selectedUserId };
      // Use aggregated endpoint for single request instead of multiple parallel requests
      const data = await gisToolsService.getAllAggregated(filters);

      console.log('📊 Received GIS data:', {
        total: data.total,
        distanceMeasurements: data.distanceMeasurements.length,
        polygonDrawings: data.polygonDrawings.length,
        circleDrawings: data.circleDrawings.length,
        sectorRF: data.sectorRF.length,
        elevationProfiles: data.elevationProfiles.length,
        sampleData: data.distanceMeasurements[0] || data.polygonDrawings[0] || data.circleDrawings[0] || 'No data'
      });

      setDistanceMeasurements(data.distanceMeasurements);
      setPolygonDrawings(data.polygonDrawings);
      setCircleDrawings(data.circleDrawings);
      setSectorRF(data.sectorRF);
      setElevationProfiles(data.elevationProfiles);

      // Load infrastructure data separately
      // NOTE: Infrastructure API doesn't support user filtering at backend level
      // We fetch all data and apply client-side region filtering below
      let infrastructureData: any[] = [];
      try {
        console.log('🏗️ Infrastructure: Fetching all infrastructure data (will apply region filtering)');
        const rawInfraData = await apiService.getAllInfrastructure();
        console.log('🏗️ Loaded infrastructure items:', rawInfraData.length);

        // ✅ REGION FILTERING FIX: Filter by user's assigned regions
        const assignedRegions = getUserAssignedRegionsSync(user);

        if (user?.role === 'Admin' || assignedRegions.length === 0) {
          // Admin sees all infrastructure
          console.log('👑 GISDataHub: Admin user - showing all infrastructure');
          infrastructureData = rawInfraData;
        } else {
          // Filter by user's assigned regions
          console.log(`🔍 GISDataHub: Filtering infrastructure by assigned regions: ${assignedRegions.join(', ')}`);

          infrastructureData = rawInfraData.filter((infra: any) => {
            // Detect which region this infrastructure belongs to
            const infraRegion = detectStateFromCoordinates(
              parseFloat(infra.latitude),
              parseFloat(infra.longitude)
            );

            if (!infraRegion) {
              console.warn(`⚠️ Could not detect region for infrastructure: ${infra.item_name} at (${infra.latitude}, ${infra.longitude})`);
              return false; // Exclude if region cannot be determined
            }

            // Check if infrastructure's region matches any assigned region
            const normalizeRegion = (r: string) => r.trim().toLowerCase();
            const isInAssignedRegion = assignedRegions.some(
              (assignedRegion) => {
                const normalizedAssigned = normalizeRegion(assignedRegion);
                const normalizedInfra = normalizeRegion(infraRegion);
                return (
                  normalizedAssigned === normalizedInfra ||
                  normalizedAssigned.includes(normalizedInfra) ||
                  normalizedInfra.includes(normalizedAssigned)
                );
              }
            );

            return isInAssignedRegion;
          });

          console.log(`✅ GISDataHub: Filtered to ${infrastructureData.length} infrastructure items (from ${rawInfraData.length} total)`);
        }
      } catch (infraError) {
        console.warn('Failed to load infrastructure data:', infraError);
      }
      setInfrastructureItems(infrastructureData);

      setStats({
        total: data.total + infrastructureData.length,
        distanceMeasurements: data.distanceMeasurements.length,
        polygonDrawings: data.polygonDrawings.length,
        circleDrawings: data.circleDrawings.length,
        sectorRF: data.sectorRF.length,
        elevationProfiles: data.elevationProfiles.length,
        infrastructureItems: infrastructureData.length
      });
    } catch (error) {
      console.error('Error loading GIS data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if user can edit/delete (only own data)
  const canEditDelete = (itemUserId?: number) => {
    if (!user?.id) return false;
    const currentUserId = parseInt(user.id.replace('OCGID', ''));
    return itemUserId === currentUserId;
  };

  const handleViewDetails = (data: any, type: string) => {
    setViewDetailsModal({ isOpen: true, data, type });
  };

  const handleViewOnMap = (data: any, type: string) => {
    // Store data in sessionStorage to be picked up by Map page
    sessionStorage.setItem('viewOnMapData', JSON.stringify({ data, type }));
    // Navigate to map page
    navigate('/map');
  };

  const handleEdit = (data: any, type: string) => {
    setEditModal({ isOpen: true, data, type });
  };

  const handleSaveEdit = async () => {
    if (!editModal.data || !editModal.type) return;

    try {
      let success = false;
      const id = editModal.data.id;

      switch (editModal.type) {
        case 'distance':
          success = await gisToolsService.distanceMeasurements.update(id, editModal.data);
          break;
        case 'polygon':
          success = await gisToolsService.polygonDrawings.update(id, editModal.data);
          break;
        case 'circle':
          success = await gisToolsService.circleDrawings.update(id, editModal.data);
          break;
        case 'sector':
          success = await gisToolsService.sectorRF.update(id, editModal.data);
          break;
        case 'elevation':
          success = await gisToolsService.elevationProfiles.update(id, editModal.data);
          break;
      }

      if (success) {
        alert('Item updated successfully!');
        setEditModal({ isOpen: false, data: null, type: '' });
        loadData();
      } else {
        alert('Failed to update item');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Error updating item');
    }
  };

  const handleDeleteClick = (type: string, id: number, itemName: string, itemUserId?: number) => {
    if (!canEditDelete(itemUserId)) {
      alert('You can only delete your own data!');
      return;
    }

    // Open confirmation modal
    setDeleteConfirmModal({
      isOpen: true,
      type,
      id,
      itemName,
      userId: itemUserId
    });
  };

  const handleConfirmDelete = async () => {
    const { type, id, userId: itemUserId } = deleteConfirmModal;

    if (!id) return;

    try {
      let success = false;

      switch (type) {
        case 'distance':
          success = await gisToolsService.distanceMeasurements.delete(id);
          break;
        case 'polygon':
          success = await gisToolsService.polygonDrawings.delete(id);
          break;
        case 'circle':
          success = await gisToolsService.circleDrawings.delete(id);
          break;
        case 'sector':
          success = await gisToolsService.sectorRF.delete(id);
          break;
        case 'elevation':
          success = await gisToolsService.elevationProfiles.delete(id);
          break;
        case 'infrastructure':
          await apiService.deleteInfrastructure(id);
          success = true;
          break;
      }

      if (success) {
        // Close modal and reload data - NO alert
        setDeleteConfirmModal({ isOpen: false, type: '', id: null, itemName: '', userId: undefined });
        loadData(); // Reload data
      } else {
        alert('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDistance = (meters: number | string | null | undefined): string => {
    const m = Number(meters);
    if (!Number.isFinite(m)) return 'N/A';
    if (m < 1000) {
      return `${m.toFixed(2)} m`;
    }
    return `${(m / 1000).toFixed(2)} km`;
  };

  const formatArea = (sqMeters: number | string | null | undefined): string => {
    const s = Number(sqMeters);
    if (!Number.isFinite(s)) return 'N/A';
    if (s < 1000000) {
      return `${s.toFixed(2)} m²`;
    }
    return `${(s / 1000000).toFixed(2)} km²`;
  };

  // Helper to render username badge when viewing all users' data
  const renderUserBadge = (username?: string) => {
    if (!username || selectedUserId === 'me') return null;
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
        {username}
      </span>
    );
  };

  // Filter items based on search term
  const filterItems = <T extends Record<string, any>>(items: T[], nameField: string): T[] => {
    if (!searchTerm.trim()) return items;

    const searchLower = searchTerm.toLowerCase().trim();
    return items.filter((item) => {
      const name = (item[nameField] || '').toString().toLowerCase();
      const notes = (item.notes || '').toString().toLowerCase();
      const username = (item.username || '').toString().toLowerCase();

      // Search in name, notes, and username
      return name.includes(searchLower) || notes.includes(searchLower) || username.includes(searchLower);
    });
  };

  // Apply filtering to all data types
  const filteredDistanceMeasurements = filterItems(distanceMeasurements, 'measurement_name');
  const filteredPolygonDrawings = filterItems(polygonDrawings, 'polygon_name');
  const filteredCircleDrawings = filterItems(circleDrawings, 'circle_name');
  const filteredSectorRF = filterItems(sectorRF, 'sector_name');
  const filteredElevationProfiles = filterItems(elevationProfiles, 'profile_name');
  const filteredInfrastructureItems = filterItems(infrastructureItems, 'item_name');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                GIS Data Hub
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Centralized repository for all your GIS tool data
              </p>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Filters
              </h2>

              {/* User Filter Control */}
              <UserFilterControl
                onFilterChange={(userId) => setSelectedUserId(userId)}
                defaultValue="me"
                showLabel={true}
              />

              {/* Search Input */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                  <svg
                    className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 dark:text-gray-500"
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
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="Clear search"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Statistics
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Items:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {stats.total}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Distance:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {stats.distanceMeasurements}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Polygons:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {stats.polygonDrawings}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Circles:</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      {stats.circleDrawings}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">RF Sectors:</span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      {stats.sectorRF}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Elevation:</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {stats.elevationProfiles}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Infrastructure:</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {stats.infrastructureItems}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex -mb-px overflow-x-auto">
                  {[
                    { id: 'all', label: 'All Data', count: stats.total },
                    { id: 'distance', label: 'Distance', count: stats.distanceMeasurements },
                    { id: 'polygon', label: 'Polygons', count: stats.polygonDrawings },
                    { id: 'circle', label: 'Circles', count: stats.circleDrawings },
                    { id: 'sector', label: 'RF Sectors', count: stats.sectorRF },
                    { id: 'elevation', label: 'Elevation', count: stats.elevationProfiles },
                    { id: 'infrastructure', label: 'Infrastructure', count: stats.infrastructureItems }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`
                        whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm
                        ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }
                      `}
                    >
                      {tab.label}
                      <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 dark:bg-gray-700">
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Data Display */}
            <div className="space-y-4">
              {loading ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading data...</p>
                </div>
              ) : (
                <>
                  {/* Distance Measurements */}
                  {(activeTab === 'all' || activeTab === 'distance') &&
                    filteredDistanceMeasurements.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            📏 Distance Measurements ({filteredDistanceMeasurements.length})
                          </h3>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {filteredDistanceMeasurements.map((item) => (
                            <div key={item.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                                    <span>{item.measurement_name}</span>
                                    {renderUserBadge(item.username)}
                                  </h4>
                                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span>📍 {item.points?.length || 0} points</span>
                                    <span>📐 {formatDistance(item.total_distance)}</span>
                                    <span>🕐 {formatDate(item.created_at)}</span>
                                    {selectedUserId === 'me' ? (
                                      item.username && <span>👤 {item.username}</span>
                                    ) : null}
                                  </div>
                                  {item.notes && (
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                      {item.notes}
                                    </p>
                                  )}
                                </div>
                                <div className="ml-4 flex items-center space-x-2">
                                  <button
                                    onClick={() => handleViewDetails(item, 'distance')}
                                    className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded border border-blue-300 dark:border-blue-700"
                                    title="View Details"
                                  >
                                    📋 Details
                                  </button>
                                  <button
                                    onClick={() => handleViewOnMap(item, 'distance')}
                                    className="px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 rounded border border-green-300 dark:border-green-700"
                                    title="View on Map"
                                  >
                                    🗺️ Map
                                  </button>
                                  {canEditDelete(item.user_id) && (
                                    <>
                                      <button
                                        onClick={() => handleEdit(item, 'distance')}
                                        className="px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20 rounded border border-amber-300 dark:border-amber-700"
                                        title="Edit"
                                      >
                                        ✏️ Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteClick('distance', item.id!, item.measurement_name, item.user_id)}
                                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded border border-red-300 dark:border-red-700"
                                        title="Delete"
                                      >
                                        🗑️ Delete
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Polygon Drawings */}
                  {(activeTab === 'all' || activeTab === 'polygon') &&
                    filteredPolygonDrawings.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            ▭ Polygon Drawings ({filteredPolygonDrawings.length})
                          </h3>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {filteredPolygonDrawings.map((item) => (
                            <div key={item.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                                    <span>{item.polygon_name}</span>
                                    {renderUserBadge(item.username)}
                                  </h4>
                                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span>📍 {item.coordinates?.length || 0} vertices</span>
                                    {item.area && <span>📐 {formatArea(item.area)}</span>}
                                    <span
                                      className="inline-block w-4 h-4 rounded"
                                      style={{ backgroundColor: item.fill_color }}
                                      title={`Color: ${item.fill_color}`}
                                    ></span>
                                    <span>🕐 {formatDate(item.created_at)}</span>
                                    {item.username && <span>👤 {item.username}</span>}
                                  </div>
                                </div>
                                <div className="ml-4 flex items-center space-x-2">
                                  <button
                                    onClick={() => handleViewDetails(item, 'polygon')}
                                    className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded border border-blue-300 dark:border-blue-700"
                                  >
                                    📋 Details
                                  </button>
                                  <button
                                    onClick={() => handleViewOnMap(item, 'polygon')}
                                    className="px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 rounded border border-green-300 dark:border-green-700"
                                  >
                                    🗺️ Map
                                  </button>
                                  {canEditDelete(item.user_id) && (
                                    <>
                                      <button
                                        onClick={() => handleEdit(item, 'polygon')}
                                        className="px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20 rounded border border-amber-300 dark:border-amber-700"
                                      >
                                        ✏️ Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteClick('polygon', item.id!, item.polygon_name, item.user_id)}
                                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded border border-red-300 dark:border-red-700"
                                      >
                                        🗑️ Delete
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Circle Drawings */}
                  {(activeTab === 'all' || activeTab === 'circle') &&
                    filteredCircleDrawings.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            ⭕ Circle Drawings ({filteredCircleDrawings.length})
                          </h3>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {filteredCircleDrawings.map((item) => (
                            <div key={item.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                                    <span>{item.circle_name}</span>
                                    {renderUserBadge(item.username)}
                                  </h4>
                                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span>📍 ({Number(item.center_lat).toFixed(4)}, {Number(item.center_lng).toFixed(4)})</span>
                                    <span>📏 Radius: {formatDistance(item.radius)}</span>
                                    <span
                                      className="inline-block w-4 h-4 rounded-full"
                                      style={{ backgroundColor: item.fill_color }}
                                    ></span>
                                    <span>🕐 {formatDate(item.created_at)}</span>
                                    {selectedUserId === 'me' ? (item.username && <span>👤 {item.username}</span>) : null}
                                  </div>
                                </div>
                                <div className="ml-4 flex items-center space-x-2">
                                  <button
                                    onClick={() => handleViewDetails(item, 'circle')}
                                    className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded border border-blue-300 dark:border-blue-700"
                                  >
                                    📋 Details
                                  </button>
                                  <button
                                    onClick={() => handleViewOnMap(item, 'circle')}
                                    className="px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 rounded border border-green-300 dark:border-green-700"
                                  >
                                    🗺️ Map
                                  </button>
                                  {canEditDelete(item.user_id) && (
                                    <>
                                      <button
                                        onClick={() => handleEdit(item, 'circle')}
                                        className="px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20 rounded border border-amber-300 dark:border-amber-700"
                                      >
                                        ✏️ Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteClick('circle', item.id!, item.circle_name, item.user_id)}
                                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded border border-red-300 dark:border-red-700"
                                      >
                                        🗑️ Delete
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* RF Sectors */}
                  {(activeTab === 'all' || activeTab === 'sector') && filteredSectorRF.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          📡 RF Sectors ({filteredSectorRF.length})
                        </h3>
                      </div>
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredSectorRF.map((item) => (
                          <div key={item.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                                    <span>{item.sector_name}</span>
                                    {renderUserBadge(item.username)}
                                  </h4>
                                <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                  <span>📍 ({Number(item.tower_lat).toFixed(4)}, {Number(item.tower_lng).toFixed(4)})</span>
                                  <span>🔆 Azimuth: {item.azimuth}°</span>
                                  <span>📐 Beamwidth: {item.beamwidth}°</span>
                                  <span>📏 {formatDistance(item.radius)}</span>
                                  <span>📻 {item.frequency} MHz</span>
                                  <span>🕐 {formatDate(item.created_at)}</span>
                                  {selectedUserId === 'me' ? (item.username && <span>👤 {item.username}</span>) : null}
                                </div>
                              </div>
                              <div className="ml-4 flex items-center space-x-2">
                                <button
                                  onClick={() => handleViewDetails(item, 'sector')}
                                  className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded border border-blue-300 dark:border-blue-700"
                                >
                                  📋 Details
                                </button>
                                <button
                                  onClick={() => handleViewOnMap(item, 'sector')}
                                  className="px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 rounded border border-green-300 dark:border-green-700"
                                >
                                  🗺️ Map
                                </button>
                                {canEditDelete(item.user_id) && (
                                  <>
                                    <button
                                      onClick={() => handleEdit(item, 'sector')}
                                      className="px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20 rounded border border-amber-300 dark:border-amber-700"
                                    >
                                      ✏️ Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteClick('sector', item.id!, item.sector_name, item.user_id)}
                                      className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded border border-red-300 dark:border-red-700"
                                    >
                                      🗑️ Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Elevation Profiles */}
                  {(activeTab === 'all' || activeTab === 'elevation') &&
                    filteredElevationProfiles.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            ⛰️ Elevation Profiles ({filteredElevationProfiles.length})
                          </h3>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {filteredElevationProfiles.map((item) => (
                            <div key={item.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                                    <span>{item.profile_name}</span>
                                    {renderUserBadge(item.username)}
                                  </h4>
                                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span>📏 {formatDistance(item.total_distance)}</span>
                                    <span>⬆️ Max: {item.max_elevation}m</span>
                                    <span>⬇️ Min: {item.min_elevation}m</span>
                                    <span>🕐 {formatDate(item.created_at)}</span>
                                    {item.username && <span>👤 {item.username}</span>}
                                  </div>
                                </div>
                                <div className="ml-4 flex items-center space-x-2">
                                  <button
                                    onClick={() => handleViewDetails(item, 'elevation')}
                                    className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded border border-blue-300 dark:border-blue-700"
                                  >
                                    📋 Details
                                  </button>
                                  <button
                                    onClick={() => handleViewOnMap(item, 'elevation')}
                                    className="px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 rounded border border-green-300 dark:border-green-700"
                                  >
                                    🗺️ Map
                                  </button>
                                  {canEditDelete(item.user_id) && (
                                    <>
                                      <button
                                        onClick={() => handleEdit(item, 'elevation')}
                                        className="px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20 rounded border border-amber-300 dark:border-amber-700"
                                      >
                                        ✏️ Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteClick('elevation', item.id!, item.profile_name, item.user_id)}
                                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded border border-red-300 dark:border-red-700"
                                      >
                                        🗑️ Delete
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Infrastructure Items */}
                  {(activeTab === 'all' || activeTab === 'infrastructure') &&
                    filteredInfrastructureItems.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            🏗️ Infrastructure Items ({filteredInfrastructureItems.length})
                          </h3>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {filteredInfrastructureItems.map((item) => (
                            <div key={item.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                                    <span>{item.item_name}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                      item.item_type === 'POP' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100' :
                                      item.item_type === 'SubPOP' ? 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100' :
                                      item.item_type === 'Tower' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' :
                                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                                    }`}>
                                      {item.item_type}
                                    </span>
                                    {renderUserBadge(item.username)}
                                  </h4>
                                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span>📍 ({Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)})</span>
                                    <span>🔖 {item.unique_id}</span>
                                    {item.status && (
                                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                        item.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                                        item.status === 'Inactive' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100' :
                                        item.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                                        'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                                      }`}>
                                        {item.status}
                                      </span>
                                    )}
                                    {item.source && (
                                      <span className="text-xs">📥 {item.source}</span>
                                    )}
                                    <span>🕐 {formatDate(item.created_at)}</span>
                                  </div>
                                  {item.address_city && (
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                      📍 {item.address_city}{item.address_state ? `, ${item.address_state}` : ''}
                                    </p>
                                  )}
                                </div>
                                <div className="ml-4 flex items-center space-x-2">
                                  <button
                                    onClick={() => handleViewDetails(item, 'infrastructure')}
                                    className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded border border-blue-300 dark:border-blue-700"
                                  >
                                    📋 Details
                                  </button>
                                  <button
                                    onClick={() => handleViewOnMap(item, 'infrastructure')}
                                    className="px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 rounded border border-green-300 dark:border-green-700"
                                  >
                                    🗺️ Map
                                  </button>
                                  {(user?.role === 'Admin' || user?.role === 'Manager' || canEditDelete(item.user_id)) && (
                                    <button
                                      onClick={() => handleDeleteClick('infrastructure', item.id!, item.item_name, item.user_id)}
                                      className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded border border-red-300 dark:border-red-700"
                                      title="Delete"
                                    >
                                      🗑️ Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Empty State */}
                  {stats.total === 0 && !loading && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                        No data found
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Get started by using the GIS tools on the map to create measurements and drawings.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View Details Modal */}
      {viewDetailsModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                📋 {viewDetailsModal.type.charAt(0).toUpperCase() + viewDetailsModal.type.slice(1)} Details
              </h2>
              <button
                onClick={() => setViewDetailsModal({ isOpen: false, data: null, type: '' })}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-6">
              {/* Distance Details */}
              {viewDetailsModal.type === 'distance' && (() => {
                const data = viewDetailsModal.data;
                return (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">📏 Basic Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Measurement Name</p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">{data.measurement_name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Distance</p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">{formatDistance(data.total_distance)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Number of Points</p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">{data.points?.length || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Created</p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">{formatDate(data.created_at)}</p>
                        </div>
                        {data.username && (
                          <div className="col-span-2">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Created By</p>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">👤 {data.username}</p>
                          </div>
                        )}
                      </div>
                      {data.notes && (
                        <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{data.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Coordinates */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">📍 Coordinates</h3>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
                        {data.points && data.points.map((point: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Point {idx + 1}</span>
                            <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                              {Number(point.lat).toFixed(6)}, {Number(point.lng).toFixed(6)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Technical Properties */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">⚙️ Technical Properties</h3>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">ID:</span>
                            <span className="ml-2 font-mono text-gray-900 dark:text-white">{data.id}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">User ID:</span>
                            <span className="ml-2 font-mono text-gray-900 dark:text-white">{data.user_id}</span>
                          </div>
                          {data.region_id && (
                            <div className="col-span-2">
                              <span className="text-gray-600 dark:text-gray-400">Region ID:</span>
                              <span className="ml-2 font-mono text-gray-900 dark:text-white">{data.region_id}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Polygon Details */}
              {viewDetailsModal.type === 'polygon' && (() => {
                const data = viewDetailsModal.data;
                return (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                      <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3">▭ Basic Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Polygon Name</p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">{data.polygon_name}</p>
                        </div>
                        {data.area && (
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Area</p>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">{formatArea(data.area)}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Vertices</p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">{data.coordinates?.length || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Created</p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">{formatDate(data.created_at)}</p>
                        </div>
                        {data.username && (
                          <div className="col-span-2">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Created By</p>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">👤 {data.username}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Styling */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">🎨 Styling</h3>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Fill Color</p>
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 rounded border-2 border-gray-300 dark:border-gray-600" style={{ backgroundColor: data.fill_color }}></div>
                              <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{data.fill_color}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Stroke Color</p>
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 rounded border-2" style={{ backgroundColor: data.stroke_color }}></div>
                              <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{data.stroke_color}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Opacity</p>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">{(Number(data.opacity) * 100).toFixed(0)}%</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Stroke Weight</p>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">{data.stroke_weight}px</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Coordinates */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">📍 Coordinates</h3>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
                        {data.coordinates && data.coordinates.map((coord: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Vertex {idx + 1}</span>
                            <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                              {Number(coord.lat).toFixed(6)}, {Number(coord.lng).toFixed(6)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Technical Properties */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">⚙️ Technical Properties</h3>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">ID:</span>
                            <span className="ml-2 font-mono text-gray-900 dark:text-white">{data.id}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">User ID:</span>
                            <span className="ml-2 font-mono text-gray-900 dark:text-white">{data.user_id}</span>
                          </div>
                          {data.region_id && (
                            <div className="col-span-2">
                              <span className="text-gray-600 dark:text-gray-400">Region ID:</span>
                              <span className="ml-2 font-mono text-gray-900 dark:text-white">{data.region_id}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Circle Details */}
              {viewDetailsModal.type === 'circle' && (() => {
                const data = viewDetailsModal.data;
                return (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                      <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3">⭕ Basic Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Circle Name</p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">{data.circle_name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Radius</p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">{formatDistance(data.radius)}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Center Coordinates</p>
                          <p className="text-base font-mono font-semibold text-gray-900 dark:text-white">
                            {Number(data.center_lat).toFixed(6)}, {Number(data.center_lng).toFixed(6)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Created</p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">{formatDate(data.created_at)}</p>
                        </div>
                        {data.username && (
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Created By</p>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">👤 {data.username}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Styling */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">🎨 Styling</h3>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Fill Color</p>
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 rounded-full border-2 border-gray-300 dark:border-gray-600" style={{ backgroundColor: data.fill_color }}></div>
                              <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{data.fill_color}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Stroke Color</p>
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 rounded-full border-2" style={{ backgroundColor: data.stroke_color }}></div>
                              <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{data.stroke_color}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Opacity</p>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">{(Number(data.opacity) * 100).toFixed(0)}%</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Stroke Weight</p>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">{data.stroke_weight}px</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Technical Properties */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">⚙️ Technical Properties</h3>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">ID:</span>
                            <span className="ml-2 font-mono text-gray-900 dark:text-white">{data.id}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">User ID:</span>
                            <span className="ml-2 font-mono text-gray-900 dark:text-white">{data.user_id}</span>
                          </div>
                          {data.region_id && (
                            <div className="col-span-2">
                              <span className="text-gray-600 dark:text-gray-400">Region ID:</span>
                              <span className="ml-2 font-mono text-gray-900 dark:text-white">{data.region_id}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Sector RF Details */}
              {viewDetailsModal.type === 'sector' && (() => {
                const data = viewDetailsModal.data;
                return (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                      <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-3">📡 Basic Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sector Name</p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">{data.sector_name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Radius</p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">{formatDistance(data.radius)}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tower Coordinates</p>
                          <p className="text-base font-mono font-semibold text-gray-900 dark:text-white">
                            {Number(data.tower_lat).toFixed(6)}, {Number(data.tower_lng).toFixed(6)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Created</p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">{formatDate(data.created_at)}</p>
                        </div>
                        {data.username && (
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Created By</p>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">👤 {data.username}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RF Configuration */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">📻 RF Configuration</h3>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Azimuth</p>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">{data.azimuth}°</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Beamwidth</p>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">{data.beamwidth}°</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Frequency</p>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">{data.frequency} MHz</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Technology</p>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">{data.technology || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Styling */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">🎨 Styling</h3>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Fill Color</p>
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 rounded border-2 border-gray-300 dark:border-gray-600" style={{ backgroundColor: data.fill_color }}></div>
                              <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{data.fill_color}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Opacity</p>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">{(Number(data.opacity) * 100).toFixed(0)}%</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Technical Properties */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">⚙️ Technical Properties</h3>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">ID:</span>
                            <span className="ml-2 font-mono text-gray-900 dark:text-white">{data.id}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">User ID:</span>
                            <span className="ml-2 font-mono text-gray-900 dark:text-white">{data.user_id}</span>
                          </div>
                          {data.region_id && (
                            <div className="col-span-2">
                              <span className="text-gray-600 dark:text-gray-400">Region ID:</span>
                              <span className="ml-2 font-mono text-gray-900 dark:text-white">{data.region_id}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Elevation Details */}
              {viewDetailsModal.type === 'elevation' && (() => {
                const data = viewDetailsModal.data;
                return (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                      <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-3">⛰️ Basic Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Profile Name</p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">{data.profile_name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Distance</p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">{formatDistance(data.total_distance)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Max Elevation</p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">{data.max_elevation}m</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Min Elevation</p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">{data.min_elevation}m</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Elevation Gain</p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">{data.elevation_gain || 'N/A'}m</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Created</p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">{formatDate(data.created_at)}</p>
                        </div>
                        {data.username && (
                          <div className="col-span-2">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Created By</p>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">👤 {data.username}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Elevation Data */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">📊 Elevation Data</h3>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
                        {data.elevation_data && data.elevation_data.length > 0 ? (
                          data.elevation_data.map((point: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Point {idx + 1}</span>
                              <div className="text-sm font-mono text-gray-600 dark:text-gray-400">
                                <span className="mr-4">{Number(point.lat).toFixed(6)}, {Number(point.lng).toFixed(6)}</span>
                                <span className="font-semibold text-red-600 dark:text-red-400">{point.elevation}m</span>
                                <span className="ml-4 text-gray-500 dark:text-gray-500">({Number(point.distance).toFixed(0)}m)</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No elevation data available</p>
                        )}
                      </div>
                    </div>

                    {/* Technical Properties */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">⚙️ Technical Properties</h3>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">ID:</span>
                            <span className="ml-2 font-mono text-gray-900 dark:text-white">{data.id}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">User ID:</span>
                            <span className="ml-2 font-mono text-gray-900 dark:text-white">{data.user_id}</span>
                          </div>
                          {data.region_id && (
                            <div className="col-span-2">
                              <span className="text-gray-600 dark:text-gray-400">Region ID:</span>
                              <span className="ml-2 font-mono text-gray-900 dark:text-white">{data.region_id}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Infrastructure Details */}
              {viewDetailsModal.type === 'infrastructure' && (() => {
                const data = viewDetailsModal.data;
                return (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
                      <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-3">🏗️ Basic Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Item Name</p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">{data.item_name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Type</p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">{data.item_type}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unique ID</p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">{data.unique_id}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">{data.status || 'N/A'}</p>
                        </div>
                        {data.network_id && (
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Network ID</p>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">{data.network_id}</p>
                          </div>
                        )}
                        {data.ref_code && (
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Reference Code</p>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">{data.ref_code}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Source</p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">{data.source || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Created</p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">{formatDate(data.created_at)}</p>
                        </div>
                        {data.username && (
                          <div className="col-span-2">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Created By</p>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">👤 {data.username}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">📍 Location</h3>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Latitude</p>
                            <p className="text-base font-mono font-semibold text-gray-900 dark:text-white">{Number(data.latitude).toFixed(6)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Longitude</p>
                            <p className="text-base font-mono font-semibold text-gray-900 dark:text-white">{Number(data.longitude).toFixed(6)}</p>
                          </div>
                          {data.height && (
                            <div className="col-span-2">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Height</p>
                              <p className="text-base font-semibold text-gray-900 dark:text-white">{data.height}m</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    {(data.address_street || data.address_city || data.address_state || data.address_pincode) && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">🏠 Address</h3>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {[data.address_street, data.address_city, data.address_state, data.address_pincode]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Contact Information */}
                    {(data.contact_name || data.contact_phone || data.contact_email) && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">📞 Contact</h3>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {data.contact_name && (
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Name:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">{data.contact_name}</span>
                              </div>
                            )}
                            {data.contact_phone && (
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">{data.contact_phone}</span>
                              </div>
                            )}
                            {data.contact_email && (
                              <div className="col-span-2">
                                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">{data.contact_email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Technical Details */}
                    {(data.structure_type || data.power_source || data.ups_availability || data.bandwidth) && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">⚙️ Technical Details</h3>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {data.structure_type && (
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Structure:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">{data.structure_type}</span>
                              </div>
                            )}
                            {data.power_source && (
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Power:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">{data.power_source}</span>
                              </div>
                            )}
                            {data.ups_availability !== undefined && (
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">UPS:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">{data.ups_availability ? 'Available' : 'Not Available'}</span>
                              </div>
                            )}
                            {data.ups_capacity && (
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">UPS Capacity:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">{data.ups_capacity}</span>
                              </div>
                            )}
                            {data.backup_capacity && (
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Backup:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">{data.backup_capacity}</span>
                              </div>
                            )}
                            {data.bandwidth && (
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Bandwidth:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">{data.bandwidth}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {data.notes && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">📝 Notes</h3>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{data.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end sticky bottom-0 bg-white dark:bg-gray-800">
              <button
                onClick={() => setViewDetailsModal({ isOpen: false, data: null, type: '' })}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                ✏️ Edit {editModal.type.charAt(0).toUpperCase() + editModal.type.slice(1)}
              </h2>
              <button
                onClick={() => setEditModal({ isOpen: false, data: null, type: '' })}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* Name field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={
                    editModal.type === 'distance' ? editModal.data?.measurement_name :
                    editModal.type === 'polygon' ? editModal.data?.polygon_name :
                    editModal.type === 'circle' ? editModal.data?.circle_name :
                    editModal.type === 'sector' ? editModal.data?.sector_name :
                    editModal.data?.profile_name || ''
                  }
                  onChange={(e) => {
                    const nameField =
                      editModal.type === 'distance' ? 'measurement_name' :
                      editModal.type === 'polygon' ? 'polygon_name' :
                      editModal.type === 'circle' ? 'circle_name' :
                      editModal.type === 'sector' ? 'sector_name' :
                      'profile_name';
                    setEditModal({
                      ...editModal,
                      data: { ...editModal.data, [nameField]: e.target.value }
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Notes field (for distance) */}
              {editModal.type === 'distance' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={editModal.data?.notes || ''}
                    onChange={(e) => setEditModal({
                      ...editModal,
                      data: { ...editModal.data, notes: e.target.value }
                    })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}

              {/* More fields can be added here for comprehensive editing */}
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end space-x-2">
              <button
                onClick={() => setEditModal({ isOpen: false, data: null, type: '' })}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <span className="text-red-600 dark:text-red-400 mr-2">⚠️</span>
                Confirm Delete
              </h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Are you sure you want to delete this item?
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {deleteConfirmModal.type.charAt(0).toUpperCase() + deleteConfirmModal.type.slice(1)}:
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {deleteConfirmModal.itemName}
                </p>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400 mt-4">
                ⚠️ This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmModal({ isOpen: false, type: '', id: null, itemName: '', userId: undefined })}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GISDataHub;
