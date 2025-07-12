import { getTenantCollections } from "../../config/db.js";
import {
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";

// Get dashboard statistics
export const getDashboardStats = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);

    const [
      attendanceStats,
      projectStats,
      clientStats,
      taskStats,
      earningsStats,
      employeeStats,
      jobApplicationStats,
    ] = await Promise.all([
      collections.attendance
        .aggregate([
          {
            $facet: {
              total: [{ $count: "count" }],
              present: [
                {
                  $match: {
                    status: "Present",
                    date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                  },
                },
                { $count: "count" },
              ],
            },
          },
        ])
        .toArray(),

      // Project stats
      collections.projects
        .aggregate([
          {
            $facet: {
              total: [{ $count: "count" }],
              completed: [
                { $match: { status: "Completed" } },
                { $count: "count" },
              ],
            },
          },
        ])
        .toArray(),

      // Client stats
      collections.clients.countDocuments({ status: "Active" }),

      // Task stats
      collections.tasks
        .aggregate([
          {
            $facet: {
              total: [{ $count: "count" }],
              completed: [
                { $match: { status: "Completed" } },
                { $count: "count" },
              ],
            },
          },
        ])
        .toArray(),

      // Earnings stats
      collections.earnings
        .aggregate([
          {
            $group: {
              _id: null,
              totalEarnings: { $sum: "$amount" },
              weeklyProfit: {
                $sum: {
                  $cond: {
                    if: {
                      $gte: ["$date", startOfWeek(new Date())],
                    },
                    then: "$profit",
                    else: 0,
                  },
                },
              },
            },
          },
        ])
        .toArray(),

      // Employee stats
      collections.employees.countDocuments({ status: "Active" }),

      // Job applications
      collections.jobApplications.countDocuments({ status: "Active" }),
    ]);

    const attendance = attendanceStats[0];
    const projects = projectStats[0];
    const tasks = taskStats[0];
    const earnings = earningsStats[0] || { totalEarnings: 0, weeklyProfit: 0 };

    return {
      done: true,
      data: {
        attendance: {
          present: attendance.present[0]?.count || 0,
          total: attendance.total[0]?.count || 0,
          percentage: attendance.total[0]?.count
            ? Math.round(
                ((attendance.present[0]?.count || 0) /
                  attendance.total[0].count) *
                  100
              )
            : 0,
        },
        projects: {
          total: projects.total[0]?.count || 0,
          completed: projects.completed[0]?.count || 0,
          percentage: projects.total[0]?.count
            ? Math.round(
                ((projects.completed[0]?.count || 0) /
                  projects.total[0].count) *
                  100
              )
            : 0,
        },
        clients: clientStats || 0,
        tasks: {
          total: tasks.total[0]?.count || 0,
          completed: tasks.completed[0]?.count || 0,
        },
        earnings: earnings.totalEarnings || 0,
        weeklyProfit: earnings.weeklyProfit || 0,
        employees: employeeStats || 0,
        jobApplications: jobApplicationStats || 0,
      },
    };
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    return { done: false, error: error.message };
  }
};

// Get employees by department
export const getEmployeesByDepartment = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);

    const departmentData = await collections.employees
      .aggregate([
        { $match: { status: "Active" } },
        {
          $group: {
            _id: "$department",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ])
      .toArray();

    const data = departmentData.map((dept) => ({
      department: dept._id || "Other",
      count: dept.count,
    }));

    return {
      done: true,
      data,
    };
  } catch (error) {
    console.error("Error fetching employees by department:", error);
    return { done: false, error: error.message };
  }
};

// Get employee status distribution
export const getEmployeeStatus = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);

    const [statusData, topPerformer] = await Promise.all([
      collections.employees
        .aggregate([
          {
            $group: {
              _id: "$employmentType",
              count: { $sum: 1 },
            },
          },
        ])
        .toArray(),

      collections.employees.findOne(
        { status: "Active" },
        { sort: { performance: -1 } }
      ),
    ]);

    const totalEmployees = await collections.employees.countDocuments({
      status: "Active",
    });

    const statusDistribution = statusData.reduce((acc, curr) => {
      acc[curr._id || "Other"] = curr.count;
      return acc;
    }, {});

    return {
      done: true,
      data: {
        total: totalEmployees,
        distribution: statusDistribution,
        topPerformer: topPerformer
          ? {
              name: `${topPerformer.firstName} ${topPerformer.lastName}`,
              position: topPerformer.position,
              performance: topPerformer.performance || 95,
              avatar:
                topPerformer.avatar || "assets/img/profiles/avatar-24.jpg",
            }
          : null,
      },
    };
  } catch (error) {
    console.error("Error fetching employee status:", error);
    return { done: false, error: error.message };
  }
};

