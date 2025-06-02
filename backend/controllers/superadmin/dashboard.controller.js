const dashboardController = (socket, io) => {
  // Socket.on logics here

  socket.on("superadmin/dashboard/get-company");
};

export default dashboardController;
