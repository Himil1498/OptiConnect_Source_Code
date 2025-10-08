# Phase 7: Dashboard & Analytics - Implementation Plan

## 🎯 Objective
Build a comprehensive dashboard with real-time analytics, KPI monitoring, user statistics, and tool usage tracking for administrative insights and system health monitoring.

---

## 📋 Features to Implement

### 1. **Real-time User Statistics**
- Active vs Inactive users count
- Currently logged-in users list
- User session duration tracking
- Login/logout event monitoring
- User activity timeline

### 2. **Tool Usage Analytics**
- Track usage per GIS tool
- Most/least used features
- Usage trends over time
- Tool performance metrics
- User preferences analysis

### 3. **Regional Activity Dashboard**
- Activity heatmap by region
- Assigned region statistics
- Region-wise user distribution
- Geographic usage patterns

### 4. **System Health Monitoring**
- CPU usage tracking
- Memory consumption
- API latency metrics
- Error rate monitoring
- Uptime statistics

### 5. **KPI Report Generation**
- Automated report creation
- Custom date range selection
- Multiple report formats (PDF, CSV, JSON)
- Scheduled report delivery
- Email integration

### 6. **Visual Analytics**
- Interactive charts (Line, Bar, Pie, Area)
- Real-time data updates
- Customizable widgets
- Drag-and-drop dashboard layout
- Export charts as images

---

## 🗂️ File Structure

```
src/
├── components/
│   └── dashboard/
│       ├── DashboardLayout.tsx           (Main dashboard container)
│       ├── KPICards.tsx                  (Metric cards display)
│       ├── UserStatsPanel.tsx            (User statistics)
│       ├── ToolUsageChart.tsx            (Tool analytics chart)
│       ├── RegionalActivityMap.tsx       (Region heatmap)
│       ├── SystemHealthMonitor.tsx       (System metrics)
│       ├── ReportGenerator.tsx           (Report creation)
│       └── ActivityTimeline.tsx          (Recent activity log)
├── services/
│   ├── analyticsService.ts               (Analytics data fetching)
│   ├── metricsService.ts                 (KPI calculations)
│   └── reportService.ts                  (Report generation logic)
├── types/
│   └── dashboard.types.ts                (TypeScript interfaces)
└── utils/
    ├── chartHelpers.ts                   (Chart data formatting)
    └── exportHelpers.ts                  (Export utilities)
```

---

## 🔧 TypeScript Interfaces

```typescript
// dashboard.types.ts

export interface DashboardMetrics {
  activeUsers: number;
  inactiveUsers: number;
  currentlyLoggedIn: User[];
  toolUsage: { [toolName: string]: number };
  regionalActivity: { [region: string]: number };
  systemHealth: SystemHealth;
  lastUpdated: Date;
}

export interface SystemHealth {
  cpu: number;          // Percentage (0-100)
  memory: number;       // Percentage (0-100)
  latency: number;      // Milliseconds
  uptime: number;       // Seconds
  errorRate: number;    // Percentage (0-100)
  apiStatus: 'healthy' | 'degraded' | 'down';
}

export interface ToolUsageStats {
  toolName: string;
  totalUsage: number;
  averageDuration: number;  // Minutes
  lastUsed: Date;
  popularRegions: string[];
  userCount: number;
}

export interface RegionalActivity {
  regionName: string;
  activeUsers: number;
  toolUsage: number;
  lastActivity: Date;
  assignedUsers: number;
  activityScore: number;  // 0-100
}

export interface UserActivity {
  userId: string;
  userName: string;
  action: string;
  tool?: string;
  region?: string;
  timestamp: Date;
  duration?: number;  // Seconds
  status: 'success' | 'failed' | 'in-progress';
}

export interface KPIReport {
  id: string;
  title: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  metrics: DashboardMetrics;
  generatedAt: Date;
  generatedBy: string;
  format: 'pdf' | 'csv' | 'json' | 'excel';
}

export interface DashboardWidget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'map' | 'timeline';
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: any;
  refreshInterval?: number;  // Seconds
}
```

---

## 🎨 UI Components

### DashboardLayout
```tsx
Features:
- Grid-based layout (12 columns)
- Responsive design
- Widget drag-and-drop
- Auto-refresh toggle
- Date range selector
- Export dashboard button

Position: New route /dashboard
Full viewport layout
```

### KPICards
```tsx
Features:
- 4 main KPI cards (Users, Tools, Regions, Health)
- Real-time value updates
- Trend indicators (↑↓)
- Color-coded status
- Click to expand details
- Sparkline graphs

Layout: Top row, 4 columns
Card size: 280px width, 140px height
```

