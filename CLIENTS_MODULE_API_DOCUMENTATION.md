# Clients Module API Documentation

## Overview
The Clients module provides complete CRUD operations for managing client data in the HRMS system. It follows the MCS (Model-Controller-Service) architecture pattern with Socket.IO for real-time communication.

## Authentication & Authorization
- **Roles**: Admin and HR roles have full access to all client operations
- **Employee Role**: No access to client operations
- **Company Isolation**: All operations are scoped to the user's company via `companyId`

## Socket.IO Events

### 1. Create Client
**Event**: `client:create`
**Access**: Admin, HR
**Request Data**:
```javascript
{
  name: "John Doe",                    // Required
  company: "Tech Solutions Inc",       // Required  
  email: "john@techsolutions.com",     // Required
  phone: "+1-555-0123",               // Optional
  address: "123 Business Ave",         // Optional
  logo: "assets/img/company/logo.svg", // Optional
  status: "Active",                    // Optional (default: "Active")
  contractValue: 150000,               // Optional (default: 0)
  projects: 3                          // Optional (default: 0)
}
```
**Response Event**: `client:create-response`
**Response Data**:
```javascript
{
  done: true,
  data: {
    _id: "507f1f77bcf86cd799439011",
    name: "John Doe",
    company: "Tech Solutions Inc",
    email: "john@techsolutions.com",
    phone: "+1-555-0123",
    address: "123 Business Ave",
    logo: "assets/img/company/logo.svg",
    status: "Active",
    contractValue: 150000,
    projects: 3,
    createdAt: "2024-01-15T10:30:00.000Z",
    updatedAt: "2024-01-15T10:30:00.000Z",
    isDeleted: false
  }
}
```

### 2. Get All Clients
**Event**: `client:getAll`
**Access**: Admin, HR, Employee (read-only)
**Request Data**:
```javascript
{
  status: "Active",           // Optional filter
  search: "tech",             // Optional search term
  sortBy: "createdAt",        // Optional sort field
  sortOrder: "desc"           // Optional sort order
}
```
**Response Event**: `client:getAll-response`

### 3. Get Client by ID
**Event**: `client:getById`
**Access**: Admin, HR, Employee (read-only)
**Request Data**: `"507f1f77bcf86cd799439011"` (clientId as string)
**Response Event**: `client:getById-response`

### 4. Update Client
**Event**: `client:update`
**Access**: Admin, HR
**Request Data**:
```javascript
{
  clientId: "507f1f77bcf86cd799439011",
  update: {
    phone: "+1-555-9999",
    contractValue: 200000,
    projects: 5
  }
}
```
**Response Event**: `client:update-response`

### 5. Delete Client (Soft Delete)
**Event**: `client:delete`
**Access**: Admin, HR
**Request Data**:
```javascript
{
  clientId: "507f1f77bcf86cd799439011"
}
```
**Response Event**: `client:delete-response`

### 6. Get Client Statistics
**Event**: `client:getStats`
**Access**: Admin, HR, Employee (read-only)
**Request Data**: No data required
**Response Event**: `client:getStats-response`
**Response Data**:
```javascript
{
  done: true,
  data: {
    totalClients: 150,
    activeClients: 135,
    inactiveClients: 15,
    newClients: 12,              // Last 30 days
    totalContractValue: 2500000
  }
}
```

### 7. Filter Clients
**Event**: `client:filter`
**Access**: Admin, HR, Employee (read-only)
**Request Data**:
```javascript
{
  status: "Active",             // "Active", "Inactive", or "All"
  company: "Tech",              // Company name filter
  dateRange: {
    startDate: "2024-01-01",
    endDate: "2024-01-31"
  },
  sortBy: "name",               // Sort field
  sortOrder: "asc"              // "asc" or "desc"
}
```
**Response Event**: `client:filter-response`

### 8. Get All Data (Dashboard)
**Event**: `client:getAllData`
**Access**: Admin, HR, Employee (read-only)
**Request Data**: Optional filters (same as getAll)
**Response Event**: `client:getAllData-response`
**Response Data**:
```javascript
{
  done: true,
  data: {
    clients: [...],             // Array of client objects
    stats: {                    // Statistics object
      totalClients: 150,
      activeClients: 135,
      // ... other stats
    }
  }
}
```

### 9. Export PDF
**Event**: `client/export-pdf`
**Access**: Admin, HR
**Request Data**: No data required
**Response Event**: `client/export-pdf-response`
**Response Data**:
```javascript
{
  done: true,
  data: {
    pdfUrl: "/exports/clients-export-1642248600000.pdf",
    pdfPath: "/path/to/file.pdf",
    fileName: "clients-export-1642248600000.pdf"
  }
}
```

### 10. Export Excel
**Event**: `client/export-excel`
**Access**: Admin, HR
**Request Data**: No data required
**Response Event**: `client/export-excel-response`
**Response Data**: Similar to PDF export

## Real-time Updates
The system broadcasts real-time updates to all connected admin and HR users:

- `client:client-created` - When a new client is created
- `client:client-updated` - When a client is updated
- `client:client-deleted` - When a client is deleted

