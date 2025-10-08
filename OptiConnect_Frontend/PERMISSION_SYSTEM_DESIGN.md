# User Groups & Permission Matrix - System Design

## Overview
This document outlines the design for implementing a comprehensive User Groups and Permission Matrix system for the PersonalGIS platform.

---

## 1. Data Models

### 1.1 Permission Definition
```typescript
interface PermissionDefinition {
  id: string;                    // "gis.distance.use"
  name: string;                  // "Use Distance Tool"
  description: string;           // "Allows user to use distance measurement tool"
  category: PermissionCategory;  // "GIS Tools", "Data Management", etc.
  module: string;                // "distance", "polygon", "users"
  action: string;                // "use", "save", "delete", "edit", "view"
  isSystemPermission: boolean;   // Cannot be deleted
  conditions?: PermissionCondition[];
  createdAt: Date;
  updatedAt: Date;
}

enum PermissionCategory {
  GIS_TOOLS = "GIS Tools",
  DATA_MANAGEMENT = "Data Management",
  USER_MANAGEMENT = "User Management",
  SETTINGS = "Settings",
  SEARCH = "Search & Navigation",
  ANALYTICS = "Analytics & Reports"
}
```

### 1.2 User Group
```typescript
interface UserGroup {
  id: string;
  name: string;                  // "Field Engineers - North"
  description: string;
  permissions: string[];         // Permission IDs
  assignedRegions: string[];     // Regions inherited by members
  members: string[];             // User IDs
  managers: string[];            // User IDs who can manage this group
  parentGroup?: string;          // For hierarchical groups
  isActive: boolean;
  metadata: {
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    lastModifiedBy: string;
  };
}
```

### 1.3 Permission Condition
```typescript
interface PermissionCondition {
  type: ConditionType;
  config: Record<string, any>;
}

enum ConditionType {
  REGION = "region",           // Must be in assigned region
  TIME = "time",               // Active during specific hours
  RESOURCE_OWNER = "owner",    // Only own resources
  QUOTA = "quota",             // Max number of actions
  HIERARCHY = "hierarchy"      // Based on organizational hierarchy
}

// Examples:
{
  type: "region",
  config: {
    requireAssignedRegion: true
  }
}

{
  type: "time",
  config: {
    startTime: "09:00",
    endTime: "18:00",
    timezone: "Asia/Kolkata",
    weekdays: [1, 2, 3, 4, 5]  // Monday-Friday
  }
}

{
  type: "owner",
  config: {
    allowOwnOnly: true,
    allowTeamMembers: false
  }
}

{
  type: "quota",
  config: {
    maxPerDay: 100,
    maxPerMonth: 1000
  }
}
```

### 1.4 Updated User Type
```typescript
interface User {
  // ... existing fields ...
  role: 'Admin' | 'Manager' | 'Technician' | 'User';
  permissions: string[];         // Direct permissions
  groups: string[];              // Group IDs user belongs to
  assignedRegions: string[];     // Direct region assignments
  effectivePermissions?: string[]; // Computed: direct + group permissions
  permissionOverrides?: {
    grant: string[];             // Additional permissions
    deny: string[];              // Explicitly denied permissions
  };
}
```

---

## 2. Permission Categories & List

### 2.1 GIS Tools Permissions
```
✓ gis.distance.use              - Use Distance Measurement Tool
✓ gis.distance.save             - Save distance measurements
✓ gis.distance.delete.own       - Delete own measurements
✓ gis.distance.delete.any       - Delete any measurements
✓ gis.distance.export           - Export distance data

✓ gis.polygon.use               - Use Polygon Drawing Tool
✓ gis.polygon.save              - Save polygons
✓ gis.polygon.delete.own        - Delete own polygons
✓ gis.polygon.delete.any        - Delete any polygons
✓ gis.polygon.export            - Export polygon data

✓ gis.circle.use                - Use Circle/Radius Tool
✓ gis.circle.save               - Save circles
✓ gis.circle.delete.own         - Delete own circles
✓ gis.circle.delete.any         - Delete any circles
✓ gis.circle.export             - Export circle data

✓ gis.elevation.use             - Use Elevation Profile Tool
✓ gis.elevation.save            - Save elevation profiles
✓ gis.elevation.delete.own      - Delete own profiles
✓ gis.elevation.delete.any      - Delete any profiles
✓ gis.elevation.export          - Export elevation data

✓ gis.infrastructure.use        - Use Infrastructure Management Tool
✓ gis.infrastructure.save       - Add/Edit infrastructure
✓ gis.infrastructure.delete.own - Delete own infrastructure
✓ gis.infrastructure.delete.any - Delete any infrastructure
✓ gis.infrastructure.import     - Import KML files
✓ gis.infrastructure.export     - Export infrastructure data

✓ gis.*.use                     - Use all GIS tools (wildcard)
✓ gis.*.save                    - Save from all GIS tools
```

