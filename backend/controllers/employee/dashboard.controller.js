import { ObjectId } from "mongodb";
import * as employeeService from "../../services/employee/dashboard.services.js";

const employeeDashboardController = (socket, io) => {
    // Correct isDevelopment logic: should check equality, not always true due to ||
    const isDevelopment =
        process.env.NODE_ENV === "development" || process.env.NODE_ENV === "production";

    const validateEmployeeAccess = (socket) => {

        if (!socket.companyId) {
            console.error("[Employee] Company ID not found in user metadata", { user: socket.user?.sub });
            throw new Error("Company ID not found in user metadata");
        }
        const companyIdRegex = /^[a-zA-Z0-9_-]{3,50}$/;
        if (!companyIdRegex.test(socket.companyId)) {
            console.error(`[Employee] Invalid company ID format: ${socket.companyId}`);
            throw new Error("Invalid company ID format");
        }
        if (socket.userMetadata?.companyId !== socket.companyId) {
            console.error(
                `[Employee] Company ID mismatch: user metadata has ${socket.userMetadata?.companyId}, socket has ${socket.companyId}`
            );
            throw new Error("Unauthorized: Company ID mismatch");
        }
        if (socket.userMetadata?.role !== "employee") {
            console.error(`[Employee] Unauthorized role: ${socket.userMetadata?.role}, employee role required`);
            throw new Error("Unauthorized: Employee role required");
        }
        return { companyId: socket.companyId, employeeId: socket.user?.sub };
    };

    const withRateLimit = (handler) => {
        return async (...args) => {
            if (isDevelopment) {
                return handler(...args);
            }
            if (!socket.checkRateLimit()) {
                console.warn(`Rate limit exceeded for user ${socket.user.sub}`);
                const eventName = args[0] || "unknown";
                socket.emit(`${eventName}-response`, {
                    done: false,
                    error: "Rate limit exceeded. Please try again later.",
                });
                return;
            }
            return handler(...args);
        };
    };

    socket.on(
        "employee/dashboard/get-employee-details",
        withRateLimit(async () => {
            try {
                const { companyId, employeeId } = validateEmployeeAccess(socket);
                const result = await employeeService.getEmployeeDetails(companyId, employeeId);
                socket.emit("employee/dashboard/get-employee-details-response", { done: true, data: result });
            } catch (error) {
                socket.emit("employee/dashboard/get-employee-details-response", {
                    done: false,
                    error: error.message,
                });
            }
        })
    )

    socket.on("employee/dashboard/get-attendance-stats", async (payload) => {
        try {
            const { companyId, employeeId } = validateEmployeeAccess(socket);
            const year = typeof payload.year === "number" && !isNaN(payload.year)
                ? payload.year
                : new Date().getFullYear();
            const result = await employeeService.getAttendanceStats(companyId, employeeId, year);
            socket.emit("employee/dashboard/get-attendance-stats-response", result);
        } catch (error) {
            socket.emit("employee/dashboard/get-attendance-stats-response", {
                done: false,
                error: error.message,
            });
        }
    });

    socket.on("employee/dashboard/get-leave-stats", async (payload) => {
        try {
            const { companyId, employeeId } = validateEmployeeAccess(socket);
            const year = typeof payload.year === "number" && !isNaN(payload.year)
                ? payload.year
                : new Date().getFullYear();
            const result = await employeeService.getLeaveStats(companyId, employeeId, year);
            socket.emit("employee/dashboard/get-leave-stats-response", result);
        } catch (error) {
            socket.emit("employee/dashboard/get-leave-stats-response", {
                done: false,
                error: error.message,
            })
        }
    })

    socket.on("employee/dashboard/add-leave", withRateLimit(async (leaveRequest) => {
        try {
            const { companyId, employeeId } = validateEmployeeAccess(socket);

            if (!leaveRequest || typeof leaveRequest !== "object") {
                throw new Error("Invalid leave data format.");
            }

            const rawLeaveType = typeof leaveRequest.leaveType === "string"
                ? leaveRequest.leaveType.trim().toLowerCase()
                : "";

            const allowedLeaveTypes = ["casual", "sick", "lossOfPay"];
            const leaveType = allowedLeaveTypes.includes(rawLeaveType)
                ? rawLeaveType
                : "casual";

            const startDate = leaveRequest.fromDate && !isNaN(Date.parse(leaveRequest.fromDate))
                ? new Date(leaveRequest.fromDate)
                : null;

            const endDate = leaveRequest.toDate && !isNaN(Date.parse(leaveRequest.toDate))
                ? new Date(leaveRequest.toDate)
                : null;

            if (!startDate || !endDate || startDate > endDate) {
                throw new Error("Leave dates are invalid or out of range.");
            }

            const reason = typeof leaveRequest.reason === "string"
                ? leaveRequest.reason.trim().substring(0, 1000)
                : "";

            const noOfDays = typeof leaveRequest.noOfDays === "number" && leaveRequest.noOfDays > 0
                ? leaveRequest.noOfDays
                : null;

            if (!noOfDays) {
                throw new Error("Valid number of leave days is required.");
            }
            const leaveData = {
                leaveType,
                reason,
                noOfDays,
                startDate,
                endDate,
                status: "pending",
            };
            const result = await employeeService.addLeaveRequest(companyId, employeeId, leaveData);
            socket.emit("employee/dashboard/add-leave-response", {
                done: true,
                data: result
            });
            io.to(`hr_room_${companyId}`).emit("hr/leave/refresh", result);
        } catch (err) {
            console.log(err);

            socket.emit("employee/dashboard/add-leave-response", {
                done: false,
                error: err.message || "Something went wrong while submitting leave.",
            });
        }
    }));

    socket.on("employee/dashboard/punch-in", async () => {
        try {
            const { companyId, employeeId } = validateEmployeeAccess(socket);
            const result = await employeeService.punchIn(companyId, employeeId);
            socket.emit("employee/dashboard/punch-in-response", result);
        } catch (error) {
            socket.emit("employee/dashboard/punch-in-response", {
                done: false,
                error: error.message,
            })
        }
    })

    socket.on("employee/dashboard/punch-out", async () => {
        try {
            const { companyId, employeeId } = validateEmployeeAccess(socket);
            const result = await employeeService.punchOut(companyId, employeeId);
            socket.emit("employee/dashboard/punch-out-response", result);
        } catch (error) {
            socket.emit("employee/dashboard/punch-out-response", {
                done: false,
                error: error.message,
            })
        }
    })

    socket.on("employee/dashboard/start-break", async () => {
        try {
            const { companyId, employeeId } = validateEmployeeAccess(socket);
            const result = await employeeService.startBreak(companyId, employeeId);
            socket.emit("employee/dashboard/start-break-response", result);
        } catch (error) {
            socket.emit("employee/dashboard/start-break-response", {
                done: false,
                error: error.message,
            })
        }
    })

    socket.on("employee/dashboard/end-break", async () => {
        try {
            const { companyId, employeeId } = validateEmployeeAccess(socket);
            const result = await employeeService.resumeBreak(companyId, employeeId);
            socket.emit("employee/dashboard/end-break-response", result);
        } catch (error) {
            socket.emit("employee/dashboard/end-break-response", {
                done: false,
                error: error.message,
            })
        }
    })

    socket.on('employee/dashboard/working-hours-stats', async () => {
        try {
            const { companyId, employeeId } = validateEmployeeAccess(socket);
            const result = await employeeService.getWorkingHoursStats(companyId, employeeId);
            socket.emit('employee/dashboard/working-hours-stats-response', result);
        } catch (error) {
            socket.emit('employee/dashboard/working-hours-stats-response', {
                done: false,
                error: error.message || 'Failed to retrieve working hours summary'
            });
        }
    });

    socket.on('employee/dashboard/get-projects', async (payload) => {
        try {
            const { companyId, employeeId } = validateEmployeeAccess(socket);
            let filter = payload?.filter;

            if (typeof filter === "string") {
                filter = filter.trim().toLowerCase();
            } else {
                filter = "all";
            }
            const allowedFilters = ["ongoing", "all"];
            if (!allowedFilters.includes(filter)) {
                filter = "all";
            }
            const result = await employeeService.getProjects(companyId, employeeId, filter);
            socket.emit('employee/dashboard/get-projects-response', result);
        } catch (error) {
            socket.emit('employee/dashboard/get-projects-response', {
                done: false,
                error: error.message || 'Unexpected error fetching projects'
            });
        }
    });

    socket.on('employee/dashboard/get-tasks', async (payload) => {
        try {
            const { companyId, employeeId } = validateEmployeeAccess(socket);

            let filter = payload?.filter;
            filter = typeof filter === 'string' ? filter.trim().toLowerCase() : 'all';

            const allowedFilters = ['all', 'ongoing'];
            if (!allowedFilters.includes(filter)) filter = 'all';

            const result = await employeeService.getTasks(companyId, employeeId, filter);

            socket.emit('employee/dashboard/get-tasks-response', result);
        } catch (error) {
            socket.emit('employee/dashboard/get-tasks-response', {
                done: false,
                error: error.message || 'Unexpected error fetching tasks'
            });
        }
    });

    socket.on("employee/dashboard/add-task", withRateLimit(async (payload) => {
        try {
            const { companyId, employeeId } = validateEmployeeAccess(socket);

            if (!payload || typeof payload !== "object") {
                throw new Error("Invalid task data.");
            }
            const { projectId, title, description, status, dueDate, checked, starred } = payload;

            if (!projectId || typeof projectId !== "string" || !ObjectId.isValid(projectId)) {
                throw new Error("Valid project ID is required.");
            }

            const sanitizedTitle = typeof title === "string"
                ? title.trim().substring(0, 200)
                : null;

            if (!sanitizedTitle) {
                throw new Error("Task title is required.");
            }

            const sanitizedDescription = typeof description === "string"
                ? description.trim().substring(0, 1000)
                : "";

            const allowedStatuses = ["pending", "in_progress", "completed"];
            const sanitizedStatus = typeof status === "string"
                ? status.trim().toLowerCase()
                : "pending";

            const finalStatus = allowedStatuses.includes(sanitizedStatus)
                ? sanitizedStatus
                : "pending";

            const sanitizedDueDate = dueDate && !isNaN(Date.parse(dueDate))
                ? new Date(dueDate)
                : null;

            const finalChecked = typeof checked === "boolean" ? checked : false;
            const finalStarred = typeof starred === "boolean" ? starred : false;

            const result = await employeeService.addTask({
                companyId,
                employeeId,
                taskData: {
                    projectId,
                    title: sanitizedTitle,
                    description: sanitizedDescription,
                    status: finalStatus,
                    dueDate: sanitizedDueDate,
                    checked: finalChecked,
                    starred: finalStarred
                }
            });

            socket.emit("employee/dashboard/add-task-response", result);

        } catch (err) {
            socket.emit("employee/dashboard/add-task-response", {
                done: false,
                error: err.message || "Failed to add task."
            });
        }
    }));

    socket.on("employee/dashboard/update-task", withRateLimit(async (payload) => {
        try {
            const { companyId, employeeId } = validateEmployeeAccess(socket);
            if (
                !payload ||
                typeof payload !== "object" ||
                !payload.taskId ||
                !ObjectId.isValid(payload.taskId)
            ) {
                return socket.emit("employee/dashboard/update-task-response", {
                    done: false,
                    error: "Invalid or missing task ID."
                });
            }
            const updateData = payload.updateData;
            if (!updateData || typeof updateData !== "object") {
                return socket.emit("employee/dashboard/update-task-response", {
                    done: false,
                    error: "Invalid or missing update data."
                });
            }
            const allowedKeys = ["status", "starred", "checked"];
            const hasValidField = allowedKeys.some(
                key => Object.prototype.hasOwnProperty.call(updateData, key)
            );
            if (!hasValidField) {
                return socket.emit("employee/dashboard/update-task-response", {
                    done: false,
                    error: "Update must include at least one of: status, starred, or checked."
                });
            }
console.log("check 1");

            let allowedUpdates = {};
            if (typeof updateData.status === 'string') {
                if (!ALLOWED_STATUSES.includes(updateData.status)) {
                    return { done: false, error: 'Invalid status value.' };
                }
                allowedUpdates.status = updateData.status;
            }
            if (typeof updateData.starred === 'boolean') {
                allowedUpdates.starred = updateData.starred;
            }
            if (typeof updateData.checked === 'boolean') {
                allowedUpdates.checked = updateData.checked;
            }

            if (Object.keys(allowedUpdates).length === 0) {
                return { done: false, error: 'No valid fields to update.' };
            }
console.log("chek-2");

            const result = await employeeService.updateTask({
                companyId,
                employeeId,
                taskData: {
                    taskId: new ObjectId(payload.taskId),
                    updateData: allowedUpdates,
                }
            });
            socket.emit("employee/dashboard/update-task-response", result);
        } catch (err) {
            console.log(err);
            
            socket.emit("employee/dashboard/update-task-response", {
                done: false,
                error: err.message || "Unexpected error while updating task."
            });
        }
    }));

    socket.on("employee/dashboard/get-performance", async (payload) => {
        try {
            const { companyId, employeeId } = validateEmployeeAccess(socket);
            let year = payload?.year;
            year = typeof year === "number" && String(year).length === 4 ? year : new Date().getFullYear();
            const result = await employeeService.getPerformance(companyId, employeeId, year);
            socket.emit("employee/dashboard/get-performance-response", result);
        } catch (err) {
            socket.emit("employee/dashboard/get-performance-response", {
                done: false,
                error: err.message || "Failed to fetch salary breakdown."
            });
        }
    });

    socket.on("employee/dashboard/get-skills", async (payload) => {
        try {
            const { companyId, employeeId } = validateEmployeeAccess(socket);
            let year = payload?.year;
            year = typeof year === "number" && String(year).length === 4
                ? year
                : new Date().getFullYear();
            const result = await employeeService.getSkills(companyId, employeeId, year);
            socket.emit("employee/dashboard/get-skills-response", result);
        } catch (err) {
            socket.emit("employee/dashboard/get-skills-response", {
                done: false,
                error: err.message || "Failed to fetch skills."
            });
        }
    });

    socket.on("employee/dashboard/get-team-members", async () => {
        try {
            const { companyId, employeeId } = validateEmployeeAccess(socket);
            const result = await employeeService.getTeamMembers(companyId, employeeId);
            socket.emit("employee/dashboard/get-team-members-response", result);
        } catch (err) {
            socket.emit("employee/dashboard/get-team-members-response", {
                done: false,
                error: err.message || "Failed to fetch team members."
            });
        }
    });

    socket.on("employee/dashboard/get-notifications-today", async () => {
        try {
            const { companyId, employeeId } = validateEmployeeAccess(socket);
            const result = await employeeService.getTodaysNotifications(companyId, employeeId);
            socket.emit("employee/dashboard/get-notifications-today-response", result);
        } catch (err) {
            socket.emit("employee/dashboard/get-notifications-today-response", {
                done: false,
                error: err.message || "Failed to fetch today's notifications."
            });
        }
    });

    socket.on("employee/dashboard/get-meetings", async (payload) => {
        try {
            const { companyId, employeeId } = validateEmployeeAccess(socket);
            const filter = typeof payload?.filter === "string"
                ? payload.filter.trim().toLowerCase()
                : null;
            const validFilters = ["today", "month", "year"];
            if (!filter || !validFilters.includes(filter)) {
                return socket.emit("employee/dashboard/get-meetings-response", {
                    done: false,
                    error: "Invalid or missing tag. Allowed values: today, this month, this year."
                });
            }
            const result = await employeeService.getMeetings(companyId, employeeId, filter);
            socket.emit("employee/dashboard/get-meetings-response", result);
        } catch (error) {
            socket.emit("employee/dashboard/get-meetings-response", {
                done: false,
                error: error.message || "Failed to fetch meetings."
            });
        }
    });

    socket.on("employee/dashboard/get-birthdays", async () => {
        try {
            const { companyId, employeeId } = validateEmployeeAccess(socket);
            const result = await employeeService.getTodaysBirthday(companyId, employeeId);
            socket.emit("employee/dashboard/get-birthdays-response", result);
        } catch (error) {
            socket.emit("employee/dashboard/get-birthdays-response", {
                done: false,
                error: error.message || "Failed to fetch birthday team members."
            });
        }
    });

    socket.on("employee/dashboard/get-last-day-timmings", async () => {
        try {
            const { companyId, employeeId } = validateEmployeeAccess(socket);
            const result = await employeeService.getLastDayTimmings(companyId, employeeId);
            socket.emit("employee/dashboard/get-last-day-timmings-response", result);
        } catch (error) {
            socket.emit("employee/dashboard/get-last-day-timmings-response", {
                done: false,
                error: error.message || "Failed to fetch birthday team members."
            });
        }
    });

    // get all data
    socket.on("employee/dashboard/get-all-data", async (data = {}) => {
        try {
            const { companyId, employeeId } = validateEmployeeAccess(socket);
            const year = data.year || new Date().getFullYear();
console.log("HeKLLOOO");

            const [
                employeeDetails,
                attendanceStats,
                leaveStats,
                workingHoursStats,
                projects,
                tasks,
                performance,
                skills,
                teamMembers,
                notifications,
                meetings,
                birthdays,
                lastDayTimmings
            ] = await Promise.all([
                employeeService.getEmployeeDetails(companyId, employeeId),
                employeeService.getAttendanceStats(companyId, employeeId, year),
                employeeService.getLeaveStats(companyId, employeeId, year),
                employeeService.getWorkingHoursStats(companyId, employeeId),
                employeeService.getProjects(companyId, employeeId, "ongoing"),
                employeeService.getTasks(companyId, employeeId, "ongoing"),
                employeeService.getPerformance(companyId, employeeId, year),
                employeeService.getSkills(companyId, employeeId, year),
                employeeService.getTeamMembers(companyId, employeeId),
                employeeService.getTodaysNotifications(companyId, employeeId),
                employeeService.getMeetings(companyId, employeeId, "today"),
                employeeService.getTodaysBirthday(companyId, employeeId),
                employeeService.getLastDayTimmings(companyId, employeeId),
            ])
            socket.emit("employee/dashboard/get-all-data-response", {
                done: true,
                data: {
                    employeeDetails: employeeDetails.data,
                    attendanceStats: attendanceStats.data,
                    leaveStats: leaveStats.data,
                    workingHoursStats: workingHoursStats.data,
                    projects: projects.data,
                    tasks: tasks.data,
                    performance: performance.data,
                    skills: skills.data,
                    teamMembers: teamMembers.data,
                    notifications: notifications.data,
                    meetings: meetings.data,
                    birthdays: birthdays.data,
                    lastDayTimmings: lastDayTimmings.data,
                }
            })
        } catch (error) {
            socket.emit("employee/dashboard/get-all-data-response", {
                done: false,
                error: error.message,
            });
        }
    })
}

export default employeeDashboardController;
