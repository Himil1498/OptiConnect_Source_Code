import type { Position, Size, Color, AppMode } from './common.types';

// UI State Management

export interface UIState {
  appMode: AppMode;
  isFullscreen: boolean;
  isDarkMode: boolean;
  theme: ThemeType;
  layout: LayoutState;
  navigation: NavigationState;
  modals: ModalState;
  notifications: NotificationState;
  panels: PanelState;
  loading: LoadingState;
  performance: PerformanceState;
}

// Theme Types
export type ThemeType = 'light' | 'dark' | 'auto' | 'high_contrast';

export interface ThemeConfig {
  name: string;
  type: ThemeType;
  colors: ThemeColors;
  fonts: ThemeFonts;
  spacing: ThemeSpacing;
  shadows: ThemeShadows;
  animations: ThemeAnimations;
}

export interface ThemeColors {
  primary: ColorPalette;
  secondary: ColorPalette;
  accent: ColorPalette;
  neutral: ColorPalette;
  semantic: SemanticColors;
  surfaces: SurfaceColors;
  text: TextColors;
  borders: BorderColors;
}

export interface ColorPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface SemanticColors {
  success: string;
  warning: string;
  error: string;
  info: string;
  successLight: string;
  warningLight: string;
  errorLight: string;
  infoLight: string;
}

export interface SurfaceColors {
  background: string;
  surface: string;
  surfaceVariant: string;
  overlay: string;
  modal: string;
  popover: string;
  tooltip: string;
}

export interface TextColors {
  primary: string;
  secondary: string;
  tertiary: string;
  disabled: string;
  inverse: string;
  onPrimary: string;
  onSecondary: string;
  onSurface: string;
}

export interface BorderColors {
  default: string;
  subtle: string;
  strong: string;
  interactive: string;
  focus: string;
  error: string;
  success: string;
}

export interface ThemeFonts {
  sans: string[];
  serif: string[];
  mono: string[];
  display: string[];
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
}

export interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
  none: string;
}

export interface ThemeAnimations {
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  easing: {
    ease: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
  };
}

// Layout Types
export interface LayoutState {
  sidebar: SidebarState;
  header: HeaderState;
  footer: FooterState;
  workspace: WorkspaceState;
  responsive: ResponsiveState;
}

export interface SidebarState {
  isOpen: boolean;
  isCollapsed: boolean;
  width: number;
  position: 'left' | 'right';
  variant: 'permanent' | 'temporary' | 'mini';
  activeSection: string;
}

export interface HeaderState {
  isVisible: boolean;
  height: number;
  isSticky: boolean;
  variant: 'default' | 'compact' | 'extended';
  showBreadcrumbs: boolean;
  showSearch: boolean;
}

export interface FooterState {
  isVisible: boolean;
  height: number;
  isSticky: boolean;
  content: 'default' | 'minimal' | 'detailed';
}

export interface WorkspaceState {
  layout: 'grid' | 'tabs' | 'split' | 'stack';
  activeWorkspace: string;
  workspaces: WorkspaceConfig[];
}

export interface WorkspaceConfig {
  id: string;
  name: string;
  icon?: string;
  layout: string;
  components: ComponentConfig[];
  isActive: boolean;
}

export interface ComponentConfig {
  id: string;
  type: string;
  position: Position;
  size: Size;
  props: Record<string, any>;
  isVisible: boolean;
  isResizable: boolean;
  isDraggable: boolean;
}

export interface ResponsiveState {
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
  dimensions: {
    width: number;
    height: number;
  };
}

// Navigation Types
export interface NavigationState {
  currentRoute: string;
  previousRoute: string;
  breadcrumbs: Breadcrumb[];
  menuItems: MenuItem[];
  activeTab: string;
  history: NavigationHistory[];
}

export interface Breadcrumb {
  label: string;
  path: string;
  icon?: string;
  isActive: boolean;
  isClickable: boolean;
}

export interface MenuItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  badge?: string;
  children?: MenuItem[];
  isActive: boolean;
  isVisible: boolean;
  permissions?: string[];
  order: number;
}

export interface NavigationHistory {
  path: string;
  timestamp: string;
  title: string;
  params?: Record<string, any>;
}

// Modal Types
export interface ModalState {
  activeModals: Modal[];
  modalStack: string[];
  backdropDismiss: boolean;
  escapeKeyDismiss: boolean;
}

export interface Modal {
  id: string;
  type: ModalType;
  title?: string;
  content: React.ReactNode | string;
  size: ModalSize;
  position: ModalPosition;
  options: ModalOptions;
  data?: Record<string, any>;
  isOpen: boolean;
  zIndex: number;
}

export type ModalType =
  | 'dialog'
  | 'drawer'
  | 'bottomSheet'
  | 'popup'
  | 'tooltip'
  | 'confirmation'
  | 'loading'
  | 'error'
  | 'custom';

export type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'auto';

export type ModalPosition =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight';

export interface ModalOptions {
  closeButton: boolean;
  backdrop: boolean;
  backdropDismiss: boolean;
  escapeKeyDismiss: boolean;
  focusTrap: boolean;
  restoreFocus: boolean;
  preventScroll: boolean;
  animated: boolean;
  persistent: boolean;
}

