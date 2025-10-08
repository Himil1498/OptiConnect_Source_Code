// Region Hierarchy Types - for grouping states into zones

export interface RegionZone {
  id: string;
  name: string;
  description: string;
  states: string[];
  color: string; // For visualization
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ZoneAssignment {
  userId: string;
  userName: string;
  userEmail: string;
  zoneIds: string[];
  assignedBy: string;
  assignedByName: string;
  assignedAt: Date;
}
