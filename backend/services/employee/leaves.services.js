import { getTenantCollections } from "../../config/db.js";
import { ObjectId } from "mongodb";

export const getEmployeeLeaves = async (companyId, employeeId, year) => {
  try {
    const collections = getTenantCollections(companyId);
    const query = {
      companyId: new ObjectId(companyId),
      employeeId: new ObjectId(employeeId),
    };
    if (year) {
      query.startDate = {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1),
      };
    }
    const leaves = await collections.leaves.find(query).sort({ startDate: -1 }).toArray();
    return { done: true, data: leaves };
  } catch (error) {
    console.error("Error fetching employee leaves:", error);
    return { done: false, error: error.message };
  }
};

export const addLeave = async (companyId, leaveData) => {
  try {
    const collections = getTenantCollections(companyId);
    const startDate = new Date(leaveData.startDate);
    const endDate = new Date(leaveData.endDate);

    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays <= 0) {
      throw new Error("Invalid date range");
    }

    const doc = {
      ...leaveData,
      companyId: new ObjectId(companyId),
      employeeId: new ObjectId(leaveData.employeeId),
      startDate,
      endDate,
      noOfDays: diffDays,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collections.leaves.insertOne(doc);
    return { done: true, data: { id: result.insertedId, ...doc } };
  } catch (error) {
    console.error("Error adding leave:", error);
    return { done: false, error: error.message };
  }
};

export const updateLeave = async (companyId, leaveId, updateData, employeeId) => {
  try {
    const collections = getTenantCollections(companyId);

    if (updateData.startDate && updateData.endDate) {
      const startDate = new Date(updateData.startDate);
      const endDate = new Date(updateData.endDate);
      const diffTime = endDate.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

      if (diffDays <= 0) {
        throw new Error("Invalid date range");
      }

      updateData.noOfDays = diffDays;
      updateData.startDate = startDate;
      updateData.endDate = endDate;
    }

    updateData.updatedAt = new Date();

    const filter = {
      _id: new ObjectId(leaveId),
      employeeId: new ObjectId(employeeId),
      companyId: new ObjectId(companyId),
    };

    const res = await collections.leaves.findOneAndUpdate(
      filter,
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!res.value) throw new Error("Leave not found or unauthorized");

    return { done: true, data: res.value };
  } catch (error) {
    console.error("Error updating leave:", error);
    return { done: false, error: error.message };
  }
};

export const deleteLeave = async (companyId, leaveId, employeeId) => {
  try {
    const collections = getTenantCollections(companyId);

    const result = await collections.leaves.deleteOne({
      _id: new ObjectId(leaveId),
      employeeId: new ObjectId(employeeId),
      companyId: new ObjectId(companyId),
    });

    if (result.deletedCount !== 1) throw new Error("Leave not found or unauthorized");

    return { done: true };
  } catch (error) {
    console.error("Error deleting leave:", error);
    return { done: false, error: error.message };
  }
};
