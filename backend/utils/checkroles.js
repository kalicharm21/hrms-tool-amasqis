const checkroles = (socket, role, error_route) => {
  if (socket.role != role) {
    socket.emit(error_route, {
      done: false,
      message: "No Permission for this route",
    });
  } else {
    return true;
  }
};

module.exports = checkroles;