// Notification Types
export interface NotificationState {
  notifications: Notification[];
  maxNotifications: number;
  position: NotificationPosition;
  autoClose: boolean;
  defaultDuration: number;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  autoClose: boolean;
  isVisible: boolean;
  timestamp: string;
  actions?: NotificationAction[];
  icon?: string;
  image?: string;
  progress?: number;
  metadata?: Record<string, any>;
}

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'loading'
  | 'progress'
  | 'system'
  | 'user';

export type NotificationPosition =
  | 'topLeft'
  | 'topCenter'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomCenter'
  | 'bottomRight'
  | 'centerLeft'
  | 'centerRight'
  | 'center';

export interface NotificationAction {
  label: string;
  action: string;
  style?: 'primary' | 'secondary' | 'ghost';
  handler: () => void;
}

// Panel Types
export interface PanelState {
  panels: Panel[];
  maxPanels: number;
  snapToGrid: boolean;
  gridSize: number;
  bounds: PanelBounds;
}

export interface Panel {
  id: string;
  title: string;
  content: React.ReactNode;
  position: Position;
  size: Size;
  minSize: Size;
  maxSize: Size;
  isVisible: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  isDraggable: boolean;
  isResizable: boolean;
  zIndex: number;
  options: PanelOptions;
}

export interface PanelOptions {
  closable: boolean;
  minimizable: boolean;
  maximizable: boolean;
  resizable: boolean;
  draggable: boolean;
  collapsible: boolean;
  header: boolean;
  footer: boolean;
  padding: boolean;
  overflow: 'visible' | 'hidden' | 'scroll' | 'auto';
}

export interface PanelBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

// Loading States
export interface LoadingState {
  global: GlobalLoading;
  components: ComponentLoading[];
  operations: OperationLoading[];
}

export interface GlobalLoading {
  isLoading: boolean;
  message?: string;
  progress?: number;
  blocking: boolean;
  showSpinner: boolean;
  showProgress: boolean;
}

export interface ComponentLoading {
  componentId: string;
  isLoading: boolean;
  message?: string;
  skeleton: boolean;
  spinner: boolean;
}

export interface OperationLoading {
  operationId: string;
  type: string;
  isLoading: boolean;
  progress?: number;
  message?: string;
  cancellable: boolean;
  estimatedTime?: number;
}

// Performance Monitoring
export interface PerformanceState {
  monitoring: boolean;
  showFPS: boolean;
  showMemory: boolean;
  showNetwork: boolean;
  metrics: PerformanceMetrics;
  alerts: PerformanceAlert[];
}

export interface PerformanceMetrics {
  fps: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    latency: number;
    bandwidth: number;
    requests: number;
  };
  rendering: {
    componentsCount: number;
    rerenders: number;
    renderTime: number;
  };
  interactions: {
    responseTime: number;
    inputDelay: number;
    scrollPerformance: number;
  };
}

export interface PerformanceAlert {
  id: string;
  type: 'fps' | 'memory' | 'network' | 'rendering';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: string;
  acknowledged: boolean;
}

// Form and Input Types
export interface FormState {
  forms: Record<string, FormConfig>;
  validation: FormValidation;
  autoSave: AutoSaveConfig;
}

export interface FormConfig {
  id: string;
  fields: FormField[];
  validation: ValidationRule[];
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  submitCount: number;
  lastSaved?: string;
}

export interface FormField {
  name: string;
  type: InputType;
  value: any;
  defaultValue: any;
  label: string;
  placeholder?: string;
  description?: string;
  required: boolean;
  disabled: boolean;
  readonly: boolean;
  validation: FieldValidation;
  options?: SelectOption[];
  metadata?: Record<string, any>;
}

export type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'search'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'switch'
  | 'date'
  | 'time'
  | 'datetime'
  | 'file'
  | 'color'
  | 'range'
  | 'hidden'
  | 'custom';

export interface SelectOption {
  value: any;
  label: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
  group?: string;
}

export interface FieldValidation {
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
  errors: string[];
  warnings: string[];
}

export interface FormValidation {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
  touched: Record<string, boolean>;
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'pattern' | 'min' | 'max' | 'custom';
  value: any;
  message: string;
  when?: string[];
}

export interface AutoSaveConfig {
  enabled: boolean;
  interval: number; // in milliseconds
  onlyWhenDirty: boolean;
  showIndicator: boolean;
}

// Accessibility Types
export interface AccessibilityState {
  announcements: Announcement[];
  focusManagement: FocusManagement;
  keyboardNavigation: KeyboardNavigation;
  screenReader: ScreenReaderConfig;
}

export interface Announcement {
  id: string;
  message: string;
  priority: 'polite' | 'assertive';
  timestamp: string;
}

export interface FocusManagement {
  focusVisible: boolean;
  focusTrap: boolean;
  restoreFocus: boolean;
  skipLinks: SkipLink[];
}

export interface SkipLink {
  id: string;
  label: string;
  target: string;
  visible: boolean;
}

export interface KeyboardNavigation {
  enabled: boolean;
  tabIndex: number;
  shortcuts: KeyboardShortcut[];
}

export interface KeyboardShortcut {
  id: string;
  keys: string[];
  description: string;
  action: string;
  context?: string;
  enabled: boolean;
}

export interface ScreenReaderConfig {
  announcePageChanges: boolean;
  announceFormErrors: boolean;
  announceLoadingStates: boolean;
  verbosity: 'minimal' | 'normal' | 'verbose';
}