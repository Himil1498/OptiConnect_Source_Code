import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useAppSelector } from "../../store";
import { getActiveTemporaryAccess } from "../../services/temporaryAccessService";

const NavigationBar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = React.useState(false);
  const [temporaryAccessCount, setTemporaryAccessCount] = React.useState(0);
  const [tempRegions, setTempRegions] = React.useState<string[]>([]);
  const profileDropdownRef = React.useRef<HTMLDivElement>(null);

  // Fetch temporary access on component mount and when dropdown opens
  React.useEffect(() => {
    const fetchTemporaryAccess = async () => {
      if (user?.id) {
        try {
          const activeAccess = await getActiveTemporaryAccess(user.id);
          setTemporaryAccessCount(activeAccess.length);
          setTempRegions(activeAccess.map(access => access.region));
        } catch (error) {
          console.error('Error fetching temporary access:', error);
        }
      }
    };

    if (isAuthenticated && user) {
      fetchTemporaryAccess();
      // Refresh every 60 seconds
      const interval = setInterval(fetchTemporaryAccess, 60000);
      return () => clearInterval(interval);
    }
  }, [user, isAuthenticated]);

  // Close profile dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showProfileDropdown]);

  const handleLogout = () => {
    setShowProfileDropdown(false);
    logout();
    navigate('/login');
  };

  // Define all navigation items with role-based access control and vibrant colors
  const allNavigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      color: "from-blue-500 to-blue-600",
      iconColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      roles: ["Admin", "Manager", "Technician", "User"]
    },
    {
      name: "Map",
      href: "/map",
      color: "from-emerald-500 to-emerald-600",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      roles: ["Admin", "Manager", "Technician", "User"]
    },
    {
      name: "Users",
      href: "/users",
      color: "from-violet-500 to-violet-600",
      iconColor: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-50 dark:bg-violet-900/20",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      roles: ["Admin", "Manager"]
    },
    {
      name: "Groups",
      href: "/groups",
      color: "from-amber-500 to-amber-600",
      iconColor: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      roles: ["Admin", "Manager"]
    },
    {
      name: "Admin",
      href: "/admin",
      color: "from-rose-500 to-rose-600",
      iconColor: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-50 dark:bg-rose-900/20",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      roles: ["Admin"]
    },
    {
      name: "Analytics",
      href: "/analytics",
      color: "from-cyan-500 to-cyan-600",
      iconColor: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      roles: ["Admin", "Manager"]
    }
  ];

  // Filter navigation items based on user role
  const navigation = allNavigation.filter(item =>
    user?.role && item.roles.includes(user.role)
  );

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow">
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <div className="flex justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">OC</span>
              </div>
              <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
                Opti Connect
              </span>
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    isActive(item.href)
                      ? `border-b-2 border-current ${item.iconColor} font-semibold`
                      : `border-transparent text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200`
                  } inline-flex items-center gap-2 px-3 pt-1 pb-1 text-sm transition-all duration-200 group relative`}
                >
                  {/* Fixed: Icons now visible in light mode with proper stroke width */}
                  <span className={`transform group-hover:scale-110 transition-all duration-200`}>
                    <svg className={`h-5 w-5 ${isActive(item.href) ? item.iconColor : 'text-gray-700 dark:text-gray-400 group-hover:' + item.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      {item.icon.props.children}
                    </svg>
                  </span>
                  <span className="font-medium">{item.name}</span>
                  {isActive(item.href) && (
                    <span className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r ${item.color}`}></span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              title="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              title={
                isDarkMode ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {isDarkMode ? (
                // Moon icon - showing dark mode is active
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              ) : (
                // Sun icon - showing light mode is active
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              )}
            </button>

            {/* User Profile Dropdown - Enhanced */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-3 py-2 transition-all duration-200 group"
              >
                <div className="flex-shrink-0 relative">
                  {/* Avatar with gradient border and status indicator */}
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-0.5 transform group-hover:scale-110 transition-transform duration-200">
                      <div className="h-full w-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                        <span className="text-sm font-bold bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {user?.name
                            ?.split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase() || "U"}
                        </span>
                      </div>
                    </div>
                    {/* Online status indicator or Temporary Access indicator */}
                    {temporaryAccessCount > 0 ? (
                      <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-amber-500 border-2 border-white dark:border-gray-800 ring-2 ring-amber-500/30 flex items-center justify-center" title={`${temporaryAccessCount} temporary access grants`}>
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    ) : (
                      <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800 ring-2 ring-green-500/30 animate-pulse"></div>
                    )}
                  </div>
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {user?.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.role}
                  </div>
                </div>
                <svg
                  className={`hidden md:block w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                    showProfileDropdown ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Profile Dropdown Menu - Enhanced */}
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl shadow-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-lg animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                  {/* Header Section with Gradient */}
                  <div className="px-6 py-5 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg ring-4 ring-white dark:ring-gray-800">
                          <span className="text-lg font-bold text-white">
                            {user?.name
                              ?.split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase() || "U"}
                          </span>
                        </div>
                      </div>
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {user?.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
                          {user?.email}
                        </p>
                        {/* Role Badge */}
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {user?.role}
                          </span>

                          {/* Temporary Access Badge */}
                          {temporaryAccessCount > 0 && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md animate-pulse">
                              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Temp Access ({temporaryAccessCount})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    {/* Profile Link */}
                    <Link
                      to="/profile"
                      onClick={() => setShowProfileDropdown(false)}
                      className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
                    >
                      <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-medium">View Profile</span>
                    </Link>

                    {/* Settings Link */}
                    <Link
                      to="/settings"
                      onClick={() => setShowProfileDropdown(false)}
                      className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group"
                    >
                      <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium">Settings</span>
                    </Link>

                    {/* Stats Section */}
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-y border-gray-200 dark:border-gray-700 my-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Company</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white mt-1 truncate">{user?.company || 'N/A'}</p>
                        </div>
                        <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Regions</p>
                          <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-1">{user?.assignedRegions?.length || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Temporary Access Regions */}
                  {tempRegions.length > 0 && (
                    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-amber-50/50 dark:bg-amber-900/10">
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Temporary Access Regions
                      </p>
                      <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                        {tempRegions.slice(0, 6).map((region: string) => (
                          <span
                            key={region}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
                          >
                            {region}
                          </span>
                        ))}
                        {tempRegions.length > 6 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200">
                            +{tempRegions.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Assigned Regions Preview */}
                  {user?.assignedRegions && user.assignedRegions.length > 0 && (
                    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Your Regions
                      </p>
                      <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                        {user.assignedRegions.slice(0, 6).map((region: string) => (
                          <span
                            key={region}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                          >
                            {region}
                          </span>
                        ))}
                        {user.assignedRegions.length > 6 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200">
                            +{user.assignedRegions.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sign Out */}
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left flex items-center gap-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group font-semibold"
                    >
                      <svg
                        className="w-5 h-5 group-hover:scale-110 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span className="text-sm">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`${
                  isActive(item.href)
                    ? `${item.bgColor} border-current ${item.iconColor} font-semibold`
                    : "border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                } flex items-center gap-3 pl-3 pr-4 py-3 border-l-4 text-base transition-all duration-200`}
              >
                <span className={`flex-shrink-0 ${isActive(item.href) ? item.iconColor : ''}`}>{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavigationBar;
