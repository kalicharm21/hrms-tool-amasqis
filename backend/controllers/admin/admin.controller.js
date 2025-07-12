import * as adminService from "../../services/admin/admin.services.js";
import { getTenantCollections } from "../../config/db.js";
import { ObjectId } from "mongodb";

const adminController = (socket, io) => {
  const validateCompanyAccess = (socket) => {
    if (!socket.companyId) {
      throw new Error("Company ID not found in user metadata");
    }
    return socket.companyId;
  };

  // Get dashboard statistics
  socket.on("admin/dashboard/get-stats", async () => {
    try {
      const companyId = validateCompanyAccess(socket);
      const result = await adminService.getDashboardStats(companyId);
      socket.emit("admin/dashboard/get-stats-response", result);
    } catch (error) {
      socket.emit("admin/dashboard/get-stats-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Get employees by department
  socket.on("admin/dashboard/get-employees-by-department", async () => {
    try {
      const companyId = validateCompanyAccess(socket);
      const result = await adminService.getEmployeesByDepartment(companyId);
      socket.emit(
        "admin/dashboard/get-employees-by-department-response",
        result
      );
    } catch (error) {
      socket.emit("admin/dashboard/get-employees-by-department-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Get employee status distribution
  socket.on("admin/dashboard/get-employee-status", async () => {
    try {
      const companyId = validateCompanyAccess(socket);
      const result = await adminService.getEmployeeStatus(companyId);
      socket.emit("admin/dashboard/get-employee-status-response", result);
    } catch (error) {
      socket.emit("admin/dashboard/get-employee-status-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Get attendance overview
  socket.on("admin/dashboard/get-attendance-overview", async () => {
    try {
      const companyId = validateCompanyAccess(socket);
      const result = await adminService.getAttendanceOverview(companyId);
      socket.emit("admin/dashboard/get-attendance-overview-response", result);
    } catch (error) {
      socket.emit("admin/dashboard/get-attendance-overview-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Get clock in/out data
  socket.on("admin/dashboard/get-clock-inout-data", async () => {
    try {
      const companyId = validateCompanyAccess(socket);
      const result = await adminService.getClockInOutData(companyId);
      socket.emit("admin/dashboard/get-clock-inout-data-response", result);
    } catch (error) {
      socket.emit("admin/dashboard/get-clock-inout-data-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Get sales overview
  socket.on("admin/dashboard/get-sales-overview", async () => {
    try {
      const companyId = validateCompanyAccess(socket);
      const result = await adminService.getSalesOverview(companyId);
      socket.emit("admin/dashboard/get-sales-overview-response", result);
    } catch (error) {
      socket.emit("admin/dashboard/get-sales-overview-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Get recent invoices
  socket.on("admin/dashboard/get-recent-invoices", async () => {
    try {
      const companyId = validateCompanyAccess(socket);
      const result = await adminService.getRecentInvoices(companyId);
      socket.emit("admin/dashboard/get-recent-invoices-response", result);
    } catch (error) {
      socket.emit("admin/dashboard/get-recent-invoices-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Get employees list
  socket.on("admin/dashboard/get-employees-list", async () => {
    try {
      const companyId = validateCompanyAccess(socket);
      const result = await adminService.getEmployeesList(companyId);
      socket.emit("admin/dashboard/get-employees-list-response", result);
    } catch (error) {
      socket.emit("admin/dashboard/get-employees-list-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Get job applicants
  socket.on("admin/dashboard/get-job-applicants", async () => {
    try {
      const companyId = validateCompanyAccess(socket);
      const result = await adminService.getJobApplicants(companyId);
      socket.emit("admin/dashboard/get-job-applicants-response", result);
    } catch (error) {
      socket.emit("admin/dashboard/get-job-applicants-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Get recent activities
  socket.on("admin/dashboard/get-recent-activities", async () => {
    try {
      const companyId = validateCompanyAccess(socket);
      const result = await adminService.getRecentActivities(companyId);
      socket.emit("admin/dashboard/get-recent-activities-response", result);
    } catch (error) {
      socket.emit("admin/dashboard/get-recent-activities-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Get birthdays
  socket.on("admin/dashboard/get-birthdays", async () => {
    try {
      const companyId = validateCompanyAccess(socket);
      const result = await adminService.getBirthdays(companyId);
      socket.emit("admin/dashboard/get-birthdays-response", result);
    } catch (error) {
      socket.emit("admin/dashboard/get-birthdays-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Get todos
  socket.on("admin/dashboard/get-todos", async () => {
    try {
      const companyId = validateCompanyAccess(socket);
      const userId = socket.user.sub;
      const result = await adminService.getTodos(companyId, userId);
      socket.emit("admin/dashboard/get-todos-response", result);
    } catch (error) {
      socket.emit("admin/dashboard/get-todos-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Get projects data
  socket.on("admin/dashboard/get-projects-data", async () => {
    try {
      const companyId = validateCompanyAccess(socket);
      const result = await adminService.getProjectsData(companyId);
      socket.emit("admin/dashboard/get-projects-data-response", result);
    } catch (error) {
      socket.emit("admin/dashboard/get-projects-data-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Get task statistics
  socket.on("admin/dashboard/get-task-statistics", async () => {
    try {
      const companyId = validateCompanyAccess(socket);
      const result = await adminService.getTaskStatistics(companyId);
      socket.emit("admin/dashboard/get-task-statistics-response", result);
    } catch (error) {
      socket.emit("admin/dashboard/get-task-statistics-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Get schedules
  socket.on("admin/dashboard/get-schedules", async () => {
    try {
      const companyId = validateCompanyAccess(socket);
      const result = await adminService.getSchedules(companyId);
      socket.emit("admin/dashboard/get-schedules-response", result);
    } catch (error) {
      socket.emit("admin/dashboard/get-schedules-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Get all dashboard data at once
  socket.on("admin/dashboard/get-all-data", async () => {
    try {
      const companyId = validateCompanyAccess(socket);
      const userId = socket.user.sub;

      const [
        pendingItems,
        employeeGrowth,
        stats,
        employeesByDepartment,
        employeeStatus,
        attendanceOverview,
        clockInOutData,
        salesOverview,
        recentInvoices,
        employeesList,
        jobApplicants,
        recentActivities,
        birthdays,
        todos,
        projectsData,
        taskStatistics,
        schedules,
      ] = await Promise.all([
        adminService.getPendingItems(companyId, userId),
        adminService.getEmployeeGrowth(companyId),
        adminService.getDashboardStats(companyId),
        adminService.getEmployeesByDepartment(companyId),
        adminService.getEmployeeStatus(companyId),
        adminService.getAttendanceOverview(companyId),
        adminService.getClockInOutData(companyId),
        adminService.getSalesOverview(companyId),
        adminService.getRecentInvoices(companyId),
        adminService.getEmployeesList(companyId),
        adminService.getJobApplicants(companyId),
        adminService.getRecentActivities(companyId),
        adminService.getBirthdays(companyId),
        adminService.getTodos(companyId, userId),
        adminService.getProjectsData(companyId),
        adminService.getTaskStatistics(companyId),
        adminService.getSchedules(companyId),
      ]);

      socket.emit("admin/dashboard/get-all-data-response", {
        done: true,
        data: {
          pendingItems: pendingItems.data,
          employeeGrowth: employeeGrowth.data,
          stats: stats.data,
          employeesByDepartment: employeesByDepartment.data,
          employeeStatus: employeeStatus.data,
          attendanceOverview: attendanceOverview.data,
          clockInOutData: clockInOutData.data,
          salesOverview: salesOverview.data,
          recentInvoices: recentInvoices.data,
          employeesList: employeesList.data,
          jobApplicants: jobApplicants.data,
          recentActivities: recentActivities.data,
          birthdays: birthdays.data,
          todos: todos.data,
          projectsData: projectsData.data,
          taskStatistics: taskStatistics.data,
          schedules: schedules.data,
        },
      });
    } catch (error) {
      socket.emit("admin/dashboard/get-all-data-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Add todo
  socket.on("admin/dashboard/add-todo", async (todoData) => {
    try {
      const companyId = validateCompanyAccess(socket);
      const userId = socket.user.sub;

      const collections = getTenantCollections(companyId);
      const newTodo = {
        ...todoData,
        userId,
        createdAt: new Date(),
        completed: false,
        isDeleted: false,
      };

      const result = await collections.todos.insertOne(newTodo);

      socket.emit("admin/dashboard/add-todo-response", {
        done: true,
        data: { ...newTodo, _id: result.insertedId },
      });

      // Broadcast updated todos to admin room
      const updatedTodos = await adminService.getTodos(companyId, userId);
      io.to(`admin_room_${companyId}`).emit(
        "admin/dashboard/get-todos-response",
        updatedTodos
      );
    } catch (error) {
      socket.emit("admin/dashboard/add-todo-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Update todo
  socket.on("admin/dashboard/update-todo", async (todoData) => {
    try {
      const companyId = validateCompanyAccess(socket);
      const userId = socket.user.sub;

      const collections = getTenantCollections(companyId);

      const result = await collections.todos.updateOne(
        { _id: new ObjectId(todoData.id), userId },
        { $set: { ...todoData, updatedAt: new Date() } }
      );

      socket.emit("admin/dashboard/update-todo-response", {
        done: true,
        data: result,
      });

      // Broadcast updated todos to admin room
      const updatedTodos = await adminService.getTodos(companyId, userId);
      io.to(`admin_room_${companyId}`).emit(
        "admin/dashboard/get-todos-response",
        updatedTodos
      );
    } catch (error) {
      socket.emit("admin/dashboard/update-todo-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Delete todo
  socket.on("admin/dashboard/delete-todo", async (todoId) => {
    try {
      const companyId = validateCompanyAccess(socket);
      const userId = socket.user.sub;

      const collections = getTenantCollections(companyId);

      const result = await collections.todos.updateOne(
        { _id: new ObjectId(todoId), userId },
        { $set: { isDeleted: true, deletedAt: new Date() } }
      );

      socket.emit("admin/dashboard/delete-todo-response", {
        done: true,
        data: result,
      });

      // Broadcast updated todos to admin room
      const updatedTodos = await adminService.getTodos(companyId, userId);
      io.to(`admin_room_${companyId}`).emit(
        "admin/dashboard/get-todos-response",
        updatedTodos
      );
    } catch (error) {
      socket.emit("admin/dashboard/delete-todo-response", {
        done: false,
        error: error.message,
      });
    }
  });
};

export default adminController;
