import type { AppMode, Environment } from '../types/common.types';

// Environment Detection
export const getEnvironment = (): Environment => {
  const nodeEnv = process.env.NODE_ENV;
  const reactAppEnv = process.env.REACT_APP_ENVIRONMENT;

  // Use REACT_APP_ENVIRONMENT if set, otherwise fall back to NODE_ENV
  if (reactAppEnv) {
    return reactAppEnv as Environment;
  }

  switch (nodeEnv) {
    case 'production':
      return 'production';
    case 'test':
      return 'testing';
    case 'development':
    default:
      return 'development';
  }
};

// App Mode Detection
export const getAppMode = (): AppMode => {
  const environment = getEnvironment();
  const maintenanceMode = process.env.REACT_APP_MAINTENANCE_MODE === 'true';

  if (maintenanceMode) {
    return 'maintenance';
  }

  switch (environment) {
    case 'production':
      return 'production';
    case 'testing':
      return 'testing';
    case 'development':
    default:
      return 'development';
  }
};

// Environment Configuration
export interface EnvironmentConfig {
  app: {
    name: string;
    version: string;
    mode: AppMode;
    environment: Environment;
    debug: boolean;
    buildDate: string;
  };
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
    enableMocking: boolean;
  };
  maps: {
    apiKey: string;
    libraries: string[];
    region: string;
    language: string;
  };
  features: {
    analytics: boolean;
    export: boolean;
    import: boolean;
    realTimeUpdates: boolean;
    debugging: boolean;
  };
  monitoring: {
    sentry: {
      enabled: boolean;
      dsn?: string;
    };
    analytics: {
      enabled: boolean;
      trackingId?: string;
    };
    performance: {
      enabled: boolean;
      sampleRate: number;
    };
  };
  storage: {
    prefix: string;
    enableEncryption: boolean;
    ttl: number;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    showModeIndicator: boolean;
    enableAnimations: boolean;
    enableTooltips: boolean;
  };
}

// Default configurations for each environment
const developmentConfig: EnvironmentConfig = {
  app: {
    name: 'Opti Connect GIS Platform',
    version: process.env.REACT_APP_VERSION || '1.0.0-dev',
    mode: 'development',
    environment: 'development',
    debug: true,
    buildDate: process.env.REACT_APP_BUILD_DATE || new Date().toISOString(),
  },
  api: {
    baseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api',
    timeout: 10000,
    retries: 3,
    enableMocking: true,
  },
  maps: {
    apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places', 'drawing', 'geometry', 'visualization'],
    region: 'IN',
    language: 'en',
  },
  features: {
    analytics: true,
    export: true,
    import: true,
    realTimeUpdates: true,
    debugging: true,
  },
  monitoring: {
    sentry: {
      enabled: false,
    },
    analytics: {
      enabled: false,
    },
    performance: {
      enabled: true,
      sampleRate: 1.0,
    },
  },
  storage: {
    prefix: 'opti_connect_dev_',
    enableEncryption: false,
    ttl: 24 * 60 * 60 * 1000, // 24 hours
  },
  ui: {
    theme: 'auto',
    showModeIndicator: true,
    enableAnimations: true,
    enableTooltips: true,
  },
};

