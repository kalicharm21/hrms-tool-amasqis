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

export const fetchSubscriptions = async () => {
  try {
    const { subscriptionsCollection } = getsuperadminCollections();

    // Fetch all subscriptions directly
    const subscriptions = await subscriptionsCollection.find({}).toArray();

    // Format subscription data for frontend
    const data = subscriptions.map((sub) => {
      const planType = sub.billingCycle === 12 ? "Yearly" : "Monthly";
      const planName = `${sub.planName} (${planType})`;

      // Created date
      const createdDate = sub.createdAt ? new Date(sub.createdAt) : new Date();
      // Expiry date calculation
      let expDate = new Date(createdDate);
      if (planType === "Yearly") {
        expDate.setFullYear(expDate.getFullYear() + 1);
      } else {
        expDate.setMonth(expDate.getMonth() + 1);
      }
      // Status logic
      const now = new Date();
      let status = sub.status;
      if (now > expDate) status = "Expired";
      else if (sub.status === "Paid" || sub.status === "Active") status = "Paid";

      return {
        id: sub._id?.toString(),
        companyId: sub.companyId?.toString(),
        CompanyName: sub.companyName,
        Image: sub.companyLogo || "company-default.svg",
        Plan: planName,
        BillCycle: sub.billingCycle,
        Amount: sub.amount,
        CreatedDate: createdDate.toISOString(),
        ExpiringDate: expDate.toISOString(),
        Status: status,
        CompanyEmail: sub.companyEmail,
        CompanyAddress: sub.companyAddress,
      };
    });

    return { done: true, data };
  } catch (error) {
    return { done: false, error: error.message };
  }
};
    

    