### UserStatsPanel
```tsx
Features:
- Active/Inactive user count
- Currently logged-in list
- User search/filter
- Activity status indicators
- Session duration display
- Quick user actions

Position: Left panel
Max height: 600px (scrollable)
```

### ToolUsageChart
```tsx
Features:
- Bar/Line chart toggle
- Time period selector (Day/Week/Month)
- Interactive tooltips
- Export chart image
- Drill-down capability
- Comparison mode

Position: Center panel
Size: 600px × 400px
```

### RegionalActivityMap
```tsx
Features:
- India map with region highlighting
- Heatmap overlay (activity intensity)
- Click region for details
- Activity score visualization
- User distribution display
- Filter by assignment

Position: Right panel
Size: 500px × 500px
```

### SystemHealthMonitor
```tsx
Features:
- Real-time gauges (CPU, Memory, Latency)
- Status indicators
- Alert thresholds
- Historical graphs (24h)
- API health check
- Auto-refresh (30s interval)

Position: Bottom left
Size: 400px × 300px
```

### ReportGenerator
```tsx
Features:
- Date range picker
- Metric selection
- Format chooser (PDF/CSV/Excel)
- Preview before export
- Schedule reports
- Email delivery option

Position: Modal dialog
Trigger: Top-right button
```

---

## 📊 Analytics Implementation

### 1. User Statistics Tracking

```typescript
// analyticsService.ts
async function getUserStatistics(): Promise<UserStats> {
  // Fetch from API or calculate from localStorage/Redux
  const allUsers = await fetchAllUsers();

  const activeUsers = allUsers.filter(u =>
    isActiveInLast7Days(u.lastActivity)
  );

  const currentlyLoggedIn = allUsers.filter(u =>
    u.sessionActive && isWithinSessionTimeout(u.lastSeen)
  );

  return {
    total: allUsers.length,
    active: activeUsers.length,
    inactive: allUsers.length - activeUsers.length,
    loggedIn: currentlyLoggedIn,
    newThisWeek: getNewUsersCount(7)
  };
}
```

### 2. Tool Usage Analytics

```typescript
async function getToolUsageStats(): Promise<ToolUsageStats[]> {
  // Track from localStorage or backend API
  const usageLogs = getUsageLogsFromStorage();

  const toolStats = usageLogs.reduce((acc, log) => {
    if (!acc[log.toolName]) {
      acc[log.toolName] = {
        toolName: log.toolName,
        totalUsage: 0,
        averageDuration: 0,
        lastUsed: log.timestamp,
        userCount: new Set()
      };
    }

    acc[log.toolName].totalUsage++;
    acc[log.toolName].userCount.add(log.userId);
    acc[log.toolName].lastUsed = log.timestamp;

    return acc;
  }, {});

  return Object.values(toolStats);
}
```

### 3. Regional Activity Tracking

```typescript
async function getRegionalActivity(): Promise<RegionalActivity[]> {
  const regions = getAllRegions();

  return regions.map(region => {
    const regionUsers = getUsersByRegion(region);
    const regionLogs = getActivityLogsByRegion(region);

    return {
      regionName: region,
      activeUsers: regionUsers.filter(isActive).length,
      toolUsage: regionLogs.length,
      lastActivity: getLastActivityTime(regionLogs),
      assignedUsers: regionUsers.length,
      activityScore: calculateActivityScore(regionLogs)
    };
  });
}
```

### 4. System Health Monitoring

```typescript
async function getSystemHealth(): Promise<SystemHealth> {
  // Mock for frontend, real data from backend
  const health = {
    cpu: await getCPUUsage(),           // Mock: Random 20-60%
    memory: await getMemoryUsage(),     // Mock: Random 40-70%
    latency: await measureAPILatency(), // Real: Ping API
    uptime: getApplicationUptime(),     // Real: From session start
    errorRate: getErrorRate(),          // Real: From error logs
    apiStatus: await checkAPIHealth()   // Real: Health endpoint
  };

  return health;
}

async function measureAPILatency(): Promise<number> {
  const start = performance.now();
  await fetch('/api/health');
  const end = performance.now();
  return Math.round(end - start);
}
```

---

## 💾 Data Storage Schema

### LocalStorage Structure