const productionConfig: EnvironmentConfig = {
  app: {
    name: 'Opti Connect GIS Platform',
    version: process.env.REACT_APP_VERSION || '1.0.0',
    mode: 'production',
    environment: 'production',
    debug: false,
    buildDate: process.env.REACT_APP_BUILD_DATE || new Date().toISOString(),
  },
  api: {
    baseUrl: process.env.REACT_APP_API_BASE_URL || 'https://api.opticonnect.com',
    timeout: 30000,
    retries: 3,
    enableMocking: false,
  },
  maps: {
    apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places', 'drawing', 'geometry', 'visualization'],
    region: 'IN',
    language: 'en',
  },
  features: {
    analytics: true,
    export: true,
    import: true,
    realTimeUpdates: true,
    debugging: false,
  },
  monitoring: {
    sentry: {
      enabled: true,
      dsn: process.env.REACT_APP_SENTRY_DSN,
    },
    analytics: {
      enabled: true,
      trackingId: process.env.REACT_APP_GA_TRACKING_ID,
    },
    performance: {
      enabled: true,
      sampleRate: 0.1,
    },
  },
  storage: {
    prefix: 'opti_connect_',
    enableEncryption: true,
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  ui: {
    theme: 'auto',
    showModeIndicator: false,
    enableAnimations: true,
    enableTooltips: true,
  },
};

const testingConfig: EnvironmentConfig = {
  ...developmentConfig,
  app: {
    ...developmentConfig.app,
    mode: 'testing',
    environment: 'testing',
  },
  api: {
    ...developmentConfig.api,
    baseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api',
    enableMocking: true,
  },
  features: {
    ...developmentConfig.features,
    debugging: false,
  },
  storage: {
    ...developmentConfig.storage,
    prefix: 'opti_connect_test_',
  },
};

const maintenanceConfig: EnvironmentConfig = {
  ...productionConfig,
  app: {
    ...productionConfig.app,
    mode: 'maintenance',
  },
  features: {
    analytics: false,
    export: false,
    import: false,
    realTimeUpdates: false,
    debugging: false,
  },
  ui: {
    ...productionConfig.ui,
    showModeIndicator: true,
  },
};

// Get configuration based on current environment
export const getEnvironmentConfig = (): EnvironmentConfig => {
  const mode = getAppMode();

  switch (mode) {
    case 'production':
      return productionConfig;
    case 'testing':
      return testingConfig;
    case 'maintenance':
      return maintenanceConfig;
    case 'development':
    default:
      return developmentConfig;
  }
};

// Environment utilities
export const isDevelopment = (): boolean => getEnvironment() === 'development';
export const isProduction = (): boolean => getEnvironment() === 'production';
export const isTesting = (): boolean => getEnvironment() === 'testing';
export const isMaintenanceMode = (): boolean => getAppMode() === 'maintenance';

// Feature flags
export const isFeatureEnabled = (feature: keyof EnvironmentConfig['features']): boolean => {
  const config = getEnvironmentConfig();
  return config.features[feature];
};

// Debug utilities
export const debugLog = (message: string, ...args: any[]): void => {
  const config = getEnvironmentConfig();
  if (config.app.debug) {
    console.log(`[${config.app.mode.toUpperCase()}] ${message}`, ...args);
  }
};

export const debugWarn = (message: string, ...args: any[]): void => {
  const config = getEnvironmentConfig();
  if (config.app.debug) {
    console.warn(`[${config.app.mode.toUpperCase()}] ${message}`, ...args);
  }
};

export const debugError = (message: string, error?: any): void => {
  const config = getEnvironmentConfig();
  if (config.app.debug) {
    console.error(`[${config.app.mode.toUpperCase()}] ${message}`, error);
  }
};

// Version information
export const getVersionInfo = () => {
  const config = getEnvironmentConfig();
  return {
    version: config.app.version,
    buildDate: config.app.buildDate,
    environment: config.app.environment,
    mode: config.app.mode,
    debug: config.app.debug,
  };
};

// Environment validation
export const validateEnvironment = (): { valid: boolean; errors: string[] } => {
  const config = getEnvironmentConfig();
  const errors: string[] = [];

  // Check required environment variables
  if (!config.maps.apiKey) {
    errors.push('Google Maps API key is not configured (REACT_APP_GOOGLE_MAPS_API_KEY)');
  }

  if (config.app.environment === 'production') {
    if (!config.api.baseUrl.startsWith('https://')) {
      errors.push('Production API URL must use HTTPS');
    }

    if (config.monitoring.sentry.enabled && !config.monitoring.sentry.dsn) {
      errors.push('Sentry DSN is required when Sentry monitoring is enabled');
    }

    if (config.monitoring.analytics.enabled && !config.monitoring.analytics.trackingId) {
      errors.push('Analytics tracking ID is required when analytics is enabled');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Export the current configuration
export const config = getEnvironmentConfig();