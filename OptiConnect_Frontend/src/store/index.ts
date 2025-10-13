import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import createWebStorage from 'redux-persist/lib/storage/createWebStorage';
import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import mapReducer from './slices/mapSlice';
import uiReducer from './slices/uiSlice';
import dataReducer from './slices/dataSlice';
import analyticsReducer from './slices/analyticsSlice';
import userReducer from './slices/userSlice';
import gisToolsReducer from './slices/gisToolsSlice';

// Custom sessionStorage for redux-persist (auto-clears on browser close)
const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: any) {
      return Promise.resolve(value);
    },
    removeItem(_key: string) {
      return Promise.resolve();
    },
  };
};

const storage = typeof window !== 'undefined'
  ? createWebStorage('session') // Use sessionStorage instead of localStorage
  : createNoopStorage();

// Redux Persist configuration (auto-logout on browser close)
const persistConfig = {
  key: 'root',
  version: 1,
  storage, // Now using sessionStorage
  whitelist: ['auth'], // Only persist auth state
  blacklist: ['map', 'ui'], // Don't persist map instance or UI state
};

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  map: mapReducer,
  ui: uiReducer,
  data: dataReducer,
  analytics: analyticsReducer,
  user: userReducer,
  gisTools: gisToolsReducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          FLUSH,
          REHYDRATE,
          PAUSE,
          PERSIST,
          PURGE,
          REGISTER,
          'map/setMapInstance'
        ],
        ignoredPaths: ['map.mapInstance'],
      },
    }),
});

// Create persistor
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;