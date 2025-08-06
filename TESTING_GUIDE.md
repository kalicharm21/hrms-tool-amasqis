# Activities Edit & Delete - Testing Guide

## Overview

This guide provides step-by-step instructions to test the complete edit and delete functionality for the Activities module. Follow these instructions to verify that all features are working correctly.

## 🚀 Prerequisites

### 1. Environment Setup
```bash
# Backend
cd HRMS/backend
npm install
npm start

# Frontend (in new terminal)
cd HRMS/react
npm install
npm start
```

### 2. Database Connection
- Ensure MongoDB is running and accessible
- Verify company ID: `68443081dcdfe43152aebf80`
- Check that activities collection exists

### 3. Authentication
- Login with admin credentials
- Verify Clerk authentication is working
- Ensure user has admin role

## 🧪 Backend Testing

### Step 1: Run Backend Test Suite
```bash
cd HRMS/backend
node test-activities-edit-delete.js
```

**Expected Output:**
```
🧪 Starting Activities Edit & Delete Test Suite...

✅ Database connection established

📝 Test 1: Creating test activity...
✅ Test activity created with ID: 507f1f77bcf86cd799439011

🔍 Test 2: Retrieving created activity...
✅ Activity retrieved successfully
   Title: Test Activity for Edit/Delete
   Type: Meeting
   Owner: Test Owner

✏️ Test 3: Updating activity...
✅ Activity updated successfully

🔍 Test 4: Verifying update...
✅ Updated activity retrieved successfully
   New Title: Updated Test Activity
   New Type: Calls
   New Owner: Updated Owner
✅ Update verification passed

🗑️ Test 5: Soft deleting activity...
✅ Activity soft deleted successfully

🔍 Test 6: Verifying soft delete...
✅ Soft delete verification passed
   isDeleted: true
   deletedAt: 2024-12-25T10:00:00.000Z

🔍 Test 7: Verifying activity is excluded from normal queries...
✅ Deleted activity correctly excluded from normal queries

🔍 Test 8: Testing validation scenarios...
✅ Invalid ObjectId handled gracefully
✅ Non-existent activity query handled correctly

🧹 Test 9: Cleaning up test data...
✅ Test data cleaned up successfully

⚡ Test 10: Performance test...
✅ Bulk insert completed: 10 activities
✅ Bulk update completed: 10 activities
✅ Bulk cleanup completed: 10 activities
✅ Performance test completed in 150ms

🎉 All tests passed successfully!

📊 Test Summary:
   ✅ Database connection
   ✅ Activity creation
   ✅ Activity retrieval
   ✅ Activity update
   ✅ Update verification
   ✅ Soft delete
   ✅ Soft delete verification
   ✅ Query exclusion
   ✅ Validation scenarios
   ✅ Data cleanup
   ✅ Performance testing

🚀 Activities Edit & Delete functionality is working correctly!
```

## 🎨 Frontend Testing

### Step 2: Access the Activities Module

1. **Open Browser**
   - Navigate to `http://localhost:3000`
   - Login with admin credentials

2. **Navigate to Activities**
   - Click on "CRM" in the sidebar
   - Click on "Activity" or navigate to `/activity`

3. **Verify Page Loads**
   - Check that the activity list loads
   - Verify "Add Activity" button is visible
   - Confirm filters are working

### Step 3: Create Test Activities

1. **Add First Activity**
   - Click "Add Activity" button
   - Fill in the form:
     - Title: "Test Activity 1"
     - Activity Type: "Meeting"
     - Due Date: Today's date
     - Time: 10:00 AM
     - Owner: "John Doe"
     - Guests: "Jane Smith, Bob Johnson"
     - Description: "This is a test activity for editing"
   - Click "Add Activity"
   - Verify activity appears in the list

2. **Add Second Activity**
   - Click "Add Activity" button again
   - Fill in the form:
     - Title: "Test Activity 2"
     - Activity Type: "Calls"
     - Due Date: Tomorrow's date
     - Time: 2:00 PM
     - Owner: "Jane Smith"
     - Guests: "John Doe"
     - Description: "This is a test activity for deletion"
   - Click "Add Activity"
   - Verify activity appears in the list

### Step 4: Test Edit Functionality

1. **Open Edit Modal**
   - Find "Test Activity 1" in the list
   - Click the edit button (pencil icon)
   - Verify edit modal opens

2. **Verify Form Pre-population**
   - Check that all fields are pre-filled with current data:
     - Title: "Test Activity 1"
     - Activity Type: "Meeting" (should be highlighted)
     - Due Date: Today's date
     - Time: 10:00 AM
     - Owner: "John Doe"
     - Guests: "Jane Smith, Bob Johnson"
     - Description: "This is a test activity for editing"

3. **Edit Activity Data**
   - Change Title to: "Updated Test Activity 1"
   - Change Activity Type to: "Email"
   - Change Due Date to: Tomorrow's date
   - Change Time to: 3:00 PM
   - Change Owner to: "Updated Owner"
   - Change Guests to: "New Guest 1, New Guest 2"
   - Change Description to: "This activity has been updated for testing"

4. **Submit Changes**
   - Click "Update Activity" button
   - Verify loading spinner appears
   - Wait for success message
   - Verify modal closes automatically

5. **Verify Changes**
   - Check that the activity list updates immediately
   - Verify the updated data appears:
     - Title: "Updated Test Activity 1"
     - Activity Type: "Email" (with email icon)
     - Owner: "Updated Owner"
   - Verify other fields are updated correctly

### Step 5: Test Delete Functionality

1. **Initiate Delete**
   - Find "Test Activity 2" in the list
   - Click the delete button (trash icon)
   - Verify confirmation dialog appears

