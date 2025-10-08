# 🌐 API HUB CENTER - Complete API Documentation

## 📡 Base URL
```
Production: http://your-vm-ip:5000/api
Development: http://localhost:5000/api
```

---

## 🔐 Authentication Header (Required for all APIs except login/register)
```javascript
Headers: {
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

---

# 📚 API Categories (120+ Endpoints)

## 1️⃣ AUTHENTICATION APIS (8 Endpoints)
**Base:** `/api/auth`

| # | Method | Endpoint | Purpose | Auth Required |
|---|--------|----------|---------|---------------|
| 1 | POST | `/register` | Register new user | ❌ No |
| 2 | POST | `/login` | Login user | ❌ No |
| 3 | POST | `/logout` | Logout user | ✅ Yes |
| 4 | GET | `/me` | Get current user | ✅ Yes |
| 5 | POST | `/refresh` | Refresh token | ✅ Yes |
| 6 | POST | `/forgot-password` | Request password reset | ❌ No |
| 7 | POST | `/reset-password` | Reset password | ❌ No |
| 8 | POST | `/change-password` | Change password | ✅ Yes |

---

## 2️⃣ USER MANAGEMENT APIS (12 Endpoints)
**Base:** `/api/users`

| # | Method | Endpoint | Purpose | User-Wise |
|---|--------|----------|---------|-----------|
| 9 | GET | `/` | Get all users | ✅ Region-filtered |
| 10 | GET | `/:id` | Get user by ID | ✅ Yes |
| 11 | POST | `/` | Create user | Admin only |
| 12 | PUT | `/:id` | Update user | ✅ Own or Admin |
| 13 | DELETE | `/:id` | Delete user | Admin only |
| 14 | PATCH | `/:id/activate` | Activate user | Admin only |
| 15 | PATCH | `/:id/deactivate` | Deactivate user | Admin only |
| 16 | GET | `/:id/permissions` | Get user permissions | ✅ Yes |
| 17 | POST | `/:id/permissions` | Grant permission | Admin only |
| 18 | DELETE | `/:id/permissions/:permissionId` | Revoke permission | Admin only |
| 19 | GET | `/:id/regions` | Get user regions | ✅ Yes |
| 20 | POST | `/:id/regions` | Assign region | Admin only |
| 21 | DELETE | `/:id/regions/:regionId` | Unassign region | Admin only |

---

## 3️⃣ REGION MANAGEMENT APIS (8 Endpoints)
**Base:** `/api/regions`

| # | Method | Endpoint | Purpose | User-Wise |
|---|--------|----------|---------|-----------|
| 22 | GET | `/` | Get all regions | ✅ User's regions only |
| 23 | GET | `/:id` | Get region by ID | ✅ If has access |
| 24 | POST | `/` | Create region | Admin only |
| 25 | PUT | `/:id` | Update region | Admin only |
| 26 | DELETE | `/:id` | Delete region | Admin only |
| 27 | GET | `/:id/children` | Get child regions | ✅ Yes |
| 28 | GET | `/:id/users` | Get region users | Manager+ |
| 29 | GET | `/hierarchy` | Get hierarchy tree | ✅ User's regions |

---

## 4️⃣ GROUP MANAGEMENT APIS (8 Endpoints)
**Base:** `/api/groups`

| # | Method | Endpoint | Purpose | User-Wise |
|---|--------|----------|---------|-----------|
| 30 | GET | `/` | Get all groups | ✅ User's groups |
| 31 | GET | `/:id` | Get group by ID | ✅ If member |
| 32 | POST | `/` | Create group | ✅ Yes |
| 33 | PUT | `/:id` | Update group | ✅ Owner/Admin |
| 34 | DELETE | `/:id` | Delete group | ✅ Owner only |
| 35 | GET | `/:id/members` | Get members | ✅ If member |
| 36 | POST | `/:id/members` | Add member | ✅ Owner/Admin |
| 37 | DELETE | `/:id/members/:userId` | Remove member | ✅ Owner/Admin |
| 38 | PATCH | `/:id/members/:userId` | Update member role | ✅ Owner only |

---

## 5️⃣ GIS FEATURES APIS (7 Endpoints)
**Base:** `/api/features`

| # | Method | Endpoint | Purpose | User-Wise |
|---|--------|----------|---------|-----------|
| 39 | GET | `/` | Get all features | ✅ User's regions |
| 40 | GET | `/:id` | Get feature by ID | ✅ Yes |
| 41 | POST | `/` | Create feature | ✅ Yes |
| 42 | PUT | `/:id` | Update feature | ✅ Owner or Admin |
| 43 | DELETE | `/:id` | Delete feature | ✅ Owner or Admin |
| 44 | GET | `/nearby` | Find nearby features | ✅ Region-filtered |
| 45 | GET | `/region/:regionId` | Get by region | ✅ If has access |

---

## 6️⃣ DISTANCE MEASUREMENT APIS (6 Endpoints) 📏
**Base:** `/api/measurements/distance`

| # | Method | Endpoint | Purpose | User-Wise |
|---|--------|----------|---------|-----------|
| 46 | GET | `/` | Get user's measurements | ✅ Yes |
| 47 | GET | `/:id` | Get specific measurement | ✅ Owner only |
| 48 | POST | `/` | Create measurement | ✅ Yes |
| 49 | PUT | `/:id` | Update measurement | ✅ Owner only |
| 50 | DELETE | `/:id` | Delete measurement | ✅ Owner only |
| 51 | GET | `/region/:regionId` | Get by region | ✅ User+Region |

---

## 7️⃣ POLYGON DRAWING APIS (5 Endpoints) 📐
**Base:** `/api/drawings/polygon`

| # | Method | Endpoint | Purpose | User-Wise |
|---|--------|----------|---------|-----------|
| 52 | GET | `/` | Get user's polygons | ✅ Yes |
| 53 | GET | `/:id` | Get specific polygon | ✅ Owner only |
| 54 | POST | `/` | Create polygon | ✅ Yes |
| 55 | PUT | `/:id` | Update polygon | ✅ Owner only |
| 56 | DELETE | `/:id` | Delete polygon | ✅ Owner only |

---

## 8️⃣ CIRCLE DRAWING APIS (5 Endpoints) ⭕
**Base:** `/api/drawings/circle`

| # | Method | Endpoint | Purpose | User-Wise |
|---|--------|----------|---------|-----------|
| 57 | GET | `/` | Get user's circles | ✅ Yes |
| 58 | GET | `/:id` | Get specific circle | ✅ Owner only |
| 59 | POST | `/` | Create circle | ✅ Yes |
| 60 | PUT | `/:id` | Update circle | ✅ Owner only |
| 61 | DELETE | `/:id` | Delete circle | ✅ Owner only |

---

## 9️⃣ SECTOR RF APIS (6 Endpoints) 📡
**Base:** `/api/rf/sectors`

| # | Method | Endpoint | Purpose | User-Wise |
|---|--------|----------|---------|-----------|
| 62 | GET | `/` | Get user's sectors | ✅ Yes |
| 63 | GET | `/:id` | Get specific sector | ✅ Owner only |
| 64 | POST | `/` | Create sector | ✅ Yes |
| 65 | PUT | `/:id` | Update sector | ✅ Owner only |
| 66 | DELETE | `/:id` | Delete sector | ✅ Owner only |
| 67 | POST | `/:id/calculate` | Calculate coverage | ✅ Owner only |

---

## 🔟 ELEVATION PROFILE APIS (5 Endpoints) ⛰️
**Base:** `/api/elevation/profiles`

| # | Method | Endpoint | Purpose | User-Wise |
|---|--------|----------|---------|-----------|
| 68 | GET | `/` | Get user's profiles | ✅ Yes |
| 69 | GET | `/:id` | Get specific profile | ✅ Owner only |
| 70 | POST | `/` | Create profile | ✅ Yes |
| 71 | DELETE | `/:id` | Delete profile | ✅ Owner only |
| 72 | POST | `/calculate` | Calculate elevation | ✅ Yes |

---

## 1️⃣1️⃣ INFRASTRUCTURE APIS (7 Endpoints) 🏗️
**Base:** `/api/infrastructure`

| # | Method | Endpoint | Purpose | User-Wise |
|---|--------|----------|---------|-----------|
| 73 | GET | `/` | Get user's infrastructure | ✅ Region-filtered |
| 74 | GET | `/:id` | Get specific item | ✅ Yes |
| 75 | POST | `/` | Create item | ✅ Yes |
| 76 | PUT | `/:id` | Update item | ✅ Owner/Manager |
| 77 | DELETE | `/:id` | Delete item | ✅ Owner/Admin |
| 78 | PATCH | `/:id/status` | Update status | ✅ Manager+ |
| 79 | POST | `/:id/upload-photo` | Upload photo | ✅ Manager+ |

---

## 1️⃣2️⃣ LAYER MANAGEMENT APIS (7 Endpoints) 🗂️
**Base:** `/api/layers`

| # | Method | Endpoint | Purpose | User-Wise |
|---|--------|----------|---------|-----------|
| 80 | GET | `/` | Get user's layers | ✅ Yes |
| 81 | GET | `/:id` | Get specific layer | ✅ Owner/Shared |
| 82 | POST | `/` | Save layer | ✅ Yes |
| 83 | PUT | `/:id` | Update layer | ✅ Owner only |
| 84 | DELETE | `/:id` | Delete layer | ✅ Owner only |
| 85 | PATCH | `/:id/visibility` | Toggle visibility | ✅ Owner only |
| 86 | POST | `/:id/share` | Share with users | ✅ Owner only |

---

## 1️⃣3️⃣ BOOKMARKS APIS (4 Endpoints) 🔖
**Base:** `/api/bookmarks`

| # | Method | Endpoint | Purpose | User-Wise |
|---|--------|----------|---------|-----------|
| 87 | GET | `/` | Get user bookmarks | ✅ Yes |
| 88 | POST | `/` | Create bookmark | ✅ Yes |
| 89 | PUT | `/:id` | Update bookmark | ✅ Owner only |
| 90 | DELETE | `/:id` | Delete bookmark | ✅ Owner only |

---

## 1️⃣4️⃣ SEARCH APIS (5 Endpoints) 🔍
**Base:** `/api/search`

| # | Method | Endpoint | Purpose | User-Wise |
|---|--------|----------|---------|-----------|
| 91 | GET | `/global` | Global search | ✅ User's data only |
| 92 | GET | `/users` | Search users | ✅ Region-filtered |
| 93 | GET | `/regions` | Search regions | ✅ User's regions |
| 94 | GET | `/features` | Search features | ✅ User's regions |
| 95 | GET | `/history` | Search history | ✅ User-wise |
| 96 | DELETE | `/history/:id` | Delete history entry | ✅ Owner only |

---

## 1️⃣5️⃣ ANALYTICS APIS (5 Endpoints) 📊
**Base:** `/api/analytics`

| # | Method | Endpoint | Purpose | User-Wise |
|---|--------|----------|---------|-----------|
| 97 | GET | `/dashboard` | Dashboard metrics | ✅ User/Region-wise |
| 98 | GET | `/users` | User analytics | Manager+ |
| 99 | GET | `/regions` | Region analytics | ✅ User's regions |
| 100 | GET | `/features` | Feature analytics | ✅ User's data |
| 101 | POST | `/track` | Track custom event | ✅ Yes |

---

## 1️⃣6️⃣ AUDIT LOGS APIS (3 Endpoints) 📝
**Base:** `/api/audit`

| # | Method | Endpoint | Purpose | User-Wise |
|---|--------|----------|---------|-----------|
| 102 | GET | `/logs` | Get audit logs | Admin or Own |
| 103 | GET | `/logs/:id` | Get log by ID | Admin or Own |
| 104 | GET | `/user/:userId` | User activity | Admin or Own |

---

## 1️⃣7️⃣ TEMPORARY ACCESS APIS (3 Endpoints) ⏰
**Base:** `/api/temporary-access`

| # | Method | Endpoint | Purpose | User-Wise |
|---|--------|----------|---------|-----------|
| 105 | GET | `/` | Get temporary access | Admin/Manager |
| 106 | POST | `/` | Grant access | Manager+ |
| 107 | DELETE | `/:id` | Revoke access | Manager+ |

---

## 1️⃣8️⃣ REGION REQUESTS APIS (4 Endpoints) 📤
**Base:** `/api/region-requests`

| # | Method | Endpoint | Purpose | User-Wise |
|---|--------|----------|---------|-----------|
| 108 | GET | `/` | Get requests | ✅ Own or Manager |
| 109 | POST | `/` | Create request | ✅ Yes |
| 110 | PATCH | `/:id/approve` | Approve request | Manager+ |
| 111 | PATCH | `/:id/reject` | Reject request | Manager+ |

---

## 1️⃣9️⃣ DATA HUB APIS (5 Endpoints) 💾
**Base:** `/api/datahub`

| # | Method | Endpoint | Purpose | User-Wise |
|---|--------|----------|---------|-----------|
| 112 | POST | `/import` | Import data | ✅ Yes |
| 113 | GET | `/imports` | Import history | ✅ User-wise |
| 114 | POST | `/export` | Export data | ✅ User's data |
| 115 | GET | `/exports` | Export history | ✅ User-wise |
| 116 | GET | `/exports/:id/download` | Download file | ✅ Owner only |

---

## 2️⃣0️⃣ USER PREFERENCES APIS (3 Endpoints) ⚙️
**Base:** `/api/preferences`

| # | Method | Endpoint | Purpose | User-Wise |
|---|--------|----------|---------|-----------|
| 117 | GET | `/` | Get preferences | ✅ User-wise |
| 118 | PUT | `/` | Update preferences | ✅ User-wise |
| 119 | DELETE | `/` | Reset preferences | ✅ User-wise |

---

## 2️⃣1️⃣ PERMISSIONS APIS (3 Endpoints) 🔒
**Base:** `/api/permissions`

| # | Method | Endpoint | Purpose | User-Wise |
|---|--------|----------|---------|-----------|
| 120 | GET | `/` | Get all permissions | Admin only |
| 121 | GET | `/:id` | Get permission | Admin only |
| 122 | POST | `/` | Create permission | Admin only |

---

# 🎯 API REQUEST EXAMPLES

## Example 1: Login
```javascript
POST /api/auth/login
Body: {
  "email": "user@example.com",
  "password": "password123"
}

