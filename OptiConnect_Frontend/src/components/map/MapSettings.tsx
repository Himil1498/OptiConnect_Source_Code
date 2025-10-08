import React, { useState, useEffect } from 'react';

interface BoundarySettings {
  enabled: boolean;
  color: string;
  opacity: number;
  dimWhenToolActive: boolean;
  dimmedOpacity: number;
}

interface MapSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BoundarySettings;
  onSettingsChange: (settings: BoundarySettings) => void;
}

const MapSettings: React.FC<MapSettingsProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange
}) => {
  const [localSettings, setLocalSettings] = useState<BoundarySettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSettingsChange(localSettings);
    localStorage.setItem('mapBoundarySettings', JSON.stringify(localSettings));
    onClose();
  };

  const handleReset = () => {
    const defaultSettings: BoundarySettings = {
      enabled: true,
      color: '#3B82F6',
      opacity: 0.5,
      dimWhenToolActive: true,
      dimmedOpacity: 0.2
    };
    setLocalSettings(defaultSettings);
  };

  if (!isOpen) return null;

  // Preset colors
  const presetColors = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F59E0B' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Cyan', value: '#06B6D4' },
    { name: 'Indigo', value: '#6366F1' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <svg
              className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Boundary Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg
              className="w-6 h-6 text-gray-500"
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Enable/Disable Boundaries */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div>
              <label className="text-sm font-semibold text-gray-900 dark:text-white">
                Show Boundaries
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Display region boundaries on the map
              </p>
            </div>
            <button
              onClick={() =>
                setLocalSettings({ ...localSettings, enabled: !localSettings.enabled })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localSettings.enabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Color Picker */}
          <div className={localSettings.enabled ? '' : 'opacity-50 pointer-events-none'}>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Boundary Color
            </label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {presetColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setLocalSettings({ ...localSettings, color: color.value })}
                  className={`h-12 rounded-lg border-2 transition-all ${
                    localSettings.color === color.value
                      ? 'border-gray-900 dark:border-white ring-2 ring-offset-2 ring-blue-500'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 dark:text-gray-400">Custom:</label>
              <input
                type="color"
                value={localSettings.color}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, color: e.target.value })
                }
                className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <span className="text-xs font-mono text-gray-600 dark:text-gray-400 ml-2">
                {localSettings.color}
              </span>
            </div>
          </div>

          {/* Opacity Slider */}
          <div className={localSettings.enabled ? '' : 'opacity-50 pointer-events-none'}>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Normal Opacity: {Math.round(localSettings.opacity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={localSettings.opacity * 100}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, opacity: parseInt(e.target.value) / 100 })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Transparent</span>
              <span>Opaque</span>
            </div>
          </div>

          {/* Preview */}
          <div className={localSettings.enabled ? '' : 'opacity-50 pointer-events-none'}>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Preview
            </label>
            <div className="h-16 rounded-lg border-2 border-gray-300 dark:border-gray-600 relative overflow-hidden">
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: localSettings.color,
                  opacity: localSettings.opacity
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-medium text-white bg-black bg-opacity-50 px-3 py-1 rounded">
                  Normal View
                </span>
              </div>
            </div>
          </div>

          {/* Dim When Tool Active */}
          <div className={localSettings.enabled ? '' : 'opacity-50 pointer-events-none'}>
            <div className="flex items-start p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <input
                type="checkbox"
                checked={localSettings.dimWhenToolActive}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, dimWhenToolActive: e.target.checked })
                }
                className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <div className="ml-3">
                <label className="text-sm font-semibold text-gray-900 dark:text-white">
                  Auto-Dim When Tool Active
                </label>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Reduce boundary opacity when using GIS tools to minimize distraction
                </p>
              </div>
            </div>
          </div>

          {/* Dimmed Opacity Slider */}
          {localSettings.enabled && localSettings.dimWhenToolActive && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Dimmed Opacity (Tool Active): {Math.round(localSettings.dimmedOpacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={localSettings.dimmedOpacity * 100}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    dimmedOpacity: parseInt(e.target.value) / 100
                  })
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Hidden</span>
                <span>Subtle</span>
              </div>
              {/* Dimmed Preview */}
              <div className="h-16 rounded-lg border-2 border-gray-300 dark:border-gray-600 relative overflow-hidden mt-2">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: localSettings.color,
                    opacity: localSettings.dimmedOpacity
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-medium text-white bg-black bg-opacity-50 px-3 py-1 rounded">
                    Dimmed View
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapSettings;
