import React, { useState } from 'react';

interface ViewOnMapDetailsProps {
  data: any;
  type: string;
  onClose: () => void;
  on360ViewClick?: (lat: number, lng: number) => void;
  onElevationGraphClick?: () => void;
}

const ViewOnMapDetails: React.FC<ViewOnMapDetailsProps> = ({
  data,
  type,
  onClose,
  on360ViewClick,
  onElevationGraphClick
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

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

  const renderContent = () => {
    switch (type) {
      case 'distance':
        const midPoint = data.points && data.points.length > 0
          ? data.points[Math.floor(data.points.length / 2)]
          : null;

        return (
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                📏 {data.measurement_name || 'Distance Measurement'}
              </h3>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Distance:</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {formatDistance(data.total_distance)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Points:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {data.points?.length || 0}
                </span>
              </div>

              {data.notes && (
                <div className="py-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                    {data.notes}
                  </p>
                </div>
              )}
            </div>

            {midPoint && on360ViewClick && (
              <button
                onClick={() => on360ViewClick(midPoint.lat, midPoint.lng)}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg hover:from-violet-600 hover:to-purple-700 font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                View 360° Street View
              </button>
            )}
          </div>
        );

      case 'polygon':
        return (
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                ▭ {data.polygon_name || 'Polygon Drawing'}
              </h3>
            </div>

            <div className="space-y-2">
              {data.area && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Area:</span>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                    {formatArea(data.area)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Vertices:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {data.coordinates?.length || 0}
                </span>
              </div>

              <div className="flex items-center gap-2 py-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Color:</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 shadow-sm"
                    style={{ backgroundColor: data.fill_color }}
                  />
                  <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                    {data.fill_color}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'circle':
        return (
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                ⭕ {data.circle_name || 'Circle Drawing'}
              </h3>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Radius:</span>
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                  {formatDistance(data.radius)}
                </span>
              </div>

              <div className="py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Center:</span>
                <span className="text-xs font-mono text-gray-900 dark:text-white">
                  {Number(data.center_lat).toFixed(6)}, {Number(data.center_lng).toFixed(6)}
                </span>
              </div>

              <div className="flex items-center gap-2 py-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Color:</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 shadow-sm"
                    style={{ backgroundColor: data.fill_color }}
                  />
                  <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                    {data.fill_color}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'sector':
        return (
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                📡 {data.sector_name || 'RF Sector'}
              </h3>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Radius:</span>
                <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                  {formatDistance(data.radius)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Azimuth:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {data.azimuth}°
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Beamwidth:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {data.beamwidth}°
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Frequency:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {data.frequency} MHz
                </span>
              </div>
            </div>
          </div>
        );

      case 'elevation':
        return (
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                ⛰️ {data.profile_name || 'Elevation Profile'}
              </h3>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Distance:</span>
                <span className="text-sm font-bold text-red-600 dark:text-red-400">
                  {formatDistance(data.total_distance)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Max Elevation:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {data.max_elevation} m
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Min Elevation:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {data.min_elevation} m
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Elevation Gain:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {data.elevation_gain || 'N/A'} m
                </span>
              </div>
            </div>

            {onElevationGraphClick && (
              <button
                onClick={onElevationGraphClick}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-lg hover:from-red-600 hover:to-orange-700 font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Interactive Graph
              </button>
            )}
          </div>
        );

      case 'infrastructure':
        return (
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                🏗️ {data.item_name || 'Infrastructure'}
              </h3>
            </div>

            <div className="space-y-2">
              {/* Type & Status */}
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Type:</span>
                <span className={`text-sm font-semibold px-2 py-1 rounded ${
                  data.item_type === 'POP'
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                }`}>
                  {data.item_type || 'N/A'}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</span>
                <span className={`text-sm font-semibold px-2 py-1 rounded ${
                  data.status === 'Active'
                    ? 'bg-green-100 text-green-700'
                    : data.status === 'Inactive'
                    ? 'bg-gray-100 text-gray-700'
                    : data.status === 'Maintenance'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {data.status || 'N/A'}
                </span>
              </div>

              {/* Source */}
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Source:</span>
                <span className={`text-sm font-semibold px-2 py-1 rounded ${
                  data.source === 'KML'
                    ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                    : 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                }`}>
                  {data.source || 'Manual'}
                </span>
              </div>

              {/* IDs */}
              {data.unique_id && (
                <div className="py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Unique ID:</span>
                  <span className="text-xs font-mono text-gray-900 dark:text-white">
                    {data.unique_id}
                  </span>
                </div>
              )}

              {data.network_id && (
                <div className="py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Network ID:</span>
                  <span className="text-xs font-mono text-gray-900 dark:text-white">
                    {data.network_id}
                  </span>
                </div>
              )}

              {/* Coordinates */}
              <div className="py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Location:</span>
                <span className="text-xs font-mono text-gray-900 dark:text-white">
                  {Number(data.latitude).toFixed(6)}, {Number(data.longitude).toFixed(6)}
                </span>
              </div>

              {/* Contact Info */}
              {(data.contact_name || data.contact_phone) && (
                <div className="py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Contact:</span>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {data.contact_name && <div>{data.contact_name}</div>}
                    {data.contact_phone && <div className="text-xs">{data.contact_phone}</div>}
                  </div>
                </div>
              )}

              {/* Address */}
              {(data.address_street || data.address_city || data.address_state) && (
                <div className="py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Address:</span>
                  <div className="text-xs text-gray-900 dark:text-white">
                    {data.address_street && <div>{data.address_street}</div>}
                    {(data.address_city || data.address_state) && (
                      <div>
                        {data.address_city}{data.address_city && data.address_state && ', '}{data.address_state}
                        {data.address_pincode && ` - ${data.address_pincode}`}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Technical Details */}
              {data.structure_type && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Structure:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {data.structure_type}
                  </span>
                </div>
              )}

              {data.height && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Height:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {data.height} m
                  </span>
                </div>
              )}

              {data.bandwidth && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Bandwidth:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {data.bandwidth}
                  </span>
                </div>
              )}

              {/* Rental Information */}
              {data.is_rented && (
                <div className="py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Rental:</span>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {data.rent_amount && <div>₹{data.rent_amount}/month</div>}
                    {data.landlord_name && <div className="text-xs">Landlord: {data.landlord_name}</div>}
                  </div>
                </div>
              )}

              {/* Notes */}
              {data.notes && (
                <div className="py-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Notes:</span>
                  <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                    {data.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return <div className="text-sm text-gray-500 dark:text-gray-400">No details available</div>;
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2 font-semibold"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          View Details
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-20 right-4 z-40 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-blue-200 dark:border-blue-800 overflow-hidden animate-slideIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 flex items-center justify-between">
        <h2 className="text-white font-bold text-sm flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Item Details
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white"
            title="Minimize"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
        {renderContent()}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Viewing on map
        </span>
        <button
          onClick={onClose}
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
        >
          Clear from map
        </button>
      </div>
    </div>
  );
};

export default ViewOnMapDetails;
