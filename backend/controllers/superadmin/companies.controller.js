import { Company } from "../../models/superadmin/package.schema.js";
import * as companiesService from "../../services/superadmin/companies.services.js";

const Broadcast = async (io) => {
  const updatedCompany = await companiesService.fetchCompanylist({});
  io.to("superadmin_room").emit(
    "superadmin/companies/fetch-companylist-response",
    updatedCompany
  );
  const updatedstats = await companiesService.fetchCompanystats();
  io.to("superadmin_room").emit(
    "superadmin/companies/fetch-companystats-response",
    updatedstats
  );
};

const companiesController = (socket, io) => {
  socket.on("superadmin/companies/fetch-packages", async () => {
    try {
      let res = await companiesService.fetchPackages();
      console.log(res);
      socket.emit("superadmin/companies/fetch-packages-response", res);
    } catch (error) {
      socket.emit("superadmin/companies/fetch-packages-response", {
        done: false,
        error: error,
      });
    }
  });

  socket.on("superadmin/companies/add-company", async (data) => {
    try {
      console.log(data);
      try {
        const companyDoc = new Company(data);
        await companyDoc.validate(); // throws if in
        console.log("Adding to db");

        let res = await companiesService.addCompany(data, socket.user.sub);
        socket.emit("superadmin/companies/add-company-response", res);
        if (res.done) {
          await Broadcast(io);
        }
      } catch (error) {
        console.log("Error in super.admin/company/addcompany schema issue");
      }
    } catch (error) {
      socket.emit("superadmin/companies/add-company-response", {
        done: false,
        error: error,
      });
    }
  });

  socket.on("superadmin/companies/fetch-companylist", async (args) => {
    try {
      let res = await companiesService.fetchCompanylist(args);
      console.log("Company list", res);
      socket.emit("superadmin/companies/fetch-companylist-response", res);
    } catch (error) {
      socket.emit("superadmin/companies/fetch-companylist-response", {
        done: false,
        error: error,
      });
    }
  });

  socket.on("superadmin/companies/fetch-companystats", async () => {
    try {
      let res = await companiesService.fetchCompanystats();
      console.log("Company stats", res);
      socket.emit("superadmin/companies/fetch-companystats-response", res);
    } catch (error) {
      socket.emit("superadmin/companies/fetch-companystats-response", {
        done: false,
        error: error,
      });
    }
  });

  socket.on("superadmin/companies/delete-company", async (companyid) => {
    console.log("Super Admin is trying to delete company");
    console.log("Received delete company id:", companyid); // Debugging
    // Validate the form
    try {
      let res = await companiesService.deleteCompany(companyid); // Ensure `await` is used
      socket.emit("superadmin/companies/delete-company-response", res);
      if (res.done) {
        await Broadcast(io);
      }
    } catch (error) {
      socket.emit("superadmin/companies/delete-company-response", {
        done: false,
        message: error.message,
        data: null,
      });
    }
  });

  socket.on(
    "superadmin/companies/view-company",
    async (companyid, edit = false) => {
      try {
        if (edit) {
          const res = await companiesService.fetcheditcompanyview(companyid);
          socket.emit("superadmin/companies/editview-company-response", res);
          return;
        }
        const res = await companiesService.fetchcompany(companyid);
        socket.emit("superadmin/companies/view-company-response", res);
      } catch (error) {
        if (edit) {
          socket.emit("superadmin/companies/editview-company-response", {
            done: false,
            error: error,
          });
          return;
        }
        socket.emit("superadmin/companies/view-company-response", {
          done: false,
          error: error,
        });
      }
    }
  );

  socket.on("superadmin/companies/edit-company", async (form) => {
    try {
      console.log(form);
      console.log("sjbsjb");
      console.log("eee");
      let res = await companiesService.updateCompany(form); // Ensure `await` is used
      socket.emit("superadmin/companies/edit-company-response", res);
      if (res.done) {
        await Broadcast(io);
      }
    } catch (error) {
      socket.emit("superadmin/companies/edit-company-response", {
        done: false,
        error: error,
      });
    }
  });

  //   Redirect route
};

export default companiesController;