## Frontend Integration Examples

### React Hook for Clients
```javascript
import { useSocket } from './SocketContext';
import { useState, useEffect } from 'react';

export const useClients = () => {
  const socket = useSocket();
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);

  // Get all clients
  const fetchClients = (filters = {}) => {
    setLoading(true);
    socket.emit('client:getAll', filters);
  };

  // Create client
  const createClient = (clientData) => {
    socket.emit('client:create', clientData);
  };

  // Update client
  const updateClient = (clientId, updateData) => {
    socket.emit('client:update', { clientId, update: updateData });
  };

  // Delete client
  const deleteClient = (clientId) => {
    socket.emit('client:delete', { clientId });
  };

  // Get statistics
  const fetchStats = () => {
    socket.emit('client:getStats');
  };

  useEffect(() => {
    // Response handlers
    socket.on('client:getAll-response', (response) => {
      setLoading(false);
      if (response.done) {
        setClients(response.data);
      }
    });

    socket.on('client:getStats-response', (response) => {
      if (response.done) {
        setStats(response.data);
      }
    });

    // Real-time update handlers
    socket.on('client:client-created', (response) => {
      if (response.done) {
        setClients(prev => [response.data, ...prev]);
      }
    });

    socket.on('client:client-updated', (response) => {
      if (response.done) {
        setClients(prev => 
          prev.map(client => 
            client._id === response.data._id ? response.data : client
          )
        );
      }
    });

    socket.on('client:client-deleted', (response) => {
      if (response.done) {
        setClients(prev => 
          prev.filter(client => client._id !== response.data._id)
        );
      }
    });

    return () => {
      socket.off('client:getAll-response');
      socket.off('client:getStats-response');
      socket.off('client:client-created');
      socket.off('client:client-updated');
      socket.off('client:client-deleted');
    };
  }, [socket]);

  return {
    clients,
    stats,
    loading,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    fetchStats
  };
};
```

### Client List Component Example
```javascript
import React, { useEffect, useState } from 'react';
import { useClients } from './hooks/useClients';

const ClientList = () => {
  const { 
    clients, 
    stats, 
    loading, 
    fetchClients, 
    createClient, 
    updateClient, 
    deleteClient,
    fetchStats 
  } = useClients();
  
  const [filters, setFilters] = useState({
    status: 'All',
    search: ''
  });

  useEffect(() => {
    fetchClients(filters);
    fetchStats();
  }, [filters]);

  const handleCreateClient = (formData) => {
    createClient(formData);
  };

  const handleUpdateClient = (clientId, updateData) => {
    updateClient(clientId, updateData);
  };

  const handleDeleteClient = (clientId) => {
    if (confirm('Are you sure you want to delete this client?')) {
      deleteClient(clientId);
    }
  };

  return (
    <div className="client-list">
      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <h3>{stats.totalClients || 0}</h3>
          <p>Total Clients</p>
        </div>
        <div className="stat-card">
          <h3>{stats.activeClients || 0}</h3>
          <p>Active Clients</p>
        </div>
        <div className="stat-card">
          <h3>{stats.inactiveClients || 0}</h3>
          <p>Inactive Clients</p>
        </div>
        <div className="stat-card">
          <h3>{stats.newClients || 0}</h3>
          <p>New Clients</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <select 
          value={filters.status} 
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        
        <input
          type="text"
          placeholder="Search clients..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
        />
      </div>

      {/* Client Table */}
      <div className="client-table">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Contract Value</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(client => (
                <tr key={client._id}>
                  <td>{client.name}</td>
                  <td>{client.company}</td>
                  <td>{client.email}</td>
                  <td>{client.phone}</td>
                  <td>
                    <span className={`status ${client.status.toLowerCase()}`}>
                      {client.status}
                    </span>
                  </td>
                  <td>${client.contractValue?.toLocaleString()}</td>
                  <td>
                    <button onClick={() => handleUpdateClient(client._id, {...})}>
                      Edit
                    </button>
                    <button onClick={() => handleDeleteClient(client._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ClientList;
```

## Error Handling
All responses follow the standard format:
```javascript
{
  done: boolean,
  data?: any,
  error?: string
}
```

Common error scenarios:
- Invalid client ID format
- Client not found
- Duplicate email addresses
- Unauthorized access (wrong role)
- Company ID mismatch
- Validation errors (missing required fields)

## Database Schema
```javascript
{
  _id: ObjectId,
  name: String,              // Required
  company: String,           // Required
  email: String,             // Required, unique per company
  phone: String,
  address: String,
  logo: String,
  status: String,            // "Active" or "Inactive"
  contractValue: Number,     // Default: 0
  projects: Number,          // Default: 0
  createdAt: Date,
  updatedAt: Date,
  isDeleted: Boolean         // Soft delete flag
}
```

## Testing
Run the test suite:
```bash
node backend/test/clients-test.js
```

The test suite covers:
- All CRUD operations
- Role-based access control
- Export functionality
- Real-time updates
- Error scenarios
- Data validation
