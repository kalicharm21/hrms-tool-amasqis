import { getsuperadminCollections } from "../../config/db.js";
import {
  startOfToday,
  subDays,
  startOfMonth,
  subMonths,
  endOfYesterday,
  format,
  parseISO,
} from "date-fns";

import { MongoClient, ObjectId } from "mongodb";

const getplanStats = async (socket) => {
  try {
    const { packagesCollection } = getsuperadminCollections();
    console.log("In db");

    const aggregationPipeline = [
      {
        $facet: {
          // Total plans count
          totalPlans: [{ $count: "count" }],

          // Active plans count
          activePlans: [{ $match: { status: "Active" } }, { $count: "count" }],

          // Inactive plans count
          inactivePlans: [
            { $match: { status: "Inactive" } },
            { $count: "count" },
          ],
        },
      },
      {
        $project: {
          totalPlans: { $arrayElemAt: ["$totalPlans.count", 0] },
          activePlans: { $arrayElemAt: ["$activePlans.count", 0] },
          inactivePlans: { $arrayElemAt: ["$inactivePlans.count", 0] },
        },
      },
    ];

    const [result] = await packagesCollection
      .aggregate(aggregationPipeline)
      .toArray();

    return {
      done: true,
      message: "success",
      data: {
        totalPlans: "" + (result.totalPlans || 0),
        activePlans: "" + (result.activePlans || 0),
        inactivePlans: "" + (result.inactivePlans || 0),
        planTypes: "" + 2,
      },
    };
  } catch (error) {
    console.error("Error fetching plan details:", error);
    return { done: false, message: "Error fetching plan details" };
  }
};

const getplan = async ({ type, startDate, endDate }) => {
  try {
    const { packagesCollection } = getsuperadminCollections();

    let dateFilter = {};
    const now = new Date();

    const convertDateString = (dateStr) => {
      return dateStr ? new Date(dateStr) : null;
    };

    switch (type) {
      case "today":
        dateFilter.created_at = {
          $gte: startOfToday().toISOString(),
        };
        break;
      case "yesterday":
        dateFilter.created_at = {
          $gte: subDays(startOfToday(), 1).toISOString(),
          $lt: startOfToday().toISOString(),
        };
        break;
      case "last7days":
        dateFilter.created_at = {
          $gte: subDays(now, 7).toISOString(),
        };
        break;
      case "last30days":
        dateFilter.created_at = {
          $gte: subDays(now, 30).toISOString(),
        };
        break;
      case "thismonth":
        dateFilter.created_at = {
          $gte: startOfMonth(now).toISOString(),
        };
        break;
      case "lastmonth":
        dateFilter.created_at = {
          $gte: startOfMonth(subMonths(now, 1)).toISOString(),
          $lt: startOfMonth(now).toISOString(),
        };
        break;
      case "custom":
        if (!startDate || !endDate)
          throw new Error("Missing custom date range");
        dateFilter.created_at = {
          $gte: new Date(startDate).toISOString(),
          $lte: new Date(endDate).toISOString(),
        };
        break;
      default:
        break;
    }

    // 2. Aggregation pipeline
    const pipeline = [
      { $match: dateFilter },
      { $sort: { created_at: -1 } },
      {
        $project: {
          Plan_Name: "$planName",
          Plan_Type: "$planType",
          Total_Subscribers: "$subscribers",
          Price: "$price",
          Status: "$status",
          planid: "$plan_id",
          _id: 0,
          created_at: 1,
        },
      },
    ];

    const plans = await packagesCollection.aggregate(pipeline).toArray();

    const formattedPlans = plans.map((plan) => {
      const date = new Date(plan.created_at);
      return {
        ...plan,
        Created_Date: format(date, "d MMM yyyy"),
      };
    });

    console.log(formattedPlans);

    return {
      done: true,
      message: "success",
      data: formattedPlans,
      count: formattedPlans.length,
    };
  } catch (error) {
    console.error("Error fetching plans:", error);
    return {
      success: false,
      message: error.message,
      data: [],
    };
  }
};

const getSpecificPlan = async (planid) => {
  try {
    const { packagesCollection } = getsuperadminCollections();

    const plan = await packagesCollection.findOne({
      plan_id: planid,
    });
    delete plan.created_at;
    delete plan.created_by;
    delete plan.subscribers;
    delete plan._id;
    return {
      done: true,
      message: "success",
      data: plan,
    };
  } catch (error) {
    console.error("Error fetching plans:", error);
    return {
      done: false,
      message: error.message,
      data: [],
    };
  }
};

const addPlan = async (userId, plan) => {
  try {
    const { packagesCollection } = getsuperadminCollections();
    // Generate a unique MongoDB ObjectId and use it as plan_id
    const newPlan = {
      ...plan,
      subscribers: 0,
      plan_id: new ObjectId().toHexString(), // Convert ObjectId to string
      created_by: userId, // Add the user ID who created the plan
      created_at: new Date().toISOString(), // Add UTC timestamp
    };

    const result = await packagesCollection.insertOne(newPlan);
    console.log("Plan added successfully with ID:", newPlan.plan_id);
    return {
      done: true,
      message: "Plan added successfully",
    };
  } catch (error) {
    console.error("Error adding plan:", error);
    return { done: false, message: "Error adding plan" };
  }
};

const updatePlan = async (form) => {
  try {
    const { packagesCollection } = getsuperadminCollections();
    console.log("Plan id is ", form.plan_id);
    // 1. First find the existing document
    const existingPlan = await packagesCollection.findOne({
      plan_id: form.plan_id,
    });

    if (!existingPlan) {
      throw new Error("Plan not found");
    }

    // 2. Prepare the update data - merge new form with preserved fields
    const updateData = {
      ...form,
      created_by: existingPlan.created_by,
      created_at: existingPlan.created_at,
      subscribers: existingPlan.subscribers,
      // Make sure to convert planModules array to the format your schema expects
      planModules: Array.isArray(form.planModules) ? form.planModules : [],
    };

    // 3. Perform the update
    const result = await packagesCollection.updateOne(
      { plan_id: form.plan_id },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      throw new Error("No changes made or plan not found");
    }

    return {
      done: true,
      message: "Plan updated successfully",
      data: { ...updateData, _id: form._id },
    };
  } catch (error) {
    console.error("Error updating plan:", error);
    return {
      done: false,
      message: error.message,
      data: null,
    };
  }
};

const deletePlan = async (planids) => {
  try {
    const { packagesCollection } = getsuperadminCollections();

    // Deleting all records where plan_id is in the provided planids array
    const result = await packagesCollection.deleteMany({
      plan_id: { $in: planids },
    });

    return {
      done: true,
      message: `${result.deletedCount} plans deleted successfully.`,
      data: null,
    };
  } catch (error) {
    console.error("Error deleting plans:", error);
    return {
      done: false,
      message: error.message,
      data: null,
    };
  }
};
export {
  getplanStats,
  getplan,
  getSpecificPlan,
  addPlan,
  updatePlan,
  deletePlan,
};
