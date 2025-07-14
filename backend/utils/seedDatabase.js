import { connectDB, getTenantCollections } from "../config/db.js";
import { ObjectId } from "mongodb";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mockDataPath = path.join(__dirname, "../data/mockData.json");
const mockData = JSON.parse(fs.readFileSync(mockDataPath, "utf8"));

// Function to convert employee IDs to ObjectIds and create mapping
const createEmployeeMapping = (employees) => {
  const employeeMapping = {};
  const processedEmployees = employees.map((employee) => {
    const employeeId = new ObjectId();
    employeeMapping[employee.employeeId] = employeeId;
    return {
      ...employee,
      _id: employeeId,
      createdAt: new Date(employee.createdAt),
      dateOfBirth: new Date(employee.dateOfBirth),
      updatedAt: new Date(employee.createdAt),
      isDeleted: false,
    };
  });
  return { processedEmployees, employeeMapping };
};

// Function to create client mapping
const createClientMapping = (clients) => {
  const clientMapping = {};
  const processedClients = clients.map((client) => {
    const clientId = new ObjectId();
    const clientKey = client.company.toLowerCase().replace(/\s+/g, "_");
    clientMapping[clientKey] = clientId;
    return {
      ...client,
      _id: clientId,
      createdAt: new Date(client.createdAt),
      updatedAt: new Date(client.createdAt),
      isDeleted: false,
    };
  });
  return { processedClients, clientMapping };
};

// Function to process projects with proper ObjectId references
const processProjects = (projects, employeeMapping, clientMapping) => {
  return projects.map((project) => ({
    ...project,
    _id: new ObjectId(),
    teamMembers: project.teamMembers.map((empId) => employeeMapping[empId]),
    clientId: clientMapping[project.clientId],
    createdAt: new Date(project.createdAt),
    updatedAt: new Date(project.createdAt),
    deadline: new Date(project.deadline),
    isDeleted: false,
  }));
};

// Function to process tasks with proper ObjectId references
const processTasks = (tasks, employeeMapping) => {
  return tasks.map((task) => ({
    ...task,
    _id: new ObjectId(),
    assignedTo: employeeMapping[task.assignedTo],
    projectId: new ObjectId(),
    createdAt: new Date(task.createdAt),
    updatedAt: new Date(task.createdAt),
    isDeleted: false,
  }));
};

// Function to process attendance with proper ObjectId references
const processAttendance = (attendance, employeeMapping) => {
  return attendance.map((record) => ({
    ...record,
    _id: new ObjectId(),
    employeeId: employeeMapping[record.employeeId],
    date: new Date(record.date),
    clockIn: record.clockIn ? new Date(record.clockIn) : null,
    clockOut: record.clockOut ? new Date(record.clockOut) : null,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.createdAt),
  }));
};

// Function to process invoices with proper ObjectId references
const processInvoices = (invoices, clientMapping) => {
  return invoices.map((invoice) => ({
    ...invoice,
    _id: new ObjectId(),
    clientId: clientMapping[invoice.clientId],
    createdAt: new Date(invoice.createdAt),
    updatedAt: new Date(invoice.createdAt),
    isDeleted: false,
  }));
};

// Function to process activities with proper ObjectId references
const processActivities = (activities, employeeMapping) => {
  return activities.map((activity) => ({
    ...activity,
    _id: new ObjectId(),
    employeeId: employeeMapping[activity.employeeId],
    createdAt: new Date(activity.createdAt),
    updatedAt: new Date(activity.createdAt),
  }));
};

// Function to process todos with proper ObjectId references
const processTodos = (todos, employeeMapping) => {
  return todos.map((todo) => ({
    ...todo,
    _id: new ObjectId(),
    userId: employeeMapping[todo.userId]
      ? employeeMapping[todo.userId].toString()
      : todo.userId,
    createdAt: new Date(todo.createdAt),
    updatedAt: new Date(todo.createdAt),
    isDeleted: false,
  }));
};

