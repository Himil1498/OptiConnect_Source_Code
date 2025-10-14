import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../store';
import UserFilterControl from '../components/common/UserFilterControl';
import { gisToolsService } from '../services/gisToolsService';
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
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<number | 'all' | 'me'>('me');
  const [activeTab, setActiveTab] = useState<'all' | 'distance' | 'polygon' | 'circle' | 'sector' | 'elevation'>('all');

  // Data states
  const [distanceMeasurements, setDistanceMeasurements] = useState<DistanceMeasurement[]>([]);
  const [polygonDrawings, setPolygonDrawings] = useState<PolygonDrawing[]>([]);
  const [circleDrawings, setCircleDrawings] = useState<CircleDrawing[]>([]);
  const [sectorRF, setSectorRF] = useState<SectorRF[]>([]);
  const [elevationProfiles, setElevationProfiles] = useState<ElevationProfile[]>([]);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    distanceMeasurements: 0,
    polygonDrawings: 0,
    circleDrawings: 0,
    sectorRF: 0,
    elevationProfiles: 0
  });

  // Load data when user filter changes
  useEffect(() => {
    loadData();
  }, [selectedUserId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const filters = { userId: selectedUserId };
      const data = await gisToolsService.getAllUserData(filters);

      setDistanceMeasurements(data.distanceMeasurements);
      setPolygonDrawings(data.polygonDrawings);
      setCircleDrawings(data.circleDrawings);
      setSectorRF(data.sectorRF);
      setElevationProfiles(data.elevationProfiles);

      setStats({
        total: data.total,
        distanceMeasurements: data.distanceMeasurements.length,
        polygonDrawings: data.polygonDrawings.length,
        circleDrawings: data.circleDrawings.length,
        sectorRF: data.sectorRF.length,
        elevationProfiles: data.elevationProfiles.length
      });
    } catch (error) {
      console.error('Error loading GIS data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: string, id: number) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

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
      }

      if (success) {
        alert('Item deleted successfully!');
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

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${meters.toFixed(2)} m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  };

  const formatArea = (sqMeters: number): string => {
    if (sqMeters < 1000000) {
      return `${sqMeters.toFixed(2)} m²`;
    }
    return `${(sqMeters / 1000000).toFixed(2)} km²`;
  };

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
                    { id: 'elevation', label: 'Elevation', count: stats.elevationProfiles }
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
                    distanceMeasurements.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            📏 Distance Measurements ({distanceMeasurements.length})
                          </h3>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {distanceMeasurements.map((item) => (
                            <div key={item.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                    {item.measurement_name}
                                  </h4>
                                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span>📍 {item.points?.length || 0} points</span>
                                    <span>📐 {formatDistance(item.total_distance)}</span>
                                    <span>🕐 {formatDate(item.created_at)}</span>
                                    {item.username && (
                                      <span>👤 {item.username}</span>
                                    )}
                                  </div>
                                  {item.notes && (
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                      {item.notes}
                                    </p>
                                  )}
                                </div>
                                <div className="ml-4 flex items-center space-x-2">
                                  <button
                                    onClick={() => handleDelete('distance', item.id!)}
                                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Polygon Drawings */}
                  {(activeTab === 'all' || activeTab === 'polygon') &&
                    polygonDrawings.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            ▭ Polygon Drawings ({polygonDrawings.length})
                          </h3>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {polygonDrawings.map((item) => (
                            <div key={item.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                    {item.polygon_name}
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
                                <button
                                  onClick={() => handleDelete('polygon', item.id!)}
                                  className="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-800"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Circle Drawings */}
                  {(activeTab === 'all' || activeTab === 'circle') &&
                    circleDrawings.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            ⭕ Circle Drawings ({circleDrawings.length})
                          </h3>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {circleDrawings.map((item) => (
                            <div key={item.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                    {item.circle_name}
                                  </h4>
                                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span>📍 ({Number(item.center_lat).toFixed(4)}, {Number(item.center_lng).toFixed(4)})</span>
                                    <span>📏 Radius: {formatDistance(item.radius)}</span>
                                    <span
                                      className="inline-block w-4 h-4 rounded-full"
                                      style={{ backgroundColor: item.fill_color }}
                                    ></span>
                                    <span>🕐 {formatDate(item.created_at)}</span>
                                    {item.username && <span>👤 {item.username}</span>}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDelete('circle', item.id!)}
                                  className="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-800"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* RF Sectors */}
                  {(activeTab === 'all' || activeTab === 'sector') && sectorRF.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          📡 RF Sectors ({sectorRF.length})
                        </h3>
                      </div>
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {sectorRF.map((item) => (
                          <div key={item.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {item.sector_name}
                                </h4>
                                <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                  <span>📍 ({Number(item.tower_lat).toFixed(4)}, {Number(item.tower_lng).toFixed(4)})</span>
                                  <span>🔆 Azimuth: {item.azimuth}°</span>
                                  <span>📐 Beamwidth: {item.beamwidth}°</span>
                                  <span>📏 {formatDistance(item.radius)}</span>
                                  <span>📻 {item.frequency} MHz</span>
                                  <span>🕐 {formatDate(item.created_at)}</span>
                                  {item.username && <span>👤 {item.username}</span>}
                                </div>
                              </div>
                              <button
                                onClick={() => handleDelete('sector', item.id!)}
                                className="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-800"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Elevation Profiles */}
                  {(activeTab === 'all' || activeTab === 'elevation') &&
                    elevationProfiles.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            ⛰️ Elevation Profiles ({elevationProfiles.length})
                          </h3>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {elevationProfiles.map((item) => (
                            <div key={item.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                    {item.profile_name}
                                  </h4>
                                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span>📏 {formatDistance(item.total_distance)}</span>
                                    <span>⬆️ Max: {item.max_elevation}m</span>
                                    <span>⬇️ Min: {item.min_elevation}m</span>
                                    <span>🕐 {formatDate(item.created_at)}</span>
                                    {item.username && <span>👤 {item.username}</span>}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDelete('elevation', item.id!)}
                                  className="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-800"
                                >
                                  Delete
                                </button>
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
    </div>
  );
};

export default GISDataHub;
