import * as employeeLeavesService from "../../services/employee/leaves.services.js";
import { ObjectId } from "mongodb";

const allowedLeaveTypes = ['medical leave', 'casual leave', 'annual leave', 'loss of pay'];

const employeeLeavesController = (socket, io) => {
  console.log("Setting up employee leaves controller...");
  const validateAccess = () => {
    if (!socket.companyId) throw new Error("Company ID missing");
    if (socket.userMetadata?.role !== "employee") throw new Error("Unauthorized");
    return socket.companyId;
  };

  socket.on("employee/dashboard/get-leave-list", async ({ year } = {}) => {
    try {
      const companyId = validateAccess();
      const employeeObjectId = new ObjectId(socket.userMetadata?.employeeObjectId || socket.sub);
      console.log(`[GetLeaveList] companyId: ${companyId}, employeeObjectId: ${employeeObjectId}, year: ${year}`);

      // Pass the ObjectId string to service
      const leavesResp = await employeeLeavesService.getEmployeeLeaves(companyId, employeeObjectId.toHexString(), year);

      console.log(`[GetLeaveList] result count: ${leavesResp.data?.length || 0}`);

      socket.emit("employee/dashboard/get-leave-list-response", leavesResp);
    } catch (error) {
      console.error("[GetLeaveList] error:", error);
      socket.emit("employee/dashboard/get-leave-list-response", { done: false, error: error.message });
    }
  });

  // Similar changes in add, edit, delete events: ensure employeeId is set to ObjectId string
  socket.on("employee/dashboard/add-leave", async (leaveData) => {
    try {
      const companyId = validateAccess();
      leaveData.employeeId = new ObjectId(socket.userMetadata?.employeeObjectId || socket.sub).toHexString();

      if (!leaveData.leaveType || !allowedLeaveTypes.includes(leaveData.leaveType.toLowerCase())) {
        throw new Error("Invalid leave type");
      }

      const newLeave = await employeeLeavesService.addLeave(companyId, leaveData);

      socket.emit("employee/dashboard/add-leave-response", { done: true, data: newLeave });
      io.to(`employee_room_${leaveData.employeeId}`).emit("employee/leaves/updated", { leave: newLeave });
    } catch (error) {
      socket.emit("employee/dashboard/add-leave-response", { done: false, error: error.message });
    }
  });

  socket.on("employee/dashboard/edit-leave", async (leaveData) => {
    try {
      const companyId = validateAccess();
      const employeeId = new ObjectId(socket.userMetadata?.employeeObjectId || socket.sub).toHexString();

      if (!leaveData.leaveId) throw new Error("Leave ID is required");
      if (!leaveData.leaveType || !allowedLeaveTypes.includes(leaveData.leaveType.toLowerCase())) {
        throw new Error("Invalid leave type");
      }

      const updateData = {
        leaveType: leaveData.leaveType.toLowerCase(),
        startDate: leaveData.startDate,
        endDate: leaveData.endDate,
        reason: leaveData.reason,
      };

      const updatedLeave = await employeeLeavesService.updateLeave(companyId, leaveData.leaveId, updateData, employeeId);

      socket.emit("employee/dashboard/edit-leave-response", { done: true, data: updatedLeave });
      io.to(`employee_room_${employeeId}`).emit("employee/leaves/updated", { leave: updatedLeave });
    } catch (error) {
      socket.emit("employee/dashboard/edit-leave-response", { done: false, error: error.message });
    }
  });

  socket.on("employee/dashboard/delete-leave", async ({ leaveId }) => {
    try {
      const companyId = validateAccess();
      const employeeId = new ObjectId(socket.userMetadata?.employeeObjectId || socket.sub).toHexString();

      if (!leaveId) throw new Error("Leave ID is required");

      await employeeLeavesService.deleteLeave(companyId, leaveId, employeeId);

      socket.emit("employee/dashboard/delete-leave-response", { done: true });
      io.to(`employee_room_${employeeId}`).emit("employee/leaves/deleted", { leaveId });
    } catch (error) {
      socket.emit("employee/dashboard/delete-leave-response", { done: false, error: error.message });
    }
  });
};

export default employeeLeavesController;
