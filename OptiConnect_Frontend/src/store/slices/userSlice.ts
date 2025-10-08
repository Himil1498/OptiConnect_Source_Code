import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import type { User } from '../../types/auth.types';

// User Management State
interface UserState {
  users: User[];
  selectedUsers: string[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    search: string;
    role: string;
    status: string;
    assignedRegion: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

const initialState: UserState = {
  users: [],
  selectedUsers: [],
  currentUser: null,
  isLoading: false,
  error: null,
  filters: {
    search: '',
    role: '',
    status: '',
    assignedRegion: '',
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
  },
};

// Async Thunks for API calls (will use mock data in development)
export const fetchUsers = createAsyncThunk(
  'user/fetchUsers',
  async (_, { getState }) => {
    // This will be replaced with actual API call
    // For now, return mock data
    const mockUsers: User[] = [
      {
        id: 'USER001',
        username: 'admin_raj',
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@jio.com',
        password: '********',
        gender: 'Male',
        phoneNumber: '+91-9876543210',
        address: {
          street: '123 Tech Park',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        },
        officeLocation: 'Mumbai HQ',
        assignedUnder: [],
        role: 'Admin',
        assignedRegions: ['Maharashtra', 'Gujarat'],
        groups: [],
        status: 'Active',
        loginHistory: [
          { timestamp: new Date('2024-01-15T10:30:00'), location: 'Mumbai, India' }
        ],
        company: 'Jio',
        permissions: ['all'],
      },
      {
        id: 'USER002',
        username: 'manager_priya',
        name: 'Priya Sharma',
        email: 'priya.sharma@airtel.com',
        password: '********',
        gender: 'Female',
        phoneNumber: '+91-9876543211',
        address: {
          street: '456 Business District',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001'
        },
        officeLocation: 'Delhi Regional Office',
        assignedUnder: ['USER001'],
        role: 'Manager',
        assignedRegions: ['Delhi', 'Punjab', 'Haryana'],
        groups: [],
        status: 'Active',
        loginHistory: [
          { timestamp: new Date('2024-01-15T09:45:00'), location: 'Delhi, India' }
        ],
        company: 'Airtel',
        permissions: ['read', 'write', 'manage_team'],
      },
      {
        id: 'USER003',
        username: 'tech_amit',
        name: 'Amit Singh',
        email: 'amit.singh@vi.com',
        password: '********',
        gender: 'Male',
        phoneNumber: '+91-9876543212',
        address: {
          street: '789 Industrial Area',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001'
        },
        officeLocation: 'Bangalore Tech Center',
        assignedUnder: ['USER002'],
        role: 'Technician',
        assignedRegions: ['Karnataka', 'Tamil Nadu'],
        groups: [],
        status: 'Active',
        loginHistory: [
          { timestamp: new Date('2024-01-15T08:30:00'), location: 'Bangalore, India' }
        ],
        company: 'Vi',
        permissions: ['read', 'write'],
      },
    ];

    return mockUsers;
  }
);

export const createUser = createAsyncThunk(
  'user/createUser',
  async (userData: Omit<User, 'id' | 'loginHistory'>) => {
    // Generate new ID
    const newId = `USER${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

    const newUser: User = {
      ...userData,
      id: newId,
      loginHistory: [],
    };

    // In production, this would be an API call
    return newUser;
  }
);

export const updateUser = createAsyncThunk(
  'user/updateUser',
  async ({ id, updates }: { id: string; updates: Partial<User> }) => {
    // In production, this would be an API call
    return { id, updates };
  }
);

export const deleteUser = createAsyncThunk(
  'user/deleteUser',
  async (userId: string) => {
    // In production, this would be an API call
    return userId;
  }
);

export const bulkUpdateUsers = createAsyncThunk(
  'user/bulkUpdateUsers',
  async ({ userIds, updates }: { userIds: string[]; updates: Partial<User> }) => {
    // In production, this would be an API call
    return { userIds, updates };
  }
);

export const bulkDeleteUsers = createAsyncThunk(
  'user/bulkDeleteUsers',
  async (userIds: string[]) => {
    // In production, this would be an API call
    return userIds;
  }
);

// User Slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Selection Management
    selectUser: (state, action: PayloadAction<string>) => {
      if (!state.selectedUsers.includes(action.payload)) {
        state.selectedUsers.push(action.payload);
      }
    },
    deselectUser: (state, action: PayloadAction<string>) => {
      state.selectedUsers = state.selectedUsers.filter(id => id !== action.payload);
    },
    toggleUserSelection: (state, action: PayloadAction<string>) => {
      const index = state.selectedUsers.indexOf(action.payload);
      if (index === -1) {
        state.selectedUsers.push(action.payload);
      } else {
        state.selectedUsers.splice(index, 1);
      }
    },
    selectAllUsers: (state) => {
      state.selectedUsers = state.users.map(user => user.id);
    },
    deselectAllUsers: (state) => {
      state.selectedUsers = [];
    },

    // Filter Management
    setSearchFilter: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload;
    },
    setRoleFilter: (state, action: PayloadAction<string>) => {
      state.filters.role = action.payload;
    },
    setStatusFilter: (state, action: PayloadAction<string>) => {
      state.filters.status = action.payload;
    },
    setRegionFilter: (state, action: PayloadAction<string>) => {
      state.filters.assignedRegion = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {
        search: '',
        role: '',
        status: '',
        assignedRegion: '',
      };
    },

    // Pagination
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state, action: PayloadAction<number>) => {
      state.pagination.limit = action.payload;
    },

    // Current User
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload;
    },

    // Error Handling
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Users
    builder.addCase(fetchUsers.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchUsers.fulfilled, (state, action) => {
      state.isLoading = false;
      state.users = action.payload;
      state.pagination.total = action.payload.length;
    });
    builder.addCase(fetchUsers.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to fetch users';
    });

    // Create User
    builder.addCase(createUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(createUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.users.push(action.payload);
      state.pagination.total += 1;
    });
    builder.addCase(createUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to create user';
    });

    // Update User
    builder.addCase(updateUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateUser.fulfilled, (state, action) => {
      state.isLoading = false;
      const { id, updates } = action.payload;
      const index = state.users.findIndex(user => user.id === id);
      if (index !== -1) {
        state.users[index] = { ...state.users[index], ...updates };
      }
    });
    builder.addCase(updateUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to update user';
    });

    // Delete User
    builder.addCase(deleteUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(deleteUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.users = state.users.filter(user => user.id !== action.payload);
      state.selectedUsers = state.selectedUsers.filter(id => id !== action.payload);
      state.pagination.total -= 1;
    });
    builder.addCase(deleteUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to delete user';
    });

    // Bulk Update Users
    builder.addCase(bulkUpdateUsers.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(bulkUpdateUsers.fulfilled, (state, action) => {
      state.isLoading = false;
      const { userIds, updates } = action.payload;
      state.users = state.users.map(user =>
        userIds.includes(user.id) ? { ...user, ...updates } : user
      );
      state.selectedUsers = [];
    });
    builder.addCase(bulkUpdateUsers.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to update users';
    });

    // Bulk Delete Users
    builder.addCase(bulkDeleteUsers.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(bulkDeleteUsers.fulfilled, (state, action) => {
      state.isLoading = false;
      state.users = state.users.filter(user => !action.payload.includes(user.id));
      state.selectedUsers = [];
      state.pagination.total -= action.payload.length;
    });
    builder.addCase(bulkDeleteUsers.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to delete users';
    });
  },
});

export const {
  selectUser,
  deselectUser,
  toggleUserSelection,
  selectAllUsers,
  deselectAllUsers,
  setSearchFilter,
  setRoleFilter,
  setStatusFilter,
  setRegionFilter,
  clearFilters,
  setPage,
  setLimit,
  setCurrentUser,
  clearError,
} = userSlice.actions;

export default userSlice.reducer;