Response: {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "user@example.com",
    "role": "manager",
    "region": { "id": 5, "name": "North Zone" }
  }
}
```

## Example 2: Get User's Measurements
```javascript
GET /api/measurements/distance
Headers: {
  "Authorization": "Bearer YOUR_TOKEN"
}

Response: {
  "measurements": [
    {
      "id": 1,
      "measurement_name": "Tower to Building",
      "total_distance": 1250.5,
      "unit": "meters",
      "created_at": "2025-01-10"
    }
  ]
}
```

## Example 3: Create Sector RF
```javascript
POST /api/rf/sectors
Headers: {
  "Authorization": "Bearer YOUR_TOKEN"
}
Body: {
  "sector_name": "Cell Tower A - Sector 1",
  "tower_lat": 28.6139,
  "tower_lng": 77.2090,
  "azimuth": 45,
  "beamwidth": 65,
  "radius": 1500,
  "region_id": 5
}

Response: {
  "sector": {
    "id": 23,
    "sector_name": "Cell Tower A - Sector 1",
    "created_at": "2025-01-10"
  }
}
```

---

# 🔑 User-Wise Access Summary

| Feature | User Access |
|---------|-------------|
| ✅ All GIS Tools | User sees only their own data |
| ✅ Search History | User-specific |
| ✅ Bookmarks | User-specific |
| ✅ Layers | User-specific (can share) |
| ✅ Measurements | User-specific |
| ✅ Drawings | User-specific |
| ✅ Infrastructure | User's region only |
| ✅ Analytics | User's data + region |
| ✅ Preferences | User-specific |
| ✅ Import/Export | User-specific |

---

# 🎨 API Categories Quick Access

- 🔐 Auth (8)
- 👥 Users (12)
- 🗺️ Regions (8)
- 👨‍👩‍👦 Groups (8)
- 📍 Features (7)
- 📏 Distance (6)
- 📐 Polygon (5)
- ⭕ Circle (5)
- 📡 SectorRF (6)
- ⛰️ Elevation (5)
- 🏗️ Infrastructure (7)
- 🗂️ Layers (7)
- 🔖 Bookmarks (4)
- 🔍 Search (5)
- 📊 Analytics (5)
- 📝 Audit (3)
- ⏰ Temporary (3)
- 📤 Requests (4)
- 💾 DataHub (5)
- ⚙️ Preferences (3)
- 🔒 Permissions (3)

**TOTAL: 122 APIs**

---

# 🚀 This is Your Complete API Hub!
All APIs are documented, organized, and ready to implement!
