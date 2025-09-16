import * as adminService from "../../services/admin/admin.services.js";
import { ObjectId } from "mongodb";


const allowedLeaveTypes = ['casual leave', 'medical leave', 'annual leave', 'loss of pay'];
const allowedStatuses = ['pending', 'approved', 'declined'];


const adminLeavesController = (socket, io) => {


  const validateAccess = () => {
    if (!socket.companyId) throw new Error("Company ID missing");
    if (socket.userMetadata?.role !== "admin") throw new Error("Unauthorized");
    return socket.companyId;
  };


socket.on("admin/leaves/get-summary", async () => {
  console.log("Received admin/leaves/get-summary event");
  try {
    const companyId = validateAccess();
    const summary = await adminService.getLeaveSummary(companyId);
    console.log("Summary data to send:", summary);
    socket.emit("admin/leaves/get-summary-response", { done: true, data: summary });
  } catch (error) {
    console.error("admin/leaves/get-summary error:", error);
    socket.emit("admin/leaves/get-summary-response", { done: false, error: error.message });
  }
});
  // Existing handlers...


socket.on("admin/leaves/get-list", async () => {
  console.log(`admin/leaves/get-list event received from socket: ${socket.id}`);
  try {
    const companyId = validateAccess();


    // Call getCompanyLeaves service
    const leavesResponse = await adminService.getCompanyLeaves(companyId);
    console.log("Leaves data to send:", leavesResponse);
    // Log the data count right before emitting to client
    if (leavesResponse.done) {
      console.log(`Sending leaves list with ${leavesResponse.data.length} records to client.`);
    } else {
      console.log(`Failed to get leaves: ${leavesResponse.error}`);
    }


    socket.emit("admin/leaves/get-list-response", leavesResponse);
  } catch (error) {
    console.error("admin/leaves/get-list error:", error);
    socket.emit("admin/leaves/get-list-response", { done: false, error: error.message });
  }
});



  socket.on("admin/leaves/add", async (leaveData) => {
    try {
      const companyId = validateAccess();


      if (!leaveData.employeeId) throw new Error("Employee ID is required");
      if (!leaveData.leaveType || !allowedLeaveTypes.includes(leaveData.leaveType.toLowerCase()))
        throw new Error("Invalid leave type");
      if (!leaveData.startDate || !leaveData.endDate)
        throw new Error("Start and end dates are required");


      const leaveDoc = {
        companyId: new ObjectId(companyId),
        employeeId: new ObjectId(leaveData.employeeId),
        leaveType: leaveData.leaveType.toLowerCase(),
        startDate: new Date(leaveData.startDate),
        endDate: new Date(leaveData.endDate),
        leaveChoice: leaveData.leaveChoice || 'Full Day',
        noOfDays: leaveData.noOfDays || 1,
        reason: leaveData.reason || '',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };


      const createdLeave = await adminService.addLeave(leaveDoc);
      socket.emit("admin/leaves/add-response", { done: true, data: createdLeave });


      io.to(`admin_room_${companyId}`).emit("admin/leaves/updated", { leave: createdLeave });
    } catch (error) {
      console.error("admin/leaves/add error:", error);
      socket.emit("admin/leaves/add-response", { done: false, error: error.message });
    }
  });


  socket.on("admin/leaves/edit", async (leaveData) => {
    try {
      const companyId = validateAccess();
      if (!leaveData.id) throw new Error("Leave ID is required");
      if (!leaveData.leaveType || !allowedLeaveTypes.includes(leaveData.leaveType.toLowerCase()))
        throw new Error("Invalid leave type");
      if (!leaveData.startDate || !leaveData.endDate)
        throw new Error("Start and end dates are required");


      const leaveId = leaveData.id;
      const updateDoc = {
        employeeId: new ObjectId(leaveData.employeeId),
        leaveType: leaveData.leaveType.toLowerCase(),
        startDate: new Date(leaveData.startDate),
        endDate: new Date(leaveData.endDate),
        leaveChoice: leaveData.leaveChoice || 'Full Day',
        noOfDays: leaveData.noOfDays || 1,
        reason: leaveData.reason || '',
        updatedAt: new Date()
      };


      const updatedLeave = await adminService.updateLeave(companyId, leaveId, updateDoc);
      socket.emit("admin/leaves/edit-response", { done: true, data: updatedLeave });


      io.to(`admin_room_${companyId}`).emit("admin/leaves/updated", { leave: updatedLeave });
    } catch (error) {
      console.error("admin/leaves/edit error:", error);
      socket.emit("admin/leaves/edit-response", { done: false, error: error.message });
    }
  });


  socket.on("admin/leaves/delete", async ({ id }) => {
    try {
      const companyId = validateAccess();
      if (!id) throw new Error("Leave ID is required");


      await adminService.deleteLeave(companyId, id);
      socket.emit("admin/leaves/delete-response", { done: true });


      io.to(`admin_room_${companyId}`).emit("admin/leaves/deleted", { leaveId: id });
    } catch (error) {
      console.error("admin/leaves/delete error:", error);
      socket.emit("admin/leaves/delete-response", { done: false, error: error.message });
    }
  });


  socket.on("admin/leaves/get-employees", async () => {
    try {
      const companyId = validateAccess();
      const employees = await adminService.getEmployees(companyId);
      socket.emit("admin/leaves/get-employees-response", { done: true, data: employees });
    } catch (error) {
      socket.emit("admin/leaves/get-employees-response", { done: false, error: error.message });
    }
  });


  socket.on("admin/leaves/get-leave-types", async () => {
    try {
      const companyId = validateAccess();
      const leaveTypes = await adminService.getLeaveTypes(companyId);
      socket.emit("admin/leaves/get-leave-types-response", { done: true, data: leaveTypes });
    } catch (error) {
      socket.emit("admin/leaves/get-leave-types-response", { done: false, error: error.message });
    }
  });
};




export default adminLeavesController;

