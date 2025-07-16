
import { ObjectId } from 'mongodb';
import { getStartOfDay } from '../../utils/startDay.js';
import { getTenantCollections } from '../../utils/';
import { getStartAndEndOfPeriod } from '../../utils/startEndPeriod.js';

const ALLOWED_STATUSES = ["onHold", "inprogress", "completed", "pending"];

export const getEmployeeDetails = async (companyId, employeeId) => {
  try {
    const collections = getTenantCollections(companyId);
    const employee = await collections.employees.findOne(new ObjectId(employeeId));

    if (!employee) {
      return { done: false, error: "Employee not found" };
    }

    return {
      done: true,
      data: employee,
    };
  } catch (error) {
    console.error("Error fetching employee details:", error);
    return { done: false, error: error.message };
  }
};

export const getAttendanceStats = async (companyId, employeeId, year) => {
  try {
    const collections = getTenantCollections(companyId);
    const empObjectId = new ObjectId(employeeId);

    const startDate = new Date(year, 0, 1, 0, 0, 0, 0);
    const endDate = new Date(year + 1, 0, 1, 0, 0, 0, 0);
    endDate.setMilliseconds(endDate.getMilliseconds() - 1);

    const pipeline = [
      {
        $match: {
          empObjectId,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ];

    const stats = await collections.attendance.aggregate(pipeline).toArray();

    const result = {
      onTime: 0,
      late: 0,
      workFromHome: 0,
      absent: 0,
    };

    stats.forEach((item) => {
      switch (item._id) {
        case "On Time":
          result.onTime = item.count;
          break;
        case "Late Attendance":
          result.late = item.count;
          break;
        case "Work From Home":
          result.workFromHome = item.count;
          break;
        case "Absent":
          result.absent = item.count;
          break;
      }
    });

    return {
      done: true,
      data: {
        onTime: result.onTime,
        late: result.late,
        workFromHome: result.workFromHome,
        absent: result.absent,
      },
    };
  } catch (error) {
    console.error("Error fetching leave details stats:", error);
    return { done: false, error: error.message };
  }
};

export const getLeaveStats = async (companyId, employeeId, year) => {
  try {
    const collections = getTenantCollections(companyId);
    const empObjectId = new ObjectId(employeeId);

    const startDate = new Date(year, 0, 1, 0, 0, 0, 0);
    const endDate = new Date(year + 1, 0, 1, 0, 0, 0, 0);
    endDate.setMilliseconds(endDate.getMilliseconds() - 1);

    const detailsDoc = await collections.details.findOne({
      year: year
    });

    const totalLeaves = detailsDoc?.totalAllowedLeaves || 0;
    const totalWorkingDays = detailsDoc?.totalWorkingDays || 0;

    const leaveBalances = await collections.leaveBalance.find({ empObjectId }).toArray();
    const takenLeaves = leaveBalances.reduce((sum, lb) => sum + (lb.taken || 0), 0);

    const pendingRequests = await collections.leaves.countDocuments({
      empObjectId,
      status: "Requested",
      startDate: { $gte: startDate, $lte: endDate }
    });

    const sickLeaves = await collections.leaves.countDocuments({
      empObjectId,
      status: "Approved",
      leaveType: "Sick",
      startDate: { $gte: startDate, $lte: endDate }
    });

    const lossOfPay = await collections.leaves.countDocuments({
      empObjectId,
      status: "Approved",
      leaveType: "Loss of Pay",
      startDate: { $gte: startDate, $lte: endDate }
    });

    return {
      done: true,
      data: {
        totalLeaves,
        taken: takenLeaves,
        request: pendingRequests,
        totalWorkingDays,
        sickLeaves,
        lossOfPay
      }
    };
  } catch (error) {
    console.error("Error fetching leave details:", error);
    return { done: false, error: error.message };
  }
};

export const addLeaveRequest = async (companyId, employeeId, leaveData) => {
  try {
    const collections = getTenantCollections(companyId)
    const empObjectId = new ObjectId(employeeId);
    const {
      empName,
      leaveType,
      startDate,
      endDate,
      reason,
      noOfDays,
      year
    } = leaveData;

    const employee = await collections.employees.findOne({ _id: empObjectId });
    if (!employee) {
      return { done: false, error: "Employee not found" };
    }

    const detailsDoc = await collections.details.findOne({ year: year });
    if (!detailsDoc) {
      return { done: false, error: "Leave policy details not found for this year" };
    }
    const totalAllowedLeaves = detailsDoc.totalAllowedLeaves || 0;

    const pendingRequest = await collections.leaves.findOne({
      employeeId: empId,
      status: "Requested"
    });
    if (pendingRequest) {
      return { done: false, error: "You already have a pending leave request. Please wait until it is processed before applying for a new leave." };
    }

    const takenLeaves = await collections.leaves.aggregate([
      {
        $match: {
          employeeId: empObjectId,
          status: { $in: ["Approved"] },
          startDate: {
            $gte: new Date(year, 0, 1),
            $lte: new Date(year, 11, 31, 23, 59, 59, 999)
          }
        }
      },
      {
        $group: {
          _id: "$empId",
          total: { $sum: "$noOfDays" }
        }
      }
    ]).toArray();
    const alreadyTaken = takenLeaves[0]?.total || 0;

    const remainingDays = totalAllowedLeaves - alreadyTaken;
    if (noOfDays > remainingDays) {
      return { done: false, error: "Insufficient leave balance", remainingDays };
    }

    const leaveRequest = {
      employeeId: empObjectId,
      empName: empName,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      noOfDays,
      status: "Requested",
      createdAt: new Date()
    };

    await collections.leaves.insertOne(leaveRequest);

    return {
      done: true,
      data: {
        message: "Leave request submitted successfully.",
        remainingDays: remainingDays - noOfDays
      }
    };
  } catch (error) {
    console.error("Error adding leave request:", error);
    return { done: false, error: error.message };
  }
};

export const punchIn = async ({ companyId, employeeId }) => {
  try {
    const collections = getTenantCollections(companyId);

    const employee = await collections.employees.findOne({ _id: new ObjectId(employeeId) });
    if (!employee) {
      return { done: false, error: 'Employee not found in this company' };
    }

    const now = new Date();
    const today = getStartOfDay(now);

    const existingAttendance = await collections.attendance.findOne({
      employeeId: new ObjectId(employeeId),
      date: today,
    });

    if (existingAttendance) {
      return { done: false, error: 'Already punched in today' };
    }

    const companyDetails = await collections.details.findOne({});
    if (!companyDetails || !companyDetails.workDayStart) {
      return { done: false, error: 'Company work day start not configured' };
    }

    const [shiftHour, shiftMinute] = companyDetails.workDayStart.split(':').map(Number);
    const scheduledStart = new Date(now);
    scheduledStart.setHours(shiftHour, shiftMinute, 0, 0);

    const LATE_BUFFER_MINUTES = companyDetails.lateBufferMinutes ?? 5;
    const ABSENT_CUTOFF_MINUTES = companyDetails.absentCutoffMinutes ?? 60;

    const diffMs = now.getTime() - scheduledStart.getTime();
    const diffMinutes = diffMs / 60000; // convert to minutes

    let attendanceStatus = '';

    if (diffMinutes <= 0) {
      attendanceStatus = 'onTime';
    } else if (diffMinutes <= LATE_BUFFER_MINUTES) {
      attendanceStatus = 'onTime'; // within grace period
    } else if (diffMinutes <= ABSENT_CUTOFF_MINUTES) {
      attendanceStatus = 'late';
    } else {
      return { done: false, error: 'Punch-in window has closed. You are marked absent.' };
    }

    const attendanceData = {
      employeeId: new ObjectId(employeeId),
      date: today,
      punchIn: now,
      attendanceStatus,
      breakDetails: [],
      totalBreakDuration: 0,
      totalWorkDuration: 0,
    };

    const result = await collections.attendance.insertOne(attendanceData);

    return {
      done: true,
      data: { ...attendanceData, _id: result.insertedId },
    };

  } catch (error) {
    return { done: false, error: error.message };
  }
};

export const punchOut = async ({ companyId, employeeId }) => {
  try {
    const collections = getTenantCollections(companyId);

    const employee = await collections.employees.findOne({ _id: new ObjectId(employeeId) });
    if (!employee) {
      return { done: false, error: 'Employee not found in this company' };
    }

    const now = new Date();
    const today = getStartOfDay(now);

    const attendanceRecord = await collections.attendance.findOne({
      employeeId: new ObjectId(employeeId),
      date: today
    });

    if (!attendanceRecord) {
      return { done: false, error: 'Punch-in not found for today. Please punch in first.' };
    }

    if (attendanceRecord.punchOut) {
      return { done: false, error: 'You have already punched out.' };
    }

    const punchIn = new Date(attendanceRecord.punchIn);
    const breakDuration = attendanceRecord.totalBreakDuration || 0;

    const totalWorkDuration = Math.max(
      (now.getTime() - punchIn.getTime()) / (1000 * 60) - breakDuration,
      0
    );

    const updateObj = {
      punchOut: now,
      totalWorkDuration: parseFloat(totalWorkDuration.toFixed(2))
    };

    await collections.attendance.updateOne(
      { _id: attendanceRecord._id },
      { $set: updateObj }
    );

    return {
      done: true,
      data: {
        ...attendanceRecord,
        ...updateObj
      }
    };

  } catch (error) {
    return { done: false, error: error.message };
  }
};

export const breakStart = async ({ companyId, employeeId }) => {
  try {
    const collections = getTenantCollections(companyId);

    const employee = await collections.employees.findOne({ _id: new ObjectId(employeeId) });
    if (!employee) {
      return { done: false, error: 'Employee not found in this company' };
    }

    const now = new Date();
    const today = getStartOfDay(now);

    const attendance = await collections.attendance.findOne({
      employeeId: new ObjectId(employeeId),
      date: today
    });

    if (!attendance) {
      return { done: false, error: 'No attendance record for today. Please punch in first.' };
    }

    const breakDetails = attendance.breakDetails || [];

    if (breakDetails.length > 0 && !breakDetails[breakDetails.length - 1].end) {
      return {
        done: false,
        error: 'A break is already active. Please end the current break before starting a new one.'
      };
    }

    breakDetails.push({ start: now, end: null });

    await collections.attendance.updateOne(
      { _id: attendance._id },
      { $set: { breakDetails } }
    );

    return { done: true, data: { breakDetails } };
  } catch (error) {
    return { done: false, error: error.message };
  }
};

export const resumeBreak = async ({ companyId, employeeId }) => {
  try {
    const collections = getTenantCollections(companyId);

    const employee = await collections.employees.findOne({ _id: new ObjectId(employeeId) });
    if (!employee) {
      return { done: false, error: 'Employee not found in this company' };
    }

    const now = new Date();
    const today = getStartOfDay(now);

    const attendance = await collections.attendance.findOne({
      employeeId: new ObjectId(employeeId),
      date: today
    });

    if (!attendance) {
      return { done: false, error: 'No attendance record found. Please punch in first.' };
    }

    const hasOpenBreak = attendance.breakDetails?.some(b => !b.end);
    if (!hasOpenBreak) {
      return { done: false, error: 'No active break found to resume.' };
    }

    await collections.attendance.updateOne(
      {
        _id: attendance._id,
        "breakDetails.end": null
      },
      {
        $set: {
          "breakDetails.$.end": now
        }
      }
    );

    const updatedAttendance = await collections.attendance.findOne({ _id: attendance._id });

    const totalBreakDuration = updatedAttendance.breakDetails.reduce((sum, br) => {
      if (br.start && br.end) {
        return sum + Math.round((new Date(br.end) - new Date(br.start)) / (1000 * 60));
      }
      return sum;
    }, 0);

    await collections.attendance.updateOne(
      { _id: attendance._id },
      { $set: { totalBreakDuration } }
    );

    return {
      done: true,
      data: { totalBreakDuration }
    };

  } catch (error) {
    return {
      done: false,
      error: error.message
    };
  }
};

export const getWorkingHoursByPeriod = async (
  companyId,
  employeeId,
  duration,
) => {
  try {
    const collections = getTenantCollections(companyId);
    const { startDate, endDate, periodType } = duration

    const result = await collections.attendance.aggregate([
      {
        $match: {
          employeeId: new ObjectId(employeeId),
          date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        }
      },
      {
        $group: {
          _id: null,
          totalMinutes: { $sum: '$totalWorkDuration' }
        }
      }
    ]).toArray();

    const totalWorkMinutes = result[0]?.totalMinutes || 0;

    const companyDetails = await collections.details.findOne({});
    if (!companyDetails) {
      return { done: false, error: 'Company configuration not found.' };
    }

    let expectedHours = 0;

    switch (periodType) {
      case 'thisWeek':
      case 'lastWeek':
        expectedHours = companyDetails.totalWorkHoursPerWeek ?? 40;
        break;
      case 'thisMonth':
      case 'lastMonth':
        expectedHours = companyDetails.totalWorkHoursPerMonth ?? 160;
        break;
      default:
        expectedHours = 0;
    }

    const expectedWorkMinutes = expectedHours * 60;

    return {
      done: true,
      data: {
        totalWorkMinutes,
        totalWorkHours: parseFloat((totalWorkMinutes / 60).toFixed(2)),
        expectedWorkMinutes,
        expectedWorkHours: expectedHours,
      }
    };

  } catch (error) {
    return {
      done: false,
      error: error.message
    };
  }
};

export const getProjects = async (companyId, empId, filter) => {
  try {
    const collections = getTenantCollections(companyId);
    const empObjectId = ObjectId(empId);

    const employee = await collections.employees.findOne({ _id: empObjectId });
    if (!employee) {
      return { done: false, error: "Employee not found in this company" };
    }

    const query = { empMembers: { $in: [empObjectId] } };
    if (filter && filter.toLowerCase() === 'ongoing') {
      query.status = 'ongoing';
    }

    const projects = await collections.projects.find(query).toArray();

    const enrichedProjects = await Promise.all(
      projects.map(async (project) => {
        const [taskStats] = await collections.tasks.aggregate([
          {
            $match: {
              projectId: project._id,
              empIds: { $in: [empObjectId] }
            }
          },
          {
            $group: {
              _id: null,
              totalTasks: { $sum: 1 },
              completedTasks: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
                }
              }
            }
          }
        ]).toArray();

        return {
          ...project,
          totalTasks: taskStats?.totalTasks || 0,
          completedTasks: taskStats?.completedTasks || 0,
        };
      })
    );

    return { done: true, data: enrichedProjects };
  } catch (error) {
    return { done: false, error: error.message };
  }
};

