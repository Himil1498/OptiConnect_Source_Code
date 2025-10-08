import React from 'react';
import { useAppSelector } from '../../store';
import { config, getVersionInfo } from '../../utils/environment';

interface FooterProps {
  className?: string;
  position?: 'fixed' | 'relative';
  showDetails?: boolean;
}

const Footer: React.FC<FooterProps> = ({
  className = '',
  position = 'relative',
  showDetails = true,
}) => {
  const { user } = useAppSelector((state) => state.auth);
  const { appMode } = useAppSelector((state) => state.ui);
  const versionInfo = getVersionInfo();
  const [currentTime, setCurrentTime] = React.useState(new Date());

  // Update time every minute
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getModeColor = () => {
    switch (appMode) {
      case 'development':
        return 'text-blue-600 dark:text-blue-400';
      case 'testing':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'maintenance':
        return 'text-red-600 dark:text-red-400';
      case 'production':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const positionClass = position === 'fixed' ? 'fixed bottom-0 left-0 right-0' : 'relative';

  return (
    <footer
      className={`
        ${positionClass}
        bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800
        border-t-2 border-blue-200 dark:border-blue-800
        ${className}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {showDetails ? (
          // Detailed Footer
          <div className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {/* Left Section: Version & Mode */}
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    Opti Connect GIS
                  </span>
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                    v{versionInfo.version}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="h-4 w-4 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Mode:</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${getModeColor()}`}>
                    {appMode.charAt(0).toUpperCase() + appMode.slice(1)}
                  </span>
                  {config.app.debug && (
                    <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full font-bold">
                      DEBUG
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Environment: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{versionInfo.environment}</span>
                  </span>
                </div>
              </div>

              {/* Center Section: User Info & Regions */}
              <div className="flex flex-col space-y-2 text-center">
                {user && (
                  <>
                    <div className="flex items-center justify-center space-x-2">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <span className="text-gray-800 dark:text-gray-200 font-bold">
                        {user.name}
                      </span>
                      <span className="text-xs px-2.5 py-1 bg-gradient-to-r from-violet-100 to-violet-200 dark:from-violet-900/30 dark:to-violet-800/30 text-violet-700 dark:text-violet-300 rounded-full font-bold">
                        {user.role}
                      </span>
                    </div>
                    {user.assignedRegions && user.assignedRegions.length > 0 && (
                      <div className="flex items-center justify-center space-x-1 text-xs">
                        <svg className="h-3 w-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-gray-600 dark:text-gray-400 font-medium">
                          <span className="text-amber-600 dark:text-amber-400 font-bold">{user.assignedRegions.join(', ')}</span>
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Right Section: Date & Time */}
              <div className="flex flex-col space-y-2 md:items-end">
                <div className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 rounded-lg">
                  <svg
                    className="w-5 h-5 text-cyan-600 dark:text-cyan-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-gray-800 dark:text-gray-200 font-bold">
                    {formatTime(currentTime)}
                  </span>
                </div>
                <div className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-lg">
                  <svg
                    className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300 text-xs font-semibold">
                    {formatDate(currentTime)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Row: Copyright & Links */}
            <div className="mt-4 pt-4 border-t-2 border-gray-300 dark:border-gray-600 flex flex-col sm:flex-row justify-between items-center text-xs">
              <div className="flex items-center space-x-2">
                <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300 font-semibold">
                  © {new Date().getFullYear()} Opti Connect. All rights reserved.
                </span>
              </div>
              <div className="flex items-center space-x-3 mt-2 sm:mt-0">
                <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                  <svg className="h-3 w-3 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="text-blue-700 dark:text-blue-300 font-bold">Build: {versionInfo.version}</span>
                </div>
                <span className="text-gray-400">•</span>
                <div className="flex items-center space-x-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-md">
                  <svg className="h-3 w-3 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                    {config.api.enableMocking ? 'LocalStorage Mode' : 'Backend Connected'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Compact Footer
          <div className="py-3 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Opti Connect GIS
              </span>
              <span>v{versionInfo.version}</span>
              <span className={`font-medium ${getModeColor()}`}>
                {appMode}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span>{formatTime(currentTime)}</span>
              <span>{formatDate(currentTime)}</span>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
};

export default Footer;
