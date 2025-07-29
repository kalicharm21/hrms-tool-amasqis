// updateLeadForEmployee.js
import { MongoClient, ObjectId } from "mongodb";

// Update your credentials here
const uri = 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';
const dbName = '68443081dcdfe43152aebf80';
const collectionName = 'details';

async function updateEmployeeLeadId() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const employees = db.collection(collectionName);

    const employeeId = new ObjectId("687ba4c808ed553abaeb951f");
    const newFields = {
      punchInTime: "16:15",
      punchOutTime: "16:25"
    }

    const result = await employees.updateOne(
      { _id: employeeId },
      { $set: newFields }
    );

    if (result.matchedCount === 0) {
      console.log("⚠️ No employee found with the given ID.");
    } else if (result.modifiedCount === 1) {
      console.log("✅ Updated employee with new leadId.");
    } else {
      console.log("ℹ️ No changes made (leadId might already be set).");
    }
  } catch (err) {
    console.error("❌ Error updating leadId:", err.message);
  } finally {
    await client.close();
    console.log("🔒 MongoDB connection closed");
  }
}

updateEmployeeLeadId();
