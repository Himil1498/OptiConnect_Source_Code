import * as XLSX from 'xlsx';
import type { User } from '../types/auth.types';

// Import/Export utilities for user management

/**
 * Export users to Excel (XLSX) format
 */
export const exportUsersToExcel = (users: User[], filename: string = 'users_export.xlsx'): void => {
  // Prepare data for export
  const exportData = users.map(user => ({
    'User ID': user.id,
    'Username': user.username,
    'Full Name': user.name,
    'Email': user.email,
    'Gender': user.gender,
    'Phone Number': user.phoneNumber,
    'Street': user.address.street,
    'City': user.address.city,
    'State': user.address.state,
    'Pincode': user.address.pincode,
    'Office Location': user.officeLocation,
    'Assigned Under': user.assignedUnder.join(', '),
    'Role': user.role,
    'Assigned Regions': user.assignedRegions.join(', '),
    'Status': user.status,
    'Company': user.company || '',
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set column widths
  const columnWidths = [
    { wch: 12 }, // User ID
    { wch: 15 }, // Username
    { wch: 20 }, // Full Name
    { wch: 25 }, // Email
    { wch: 10 }, // Gender
    { wch: 15 }, // Phone
    { wch: 25 }, // Street
    { wch: 15 }, // City
    { wch: 15 }, // State
    { wch: 10 }, // Pincode
    { wch: 20 }, // Office Location
    { wch: 20 }, // Assigned Under
    { wch: 12 }, // Role
    { wch: 30 }, // Assigned Regions
    { wch: 10 }, // Status
    { wch: 15 }, // Company
  ];
  worksheet['!cols'] = columnWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

  // Save file
  XLSX.writeFile(workbook, filename);
};

/**
 * Export users to CSV format
 */
export const exportUsersToCSV = (users: User[], filename: string = 'users_export.csv'): void => {
  const exportData = users.map(user => ({
    'User ID': user.id,
    'Username': user.username,
    'Full Name': user.name,
    'Email': user.email,
    'Gender': user.gender,
    'Phone Number': user.phoneNumber,
    'Street': user.address.street,
    'City': user.address.city,
    'State': user.address.state,
    'Pincode': user.address.pincode,
    'Office Location': user.officeLocation,
    'Assigned Under': user.assignedUnder.join('; '),
    'Role': user.role,
    'Assigned Regions': user.assignedRegions.join('; '),
    'Status': user.status,
    'Company': user.company || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const csv = XLSX.utils.sheet_to_csv(worksheet);

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export users to JSON format
 */
export const exportUsersToJSON = (users: User[], filename: string = 'users_export.json'): void => {
  const jsonStr = JSON.stringify(users, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Download Excel template for user import
 */
export const downloadImportTemplate = (filename: string = 'user_import_template.xlsx'): void => {
  const templateData = [
    {
      'Username': 'john_doe',
      'Full Name': 'John Doe',
      'Email': 'john.doe@example.com',
      'Gender': 'Male',
      'Phone Number': '+91-9876543210',
      'Street': '123 Main Street',
      'City': 'Mumbai',
      'State': 'Maharashtra',
      'Pincode': '400001',
      'Office Location': 'Mumbai Office',
      'Assigned Under': 'USER001',
      'Role': 'User',
      'Assigned Regions': 'Maharashtra, Gujarat',
      'Status': 'Active',
      'Company': 'Jio',
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 15 },
    { wch: 20 },
    { wch: 25 },
    { wch: 10 },
    { wch: 15 },
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 10 },
    { wch: 20 },
    { wch: 20 },
    { wch: 12 },
    { wch: 30 },
    { wch: 10 },
    { wch: 15 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'User Template');

  XLSX.writeFile(workbook, filename);
};

/**
 * Parse imported Excel file to user data
 */
export const parseImportedFile = async (file: File): Promise<{
  users: Partial<User>[];
  errors: string[];
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const users: Partial<User>[] = [];
        const errors: string[] = [];

        jsonData.forEach((row: any, index: number) => {
          try {
            // Validate required fields
            if (!row['Username']) {
              errors.push(`Row ${index + 2}: Username is required`);
              return;
            }
            if (!row['Email']) {
              errors.push(`Row ${index + 2}: Email is required`);
              return;
            }

            // Parse user data
            const user: Partial<User> = {
              username: row['Username'],
              name: row['Full Name'],
              email: row['Email'],
              gender: row['Gender'] || '',
              phoneNumber: row['Phone Number'] || '',
              address: {
                street: row['Street'] || '',
                city: row['City'] || '',
                state: row['State'] || '',
                pincode: row['Pincode'] || '',
              },
              officeLocation: row['Office Location'] || '',
              assignedUnder: row['Assigned Under']
                ? row['Assigned Under'].split(',').map((s: string) => s.trim())
                : [],
              role: (row['Role'] || 'User') as 'Admin' | 'Manager' | 'Technician' | 'User',
              assignedRegions: row['Assigned Regions']
                ? row['Assigned Regions'].split(',').map((s: string) => s.trim())
                : [],
              status: (row['Status'] || 'Active') as 'Active' | 'Inactive',
              company: row['Company'] || '',
              password: '', // Will be set by backend
            };

            users.push(user);
          } catch (error) {
            errors.push(`Row ${index + 2}: Invalid data format - ${error}`);
          }
        });

        resolve({ users, errors });
      } catch (error) {
        reject(new Error(`Failed to parse file: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsBinaryString(file);
  });
};

/**
 * Validate user data before import
 */
export const validateUserData = (user: Partial<User>): string[] => {
  const errors: string[] = [];

  if (!user.username || user.username.trim() === '') {
    errors.push('Username is required');
  }

  if (!user.name || user.name.trim() === '') {
    errors.push('Full name is required');
  }

  if (!user.email || user.email.trim() === '') {
    errors.push('Email is required');
  } else if (!/\S+@\S+\.\S+/.test(user.email)) {
    errors.push('Email is invalid');
  }

  if (!user.phoneNumber || user.phoneNumber.trim() === '') {
    errors.push('Phone number is required');
  }

  if (!user.address || !user.address.street || user.address.street.trim() === '') {
    errors.push('Street address is required');
  }

  if (!user.address || !user.address.city || user.address.city.trim() === '') {
    errors.push('City is required');
  }

  if (!user.address || !user.address.state || user.address.state.trim() === '') {
    errors.push('State is required');
  }

  if (!user.address || !user.address.pincode || user.address.pincode.trim() === '') {
    errors.push('Pincode is required');
  }

  if (!user.officeLocation || user.officeLocation.trim() === '') {
    errors.push('Office location is required');
  }

  if (!user.role || !['Admin', 'Manager', 'Technician', 'User'].includes(user.role)) {
    errors.push('Valid role is required (Admin, Manager, Technician, or User)');
  }

  return errors;
};