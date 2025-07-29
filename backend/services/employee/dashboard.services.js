
import { ObjectId } from 'mongodb';
import { getStartOfDayInTimeZone } from '../../utils/startDayTimeZone.js';
import { getTenantCollections } from '../../config/db.js';
import { getWorkingDays } from '../../utils/workingDays.js'
import { fillSalaryMonths } from '../../utils/fillMissingMonths.js';
import { DateTime } from 'luxon';

const ALLOWED_STATUSES = ["onHold", "ongoing", "completed", "pending"];


export const getEmployeeDetails = async (companyId, employeeId) => {
  try {
    const collections = getTenantCollections(companyId);
    const [employee, companyDetails] = await Promise.all([
      collections.employees.findOne({ _id: new ObjectId(employeeId) }),
      collections.details.findOne({})
    ]);
    if (!employee) {
      return { done: false, error: "Employee not found" };
    }
    if (!companyDetails || !companyDetails.timeZone) {
      return { done: false, error: "Company timezone not found" };
    }
    return {
      done: true,
      data: {
        ...employee,
        companyTimeZone: companyDetails.timeZone,
      }
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
    const currentYear = new Date().getFullYear();

    const selectedYear = Number.isInteger(Number(year))
      ? Number(year) : currentYear;

    const isCurrentYear = selectedYear === currentYear;

    const startDate = new Date(selectedYear, 0, 1);
    const endDate = isCurrentYear
      ? new Date()
      : new Date(selectedYear, 11, 31, 23, 59, 59, 999);

    const attendanceQuery = {
      employeeId: empObjectId,
      date: { $gte: startDate, $lte: endDate },
    };

    const [presentDates, counts] = await Promise.all([
      collections.attendance.distinct("date", attendanceQuery),
      collections.attendance.aggregate([
        { $match: attendanceQuery },
        {
          $facet: {
            onTime: [
              { $match: { attendanceStatus: "onTime" } },
              { $count: "count" },
            ],
            late: [
              { $match: { attendanceStatus: "late" } },
              { $count: "count" },
            ],
            wfh: [
              { $match: { mode: "workFromHome" } },
              { $count: "count" },
            ],
          },
        },
      ]).toArray(),
    ]);

    const totalWorkedDays = presentDates.length;

    const { onTime, late, wfh } = counts[0] || {};
    const onTimeCount = onTime?.[0]?.count || 0;
    const lateCount = late?.[0]?.count || 0;
    const wfhCount = wfh?.[0]?.count || 0;

    const detailsDoc = await collections.details.findOne();
    const workingDays = detailsDoc?.totalWorkingDays || 0;
    const absentCount = workingDays - totalWorkedDays;

    return {
      done: true,
      data: {
        onTime: onTimeCount,
        late: lateCount,
        workFromHome: wfhCount,
        absent: absentCount,
        workedDays: totalWorkedDays,
        workingDays: workingDays,
      },
    };
  } catch (error) {
    return { done: false, error: error.message || "Something went wrong" };
  }
};

export const getLeaveStats = async (companyId, employeeId, year) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log(year);

    if (!ObjectId.isValid(employeeId)) throw new Error("Invalid employeeId");
    const empObjectId = new ObjectId(employeeId);

    const detailsDoc = await collections.details.findOne();
    if (!detailsDoc) throw new Error("Details document not found");

    const totalLeavesAllowed = detailsDoc.totalLeavesAllowed || 0;

    const inputYear = !isNaN(parseInt(year)) ? parseInt(year) : new Date().getFullYear();

    const fromDate = new Date(`${inputYear}-01-01T00:00:00.000Z`);
    const toDate = new Date(`${inputYear}-12-31T23:59:59.999Z`);

    const allLeaves = await collections.leaves.find({
      employeeId: empObjectId,
      $or: [
        { startDate: { $gte: fromDate, $lte: toDate } },
        { endDate: { $gte: fromDate, $lte: toDate } }
      ]
    }).toArray();

    const takenLeaves = allLeaves
      .filter(l => l.status === 'approved')
      .reduce((sum, l) => sum + (l.noOfDays || 0), 0);

    const sickLeaves = allLeaves
      .filter(l => l.status === 'approved' && l.leaveType === 'sick')
      .reduce((sum, l) => sum + (l.noOfDays || 0), 0);

    const lossOfPay = allLeaves
      .filter(l => l.leaveType === 'lossOfPay' && l.status === 'approved')
      .reduce((sum, l) => sum + (l.noOfDays || 0), 0);

    const requestedLeaves = allLeaves
      .filter(l => l.status === 'pending')
      .reduce((sum, l) => sum + (l.noOfDays || 0), 0);

    return {
      done: true,
      data: {
        totalLeavesAllowed,
        takenLeaves,
        sickLeaves,
        lossOfPay,
        requestedLeaves,
      }
    };
  } catch (err) {
    console.error("Error in getLeaveStats:", err);
    return { done: false, error: err.message };
  }
};