### 2.2 Data Management Permissions
```
✓ data.view.own                 - View own saved data
✓ data.view.team                - View team's saved data
✓ data.view.all                 - View all saved data
✓ data.edit.own                 - Edit own data
✓ data.edit.team                - Edit team's data
✓ data.edit.all                 - Edit all data
✓ data.delete.own               - Delete own data
✓ data.delete.team              - Delete team's data
✓ data.delete.all               - Delete all data
✓ data.export                   - Export data to various formats
✓ data.import                   - Import data
✓ data.share                    - Share data with others
```

### 2.3 User Management Permissions
```
✓ users.view                    - View user list
✓ users.create                  - Create new users
✓ users.edit.basic              - Edit basic user info
✓ users.edit.permissions        - Edit user permissions
✓ users.edit.regions            - Assign regions to users
✓ users.delete                  - Delete users
✓ users.assign_groups           - Add users to groups
✓ users.impersonate             - Login as another user (Admin only)
```

### 2.4 Group Management Permissions
```
✓ groups.view                   - View groups
✓ groups.create                 - Create new groups
✓ groups.edit                   - Edit group details
✓ groups.delete                 - Delete groups
✓ groups.assign_permissions     - Assign permissions to groups
✓ groups.assign_members         - Add/remove group members
✓ groups.assign_regions         - Assign regions to groups
```

### 2.5 Settings Permissions
```
✓ settings.view                 - View settings
✓ settings.boundary.edit        - Edit boundary settings
✓ settings.map.edit             - Edit map settings
✓ settings.system.edit          - Edit system settings (Admin only)
```

### 2.6 Search & Navigation Permissions
```
✓ search.use                    - Use global search
✓ search.history.view           - View search history
✓ search.advanced               - Use advanced search filters
✓ bookmarks.create              - Create bookmarks
✓ bookmarks.share               - Share bookmarks
```

### 2.7 Analytics & Reports Permissions
```
✓ analytics.view                - View analytics dashboard
✓ analytics.export              - Export analytics reports
✓ reports.generate              - Generate custom reports
✓ reports.schedule              - Schedule automated reports
```

---

## 3. Permission Hierarchy & Inheritance

### 3.1 Permission Resolution Order
```
1. Admin Role Override → Always has ALL permissions
2. Explicit DENY in permissionOverrides.deny → Blocks permission
3. Explicit GRANT in permissionOverrides.grant → Grants permission
4. Group Permissions → Inherited from all groups user belongs to
5. Direct User Permissions → User's own permissions
6. Default Role Permissions → Based on role (Manager, Technician, User)
```

### 3.2 Wildcard Support
```
gis.*               → All GIS-related permissions
gis.*.use           → Use all GIS tools
gis.*.delete.any    → Delete any data from all GIS tools
data.*              → All data management permissions
*                   → ALL permissions (Admin only)
```

---

## 4. Backend API Design

### 4.1 Permission Endpoints
```
GET    /api/permissions                  - List all permissions
GET    /api/permissions/categories       - Get permission categories
POST   /api/permissions                  - Create custom permission (Admin)
PUT    /api/permissions/:id              - Update permission
DELETE /api/permissions/:id              - Delete permission
GET    /api/permissions/check            - Check if user has permission
POST   /api/permissions/bulk-check       - Check multiple permissions
```

