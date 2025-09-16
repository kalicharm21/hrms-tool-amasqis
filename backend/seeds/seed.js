// seeds.js
import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://admin:AdMin-2025@cluster0.iooxd.mongodb.net/';
const dbName = '68443081dcdfe43152aeb80';  // Confirm exact DB name
const collectionName = 'leaves';

async function getAllLeads() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(dbName);
    const leavesCollection = db.collection(collectionName);

    // Adjust 'userId' if needed per your schema (e.g., 'employeeId')
    const leads = await leavesCollection.find({
      userId: "user_2zjWaom2HuLlGGrr81Dqy",
    }).toArray();

    console.log(JSON.stringify(leads, null, 2));
    console.log(`📄 Found ${leads.length} leads`);
  } catch (error) {
    console.error('❌ Error fetching leads:', error.message);
  } finally {
    await client.close();
    console.log('🔒 Connection closed');
  }
}

getAllLeads();
