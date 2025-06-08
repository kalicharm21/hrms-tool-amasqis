import * as subscriptionsService from "../../services/superadmin/subscriptions.services.js";

const subscriptionsController = (socket, io) => {
  // request to fetch subscription list
  socket.on("superadmin/subscriptions/fetch-list", async () => {
    const res = await subscriptionsService.fetchSubscriptions();
    socket.emit("superadmin/subscriptions/fetch-list-response", res);
  });
  // request to fetch dashboard stats
  socket.on("superadmin/subscriptions/fetch-stats", async () => {
  const res = await subscriptionsService.fetchSubscriptionStats();
  socket.emit("superadmin/subscriptions/fetch-stats-response", res);
  });
};

export default subscriptionsController;