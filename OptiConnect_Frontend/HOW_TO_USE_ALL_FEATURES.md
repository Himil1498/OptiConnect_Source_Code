# How to Use All Features - Complete User Guide

## 🚀 Quick Start Guide

This guide explains how to access and use every feature in the GIS platform.

---

## 📱 **User Interface Overview**

### **Main Navigation**
The application has several main sections:
- **Map Page** - Main map interface with GIS tools
- **Dashboard** - Analytics and statistics (Admin only)
- **User Management** - Manage users and permissions (Admin only)
- **Profile** - Your user settings and region requests

---

## 👤 **For Regular Users (Field Engineers, Viewers)**

### **1. Understanding Your Region Access**

#### **Visual Indicators on Map:**
- 🔵 **Blue regions** = Your assigned regions (you can work here)
- ⚪ **Gray regions** = Not assigned to you (blocked)

#### **Check Your Assigned Regions:**
1. Go to **Map Page**
2. Click **"Legend"** button (bottom-left)
3. You'll see your assigned region count
4. Only blue regions are clickable when tools are inactive

---

### **2. Using GIS Tools with Region Restrictions**

#### **Available Tools (Top-Left of Map):**
1. Distance Measurement
2. Polygon Drawing
3. Circle Drawing
4. Elevation Profile
5. Infrastructure Management

#### **How to Use:**
1. Click any tool to activate it
2. Click on the map in a **blue region** → ✅ **Works**
3. Click on the map in a **gray region** → ❌ **Error: "Region Access Denied"**

#### **Example - Distance Measurement:**
```
Step 1: Click "Distance Measurement" tool
Step 2: Click Point A in Maharashtra (blue) → ✅ Marker placed
Step 3: Click Point B in Maharashtra (blue) → ✅ Distance calculated
Step 4: Try Point C in Tamil Nadu (gray) → ❌ Error notification appears
```

**Error Message You'll See:**
```
❌ Region Access Denied
You don't have access to Tamil Nadu.
Assigned regions: Maharashtra, Karnataka
```

---

### **3. Request Access to New Regions** 🙋

**When to use:** You need access to a region that's not currently assigned to you.

#### **Steps:**
1. **Navigate to Request Form:**
   - Option A: Click your profile/user menu
   - Option B: Direct navigation (if available)

2. **Fill Out Request Form:**
   - Select regions you need (checkboxes)
   - Enter detailed reason (minimum 10 characters)
   - Example reason: "Need access to Delhi for new tower installations project in North zone"

3. **Submit Request:**
   - Click "Submit Request"
   - You'll see success notification
   - Request status changes to "Pending"

4. **Track Your Request:**
   - Scroll down to "Request History" section
   - See all your requests with status:
     - 🟡 **Pending** - Waiting for admin review
     - 🟢 **Approved** - Access granted
     - 🔴 **Rejected** - Denied with reason
     - ⚪ **Cancelled** - You cancelled it

5. **Cancel Pending Request:**
   - Find request in history
   - Click "Cancel" button
   - Confirm cancellation

---

### **4. Using Temporary Access** ⏰

**What is it?** Admin can grant you temporary access to a region for a limited time.

#### **How to Know You Have Temporary Access:**
When you click in a region, if you have temporary access, the success message shows:
```
✅ Access granted to Delhi (Temporary Access)
```

**Expiration:** Your temporary access automatically expires after the set date.

---

### **5. Map Refresh Feature** 🔄

**Problem:** Sometimes the map doesn't load and shows a blank screen.

#### **Solution:**
1. Look for **"Controls"** button (bottom-left corner)
2. Click to expand the menu
3. Click **"Refresh Map"** button (has circular arrow icon)
4. Page reloads and map should appear

**Alternative:** Just press `Ctrl+R` or `F5` to refresh the browser.

---

## 👨‍💼 **For Administrators**

### **Admin Dashboard Access**

1. Login with admin credentials
2. Navigate to **Dashboard** or **Admin Panel**
3. You'll see multiple admin-only sections

