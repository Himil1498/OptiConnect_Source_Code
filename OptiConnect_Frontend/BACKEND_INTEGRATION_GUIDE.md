# Backend Integration Guide

## Overview

The Data Hub is **backend-compatible** and can work in two modes:
1. **LocalStorage Mode** (Default) - All data stored in browser
2. **Backend Mode** - Data synced with REST API backend

---

## Configuration

### Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```bash
# Backend Integration
REACT_APP_USE_BACKEND=false        # Set to "true" to enable backend
REACT_APP_API_URL=http://localhost:5000/api

# Google Maps API
REACT_APP_GOOGLE_MAPS_API_KEY=your_key_here
```

### Modes

#### LocalStorage Mode (Default)
```env
REACT_APP_USE_BACKEND=false
```
- All data stored in browser's localStorage
- No network requests
- Works offline
- Data persists in browser only

#### Backend Mode
```env
REACT_APP_USE_BACKEND=true
REACT_APP_API_URL=http://localhost:5000/api
```
- Data synced with backend API
- Automatic fallback to localStorage if backend fails
- Supports multi-user access
- Data persists in database

---

## Backend API Endpoints

The Data Hub expects the following REST API endpoints:

### 1. Health Check
```
GET /api/health
Response: { status: "ok" }
```

### 2. Fetch All Data
```
GET /api/data-hub/all
Response: DataHubEntry[]
```

### 3. Delete Entries
```
DELETE /api/data-hub/delete
Body: { ids: string[] }
Response: { success: boolean, deleted: number }
```

### 4. Sync Data
```
POST /api/data-hub/sync
Body: { entries: DataHubEntry[] }
Response: { success: boolean, count: number }
```

### 5. Export Data (Optional)
```
POST /api/data-hub/export/:format
Body: { entries: DataHubEntry[] }
Response: Blob (file download)
Formats: "XLSX", "CSV", "KML", "KMZ", "JSON"
```

---

## Data Model

### DataHubEntry
```typescript
interface DataHubEntry {
  id: string;                    // Unique identifier
  type: DataHubEntryType;        // "Distance" | "Polygon" | "Circle" | "Elevation" | "Infrastructure"
  name: string;                  // Entry name
  createdAt: Date;               // Creation timestamp
  savedAt: Date;                 // Last save timestamp
  fileSize: number;              // Size in bytes
  source: "Manual" | "Import";   // Data source
  data: any;                     // Actual tool-specific data
  description?: string;          // Optional description
  tags?: string[];               // Optional tags
}
```

---

## Backend Implementation Example (Node.js/Express)

### Setup
```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// In-memory storage (use database in production)
let dataStore = [];
```

### Endpoints

#### 1. Health Check
```javascript
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});
```

#### 2. Fetch All Data
```javascript
app.get('/api/data-hub/all', (req, res) => {
  res.json(dataStore);
});
```

#### 3. Delete Entries
```javascript
app.delete('/api/data-hub/delete', (req, res) => {
  const { ids } = req.body;
  const beforeCount = dataStore.length;
  dataStore = dataStore.filter(entry => !ids.includes(entry.id));
  const deleted = beforeCount - dataStore.length;
  res.json({ success: true, deleted });
});
```

#### 4. Sync Data
```javascript
app.post('/api/data-hub/sync', (req, res) => {
  const { entries } = req.body;

  // Merge strategy: Update existing, add new
  entries.forEach(newEntry => {
    const index = dataStore.findIndex(e => e.id === newEntry.id);
    if (index >= 0) {
      dataStore[index] = newEntry;  // Update
    } else {
      dataStore.push(newEntry);      // Add
    }
  });

  res.json({ success: true, count: entries.length });
});
```

#### 5. Export (XLSX example)
```javascript
const XLSX = require('xlsx');

