import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import authReducer from './slices/authSlice';
import mapReducer from './slices/mapSlice';
import uiReducer from './slices/uiSlice';
import dataReducer from './slices/dataSlice';
import analyticsReducer from './slices/analyticsSlice';
import userReducer from './slices/userSlice';
import gisToolsReducer from './slices/gisToolsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    map: mapReducer,
    ui: uiReducer,
    data: dataReducer,
    analytics: analyticsReducer,
    user: userReducer,
    gisTools: gisToolsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['map/setMapInstance'],
        ignoredPaths: ['map.mapInstance'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;