// Get attendance overview
export const getAttendanceOverview = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);

    const today = new Date();
    const attendanceData = await collections.attendance
      .aggregate([
        {
          $match: {
            date: {
              $gte: new Date(today.setHours(0, 0, 0, 0)),
              $lt: new Date(today.setHours(23, 59, 59, 999)),
            },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const statusCounts = attendanceData.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    const total = Object.values(statusCounts).reduce(
      (sum, count) => sum + count,
      0
    );

    // Get absentees
    const absentees = await collections.employees
      .aggregate([
        {
          $lookup: {
            from: "attendance",
            let: { empId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$employeeId", "$$empId"] },
                      { $gte: ["$date", new Date(today.setHours(0, 0, 0, 0))] },
                    ],
                  },
                },
              },
            ],
            as: "todayAttendance",
          },
        },
        {
          $match: {
            todayAttendance: { $size: 0 },
            status: "Active",
          },
        },
        { $limit: 5 },
        {
          $project: {
            name: { $concat: ["$firstName", " ", "$lastName"] },
            avatar: "$avatar",
            position: "$position",
          },
        },
      ])
      .toArray();

    return {
      done: true,
      data: {
        total,
        present: statusCounts.Present || 0,
        late: statusCounts.Late || 0,
        permission: statusCounts.Permission || 0,
        absent: statusCounts.Absent || 0,
        absentees,
      },
    };
  } catch (error) {
    console.error("Error fetching attendance overview:", error);
    return { done: false, error: error.message };
  }
};

// Get clock in/out data
export const getClockInOutData = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);

    const today = new Date();
    const clockData = await collections.attendance
      .aggregate([
        {
          $match: {
            date: {
              $gte: new Date(today.setHours(0, 0, 0, 0)),
              $lt: new Date(today.setHours(23, 59, 59, 999)),
            },
          },
        },
        {
          $lookup: {
            from: "employees",
            localField: "employeeId",
            foreignField: "_id",
            as: "employee",
          },
        },
        { $unwind: "$employee" },
        { $sort: { clockIn: -1 } },
        { $limit: 10 },
        {
          $project: {
            name: {
              $concat: ["$employee.firstName", " ", "$employee.lastName"],
            },
            position: "$employee.position",
            avatar: "$employee.avatar",
            clockIn: 1,
            clockOut: 1,
            status: 1,
            hoursWorked: 1,
          },
        },
      ])
      .toArray();

    return {
      done: true,
      data: clockData,
    };
  } catch (error) {
    console.error("Error fetching clock in/out data:", error);
    return { done: false, error: error.message };
  }
};

// Get sales overview data
export const getSalesOverview = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);

    const monthlyData = await collections.earnings
      .aggregate([
        {
          $match: {
            date: {
              $gte: startOfMonth(subDays(new Date(), 365)),
              $lte: endOfMonth(new Date()),
            },
          },
        },
        {
          $group: {
            _id: {
              month: { $month: "$date" },
              year: { $year: "$date" },
            },
            income: { $sum: "$income" },
            expenses: { $sum: "$expenses" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        { $limit: 12 },
      ])
      .toArray();

    // Fill missing months with 0
    const income = new Array(12).fill(0);
    const expenses = new Array(12).fill(0);

    for (const item of monthlyData) {
      const monthIndex = item._id.month - 1;
      income[monthIndex] = Math.round(item.income / 1000);
      expenses[monthIndex] = Math.round(item.expenses / 1000);
    }

    return {
      done: true,
      data: { income, expenses },
    };
  } catch (error) {
    console.error("Error fetching sales overview:", error);
    return { done: false, error: error.message };
  }
};

// Get recent invoices
export const getRecentInvoices = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);

    const invoices = await collections.invoices
      .aggregate([
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "clients",
            localField: "clientId",
            foreignField: "_id",
            as: "client",
          },
        },
        { $unwind: "$client" },
        {
          $project: {
            invoiceNumber: 1,
            title: 1,
            amount: 1,
            status: 1,
            createdAt: 1,
            clientName: "$client.name",
            clientLogo: "$client.logo",
          },
        },
      ])
      .toArray();

    return {
      done: true,
      data: invoices,
    };
  } catch (error) {
    console.error("Error fetching recent invoices:", error);
    return { done: false, error: error.message };
  }
};

// Get employees list
export const getEmployeesList = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);

    const employees = await collections.employees
      .aggregate([
        { $match: { status: "Active" } },
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
        {
          $project: {
            name: { $concat: ["$firstName", " ", "$lastName"] },
            position: 1,
            department: 1,
            avatar: 1,
          },
        },
      ])
      .toArray();

    return {
      done: true,
      data: employees,
    };
  } catch (error) {
    console.error("Error fetching employees list:", error);
    return { done: false, error: error.message };
  }
};

