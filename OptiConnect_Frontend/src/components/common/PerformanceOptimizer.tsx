import React, { memo, useMemo, useCallback, useRef, useEffect } from 'react';
import { useAppSelector } from '../../store';
import { config } from '../../utils/environment';

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const performanceRef = useRef({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    maxRenderTime: 0,
  });

  useEffect(() => {
    if (!config.features.debugging) return;

    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      performanceRef.current.renderCount++;
      performanceRef.current.lastRenderTime = renderTime;

      // Calculate average
      const count = performanceRef.current.renderCount;
      const currentAvg = performanceRef.current.averageRenderTime;
      performanceRef.current.averageRenderTime = (currentAvg * (count - 1) + renderTime) / count;

      // Track max
      if (renderTime > performanceRef.current.maxRenderTime) {
        performanceRef.current.maxRenderTime = renderTime;
      }

      // Log slow renders
      if (renderTime > 16.67) { // More than one frame at 60fps
        console.warn(`Slow render detected: ${renderTime.toFixed(2)}ms`, {
          component: 'PerformanceOptimizer',
          renderCount: count,
          averageRenderTime: performanceRef.current.averageRenderTime.toFixed(2),
        });
      }
    };
  });

  return performanceRef.current;
};

// Memory management hook
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = React.useState({
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0,
  });

  useEffect(() => {
    if (!config.features.debugging || !('memory' in performance)) return;

    const updateMemoryInfo = () => {
      const memory = (performance as any).memory;
      setMemoryInfo({
        usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1048576), // MB
        totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1048576), // MB
        jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
      });
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000);

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
};

// Optimized component wrapper
export const withPerformanceOptimization = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    memo?: boolean;
    displayName?: string;
    areEqual?: (prevProps: P, nextProps: P) => boolean;
  } = {}
) => {
  const { memo: shouldMemo = true, displayName, areEqual } = options;

  const OptimizedComponent = shouldMemo
    ? memo(Component, areEqual)
    : Component;

  if (displayName) {
    OptimizedComponent.displayName = displayName;
  }

  return OptimizedComponent;
};

// Virtualization component for large lists
interface VirtualizedListProps {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  overscan?: number;
}

export const VirtualizedList: React.FC<VirtualizedListProps> = memo(({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
}) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleItems = useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2);

    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
      top: (startIndex + index) * itemHeight,
    }));
  }, [items, itemHeight, scrollTop, containerHeight, overscan]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, top }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
});

VirtualizedList.displayName = 'VirtualizedList';

// Debounced input component
interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onDebouncedChange: (value: string) => void;
  debounceMs?: number;
}

export const DebouncedInput: React.FC<DebouncedInputProps> = memo(({
  onDebouncedChange,
  debounceMs = 300,
  ...props
}) => {
  const [value, setValue] = React.useState(props.value || '');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onDebouncedChange(newValue);
    }, debounceMs);
  }, [onDebouncedChange, debounceMs]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <input
      {...props}
      value={value}
      onChange={handleChange}
    />
  );
});

DebouncedInput.displayName = 'DebouncedInput';

// Lazy loading wrapper
interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
}

export const LazyComponent: React.FC<LazyComponentProps> = ({
  children,
  fallback = <div>Loading...</div>,
  threshold = 0.1,
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div ref={ref}>
      {isVisible ? children : fallback}
    </div>
  );
};

// Performance analytics component
export const PerformanceAnalytics: React.FC = memo(() => {
  const performanceData = usePerformanceMonitor();
  const memoryData = useMemoryMonitor();
  const reduxState = useAppSelector((state) => state);

  // Calculate Redux store size
  const storeSize = useMemo(() => {
    try {
      return JSON.stringify(reduxState).length;
    } catch {
      return 0;
    }
  }, [reduxState]);

  if (!config.features.debugging) {
    return null;
  }

  return (
    <div className="fixed top-32 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-40">
      <div className="space-y-1">
        <div>Renders: {performanceData.renderCount}</div>
        <div>Last: {performanceData.lastRenderTime.toFixed(1)}ms</div>
        <div>Avg: {performanceData.averageRenderTime.toFixed(1)}ms</div>
        <div>Max: {performanceData.maxRenderTime.toFixed(1)}ms</div>
        <div>Memory: {memoryData.usedJSHeapSize}MB</div>
        <div>Store: {(storeSize / 1024).toFixed(1)}KB</div>
      </div>
    </div>
  );
});

PerformanceAnalytics.displayName = 'PerformanceAnalytics';

// Image optimization component
interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  lazy?: boolean;
  placeholder?: string;
  quality?: number;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = memo(({
  src,
  alt,
  lazy = true,
  placeholder,
  quality = 80,
  ...props
}) => {
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
        Failed to load image
      </div>
    );
  }

  return (
    <div className="relative">
      {!loaded && placeholder && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}
      <img
        {...props}
        src={src}
        alt={alt}
        loading={lazy ? 'lazy' : 'eager'}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          ...props.style,
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
        }}
      />
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

// Export all optimizations as a provider
export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Set up performance monitoring
  useEffect(() => {
    if (!config.features.debugging) return;

    // Monitor long tasks
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 50) {
          console.warn('Long task detected:', {
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name,
          });
        }
      });
    });

    observer.observe({ entryTypes: ['longtask'] });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {children}
      <PerformanceAnalytics />
    </>
  );
};