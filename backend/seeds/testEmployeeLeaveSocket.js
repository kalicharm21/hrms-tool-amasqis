import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: { token: "dNQB27kXRssxge9VAAAT" }, // Replace with a valid employee auth token
});

socket.on("connect", () => {
  console.log("Connected with socket id:", socket.id);

  // Fetch leave list for current year
  socket.emit("employee/dashboard/get-leave-list", { year: new Date().getFullYear() });

  socket.on("employee/dashboard/get-leave-list-response", (res) => {
    console.log("Leave list response:", res);

    if (res.done && res.data.length > 0) {
      const leave = res.data[0];
      // Edit first leave
      socket.emit("employee/dashboard/edit-leave", {
        leaveId: leave._id,
        leaveType: leave.leaveType,
        startDate: leave.startDate,
        endDate: leave.endDate,
        reason: leave.reason || "Updated reason",
        noOfDays: leave.noOfDays,
      });
    } else {
      // Add a leave if none exist
      const nowIso = new Date().toISOString();
      socket.emit("employee/dashboard/add-leave", {
        leaveType: "medical leave",
        startDate: nowIso,
        endDate: nowIso,
        reason: "Test leave add",
        noOfDays: 1,
      });
    }
  });

  socket.on("employee/dashboard/edit-leave-response", (res) => {
    console.log("Edit leave response:", res);

    // After edit, add a leave
    if (!res.done) {
      const nowIso = new Date().toISOString();
      socket.emit("employee/dashboard/add-leave", {
        leaveType: "medical leave",
        startDate: nowIso,
        endDate: nowIso,
        reason: "Test leave add",
        noOfDays: 1,
      });
    }
  });

  socket.on("employee/dashboard/add-leave-response", (res) => {
    console.log("Add leave response:", res);

    if (res.done) {
      // Delete the newly added leave
      socket.emit("employee/dashboard/delete-leave", { leaveId: res.data.id });
    } else {
      console.error("Add leave failed:", res.error);
      socket.disconnect();
    }
  });

  socket.on("employee/dashboard/delete-leave-response", (res) => {
    console.log("Delete leave response:", res);
    console.log("Test sequence complete");
    socket.disconnect();
  });
});

socket.on("connect_error", (err) => {
  console.error("Socket connection error:", err);
});