export const addLeaveRequest = async (companyId, employeeId, leaveData) => {
  try {
    const collections = getTenantCollections(companyId);
    const empObjectId = new ObjectId(employeeId);

    const {
      empName,
      leaveType,
      startDate,
      endDate,
      reason,
      noOfDays
    } = leaveData;

    const employee = await collections.employees.findOne({ _id: empObjectId });
    if (!employee) {
      return { done: false, error: "Employee not found" };
    }

    const currentYear = new Date().getFullYear();
    const detailsDoc = await collections.details.findOne({});
    if (!detailsDoc) {
      return { done: false, error: "Leave policy details not found" };
    }

    const totalAllowedLeaves = detailsDoc.totalLeavesAllowed || 0;

    const pendingRequest = await collections.leaves.findOne({
      employeeId: empObjectId,
      status: "pending"
    });
    if (pendingRequest) {
      return {
        done: false,
        error:
          "You already have a pending leave request. Please wait until it's processed."
      };
    }

    const takenLeaves = await collections.leaves.aggregate([
      {
        $match: {
          employeeId: empObjectId,
          status: "approved",
          startDate: {
            $gte: new Date(currentYear, 0, 1),
            $lte: new Date(currentYear, 11, 31, 23, 59, 59, 999)
          },
          leaveType: { $in: ["causual", "sick"] }
        }
      },
      {
        $group: {
          _id: "$employeeId",
          total: { $sum: "$noOfDays" }
        }
      }
    ]).toArray();

    const alreadyTaken = takenLeaves[0]?.total || 0;
    const remainingDays = totalAllowedLeaves - alreadyTaken;

    const finalLeaveType = noOfDays > remainingDays ? "lossOfPay" : leaveType;

    const leaveRequest = {
      employeeId: empObjectId,
      empName,
      leaveType: finalLeaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      noOfDays,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await collections.leaves.insertOne(leaveRequest);

    return {
      done: true,
      data: {
        message: `Leave request submitted successfully as "${finalLeaveType}".`,
        remainingDays: remainingDays - noOfDays >= 0 ? remainingDays - noOfDays : 0
      }
    };

  } catch (error) {
    return { done: false, error: error.message };
  }
};

export const punchIn = async (companyId, employeeId, timestamp) => {
  try {
    const collections = getTenantCollections(companyId);

    const employee = await collections.employees.findOne({ _id: new ObjectId(employeeId) });
    if (!employee) {
      return { done: false, error: 'Employee not found in this company' };
    }

    console.log('timestamp:', timestamp, timestamp instanceof Date);

    let nowUtc;

    if (timestamp) {
      if (timestamp instanceof Date) {
        nowUtc = DateTime.fromJSDate(timestamp).toUTC();
      } else if (typeof timestamp === 'string') {
        nowUtc = DateTime.fromISO(timestamp, { zone: 'utc' });
      } else {
        return { done: false, error: 'Invalid timestamp. Must be a Date object or ISO string.' };
      }
    } else {
      nowUtc = DateTime.utc();
    }

    if (!nowUtc.isValid) {
      return { done: false, error: 'Provided timestamp is invalid.' };
    }

    console.log('nowUtc', nowUtc.toISO());

    const companyDetails = await collections.details.findOne({});
    if (!companyDetails || !companyDetails.punchInTime || !companyDetails.timeZone) {
      return { done: false, error: 'Company settings incomplete (timezone or punch-in time missing)' };
    }

    const timeZone = companyDetails.timeZone;
    const localNow = nowUtc.setZone(timeZone);
    const todayCompany = localNow.startOf('day').toUTC().toJSDate();

    const existingAttendance = await collections.attendance.findOne({
      employeeId: new ObjectId(employeeId),
      date: todayCompany,
    });

    if (existingAttendance) {
      return { done: false, error: 'Already punched in today' };
    }

    const [shiftHour, shiftMinute] = companyDetails.punchInTime.split(':').map(Number);
    const scheduledStart = localNow.set({
      hour: shiftHour,
      minute: shiftMinute,
      second: 0,
      millisecond: 0,
    });

    const lateBuffer = companyDetails.lateBufferMinutes ?? 5;
    const absentCutoff = companyDetails.absentCutoffMinutes ?? 60;

    const diffMinutes = localNow.diff(scheduledStart, 'minutes').toObject().minutes;
    console.log('diffMinutes:', diffMinutes);

    let attendanceStatus = '';

    if (diffMinutes < -15) {
      return { done: false, error: 'Cannot punch in before 15 mins of punch in time' };
    }

    if (diffMinutes <= lateBuffer) {
      attendanceStatus = 'onTime';
    } else if (diffMinutes <= absentCutoff) {
      attendanceStatus = 'late';
    } else {
      return { done: false, error: 'Punch-in window has closed. You are marked absent.' };
    }

    const insertedData = {
      employeeId: new ObjectId(employeeId),
      date: todayCompany,
      punchIn: nowUtc.toJSDate(),
      attendanceStatus,
      breakDetails: [],
      totalBreakMins: 0,
      totalProductiveHours: 0,
      lateMins: diffMinutes > 0 ? diffMinutes.toFixed(2) : 0,
      overtimeRequestStatus: "none",
      expectedOvertimeHours: 0,
    };

    const result = await collections.attendance.insertOne(insertedData);

    return {
      done: true,
      data: {
        ...insertedData,
        _id: result.insertedId,
        diffMinutes: Math.round(diffMinutes * 100) / 100,
      },
    };
  } catch (error) {
    return { done: false, error: error.message };
  }
};

export const punchOut = async (companyId, employeeId) => {
  try {
    const collections = getTenantCollections(companyId);

    const employee = await collections.employees.findOne({ _id: new ObjectId(employeeId) });
    if (!employee) return { done: false, error: 'Employee not found' };

    const companyDetails = await collections.details.findOne({});
    if (!companyDetails?.timeZone) return { done: false, error: 'Company settings incomplete' };

    const nowUtc = DateTime.utc();
    const localNow = nowUtc.setZone(companyDetails.timeZone);
    const todayCompany = localNow.startOf('day').toUTC().toJSDate();

    const attendanceRecord = await collections.attendance.findOne({
      employeeId: new ObjectId(employeeId),
      date: todayCompany
    });

    if (!attendanceRecord) return { done: false, error: 'Punch-in not found' };
    if (attendanceRecord.punchOut) return { done: false, error: 'Already punched out' };

    let expectedPunchOut;
    if (companyDetails.punchOutTime) {
      const [outHour, outMinute] = companyDetails.punchOutTime.split(':').map(Number);
      expectedPunchOut = localNow.startOf('day').set({ hour: outHour, minute: outMinute });

      if (localNow < expectedPunchOut) {
        return { done: false, error: 'Cannot punch out before scheduled time' };
      }

      if (localNow > expectedPunchOut) {
        if (attendanceRecord.overtimeRequestStatus === 'approved' && attendanceRecord.expectedOvertimeHours > 0) {
          const overtimeEnd = expectedPunchOut.plus({ hours: attendanceRecord.expectedOvertimeHours });
          if (localNow < overtimeEnd) {
            return {
              done: false,
              error: `Overtime approved but cannot punch out before ${overtimeEnd.toFormat('HH:mm')}`
            };
          }
        }
      }
    }

    const punchIn = DateTime.fromJSDate(attendanceRecord.punchIn);
    const breakDuration = attendanceRecord.totalBreakMins || 0;
    const totalProductiveDuration = Math.max(nowUtc.diff(punchIn, 'minutes').minutes - breakDuration, 0);
    const productiveHours = (totalProductiveDuration / 60).toFixed(2);

    const updateObj = {
      punchOut: nowUtc.toJSDate(),
      totalProductiveHours: productiveHours,
    };

    await collections.attendance.updateOne(
      { _id: attendanceRecord._id },
      { $set: updateObj }
    );

    return {
      done: true,
      data: {
        ...attendanceRecord,
        ...updateObj,
      }
    };

  } catch (error) {
    return { done: false, error: error.message };
  }
};

export const startBreak = async (companyId, employeeId) => {
  try {
    const collections = getTenantCollections(companyId);
    const employee = await collections.employees.findOne({ _id: new ObjectId(employeeId) });
    if (!employee) {
      return { done: false, error: "Employee not found in this company" };
    }

    const companyDetails = await collections.details.findOne({});
    const timeZone = companyDetails.timeZone;
    const nowUtc = DateTime.utc();
    const localNow = nowUtc.setZone(timeZone);
    const todayCompany = localNow.startOf('day').toUTC().toJSDate();

    const attendance = await collections.attendance.findOne({
      employeeId: new ObjectId(employeeId),
      date: todayCompany,
    });

    if (!attendance) {
      return { done: false, error: "No attendance record found. Please punch in first." };
    }

    const hasOpenBreak = attendance.breakDetails?.some(b => !b.end);
    if (hasOpenBreak) {
      return { done: false, error: "An active break is already in progress." };
    }

    const newBreak = {
      start: nowUtc,
      end: null,
    };

    await collections.attendance.updateOne(
      { _id: attendance._id },
      { $push: { breakDetails: newBreak } }
    );
    return {
      done: true,
      message: "Break Started successfully!"
    };
  } catch (error) {
    return {
      done: false,
      error: error.message,
    };
  }
};

export const resumeBreak = async (companyId, employeeId) => {
  try {
    const collections = getTenantCollections(companyId);
    const employee = await collections.employees.findOne({ _id: new ObjectId(employeeId) });
    if (!employee) {
      return { done: false, error: 'Employee not found in this company' };
    }

    const companyDetails = await collections.details.findOne({});
    const timeZone = companyDetails.timeZone;
    const nowUtc = DateTime.utc();
    const localNow = nowUtc.setZone(timeZone);
    const todayCompany = localNow.startOf('day').toUTC().toJSDate();

    const attendance = await collections.attendance.findOne({
      employeeId: new ObjectId(employeeId),
      date: todayCompany
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
          "breakDetails.$.end": localNow.toJSDate()
        }
      }
    );

    const updatedAttendance = await collections.attendance.findOne({ _id: attendance._id });
    const totalBreakMins = updatedAttendance.breakDetails.reduce((sum, br) => {
      if (br.start && br.end) {
        return sum + Math.round((new Date(br.end).getTime() - new Date(br.start).getTime()) / (1000 * 60));
      }
      return sum;
    }, 0);

    await collections.attendance.updateOne(
      { _id: attendance._id },
      { $set: { totalBreakMins } }
    );

    return {
      done: true,
      data: { totalBreakMins }
    };
  } catch (error) {
    return {
      done: false,
      error: error.message || 'Unknown error'
    };
  }
};

