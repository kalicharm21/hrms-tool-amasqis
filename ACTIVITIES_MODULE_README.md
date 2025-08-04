# Activities Module - HRMS Implementation

## Overview

The Activities Module has been successfully implemented for the HRMS system, providing comprehensive activity management functionality with real-time updates, role-based access control, and multi-tenant architecture.

## 🏗️ Architecture

### Backend Implementation
- **Controller**: `HRMS/backend/controllers/activities/activities.controllers.js`
- **Services**: `HRMS/backend/services/activities/activities.services.js`
- **Database**: MongoDB with multi-tenant collections
- **Real-time**: Socket.IO for live updates

### Frontend Implementation
- **Component**: `HRMS/react/src/feature-module/administration/help-support/activity.tsx`
- **State Management**: React hooks with Socket.IO integration
- **UI Framework**: Ant Design + Bootstrap + Custom styling

## 🔐 Security & Access Control

### Role-Based Access
- **Admin Only**: All CRUD operations require admin role
- **Company Isolation**: Users can only access their company's activities
- **Input Validation**: Comprehensive validation on all inputs
- **Rate Limiting**: Built-in rate limiting for production

### Company Validation
```javascript
// Company ID validation pattern
const companyIdRegex = /^[a-zA-Z0-9_-]{3,50}$/;
if (!companyIdRegex.test(socket.companyId)) {
  throw new Error("Invalid company ID format");
}
```

## 📊 Database Schema

### Activities Collection Structure
```javascript
{
  _id: ObjectId,
  title: String,           // Required: Activity title
  activityType: String,    // Required: Meeting, Calls, Tasks, Email
  dueDate: Date,          // Required: Due date
  owner: String,          // Optional: Activity owner
  description: String,    // Optional: Activity description
  status: String,         // Default: 'pending' (pending, completed, overdue)
  companyId: String,      // Required: Company identifier
  createdAt: Date,        // Auto-generated
  updatedAt: Date,        // Auto-updated
  isDeleted: Boolean,     // Soft delete flag
  deletedAt: Date         // Soft delete timestamp
}
```

### Company Database
- **Database Name**: `68443081dcdfe43152aebf80` (your company ID)
- **Collection**: `activities`
- **Multi-tenant**: Each company has its own database

## 🚀 Features Implemented

### 1. CRUD Operations
- ✅ **Create**: Add new activities with validation
- ✅ **Read**: Get activities with filters and pagination
- ✅ **Update**: Edit existing activities
- ✅ **Delete**: Soft delete with confirmation

### 2. Advanced Filtering
- **Activity Type**: Meeting, Calls, Tasks, Email
- **Status**: Pending, Completed, Overdue
- **Owner**: Filter by activity owner
- **Date Range**: Filter by due date range
- **Real-time**: Filters update results instantly

### 3. Statistics Dashboard
- **Total Activities**: Count of all activities
- **Pending**: Activities with pending status
- **Completed**: Activities marked as completed
- **Overdue**: Activities past due date
- **Type Distribution**: Breakdown by activity type

### 4. Export Functionality
- **PDF Export**: Professional PDF reports
- **Excel Export**: Spreadsheet format with summaries
- **Auto-cleanup**: Files cleaned up after 1 hour

### 5. Real-time Updates
- **Live Updates**: Changes appear instantly across all clients
- **Socket Events**: Real-time broadcasting
- **Room-based**: Company-specific updates

## 🔌 Socket.IO Events

### Client to Server Events
```javascript
// Create activity
socket.emit('activity:create', activityData);

// Get all activities with filters
socket.emit('activity:getAll', filters);

// Get single activity
socket.emit('activity:getById', activityId);

// Update activity
socket.emit('activity:update', { activityId, update });

// Delete activity
socket.emit('activity:delete', { activityId });

// Get statistics
socket.emit('activity:getStats');

// Get owners for filters
socket.emit('activity:getOwners');

// Export to PDF
socket.emit('activity/export-pdf');

// Export to Excel
socket.emit('activity/export-excel');

// Get all data at once
socket.emit('activity:getAllData', filters);
```

### Server to Client Events
```javascript
// Response events (with -response suffix)
'activity:create-response'
'activity:getAll-response'
'activity:getById-response'
'activity:update-response'
'activity:delete-response'
'activity:getStats-response'
'activity:getOwners-response'
'activity/export-pdf-response'
'activity/export-excel-response'
'activity:getAllData-response'

// Real-time broadcast events
'activity:activity-created'
'activity:activity-updated'
'activity:activity-deleted'
```