// Function to process schedules with proper ObjectId references
const processSchedules = (schedules, employeeMapping) => {
  return schedules.map((schedule) => ({
    ...schedule,
    _id: new ObjectId(),
    participants: schedule.participants.map((empId) => employeeMapping[empId]),
    date: new Date(schedule.date),
    createdAt: new Date(schedule.createdAt),
    updatedAt: new Date(schedule.createdAt),
    isDeleted: false,
  }));
};

// Function to process earnings
const processEarnings = (earnings) => {
  return earnings.map((earning) => ({
    ...earning,
    _id: new ObjectId(),
    date: new Date(earning.date),
    createdAt: new Date(earning.createdAt),
    updatedAt: new Date(earning.createdAt),
  }));
};

// Function to process job applications
const processJobApplications = (jobApplications) => {
  return jobApplications.map((application) => ({
    ...application,
    _id: new ObjectId(),
    createdAt: new Date(application.createdAt),
    updatedAt: new Date(application.createdAt),
    isDeleted: false,
  }));
};

// Function to process approvals with proper ObjectId references
const processApprovals = (approvals, employeeMapping) => {
  return approvals.map((approval) => ({
    ...approval,
    _id: new ObjectId(),
    requesterId: employeeMapping[approval.requesterId] || approval.requesterId,
    createdAt: new Date(approval.createdAt),
    updatedAt: new Date(approval.createdAt),
    isDeleted: false,
  }));
};

// Function to process leaves with proper ObjectId references
const processLeaves = (leaves, employeeMapping) => {
  return leaves.map((leave) => ({
    ...leave,
    _id: new ObjectId(),
    employeeId: employeeMapping[leave.employeeId],
    fromDate: new Date(leave.fromDate),
    toDate: new Date(leave.toDate),
    createdAt: new Date(leave.createdAt),
    updatedAt: new Date(leave.createdAt),
    isDeleted: false,
  }));
};