app.post('/api/data-hub/export/XLSX', (req, res) => {
  const { entries } = req.body;

  // Convert to worksheet data
  const ws_data = entries.map(e => ({
    Type: e.type,
    Name: e.name,
    Created: e.createdAt,
    Saved: e.savedAt,
    Source: e.source,
    Size: `${(e.fileSize / 1024).toFixed(2)} KB`
  }));

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(ws_data);
  XLSX.utils.book_append_sheet(wb, ws, 'GIS Data');

  // Write to buffer
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=gis-export-${Date.now()}.xlsx`);
  res.send(buffer);
});
```

---

## Database Schema Examples

### MongoDB
```javascript
const dataHubSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ['Distance', 'Polygon', 'Circle', 'Elevation', 'Infrastructure'],
    required: true
  },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  savedAt: { type: Date, default: Date.now },
  fileSize: { type: Number, required: true },
  source: { type: String, enum: ['Manual', 'Import'], required: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  description: String,
  tags: [String]
});
```

### PostgreSQL
```sql
CREATE TABLE data_hub_entries (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(50) NOT NULL CHECK (type IN ('Distance', 'Polygon', 'Circle', 'Elevation', 'Infrastructure')),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  file_size INTEGER NOT NULL,
  source VARCHAR(20) NOT NULL CHECK (source IN ('Manual', 'Import')),
  data JSONB NOT NULL,
  description TEXT,
  tags TEXT[]
);

CREATE INDEX idx_type ON data_hub_entries(type);
CREATE INDEX idx_source ON data_hub_entries(source);
CREATE INDEX idx_saved_at ON data_hub_entries(saved_at DESC);
```

---

## Frontend Service Layer

The `dataHubService.ts` handles:
- ✅ Automatic fallback to localStorage if backend fails
- ✅ Environment-based backend enable/disable
- ✅ Centralized API calls
- ✅ Error handling
- ✅ Type safety

### Usage Example
```typescript
import { fetchAllData, deleteEntries, checkBackendStatus } from '../services/dataHubService';

// Check if backend is available
const isBackendAvailable = await checkBackendStatus();

// Load data (automatically uses backend or localStorage)
const entries = await fetchAllData();

// Delete entries
await deleteEntries(['id1', 'id2', 'id3']);
```

---

## Testing Backend Integration

### 1. Start Backend Server
```bash
node server.js
# Server running on http://localhost:5000
```

### 2. Configure Frontend
```env
REACT_APP_USE_BACKEND=true
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Test Endpoints

#### Using cURL
```bash
# Health check
curl http://localhost:5000/api/health

# Fetch data
curl http://localhost:5000/api/data-hub/all

# Delete entries
curl -X DELETE http://localhost:5000/api/data-hub/delete \
  -H "Content-Type: application/json" \
  -d '{"ids": ["test-id-1"]}'

# Sync data
curl -X POST http://localhost:5000/api/data-hub/sync \
  -H "Content-Type: application/json" \
  -d '{"entries": [...]}'
```

#### Using Postman
1. Import the API collection
2. Test each endpoint
3. Verify responses

---

## Deployment Considerations

### Production Checklist
- [ ] Set `REACT_APP_USE_BACKEND=true`
- [ ] Configure production API URL
- [ ] Set up database (MongoDB/PostgreSQL)
- [ ] Implement authentication/authorization
- [ ] Add rate limiting
- [ ] Enable CORS for production domain
- [ ] Set up SSL/TLS
- [ ] Implement backup strategy
- [ ] Add monitoring and logging
- [ ] Test fallback to localStorage

### Security
```javascript
// Add JWT authentication
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Apply to routes
app.use('/api/data-hub', authMiddleware);
```

---

## Troubleshooting

### Data Not Appearing
1. Check console for errors: `console.log("🔄 Loading data...")`
2. Verify localStorage keys: Open DevTools → Application → LocalStorage
   - `gis_distance_measurements`
   - `gis_polygons`
   - `gis_circles`
   - `gis_elevation_profiles`
   - `gis_infrastructures`
3. Check if data has `id` and `name` fields
4. Try clicking the refresh button in Data Hub

### Backend Connection Failed
1. Check `REACT_APP_USE_BACKEND` is set to "true"
2. Verify backend server is running
3. Check CORS configuration
4. Verify API URL is correct
5. Check network tab in DevTools

### CORS Issues
```javascript
// Backend: Add proper CORS headers
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

---

## Future Enhancements

### Planned Features
- [ ] Real-time sync with WebSockets
- [ ] Conflict resolution for concurrent edits
- [ ] Data versioning and history
- [ ] Batch import/export
- [ ] Advanced search and filtering on backend
- [ ] GraphQL API option
- [ ] Data compression for large datasets
- [ ] Offline queue for backend sync

---

## Support

**By default, the application works in LocalStorage mode** with no backend required. Enable backend mode only when you have a compatible API server ready.

For questions or issues:
1. Check console logs for debugging info
2. Verify environment variables
3. Test with LocalStorage mode first
4. Check backend API endpoint responses
