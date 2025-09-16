import { MongoClient, ObjectId } from "mongodb";

const uri = 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';
const dbName = '68443081dcdfe43152aebf80';

const clerkUserIdToFind = "user_315fURfZKBgRIlLxiBbfl3Ndqs7"; // replace with actual Clerk user ID

async function fixLeaveEmployeeIds() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const employees = db.collection("employees");
    const leaves = db.collection("leaves");

    // 1. Find employee by Clerk user ID stored in employee doc (change field if needed)
    const employeeDoc = await employees.findOne({ clerkUserId: clerkUserIdToFind });

    if (!employeeDoc) {
      console.error(`❌ Employee not found for Clerk user ID: ${clerkUserIdToFind}`);
      return;
    }

    console.log(`Employee found. Mongo ObjectId: ${employeeDoc._id}`);

    // 2. Update all leaves documents that have employeeId stored as string Clerk ID to ObjectId

    const updateResult = await leaves.updateMany(
      { employeeId: clerkUserIdToFind }, // matches docs with string employeeId equal to the Clerk user ID
      { $set: { employeeId: employeeDoc._id } }
    );

    console.log(`Updated ${updateResult.modifiedCount} leave document(s) with correct employeeId.`);

    // 3. Optional: Fetch leaves for this employee to verify
    const leavesForEmployee = await leaves.find({ employeeId: employeeDoc._id }).toArray();
    console.log(`Leaves for employee (${employeeDoc._id}):`, leavesForEmployee);

  } catch (err) {
    console.error("❌ Error during update:", err);
  } finally {
    await client.close();
    console.log("🔒 MongoDB connection closed");
  }
}

fixLeaveEmployeeIds();