---

### **1. View Audit Logs** 📊

**Purpose:** Monitor all user actions and system events for compliance and security.

#### **Access:**
Dashboard → **Audit Logs** section

#### **Features:**

**A. View Logs:**
- See all events in table format
- Columns: Timestamp, User, Event, Region, Severity, Status

**B. Filter Logs:**
1. Click "Show Filters" button
2. Filter by:
   - **Event Type:** Region Access Granted, Region Access Denied, GIS Tool Used, etc.
   - **Severity:** Info, Warning, Error, Critical
   - **Success:** Success or Failed only
3. Click "Clear Filters" to reset

**C. View Details:**
- Click "View Details" on any log entry
- See full information: timestamp, user, event type, action, details, error messages

**D. Export Logs:**
- Click "Export CSV" button
- File downloads as `audit-logs-YYYY-MM-DD.csv`
- Open in Excel

**E. Statistics:**
- See cards at top: Total Events, Successful, Failed, Success Rate

**F. Clear Logs:**
- Click "Clear Logs" button (⚠️ Warning: Cannot be undone!)
- Confirm deletion

---

### **2. Manage Region Access Requests** ✅

**Purpose:** Approve or reject user requests for additional region access.

#### **Access:**
Dashboard → **Region Requests** section

#### **View Requests:**
- See all requests in table
- Columns: User, Regions Requested, Reason, Status, Created Date

#### **Filter Requests:**
- Filter by Status dropdown:
  - **All** - Show everything
  - **Pending** - Needs your review
  - **Approved** - Already approved
  - **Rejected** - Already rejected
  - **Cancelled** - User cancelled

#### **Approve Request:**
1. Find pending request
2. Click **"Approve"** button
3. Modal opens:
   - (Optional) Add review notes: "Approved for Q1 2025 project"
   - Click "Approve"
4. User's assignedRegions are updated immediately
5. User gets access to the requested regions

#### **Reject Request:**
1. Find pending request
2. Click **"Reject"** button
3. Modal opens:
   - (Recommended) Add review notes explaining why: "Need project manager approval first"
   - Click "Reject"
4. User is notified

#### **Delete Request:**
- Click "Delete" button on any request
- Record is permanently removed

#### **Statistics:**
Top of page shows:
- Total Requests
- Pending (action needed)
- Approved
- Rejected

---

### **3. Bulk Region Assignment** 🔄

**Purpose:** Assign or revoke regions for multiple users at once (saves time!).

#### **Access:**
Dashboard → **Bulk Region Assignment** section

#### **Three Assignment Modes:**

**Mode 1: Assign (Add Regions)**
- Adds selected regions to users' existing assignments
- Existing regions are kept
- Example: User has [MH], you assign [DL] → Result: [MH, DL]

**Mode 2: Revoke (Remove Regions)**
- Removes selected regions from users
- Example: User has [MH, DL, KA], you revoke [DL] → Result: [MH, KA]

**Mode 3: Replace (Override All)**
- Replaces ALL regions with only the selected ones
- ⚠️ Warning: Removes all existing assignments
- Example: User has [MH, DL], you replace with [KA] → Result: [KA]

#### **Step-by-Step Process:**

**Step 1: Select Action**
- Choose one: Assign, Revoke, or Replace

**Step 2: Select Users**
- Left panel shows all users
- Check boxes for users you want to modify
- Or click "Select All"
- You'll see: "Selected (X/Y users)"

**Step 3: Select Regions**
- Right panel shows all 36 Indian states/UTs
- Check boxes for regions to assign/revoke/replace
- Or click "Select All"
- You'll see: "Selected (X/36 regions)"

**Step 4: Review**
- Bottom shows summary:
  - "This will affect X user(s) and Y region(s)"
  - Action description

**Step 5: Apply**
- Click big blue button: "Apply Bulk Assignment" (or Revocation/Replacement)
- Confirm the action
- Success notification appears
- Changes are immediate

