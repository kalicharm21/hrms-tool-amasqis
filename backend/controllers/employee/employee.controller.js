import { ObjectId } from "mongodb";
import * as employeeService from "../../services/employee/dashboard.services.js"

const employeeDashboardController = (socket, io) => {
    const isDevelopment =
        process.env.NODE_ENV === "development";

    const validateEmployeeAccess = (socket) => {
        if (!socket.user || !socket.user.companyId || !socket.user.employeeId) {
            throw new Error("Company ID or Employee ID not found in user metadata");
        }
        const companyIdRegex = /^[a-zA-Z0-9_-]{3,50}$/;
        if (!companyIdRegex.test(socket.companyId)) {
            console.error(
                `Invalid company ID format: ${socket.companyId} for user ${socket.user?.sub}`
            );
            throw new Error("Invalid company ID format");
        }
        if (socket.userMetadata?.companyId !== socket.companyId) {
            console.error(
                `Company ID mismatch: userMetadata has companyId=${socket.userMetadata?.companyId}, socket has companyId=${socket.companyId}`
            );
            throw new Error("Unauthorized: Company ID mismatch");
        }

        if (socket.userMetadata?.employeeId !== socket.employeeId) {
            console.error(
                `Employee ID mismatch: userMetadata has employeeId=${socket.userMetadata?.employeeId}, socket has employeeId=${socket.employeeId}`
            );
            throw new Error("Unauthorized: Employee ID mismatch");
        }
        return {
            companyId: socket.companyId,
            employeeId: socket.employeeId,
        }
    }
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

    socket.on("employee/dashboard/get-details-stats", async () => {
        try {
            const { companyId, employeeId } = validateEmployeeAccess(socket);
            const result = await employeeService.getEmployeeDetails(companyId, employeeId);
            socket.emit("superadmin/dashboard/get-details-stats-response", result);
        } catch (error) {
            socket.emit("superadmin/dashboard/get-stats-response", {
                done: false,
                error: error.message
            })
        }
    });

    socket.on("employee/dashboard/get-attendance-stats", async () => {
        try {
            const { companyId, employeeId } = validateEmployeeAccess(socket);
            const result = await employeeService.getAttendanceStats(companyId, employeeId);
            socket.emit("employee/dashboard/get-attendance-stats", result);
        } catch (error) {
            socket.emit("employee/dashboard/get-attendance-stats-response", {
                done: false,
                error: error.message,
            })
        }
    })

    socket.on("employee/dashboard/get-leave-stats", async () => {
        try {
            const { companyId, employeeId } = validateEmployeeAccess(socket);
            const result = await employeeService.getLeaveStats(companyId, employeeId);
            socket.emit("employee/dashboard/get-leave-stats-response", result);
        } catch (error) {
            socket.emit("employee/dashboard/get-leave-stats-response", {
                done: false,
                error: error.message,
            })
        }
    })

    socket.on("employee/leave/add", withRateLimit(async (leaveData) => {
        try {
            const { companyId, employeeId } = validateEmployeeAccess(socket);
            if (!leaveData || typeof leaveData !== "object") {
                throw new Error("Invalid leave data format.");
            }
            const empName = typeof leaveData.empName === "string"
                ? leaveData.empName.trim().substring(0, 100)
                : null;

            if (!empName) {
                throw new Error("Employee name is required.");
            }

            const rawLeaveType = typeof leaveData.leaveType === "string"
                ? leaveData.leaveType.trim().toLowerCase()
                : "";

            const allowedLeaveTypes = ["casual", "sick", "earned", "unpaid"];
            const leaveType = allowedLeaveTypes.includes(rawLeaveType)
                ? rawLeaveType
                : "casual";

            const startDate = leaveData.startDate && !isNaN(Date.parse(leaveData.startDate))
                ? new Date(leaveData.startDate)
                : null;

            const endDate = leaveData.endDate && !isNaN(Date.parse(leaveData.endDate))
                ? new Date(leaveData.endDate)
                : null;

            if (!startDate || !endDate || startDate > endDate) {
                throw new Error("Leave dates are invalid or out of range.");
            }

            const reason = typeof leaveData.reason === "string"
                ? leaveData.reason.trim().substring(0, 1000)
                : "";

            const noOfDays = typeof leaveData.noOfDays === "number" && leaveData.noOfDays > 0
                ? leaveData.noOfDays
                : null;

            if (!noOfDays) {
                throw new Error("Valid number of leave days is required.");
            }

            const year = typeof leaveData.year === "number" && String(leaveData.year).length === 4
                ? leaveData.year
                : new Date().getFullYear();

            const leaveRequest = {
                empName,
                leaveType,
                reason,
                noOfDays,
                startDate,
                endDate,
                year,
                employeeId,
                status: "pending",
                createdAt: new Date(),
            };

            const collections = getTenantCollections(companyId);
            const result = await collections.leaveRequests.insertOne(leaveRequest);

            socket.emit("employee/leave/add-response", {
                done: true,
                data: { ...leaveRequest, _id: result.insertedId }
            });

            io.to(`manager_room_${companyId}`).emit("admin/leave/refresh");

        } catch (err) {
            socket.emit("employee/leave/add-response", {
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
    });

    socket.on("employee/dashboard/start-break", async () => {
        try {
            const { companyId, employeeId } = validateEmployeeAccess(socket);
            const result = await employeeService.breakStart(companyId, employeeId);
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

    socket.on('employee/dashboard/get-working-hours', async (payload) => {
        try {
            const { companyId, employeeId } = validateEmployeeAccess(socket);
            const duration = payload?.duration;
            if (!duration || typeof duration !== 'object') {
                return socket.emit('employee/get-working-hours-response', {
                    done: false,
                    error: 'Invalid or missing duration object.',
                });
            }
            let { periodType, startDate, endDate } = duration;
            periodType = typeof periodType === 'string' ? periodType.trim().toLowerCase() : '';
            const allowedPeriodTypes = ['thisweek', 'lastweek', 'thismonth', 'lastmonth'];
            if (!allowedPeriodTypes.includes(periodType)) {
                return socket.emit('employee/get-working-hours-response', {
                    done: false,
                    error: 'Invalid periodType. Allowed: thisWeek, lastWeek, thisMonth, lastMonth.',
                });
            }
            const sanitizedStartDate =
                startDate && !isNaN(Date.parse(startDate)) ? new Date(startDate) : null;
            const sanitizedEndDate =
                endDate && !isNaN(Date.parse(endDate)) ? new Date(endDate) : null;
            const result = await employeeService.getWorkingHoursByPeriod(companyId, employeeId, {
                periodType,
                startDate: sanitizedStartDate,
                endDate: sanitizedEndDate,
            });
            socket.emit('employee/get-working-hours-response', result);
        } catch (error) {
            socket.emit('employee/get-working-hours-response', {
                done: false,
                error: error.message || 'Unexpected error fetching working hours.',
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
            if (!allowedFilters.includes(filterType)) filter = 'all';

            const result = await employeeService.getTasks({ companyId, employeeId, filter });

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

            if (!payload.updateData || typeof payload.updateData !== "object") {
                return socket.emit("employee/dashboard/update-task-response", {
                    done: false,
                    error: "Invalid or missing update data."
                });
            }

            const result = await employeeService.updateTask({
                companyId,
                employeeId,
                taskData: {
                    taskId: payload.taskId,
                    updateData: payload.updateData
                }
            });

            socket.emit("employee/dashboard/update-task-response", result);
        } catch (err) {
            socket.emit("employee/dashboard/update-task-response", {
                done: false,
                error: err.message || "Unexpected error while updating task."
            });
        }
    }));

    socket.on("employee/dashboard/get-salary-monthly-breakdown", async (payload) => {
        try {
            const { companyId, employeeId } = validateEmployeeAccess(socket);
            let year = payload?.year;
            year = typeof year === "number" && String(year).length === 4 ? year : new Date().getFullYear();
            const result = await employeeService.getMonthlySalaryForYear(companyId, employeeId, year);
            socket.emit("employee/dashboard/get-salary-monthly-breakdown-response", result);
        } catch (err) {
            socket.emit("employee/dashboard/get-salary-monthly-breakdown-response", {
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
            const result = await employeeService.getSkillsByYear(companyId, employeeId, year);
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
            const tag = typeof payload?.tag === "string"
                ? payload.tag.trim().toLowerCase()
                : null;
            const validTags = ["today", "this month", "this year"];
            if (!tag || !validTags.includes(tag)) {
                return socket.emit("employee/dashboard/get-meetings-response", {
                    done: false,
                    error: "Invalid or missing tag. Allowed values: today, this month, this year."
                });
            }
            const result = await employeeService.getMeetings(companyId, employeeId, tag);
            socket.emit("employee/dashboard/get-meetings-response", result);
        } catch (error) {
            socket.emit("employee/dashboard/get-meetings-response", {
                done: false,
                error: error.message || "Failed to fetch meetings."
            });
        }
    });


    socket.on()
}

export default employeeDashboardController;
