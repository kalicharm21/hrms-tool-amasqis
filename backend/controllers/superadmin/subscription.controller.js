import * as subscriptionsService from "../../services/superadmin/subscriptions.services.js";

const Broadcast = async (io) => {
  const updatedSubscriptions = await subscriptionsService.fetchSubscriptions();
  io.to("superadmin_room").emit(
    "superadmin/subscriptions/fetch-list-response",
    updatedSubscriptions
  );
  const updatedStats = await subscriptionsService.fetchSubscriptionStats();
  io.to("superadmin_room").emit(
    "superadmin/subscriptions/fetch-stats-response",
    updatedStats
  );
};

const subscriptionsController = (socket, io) => {
  // Fetch subscription list
  socket.on("superadmin/subscriptions/fetch-list", async () => {
    try {
    const res = await subscriptionsService.fetchSubscriptions();
      console.log("Subscription list", res);
    socket.emit("superadmin/subscriptions/fetch-list-response", res);
    } catch (error) {
      socket.emit("superadmin/subscriptions/fetch-list-response", {
        done: false,
        error: error.message
      });
    }
  });

  // Fetch subscription stats
  socket.on("superadmin/subscriptions/fetch-stats", async () => {
    try {
  const res = await subscriptionsService.fetchSubscriptionStats();
      console.log("Subscription stats", res);
  socket.emit("superadmin/subscriptions/fetch-stats-response", res);
    } catch (error) {
      socket.emit("superadmin/subscriptions/fetch-stats-response", {
        done: false,
        error: error.message
      });
    }
  });

  // Handle invoice download
  socket.on("superadmin/subscriptions/download-invoice", async (data) => {
    console.log("Received download-invoice request with data:", data);
    
    try {
      console.log("Generating PDF...");
      const result = await subscriptionsService.generateInvoicePDF(data);
      console.log("PDF generation result:", result);
      
      if (result.done) {
        console.log("Sending PDF URL to client:", result.data.pdfUrl);
        socket.emit("superadmin/subscriptions/download-invoice-response", {
          done: true,
          data: {
            pdfUrl: result.data.pdfUrl
          }
        });
        
        // Schedule cleanup after 1 hour
        setTimeout(() => {
          console.log("Cleaning up PDF file:", result.data.pdfPath);
          subscriptionsService.cleanupInvoicePDFs();
        }, 60 * 60 * 1000);
      } else {
        console.error("PDF generation failed:", result.error);
        socket.emit("superadmin/subscriptions/download-invoice-response", {
          done: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error("Error in download-invoice handler:", error);
      socket.emit("superadmin/subscriptions/download-invoice-response", {
        done: false,
        error: error.message
      });
    }
  });
};

export default subscriptionsController;