**Example Use Case:**
```
Scenario: Assign all team members to new region

Action: Assign
Users: [5 Field Engineers]
Regions: [Gujarat]
Click: Apply Bulk Assignment

Result: All 5 engineers now have Gujarat added to their regions
```

---

### **4. Temporary Access Management** ⏰

**Purpose:** Grant time-limited access for special cases (contractors, temporary projects, emergencies).

#### **Access:**
Dashboard → **Temporary Access Management** section

#### **Grant Temporary Access:**

**Form Fields:**
1. **User** - Select from dropdown
2. **Region** - Select one region
3. **Expires At** - Pick date and time (use date picker)
4. **Reason** - Why temporary access is needed

**Example:**
```
User: Rajesh Kumar (field@example.com)
Region: Delhi
Expires At: 2025-01-15 18:00
Reason: Emergency tower maintenance in Delhi NCR region
```

Click **"Grant Access"** → User immediately gets access until expiration.

#### **View Grants Table:**

**Status Badges:**
- 🟢 **Active** - Currently valid
- 🟡 **Expiring Soon** - Expires within 7 days
- ⚪ **Expired** - Past expiration date
- 🔴 **Revoked** - Manually cancelled

**Table Columns:**
- User Name & Email
- Region
- Granted By & Date
- Expires At
- Status
- Actions

#### **Extend Temporary Access:**
1. Find active grant
2. Click **"Extend"** button
3. Modal opens with current expiration date
4. Pick new expiration date (must be future)
5. Click "Extend"
6. Grant is updated

#### **Revoke Temporary Access:**
1. Find active grant
2. Click **"Revoke"** button
3. Modal asks for reason (optional): "Project completed early"
4. Click "Revoke"
5. Access removed immediately

#### **Delete Grant Record:**
- Click "Delete" on any grant
- Permanently removes the record (for cleanup)

#### **Filter Grants:**
- Filter by User, Region, or Status (Active/Inactive)
- Click "Clear Filters" to reset

#### **Statistics:**
- **Total Grants** - All time
- **Active** - Currently valid
- **Expired** - Past expiration
- **Expiring Soon** - Next 7 days (⚠️ action needed)

---

### **5. Audit Log Viewer (Detailed)** 🔍

Already covered above, but additional tips:

#### **Common Use Cases:**

**A. Track Failed Access Attempts:**
```
Filter:
- Event Type: Region Access Denied
- Success: Failed

Result: See all unauthorized access attempts
```

**B. Monitor Specific User:**
```
Filter:
- User: Select specific user
- Date Range: Set custom range

Result: All actions by that user
```

**C. Region Activity:**
```
Filter:
- Region: Select region (if available)
OR
Search logs for region name

Result: All activity in that region
```

**D. Critical Events:**
```
Filter:
- Severity: Critical

Result: High-priority events only
```

---

### **6. Region Usage Analytics** 📈

**Purpose:** Understand how regions are being used.

**Note:** Analytics are embedded in reports. Use the Reports Export feature.

#### **Available Analytics:**
- Most accessed regions
- Regions with most denials
- User activity by region
- Access success rates
- Timeline of activity

**Access:** Use Reports Export (see below)

---

### **7. Export Reports** 📤

**Purpose:** Generate downloadable reports for analysis, compliance, or sharing.

#### **Access:**
Dashboard → **Export Reports** section

#### **Available Report Types:**

**1. Region Usage Report**
- Access statistics per region
- Success/denial counts
- Unique users
- Most active user per region

**2. User Activity Report**
- Actions per user
- Regions accessed
- Denied attempts
- Most accessed region

**3. Access Denials Report**
- Regions with denied access
- Denial rates
- Users affected

**4. Audit Logs Report**
- Complete audit trail
- All events with timestamps

**5. Temporary Access Report**
- All temporary grants
- Active/expired/revoked status
- Granted by, expires at

**6. Region Requests Report**
- All user requests
- Approval/rejection status
- Review notes

