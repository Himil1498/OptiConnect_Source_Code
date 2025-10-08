/**
 * User Groups & Permission Matrix - Type Definitions
 * Minimal implementation with localStorage support
 */

// ===== Permission Categories =====
export enum PermissionCategory {
  GIS_TOOLS = "GIS Tools",
  DATA_MANAGEMENT = "Data Management",
  USER_MANAGEMENT = "User Management",
  GROUP_MANAGEMENT = "Group Management",
  SETTINGS = "Settings",
  SEARCH = "Search & Navigation"
}

// ===== Permission Definition =====
export interface PermissionDefinition {
  id: string;                    // "gis.distance.use"
  name: string;                  // "Use Distance Tool"
  description: string;
  category: PermissionCategory;
  module: string;                // "distance", "polygon", "users"
  action: string;                // "use", "save", "delete", "view"
  isSystemPermission: boolean;   // Cannot be deleted
}

// ===== User Group =====
export interface UserGroup {
  id: string;
  name: string;                  // "Field Engineers - North"
  description: string;
  permissions: string[];         // Permission IDs
  assignedRegions: string[];     // Regions inherited by members
  members: string[];             // User IDs
  managers: string[];            // User IDs who can manage this group
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Permission Check Result =====
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  missingPermission?: string;
}

// ===== Effective Permissions =====
export interface EffectivePermissions {
  direct: string[];              // Direct user permissions
  fromGroups: string[];          // Permissions from groups
  all: Set<string>;              // Combined (for fast lookup)
}

// ===== Permission Ownership Types =====
export type PermissionScope = 'own' | 'team' | 'any';

