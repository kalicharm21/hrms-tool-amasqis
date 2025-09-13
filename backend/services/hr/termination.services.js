import { getTenantCollections } from "../../config/db.js";
import { startOfToday, subDays, startOfMonth, subMonths } from "date-fns";
import { ObjectId } from "mongodb";

const toYMDStr = (input) => {
  const d = new Date(input);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const addDaysStr = (ymdStr, days) => {
  const [y, m, d] = ymdStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return toYMDStr(dt);
};

// 1. Stats - total, recent
const getTerminationStats = async (companyId) => {
  try {
    const collection = getTenantCollections(companyId);

    const today = toYMDStr(new Date());
    const last30 = addDaysStr(today, -30);
    const tomorrow = addDaysStr(today, 1);

    const pipeline = [
      {
        $facet: {
          totalTerminations: [{ $count: "count" }],
          last30days: [
            { $match: { noticeDate: { $gte: last30, $lt: tomorrow } } },
            { $count: "count" },
          ],
        },
      },
      {
        $project: {
          totalTerminations: {
            $ifNull: [{ $arrayElemAt: ["$totalTerminations.count", 0] }, 0],
          },
          last30days: {
            $ifNull: [{ $arrayElemAt: ["$last30days.count", 0] }, 0],
          },
        },
      },
    ];

    const [result = { totalTerminations: 0, last30days: 0 }] =
      await collection.termination.aggregate(pipeline).toArray();
    console.log(result);

    return {
      done: true,
      message: "success",
      data: {
        totalTerminations: String(result.totalTerminations || 0),
        recentTerminations: String(result.last30days || 0),
      },
    };
  } catch (error) {
    console.error("Error fetching termination stats:", error);
    return { done: false, message: "Error fetching termination stats" };
  }
};

// 2. Get terminations by date filter
const getTerminations = async (
  companyId,
  { type, startDate, endDate } = {}
) => {
  try {
    const collection = getTenantCollections(companyId);
    const dateFilter = {};
    const today = toYMDStr(new Date());

    switch (type) {
      case "today": {
        const start = today;
        const end = addDaysStr(today, 1);
        dateFilter.noticeDate = { $gte: start, $lt: end };
        break;
      }
      case "yesterday": {
        const end = today;
        const start = addDaysStr(today, -1);
        dateFilter.noticeDate = { $gte: start, $lt: end };
        break;
      }
      case "last7days": {
        const end = today;
        const start = addDaysStr(end, -7);
        dateFilter.noticeDate = { $gte: start, $lt: end };
        break;
      }
      case "last30days": {
        const end = today;
        const start = addDaysStr(end, -30);
        dateFilter.noticeDate = { $gte: start, $lt: end };
        break;
      }
      case "thismonth": {
        const now = new Date();
        const start = toYMDStr(
          new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
        );
        const end = toYMDStr(
          new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
        );
        dateFilter.noticeDate = { $gte: start, $lt: end };
        break;
      }
      case "lastmonth": {
        const now = new Date();
        const start = toYMDStr(
          new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
        );
        const end = toYMDStr(
          new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
        );
        dateFilter.noticeDate = { $gte: start, $lt: end };
        break;
      }
      default:
        // no date filter
        break;
    }
    const pipeline = [
      { $match: dateFilter },
      { $sort: { noticeDate: -1, _id: -1 } },
      {
        $project: {
          _id: 0,
          employeeName: 1,
          reason: 1,
          department: 1,
          terminationDate: 1, // yyyy-mm-dd string
          terminationType: 1,
          noticeDate: 1, // yyyy-mm-dd string
          terminationId: 1,
          created_at: 1,
        },
      },
    ];

    const results = await collection.termination.aggregate(pipeline).toArray();

    console.log("retreval Resule : ", results);

    return {
      done: true,
      message: "success",
      data: results,
      count: results.length,
    };
  } catch (error) {
    console.error("Error fetching terminations:", error);
    return { done: false, message: error.message, data: [] };
  }
};

// 3. Get a specific termination record
const getSpecificTermination = async (companyId, terminationId) => {
  try {
    const collection = getTenantCollections(companyId);
    const record = await collection.termination.findOne(
      { terminationId: terminationId },
      {
        projection: {
          _id: 0,
          employeeName: 1,
          reason: 1,
          department: 1,
          terminationDate: 1,
          terminationType: 1,
          noticeDate: 1,
          terminationId: 1,
        },
      }
    );
    if (!record) throw new Error("Termination record not found");
    return { done: true, message: "success", data: record };
  } catch (error) {
    console.error("Error fetching termination record:", error);
    return { done: false, message: error.message, data: [] };
  }
};

// 4. Add a termination (single-arg signature: form)
const addTermination = async (companyId, form, useriD) => {
  try {
    const collection = getTenantCollections(companyId);
    // basic validation
    const required = [
      "employeeName",
      "reason",
      "department",
      "terminationDate",
      "terminationType",
      "noticeDate",
    ];
    for (const k of required) {
      if (!form[k]) throw new Error(`Missing field: ${k}`);
    }

    const newTermination = {
      employeeName: form.employeeName,
      reason: form.reason,
      department: form.department,
      terminationDate: toYMDStr(form.terminationDate), // store as Date
      terminationType: form.terminationType,
      noticeDate: toYMDStr(form.noticeDate), // store as Date
      terminationId: new ObjectId().toHexString(),
      created_by: useriD,
      created_at: new Date(),
    };
    console.log(newTermination);

    await collection.termination.insertOne(newTermination);
    return { done: true, message: "Termination added successfully" };
  } catch (error) {
    console.error("Error adding termination:", error);
    return {
      done: false,
      message: error.message || "Error adding termination",
    };
  }
};

// 5. Update a termination
const updateTermination = async (companyId, form) => {
  try {
    const collection = getTenantCollections(companyId);
    if (!form.terminationId) throw new Error("Missing terminationId");

    const existing = await collection.termination.findOne({
      terminationId: form.terminationId,
    });
    if (!existing) throw new Error("Termination not found");

    const updateData = {
      employeeName: form.employeeName ?? existing.employeeName,
      reason: form.reason ?? existing.reason,
      department: form.department ?? existing.department,
      terminationDate: form.terminationDate
        ? toYMDStr(form.terminationDate)
        : existing.terminationDate,
      terminationType: form.terminationType ?? existing.terminationType,
      noticeDate: form.noticeDate
        ? toYMDStr(form.noticeDate)
        : existing.noticeDate,
      // keep identifiers and created metadata
      terminationId: existing.terminationId,
      created_by: existing.created_by,
      created_at: existing.created_at,
    };

    const result = await collection.termination.updateOne(
      { terminationId: form.terminationId },
      { $set: updateData }
    );
    if (result.matchedCount === 0) throw new Error("Termination not found");
    if (result.modifiedCount === 0) {
      return {
        done: true,
        message: "No changes made",
        data: { ...updateData },
      };
    }
    return {
      done: true,
      message: "Termination updated successfully",
      data: { ...updateData },
    };
  } catch (error) {
    console.error("Error updating termination:", error);
    return { done: false, message: error.message, data: null };
  }
};

// 6. Delete multiple terminations
const deleteTermination = async (companyId, terminationIds) => {
  try {
    const collection = getTenantCollections(companyId);
    const result = await collection.termination.deleteMany({
      terminationId: { $in: terminationIds },
    });
    return {
      done: true,
      message: `${result.deletedCount} termination(s) deleted successfully`,
      data: null,
    };
  } catch (error) {
    console.error("Error deleting terminations:", error);
    return { done: false, message: error.message, data: null };
  }
};

export {
  getTerminationStats,
  getTerminations,
  getSpecificTermination,
  addTermination,
  updateTermination,
  deleteTermination,
};
