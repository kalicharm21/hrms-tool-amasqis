import * as terminationService from "../../services/hr/termination.services.js";

const toErr = (e) => ({ done: false, message: e?.message || String(e) });

const terminationController = (socket, io) => {
  const Broadcast = async () => {
    const res = await terminationService.getTerminationStats();
    io.to("hr_room").emit("hr/termination/termination-details-response", res);
  };

  const companyId = socket.companyId;

  // READ
  socket.on("hr/termination/termination-details", async () => {
    try {
      const res = await terminationService.getTerminationStats(companyId);
      socket.emit("hr/termination/termination-details-response", res);
    } catch (error) {
      socket.emit("hr/termination/termination-details-response", toErr(error));
    }
  });

  socket.on("hr/termination/terminationlist", async (args) => {
    try {
      const res = await terminationService.getTerminations(
        companyId,
        args || {}
      );
      socket.emit("hr/termination/terminationlist-response", res);
    } catch (error) {
      socket.emit("hr/termination/terminationlist-response", toErr(error));
    }
  });

  socket.on("hr/termination/get-termination", async (terminationId) => {
    try {
      const res = await terminationService.getSpecificTermination(
        companyId,
        terminationId
      );
      socket.emit("hr/termination/terminationlist-response", res);
    } catch (error) {
      socket.emit("hr/termination/terminationlist-response", toErr(error));
    }
  });

  // WRITE
  socket.on("hr/termination/add-termination", async (termination) => {
    try {
      // termination should contain created_by if needed
      const res = await terminationService.addTermination(
        companyId,
        termination,
        socket.user?.sub
      );

      if (res.done) {
        const updatedList = await terminationService.getTerminations(
          companyId,
          {}
        );
        socket.emit("hr/termination/termination-details-response", res);
        io.to("hr_room").emit(
          "hr/termination/terminationlist-response",
          updatedList
        );
        await Broadcast();
      }
    } catch (error) {
      socket.emit("hr/termination/add-termination-response", toErr(error));
    }
  });

  socket.on("hr/termination/update-termination", async (termination) => {
    try {
      const res = await terminationService.updateTermination(
        companyId,
        termination
      );

      if (res.done) {
        const updatedList = await terminationService.getTerminations(
          companyId,
          {}
        );
        console.log("updatessssss", updatedList);
        socket.emit("hr/termination/terminationlist-response", updatedList);
        io.to("hr_room").emit(
          "hr/termination/terminationlist-response",
          updatedList
        );
        await Broadcast();
      }
    } catch (error) {
      socket.emit("hr/termination/update-termination-response", toErr(error));
    }
  });

  socket.on("hr/termination/delete-termination", async (terminationIds) => {
    try {
      const res = await terminationService.deleteTermination(
        companyId,
        terminationIds
      );
      if (res.done) {
        const updatedList = await terminationService.getTerminations(
          companyId,
          {}
        );
        socket.emit("hr/termination/terminationlist-response", updatedList);
        io.to("hr_room").emit(
          "hr/termination/terminationlist-response",
          updatedList
        );
        await Broadcast();
      }
    } catch (error) {
      socket.emit("hr/termination/delete-termination-response", toErr(error));
    }
  });
};

export default terminationController;