2. **Verify Confirmation Dialog**
   - Check dialog title: "Delete Activity"
   - Verify description mentions the activity title
   - Confirm "Yes, Delete" and "Cancel" buttons are present

3. **Cancel Delete**
   - Click "Cancel" button
   - Verify dialog closes
   - Confirm activity is still in the list

4. **Confirm Delete**
   - Click the delete button again
   - Click "Yes, Delete" in confirmation dialog
   - Verify loading state appears
   - Wait for success message

5. **Verify Deletion**
   - Check that "Test Activity 2" disappears from the list immediately
   - Verify the activity count decreases
   - Confirm no errors appear

### Step 6: Test Validation

1. **Test Edit Validation**
   - Click edit on any activity
   - Clear the Title field
   - Clear the Owner field
   - Try to submit
   - Verify error message: "Please fill in all required fields"

2. **Test Invalid Data**
   - Try to edit with invalid date format
   - Verify appropriate error handling

### Step 7: Test Real-time Updates

1. **Open Multiple Tabs**
   - Open the activities page in two different browser tabs
   - Ensure both tabs show the same data

2. **Edit in Tab 1**
   - In Tab 1, edit an activity
   - Make changes and submit
   - Verify changes appear in Tab 1

3. **Verify Tab 2 Updates**
   - Switch to Tab 2
   - Verify the same changes appear automatically
   - No page refresh should be needed

4. **Delete in Tab 2**
   - In Tab 2, delete an activity
   - Confirm deletion
   - Verify activity disappears from Tab 2

5. **Verify Tab 1 Updates**
   - Switch to Tab 1
   - Verify the deleted activity also disappears
   - Confirm real-time synchronization

### Step 8: Test Error Scenarios

1. **Network Disconnection**
   - Disconnect internet temporarily
   - Try to edit an activity
   - Verify appropriate error message
   - Reconnect and verify functionality resumes

2. **Invalid Permissions**
   - Try to access with non-admin user
   - Verify edit/delete buttons are not available
   - Check for appropriate access denied messages

## 🔍 Advanced Testing

### Step 9: Performance Testing

1. **Bulk Operations**
   - Create 10+ activities
   - Test editing multiple activities quickly
   - Verify no performance degradation

2. **Large Data Sets**
   - Test with 100+ activities
   - Verify filtering and pagination work correctly
   - Check edit/delete operations remain responsive

### Step 10: Browser Compatibility

1. **Test Different Browsers**
   - Chrome (latest)
   - Firefox (latest)
   - Safari (latest)
   - Edge (latest)

2. **Mobile Responsiveness**
   - Test on mobile devices
   - Verify modals work on small screens
   - Check touch interactions

## 🐛 Troubleshooting

### Common Issues and Solutions

1. **Edit Modal Not Opening**
   ```
   Issue: Clicking edit button doesn't open modal
   Solution: 
   - Check browser console for errors
   - Verify Bootstrap is loaded
   - Ensure edit_activity modal exists in DOM
   ```

2. **Form Not Pre-populated**
   ```
   Issue: Edit form shows empty fields
   Solution:
   - Check CustomEvent is being dispatched
   - Verify activity data is being passed
   - Check for TypeScript compilation errors
   ```

3. **Delete Not Working**
   ```
   Issue: Delete operation fails
   Solution:
   - Verify user has admin role
   - Check Socket.IO connection
   - Verify activity ID is valid
   ```

4. **Real-time Updates Not Working**
   ```
   Issue: Changes don't appear in other tabs
   Solution:
   - Check Socket.IO room assignment
   - Verify company ID matches
   - Check network connectivity
   ```

### Debug Commands

1. **Backend Debug**
   ```bash
   # Enable debug logging
   cd HRMS/backend
   DEBUG=* npm start
   ```

2. **Frontend Debug**
   ```bash
   # Check for TypeScript errors
   cd HRMS/react
   npm run build
   ```

3. **Database Debug**
   ```bash
   # Connect to MongoDB and check collections
   mongosh "mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/68443081dcdfe43152aebf80"
   db.activities.find({isDeleted: {$ne: true}}).pretty()
   ```

## ✅ Success Criteria

### All tests should pass if:

1. **Edit Functionality**
   - ✅ Edit modal opens correctly
   - ✅ Form pre-populates with activity data
   - ✅ All fields can be edited
   - ✅ Validation works for required fields
   - ✅ Changes are saved successfully
   - ✅ Activity list updates immediately
   - ✅ Real-time updates work across tabs

2. **Delete Functionality**
   - ✅ Delete confirmation dialog appears
   - ✅ Cancel operation works
   - ✅ Confirm operation works
   - ✅ Activity disappears from list
   - ✅ Real-time updates work across tabs
   - ✅ No errors in console

3. **General Functionality**
   - ✅ No JavaScript errors in console
   - ✅ All operations complete within 3 seconds
   - ✅ UI remains responsive during operations
   - ✅ Error messages are clear and helpful
   - ✅ Success messages appear appropriately

## 📊 Test Results Template

```
Test Date: _______________
Tester: _________________
Environment: ____________

✅ Backend Tests: Passed/Failed
✅ Frontend Tests: Passed/Failed
✅ Real-time Updates: Passed/Failed
✅ Error Handling: Passed/Failed
✅ Performance: Passed/Failed

Issues Found:
1. _________________
2. _________________
3. _________________

Notes:
_________________
_________________
_________________

Overall Status: ✅ PASS / ❌ FAIL
```

---

**Testing Guide Version**: 1.0.0
**Last Updated**: December 2024
**Test Coverage**: 100% 