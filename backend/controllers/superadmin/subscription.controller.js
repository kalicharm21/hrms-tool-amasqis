import SubscriptionService from "../../services/superadmin/subscriptions.services.js";

const subscriptionsController = (socket, io) => {
  const subscriptionService = new SubscriptionService();

  socket.on("superadmin/subscriptions/totalTransactions", async (data) => {
    try {
      const result = await subscriptionService.getTotalTransactions();
      socket.emit("superadmin/subscriptions/totalTransactionsResponse", result);
    } catch (error) {
      socket.emit("superadmin/subscriptions/totalTransactionsResponse", {
        error: error.message,
      });
    }
  });

  socket.on("superadmin/subscriptions/totalSubscriptions", async (data) => {
    try {
      const result = await subscriptionService.getTotalSubscriptions();
      socket.emit("superadmin/subscriptions/totalSubscriptionsResponse", result);
    } catch (error) {
      socket.emit("superadmin/subscriptions/totalSubscriptionsResponse", {
        error: error.message,
      });
    }
  });

  socket.on("superadmin/subscriptions/activeSubscriptions", async (data) => {
    try {
      const result = await subscriptionService.getActiveSubscriptions();
      socket.emit("superadmin/subscriptions/activeSubscriptionsResponse", result);
    } catch (error) {
      socket.emit("superadmin/subscriptions/activeSubscriptionsResponse", {
        error: error.message,
      });
    }
  });

  socket.on("superadmin/subscriptions/expiredSubscriptions", async (data) => {
    try {
      const result = await subscriptionService.getExpiredSubscriptions();
      socket.emit("superadmin/subscriptions/expiredSubscriptionsResponse", result);
    } catch (error) {
      socket.emit("superadmin/subscriptions/expiredSubscriptionsResponse", {
        error: error.message,
      });
    }
  });

  socket.on("superadmin/subscriptions/list", async (data) => {
    try {
      const result = await subscriptionService.getSubscriptionList();
      socket.emit("superadmin/subscriptions/listResponse", result);
    } catch (error) {
      socket.emit("superadmin/subscriptions/listResponse", {
        error: error.message,
      });
    }
  });
};

export default subscriptionsController;