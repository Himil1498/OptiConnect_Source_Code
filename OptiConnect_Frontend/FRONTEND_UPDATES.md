# Frontend Updates - Reports & Audit Logs

## Files Updated

### 1. ✅ RegionReportsExport.tsx
**Location**: `src/components/admin/RegionReportsExport.tsx`

**Changes**:
- Added **XLSX format** radio button option
- Changed format selection from 2 options to 3 options (CSV, XLSX, JSON)
- Updated type definition to include `'xlsx'` format
- Changed layout from `flex space-x-4` to `grid grid-cols-3 gap-4`

**New UI**:
```
[CSV]  [XLSX (recommended)]  [JSON]
```

---

### 2. ✅ regionReportsService.ts
**Location**: `src/services/regionReportsService.ts`

**Changes**:
- Updated `ReportOptions` interface to include `'xlsx'` in format type
- **Completely rewrote `downloadReport` function** to call backend API
- Added support for blob responses (CSV/XLSX files)
- Added proper MIME types for XLSX format
- Handles Content-Disposition headers from backend
- Falls back to localStorage-based reports if `REACT_APP_USE_BACKEND` is false

**Key Features**:
- Converts report type from `snake_case` to `kebab-case` for API endpoints
- Handles JSON responses separately from blob responses
- Extracts filenames from response headers
- Proper error handling with user-friendly messages

---

### 3. ✅ NEW FILE: AuditLogsManagement.tsx
**Location**: `src/components/admin/AuditLogsManagement.tsx` (NEW)

**Features**:
- **View Audit Logs**: Displays last 100 audit log entries in a table
- **Refresh Button**: Reload logs on demand
- **Clear All Logs Button**: Delete all audit logs (with confirmation dialog)
- **Delete Single Log**: Delete button for each log entry
- **Confirmation Dialog**: Warns user before clearing all logs
- **Loading States**: Shows spinner while loading
- **Empty State**: Shows message when no logs exist
- **Error Handling**: Displays error notifications
- **Admin Only**: Only visible to users with Admin role

**UI Components**:
- Table with columns: ID, User, Action, Resource, Timestamp, Actions
- Clear confirmation modal with warning
- Notification dialogs for success/error messages
- Responsive design with dark mode support

---

## How to Use

### 1. Export Reports with XLSX Format

1. Login as **Admin**
2. Navigate to: **Admin Panel → Export Reports**
3. Select a report type (e.g., "User Activity Report")
4. Select format: **CSV**, **XLSX**, or **JSON**
5. Click **"Export Report"**
6. File will download automatically

**Example**:
- Report: User Activity
- Format: XLSX
- Result: `user_activity_2025-10-14.xlsx` downloads

---

### 2. Manage Audit Logs

**To add this component to your app**, you need to import it in your admin routes/pages:

```typescript
// In your Admin Panel or Dashboard routing
import AuditLogsManagement from '../components/admin/AuditLogsManagement';

// Add to your routes
<Route path="/admin/audit-logs" element={<AuditLogsManagement />} />
```

**Usage**:
1. Navigate to the Audit Logs Management page
2. View list of audit logs
3. Click **"Refresh"** to reload logs
4. Click **"Clear All Logs"** to delete all entries (requires confirmation)
5. Click trash icon next to any log to delete just that entry

---

## Backend API Calls

### Reports
The frontend now calls these backend endpoints:

```typescript
// Example: User Activity Report as XLSX
GET /api/reports/user-activity?format=xlsx

// Example: Region Usage as CSV
GET /api/reports/region-usage?format=csv

// Example: Audit Logs as JSON
GET /api/reports/audit-logs?format=json
```

### Audit Logs
```typescript
// Get logs
GET /api/audit/logs?limit=100

// Delete single log
DELETE /api/audit/logs/:id

// Clear all logs
DELETE /api/audit/logs
```

---

## Environment Variable

Make sure your `.env` file has:
```
REACT_APP_USE_BACKEND=true
REACT_APP_API_BASE_URL=http://localhost:5005/api
```

This ensures the frontend calls the backend API instead of using localStorage.

---

## Testing Checklist

### Reports
- [ ] XLSX format button appears in Export Reports
- [ ] Selecting XLSX format works
- [ ] Clicking "Export Report" with XLSX downloads a .xlsx file
- [ ] Downloaded XLSX file opens in Excel/LibreOffice
- [ ] CSV format still works
- [ ] JSON format still works
- [ ] All 8 report types work with XLSX format

### Audit Logs (if component is added to routes)
- [ ] Audit Logs Management page loads
- [ ] Table shows audit log entries
- [ ] Refresh button reloads logs
- [ ] Clear All Logs button appears
- [ ] Clear All Logs shows confirmation dialog
- [ ] Confirming clear deletes all logs
- [ ] Delete button appears for each log
- [ ] Clicking delete removes that log
- [ ] Non-admin users see "Access Denied" message

---

## Summary

✅ **XLSX format added** to reports export  
✅ **Backend API integrated** for all reports  
✅ **Audit Logs Management UI** created with delete functionality  
✅ **Clear All Logs** button with confirmation  
✅ **Delete single log** button for each entry  

**Next Steps**:
1. Add `AuditLogsManagement` component to your admin routing
2. Test XLSX downloads
3. Test audit log management features

---

**Last Updated**: 2025-10-14
