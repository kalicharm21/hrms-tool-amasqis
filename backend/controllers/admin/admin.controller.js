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
  socket.on("admin/dashboard/get-todos", async (data) => {
    try {
      const companyId = validateCompanyAccess(socket);
      const userId = socket.user.sub;
      const filter = data?.filter || "all";
      const result = await adminService.getTodos(companyId, userId, filter);
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
        adminService.getTodos(companyId, userId, "today"),
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

      // Broadcast updated todos to admin room (get all todos for real-time sync)
      const updatedTodos = await adminService.getTodos(
        companyId,
        userId,
        "all"
      );
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

      // Broadcast updated todos to admin room (get all todos for real-time sync)
      const updatedTodos = await adminService.getTodos(
        companyId,
        userId,
        "all"
      );
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

  // Delete todo (soft delete)
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

      // Broadcast updated todos to admin room (get all todos for real-time sync)
      const updatedTodos = await adminService.getTodos(
        companyId,
        userId,
        "all"
      );
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

  // Delete todo permanently
  socket.on("admin/dashboard/delete-todo-permanently", async (todoId) => {
    try {
      console.log(`[DELETE TODO] Attempting to delete todo: ${todoId}`);
      const companyId = validateCompanyAccess(socket);
      const userId = socket.user.sub;
      console.log(`[DELETE TODO] CompanyId: ${companyId}, UserId: ${userId}`);

      const collections = getTenantCollections(companyId);

      // Check if the todo exists before deleting
      const todoExists = await collections.todos.findOne({
        _id: new ObjectId(todoId),
        userId,
      });
      console.log(`[DELETE TODO] Todo exists:`, todoExists);

      const result = await collections.todos.deleteOne({
        _id: new ObjectId(todoId),
        userId,
      });

      console.log(`[DELETE TODO] Delete result:`, result);

      socket.emit("admin/dashboard/delete-todo-permanently-response", {
        done: true,
        data: result,
      });

      // Broadcast updated todos to admin room (get all todos for real-time sync)
      const updatedTodos = await adminService.getTodos(
        companyId,
        userId,
        "all"
      );
      console.log(
        `[DELETE TODO] Broadcasting ${
          updatedTodos.data?.length || 0
        } todos to admin room`
      );
      io.to(`admin_room_${companyId}`).emit(
        "admin/dashboard/get-todos-response",
        updatedTodos
      );
    } catch (error) {
      console.error(`[DELETE TODO] Error deleting todo:`, error);
      socket.emit("admin/dashboard/delete-todo-permanently-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Get todo tags
  socket.on("admin/dashboard/get-todo-tags", async () => {
    try {
      const companyId = validateCompanyAccess(socket);
      const result = await adminService.getTodoTags(companyId);
      socket.emit("admin/dashboard/get-todo-tags-response", result);
    } catch (error) {
      socket.emit("admin/dashboard/get-todo-tags-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Get todo assignees
  socket.on("admin/dashboard/get-todo-assignees", async () => {
    try {
      const companyId = validateCompanyAccess(socket);
      const result = await adminService.getTodoAssignees(companyId);
      socket.emit("admin/dashboard/get-todo-assignees-response", result);
    } catch (error) {
      socket.emit("admin/dashboard/get-todo-assignees-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Get project clients
  socket.on("admin/project/get-clients", async () => {
    try {
      const companyId = validateCompanyAccess(socket);
      const result = await adminService.getProjectClients(companyId);
      socket.emit("admin/project/get-clients-response", result);
    } catch (error) {
      socket.emit("admin/project/get-clients-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Get project employees
  socket.on("admin/project/get-employees", async () => {
    try {
      const companyId = validateCompanyAccess(socket);
      const result = await adminService.getProjectEmployees(companyId);
      socket.emit("admin/project/get-employees-response", result);
    } catch (error) {
      socket.emit("admin/project/get-employees-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Get project tags
  socket.on("admin/project/get-tags", async () => {
    try {
      const companyId = validateCompanyAccess(socket);
      const result = await adminService.getProjectTags(companyId);
      socket.emit("admin/project/get-tags-response", result);
    } catch (error) {
      socket.emit("admin/project/get-tags-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Get project priorities
  socket.on("admin/project/get-priorities", async () => {
    try {
      const result = await adminService.getProjectPriorities();
      socket.emit("admin/project/get-priorities-response", result);
    } catch (error) {
      socket.emit("admin/project/get-priorities-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Get project statuses
  socket.on("admin/project/get-statuses", async () => {
    try {
      const result = await adminService.getProjectStatuses();
      socket.emit("admin/project/get-statuses-response", result);
    } catch (error) {
      socket.emit("admin/project/get-statuses-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Generate next project ID
  socket.on("admin/project/generate-id", async () => {
    try {
      const companyId = validateCompanyAccess(socket);
      const result = await adminService.generateNextProjectId(companyId);
      socket.emit("admin/project/generate-id-response", result);
    } catch (error) {
      socket.emit("admin/project/generate-id-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Add new project
  socket.on("admin/project/add", async (projectData) => {
    try {
      const companyId = validateCompanyAccess(socket);
      const userId = socket.user.sub;
      const result = await adminService.addProject(
        companyId,
        userId,
        projectData
      );
      socket.emit("admin/project/add-response", result);

      // Broadcast to admin room to update project lists
      io.to(`admin_room_${companyId}`).emit(
        "admin/project/project-added",
        result
      );
    } catch (error) {
      socket.emit("admin/project/add-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Get project modal data (all data in one call)
  socket.on("admin/project/get-modal-data", async () => {
    try {
      const companyId = validateCompanyAccess(socket);

      const [clients, employees, tags, priorities, statuses, projectId] =
        await Promise.all([
          adminService.getProjectClients(companyId),
          adminService.getProjectEmployees(companyId),
          adminService.getProjectTags(companyId),
          adminService.getProjectPriorities(),
          adminService.getProjectStatuses(),
          adminService.generateNextProjectId(companyId),
        ]);

      socket.emit("admin/project/get-modal-data-response", {
        done: true,
        data: {
          clients: clients.data,
          employees: employees.data,
          tags: tags.data,
          priorities: priorities.data,
          statuses: statuses.data,
          projectId: projectId.data.projectId,
        },
      });
    } catch (error) {
      socket.emit("admin/project/get-modal-data-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Get leave request employees
  socket.on("admin/leave/get-employees", async () => {
    try {
      const companyId = validateCompanyAccess(socket);
      const result = await adminService.getLeaveRequestEmployees(companyId);
      socket.emit("admin/leave/get-employees-response", result);
    } catch (error) {
      socket.emit("admin/leave/get-employees-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Get leave types
  socket.on("admin/leave/get-types", async () => {
    try {
      const companyId = validateCompanyAccess(socket);
      const result = await adminService.getLeaveTypes(companyId);
      socket.emit("admin/leave/get-types-response", result);
    } catch (error) {
      socket.emit("admin/leave/get-types-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Get employee leave balance
  socket.on("admin/leave/get-employee-balance", async (data) => {
    try {
      const companyId = validateCompanyAccess(socket);
      const { employeeId } = data;
      const result = await adminService.getEmployeeLeaveBalance(
        companyId,
        employeeId
      );
      socket.emit("admin/leave/get-employee-balance-response", result);
    } catch (error) {
      socket.emit("admin/leave/get-employee-balance-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Create leave request
  socket.on("admin/leave/create-request", async (leaveData) => {
    try {
      const companyId = validateCompanyAccess(socket);
      const userId = socket.user.sub;
      const result = await adminService.createLeaveRequest(
        companyId,
        userId,
        leaveData
      );
      socket.emit("admin/leave/create-request-response", result);

      // Broadcast to admin room to update leave requests
      io.to(`admin_room_${companyId}`).emit(
        "admin/leave/request-created",
        result
      );
    } catch (error) {
      socket.emit("admin/leave/create-request-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Get leave request modal data (all data in one call)
  socket.on("admin/leave/get-modal-data", async () => {
    try {
      const companyId = validateCompanyAccess(socket);
      const result = await adminService.getLeaveRequestModalData(companyId);
      socket.emit("admin/leave/get-modal-data-response", result);
    } catch (error) {
      socket.emit("admin/leave/get-modal-data-response", {
        done: false,
        error: error.message,
      });
    }
  });
};

export default adminController;
