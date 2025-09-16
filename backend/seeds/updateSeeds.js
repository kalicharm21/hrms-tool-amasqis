import { MongoClient, ObjectId } from "mongodb";

const uri = 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';
const dbName = "68443081dcdfe43152aebf80";

const clerkUserId = "user_315fURfZKBgRIlLxiBbfl3Ndqs7"; // your Clerk user ID

async function fixEmployeeIdsInLeaves() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const employees = db.collection("employees");
    const leaves = db.collection("leaves");

    // Find employee ObjectId
    const employeeDoc = await employees.findOne({ clerkUserId });

    if (!employeeDoc) {
      console.error("Employee document not found for Clerk user ID:", clerkUserId);
      return;
    }
    console.log("Found employee with _id:", employeeDoc._id.toHexString());

    // Update leaves with string employeeId equal to Clerk ID
    const updateResult = await leaves.updateMany(
      { employeeId: clerkUserId },
      { $set: { employeeId: employeeDoc._id } }
    );

    console.log("Modified documents count:", updateResult.modifiedCount);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
    console.log("Disconnected");
  }
}

fixEmployeeIdsInLeaves();
