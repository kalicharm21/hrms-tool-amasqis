import { getTenantCollections } from "../../config/db.js";
/*

 * @param {string} companyId - The ID of the company.
 * @returns {Promise<object>} - A promise that resolves to the list of clients.
 */
export const getAllClients = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);
    const clients = await collections.clients
      .find({ status: "Active" }) // You can adjust this filter if needed
      .sort({ createdAt: -1 })
      .toArray();

    return clients;
  } catch (error) {
    console.error("Error fetching all clients:", error);
    throw new Error("Could not retrieve clients.");
  }
};