### 4.2 User Group Endpoints
```
GET    /api/groups                       - List all groups
GET    /api/groups/:id                   - Get group details
POST   /api/groups                       - Create group
PUT    /api/groups/:id                   - Update group
DELETE /api/groups/:id                   - Delete group
POST   /api/groups/:id/members           - Add members to group
DELETE /api/groups/:id/members/:userId   - Remove member from group
PUT    /api/groups/:id/permissions       - Update group permissions
PUT    /api/groups/:id/regions           - Update group regions
```

### 4.3 User Permission Endpoints
```
GET    /api/users/:id/permissions        - Get user's effective permissions
PUT    /api/users/:id/permissions        - Update user's direct permissions
POST   /api/users/:id/permissions/grant  - Grant additional permissions
POST   /api/users/:id/permissions/deny   - Explicitly deny permissions
GET    /api/users/:id/groups             - Get user's groups
```

---

## 5. Frontend Components

### 5.1 New Pages/Components
```
1. User Groups Management Page
   - /administration/groups
   - List groups, create/edit/delete
   - Assign permissions and members

2. Permission Matrix View
   - /administration/permissions
   - Table view: Rows=Groups/Roles, Columns=Permissions
   - Bulk assignment interface

3. User Permissions Tab
   - In User Management → User Details
   - Shows effective permissions
   - Override interface

4. Group Details Page
   - /administration/groups/:id
   - Members list
   - Permissions list
   - Region assignments
   - Audit log
```

### 5.2 Utility Components
```typescript
// RequirePermission HOC
<RequirePermission permission="gis.distance.save" fallback={<>Access Denied</>}>
  <SaveButton />
</RequirePermission>

// usePermission Hook
const { hasPermission, checkPermission } = usePermission();
if (hasPermission('data.delete.own')) {
  // Show delete button
}

// PermissionGate Component
<PermissionGate
  permission="users.create"
  condition={{ type: 'region', requireAssignedRegion: true }}
>
  <CreateUserButton />
</PermissionGate>
```

---

## 6. Integration Points

### 6.1 GIS Tools Integration
```typescript
// Before allowing tool usage
if (!checkPermission(user, 'gis.distance.use')) {
  showError('You do not have permission to use this tool');
  return;
}

// Before saving data
if (!checkPermission(user, 'gis.distance.save')) {
  disableSaveButton();
}

// Before deleting (with condition)
const canDelete = await checkPermission(
  user,
  'gis.distance.delete.any'
) || (
  await checkPermission(user, 'gis.distance.delete.own') &&
  isOwner(item, user)
);
```

### 6.2 Navigation Integration
```typescript
// Hide menu items based on permissions
{hasPermission('users.view') && (
  <MenuItem to="/administration/users">User Management</MenuItem>
)}

{hasPermission('groups.view') && (
  <MenuItem to="/administration/groups">User Groups</MenuItem>
)}

{hasPermission('data.view.all') && (
  <MenuItem to="/data-hub">Data Hub</MenuItem>
)}
```

### 6.3 Data Hub Integration
```typescript
// Filter visible data based on permissions
const data = await fetchData();
const visibleData = data.filter(item => {
  if (hasPermission('data.view.all')) return true;
  if (hasPermission('data.view.team') && isSameTeam(item.createdBy, user)) return true;
  if (hasPermission('data.view.own') && item.createdBy === user.id) return true;
  return false;
});
```

---

## 7. Conditional Permissions Implementation

### 7.1 Region-Based (Already Implemented)
```typescript
// Integrated with existing region enforcement
const regionCheck = await isPointInAssignedRegion(lat, lng, user);
if (!regionCheck.allowed) {
  // Deny access
}
```

### 7.2 Resource Ownership
```typescript
interface ResourcePermissionCheck {
  permission: string;
  resourceId: string;
  resourceType: 'distance' | 'polygon' | 'circle' | 'elevation' | 'infrastructure';
}

async function checkResourcePermission(
  user: User,
  check: ResourcePermissionCheck
): Promise<boolean> {
  // Check if user has .any permission
  if (hasPermission(user, `${check.resourceType}.delete.any`)) {
    return true;
  }

  // Check if user has .own permission and owns resource
  if (hasPermission(user, `${check.resourceType}.delete.own`)) {
    const resource = await fetchResource(check.resourceId, check.resourceType);
    return resource.createdBy === user.id;
  }

  // Check if user has .team permission and resource is from team
  if (hasPermission(user, `${check.resourceType}.delete.team`)) {
    const resource = await fetchResource(check.resourceId, check.resourceType);
    return isSameTeam(resource.createdBy, user);
  }

  return false;
}
```