```typescript
// Analytics Data
localStorage.setItem('gis_analytics', JSON.stringify({
  toolUsage: {
    'distance-measurement': {
      count: 45,
      lastUsed: '2025-10-02T10:30:00Z',
      users: ['user1', 'user2'],
      averageDuration: 120  // seconds
    },
    'polygon-drawing': {
      count: 32,
      lastUsed: '2025-10-02T09:15:00Z',
      users: ['user1', 'user3'],
      averageDuration: 180
    }
    // ... other tools
  },

  userActivity: [
    {
      userId: 'user1',
      userName: 'John Doe',
      action: 'tool_used',
      tool: 'distance-measurement',
      region: 'Delhi',
      timestamp: '2025-10-02T10:30:00Z',
      duration: 125,
      status: 'success'
    }
    // ... more activities (keep last 100)
  ],

  regionalStats: {
    'Delhi': { visits: 120, lastVisit: '2025-10-02T10:30:00Z' },
    'Mumbai': { visits: 89, lastVisit: '2025-10-01T15:20:00Z' }
    // ... other regions
  }
}));

// System Health History (last 24 hours)
localStorage.setItem('gis_system_health', JSON.stringify({
  history: [
    { timestamp: '2025-10-02T10:00:00Z', cpu: 45, memory: 62, latency: 87 },
    { timestamp: '2025-10-02T10:30:00Z', cpu: 52, memory: 65, latency: 92 }
    // ... (keep last 48 entries = 24 hours with 30min interval)
  ]
}));
```

---

## 📈 Chart Implementation

### Using Chart.js or Recharts

```typescript
// Example: Tool Usage Bar Chart
import { Bar } from 'react-chartjs-2';

const ToolUsageChart = ({ data }: { data: ToolUsageStats[] }) => {
  const chartData = {
    labels: data.map(d => d.toolName),
    datasets: [{
      label: 'Usage Count',
      data: data.map(d => d.totalUsage),
      backgroundColor: 'rgba(59, 130, 246, 0.6)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      tooltip: { enabled: true }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  return <Bar data={chartData} options={options} />;
};
```

---

## 🚀 Implementation Steps

### Phase 7.1: Core Dashboard (Week 1)
1. ⬜ Create TypeScript interfaces
2. ⬜ Build DashboardLayout component
3. ⬜ Implement KPICards with mock data
4. ⬜ Add UserStatsPanel
5. ⬜ Setup routing (/dashboard)

### Phase 7.2: Analytics Services (Week 1-2)
1. ⬜ Create analyticsService.ts
2. ⬜ Implement tool usage tracking
3. ⬜ Add regional activity tracking
4. ⬜ Build system health monitoring
5. ⬜ Setup localStorage persistence

### Phase 7.3: Data Visualization (Week 2)
1. ⬜ Install chart library (Chart.js/Recharts)
2. ⬜ Build ToolUsageChart component
3. ⬜ Create RegionalActivityMap
4. ⬜ Add SystemHealthMonitor gauges
5. ⬜ Implement ActivityTimeline

### Phase 7.4: Report Generation (Week 2-3)
1. ⬜ Build ReportGenerator component
2. ⬜ Implement PDF export (jsPDF)
3. ⬜ Add CSV export functionality
4. ⬜ Create Excel export (xlsx)
5. ⬜ Add scheduled reports feature

### Phase 7.5: Polish & Testing (Week 3)
1. ⬜ Add auto-refresh functionality
2. ⬜ Implement date range filters
3. ⬜ Add export/import dashboard config
4. ⬜ Testing & bug fixes
5. ⬜ Documentation & user guide

---

## 🎯 KPI Metrics

### Primary KPIs
1. **User Engagement**: Active users / Total users × 100
2. **Tool Adoption**: Tools used / Total tools × 100
3. **Regional Coverage**: Active regions / Total regions × 100
4. **System Performance**: (100 - Average latency/10)
5. **User Satisfaction**: Success rate of tool usage

### Secondary KPIs
- Average session duration
- Tool completion rate
- Error frequency
- Peak usage times
- User retention rate

---

## 🎨 UI Layout Mockup