**7. Zone Assignments Report**
- User zone assignments
- States included in each zone

**8. Comprehensive Report**
- Everything combined
- Full system snapshot

#### **Export Steps:**

**Method 1: Custom Export**
1. Select report type (radio button)
2. Select format:
   - **CSV** - Open in Excel, Google Sheets
   - **JSON** - For programming/API use
3. Click **"Export Report"** button
4. File downloads automatically

**Method 2: Quick Export**
- Use quick buttons at bottom:
  - "Region Usage (CSV)"
  - "User Activity (CSV)"
  - "Audit Logs (CSV)"
  - "Full Report (JSON)"
- One-click download

#### **Report File Names:**
```
region_usage_report_2025-01-10.csv
user_activity_report_2025-01-10.csv
comprehensive_report_2025-01-10.json
```

---

### **8. Zone Management (Advanced)** 🗺️

**Purpose:** Organize states into zones for easier bulk assignment.

**Note:** Zone UI component may need to be added to dashboard. The service is ready.

#### **Default Zones:**
- **North Zone:** 8 states (Punjab, Haryana, Delhi, HP, UK, Chandigarh, J&K, Ladakh)
- **South Zone:** 8 states (KA, TN, Kerala, AP, Telangana, Puducherry, Lakshadweep, Andaman)
- **East Zone:** 12 states (WB, Bihar, Jharkhand, Odisha, all NE states)
- **West Zone:** 5 states (Maharashtra, Gujarat, Goa, Rajasthan, Dadra)
- **Central Zone:** 3 states (MP, Chhattisgarh, UP)

#### **Assign Zone to User (Programmatic):**
```javascript
// Import service
import { assignZonesToUser, getRegionZones } from './services/regionHierarchyService';

// Get zones
const zones = getRegionZones();
const northZone = zones.find(z => z.name === 'North Zone');

// Assign to user
assignZonesToUser(user, [northZone.id], adminUser);

// User now has access to ALL states in North Zone
```

**Benefits:**
- Assign 8 states with one click instead of selecting 8 individually
- Logical grouping
- Easier management

---

## 🔧 **Common Workflows**

### **Workflow 1: Onboard New Field Engineer**

**Scenario:** New employee needs access to Maharashtra and Karnataka.

**Admin Steps:**
1. Create user in User Management
2. Go to **Bulk Region Assignment**
3. Action: **Assign**
4. Users: Select new user
5. Regions: Check **Maharashtra** and **Karnataka**
6. Click "Apply Bulk Assignment"
7. ✅ Done! User can now work in those regions.

---

### **Workflow 2: Temporary Project Access**

**Scenario:** Field engineer needs access to Delhi for 2 weeks for emergency repair.

**Admin Steps:**
1. Go to **Temporary Access Management**
2. Fill form:
   - User: Field Engineer
   - Region: Delhi
   - Expires: Today + 14 days
   - Reason: "Emergency tower repair project"
3. Click "Grant Access"
4. ✅ Engineer can work in Delhi for 2 weeks
5. After 2 weeks: Access automatically expires

---

### **Workflow 3: Region Expansion for Team**

**Scenario:** Entire team (10 people) needs access to new region (Gujarat) for expansion project.

**Admin Steps:**
1. Go to **Bulk Region Assignment**
2. Action: **Assign** (add to existing)
3. Users: Select all 10 team members
4. Regions: Check **Gujarat**
5. Click "Apply Bulk Assignment"
6. ✅ All 10 people now have Gujarat access

---

### **Workflow 4: Investigate Unauthorized Access Attempt**

**Scenario:** Security alert about unauthorized access attempt.

**Admin Steps:**
1. Go to **Audit Logs**
2. Click "Show Filters"
3. Event Type: **Region Access Denied**
4. Success: **Failed**
5. View filtered results
6. Click "View Details" on suspicious entry
7. See: User, Region attempted, Timestamp, IP address (if logged)
8. Take action: Contact user or revoke access

---

### **Workflow 5: Generate Monthly Report**

