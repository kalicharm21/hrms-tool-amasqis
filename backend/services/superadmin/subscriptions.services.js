import { getsuperadminCollections } from "../../config/db.js";
import { ObjectId } from "mongodb";

// Fetch dashboard stats for subscriptions
export const fetchSubscriptionStats = async () => {
  try {
    const { subscriptionsCollection } = getsuperadminCollections();
  
    // Total transaction amount
    const totalTransaction = await subscriptionsCollection.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]).toArray();

    // Count total, active, and expired subscribers
    const totalSubscribers = await subscriptionsCollection.countDocuments({});
    const activeSubscribers = await subscriptionsCollection.countDocuments({ status: { $in: ["Paid", "Active"] } });
    const expiredSubscribers = await subscriptionsCollection.countDocuments({ status: "Expired" });

    return {
      done: true,
      data: {
        totalTransaction: totalTransaction[0]?.total || 0,
        totalSubscribers,
        activeSubscribers,
        expiredSubscribers
      }
    };
  } catch (error) {
    return { done: false, error: error.message };
  }
};

// Fetch subscription list with company and plan details
export const fetchSubscriptions = async () => {
  try {
    const { subscriptionsCollection } = getsuperadminCollections();

    // Join with companies and plans collections
    const subscriptions = await subscriptionsCollection.aggregate([
      {
        $lookup: {
          from: "companies",
          localField: "companyId",
          foreignField: "_id",
          as: "company"
        }
      },
      { $unwind: "$company" },
      {
        $lookup: {
          from: "plans",
          localField: "planId",
          foreignField: "_id",
          as: "plan"
        }
      },
      { $unwind: "$plan" }
    ]).toArray();

    // Format subscription data for frontend
    const data = subscriptions.map((sub) => {
      // Plan name with type
      const planType = sub.plan.billingCycle === 12 ? "Yearly" : "Monthly";
      const planName = `${sub.plan.name} (${planType})`;

      // Created date
      const createdDate = sub.createdAt ? new Date(sub.createdAt) : new Date();
      // Expiry date calculation
      let expDate = new Date(createdDate);
      if (planType === "Yearly") {
        expDate.setFullYear(expDate.getFullYear() + 1);
      } else {
        expDate.setMonth(expDate.getMonth() + 1);
      }
      // Stayus logic
      const now = new Date();
      let status = sub.status;
      if (now > expDate) status = "Expired";
      else if (sub.status === "Paid" || sub.status === "Active") status = "Paid";

      return {
        id: sub._id?.toString(),
        CompanyName: sub.company.name,
        Image: sub.company.image || "company-default.svg",
        Plan: planName,
        BillCycle: sub.plan.billingCycle,
        Amount: sub.amount,
        CreatedDate: createdDate.toISOString(), // send as ISO, format on frontend
        ExpiringDate: expDate.toISOString(),
        Status: status,
      };
    });

    return { done: true, data };
  } catch (error) {
    return { done: false, error: error.message };
  }
};
    

    