```
┌─────────────────────────────────────────────────────────────────────┐
│  📊 Dashboard & Analytics                    [Date Range] [Export]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │👥 Users  │  │🔧 Tools  │  │🗺️ Regions│  │💚 Health │           │
│  │  125     │  │  89%     │  │   28     │  │  Good    │           │
│  │  ↑ 12%   │  │  ↑ 5%    │  │  ↓ 2%    │  │  95ms    │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────┐  ┌────────────────────────────────────┐  │
│  │ 👥 User Stats        │  │ 📊 Tool Usage (Last 7 Days)        │  │
│  ├──────────────────────┤  ├────────────────────────────────────┤  │
│  │ Active: 98           │  │                                     │  │
│  │ Inactive: 27         │  │     ▄▄                              │  │
│  │                      │  │   ▄▄██▄▄    ▄▄                      │  │
│  │ Currently Online:    │  │ ▄▄████████▄▄██▄▄                    │  │
│  │ • John Doe          │  │ ██████████████████                   │  │
│  │ • Jane Smith        │  │ Distance Polygon Circle Elevation   │  │
│  │ • Mike Johnson      │  │                                     │  │
│  └──────────────────────┘  └────────────────────────────────────┘  │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────┐  ┌──────────────────────────────┐ │
│  │ 🗺️ Regional Activity        │  │ 💚 System Health             │ │
│  ├─────────────────────────────┤  ├──────────────────────────────┤ │
│  │                              │  │  CPU:     [████░░░░] 45%     │ │
│  │        [India Map]           │  │  Memory:  [██████░░] 62%     │ │
│  │     (Heatmap overlay)        │  │  Latency: [██░░░░░░] 87ms    │ │
│  │                              │  │  Uptime:  12h 34m            │ │
│  │  Top Regions:                │  │  Status:  🟢 Healthy         │ │
│  │  🔵 Delhi (45 users)        │  │                              │ │
│  │  🔵 Mumbai (38 users)       │  └──────────────────────────────┘ │
│  └─────────────────────────────┘                                    │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ 📋 Recent Activity                                              │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ 10:30 AM - John used Distance Measurement in Delhi (2m 15s)    │ │
│  │ 10:25 AM - Jane completed Polygon Drawing in Mumbai (3m 42s)   │ │
│  │ 10:20 AM - Mike viewed Elevation Profile in Bangalore (1m 08s) │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ✅ Success Criteria

### Functionality
- ⬜ Real-time metrics updating
- ⬜ All charts rendering correctly
- ⬜ Report generation working
- ⬜ Export to PDF/CSV/Excel
- ⬜ System health monitoring active
- ⬜ Activity tracking accurate

### Performance
- ⬜ Dashboard loads < 2 seconds
- ⬜ Auto-refresh without lag
- ⬜ Charts animate smoothly
- ⬜ Export completes < 5 seconds

### UX
- ⬜ Intuitive navigation
- ⬜ Clear data visualization
- ⬜ Responsive on all devices
- ⬜ Accessible (ARIA labels)
- ⬜ Print-friendly reports

---

## 📚 Dependencies

```json
{
  "dependencies": {
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0",
    "recharts": "^2.10.0",
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.0",
    "xlsx": "^0.18.5",
    "date-fns": "^2.30.0",
    "react-datepicker": "^4.24.0"
  }
}
```

**Install command:**
```bash
npm install chart.js react-chartjs-2 recharts jspdf jspdf-autotable xlsx react-datepicker
```

---

## 🔗 Integration with Existing System

### 1. **Navigation Integration**
Add Dashboard link to main navigation:
```tsx
// In AppNavigation or Sidebar
<NavLink to="/dashboard">
  📊 Dashboard
</NavLink>
```

### 2. **Activity Tracking Hooks**
Integrate tracking into existing GIS tools:
```tsx
// In each tool component
import { trackToolUsage } from '../services/analyticsService';

const handleToolActivation = () => {
  trackToolUsage({
    toolName: 'distance-measurement',
    userId: currentUser.id,
    region: currentRegion,
    timestamp: new Date()
  });

  // ... existing tool logic
};
```

### 3. **Redux Integration**
Add analytics slice to Redux store:
```tsx
// store/slices/analyticsSlice.ts
const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    metrics: null,
    loading: false,
    error: null
  },
  reducers: {
    setMetrics: (state, action) => {
      state.metrics = action.payload;
    }
  }
});
```

---

## ⚠️ Back Compatibility

### Ensuring No Breaking Changes
1. **Isolated Module**: Dashboard is self-contained, doesn't modify existing code
2. **Optional Feature**: Can be enabled/disabled via feature flag
3. **Graceful Degradation**: Works with or without backend API
4. **LocalStorage Fallback**: Uses mock data if API unavailable
5. **Route Guard**: Only accessible to admin users

### Feature Flag
```typescript
// config/features.ts
export const FEATURES = {
  DASHBOARD_ENABLED: true,  // Toggle dashboard
  REAL_TIME_UPDATES: true,  // Toggle auto-refresh
  REPORT_GENERATION: true   // Toggle reports
};
```

---

## 🔮 Future Enhancements (Phase 8+)

1. **Machine Learning Insights**
   - Predictive analytics
   - Anomaly detection
   - Usage forecasting

2. **Advanced Visualizations**
   - 3D charts
   - Network graphs
   - Sankey diagrams

3. **Collaboration Features**
   - Share dashboards
   - Commenting system
   - Team analytics

4. **Mobile App**
   - Dashboard mobile view
   - Push notifications
   - Offline support

5. **Integration APIs**
   - Export to BI tools
   - Webhook notifications
   - Third-party integrations

---

**Ready to start Phase 7 implementation!** 🚀
