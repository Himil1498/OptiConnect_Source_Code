import React from 'react';
import { useAppSelector } from '../../store';
import { config, getVersionInfo } from '../../utils/environment';

interface ModeIndicatorProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showVersion?: boolean;
  showEnvironment?: boolean;
  compact?: boolean;
  className?: string;
}

export const ModeIndicator: React.FC<ModeIndicatorProps> = ({
  position = 'bottom-right',
  showVersion = true,
  showEnvironment = true,
  compact = false,
  className = '',
}) => {
  const { appMode } = useAppSelector((state) => state.ui);
  const versionInfo = getVersionInfo();

  // Don't show in production unless explicitly configured
  if (!config.ui.showModeIndicator && appMode === 'production') {
    return null;
  }

  const getModeStyles = () => {
    switch (appMode) {
      case 'development':
        return {
          bg: 'bg-blue-500',
          text: 'text-white',
          border: 'border-blue-600',
          glow: 'shadow-blue-500/20',
        };
      case 'testing':
        return {
          bg: 'bg-yellow-500',
          text: 'text-black',
          border: 'border-yellow-600',
          glow: 'shadow-yellow-500/20',
        };
      case 'maintenance':
        return {
          bg: 'bg-red-500',
          text: 'text-white',
          border: 'border-red-600',
          glow: 'shadow-red-500/20',
        };
      case 'production':
      default:
        return {
          bg: 'bg-green-500',
          text: 'text-white',
          border: 'border-green-600',
          glow: 'shadow-green-500/20',
        };
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
      default:
        return 'bottom-4 right-4';
    }
  };

  const formatMode = (mode: string) => {
    return mode.charAt(0).toUpperCase() + mode.slice(1);
  };

  const styles = getModeStyles();
  const positionClasses = getPositionClasses();

  if (compact) {
    return (
      <div
        className={`
          fixed ${positionClasses} z-50
          ${styles.bg} ${styles.text} ${styles.border}
          px-2 py-1 rounded-md border
          text-xs font-medium
          shadow-lg ${styles.glow}
          backdrop-blur-sm
          transition-all duration-300
          hover:scale-105
          ${className}
        `}
        title={`Mode: ${formatMode(appMode)} | Environment: ${versionInfo.environment} | Version: ${versionInfo.version}`}
      >
        {formatMode(appMode)}
      </div>
    );
  }

  return (
    <div
      className={`
        fixed ${positionClasses} z-50
        ${styles.bg} ${styles.text}
        px-4 py-2.5 rounded-full
        min-w-max
        shadow-2xl
        backdrop-blur-sm
        transition-all duration-300
        hover:scale-105
        hover:shadow-3xl
        border-2 border-white/20
        ${className}
      `}
    >
      <div className="flex items-center space-x-2.5">
        <div className="relative">
          <div className={`w-2.5 h-2.5 rounded-full bg-white animate-pulse`} />
          <div className={`absolute inset-0 w-2.5 h-2.5 rounded-full bg-white animate-ping opacity-75`} />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm tracking-wide">
              {formatMode(appMode)} MODE
            </span>
            {versionInfo.debug && (
              <span className="text-xs px-1.5 py-0.5 bg-white/20 rounded-full font-semibold">
                DEBUG
              </span>
            )}
          </div>

          {(showEnvironment || showVersion) && (
            <div className="flex items-center space-x-2 text-xs opacity-95 mt-0.5">
              {showEnvironment && (
                <span className="font-medium">
                  {versionInfo.environment}
                </span>
              )}
              {showVersion && showEnvironment && (
                <span className="opacity-60">•</span>
              )}
              {showVersion && (
                <span className="font-medium">
                  v{versionInfo.version}
                </span>
              )}
            </div>
          )}
        </div>

        {appMode === 'maintenance' && (
          <div className="ml-2 text-xs px-2 py-1 bg-white/30 rounded-full font-bold">
            ⚠️ MAINTENANCE
          </div>
        )}
      </div>
    </div>
  );
};

// System Status Indicator Component
interface SystemStatusProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showDetails?: boolean;
  className?: string;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({
  position = 'top-right',
  showDetails = false,
  className = '',
}) => {
  const { isGlobalLoading } = useAppSelector((state) => state.ui);
  const { isMapLoaded } = useAppSelector((state) => state.map);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [systemHealth, setSystemHealth] = React.useState<'healthy' | 'degraded' | 'unhealthy'>('healthy');
  const [apiStatus, setApiStatus] = React.useState<'connected' | 'disconnected' | 'slow'>('connected');

  // System health check (mock for now)
  React.useEffect(() => {
    const checkSystemHealth = () => {
      // In a real app, this would check various system metrics
      if (!isMapLoaded) {
        setSystemHealth('degraded');
      } else if (isGlobalLoading) {
        setSystemHealth('degraded');
      } else {
        setSystemHealth('healthy');
      }

      // Mock API status check
      setApiStatus('connected');
    };

    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isMapLoaded, isGlobalLoading]);

  const getStatusColor = () => {
    switch (systemHealth) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'unhealthy':
        return 'bg-red-500';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
      default:
        return 'bottom-4 right-4';
    }
  };

  if (!config.features.debugging) {
    return null;
  }

  return (
    <div
      className={`
        fixed ${getPositionClasses()} z-40
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        rounded-lg shadow-lg
        p-3
        ${className}
      `}
    >
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          System Status
        </span>
      </div>

      {showDetails && (
        <div className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex justify-between">
            <span>Auth:</span>
            <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
              {isAuthenticated ? 'OK' : 'No Auth'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Maps:</span>
            <span className={isMapLoaded ? 'text-green-600' : 'text-yellow-600'}>
              {isMapLoaded ? 'Loaded' : 'Loading'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>API:</span>
            <span className={apiStatus === 'connected' ? 'text-green-600' : 'text-red-600'}>
              {apiStatus}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Mode:</span>
            <span className="capitalize">{config.app.mode}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Performance Monitor Component
export const PerformanceMonitor: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [fps, setFps] = React.useState(60);
  const [memory, setMemory] = React.useState(0);

  React.useEffect(() => {
    if (!config.features.debugging) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)));
        frameCount = 0;
        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    const measureMemory = () => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        setMemory(Math.round(memInfo.usedJSHeapSize / 1048576)); // Convert to MB
      }
    };

    measureFPS();
    measureMemory();
    const memoryInterval = setInterval(measureMemory, 5000);

    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(memoryInterval);
    };
  }, []);

  if (!config.features.debugging) {
    return null;
  }

  return (
    <div className={`
      fixed bottom-4 left-40 z-40
      bg-black/80 text-white
      px-3 py-1 rounded-md
      text-xs font-mono
      ${className}
    `}>
      <div className="flex space-x-4">
        <span>FPS: {fps}</span>
        <span>Memory: {memory}MB</span>
        <span>Mode: {config.app.mode}</span>
      </div>
    </div>
  );
};

export default ModeIndicator;