### 7.3 Time-Based
```typescript
function checkTimeCondition(condition: PermissionCondition): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentDay = now.getDay(); // 0 = Sunday

  const [startHour, startMin] = condition.config.startTime.split(':').map(Number);
  const [endHour, endMin] = condition.config.endTime.split(':').map(Number);

  const currentTime = currentHour * 60 + currentMinute;
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  if (currentTime < startTime || currentTime > endTime) {
    return false;
  }

  if (condition.config.weekdays && !condition.config.weekdays.includes(currentDay)) {
    return false;
  }

  return true;
}
```

---

## 8. Default Permission Sets

### 8.1 Admin Role (Full Access)
```
- * (all permissions via wildcard)
```

### 8.2 Manager Role
```
- gis.*.use
- gis.*.save
- gis.*.delete.team
- data.view.team
- data.edit.team
- data.delete.team
- data.export
- users.view
- users.edit.basic
- analytics.view
- search.use
```

### 8.3 Technician Role
```
- gis.*.use
- gis.*.save
- gis.*.delete.own
- data.view.own
- data.edit.own
- data.delete.own
- search.use
```

### 8.4 User Role (View Only)
```
- gis.distance.use
- gis.polygon.use
- gis.circle.use
- data.view.own
- search.use
```

---

## 9. Migration Strategy

### Phase 1: Backend Setup (Week 1-2)
- Create database schema
- Implement permission checking middleware
- Create API endpoints
- Seed default permissions

### Phase 2: Frontend Utilities (Week 2-3)
- Create permission checking utilities
- Create HOCs and hooks
- Update AuthContext with group permissions

### Phase 3: UI Components (Week 3-4)
- User Groups Management page
- Permission Matrix component
- Update User Management page

### Phase 4: Integration (Week 4-5)
- Integrate with GIS tools
- Integrate with Data Hub
- Update navigation
- Add permission checks everywhere

### Phase 5: Testing & Refinement (Week 5-6)
- Test all permission scenarios
- Performance optimization
- Documentation
- Admin training materials

---

## 10. Security Considerations

### 10.1 Backend Validation
- ✅ Always validate permissions on backend (never trust frontend)
- ✅ Use middleware for consistent permission checking
- ✅ Log all permission grants/denials for audit
- ✅ Rate limit permission check APIs

### 10.2 Frontend Best Practices
- ✅ Cache effective permissions in AuthContext
- ✅ Hide UI elements user cannot access
- ✅ Show appropriate error messages
- ✅ Refresh permissions on critical actions

### 10.3 Audit Trail
- ✅ Log who granted/revoked permissions
- ✅ Log when permissions were used
- ✅ Track permission changes over time
- ✅ Generate compliance reports

---

## 11. Performance Optimization

### 11.1 Caching Strategy
```typescript
// Cache user's effective permissions in AuthContext
interface AuthState {
  user: User;
  effectivePermissions: Set<string>; // For fast lookup
  permissionCache: Map<string, boolean>;
  cacheExpiry: Date;
}

// Refresh cache every 5 minutes or on permission changes
```

### 11.2 Lazy Loading
- Load full permission list only on admin pages
- Use pagination for large user groups
- Defer permission checks until action is triggered

---

## 12. Testing Strategy

### 12.1 Unit Tests
- Test permission resolution logic
- Test wildcard expansion
- Test condition evaluation
- Test ownership checks

### 12.2 Integration Tests
- Test permission inheritance from groups
- Test permission overrides
- Test API endpoints
- Test UI components

### 12.3 E2E Tests
- Test user workflows with different permission sets
- Test group management
- Test permission matrix updates

---

## Conclusion

This permission system provides:
- ✅ Granular access control
- ✅ Scalable group management
- ✅ Conditional permissions
- ✅ Backend-ready architecture
- ✅ Enterprise-grade security
- ✅ Audit compliance

**Ready for implementation with proper backend integration!**
