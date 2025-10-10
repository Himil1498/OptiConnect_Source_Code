import React, { useState, useEffect } from 'react';
import { User } from '../../types/auth.types';
import UserPermissionsDialog from './UserPermissionsDialog';
import DeleteUserDialog from '../common/DeleteUserDialog';
import * as userService from '../../services/userService';

// Indian States/UTs for region assignment
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

// User Management Component with Complete CRUD Operations
const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>('create');
  const [currentUser, setCurrentUser] = useState<Partial<User> | null>(null);
  const [permissionsUser, setPermissionsUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Form state for create/edit modals
  const [formData, setFormData] = useState<Partial<User>>({
    username: '',
    name: '',
    email: '',
    password: '',
    gender: '',
    phoneNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    },
    department: '',
    officeLocation: '',
    assignedUnder: [],
    role: 'User',
    assignedRegions: [],
    status: 'Active'
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Region search state
  const [regionSearchTerm, setRegionSearchTerm] = useState('');

  // Mock data - replace with API calls
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
      ]
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
      ]
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
      ]
    }
  ];

  // Load users from backend
  const loadUsers = async () => {
    setIsLoading(true);
    setLoadingError(null);
    try {
      const fetchedUsers = await userService.getAllUsers();
      setUsers(fetchedUsers);
    } catch (error: any) {
      console.error('Error loading users:', error);
      setLoadingError(error.message || 'Failed to load users');
      // Fallback to mock data on error
      setUsers(mockUsers);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || user.role === filterRole;
    const matchesStatus = !filterStatus || user.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Handle user selection for bulk operations
  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  // Generate user ID - OCGID format (OptiConnect GIS ID)
  const generateUserId = () => {
    const maxId = users.reduce((max, user) => {
      const num = parseInt(user.id.replace('OCGID', ''));
      return num > max && !isNaN(num) ? num : max;
    }, 0);
    return `OCGID${String(maxId + 1).padStart(3, '0')}`;
  };

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.username?.trim()) errors.username = 'Username is required';
    if (!formData.name?.trim()) errors.name = 'Name is required';
    if (!formData.email?.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email is invalid';
    if (!formData.phoneNumber?.trim()) errors.phoneNumber = 'Phone number is required';
    if (!formData.address?.street?.trim()) errors.street = 'Street is required';
    if (!formData.address?.city?.trim()) errors.city = 'City is required';
    if (!formData.address?.state?.trim()) errors.state = 'State is required';
    if (!formData.address?.pincode?.trim()) errors.pincode = 'Pincode is required';
    if (!formData.officeLocation?.trim()) errors.officeLocation = 'Office location is required';

    // Check for duplicate username/email (excluding current user in edit mode)
    const existingUser = users.find(user =>
      (user.username === formData.username || user.email === formData.email) &&
      (modalType === 'create' || user.id !== currentUser?.id)
    );
    if (existingUser) {
      if (existingUser.username === formData.username) errors.username = 'Username already exists';
      if (existingUser.email === formData.email) errors.email = 'Email already exists';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address!,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle multi-select for assigned regions
  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({
      ...prev,
      assignedRegions: selectedOptions
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      username: '',
      name: '',
      email: '',
      password: '',
      gender: '',
      phoneNumber: '',
      address: {
        street: '',
        city: '',
        state: '',
        pincode: ''
      },
      department: '',
      officeLocation: '',
      assignedUnder: [],
      role: 'User',
      assignedRegions: [],
      status: 'Active'
    });
    setFormErrors({});
  };

  // CRUD Operations
  const handleCreateUser = () => {
    resetForm();
    setCurrentUser(null);
    setModalType('create');
    setShowModal(true);
  };

  const handleEditUser = (user: User) => {
    setFormData({ ...user });
    setCurrentUser(user);
    setModalType('edit');
    setShowModal(true);
  };

  const handleViewUser = (user: User) => {
    setCurrentUser(user);
    setModalType('view');
    setShowModal(true);
  };

  const handlePermissionsUser = (user: User) => {
    setPermissionsUser(user);
  };

  const handleSavePermissions = (userId: string, permissions: string[]) => {
    setUsers(prev => prev.map(user =>
      user.id === userId ? { ...user, directPermissions: permissions } : user
    ));
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    setIsLoading(true);
    try {
      await userService.deleteUser(userToDelete.id);
      await loadUsers();
      setShowDeleteDialog(false);
      setUserToDelete(null);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(`Failed to delete user: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveUser = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (modalType === 'create') {
        await userService.createUser(formData);
      } else if (modalType === 'edit' && currentUser && currentUser.id) {
        await userService.updateUser(currentUser.id, formData);
      }

      // Reload users from backend
      await loadUsers();
      setShowModal(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving user:', error);
      alert(`Failed to save user: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
      return;
    }

    setIsLoading(true);
    try {
      await userService.bulkDeleteUsers(Array.from(selectedUsers));
      await loadUsers();
      setSelectedUsers([]);
    } catch (error: any) {
      console.error('Error deleting users:', error);
      alert(`Failed to delete users: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkStatusChange = async (status: 'Active' | 'Inactive') => {
    setIsLoading(true);
    try {
      await userService.bulkUpdateStatus(Array.from(selectedUsers), status);
      await loadUsers();
      setSelectedUsers([]);
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert(`Failed to update status: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="h-14 w-14 rounded-lg bg-violet-600 dark:bg-violet-500 flex items-center justify-center shadow-lg">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                User Management
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage system users with role-based access control
            </p>
          </div>
        </div>
          <button
            onClick={handleCreateUser}
            className="inline-flex items-center px-5 py-2.5 border border-transparent shadow-sm text-sm font-semibold rounded-lg text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors duration-200"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New User
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border-2 border-violet-100 dark:border-violet-900/30 p-6 mb-6">
        <div className="flex items-center mb-4">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center mr-3">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Search & Filter Users</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-violet-700 dark:text-violet-300 mb-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search Users
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, or username..."
                className="w-full pl-10 pr-3 py-2 border-2 border-violet-200 dark:border-violet-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-gray-700 dark:text-white"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Filter by Role
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 border-2 border-blue-200 dark:border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium"
            >
              <option value="">All Roles</option>
              <option value="Admin">🛡️ Admin</option>
              <option value="Manager">💼 Manager</option>
              <option value="Technician">🔧 Technician</option>
              <option value="User">👤 User</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border-2 border-emerald-200 dark:border-emerald-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium"
            >
              <option value="">All Status</option>
              <option value="Active">✅ Active</option>
              <option value="Inactive">⛔ Inactive</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterRole('');
                setFilterStatus('');
              }}
              className="w-full px-3 py-2 border-2 border-rose-200 dark:border-rose-700 rounded-lg bg-gradient-to-r from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 text-rose-700 dark:text-rose-300 font-semibold hover:from-rose-100 hover:to-rose-200 dark:hover:from-rose-900/30 dark:hover:to-rose-800/30 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-gradient-to-r from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 border-2 border-violet-200 dark:border-violet-700 rounded-xl p-5 mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <span className="text-lg font-bold text-violet-800 dark:text-violet-200">
                  {selectedUsers.length} user(s) selected
                </span>
                <p className="text-xs text-violet-600 dark:text-violet-400">Choose a bulk action</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleBulkStatusChange('Active')}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg text-sm font-semibold hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 transform hover:-translate-y-0.5"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Activate
              </button>
              <button
                onClick={() => handleBulkStatusChange('Inactive')}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg text-sm font-semibold hover:from-amber-600 hover:to-amber-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 transform hover:-translate-y-0.5"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Deactivate
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-sm font-semibold hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 transform hover:-translate-y-0.5"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-xl border-2 border-violet-100 dark:border-violet-900/30">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-violet-100 to-violet-50 dark:from-violet-900/30 dark:to-violet-800/20">
              <tr>
                <th className="px-4 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAll}
                    className="h-5 w-5 rounded border-violet-300 dark:border-violet-600 text-violet-600 focus:ring-violet-500"
                  />
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    User ID
                  </div>
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Name
                  </div>
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email
                  </div>
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Role
                  </div>
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Status
                  </div>
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Assigned Regions
                  </div>
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Actions
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-100 dark:divide-violet-900/20">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-colors duration-150">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserSelect(user.id)}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {user.id}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        @{user.username}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    {user.role === 'Admin' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border border-red-300 dark:border-red-700">
                        <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Admin
                      </span>
                    )}
                    {user.role === 'Manager' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border border-blue-300 dark:border-blue-700">
                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Manager
                      </span>
                    )}
                    {user.role === 'Technician' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border border-green-300 dark:border-green-700">
                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Technician
                      </span>
                    )}
                    {user.role === 'User' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200 border border-gray-300 dark:border-gray-700">
                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        User
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.status === 'Active' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border border-green-300 dark:border-green-700">
                        <span className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200 border border-gray-300 dark:border-gray-700">
                        <span className="h-2 w-2 rounded-full bg-gray-500 mr-2"></span>
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {user.assignedRegions.slice(0, 2).join(', ')}
                    {user.assignedRegions.length > 2 && ` +${user.assignedRegions.length - 2} more`}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        title="View Details"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handlePermissionsUser(user)}
                        className="p-2 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors"
                        title="Manage Permissions"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                        title="Edit User"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        title="Delete User"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading users...</p>
          </div>
        )}

        {!isLoading && loadingError && (
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400">{loadingError}</p>
            <button
              onClick={loadUsers}
              className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !loadingError && filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No users found matching the current filters.
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border-2 border-blue-200 dark:border-blue-700 p-5 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">Total Users</div>
            <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-blue-800 dark:text-blue-200">{users.length}</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-700 p-5 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Active Users</div>
            <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-emerald-800 dark:text-emerald-200">{users.filter(u => u.status === 'Active').length}</div>
        </div>
        <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 rounded-xl border-2 border-rose-200 dark:border-rose-700 p-5 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-rose-700 dark:text-rose-300">Admins</div>
            <svg className="h-6 w-6 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-rose-800 dark:text-rose-200">{users.filter(u => u.role === 'Admin').length}</div>
        </div>
        <div className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 rounded-xl border-2 border-violet-200 dark:border-violet-700 p-5 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-violet-700 dark:text-violet-300">Managers</div>
            <svg className="h-6 w-6 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-violet-800 dark:text-violet-200">{users.filter(u => u.role === 'Manager').length}</div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  {modalType === 'view' && (
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                      <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                  )}
                  {(modalType === 'create' || modalType === 'edit') && (
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg">
                      <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {modalType === 'create' ? 'Create New User' :
                     modalType === 'edit' ? 'Edit User' : 'User Details'}
                  </h2>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {modalType === 'view' ? (
                // Enhanced View Mode
                <div className="space-y-6">
                  {/* Basic Information Card */}
                  <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-900/20 dark:to-violet-800/10 rounded-xl p-6 border-2 border-violet-200 dark:border-violet-700/50">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-violet-900 dark:text-violet-100">Basic Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-violet-200 dark:border-violet-700">
                        <label className="flex items-center gap-2 text-xs font-semibold text-violet-600 dark:text-violet-400 mb-2 uppercase tracking-wider">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                          User ID
                        </label>
                        <p className="text-base font-semibold text-gray-900 dark:text-white">{currentUser?.id}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-violet-200 dark:border-violet-700">
                        <label className="flex items-center gap-2 text-xs font-semibold text-violet-600 dark:text-violet-400 mb-2 uppercase tracking-wider">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Username
                        </label>
                        <p className="text-base font-semibold text-gray-900 dark:text-white">@{currentUser?.username}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-violet-200 dark:border-violet-700">
                        <label className="flex items-center gap-2 text-xs font-semibold text-violet-600 dark:text-violet-400 mb-2 uppercase tracking-wider">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Full Name
                        </label>
                        <p className="text-base font-semibold text-gray-900 dark:text-white">{currentUser?.name}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-violet-200 dark:border-violet-700">
                        <label className="flex items-center gap-2 text-xs font-semibold text-violet-600 dark:text-violet-400 mb-2 uppercase tracking-wider">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Email
                        </label>
                        <p className="text-base font-semibold text-gray-900 dark:text-white break-all">{currentUser?.email}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-violet-200 dark:border-violet-700">
                        <label className="flex items-center gap-2 text-xs font-semibold text-violet-600 dark:text-violet-400 mb-2 uppercase tracking-wider">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Gender
                        </label>
                        <p className="text-base font-semibold text-gray-900 dark:text-white">{currentUser?.gender || 'Not specified'}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-violet-200 dark:border-violet-700">
                        <label className="flex items-center gap-2 text-xs font-semibold text-violet-600 dark:text-violet-400 mb-2 uppercase tracking-wider">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          Phone Number
                        </label>
                        <p className="text-base font-semibold text-gray-900 dark:text-white">{currentUser?.phoneNumber}</p>
                      </div>
                    </div>
                  </div>

                  {/* Work Information Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-700/50">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">Work Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                        <label className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wider">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          Department
                        </label>
                        <p className="text-base font-semibold text-gray-900 dark:text-white">{currentUser?.department || 'Not assigned'}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                        <label className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wider">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Office Location
                        </label>
                        <p className="text-base font-semibold text-gray-900 dark:text-white">{currentUser?.officeLocation}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                        <label className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wider">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Role
                        </label>
                        {currentUser?.role === 'Admin' && (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border border-red-300 dark:border-red-700">
                            🛡️ Admin
                          </span>
                        )}
                        {currentUser?.role === 'Manager' && (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border border-blue-300 dark:border-blue-700">
                            💼 Manager
                          </span>
                        )}
                        {currentUser?.role === 'Technician' && (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border border-green-300 dark:border-green-700">
                            🔧 Technician
                          </span>
                        )}
                        {currentUser?.role === 'User' && (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200 border border-gray-300 dark:border-gray-700">
                            👤 User
                          </span>
                        )}
                      </div>
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                        <label className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wider">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Status
                        </label>
                        {currentUser?.status === 'Active' ? (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border border-green-300 dark:border-green-700">
                            <span className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200 border border-gray-300 dark:border-gray-700">
                            <span className="h-2 w-2 rounded-full bg-gray-500 mr-2"></span>
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Address Information Card */}
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-xl p-6 border-2 border-emerald-200 dark:border-emerald-700/50">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100">Address Information</h3>
                    </div>
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-emerald-200 dark:border-emerald-700">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <div>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold mb-1">Street Address</p>
                            <p className="text-base font-medium text-gray-900 dark:text-white">{currentUser?.address?.street}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold mb-1">City</p>
                            <p className="text-base font-medium text-gray-900 dark:text-white">{currentUser?.address?.city}</p>
                          </div>
                          <div>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold mb-1">State</p>
                            <p className="text-base font-medium text-gray-900 dark:text-white">{currentUser?.address?.state}</p>
                          </div>
                          <div>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold mb-1">Pincode</p>
                            <p className="text-base font-medium text-gray-900 dark:text-white">{currentUser?.address?.pincode}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Regions Card */}
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 rounded-xl p-6 border-2 border-amber-200 dark:border-amber-700/50">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100">Assigned Regions</h3>
                      </div>
                      <div className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg shadow-lg flex items-center gap-2">
                        <span className="font-bold">{currentUser?.assignedRegions?.length || 0}</span>
                        <span className="text-sm">Regions</span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-amber-200 dark:border-amber-700">
                      {currentUser?.assignedRegions && currentUser.assignedRegions.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {currentUser.assignedRegions.map(region => (
                            <span
                              key={region}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-lg text-sm font-semibold border border-amber-300 dark:border-amber-700"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {region}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-amber-600 dark:text-amber-400">
                          <svg className="h-12 w-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          <p className="font-medium">No regions assigned</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Close Button */}
                  <div className="flex justify-end pt-4 border-t-2 border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg font-bold hover:from-gray-700 hover:to-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                // Enhanced Create/Edit Form
                <form onSubmit={(e) => { e.preventDefault(); handleSaveUser(); }} className="space-y-8">
                  {/* Basic Information Section */}
                  <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-900/20 dark:to-violet-800/10 rounded-xl p-6 border-2 border-violet-200 dark:border-violet-700/50">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-violet-900 dark:text-violet-100">Basic Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Username */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-violet-700 dark:text-violet-300 mb-2">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Username *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            name="username"
                            value={formData.username || ''}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-3 py-3 border-2 ${formErrors.username ? 'border-red-400 dark:border-red-500' : 'border-violet-200 dark:border-violet-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-gray-700 dark:text-white transition-all`}
                            placeholder="Enter username"
                          />
                        </div>
                        {formErrors.username && <p className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs mt-1.5 font-medium"><svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{formErrors.username}</p>}
                      </div>

                      {/* Full Name */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-violet-700 dark:text-violet-300 mb-2">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Full Name *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            name="name"
                            value={formData.name || ''}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-3 py-3 border-2 ${formErrors.name ? 'border-red-400 dark:border-red-500' : 'border-violet-200 dark:border-violet-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-gray-700 dark:text-white transition-all`}
                            placeholder="Enter full name"
                          />
                        </div>
                        {formErrors.name && <p className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs mt-1.5 font-medium"><svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{formErrors.name}</p>}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-violet-700 dark:text-violet-300 mb-2">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Email *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                          </div>
                          <input
                            type="email"
                            name="email"
                            value={formData.email || ''}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-3 py-3 border-2 ${formErrors.email ? 'border-red-400 dark:border-red-500' : 'border-violet-200 dark:border-violet-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-gray-700 dark:text-white transition-all`}
                            placeholder="user@example.com"
                          />
                        </div>
                        {formErrors.email && <p className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs mt-1.5 font-medium"><svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{formErrors.email}</p>}
                      </div>

                      {/* Password */}
                      {modalType === 'create' && (
                        <div>
                          <label className="flex items-center gap-2 text-sm font-semibold text-violet-700 dark:text-violet-300 mb-2">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Password *
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                              </svg>
                            </div>
                            <input
                              type="password"
                              name="password"
                              value={formData.password || ''}
                              onChange={handleInputChange}
                              className="w-full pl-10 pr-3 py-3 border-2 border-violet-200 dark:border-violet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-gray-700 dark:text-white transition-all"
                              placeholder="Enter secure password"
                            />
                          </div>
                        </div>
                      )}

                      {/* Phone Number */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-violet-700 dark:text-violet-300 mb-2">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          Phone Number *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <input
                            type="tel"
                            name="phoneNumber"
                            value={formData.phoneNumber || ''}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-3 py-3 border-2 ${formErrors.phoneNumber ? 'border-red-400 dark:border-red-500' : 'border-violet-200 dark:border-violet-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-gray-700 dark:text-white transition-all`}
                            placeholder="+91-XXXXXXXXXX"
                          />
                        </div>
                        {formErrors.phoneNumber && <p className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs mt-1.5 font-medium"><svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{formErrors.phoneNumber}</p>}
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-violet-700 dark:text-violet-300 mb-2">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Gender
                        </label>
                        <select
                          name="gender"
                          value={formData.gender || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-3 border-2 border-violet-200 dark:border-violet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium transition-all"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Work Information Section */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-700/50">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">Work Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Department */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          Department
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            name="department"
                            value={formData.department || ''}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-3 py-3 border-2 border-blue-200 dark:border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white transition-all"
                            placeholder="Enter department"
                          />
                        </div>
                      </div>

                      {/* Office Location */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Office Location *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            name="officeLocation"
                            value={formData.officeLocation || ''}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-3 py-3 border-2 ${formErrors.officeLocation ? 'border-red-400 dark:border-red-500' : 'border-blue-200 dark:border-blue-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white transition-all`}
                            placeholder="Enter office location"
                          />
                        </div>
                        {formErrors.officeLocation && <p className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs mt-1.5 font-medium"><svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{formErrors.officeLocation}</p>}
                      </div>

                      {/* Role */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Role *
                        </label>
                        <select
                          name="role"
                          value={formData.role || 'User'}
                          onChange={handleInputChange}
                          className="w-full px-3 py-3 border-2 border-blue-200 dark:border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium transition-all"
                        >
                          <option value="Admin">🛡️ Admin</option>
                          <option value="Manager">💼 Manager</option>
                          <option value="Technician">🔧 Technician</option>
                          <option value="User">👤 User</option>
                        </select>
                      </div>

                      {/* Status */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Status *
                        </label>
                        <select
                          name="status"
                          value={formData.status || 'Active'}
                          onChange={handleInputChange}
                          className="w-full px-3 py-3 border-2 border-blue-200 dark:border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium transition-all"
                        >
                          <option value="Active">✅ Active</option>
                          <option value="Inactive">⛔ Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-xl p-6 border-2 border-emerald-200 dark:border-emerald-700/50">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100">Address Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Street */}
                      <div className="md:col-span-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          Street Address *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            name="address.street"
                            value={formData.address?.street || ''}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-3 py-3 border-2 ${formErrors.street ? 'border-red-400 dark:border-red-500' : 'border-emerald-200 dark:border-emerald-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 dark:text-white transition-all`}
                            placeholder="Enter street address"
                          />
                        </div>
                        {formErrors.street && <p className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs mt-1.5 font-medium"><svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{formErrors.street}</p>}
                      </div>

                      {/* City */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          City *
                        </label>
                        <input
                          type="text"
                          name="address.city"
                          value={formData.address?.city || ''}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-3 border-2 ${formErrors.city ? 'border-red-400 dark:border-red-500' : 'border-emerald-200 dark:border-emerald-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 dark:text-white transition-all`}
                          placeholder="Enter city"
                        />
                        {formErrors.city && <p className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs mt-1.5 font-medium"><svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{formErrors.city}</p>}
                      </div>

                      {/* State */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          State *
                        </label>
                        <select
                          name="address.state"
                          value={formData.address?.state || ''}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-3 border-2 ${formErrors.state ? 'border-red-400 dark:border-red-500' : 'border-emerald-200 dark:border-emerald-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium transition-all`}
                        >
                          <option value="">Select State</option>
                          {INDIAN_STATES.map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                        {formErrors.state && <p className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs mt-1.5 font-medium"><svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{formErrors.state}</p>}
                      </div>

                      {/* Pincode */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                          Pincode *
                        </label>
                        <input
                          type="text"
                          name="address.pincode"
                          value={formData.address?.pincode || ''}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-3 border-2 ${formErrors.pincode ? 'border-red-400 dark:border-red-500' : 'border-emerald-200 dark:border-emerald-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 dark:text-white transition-all`}
                          placeholder="Enter pincode"
                        />
                        {formErrors.pincode && <p className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs mt-1.5 font-medium"><svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{formErrors.pincode}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Assigned Regions Section */}
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 rounded-xl p-6 border-2 border-amber-200 dark:border-amber-700/50">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100">Assigned Regions</h3>
                          <p className="text-xs text-amber-700 dark:text-amber-300">Select states/territories for this user</p>
                        </div>
                      </div>

                      {/* Selection Counter Badge */}
                      <div className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg shadow-lg flex items-center gap-2">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        <span className="font-bold">{(formData.assignedRegions || []).length}</span>
                        <span className="text-sm">Selected</span>
                      </div>
                    </div>

                    {/* Quick Select Buttons */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, assignedRegions: [...INDIAN_STATES] }))}
                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg text-xs font-semibold hover:from-emerald-600 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1.5"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, assignedRegions: [] }))}
                        className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-xs font-semibold hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1.5"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Clear All
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const northStates = ['Delhi', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Ladakh', 'Punjab', 'Uttarakhand', 'Uttar Pradesh', 'Chandigarh'];
                          setFormData(prev => ({ ...prev, assignedRegions: northStates }));
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-xs font-semibold hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1.5"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        North India
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const southStates = ['Andhra Pradesh', 'Karnataka', 'Kerala', 'Tamil Nadu', 'Telangana', 'Puducherry', 'Andaman and Nicobar Islands', 'Lakshadweep'];
                          setFormData(prev => ({ ...prev, assignedRegions: southStates }));
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg text-xs font-semibold hover:from-purple-600 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1.5"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        South India
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const eastStates = ['Bihar', 'Jharkhand', 'Odisha', 'West Bengal', 'Assam', 'Arunachal Pradesh', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Sikkim', 'Tripura'];
                          setFormData(prev => ({ ...prev, assignedRegions: eastStates }));
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg text-xs font-semibold hover:from-indigo-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1.5"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        East India
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const westStates = ['Goa', 'Gujarat', 'Maharashtra', 'Rajasthan', 'Dadra and Nagar Haveli and Daman and Diu'];
                          setFormData(prev => ({ ...prev, assignedRegions: westStates }));
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg text-xs font-semibold hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1.5"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        West India
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const centralStates = ['Chhattisgarh', 'Madhya Pradesh'];
                          setFormData(prev => ({ ...prev, assignedRegions: centralStates }));
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg text-xs font-semibold hover:from-teal-600 hover:to-teal-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1.5"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        Central India
                      </button>
                    </div>

                    {/* Search Box */}
                    <div className="mb-4">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          value={regionSearchTerm}
                          onChange={(e) => setRegionSearchTerm(e.target.value)}
                          placeholder="Search states/territories..."
                          className="w-full pl-10 pr-10 py-3 border-2 border-amber-200 dark:border-amber-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 dark:text-white transition-all"
                        />
                        {regionSearchTerm && (
                          <button
                            type="button"
                            onClick={() => setRegionSearchTerm('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-amber-400 hover:text-amber-600"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border-2 border-amber-200 dark:border-amber-600">
                      <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                        {INDIAN_STATES
                          .filter(state => state.toLowerCase().includes(regionSearchTerm.toLowerCase()))
                          .map(state => (
                            <label
                              key={state}
                              className="flex items-center gap-3 p-3 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 cursor-pointer transition-all duration-200 border border-amber-100 dark:border-amber-800/50 group hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-md"
                            >
                              <input
                                type="checkbox"
                                checked={(formData.assignedRegions || []).includes(state)}
                                onChange={(e) => {
                                  const currentRegions = formData.assignedRegions || [];
                                  const newRegions = e.target.checked
                                    ? [...currentRegions, state]
                                    : currentRegions.filter(r => r !== state);
                                  setFormData(prev => ({ ...prev, assignedRegions: newRegions }));
                                }}
                                className="h-5 w-5 rounded border-amber-300 dark:border-amber-600 text-amber-600 focus:ring-amber-500 cursor-pointer"
                              />
                              <div className="flex items-center gap-2 flex-1">
                                <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                                  {state}
                                </span>
                              </div>
                              {(formData.assignedRegions || []).includes(state) && (
                                <svg className="h-5 w-5 text-emerald-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </label>
                          ))}
                        {INDIAN_STATES.filter(state => state.toLowerCase().includes(regionSearchTerm.toLowerCase())).length === 0 && (
                          <div className="text-center py-8 text-amber-600 dark:text-amber-400">
                            <svg className="h-12 w-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="font-medium">No regions found matching "{regionSearchTerm}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end gap-4 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-lg font-bold hover:from-violet-700 hover:to-violet-800 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 transform hover:-translate-y-0.5"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {modalType === 'create' ? 'Create User' : 'Update User'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Permissions Dialog */}
      {permissionsUser && (
        <UserPermissionsDialog
          user={permissionsUser}
          onSave={handleSavePermissions}
          onClose={() => setPermissionsUser(null)}
        />
      )}

      {/* Delete User Dialog */}
      <DeleteUserDialog
        isOpen={showDeleteDialog}
        user={userToDelete}
        onConfirm={confirmDeleteUser}
        onCancel={() => {
          setShowDeleteDialog(false);
          setUserToDelete(null);
        }}
      />
    </div>
  );
};

export default UserManagement;