// Get job applicants
export const getJobApplicants = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);

    const [openings, applicants] = await Promise.all([
      collections.jobApplications
        .aggregate([
          {
            $group: {
              _id: "$position",
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 4 },
        ])
        .toArray(),

      collections.jobApplications
        .aggregate([
          { $match: { status: "Active" } },
          { $sort: { createdAt: -1 } },
          { $limit: 4 },
          {
            $project: {
              name: 1,
              position: 1,
              experience: 1,
              location: 1,
              avatar: 1,
            },
          },
        ])
        .toArray(),
    ]);

    return {
      done: true,
      data: {
        openings,
        applicants,
      },
    };
  } catch (error) {
    console.error("Error fetching job applicants:", error);
    return { done: false, error: error.message };
  }
};

// Get recent activities
export const getRecentActivities = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);

    const activities = await collections.activities
      .aggregate([
        { $sort: { createdAt: -1 } },
        { $limit: 6 },
        {
          $lookup: {
            from: "employees",
            localField: "employeeId",
            foreignField: "_id",
            as: "employee",
          },
        },
        { $unwind: "$employee" },
        {
          $project: {
            action: 1,
            description: 1,
            createdAt: 1,
            employeeName: {
              $concat: ["$employee.firstName", " ", "$employee.lastName"],
            },
            employeeAvatar: "$employee.avatar",
          },
        },
      ])
      .toArray();

    return {
      done: true,
      data: activities,
    };
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    return { done: false, error: error.message };
  }
};

// Get birthdays
export const getBirthdays = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayBirthdays, tomorrowBirthdays, upcomingBirthdays] =
      await Promise.all([
        collections.employees
          .find({
            $expr: {
              $and: [
                { $eq: [{ $dayOfMonth: "$dateOfBirth" }, today.getDate()] },
                { $eq: [{ $month: "$dateOfBirth" }, today.getMonth() + 1] },
              ],
            },
            status: "Active",
          })
          .limit(3)
          .toArray(),

        collections.employees
          .find({
            $expr: {
              $and: [
                { $eq: [{ $dayOfMonth: "$dateOfBirth" }, tomorrow.getDate()] },
                { $eq: [{ $month: "$dateOfBirth" }, tomorrow.getMonth() + 1] },
              ],
            },
            status: "Active",
          })
          .limit(3)
          .toArray(),

        collections.employees
          .find({
            status: "Active",
            dateOfBirth: { $exists: true },
          })
          .limit(2)
          .toArray(),
      ]);

    return {
      done: true,
      data: {
        today: todayBirthdays.map((emp) => ({
          name: `${emp.firstName} ${emp.lastName}`,
          position: emp.position,
          avatar: emp.avatar,
        })),
        tomorrow: tomorrowBirthdays.map((emp) => ({
          name: `${emp.firstName} ${emp.lastName}`,
          position: emp.position,
          avatar: emp.avatar,
        })),
        upcoming: upcomingBirthdays.map((emp) => ({
          name: `${emp.firstName} ${emp.lastName}`,
          position: emp.position,
          avatar: emp.avatar,
          date: emp.dateOfBirth,
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching birthdays:", error);
    return { done: false, error: error.message };
  }
};

// Get todos
export const getTodos = async (companyId, userId) => {
  try {
    const collections = getTenantCollections(companyId);

    const todos = await collections.todos
      .find({
        userId,
        isDeleted: { $ne: true },
      })
      .sort({ createdAt: -1 })
      .toArray();

    return {
      done: true,
      data: todos,
    };
  } catch (error) {
    console.error("Error fetching todos:", error);
    return { done: false, error: error.message };
  }
};

// Get projects data
export const getProjectsData = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);

    const projects = await collections.projects
      .aggregate([
        { $sort: { createdAt: -1 } },
        { $limit: 7 },
        {
          $lookup: {
            from: "employees",
            localField: "teamMembers",
            foreignField: "_id",
            as: "team",
          },
        },
        {
          $project: {
            id: { $toString: "$_id" },
            name: 1,
            hours: 1,
            totalHours: 1,
            deadline: 1,
            priority: 1,
            progress: {
              $multiply: [{ $divide: ["$hours", "$totalHours"] }, 100],
            },
            team: {
              $map: {
                input: { $slice: ["$team", 3] },
                as: "member",
                in: {
                  name: {
                    $concat: ["$$member.firstName", " ", "$$member.lastName"],
                  },
                  avatar: "$$member.avatar",
                },
              },
            },
          },
        },
      ])
      .toArray();

    return {
      done: true,
      data: projects,
    };
  } catch (error) {
    console.error("Error fetching projects data:", error);
    return { done: false, error: error.message };
  }
};

