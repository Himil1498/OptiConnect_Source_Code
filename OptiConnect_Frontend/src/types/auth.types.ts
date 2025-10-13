import type { UserRole, Permission, TelecomCompany } from './common.types';

// Temporary Access Info
export interface TemporaryAccessInfo {
  id: string;
  region: string;
  expiresAt: Date;
  grantedAt: Date;
  grantedByName: string;
  reason: string;
  secondsRemaining: number;
  timeRemaining: {
    expired: boolean;
    display: string;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total_seconds: number;
  };
}

// Enhanced User Types for Phase 2
export interface User {
  id: string; // Auto-generated (USER001, USER002...)
  username: string;
  name: string;
  email: string;
  password: string;
  gender: string;
  phoneNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  officeLocation: string;
  assignedUnder: string[]; // Multiple managers/users
  role: 'Admin' | 'Manager' | 'Technician' | 'User';
  assignedRegions: string[]; // Indian states/UTs from india.json
  temporaryAccess?: TemporaryAccessInfo[]; // Active temporary access grants
  groups: string[]; // User group IDs
  directPermissions?: string[]; // Direct permissions assigned to user (not from groups)
  status: 'Active' | 'Inactive';
  loginHistory: Array<{timestamp: Date, location: string}>;

  // Legacy fields for backward compatibility
  company?: TelecomCompany | string;
  permissions?: Permission[];
  lastLogin?: string;
  avatar?: string;
  department?: string;
  manager?: string;
  isActive?: boolean;
  preferences?: UserPreferences;
  metadata?: Record<string, any>;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    types: NotificationType[];
  };
  dashboard: {
    layout: string;
    widgets: string[];
  };
  map: {
    defaultZoom: number;
    defaultCenter: { lat: number; lng: number };
    defaultLayers: string[];
  };
}

export type NotificationType =
  | 'system_alerts'
  | 'data_updates'
  | 'maintenance'
  | 'performance'
  | 'security';

// Authentication Types
export interface LoginCredentials {
  email: string;
  password: string;
  company?: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
  permissions: Permission[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  lastActivity: string | null;
  sessionExpiry: string | null;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  company: string;
  permissions: Permission[];
  iat: number;
  exp: number;
  iss: string;
}

// Registration Types
export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  company: TelecomCompany | string;
  phone?: string;
  department?: string;
  inviteCode?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Session Management
export interface Session {
  id: string;
  userId: string;
  token: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  isActive: boolean;
  lastActivity: string;
  expiresAt: string;
  createdAt: string;
}

export interface ActiveSession {
  current: Session;
  others: Session[];
}

// Permission and Role Management
export interface RoleDefinition {
  role: UserRole;
  name: string;
  description: string;
  permissions: Permission[];
  isSystemRole: boolean;
}

export interface PermissionDefinition {
  permission: Permission;
  name: string;
  description: string;
  category: string;
  isSystemPermission: boolean;
}

export interface UserGroup {
  id: string;
  name: string;
  description: string;
  company: string;
  permissions: Permission[];
  members: string[]; // User IDs
  managers: string[]; // User IDs who can manage this group
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Multi-factor Authentication
export interface MFASetup {
  type: 'totp' | 'sms' | 'email';
  secret?: string; // For TOTP
  qrCode?: string; // For TOTP
  backupCodes: string[];
}

export interface MFAVerification {
  token: string;
  type: 'totp' | 'sms' | 'email' | 'backup';
}

export interface MFASettings {
  isEnabled: boolean;
  methods: Array<{
    type: 'totp' | 'sms' | 'email';
    isActive: boolean;
    addedAt: string;
  }>;
  backupCodes: {
    remaining: number;
    lastGenerated: string;
  };
}

// OAuth and SSO
export interface OAuthProvider {
  name: string;
  clientId: string;
  scope: string[];
  redirectUri: string;
  authUrl: string;
}

export interface SSOConfiguration {
  enabled: boolean;
  provider: 'google' | 'microsoft' | 'okta' | 'saml';
  configuration: Record<string, any>;
  domainRestrictions: string[];
  autoProvision: boolean;
  defaultRole: UserRole;
}

// Company and Organization
export interface Company {
  id: string;
  name: TelecomCompany | string;
  type: 'telecom_operator' | 'infrastructure_provider' | 'service_provider' | 'government' | 'other';
  license: string;
  contactEmail: string;
  contactPhone: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  settings: {
    allowedDomains: string[];
    ssoConfiguration?: SSOConfiguration;
    dataRetentionPolicy: number; // days
    maxUsers: number;
    features: string[];
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Invitation System
export interface UserInvitation {
  id: string;
  email: string;
  role: UserRole;
  company: string;
  invitedBy: string;
  inviteCode: string;
  expiresAt: string;
  isAccepted: boolean;
  acceptedAt?: string;
  createdAt: string;
}

// Audit and Security
export interface LoginAttempt {
  id: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  isSuccessful: boolean;
  failureReason?: string;
  location?: string;
  timestamp: string;
}

export interface SecurityEvent {
  id: string;
  userId?: string;
  type: 'login' | 'logout' | 'failed_login' | 'password_change' | 'permission_change' | 'suspicious_activity';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, any>;
  timestamp: string;
}

// Profile Management
export interface ProfileUpdateRequest {
  name?: string;
  phone?: string;
  department?: string;
  avatar?: File;
  preferences?: Partial<UserPreferences>;
}

export interface AvatarUploadResponse {
  url: string;
  filename: string;
  size: number;
}