export const getWorkingHoursStats = async (companyId, employeeId, year) => {
  try {
    const collections = getTenantCollections(companyId);
    const empObjectId = new ObjectId(employeeId);

    // Get company timezone first
    const companyDetails = await collections.details.findOne({}, {
      projection: {
        timeZone: 1,
        totalWorkHoursPerDay: 1,
        totalWorkHoursPerWeek: 1,
        totalWorkHoursPerMonth: 1,
        totalOvertimePerMonth: 1
      }
    });

    if (!companyDetails) {
      return {
        done: false,
        error: "Company details not found"
      };
    }

    const timeZone = companyDetails.timeZone || 'UTC';
    const now = DateTime.now().setZone(timeZone);

    // Set up time periods in company timezone
    const selectedYear = !isNaN(year) && +year >= 1970 ? +year : now.year;
    const startOfYear = DateTime.fromObject({ year: selectedYear, month: 1, day: 1 }, { zone: timeZone });
    const endOfYear = startOfYear.plus({ years: 1 });

    const startOfToday = now.startOf('day');
    const endOfToday = startOfToday.plus({ days: 1 });

    const startOfWeek = now.startOf('week');
    const endOfWeek = startOfWeek.plus({ weeks: 1 });

    const startOfMonth = now.startOf('month');
    const endOfMonth = startOfMonth.plus({ months: 1 });

    const HOURS_PER_DAY = companyDetails.totalWorkHoursPerDay ?? 8;
    const HOURS_PER_WEEK = companyDetails.totalWorkHoursPerWeek ?? HOURS_PER_DAY * 5;
    const HOURS_PER_MONTH = companyDetails.totalWorkHoursPerMonth ?? HOURS_PER_WEEK * 4;
    const MAX_OVERTIME_MONTH = companyDetails.totalOvertimePerMonth ?? 5;

    const attendanceRecords = await collections.attendance.find({
      employeeId: empObjectId,
      date: {
        $gte: startOfYear.toJSDate(),
        $lt: endOfYear.toJSDate()
      }
    }).toArray();

    let todayWorked = 0;
    let todayBreak = 0;
    let weekWorked = 0;
    let weekBreak = 0;
    let weekDays = 0;
    let monthWorked = 0;
    let monthDays = 0;

    for (const rec of attendanceRecords) {
      const recordDate = DateTime.fromJSDate(rec.date).setZone(timeZone);
      const work = rec.totalProductiveDuration || 0;
      const brk = rec.totalBreakMins || 0;

      // Today's stats
      if (recordDate >= startOfToday && recordDate < endOfToday) {
        todayWorked += work;
        todayBreak += brk;
      }

      // Weekly stats
      if (recordDate >= startOfWeek && recordDate < endOfWeek) {
        weekWorked += work;
        weekBreak += brk;
        weekDays++;
      }

      // Monthly stats
      if (recordDate >= startOfMonth && recordDate < endOfMonth) {
        monthWorked += work;
        monthDays++;
      }
    }
    const stats = {
      today: {
        expectedHours: HOURS_PER_DAY,
        workedHours: +(todayWorked / 60).toFixed(2),
        breakHours: +(todayBreak / 60).toFixed(2),
        overtimeHours: +(Math.max(0, (todayWorked / 60) - HOURS_PER_DAY)).toFixed(2)
      },
      thisWeek: {
        expectedHours: weekDays * HOURS_PER_DAY,
        workedHours: +(weekWorked / 60).toFixed(2)
      },
      thisMonth: {
        expectedHours: monthDays * HOURS_PER_DAY,
        workedHours: +(monthWorked / 60).toFixed(2),
        overtimeHours: +(Math.max(0, (monthWorked / 60) - (monthDays * HOURS_PER_DAY))).toFixed(2),
        expectedOvertimeHours: MAX_OVERTIME_MONTH
      }
    };

    return {
      done: true,
      data: stats
    };

  } catch (error) {
    return {
      done: false,
      error: error.message
    };
  }
};

