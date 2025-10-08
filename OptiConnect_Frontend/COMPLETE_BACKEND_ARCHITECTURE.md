# Complete Backend Architecture for PersonalGIS Platform

## 🏗️ Architecture Overview

**Technology Stack:**

- **Backend Framework:** Node.js + Express.js
- **Database:** MySQL (Already installed in your VM)
- **Authentication:** JWT (JSON Web Tokens)
- **API Style:** RESTful API
- **Security:** bcrypt for password hashing, JWT for sessions

---

## 📊 MySQL Database Schemas

### 1. **users** Table

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'viewer', 'engineer') NOT NULL DEFAULT 'viewer',
  phone VARCHAR(20),
  department VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  is_email_verified BOOLEAN DEFAULT false,
  last_login DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_role (role)
);
```

### 2. **regions** Table

```sql
CREATE TABLE regions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  type ENUM('country', 'state', 'district', 'zone', 'custom') NOT NULL,
  parent_region_id INT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  boundary_geojson TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_region_id) REFERENCES regions(id) ON DELETE SET NULL,
  INDEX idx_code (code),
  INDEX idx_type (type),
  INDEX idx_parent (parent_region_id)
);
```

### 3. **user_regions** Table (User-Region Assignment)

```sql
CREATE TABLE user_regions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  region_id INT NOT NULL,
  access_level ENUM('read', 'write', 'admin') DEFAULT 'read',
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by INT,
  expires_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_user_region (user_id, region_id),
  INDEX idx_user_id (user_id),
  INDEX idx_region_id (region_id)
);
```

### 4. **permissions** Table

```sql
CREATE TABLE permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  code VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. **role_permissions** Table

```sql
CREATE TABLE role_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role ENUM('admin', 'manager', 'viewer', 'engineer') NOT NULL,
  permission_id INT NOT NULL,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_role_permission (role, permission_id)
);
```

### 6. **user_permissions** Table (Override permissions)

```sql
CREATE TABLE user_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  permission_id INT NOT NULL,
  granted BOOLEAN DEFAULT true,
  granted_by INT,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_user_permission (user_id, permission_id)
);
```

### 7. **groups** Table

```sql
CREATE TABLE `groups` (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_name (name)
);
```

### 8. **group_members** Table

```sql
CREATE TABLE `usergroup_members` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('owner','admin','member') NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  added_by INT NULL,
  UNIQUE KEY unique_group_user (group_id, user_id),
  FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES `users`(id) ON DELETE CASCADE,
  FOREIGN KEY (added_by) REFERENCES `users`(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 9. **gis_features** Table (Infrastructure/Markers)

```sql
CREATE TABLE gis_features (
  id INT PRIMARY KEY AUTO_INCREMENT,
  feature_type ENUM('tower', 'pole', 'marker', 'polygon', 'polyline', 'circle', 'sector') NOT NULL,
  name VARCHAR(255),
  description TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  geometry_geojson TEXT,
  properties JSON,
  region_id INT,
  created_by INT,
  updated_by INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_feature_type (feature_type),
  INDEX idx_region_id (region_id),
  INDEX idx_created_by (created_by)
);
```

### 10. **bookmarks** Table

```sql
CREATE TABLE bookmarks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  zoom_level INT DEFAULT 10,
  map_type VARCHAR(50),
  tags JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);
```

### 11. **search_history** Table

```sql
CREATE TABLE search_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  search_query VARCHAR(500) NOT NULL,
  search_type ENUM('address', 'coordinates', 'feature', 'user', 'region') NOT NULL,
  result_count INT DEFAULT 0,
  searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_searched_at (searched_at)
);
```

### 12. **audit_logs** Table

```sql
CREATE TABLE audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id INT,
  details JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
);
```

### 13. **analytics_metrics** Table

```sql
CREATE TABLE analytics_metrics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  metric_type VARCHAR(100) NOT NULL,
  metric_name VARCHAR(255) NOT NULL,
  metric_value DECIMAL(15, 2),
  dimension JSON,
  region_id INT,
  user_id INT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_metric_type (metric_type),
  INDEX idx_recorded_at (recorded_at)
);
```

### 14. **temporary_access** Table

```sql
CREATE TABLE temporary_access (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id INT NOT NULL,
  access_level VARCHAR(50) DEFAULT 'read',
  reason TEXT,
  granted_by INT,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  revoked_by INT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);
