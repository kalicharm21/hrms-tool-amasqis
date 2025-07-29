import { MongoClient, ObjectId } from "mongodb";

const url = 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';
const dbName = '68443081dcdfe43152aebf80';

async function deletePendingLeaves() {
  const client = new MongoClient(url);

  try {
    await client.connect();
    const db = client.db(dbName);
    const result = await db.collection('attendance').deleteMany({
      _id: new ObjectId("688636813e7692b8ad017939")
    });

    console.log(`✅ Deleted ${result.deletedCount} pending leave(s).`);
  } catch (err) {
    console.error("❌ Error deleting pending leaves:", err);
  } finally {
    await client.close();
  }
}

deletePendingLeaves();
