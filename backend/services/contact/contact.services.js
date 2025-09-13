import { getTenantCollections } from "../../config/db.js";
import { ObjectId } from "mongodb";

// Create a contact
export const createContact = async (tenantCompanyId, contactData) => {
  const collections = getTenantCollections(tenantCompanyId);
  const now = new Date();
  const name = [contactData.firstName, contactData.lastName].filter(Boolean).join(" ");
  const newContact = {
    name,
    firstName: contactData.firstName,
    lastName: contactData.lastName || "",
    jobTitle: contactData.jobTitle || "",
    companyName: contactData.companyName || "",
    email: contactData.email || "",
    phone: contactData.phone || "",
    phone2: contactData.phone2 || "",
    fax: contactData.fax || "",
    rating: typeof contactData.rating === "number" ? contactData.rating : 0,
    ownerName: contactData.ownerName || "",
    image: contactData.image || "contact-01.svg",
    status: contactData.status || "Active",
    address: contactData.address || "",
    country: contactData.country || "",
    state: contactData.state || "",
    city: contactData.city || "",
    zipcode: contactData.zipcode || "",
    industry: contactData.industry || "",
    source: contactData.source || "",
    currency: contactData.currency || "",
    language: contactData.language || "",
    about: contactData.about || "",
    dob: contactData.dob || "",
    tags: Array.isArray(contactData.tags) ? contactData.tags : [],
    deals: Array.isArray(contactData.deals) ? contactData.deals : [],
    social: {
      facebook: contactData.facebook || "",
      twitter: contactData.twitter || "",
      linkedin: contactData.linkedin || "",
      skype: contactData.skype || "",
      whatsapp: contactData.whatsapp || "",
      instagram: contactData.instagram || "",
    },
    companyId: tenantCompanyId,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
  };
  const result = await collections.contacts.insertOne(newContact);
  return { done: true, data: await collections.contacts.findOne({ _id: result.insertedId }) };
};

// List contacts with optional filters and pagination
export const listContacts = async (tenantCompanyId, { page = 1, limit = 20, search = "", status = "All", sortBy = "createdAt", sortOrder = "desc" } = {}) => {
  const collections = getTenantCollections(tenantCompanyId);
  const query = { companyId: tenantCompanyId, isDeleted: { $ne: true } };

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { companyName: { $regex: search, $options: "i" } },
      { ownerName: { $regex: search, $options: "i" } },
    ];
  }

  if (status && status !== "All") {
    query.status = status;
  }

  // If sorting by name, use the 'name' field
  const sortField = sortBy === "name" ? "name" : sortBy;
  const sort = { [sortField]: sortOrder === "asc" ? 1 : -1 };
  const safeLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
  const safePage = Math.max(parseInt(page) || 1, 1);

  const total = await collections.contacts.countDocuments(query);
  const items = await collections.contacts
    .find(query)
    .sort(sort)
    .skip((safePage - 1) * safeLimit)
    .limit(safeLimit)
    .toArray();

  return {
    done: true,
    data: items,
    pagination: { page: safePage, limit: safeLimit, total }
  };
};

// Get contact by id
export const getContactById = async (tenantCompanyId, id) => {
  const collections = getTenantCollections(tenantCompanyId);
  if (!ObjectId.isValid(id)) return { done: false, error: "Invalid contact id" };
  const contact = await collections.contacts.findOne({ _id: new ObjectId(id), companyId: tenantCompanyId, isDeleted: { $ne: true } });
  if (!contact) return { done: false, error: "Contact not found" };
  return { done: true, data: contact };
};

// Update contact
export const updateContact = async (tenantCompanyId, id, updates) => {
  const collections = getTenantCollections(tenantCompanyId);
  if (!ObjectId.isValid(id)) return { done: false, error: "Invalid contact id" };
  const updateDoc = { ...updates, updatedAt: new Date() };
  delete updateDoc._id;
  const result = await collections.contacts.updateOne(
    { _id: new ObjectId(id), companyId: tenantCompanyId, isDeleted: { $ne: true } },
    { $set: updateDoc }
  );
  if (result.matchedCount === 0) return { done: false, error: "Contact not found" };
  const updated = await collections.contacts.findOne({ _id: new ObjectId(id) });
  return { done: true, data: updated };
};

// Soft delete contact
export const deleteContact = async (tenantCompanyId, id) => {
  const collections = getTenantCollections(tenantCompanyId);
  if (!ObjectId.isValid(id)) return { done: false, error: "Invalid contact id" };
  const result = await collections.contacts.updateOne(
    { _id: new ObjectId(id), companyId: tenantCompanyId, isDeleted: { $ne: true } },
    { $set: { isDeleted: true, deletedAt: new Date(), updatedAt: new Date() } }
  );
  if (result.matchedCount === 0) return { done: false, error: "Contact not found" };
  return { done: true, data: { _id: id, deleted: true } };
};

// Export contacts
export const exportContacts = async (tenantCompanyId, format) => {
  try {
    const collections = getTenantCollections(tenantCompanyId);
    const contacts = await collections.contacts.find({
      companyId: tenantCompanyId,
      isDeleted: { $ne: true }
    }).toArray();

    if (format === 'excel') {
      const csvData = convertToCSV(contacts);
      return {
        done: true,
        data: csvData,
        contentType: 'text/csv'
      };
    } else if (format === 'pdf') {
      const pdfData = convertToPDF(contacts);
      return {
        done: true,
        data: pdfData,
        contentType: 'application/pdf'
      };
    }

    return { done: false, error: "Unsupported format" };
  } catch (error) {
    console.error("Error in exportContacts service:", error);
    return { done: false, error: "Failed to export contacts" };
  }
};

const convertToCSV = (contacts) => {
  const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Job Title', 'Owner', 'Status', 'Industry', 'Source', 'Created At'];
  const rows = contacts.map(contact => [
    contact.firstName || '',
    contact.lastName || '',
    contact.email || '',
    contact.phone || '',
    contact.companyName || '',
    contact.jobTitle || '',
    contact.ownerName || '',
    contact.status || '',
    contact.industry || '',
    contact.source || '',
    contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : ''
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  return csvContent;
};

const convertToPDF = (contacts) => {
  let content = 'CONTACTS REPORT\n\n';
  contacts.forEach((contact, index) => {
    content += `${index + 1}. ${contact.firstName} ${contact.lastName}\n`;
    content += `   Email: ${contact.email || 'N/A'}\n`;
    content += `   Phone: ${contact.phone || 'N/A'}\n`;
    content += `   Company: ${contact.companyName || 'N/A'}\n`;
    content += `   Job Title: ${contact.jobTitle || 'N/A'}\n`;
    content += `   Owner: ${contact.ownerName || 'N/A'}\n`;
    content += `   Status: ${contact.status || 'N/A'}\n`;
    content += `   Industry: ${contact.industry || 'N/A'}\n`;
    content += `   Source: ${contact.source || 'N/A'}\n`;
    content += `   Created: ${contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : 'N/A'}\n\n`;
  });

  return content;
};