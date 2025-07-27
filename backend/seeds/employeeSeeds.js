// seedProject.js
import { MongoClient, ObjectId } from "mongodb";

const uri = 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';
const dbName = '68443081dcdfe43152aebf80';
const collectionName = 'attendance';

async function seedProject() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(dbName);
    const projects = db.collection(collectionName);

    const employeeId = new ObjectId("6879df8337412a2eb7454d46");
    const leadId = new ObjectId("687b1b351cade320c72fadf7");

    const empId1 = new ObjectId("6879df8337412a2eb7454d46");
    const empId2 = new ObjectId("6879073b92e5fab6da551e09");
    const projectId = new ObjectId("687b238ec6f92fb1a4c4afd6");
    const projectId2 = new ObjectId("687b238ec6f92fb1a4c4afd4");

    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

    const newProject = [
      // Monday, July 14, 2025
      {
        employeeId,
        date: new Date("2025-07-14T00:00:00Z"),
        punchIn: new Date("2025-07-14T09:02:00Z"),
        punchOut: new Date("2025-07-14T17:00:00Z"),
        breakDetails: [
          { start: new Date("2025-07-14T13:00:00Z"), end: new Date("2025-07-14T13:30:00Z") }
        ],
        totalBreakDuration: 0.5,              // 30 minutes
        totalProductiveDuration: 7,           // 7 hours of work
        attendanceStatus: "onTime",
        mode: "onSite",
        overtimeRequestStatus: "none",
        overtimeHours: 0
      },
      // Tuesday, July 15, 2025 (late)
      {
        employeeId,
        date: new Date("2025-07-15T00:00:00Z"),
        punchIn: new Date("2025-07-15T09:18:00Z"),
        punchOut: new Date("2025-07-15T17:02:00Z"),
        breakDetails: [
          { start: new Date("2025-07-15T13:20:00Z"), end: new Date("2025-07-15T13:40:00Z") }
        ],
        totalBreakDuration: 0.33,             // 20 minutes ≈ 0.33 hr
        totalProductiveDuration: 6.7,
        attendanceStatus: "late",
        mode: "onSite",
        overtimeRequestStatus: "none",
        overtimeHours: 0
      },
      // Wednesday, July 16, 2025
      {
        employeeId,
        date: new Date("2025-07-16T00:00:00Z"),
        punchIn: new Date("2025-07-16T09:00:00Z"),
        punchOut: new Date("2025-07-16T17:00:00Z"),
        breakDetails: [
          { start: new Date("2025-07-16T12:45:00Z"), end: new Date("2025-07-16T13:10:00Z") }
        ],
        totalBreakDuration: 0.42,             // 25 mins ≈ 0.42 hr
        totalProductiveDuration: 7.3,
        attendanceStatus: "onTime",
        mode: "workFromHome",
        overtimeRequestStatus: "none",
        overtimeHours: 0
      },
      // Thursday, July 17, 2025 (absent)
      {
        employeeId,
        date: new Date("2025-07-17T00:00:00Z"),
        punchIn: null,
        punchOut: null,
        breakDetails: [],
        totalBreakDuration: 0,
        totalProductiveDuration: 0,
        attendanceStatus: "absent",
        mode: "onSite",
        overtimeRequestStatus: "none",
        overtimeHours: 0
      },
      // Friday, July 18, 2025 — with overtime
      {
        employeeId,
        date: new Date("2025-07-18T00:00:00Z"),
        punchIn: new Date("2025-07-18T08:55:00Z"),
        punchOut: new Date("2025-07-18T18:15:00Z"),
        breakDetails: [
          { start: new Date("2025-07-18T13:00:00Z"), end: new Date("2025-07-18T13:30:00Z") }
        ],
        totalBreakDuration: 0.5,
        totalProductiveDuration: 8.5,
        attendanceStatus: "onTime",
        mode: "onSite",
        overtimeRequestStatus: "approved",
        overtimeHours: 1.5
      },
      // Saturday, July 19, 2025 (half-day WFH)
      {
        employeeId,
        date: new Date("2025-07-19T00:00:00Z"),
        punchIn: new Date("2025-07-19T09:00:00Z"),
        punchOut: new Date("2025-07-19T13:30:00Z"),
        breakDetails: [
          { start: new Date("2025-07-19T11:15:00Z"), end: new Date("2025-07-19T11:30:00Z") }
        ],
        totalBreakDuration: 0.25,             // 15 minutes = 0.25 hr
        totalProductiveDuration: 4,
        attendanceStatus: "onTime",
        mode: "workFromHome",
        overtimeRequestStatus: "none",
        overtimeHours: 0
      }
    ];
    await projects.deleteMany({});
    const result = await projects.insertMany(newProject);
    console.log(`✅ Project inserted with _id: ${result.insertedIds}`);
  } catch (err) {
    console.error("❌ Error inserting project:", err.message);
  } finally {
    await client.close();
    console.log("🔒 MongoDB connection closed");
  }
}

seedProject();
