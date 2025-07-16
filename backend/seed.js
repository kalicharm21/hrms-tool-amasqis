#!/usr/bin/env node

import { seedDatabase } from "./utils/seedDatabase.js";

const main = async () => {
  try {
    const companyId = process.argv[2] || "68443081dcdfe43152aebf80";

    console.log(`Seeding database for company: ${companyId}`);

    const result = await seedDatabase(companyId);

    if (result.success) {
      console.log("\nDatabase seeding completed successfully!");
      console.log(`\nCompany ID used: ${companyId}`);
    }

    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
};

main();
