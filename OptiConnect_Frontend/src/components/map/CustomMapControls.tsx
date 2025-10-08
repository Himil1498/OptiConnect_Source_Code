import React, { useEffect, useState } from 'react';
import { INDIA_CENTER, MAP_TYPES, CONTROL_BUTTON_STYLE } from '../../config/mapConfig';

interface CustomMapControlsProps {
  map: google.maps.Map | null;
  showMyLocation?: boolean;
  showCenterToIndia?: boolean;
  showMapTypeSwitch?: boolean;
}

/**
 * Custom Map Controls Component
 * Provides India-specific map controls
 */
const CustomMapControls: React.FC<CustomMapControlsProps> = ({
  map,
  showMyLocation = true,
  showCenterToIndia = true,
  showMapTypeSwitch = true
}) => {
  const [currentLocation, setCurrentLocation] = useState<google.maps.LatLng | null>(null);
  const [currentMapType, setCurrentMapType] = useState<string>('roadmap');
  const [locationError, setLocationError] = useState<string>('');

  // Initialize controls when map is available
  useEffect(() => {
    if (!map) return;

    // Create control containers
    const controlsDiv = document.createElement('div');
    controlsDiv.style.margin = '10px';

    // Add controls to map
    map.controls[google.maps.ControlPosition.RIGHT_TOP].push(controlsDiv);

    return () => {
      // Cleanup
      const index = map.controls[google.maps.ControlPosition.RIGHT_TOP].getArray().indexOf(controlsDiv);
      if (index > -1) {
        map.controls[google.maps.ControlPosition.RIGHT_TOP].removeAt(index);
      }
    };
  }, [map]);

  /**
   * My Location Control
   * Gets user's current location and centers map
   */
  const handleMyLocation = () => {
    if (!map) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = new google.maps.LatLng(
            position.coords.latitude,
            position.coords.longitude
          );

          setCurrentLocation(pos);
          setLocationError('');

          // Center map on user location
          map.setCenter(pos);
          map.setZoom(15);

          // Add marker for current location
          new google.maps.Marker({
            position: pos,
            map: map,
            title: 'Your Location',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2
            }
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationError('Unable to get your location');
          alert('Error: Unable to get your location');
        }
      );
    } else {
      setLocationError('Geolocation not supported');
      alert('Error: Your browser doesn\'t support geolocation');
    }
  };

  /**
   * Center to India Control
   * Resets map view to India center
   */
  const handleCenterToIndia = () => {
    if (!map) return;

    map.setCenter(INDIA_CENTER);
    map.setZoom(5);
  };

  /**
   * Map Type Switch Control
   * Cycles through different map types
   */
  const handleMapTypeSwitch = (mapTypeId: string) => {
    if (!map) return;

    map.setMapTypeId(mapTypeId as google.maps.MapTypeId);
    setCurrentMapType(mapTypeId);
  };

  if (!map) return null;

  return (
    <>
      {/* My Location Button */}
      {showMyLocation && (
        <MyLocationButton onClick={handleMyLocation} />
      )}

      {/* Center to India Button */}
      {showCenterToIndia && (
        <CenterToIndiaButton onClick={handleCenterToIndia} />
      )}

      {/* Map Type Switcher */}
      {showMapTypeSwitch && (
        <MapTypeSwitcher
          currentType={currentMapType}
          onTypeChange={handleMapTypeSwitch}
        />
      )}
    </>
  );
};

/**
 * My Location Button Component
 */
const MyLocationButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  useEffect(() => {
    const button = document.createElement('button');
    button.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
      </svg>
    `;
    button.title = 'My Location';
    Object.assign(button.style, CONTROL_BUTTON_STYLE);

    button.addEventListener('click', onClick);
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = '#f5f5f5';
    });
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = '#fff';
    });

    // Add to map (you'll need to handle this in the parent component)
    return () => {
      button.remove();
    };
  }, [onClick]);

  return null;
};

/**
 * Center to India Button Component
 */
const CenterToIndiaButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  useEffect(() => {
    const button = document.createElement('button');
    button.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    `;
    button.title = 'Center to India';
    Object.assign(button.style, CONTROL_BUTTON_STYLE);

    button.addEventListener('click', onClick);
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = '#f5f5f5';
    });
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = '#fff';
    });

    return () => {
      button.remove();
    };
  }, [onClick]);

  return null;
};

/**
 * Map Type Switcher Component
 */
const MapTypeSwitcher: React.FC<{
  currentType: string;
  onTypeChange: (type: string) => void;
}> = ({ currentType, onTypeChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const container = document.createElement('div');
    container.style.margin = '10px';

    const button = document.createElement('button');
    const currentMapType = MAP_TYPES.find(t => t.id === currentType) || MAP_TYPES[0];
    button.innerHTML = `${currentMapType.icon} ${currentMapType.label}`;
    button.title = 'Change Map Type';
    Object.assign(button.style, CONTROL_BUTTON_STYLE, {
      minWidth: '120px',
      justifyContent: 'space-between',
      padding: '10px 15px'
    });

    button.addEventListener('click', () => setIsOpen(!isOpen));

    container.appendChild(button);

    if (isOpen) {
      const dropdown = document.createElement('div');
      Object.assign(dropdown.style, {
        position: 'absolute',
        backgroundColor: '#fff',
        borderRadius: '4px',
        boxShadow: 'rgba(0, 0, 0, 0.3) 0px 1px 4px -1px',
        marginTop: '5px',
        overflow: 'hidden'
      });

      MAP_TYPES.forEach(type => {
        const option = document.createElement('button');
        option.innerHTML = `${type.icon} ${type.label}`;
        Object.assign(option.style, CONTROL_BUTTON_STYLE, {
          width: '120px',
          borderRadius: '0',
          margin: '0',
          backgroundColor: type.id === currentType ? '#f0f0f0' : '#fff'
        });

        option.addEventListener('click', () => {
          onTypeChange(type.id);
          setIsOpen(false);
        });

        option.addEventListener('mouseenter', () => {
          option.style.backgroundColor = '#f5f5f5';
        });
        option.addEventListener('mouseleave', () => {
          option.style.backgroundColor = type.id === currentType ? '#f0f0f0' : '#fff';
        });

        dropdown.appendChild(option);
      });

      container.appendChild(dropdown);
    }

    return () => {
      container.remove();
    };
  }, [currentType, isOpen, onTypeChange]);

  return null;
};

export default CustomMapControls;