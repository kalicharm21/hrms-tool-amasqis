import * as dashboardService from "../../services/superadmin/dashboard.services.js";

const dashboardController = (socket, io) => {
  // Get dashboard statistics (total companies, active companies, subscribers, earnings)
  socket.on("superadmin/dashboard/get-stats", async () => {
    try {
      const result = await dashboardService.getDashboardStats();
      socket.emit("superadmin/dashboard/get-stats-response", result);
    } catch (error) {
      socket.emit("superadmin/dashboard/get-stats-response", {
        done: false,
        error: error.message
      });
    }
  });

  // Get weekly company registration data for the companies chart
  socket.on("superadmin/dashboard/get-weekly-companies", async () => {
    try {
      const result = await dashboardService.getWeeklyCompanyData();
      socket.emit("superadmin/dashboard/get-weekly-companies-response", result);
    } catch (error) {
      socket.emit("superadmin/dashboard/get-weekly-companies-response", {
        done: false,
        error: error.message
      });
    }
  });

  // Get monthly revenue data for the revenue chart
  socket.on("superadmin/dashboard/get-monthly-revenue", async () => {
    try {
      const result = await dashboardService.getMonthlyRevenueData();
      socket.emit("superadmin/dashboard/get-monthly-revenue-response", result);
    } catch (error) {
      socket.emit("superadmin/dashboard/get-monthly-revenue-response", {
        done: false,
        error: error.message
      });
    }
  });

  // Get plan distribution for the donut chart
  socket.on("superadmin/dashboard/get-plan-distribution", async () => {
    try {
      const result = await dashboardService.getPlanDistribution();
      socket.emit("superadmin/dashboard/get-plan-distribution-response", result);
    } catch (error) {
      socket.emit("superadmin/dashboard/get-plan-distribution-response", {
        done: false,
        error: error.message
      });
    }
  });

  // Get recent transactions
  socket.on("superadmin/dashboard/get-recent-transactions", async () => {
    try {
      const result = await dashboardService.getRecentTransactions();
      socket.emit("superadmin/dashboard/get-recent-transactions-response", result);
    } catch (error) {
      socket.emit("superadmin/dashboard/get-recent-transactions-response", {
        done: false,
        error: error.message
      });
    }
  });

  // Get recently registered companies
  socket.on("superadmin/dashboard/get-recently-registered", async () => {
    try {
      const result = await dashboardService.getRecentlyRegistered();
      socket.emit("superadmin/dashboard/get-recently-registered-response", result);
    } catch (error) {
      socket.emit("superadmin/dashboard/get-recently-registered-response", {
        done: false,
        error: error.message
      });
    }
  });

  // Get expired plans
  socket.on("superadmin/dashboard/get-expired-plans", async () => {
    try {
      const result = await dashboardService.getExpiredPlans();
      socket.emit("superadmin/dashboard/get-expired-plans-response", result);
    } catch (error) {
      socket.emit("superadmin/dashboard/get-expired-plans-response", {
        done: false,
        error: error.message
      });
    }
  });

  // Get all dashboard data at once
  socket.on("superadmin/dashboard/get-all-data", async () => {
    try {
      const [
        stats,
        weeklyCompanies,
        monthlyRevenue,
        planDistribution,
        recentTransactions,
        recentlyRegistered,
        expiredPlans
      ] = await Promise.all([
        dashboardService.getDashboardStats(),
        dashboardService.getWeeklyCompanyData(),
        dashboardService.getMonthlyRevenueData(),
        dashboardService.getPlanDistribution(),
        dashboardService.getRecentTransactions(),
        dashboardService.getRecentlyRegistered(),
        dashboardService.getExpiredPlans()
      ]);

      socket.emit("superadmin/dashboard/get-all-data-response", {
        done: true,
        data: {
          stats: stats.data,
          weeklyCompanies: weeklyCompanies.data,
          monthlyRevenue: monthlyRevenue.data,
          planDistribution: planDistribution.data,
          recentTransactions: recentTransactions.data,
          recentlyRegistered: recentlyRegistered.data,
          expiredPlans: expiredPlans.data
        }
      });
    } catch (error) {
      socket.emit("superadmin/dashboard/get-all-data-response", {
        done: false,
        error: error.message
      });
    }
  });
};

export default dashboardController;