// ===== Predefined Permissions List =====
export const SYSTEM_PERMISSIONS: PermissionDefinition[] = [
  // ===== GIS Tools =====
  {
    id: "gis.distance.use",
    name: "Use Distance Tool",
    description: "Allows user to use the distance measurement tool",
    category: PermissionCategory.GIS_TOOLS,
    module: "distance",
    action: "use",
    isSystemPermission: true
  },
  {
    id: "gis.distance.save",
    name: "Save Distance Measurements",
    description: "Allows user to save distance measurements",
    category: PermissionCategory.GIS_TOOLS,
    module: "distance",
    action: "save",
    isSystemPermission: true
  },
  {
    id: "gis.distance.delete.own",
    name: "Delete Own Distance Measurements",
    description: "Allows user to delete their own distance measurements",
    category: PermissionCategory.GIS_TOOLS,
    module: "distance",
    action: "delete.own",
    isSystemPermission: true
  },
  {
    id: "gis.distance.delete.any",
    name: "Delete Any Distance Measurements",
    description: "Allows user to delete any distance measurement",
    category: PermissionCategory.GIS_TOOLS,
    module: "distance",
    action: "delete.any",
    isSystemPermission: true
  },
  {
    id: "gis.polygon.use",
    name: "Use Polygon Tool",
    description: "Allows user to use the polygon drawing tool",
    category: PermissionCategory.GIS_TOOLS,
    module: "polygon",
    action: "use",
    isSystemPermission: true
  },
  {
    id: "gis.polygon.save",
    name: "Save Polygons",
    description: "Allows user to save polygons",
    category: PermissionCategory.GIS_TOOLS,
    module: "polygon",
    action: "save",
    isSystemPermission: true
  },
  {
    id: "gis.polygon.delete.own",
    name: "Delete Own Polygons",
    description: "Allows user to delete their own polygons",
    category: PermissionCategory.GIS_TOOLS,
    module: "polygon",
    action: "delete.own",
    isSystemPermission: true
  },
  {
    id: "gis.polygon.delete.any",
    name: "Delete Any Polygons",
    description: "Allows user to delete any polygon",
    category: PermissionCategory.GIS_TOOLS,
    module: "polygon",
    action: "delete.any",
    isSystemPermission: true
  },
  {
    id: "gis.circle.use",
    name: "Use Circle Tool",
    description: "Allows user to use the circle/radius tool",
    category: PermissionCategory.GIS_TOOLS,
    module: "circle",
    action: "use",
    isSystemPermission: true
  },
  {
    id: "gis.circle.save",
    name: "Save Circles",
    description: "Allows user to save circles",
    category: PermissionCategory.GIS_TOOLS,
    module: "circle",
    action: "save",
    isSystemPermission: true
  },
  {
    id: "gis.circle.delete.own",
    name: "Delete Own Circles",
    description: "Allows user to delete their own circles",
    category: PermissionCategory.GIS_TOOLS,
    module: "circle",
    action: "delete.own",
    isSystemPermission: true
  },
  {
    id: "gis.circle.delete.any",
    name: "Delete Any Circles",
    description: "Allows user to delete any circle",
    category: PermissionCategory.GIS_TOOLS,
    module: "circle",
    action: "delete.any",
    isSystemPermission: true
  },
  {
    id: "gis.elevation.use",
    name: "Use Elevation Tool",
    description: "Allows user to use the elevation profile tool",
    category: PermissionCategory.GIS_TOOLS,
    module: "elevation",
    action: "use",
    isSystemPermission: true
  },
  {
    id: "gis.elevation.save",
    name: "Save Elevation Profiles",
    description: "Allows user to save elevation profiles",
    category: PermissionCategory.GIS_TOOLS,
    module: "elevation",
    action: "save",
    isSystemPermission: true
  },
  {
    id: "gis.elevation.delete.own",
    name: "Delete Own Elevation Profiles",
    description: "Allows user to delete their own elevation profiles",
    category: PermissionCategory.GIS_TOOLS,
    module: "elevation",
    action: "delete.own",
    isSystemPermission: true
  },
  {
    id: "gis.elevation.delete.any",
    name: "Delete Any Elevation Profiles",
    description: "Allows user to delete any elevation profile",
    category: PermissionCategory.GIS_TOOLS,
    module: "elevation",
    action: "delete.any",
    isSystemPermission: true
  },
  {
    id: "gis.infrastructure.use",
    name: "Use Infrastructure Tool",
    description: "Allows user to use the infrastructure management tool",
    category: PermissionCategory.GIS_TOOLS,
    module: "infrastructure",
    action: "use",
    isSystemPermission: true
  },
  {
    id: "gis.infrastructure.save",
    name: "Save Infrastructure",
    description: "Allows user to add/edit infrastructure",
    category: PermissionCategory.GIS_TOOLS,
    module: "infrastructure",
    action: "save",
    isSystemPermission: true
  },
  {
    id: "gis.infrastructure.delete.own",
    name: "Delete Own Infrastructure",
    description: "Allows user to delete their own infrastructure entries",
    category: PermissionCategory.GIS_TOOLS,
    module: "infrastructure",
    action: "delete.own",
    isSystemPermission: true
  },
  {
    id: "gis.infrastructure.delete.any",
    name: "Delete Any Infrastructure",
    description: "Allows user to delete any infrastructure entry",
    category: PermissionCategory.GIS_TOOLS,
    module: "infrastructure",
    action: "delete.any",
    isSystemPermission: true
  },
  {
    id: "gis.infrastructure.import",
    name: "Import KML Files",
    description: "Allows user to import KML files for infrastructure",
    category: PermissionCategory.GIS_TOOLS,
    module: "infrastructure",
    action: "import",
    isSystemPermission: true
  },

  // ===== Data Management =====
  {
    id: "data.view.own",
    name: "View Own Data",
    description: "Allows user to view their own saved data",
    category: PermissionCategory.DATA_MANAGEMENT,
    module: "data",
    action: "view.own",
    isSystemPermission: true
  },
  {
    id: "data.view.all",
    name: "View All Data",
    description: "Allows user to view all saved data",
    category: PermissionCategory.DATA_MANAGEMENT,
    module: "data",
    action: "view.all",
    isSystemPermission: true
  },
  {
    id: "data.edit.own",
    name: "Edit Own Data",
    description: "Allows user to edit their own data",
    category: PermissionCategory.DATA_MANAGEMENT,
    module: "data",
    action: "edit.own",
    isSystemPermission: true
  },
  {
    id: "data.edit.all",
    name: "Edit All Data",
    description: "Allows user to edit any data",
    category: PermissionCategory.DATA_MANAGEMENT,
    module: "data",
    action: "edit.all",
    isSystemPermission: true
  },
  {
    id: "data.delete.own",
    name: "Delete Own Data",
    description: "Allows user to delete their own data",
    category: PermissionCategory.DATA_MANAGEMENT,
    module: "data",
    action: "delete.own",
    isSystemPermission: true
  },
  {
    id: "data.delete.all",
    name: "Delete All Data",
    description: "Allows user to delete any data",
    category: PermissionCategory.DATA_MANAGEMENT,
    module: "data",
    action: "delete.all",
    isSystemPermission: true
  },
  {
    id: "data.export",
    name: "Export Data",
    description: "Allows user to export data to various formats",
    category: PermissionCategory.DATA_MANAGEMENT,
    module: "data",
    action: "export",
    isSystemPermission: true
  },

  // ===== User Management =====
  {
    id: "users.view",
    name: "View Users",
    description: "Allows user to view user list",
    category: PermissionCategory.USER_MANAGEMENT,
    module: "users",
    action: "view",
    isSystemPermission: true
  },
  {
    id: "users.create",
    name: "Create Users",
    description: "Allows user to create new users",
    category: PermissionCategory.USER_MANAGEMENT,
    module: "users",
    action: "create",
    isSystemPermission: true
  },
  {
    id: "users.edit",
    name: "Edit Users",
    description: "Allows user to edit user information",
    category: PermissionCategory.USER_MANAGEMENT,
    module: "users",
    action: "edit",
    isSystemPermission: true
  },
  {
    id: "users.delete",
    name: "Delete Users",
    description: "Allows user to delete users",
    category: PermissionCategory.USER_MANAGEMENT,
    module: "users",
    action: "delete",
    isSystemPermission: true
  },
  {
    id: "users.assign_regions",
    name: "Assign Regions to Users",
    description: "Allows user to assign regions to users",
    category: PermissionCategory.USER_MANAGEMENT,
    module: "users",
    action: "assign_regions",
    isSystemPermission: true
  },
  {
    id: "users.assign_groups",
    name: "Assign Groups to Users",
    description: "Allows user to add users to groups",
    category: PermissionCategory.USER_MANAGEMENT,
    module: "users",
    action: "assign_groups",
    isSystemPermission: true
  },

  // ===== Group Management =====
  {
    id: "groups.view",
    name: "View Groups",
    description: "Allows user to view user groups",
    category: PermissionCategory.GROUP_MANAGEMENT,
    module: "groups",
    action: "view",
    isSystemPermission: true
  },
  {
    id: "groups.create",
    name: "Create Groups",
    description: "Allows user to create new groups",
    category: PermissionCategory.GROUP_MANAGEMENT,
    module: "groups",
    action: "create",
    isSystemPermission: true
  },
  {
    id: "groups.edit",
    name: "Edit Groups",
    description: "Allows user to edit group details",
    category: PermissionCategory.GROUP_MANAGEMENT,
    module: "groups",
    action: "edit",
    isSystemPermission: true
  },
  {
    id: "groups.delete",
    name: "Delete Groups",
    description: "Allows user to delete groups",
    category: PermissionCategory.GROUP_MANAGEMENT,
    module: "groups",
    action: "delete",
    isSystemPermission: true
  },

  // ===== Settings =====
  {
    id: "settings.view",
    name: "View Settings",
    description: "Allows user to view application settings",
    category: PermissionCategory.SETTINGS,
    module: "settings",
    action: "view",
    isSystemPermission: true
  },
  {
    id: "settings.boundary.edit",
    name: "Edit Boundary Settings",
    description: "Allows user to edit boundary visualization settings",
    category: PermissionCategory.SETTINGS,
    module: "settings",
    action: "boundary.edit",
    isSystemPermission: true
  },
  {
    id: "settings.map.edit",
    name: "Edit Map Settings",
    description: "Allows user to edit map settings",
    category: PermissionCategory.SETTINGS,
    module: "settings",
    action: "map.edit",
    isSystemPermission: true
  },

  // ===== Search & Navigation =====
  {
    id: "search.use",
    name: "Use Search",
    description: "Allows user to use global search functionality",
    category: PermissionCategory.SEARCH,
    module: "search",
    action: "use",
    isSystemPermission: true
  },
  {
    id: "search.history.view",
    name: "View Search History",
    description: "Allows user to view search history",
    category: PermissionCategory.SEARCH,
    module: "search",
    action: "history.view",
    isSystemPermission: true
  },
  {
    id: "bookmarks.create",
    name: "Create Bookmarks",
    description: "Allows user to create location bookmarks",
    category: PermissionCategory.SEARCH,
    module: "bookmarks",
    action: "create",
    isSystemPermission: true
  }
];