// Function to create default leave types
const createLeaveTypes = () => {
  return [
    {
      _id: new ObjectId(),
      name: "Annual Leave",
      maxDays: 21,
      description: "Annual vacation leave",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      name: "Medical Leave",
      maxDays: 30,
      description: "Medical/sick leave",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      name: "Casual Leave",
      maxDays: 12,
      description: "Casual leave for personal matters",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      name: "Maternity Leave",
      maxDays: 90,
      description: "Maternity leave",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      name: "Paternity Leave",
      maxDays: 15,
      description: "Paternity leave",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      name: "Emergency Leave",
      maxDays: 7,
      description: "Emergency leave",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
};

export const seedDatabase = async (companyId = "68443081dcdfe43152aebf80") => {
  try {
    console.log("🌱 Starting database seeding...");

    await connectDB();
    console.log("Connected to database");
    const collections = getTenantCollections(companyId);

    console.log("Clearing existing data...");
    await Promise.all([
      collections.employees.deleteMany({}),
      collections.clients.deleteMany({}),
      collections.projects.deleteMany({}),
      collections.tasks.deleteMany({}),
      collections.attendance.deleteMany({}),
      collections.invoices.deleteMany({}),
      collections.activities.deleteMany({}),
      collections.todos.deleteMany({}),
      collections.schedules.deleteMany({}),
      collections.earnings.deleteMany({}),
      collections.jobApplications.deleteMany({}),
      collections.leaves.deleteMany({}),
      collections.leaveTypes.deleteMany({}),
      collections.approvals?.deleteMany({}) || Promise.resolve(),
    ]);
    console.log("Cleared existing data");

    // Process data with proper ObjectId references
    console.log("Processing data...");
    const { processedEmployees, employeeMapping } = createEmployeeMapping(
      mockData.employees
    );
    const { processedClients, clientMapping } = createClientMapping(
      mockData.clients
    );
    const processedProjects = processProjects(
      mockData.projects,
      employeeMapping,
      clientMapping
    );
    const processedTasks = processTasks(mockData.tasks, employeeMapping);
    const processedAttendance = processAttendance(
      mockData.attendance,
      employeeMapping
    );
    const processedInvoices = processInvoices(mockData.invoices, clientMapping);
    const processedActivities = processActivities(
      mockData.activities,
      employeeMapping
    );
    const processedTodos = processTodos(mockData.todos, employeeMapping);
    const processedSchedules = processSchedules(
      mockData.schedules,
      employeeMapping
    );
    const processedEarnings = processEarnings(mockData.earnings);
    const processedJobApplications = processJobApplications(
      mockData.jobApplications
    );
    const processedLeaves = processLeaves(mockData.leaves, employeeMapping);
    const processedApprovals = processApprovals(
      mockData.approvals || [],
      employeeMapping
    );
    const leaveTypes = createLeaveTypes();

    // Insert data into collections
    console.log("Inserting data into collections...");

    await collections.employees.insertMany(processedEmployees);
    console.log(`Inserted ${processedEmployees.length} employees`);

    await collections.clients.insertMany(processedClients);
    console.log(`Inserted ${processedClients.length} clients`);

    await collections.projects.insertMany(processedProjects);
    console.log(`Inserted ${processedProjects.length} projects`);

    await collections.tasks.insertMany(processedTasks);
    console.log(`Inserted ${processedTasks.length} tasks`);

    await collections.attendance.insertMany(processedAttendance);
    console.log(`Inserted ${processedAttendance.length} attendance records`);

    await collections.invoices.insertMany(processedInvoices);
    console.log(`Inserted ${processedInvoices.length} invoices`);

    await collections.activities.insertMany(processedActivities);
    console.log(`Inserted ${processedActivities.length} activities`);

    await collections.todos.insertMany(processedTodos);
    console.log(`Inserted ${processedTodos.length} todos`);

    await collections.schedules.insertMany(processedSchedules);
    console.log(`Inserted ${processedSchedules.length} schedules`);

    await collections.earnings.insertMany(processedEarnings);
    console.log(`Inserted ${processedEarnings.length} earnings records`);

    await collections.jobApplications.insertMany(processedJobApplications);
    console.log(`Inserted ${processedJobApplications.length} job applications`);

    await collections.leaves.insertMany(processedLeaves);
    console.log(`Inserted ${processedLeaves.length} leave requests`);

    await collections.leaveTypes.insertMany(leaveTypes);
    console.log(`Inserted ${leaveTypes.length} leave types`);

    if (collections.approvals && processedApprovals.length > 0) {
      await collections.approvals.insertMany(processedApprovals);
      console.log(`Inserted ${processedApprovals.length} approvals`);
    }

    console.log("Database seeding completed successfully!");
    console.log(`Summary:
      - Company ID: ${companyId}
      - Employees: ${processedEmployees.length}
      - Clients: ${processedClients.length}
      - Projects: ${processedProjects.length}
      - Tasks: ${processedTasks.length}
      - Attendance Records: ${processedAttendance.length}
      - Invoices: ${processedInvoices.length}
      - Activities: ${processedActivities.length}
      - Todos: ${processedTodos.length}
      - Schedules: ${processedSchedules.length}
      - Earnings: ${processedEarnings.length}
      - Job Applications: ${processedJobApplications.length}
      - Leave Requests: ${processedLeaves.length}
      - Leave Types: ${leaveTypes.length}
      - Approvals: ${processedApprovals.length}
    `);

    return {
      success: true,
      message: "Database seeded successfully",
      data: {
        companyId,
        employeeMapping,
        clientMapping,
        recordCounts: {
          employees: processedEmployees.length,
          clients: processedClients.length,
          projects: processedProjects.length,
          tasks: processedTasks.length,
          attendance: processedAttendance.length,
          invoices: processedInvoices.length,
          activities: processedActivities.length,
          todos: processedTodos.length,
          schedules: processedSchedules.length,
          earnings: processedEarnings.length,
          jobApplications: processedJobApplications.length,
          leaves: processedLeaves.length,
          leaveTypes: leaveTypes.length,
          approvals: processedApprovals.length,
        },
      },
    };
  } catch (error) {
    console.error("Database seeding failed:", error);
    throw error;
  }
};

export const runSeed = async () => {
  try {
    const companyId = process.argv[2] || "68443081dcdfe43152aebf80";
    console.log(`Running seed for company: ${companyId}`);

    const result = await seedDatabase(companyId);
    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeed();
}