export const getProjects = async (companyId, employeeId, filter) => {
  try {
    const collections = getTenantCollections(companyId);
    const empObjectId = new ObjectId(employeeId);

    const matchStage = {
      $match: {
        empMembers: empObjectId
      }
    };

    if (filter === 'ongoing') {
      matchStage.$match.status = 'ongoing';
    }

    const pipeline = [
      matchStage,
      {
        $lookup: {
          from: "leads",
          let: { leadIdStr: "$leadId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", { $toObjectId: "$$leadIdStr" }]
                }
              }
            }
          ],
          as: "leadDetails"
        }
      },
      {
        $lookup: {
          from: 'employees',
          let: { memberIds: '$empMembers' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$_id', '$$memberIds']
                }
              }
            },
            {
              $project: {
                _id: 0,
                avatar: 1
              }
            }
          ],
          as: 'membersInfo'
        }
      },
      {
        $lookup: {
          from: 'tasks',
          localField: '_id',
          foreignField: 'projectId',
          as: 'taskStats'
        }
      },
      {
        $addFields: {
          totalTasks: { $size: '$taskStats' },
          completedTasks: {
            $size: {
              $filter: {
                input: '$taskStats',
                as: 'task',
                cond: { $eq: ['$$task.status', 'completed'] }
              }
            }
          },
          membersAvatars: {
            $map: {
              input: '$membersInfo',
              as: 'member',
              in: '$$member.avatar'
            }
          }
        }
      },
      {
        $project: {
          projectId: { $toString: '$_id' },
          projectTitle: '$title',
          dueDate: 1,
          totalTasks: 1,
          completedTasks: 1,
          projectLeadAvatar: 1,
          leadName: 1,
          membersAvatars: '$membersAvatars.avatar'
        }
      }
    ];

    const projects = await collections.projects.aggregate(pipeline).toArray();

    return {
      done: true,
      data: projects
    };
  } catch (error) {
    console.error('Error in getProjects:', error);
    return { done: false, error: error.message };
  }
};