export const getTasks = async ({ companyId, employeeId, filter }) => {
  try {
    const collections = getTenantCollections(companyId);
    const empObjectId = ObjectId(employeeId);

    const employee = await collections.employees.findOne({ _id: empObjectId });
    if (!employee) {
      return { done: false, error: 'Employee not found in this company.' };
    }

    const projectResult = await getProjects({ companyId, employeeId, filter });
    const projectIds = Array.isArray(projectResult?.data)
      ? projectResult.data.map(p => p._id)
      : [];

    const query = {
      empIds: { $in: [empObjectId] },
      ...(projectIds.length > 0 && { projectId: { $in: projectIds } })
    };

    const taskList = await collections.tasks.find(query).sort({ createdAt: -1 }).toArray();

    return {
      done: true,
      data: taskList
    };
  } catch (error) {
    return {
      done: false,
      error: error.message
    };
  }
};

export const addTask = async ({ companyId, employeeId, taskData }) => {
  try {
    const collections = getTenantCollections(companyId);
    const empObjectId = ObjectId(employeeId);

    const employee = await collections.employees.findOne({ _id: empObjectId });
    if (!employee) {
      return { done: false, error: 'Employee not found in this company.' };
    }

    if (!taskData.projectId) {
      return { done: false, error: 'Project ID is required.' };
    }

    const project = await collections.projects.findOne({
      _id: ObjectId(taskData.projectId),
      empMembers: { $in: [empObjectId] }
    });

    if (!project) {
      return { done: false, error: 'Project not found or employee not in project team.' };
    }

    const newTask = {
      title: taskData.title,
      description: taskData.description || '',
      empIds: [empObjectId],
      projectId: ObjectId(taskData.projectId),
      status: taskData.status || 'pending',
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      checked: taskData.checked ?? false,
      starred: taskData.starred ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collections.tasks.insertOne(newTask);

    if (result.insertedId) {
      return { done: true, data: { ...newTask, _id: result.insertedId } };
    } else {
      return { done: false, error: 'Failed to create task.' };
    }

  } catch (error) {
    return { done: false, error: error.message };
  }
};

export const updateTask = async ({ companyId, employeeId, taskData }) => {
  try {
    const collections = getTenantCollections(companyId);
    const empObjectId = ObjectId(employeeId);

    const { taskId, updateData } = taskData;
    const taskObjectId = ObjectId(taskId);

    const employee = await collections.employees.findOne({ _id: empObjectId });
    if (!employee) {
      return { done: false, error: 'Employee not found in this company.' };
    }

    const task = await collections.tasks.findOne({
      _id: taskObjectId,
      empIds: { $in: [empObjectId] },
    });
    if (!task) {
      return { done: false, error: 'Task not found or not assigned to this employee.' };
    }

    const allowedUpdates = {};
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

    allowedUpdates.updatedAt = new Date();

    const result = await collections.tasks.updateOne(
      { _id: taskObjectId },
      { $set: allowedUpdates }
    );

    if (result.modifiedCount > 0) {
      return { done: true, data: 'Task updated successfully.' };
    } else {
      return { done: false, error: 'No changes made to the task.' };
    }
  } catch (error) {
    return { done: false, error: error.message };
  }
};

export const getMonthlySalaryForYear = async (companyId, employeeId, year) => {
  try {
    const collections = getTenantCollections(companyId);
    const empObjectId = ObjectId(employeeId);

    const employee = await collections.employees.findOne({ _id: empObjectId });
    if (!employee) {
      return { done: false, error: 'Employee not found in this company.' };
    }

    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
    const salaryHistory = await collections.salaryHistory
      .find({ empId: empId, effectiveDate: { $lte: endOfYear } })
      .sort({ effectiveDate: 1 })
      .toArray();

    const monthlySalaries = [];
    for (let month = 0; month < 12; month++) {
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
      const record = [...salaryHistory].reverse().find(r => r.effectiveDate <= endOfMonth);
      monthlySalaries.push({
        month: month + 1,
        salary: record ? record.salary : 0
      });
    }

    return {
      done: true,
      data: monthlySalaries
    };
  } catch (error) {
    console.error('Error fetching monthly salary data:', error);
    return { done: false, error: error.message };
  }
};

export const getSkillsByYear = async (companyId, employeeId, year) => {
  try {
    const collections = getTenantCollections(companyId);
    const empObjectId = ObjectId(employeeId);

    const employee = await collections.employees.findOne({ _id: empObjectId });
    if (!employee) {
      return { done: false, error: 'Employee not found in this company.' };
    }

    const skills = await collections.skills.find({
      empId: empId,
      year: year
    }).toArray();

    return {
      done: true,
      data: skills
    };
  } catch (error) {
    console.error('Error fetching skills:', error);
    return { done: false, error: error.message };
  }
};

export const getTeamMembers = async (companyId, employeeId) => {
  try {
    const collections = getTenantCollections(companyId);
    const empObjectId = ObjectId(employeeId);

    const employee = await collections.employees.findOne({ _id: empObjectId });
    if (!employee) {
      return { done: false, error: 'Employee not found in this company.' };
    }

    const teamMembers = await collections.employees.find({ leadId: employee.leadId }).toArray();
    return {
      done: true,
      data: teamMembers
    };
  } catch (error) {
    console.error('Error fetching team members:', error);
    return { done: false, error: error.message };
  }
};

export const getTodaysNotifications = async (companyId, employeeId) => {
  try {
    const collections = getTenantCollections(companyId);
    const empObjectId = ObjectId(employeeId);

    const employee = await collections.employees.findOne({ _id: empObjectId });
    if (!employee) {
      return { done: false, error: 'Employee not found in this company.' };
    }

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const notifications = await collections.notifications.find({
      empId: empId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).toArray();

    return {
      done: true,
      data: notifications
    };
  } catch (error) {
    console.error('Error fetching today\'s notifications:', error);
    return { done: false, error: error.message };
  }
};

export const getMeetings = async (companyId, employeeId, tag) => {
  try {
    const collections = getTenantCollections(companyId);
    const empObjectId = ObjectId(employeeId);

    const employee = await collections.employees.findOne({ _id: empObjectId });
    if (!employee) {
      return { done: false, error: 'Employee not found in this company.' };
    }
    let startDate, endDate;
    const now = new Date();

    if (tag === "today") {

      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    } else if (tag === "this month") {
    
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    } else if (tag === "this year") {
     
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    
    } else {
      
      return { done: false, error: "Invalid tag" };
    }

    const meetings = await collections.meetings.find({
      empId: empId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).toArray();

    return {
      done: true,
      data: meetings
    };
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return { done: false, error: error.message };
  }
};

// event-driven trigger for absent