// Get task statistics
export const getTaskStatistics = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);

    const taskStats = await collections.tasks
      .aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const totalTasks = taskStats.reduce((sum, stat) => sum + stat.count, 0);
    const taskDistribution = taskStats.reduce((acc, stat) => {
      acc[stat._id] = {
        count: stat.count,
        percentage: Math.round((stat.count / totalTasks) * 100),
      };
      return acc;
    }, {});

    // Get total hours spent
    const hoursData = await collections.tasks
      .aggregate([
        {
          $group: {
            _id: null,
            totalHours: { $sum: "$hoursSpent" },
            targetHours: { $sum: "$estimatedHours" },
          },
        },
      ])
      .toArray();

    const hours = hoursData[0] || { totalHours: 0, targetHours: 0 };

    return {
      done: true,
      data: {
        total: totalTasks,
        distribution: taskDistribution,
        hoursSpent: hours.totalHours,
        targetHours: hours.targetHours,
      },
    };
  } catch (error) {
    console.error("Error fetching task statistics:", error);
    return { done: false, error: error.message };
  }
};

// Get schedules
export const getSchedules = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);

    const schedules = await collections.schedules
      .aggregate([
        {
          $match: {
            date: {
              $gte: new Date(),
              $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
            },
          },
        },
        { $sort: { date: 1 } },
        { $limit: 2 },
        {
          $lookup: {
            from: "employees",
            localField: "participants",
            foreignField: "_id",
            as: "participantDetails",
          },
        },
        {
          $project: {
            title: 1,
            type: 1,
            date: 1,
            startTime: 1,
            endTime: 1,
            participants: {
              $map: {
                input: { $slice: ["$participantDetails", 5] },
                as: "participant",
                in: {
                  name: {
                    $concat: [
                      "$$participant.firstName",
                      " ",
                      "$$participant.lastName",
                    ],
                  },
                  avatar: "$$participant.avatar",
                },
              },
            },
          },
        },
      ])
      .toArray();

    return {
      done: true,
      data: schedules,
    };
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return { done: false, error: error.message };
  }
};

// Get pending items for the user
export const getPendingItems = async (companyId, userId) => {
  try {
    const collections = getTenantCollections(companyId);

    // Check if collections exist before trying to access them
    let pendingApprovals = 0;
    let pendingLeaveRequests = 0;

    // Try to get pending approvals from existing collections
    try {
      if (collections.approvals) {
        pendingApprovals = await collections.approvals.countDocuments({
          approverClerkId: userId,
          status: "Pending",
        });
      }
    } catch (approvalError) {
      console.log("Approvals collection not found, using default value");
      pendingApprovals = 0;
    }

    // Try to get pending leave requests from existing collections
    try {
      if (collections.leaveRequests) {
        pendingLeaveRequests = await collections.leaveRequests.countDocuments({
          approverClerkId: userId,
          status: "Pending",
        });
      } else if (collections.leaves) {
        // Try alternative collection name
        pendingLeaveRequests = await collections.leaves.countDocuments({
          approverClerkId: userId,
          status: "Pending",
        });
      }
    } catch (leaveError) {
      console.log("Leave requests collection not found, using default value");
      pendingLeaveRequests = 0;
    }

    return {
      done: true,
      data: {
        approvals: pendingApprovals || 0,
        leaveRequests: pendingLeaveRequests || 0,
      },
    };
  } catch (error) {
    console.error("Error fetching pending items:", error);
    // Return default values instead of throwing error
    return {
      done: true,
      data: {
        approvals: 0,
        leaveRequests: 0,
      },
    };
  }
};

// Get employee growth data
export const getEmployeeGrowth = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);

    const currentWeekStart = startOfWeek(new Date());
    const lastWeekStart = startOfWeek(subDays(new Date(), 7));
    const lastWeekEnd = endOfWeek(subDays(new Date(), 7));

    const [currentWeekCount, lastWeekCount] = await Promise.all([
      collections.employees.countDocuments({
        status: "Active",
        createdAt: { $gte: currentWeekStart },
      }),
      collections.employees.countDocuments({
        status: "Active",
        createdAt: { $gte: lastWeekStart, $lte: lastWeekEnd },
      }),
    ]);

    const percentage =
      lastWeekCount > 0
        ? Math.round(((currentWeekCount - lastWeekCount) / lastWeekCount) * 100)
        : 0;

    let trend = "stable";
    if (percentage > 0) {
      trend = "up";
    } else if (percentage < 0) {
      trend = "down";
    }

    return {
      done: true,
      data: {
        currentWeek: currentWeekCount,
        lastWeek: lastWeekCount,
        percentage: Math.abs(percentage),
        trend,
      },
    };
  } catch (error) {
    console.error("Error fetching employee growth:", error);
    return { done: false, error: error.message };
  }
};