**Scenario:** Need monthly report for management.

**Admin Steps:**
1. Go to **Export Reports**
2. Select **Comprehensive Report**
3. Format: **JSON** (or CSV for Excel)
4. Click "Export Report"
5. File downloads
6. Open in Excel/send to management

---

## 🎯 **Tips and Best Practices**

### **For Users:**
1. ✅ Always check your assigned regions before starting work
2. ✅ Submit access requests with detailed reasons (faster approval)
3. ✅ If map doesn't load, use the Refresh Map button
4. ✅ Watch for "(Temporary Access)" indicator - access will expire
5. ❌ Don't repeatedly click blocked regions (creates many audit logs)

### **For Admins:**
1. ✅ Review region requests regularly (check Pending count)
2. ✅ Use Bulk Assignment for team changes (saves time)
3. ✅ Set expiration dates carefully for temporary access
4. ✅ Export audit logs monthly for compliance
5. ✅ Monitor "Expiring Soon" grants to extend if needed
6. ✅ Use zones for logical grouping (North, South, etc.)
7. ✅ Add review notes when approving/rejecting requests
8. ❌ Don't use "Replace" mode in bulk assignment unless you're sure (overwrites everything)

---

## 🔍 **Troubleshooting**

### **Problem: Map not loading**
**Solution:** Click Controls → Refresh Map

### **Problem: Can't click on region**
**Solution:** Check Legend - is the region blue (assigned) or gray (not assigned)?

### **Problem: "Region Access Denied" error**
**Solution:** Submit a region access request to admin

### **Problem: Temporary access not working**
**Solution:**
- Check if expired (Temporary Access Management table)
- Ask admin to extend expiration date

### **Problem: Can't find Audit Logs**
**Solution:** Only admins can access audit logs

### **Problem: Bulk assignment didn't work**
**Solution:**
- Check if you selected both users AND regions
- Try refreshing page and checking user's assigned regions

---

## 📞 **Getting Help**

### **For Technical Issues:**
- Check browser console for errors (F12)
- Try refreshing the page
- Clear browser cache
- Check internet connection (Geocoding API needs internet)

### **For Access Issues:**
- Contact your administrator
- Submit formal access request with detailed reason
- Check with your manager for approval

### **For Admin Questions:**
- Review this guide
- Check audit logs for system behavior
- Export reports for detailed analysis

---

## 🎓 **Training Recommendations**

### **For New Users (30 min):**
1. Overview of region access (5 min)
2. How to use GIS tools (10 min)
3. How to request access (5 min)
4. Map controls and refresh (5 min)
5. Practice exercises (5 min)

### **For New Admins (1 hour):**
1. Audit logs and monitoring (15 min)
2. Region request management (10 min)
3. Bulk assignment workflows (15 min)
4. Temporary access management (10 min)
5. Reports and analytics (10 min)

---

## 📊 **Summary of All Features**

| Feature | User Type | Location | Purpose |
|---------|-----------|----------|---------|
| Region Enforcement | All | Map Tools | Restrict GIS tool usage to assigned regions |
| Map Refresh | All | Controls Menu | Fix map loading issues |
| Access Requests | Users | Profile/Form | Request additional region access |
| Audit Logs | Admin | Dashboard | Monitor all system activity |
| Request Management | Admin | Dashboard | Approve/reject access requests |
| Bulk Assignment | Admin | Dashboard | Assign regions to multiple users |
| Temporary Access | Admin | Dashboard | Grant time-limited access |
| Zone Management | Admin | Service | Group states into zones |
| Analytics | Admin | Reports | Understand usage patterns |
| Reports Export | Admin | Dashboard | Download data in CSV/JSON |

---

**Need more help?**
- Review `REGION_ENFORCEMENT_TESTING_GUIDE.md` for testing
- Review `COMPLETE_FEATURE_IMPLEMENTATION_SUMMARY.md` for technical details

---

**Last Updated:** ${new Date().toISOString()}
**Version:** 1.0.0
