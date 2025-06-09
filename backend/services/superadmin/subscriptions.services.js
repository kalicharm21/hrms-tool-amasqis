import { getsuperadminCollections, connectDB } from "../../config/db.js";

class SubscriptionService {
  constructor() {
    // Connect to MongoDB when the service is instantiated
    connectDB().catch((error) => {
      console.error("Failed to initialize SubscriptionService:", error.message);
    });
  }

  async getTotalTransactions() {
    try {
      const { stats } = getsuperadminCollections();
      const transactions = await stats
        .aggregate([
          {
            $group: {
              _id: { $month: "$createdAt" },
              total: { $sum: "$amount" },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray();

      const series = transactions.map((t) => t.total);
      const categories = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ].slice(0, transactions.length);

      return { series, categories, total: series.reduce((sum, val) => sum + val, 0) || 0 };
    } catch (error) {
      throw new Error(`Failed to fetch total transactions: ${error.message}`);
    }
  }

  async getTotalSubscriptions() {
    try {
      const { companies } = getsuperadminCollections();
      const subscriptions = await companies
        .aggregate([
          {
            $group: {
              _id: { $month: "$createdAt" },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray();

      const series = subscriptions.map((s) => s.count);
      const categories = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ].slice(0, subscriptions.length);

      return { series, categories, total: series.reduce((sum, val) => sum + val, 0) || 0 };
    } catch (error) {
      throw new Error(`Failed to fetch total subscriptions: ${error.message}`);
    }
  }

  async getActiveSubscriptions() {
    try {
      const { companies } = getsuperadminCollections();
      const activeSubscriptions = await companies
        .aggregate([
          {
            $match: { status: "Paid", expiringDate: { $gte: new Date() } },
          },
          {
            $group: {
              _id: { $month: "$createdAt" },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray();

      const series = activeSubscriptions.map((s) => s.count);
      const categories = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ].slice(0, activeSubscriptions.length);

      return { series, categories, total: series.reduce((sum, val) => sum + val, 0) || 0 };
    } catch (error) {
      throw new Error(`Failed to fetch active subscriptions: ${error.message}`);
    }
  }

  async getExpiredSubscriptions() {
    try {
      const { companies } = getsuperadminCollections();
      const expiredSubscriptions = await companies
        .aggregate([
          {
            $match: { expiringDate: { $lt: new Date() } },
          },
          {
            $group: {
              _id: { $month: "$createdAt" },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray();

      const series = expiredSubscriptions.map((s) => s.count);
      const categories = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ].slice(0, expiredSubscriptions.length);

      return { series, categories, total: series.reduce((sum, val) => sum + val, 0) || 0 };
    } catch (error) {
      throw new Error(`Failed to fetch expired subscriptions: ${error.message}`);
    }
  }

  async getSubscriptionList() {
    try {
      const { companies } = getsuperadminCollections();
      const subscriptions = await companies.find({}).toArray();
      return subscriptions.map((sub) => ({
        CompanyName: sub.companyName,
        Image: sub.image,
        Plan: sub.plan,
        BillCycle: sub.billCycle,
        PaymentMethod: sub.paymentMethod,
        Amount: sub.amount,
        CreatedDate: sub.createdAt.toISOString().split("T")[0],
        ExpiringDate: sub.expiringDate.toISOString().split("T")[0],
        Status: sub.status,
      }));
    } catch (error) {
      throw new Error(`Failed to fetch subscription list: ${error.message}`);
    }
  }
}

export default SubscriptionService;