import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { updateUser } from '../store/slices/authSlice';
import { apiService } from '../services/apiService';

/**
 * Custom hook to monitor temporary region access and automatically
 * remove expired regions from the user's session in real-time
 * 
 * This hook:
 * 1. Periodically checks with backend for currently valid regions
 * 2. Compares with user's current regions
 * 3. Automatically updates user state if temporary regions have expired
 * 4. No re-login required - works in real-time
 * 
 * @param checkInterval - How often to check (in milliseconds). Default: 60 seconds
 */
export const useTemporaryRegionMonitor = (checkInterval: number = 60000) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    // Only run if user is authenticated and has regions
    if (!isAuthenticated || !user || !user.assignedRegions || user.assignedRegions.length === 0) {
      return;
    }

    /**
     * Check for expired temporary regions
     */
    const checkTemporaryRegions = async () => {
      // Prevent multiple simultaneous checks
      if (isCheckingRef.current) {
        return;
      }

      try {
        isCheckingRef.current = true;

        // Call backend API to get currently valid regions
        const response = await apiService.get('/temporary-access/current-regions');

        if (response.data.success && response.data.regions) {
          const currentValidRegions = response.data.regions.map((r: any) => r.name);

          // Compare with user's current regions
          const userCurrentRegions = user.assignedRegions || [];

          // Check if any regions have been removed (expired)
          const regionsChanged = 
            userCurrentRegions.length !== currentValidRegions.length ||
            !userCurrentRegions.every((region: string) => currentValidRegions.includes(region));

          if (regionsChanged) {
            console.log('🔄 Temporary region access has changed');
            console.log('   Previous regions:', userCurrentRegions);
            console.log('   Current valid regions:', currentValidRegions);

            // Update user's regions in Redux state
            dispatch(updateUser({
              assignedRegions: currentValidRegions
            }));

            // Show notification to user
            console.log('⏰ Your temporary region access has expired');
            
            // You can also dispatch a notification action here if you have a notification system
            // dispatch(showNotification({
            //   type: 'info',
            //   title: 'Region Access Updated',
            //   message: 'Your temporary access to some regions has expired.'
            // }));
          }
        }
      } catch (error) {
        console.error('Error checking temporary regions:', error);
        // Don't show error to user - this is a background check
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Initial check after 5 seconds (give app time to load)
    const initialTimeout = setTimeout(() => {
      checkTemporaryRegions();
    }, 5000);

    // Set up interval for periodic checks
    intervalRef.current = setInterval(() => {
      checkTemporaryRegions();
    }, checkInterval);

    console.log(`✅ Temporary region monitor started (checking every ${checkInterval / 1000}s)`);

    // Cleanup function
    return () => {
      if (initialTimeout) {
        clearTimeout(initialTimeout);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      console.log('🛑 Temporary region monitor stopped');
    };
  }, [isAuthenticated, user?.id, checkInterval, dispatch]); // Re-run if user changes

  // Return nothing - this is a side-effect only hook
  return null;
};

/**
 * Alternative hook that checks on specific events (more efficient)
 * Use this if you want to check only when certain actions occur
 */
export const useTemporaryRegionCheck = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const isCheckingRef = useRef(false);

  const checkNow = async () => {
    if (!user || isCheckingRef.current) {
      return;
    }

    try {
      isCheckingRef.current = true;

      const response = await apiService.get('/temporary-access/current-regions');

      if (response.data.success && response.data.regions) {
        const currentValidRegions = response.data.regions.map((r: any) => r.name);
        const userCurrentRegions = user.assignedRegions || [];

        const regionsChanged = 
          userCurrentRegions.length !== currentValidRegions.length ||
          !userCurrentRegions.every((region: string) => currentValidRegions.includes(region));

        if (regionsChanged) {
          dispatch(updateUser({
            assignedRegions: currentValidRegions
          }));
          return true; // Regions were updated
        }
      }
      return false; // No changes
    } catch (error) {
      console.error('Error checking temporary regions:', error);
      return false;
    } finally {
      isCheckingRef.current = false;
    }
  };

  return { checkNow };
};