## 🎨 Frontend Features

### 1. Modern UI Components
- **Responsive Design**: Works on all screen sizes
- **Loading States**: Smooth loading indicators
- **Toast Notifications**: Success/error feedback
- **Modal Forms**: Clean add/edit interfaces

### 2. Interactive Elements
- **Activity Type Buttons**: Visual type selection
- **Status Badges**: Color-coded status indicators
- **Filter Dropdowns**: Easy filtering options
- **Date Range Picker**: Advanced date filtering

### 3. Data Table Features
- **Sorting**: Sort by any column
- **Pagination**: Configurable page sizes
- **Search**: Built-in search functionality
- **Actions**: Edit/delete buttons per row

## 🧪 Testing

### Test Script
Run the test script to verify the implementation:
```bash
cd HRMS/backend
node test-activities.js
```

### Test Coverage
- ✅ Database connection
- ✅ Collection creation
- ✅ Sample data insertion
- ✅ Query operations
- ✅ Statistics calculation
- ✅ Filter operations

## 📋 Usage Examples

### 1. Creating an Activity
```javascript
const activityData = {
  title: "Client Meeting",
  activityType: "Meeting",
  dueDate: "2024-12-25",
  owner: "John Doe",
  description: "Discuss project requirements",
  status: "pending"
};

socket.emit('activity:create', activityData);
```

### 2. Filtering Activities
```javascript
const filters = {
  activityType: 'Meeting',
  status: 'pending',
  owner: 'John Doe',
  startDate: '2024-12-01',
  endDate: '2024-12-31'
};

socket.emit('activity:getAll', filters);
```

### 3. Updating Activity Status
```javascript
const updateData = {
  activityId: 'activity_id_here',
  update: {
    status: 'completed',
    description: 'Meeting completed successfully'
  }
};

socket.emit('activity:update', updateData);
```

## 🔧 Configuration

### Environment Variables
```env
# Backend (.env)
MONGODB_URI=mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/
CLERK_JWT_KEY=your_clerk_jwt_key
FRONTEND_URL=http://localhost:3000
PORT=5000

# Frontend
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_CLERK_PUBLISHABLE_KEY=your_clerk_key
```

### Company Configuration
- **Company ID**: `68443081dcdfe43152aebf80`
- **Database**: Automatically created if not exists
- **Collections**: Activities collection auto-created

## 🚀 Getting Started

### 1. Backend Setup
```bash
cd HRMS/backend
npm install
npm start
```

### 2. Frontend Setup
```bash
cd HRMS/react
npm install
npm start
```

### 3. Access the Module
- Navigate to: `/activity` (or your configured route)
- Login with admin credentials
- Start creating and managing activities

## 🔍 Troubleshooting

### Common Issues

1. **Socket Connection Failed**
   - Check if backend is running on port 5000
   - Verify Clerk authentication is working
   - Check browser console for errors

2. **Database Connection Issues**
   - Verify MongoDB URI is correct
   - Check network connectivity
   - Ensure company ID is valid

3. **Permission Denied**
   - Ensure user has admin role
   - Check company ID matches user's company
   - Verify Clerk metadata is set correctly

### Debug Mode
Enable debug logging in the backend:
```javascript
// In socket/index.js
const isDevelopment = true; // Force development mode
```

## 📈 Performance Considerations

### Optimization Features
- **Pagination**: Large datasets handled efficiently
- **Indexing**: Database indexes on frequently queried fields
- **Caching**: Socket.IO room-based caching
- **Lazy Loading**: Components load data on demand

### Scalability
- **Multi-tenant**: Each company isolated
- **Horizontal Scaling**: Socket.IO clustering ready
- **Database Sharding**: MongoDB sharding support

## 🔮 Future Enhancements

### Planned Features
- [ ] Activity templates
- [ ] Recurring activities
- [ ] Activity reminders
- [ ] Email notifications
- [ ] Activity analytics
- [ ] Mobile app integration
- [ ] Calendar integration
- [ ] Activity dependencies

### API Extensions
- [ ] REST API endpoints
- [ ] GraphQL support
- [ ] Webhook integrations
- [ ] Third-party integrations

## 📞 Support

For questions or issues:
1. Check the troubleshooting section
2. Review the test script output
3. Check browser console for errors
4. Verify database connectivity
5. Ensure proper role assignments

---

**Implementation Status**: ✅ Complete
**Last Updated**: December 2024
**Version**: 1.0.0 