```

### 15. **region_requests** Table

```sql
CREATE TABLE region_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  region_id INT NOT NULL,
  request_type ENUM('access', 'modification', 'creation') NOT NULL,
  reason TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INT,
  reviewed_at DATETIME,
  review_notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);
```

---

## 🔌 Complete API Endpoints List

### **A. Authentication APIs** (`/api/auth`)

| Method | Endpoint                    | Purpose                   | Request Body                                     | Response          |
| ------ | --------------------------- | ------------------------- | ------------------------------------------------ | ----------------- |
| POST   | `/api/auth/register`        | Register new user         | `{ username, email, password, full_name, role }` | `{ token, user }` |
| POST   | `/api/auth/login`           | Login user                | `{ email, password }`                            | `{ token, user }` |
| POST   | `/api/auth/logout`          | Logout user               | -                                                | `{ message }`     |
| GET    | `/api/auth/me`              | Get current user          | -                                                | `{ user }`        |
| POST   | `/api/auth/refresh`         | Refresh JWT token         | `{ refreshToken }`                               | `{ token }`       |
| POST   | `/api/auth/forgot-password` | Send password reset email | `{ email }`                                      | `{ message }`     |
| POST   | `/api/auth/reset-password`  | Reset password            | `{ token, newPassword }`                         | `{ message }`     |
| POST   | `/api/auth/change-password` | Change password           | `{ oldPassword, newPassword }`                   | `{ message }`     |

### **B. User Management APIs** (`/api/users`)

| Method | Endpoint                                   | Purpose                   | Request Body                                     | Response                   |
| ------ | ------------------------------------------ | ------------------------- | ------------------------------------------------ | -------------------------- |
| GET    | `/api/users`                               | Get all users (paginated) | Query: `page, limit, search, role`               | `{ users[], total, page }` |
| GET    | `/api/users/:id`                           | Get user by ID            | -                                                | `{ user }`                 |
| POST   | `/api/users`                               | Create new user           | `{ username, email, password, full_name, role }` | `{ user }`                 |
| PUT    | `/api/users/:id`                           | Update user               | `{ full_name, role, phone, department }`         | `{ user }`                 |
| DELETE | `/api/users/:id`                           | Delete user               | -                                                | `{ message }`              |
| PATCH  | `/api/users/:id/activate`                  | Activate user             | -                                                | `{ user }`                 |
| PATCH  | `/api/users/:id/deactivate`                | Deactivate user           | -                                                | `{ user }`                 |
| GET    | `/api/users/:id/permissions`               | Get user permissions      | -                                                | `{ permissions[] }`        |
| POST   | `/api/users/:id/permissions`               | Grant permission          | `{ permissionId, expiresAt }`                    | `{ message }`              |
| DELETE | `/api/users/:id/permissions/:permissionId` | Revoke permission         | -                                                | `{ message }`              |
| GET    | `/api/users/:id/regions`                   | Get user regions          | -                                                | `{ regions[] }`            |
| POST   | `/api/users/:id/regions`                   | Assign region             | `{ regionId, accessLevel }`                      | `{ message }`              |
| DELETE | `/api/users/:id/regions/:regionId`         | Unassign region           | -                                                | `{ message }`              |

### **C. Region Management APIs** (`/api/regions`)

| Method | Endpoint                    | Purpose              | Request Body                                     | Response        |
| ------ | --------------------------- | -------------------- | ------------------------------------------------ | --------------- |
| GET    | `/api/regions`              | Get all regions      | Query: `type, parentId`                          | `{ regions[] }` |
| GET    | `/api/regions/:id`          | Get region by ID     | -                                                | `{ region }`    |
| POST   | `/api/regions`              | Create region        | `{ name, code, type, parentRegionId, boundary }` | `{ region }`    |
| PUT    | `/api/regions/:id`          | Update region        | `{ name, description, boundary }`                | `{ region }`    |
| DELETE | `/api/regions/:id`          | Delete region        | -                                                | `{ message }`   |
| GET    | `/api/regions/:id/children` | Get child regions    | -                                                | `{ regions[] }` |
| GET    | `/api/regions/:id/users`    | Get users in region  | -                                                | `{ users[] }`   |
| GET    | `/api/regions/hierarchy`    | Get region hierarchy | -                                                | `{ hierarchy }` |

### **D. Group Management APIs** (`/api/groups`)

| Method | Endpoint                          | Purpose            | Request Body            | Response              |
| ------ | --------------------------------- | ------------------ | ----------------------- | --------------------- |
| GET    | `/api/groups`                     | Get all groups     | Query: `page, limit`    | `{ groups[], total }` |
| GET    | `/api/groups/:id`                 | Get group by ID    | -                       | `{ group }`           |
| POST   | `/api/groups`                     | Create group       | `{ name, description }` | `{ group }`           |
| PUT    | `/api/groups/:id`                 | Update group       | `{ name, description }` | `{ group }`           |
| DELETE | `/api/groups/:id`                 | Delete group       | -                       | `{ message }`         |
| GET    | `/api/groups/:id/members`         | Get group members  | -                       | `{ members[] }`       |
| POST   | `/api/groups/:id/members`         | Add member         | `{ userId, role }`      | `{ message }`         |
| DELETE | `/api/groups/:id/members/:userId` | Remove member      | -                       | `{ message }`         |
| PATCH  | `/api/groups/:id/members/:userId` | Update member role | `{ role }`              | `{ message }`         |

### **E. GIS Features APIs** (`/api/features`)

| Method | Endpoint                         | Purpose                | Request Body                                     | Response         |
| ------ | -------------------------------- | ---------------------- | ------------------------------------------------ | ---------------- |
| GET    | `/api/features`                  | Get all features       | Query: `type, regionId, bounds`                  | `{ features[] }` |
| GET    | `/api/features/:id`              | Get feature by ID      | -                                                | `{ feature }`    |
| POST   | `/api/features`                  | Create feature         | `{ type, name, geometry, properties, regionId }` | `{ feature }`    |
| PUT    | `/api/features/:id`              | Update feature         | `{ name, geometry, properties }`                 | `{ feature }`    |
| DELETE | `/api/features/:id`              | Delete feature         | -                                                | `{ message }`    |
| GET    | `/api/features/nearby`           | Find nearby features   | Query: `lat, lng, radius`                        | `{ features[] }` |
| GET    | `/api/features/region/:regionId` | Get features by region | -                                                | `{ features[] }` |

### **F. Bookmarks APIs** (`/api/bookmarks`)

| Method | Endpoint             | Purpose            | Request Body                                            | Response          |
| ------ | -------------------- | ------------------ | ------------------------------------------------------- | ----------------- |
| GET    | `/api/bookmarks`     | Get user bookmarks | -                                                       | `{ bookmarks[] }` |
| POST   | `/api/bookmarks`     | Create bookmark    | `{ name, latitude, longitude, zoomLevel, description }` | `{ bookmark }`    |
| PUT    | `/api/bookmarks/:id` | Update bookmark    | `{ name, description }`                                 | `{ bookmark }`    |
| DELETE | `/api/bookmarks/:id` | Delete bookmark    | -                                                       | `{ message }`     |

### **G. Search APIs** (`/api/search`)

| Method | Endpoint                  | Purpose             | Request Body     | Response         |
| ------ | ------------------------- | ------------------- | ---------------- | ---------------- |
| GET    | `/api/search/global`      | Global search       | Query: `q, type` | `{ results[] }`  |
| GET    | `/api/search/users`       | Search users        | Query: `q`       | `{ users[] }`    |
| GET    | `/api/search/regions`     | Search regions      | Query: `q`       | `{ regions[] }`  |
| GET    | `/api/search/features`    | Search features     | Query: `q`       | `{ features[] }` |
| GET    | `/api/search/history`     | Get search history  | -                | `{ history[] }`  |
| DELETE | `/api/search/history/:id` | Delete search entry | -                | `{ message }`    |

### **H. Analytics APIs** (`/api/analytics`)

| Method | Endpoint                   | Purpose               | Request Body                | Response      |
| ------ | -------------------------- | --------------------- | --------------------------- | ------------- |
| GET    | `/api/analytics/dashboard` | Get dashboard metrics | Query: `startDate, endDate` | `{ metrics }` |
| GET    | `/api/analytics/users`     | User analytics        | Query: `startDate, endDate` | `{ data }`    |
| GET    | `/api/analytics/regions`   | Region analytics      | Query: `regionId`           | `{ data }`    |
| GET    | `/api/analytics/features`  | Feature analytics     | -                           | `{ data }`    |
| POST   | `/api/analytics/track`     | Track custom event    | `{ eventType, eventData }`  | `{ message }` |

### **I. Audit Logs APIs** (`/api/audit`)

| Method | Endpoint                  | Purpose           | Request Body                                | Response     |
| ------ | ------------------------- | ----------------- | ------------------------------------------- | ------------ |
| GET    | `/api/audit/logs`         | Get audit logs    | Query: `userId, action, startDate, endDate` | `{ logs[] }` |
| GET    | `/api/audit/logs/:id`     | Get log by ID     | -                                           | `{ log }`    |
| GET    | `/api/audit/user/:userId` | Get user activity | -                                           | `{ logs[] }` |

### **J. Temporary Access APIs** (`/api/temporary-access`)

| Method | Endpoint                    | Purpose                  | Request Body                                      | Response         |
| ------ | --------------------------- | ------------------------ | ------------------------------------------------- | ---------------- |
| GET    | `/api/temporary-access`     | Get all temporary access | -                                                 | `{ accesses[] }` |
| POST   | `/api/temporary-access`     | Grant temporary access   | `{ userId, resourceType, resourceId, expiresAt }` | `{ access }`     |
| DELETE | `/api/temporary-access/:id` | Revoke access            | -                                                 | `{ message }`    |

### **K. Region Requests APIs** (`/api/region-requests`)

| Method | Endpoint                           | Purpose          | Request Body                        | Response         |
| ------ | ---------------------------------- | ---------------- | ----------------------------------- | ---------------- |
| GET    | `/api/region-requests`             | Get all requests | Query: `status`                     | `{ requests[] }` |
| POST   | `/api/region-requests`             | Create request   | `{ regionId, requestType, reason }` | `{ request }`    |
| PATCH  | `/api/region-requests/:id/approve` | Approve request  | `{ notes }`                         | `{ request }`    |
| PATCH  | `/api/region-requests/:id/reject`  | Reject request   | `{ notes }`                         | `{ request }`    |

---

## 📁 Backend Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # MySQL connection
│   │   ├── env.js               # Environment variables
│   │   └── constants.js         # App constants
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── authorize.js         # Permission checks
│   │   ├── regionAccess.js      # Region-based access
│   │   ├── errorHandler.js      # Error handling
│   │   ├── validator.js         # Request validation
│   │   └── rateLimiter.js       # Rate limiting
│   ├── models/
│   │   ├── User.js
│   │   ├── Region.js
│   │   ├── Group.js
│   │   ├── GISFeature.js
│   │   ├── Bookmark.js
│   │   └── ... (all models)
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── region.routes.js
│   │   ├── group.routes.js
│   │   ├── feature.routes.js
│   │   ├── bookmark.routes.js
│   │   ├── search.routes.js
│   │   ├── analytics.routes.js
│   │   └── ... (all routes)
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── regionController.js
│   │   └── ... (all controllers)
│   ├── services/
│   │   ├── authService.js
│   │   ├── emailService.js
│   │   ├── permissionService.js
│   │   ├── regionService.js
│   │   └── ... (business logic)
│   ├── utils/
│   │   ├── jwt.js               # JWT utilities
│   │   ├── bcrypt.js            # Password hashing
│   │   ├── logger.js            # Logging
│   │   └── validation.js        # Validation helpers
│   ├── app.js                   # Express app setup
│   └── server.js                # Server entry point
├── .env                         # Environment variables
├── package.json
└── README.md
```