export const getTasks = async (companyId, employeeId, filter) => {
  try {
    const collections = getTenantCollections(companyId);
    const empObjectId = new ObjectId(employeeId);

    const employee = await collections.employees.findOne({ _id: empObjectId });
    if (!employee) {
      return { done: false, error: 'Employee not found in this company.' };
    }

    const projectResult = await getProjects(companyId, employeeId, filter);
    const projectIds = Array.isArray(projectResult?.data)
      ? projectResult.data.map(p => p._id)
      : [];

    const matchQuery = {
      empIds: { $in: [empObjectId] }
    };
    if (projectIds.length > 0) {
      matchQuery.projectId = { $in: projectIds };
    }
    if (filter && filter.toLowerCase() === 'ongoing') {
      matchQuery.status = 'ongoing';
    }

    const pipeline = [
      { $match: matchQuery },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'employees',
          let: { emp_ids: '$empIds' },
          pipeline: [
            { $match: { $expr: { $in: ['$_id', '$$emp_ids'] } } },
            { $project: { _id: 1, avatar: 1 } }
          ],
          as: 'avatars'
        }
      }
    ];
    const tasksWithAvatars = await collections.tasks.aggregate(pipeline).toArray();
    return {
      done: true,
      data: tasksWithAvatars
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
    const empObjectId = new ObjectId(employeeId);

    const employee = await collections.employees.findOne({ _id: empObjectId });
    if (!employee) {
      return { done: false, error: 'Employee not found in this company.' };
    }

    if (!taskData.projectId) {
      return { done: false, error: 'Project ID is required.' };
    }

    const project = await collections.projects.findOne({
      _id: new ObjectId(taskData.projectId),
      empMembers: { $in: [empObjectId] }
    });

    if (!project) {
      return { done: false, error: 'Project not found or employee not in project team.' };
    }

    const newTask = {
      title: taskData.title,
      description: taskData.description || '',
      empIds: [empObjectId],
      projectId: new ObjectId(taskData.projectId),
      status: taskData.status || 'pending',
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      checked: taskData.checked ?? false,
      starred: taskData.starred ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await collections.tasks.insertOne(newTask);
    if (result.insertedId) {
      return { done: true, message: "Task created successfully.", data: { ...newTask } };
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
    const empObjectId = new ObjectId(employeeId);

    const { taskId, updateData } = taskData;
    const taskObjectId = new ObjectId(taskId);

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

export const getPerformance = async (companyId, employeeId, year) => {
  try {
    const collections = getTenantCollections(companyId);
    const empObjectId = new ObjectId(employeeId);

    const employee = await collections.employees.findOne({ _id: empObjectId });
    if (!employee) {
      return {
        done: false,
        error: 'Employee not found in this company.'
      };
    }

    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
    const salaryHistory = await collections.salaryHistory
      .find({
        empId: empObjectId,
        effectiveDate: { $lte: endOfYear }
      })
      .sort({ effectiveDate: 1 })
      .toArray();

    const formatted = fillSalaryMonths(salaryHistory, year);
    return {
      done: true,
      data: formatted
    };
  } catch (error) {
    return {
      done: false,
      error: error.message || 'Unexpected error'
    };
  }
};

export const getSkills = async (companyId, employeeId, year) => {
  try {
    const collections = getTenantCollections(companyId);
    const empObjectId = new ObjectId(employeeId);

    const employee = await collections.employees.findOne({ _id: empObjectId });
    if (!employee) {
      return { done: false, error: 'Employee not found in this company.' };
    }

    const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);

    const skills = await collections.skills.find({
      employeeId: empObjectId,
      updatedAt: {
        $gte: startOfYear,
        $lte: endOfYear
      }
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
    const empObjectId = new ObjectId(employeeId);
    const employee = await collections.employees.findOne({ _id: empObjectId });
    if (!employee) {
      return { done: false, error: 'Employee not found in this company.' };
    }
    const pipeline = [
      { $match: { leadId: employee.leadId } },
      {
        $project: {
          _id: 1,
          name: 1,
          avatar: 1,
          role: 1
        }
      }
    ];
    const teamMembers = await collections.employees.aggregate(pipeline).toArray();
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
    const empObjectId = new ObjectId(employeeId);

    const employee = await collections.employees.findOne({ _id: empObjectId });
    if (!employee) {
      return { done: false, error: 'Employee not found in this company.' };
    }

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const notifications = await collections.notifications.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $lookup: {
          from: 'employees',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'creator'
        }
      },
      {
        $unwind: {
          path: '$creator',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          createdAt: {
            $dateToString: {
              format: "%I:%M %p",
              date: "$createdAt",
              timezone: "Asia/Kolkata"
            }
          },
          avatar: "$creator.avatar"
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]).toArray();

    return {
      done: true,
      data: notifications
    };
  } catch (error) {
    console.error('Error fetching todays notifications:', error);
    return { done: false, error: error.message };
  }
};

export const getMeetings = async (companyId, employeeId, filter) => {
  try {
    const collections = getTenantCollections(companyId);
    const empObjectId = new ObjectId(employeeId);

    const employee = await collections.employees.findOne({ _id: empObjectId });
    if (!employee) {
      return { done: false, error: 'Employee not found in this company.' };
    }

    const now = new Date();
    let startDate, endDate;

    if (filter === "today") {
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
      endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    } else if (filter === "month") {
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    } else if (filter === "year") {
      startDate = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59, 999));
    } else {
      return { done: false, error: "Invalid filter" };
    }

    const employeeLeadId = String(employee.leadId);

    const meetings = await collections.meetings.find({
      leadId: employeeLeadId,
      startTime: { $gte: startDate, $lte: endDate }
    }).toArray();

    return {
      done: true,
      data: meetings
    };
  } catch (error) {
    return { done: false, error: error.message };
  }
};

export const getTodaysBirthday = async (companyId, employeeId) => {
  try {
    const collections = getTenantCollections(companyId);

    const now = new Date();
    const todayDate = now.getDate();
    const todayMonth = now.getMonth();

    const { done, data: teamMembers } = await getTeamMembers(companyId, employeeId);

    if (!done || !Array.isArray(teamMembers) || teamMembers.length === 0) {
      return { done: true, data: [] };
    }

    const teamMemberIds = teamMembers.map(member => new ObjectId(member._id));

    const birthdayEmployees = await collections.employees.aggregate([
      {
        $match: {
          _id: { $in: teamMemberIds },
          dob: { $type: 'date' }
        }
      },
      {
        $addFields: {
          dobDay: { $dayOfMonth: '$dob' },
          dobMonth: { $month: '$dob' }
        }
      },
      {
        $match: {
          dobDay: todayDate,
          dobMonth: todayMonth + 1
        }
      },
      {
        $project: {
          name: 1,
          avatarUrl: 1,
          role: 1
        }
      },
      {
        $sort: {
          name: 1
        }
      }
    ]).toArray();

    return {
      done: true,
      data: birthdayEmployees
    };
  } catch (error) {
    return {
      done: false,
      error: error.message
    };
  }
};

export const getLastDayTimmings = async (companyId, employeeId) => {
  try {
    const collections = getTenantCollections(companyId);
    const empId = new ObjectId(employeeId);

    const timezoneDoc = await collections.details.findOne({});
    const tz = (timezoneDoc && timezoneDoc.timeZone) || 'UTC';

    const employee = await collections.employees.findOne({ _id: empId });
    if (!employee) return { done: false, error: 'Employee not found in this company.' };

    const attendance = await collections.attendance
      .find({ employeeId: empId })
      .sort({ punchIn: -1 })
      .limit(1)
      .next();

    if (!attendance || !attendance.punchIn)
      return { done: false, error: 'No valid attendance record found.' };

    const punchInDT = DateTime.fromJSDate(attendance.punchIn).setZone(tz);
    const punchOutDT = attendance.punchOut
      ? DateTime.fromJSDate(attendance.punchOut).setZone(tz)
      : null;

    const breakDetails = (attendance.breakDetails || [])
      .filter(b => b.start && b.end)
      .map(b => ({
        start: DateTime.fromJSDate(b.start).setZone(tz).toFormat('HH:mm'),
        end: DateTime.fromJSDate(b.end).setZone(tz).toFormat('HH:mm'),
      }));

    if (punchOutDT && attendance.overtimeRequestStatus === 'approved' && attendance.overtimeHours > 0) {
      const shiftEnd = punchOutDT.minus({ hours: attendance.overtimeHours }).toFormat('HH:mm');
      const overtimeStart = shiftEnd;

      return {
        done: true,
        data: {
          punchInTime: punchInDT.toFormat('HH:mm'),
          breakDetails,
          shiftEnd,
          overtimeStart,
          punchOut: punchOutDT.toFormat('HH:mm'),
        }
      };
    } else {
      return {
        done: true,
        data: {
          punchInTime: punchInDT.toFormat('HH:mm'),
          breakDetails,
          punchOut: punchOutDT ? punchOutDT.toFormat('HH:mm') : '',
        }
      };
    }
  } catch (error) {
    return { done: false, error: error.message || 'Internal server error' };
  }
};
