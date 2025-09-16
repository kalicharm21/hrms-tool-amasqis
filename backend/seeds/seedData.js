import { MongoClient, ObjectId } from "mongodb";

const uri = 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';
const dbName = '68443081dcdfe43152aebf80';
const companyId = new ObjectId('68443081dcdfe43152aebf80');

const employee1 = new ObjectId("6879df8337412a2eb7454d46");
const employee2 = new ObjectId("6879073b92e5fab6da551e09");

async function seed() {
  const client = new MongoClient(uri, { useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db(dbName);

    // Seed employees
    await db.collection('employees').deleteMany({ companyId });
    await db.collection('employees').insertMany([
      { _id: employee1, firstName: "Anthony", lastName: "Lewis", status: "Active", companyId },
      { _id: employee2, firstName: "Brian", lastName: "Villalobos", status: "Active", companyId }
    ]);
    console.log("✅ Seeded employees");

    // Seed attendance for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await db.collection('attendance').deleteMany({ companyId, date: today });
    await db.collection('attendance').insertMany([
      { employeeId: employee1, date: today, status: "present", companyId },
      { employeeId: employee2, date: today, status: "absent", companyId }
    ]);
    console.log("✅ Seeded attendance");

    // Seed leaves
    await db.collection('leaves').deleteMany({ companyId });
    await db.collection('leaves').insertMany([
      {
        employeeId: employee1,
        companyId,
        startDate: new Date("2025-09-15"),
        endDate: new Date("2025-09-16"),
        leaveType: "medical leave",
        status: "approved",
        noOfDays: 2,
        reason: "Medical appointment"
      },
      {
        employeeId: employee2,
        companyId,
        startDate: new Date("2025-09-20"),
        endDate: new Date("2025-09-22"),
        leaveType: "casual leave",
        status: "pending",
        noOfDays: 3,
        reason: "Family event"
      }
    ]);
    console.log("✅ Seeded leaves");

  } catch (error) {
    console.error("❌ Seeding error:", error);
  } finally {
    await client.close();
    console.log("🔒 MongoDB connection closed");
  }
}

seed();