---

## 🔗 Frontend Integration Points

### **Where to Add API Calls in Frontend:**

#### 1. **Authentication** (`src/contexts/AuthContext.tsx`)

```typescript
// Replace mock authentication with real API calls
import { authAPI } from "../services/apiService";

const login = async (credentials) => {
  const response = await authAPI.login(credentials);
  // Store token and user data
};
```

#### 2. **User Management** (`src/services/userService.ts`)

```typescript
// All user CRUD operations
export const userService = {
  getUsers: () => api.get("/api/users"),
  getUser: (id) => api.get(`/api/users/${id}`),
  createUser: (data) => api.post("/api/users", data),
  updateUser: (id, data) => api.put(`/api/users/${id}`, data),
  deleteUser: (id) => api.delete(`/api/users/${id}`)
};
```

#### 3. **Region Management** (`src/services/regionService.ts`)

Already exists, needs to connect to real API

#### 4. **GIS Features** (Create new: `src/services/featureService.ts`)

```typescript
export const featureService = {
  getFeatures: (params) => api.get("/api/features", { params }),
  createFeature: (data) => api.post("/api/features", data),
  updateFeature: (id, data) => api.put(`/api/features/${id}`, data),
  deleteFeature: (id) => api.delete(`/api/features/${id}`)
};
```