// ===== Default Permission Sets by Role =====
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  Admin: ["*"], // Wildcard - all permissions

  Manager: [
    // GIS Tools - Full access
    "gis.distance.use",
    "gis.distance.save",
    "gis.distance.delete.any",
    "gis.polygon.use",
    "gis.polygon.save",
    "gis.polygon.delete.any",
    "gis.circle.use",
    "gis.circle.save",
    "gis.circle.delete.any",
    "gis.elevation.use",
    "gis.elevation.save",
    "gis.elevation.delete.any",
    "gis.infrastructure.use",
    "gis.infrastructure.save",
    "gis.infrastructure.delete.any",
    "gis.infrastructure.import",

    // Data Management
    "data.view.all",
    "data.edit.all",
    "data.delete.all",
    "data.export",

    // User Management - Limited
    "users.view",
    "users.edit",
    "users.assign_regions",
    "users.assign_groups",

    // Group Management
    "groups.view",

    // Settings
    "settings.view",
    "settings.boundary.edit",
    "settings.map.edit",

    // Search
    "search.use",
    "search.history.view",
    "bookmarks.create"
  ],

  Technician: [
    // GIS Tools - Own data only
    "gis.distance.use",
    "gis.distance.save",
    "gis.distance.delete.own",
    "gis.polygon.use",
    "gis.polygon.save",
    "gis.polygon.delete.own",
    "gis.circle.use",
    "gis.circle.save",
    "gis.circle.delete.own",
    "gis.elevation.use",
    "gis.elevation.save",
    "gis.elevation.delete.own",
    "gis.infrastructure.use",
    "gis.infrastructure.save",
    "gis.infrastructure.delete.own",

    // Data Management - Own only
    "data.view.own",
    "data.edit.own",
    "data.delete.own",

    // Settings - View only
    "settings.view",

    // Search
    "search.use",
    "bookmarks.create"
  ],

  User: [
    // GIS Tools - Basic tools only
    "gis.distance.use",
    "gis.polygon.use",
    "gis.circle.use",

    // Data Management - View own only
    "data.view.own",

    // Search
    "search.use"
  ]
};