#### 5. **Update `src/services/apiService.ts`**

```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Add JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 🚀 Implementation Steps

### **Step 1: Setup Backend (5-7 days)**

1. Initialize Node.js project
2. Install dependencies (express, mysql2, jsonwebtoken, bcrypt, cors)
3. Create all database tables
4. Implement authentication APIs
5. Test with Postman

### **Step 2: Core APIs (7-10 days)**

1. User management APIs
2. Region management APIs
3. Permission system APIs
4. Group management APIs

### **Step 3: GIS Features (5-7 days)**

1. Feature CRUD APIs
2. Spatial queries
3. Bookmark APIs

### **Step 4: Advanced Features (7-10 days)**

1. Search APIs
2. Analytics APIs
3. Audit logging
4. Temporary access

### **Step 5: Frontend Integration (5-7 days)**

1. Update apiService.ts
2. Connect AuthContext
3. Update all existing services
4. Test complete flow

### **Step 6: Testing & Deployment (3-5 days)**

1. Integration testing
2. Performance testing
3. Security audit
4. Deploy to VM server

---

## 🔐 Security Implementation

1. **Password Security:** bcrypt with salt rounds
2. **JWT Tokens:** Access token (15min) + Refresh token (7 days)
3. **CORS:** Whitelist frontend domain
4. **Rate Limiting:** Prevent brute force attacks
5. **Input Validation:** Validate all inputs
6. **SQL Injection Prevention:** Use parameterized queries
7. **Region-Based Access:** Check user region before data access

---

## 📝 Next Steps

**What do you want to do first?**

1. ✅ **Start creating the backend?** (I'll create backend code structure)
2. ✅ **Create SQL migration files?** (I'll create all table creation scripts)
3. ✅ **Setup API integration in frontend?** (I'll update apiService.ts)
4. ✅ **All of the above step by step?**

Let me know, and I'll start implementing!
