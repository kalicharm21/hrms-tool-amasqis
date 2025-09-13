import { getTenantCollections } from "../../config/db.js";
import { ObjectId } from "mongodb";

// Create a company
export const createCompany = async (tenantCompanyId, companyData) => {
  const collections = getTenantCollections(tenantCompanyId);
  const now = new Date();
  const newCompany = {
    name: companyData.name,
    email: companyData.email || "",
    phone: companyData.phone || "",
    phone2: companyData.phone2 || "",
    fax: companyData.fax || "",
    location: companyData.location || "",
    rating: typeof companyData.rating === "number" ? companyData.rating : 0,
    ownerName: companyData.ownerName || "",
    image: companyData.image || "company-01.svg",
    status: companyData.status || "Active",
    website: companyData.website || "",
    address: companyData.address || "",
    country: companyData.country || "",
    state: companyData.state || "",
    city: companyData.city || "",
    zipcode: companyData.zipcode || "",
    industry: companyData.industry || "",
    source: companyData.source || "",
    currency: companyData.currency || "",
    language: companyData.language || "",
    about: companyData.about || "",
    tags: Array.isArray(companyData.tags) ? companyData.tags : [],
    deals: Array.isArray(companyData.deals) ? companyData.deals : [],
    social: {
      facebook: companyData.facebook || "",
      twitter: companyData.twitter || "",
      linkedin: companyData.linkedin || "",
      skype: companyData.skype || "",
      whatsapp: companyData.whatsapp || "",
      instagram: companyData.instagram || "",
    },
    companyId: tenantCompanyId,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
  };
  const result = await collections.companies.insertOne(newCompany);
  return { done: true, data: await collections.companies.findOne({ _id: result.insertedId }) };
};

// List companies with optional filters and pagination
export const listCompanies = async (tenantCompanyId, { page = 1, limit = 20, search = "", status = "All", sortBy = "createdAt", sortOrder = "desc" } = {}) => {
  const collections = getTenantCollections(tenantCompanyId);
  const query = { companyId: tenantCompanyId, isDeleted: { $ne: true } };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
      { ownerName: { $regex: search, $options: "i" } },
    ];
  }

  if (status && status !== "All") {
    query.status = status;
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
  const safeLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
  const safePage = Math.max(parseInt(page) || 1, 1);

  const total = await collections.companies.countDocuments(query);
  const items = await collections.companies
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

// Get company by id
export const getCompanyById = async (tenantCompanyId, id) => {
  const collections = getTenantCollections(tenantCompanyId);
  if (!ObjectId.isValid(id)) return { done: false, error: "Invalid company id" };
  const company = await collections.companies.findOne({ _id: new ObjectId(id), companyId: tenantCompanyId, isDeleted: { $ne: true } });
  if (!company) return { done: false, error: "Company not found" };
  return { done: true, data: company };
};

// Update company
export const updateCompany = async (tenantCompanyId, id, updates) => {
  const collections = getTenantCollections(tenantCompanyId);
  if (!ObjectId.isValid(id)) return { done: false, error: "Invalid company id" };
  const updateDoc = { ...updates, updatedAt: new Date() };
  delete updateDoc._id;
  const result = await collections.companies.updateOne(
    { _id: new ObjectId(id), companyId: tenantCompanyId, isDeleted: { $ne: true } },
    { $set: updateDoc }
  );
  if (result.matchedCount === 0) return { done: false, error: "Company not found" };
  const updated = await collections.companies.findOne({ _id: new ObjectId(id) });
  return { done: true, data: updated };
};

// Soft delete company
export const deleteCompany = async (tenantCompanyId, id) => {
  const collections = getTenantCollections(tenantCompanyId);
  if (!ObjectId.isValid(id)) return { done: false, error: "Invalid company id" };
  const result = await collections.companies.updateOne(
    { _id: new ObjectId(id), companyId: tenantCompanyId, isDeleted: { $ne: true } },
    { $set: { isDeleted: true, deletedAt: new Date(), updatedAt: new Date() } }
  );
  if (result.matchedCount === 0) return { done: false, error: "Company not found" };
  return { done: true, data: { _id: id, deleted: true } };
};

// Export companies
export const exportCompanies = async (tenantCompanyId, format) => {
  try {
    const collections = getTenantCollections(tenantCompanyId);
    const companies = await collections.companies.find({ 
      companyId: tenantCompanyId, 
      isDeleted: { $ne: true } 
    }).toArray();
    
    if (format === 'excel') {
      // Simple CSV export for now (can be enhanced with proper Excel library)
      const csvData = convertToCSV(companies);
      return {
        done: true,
        data: csvData,
        contentType: 'text/csv'
      };
    } else if (format === 'pdf') {
      // Simple text-based PDF for now (can be enhanced with proper PDF library)
      const pdfData = convertToPDF(companies);
      return {
        done: true,
        data: pdfData,
        contentType: 'application/pdf'
      };
    }
    
    return { done: false, error: "Unsupported format" };
  } catch (error) {
    console.error("Error in exportCompanies service:", error);
    return { done: false, error: "Failed to export companies" };
  }
};

const convertToCSV = (companies) => {
  const headers = ['Name', 'Email', 'Phone', 'Location', 'Rating', 'Owner', 'Status', 'Industry', 'Source', 'Created At'];
  const rows = companies.map(company => [
    company.name || '',
    company.email || '',
    company.phone || '',
    company.address?.city || company.location || '',
    company.rating || '',
    company.ownerName || '',
    company.status || '',
    company.industry || '',
    company.source || '',
    company.createdAt ? new Date(company.createdAt).toLocaleDateString() : ''
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
  
  return csvContent;
};

const convertToPDF = (companies) => {
  // Simple text-based PDF content
  let content = 'COMPANIES REPORT\n\n';
  companies.forEach((company, index) => {
    content += `${index + 1}. ${company.name}\n`;
    content += `   Email: ${company.email || 'N/A'}\n`;
    content += `   Phone: ${company.phone || 'N/A'}\n`;
    content += `   Location: ${company.address?.city || company.location || 'N/A'}\n`;
    content += `   Rating: ${company.rating || 'N/A'}\n`;
    content += `   Owner: ${company.ownerName || 'N/A'}\n`;
    content += `   Status: ${company.status || 'N/A'}\n`;
    content += `   Industry: ${company.industry || 'N/A'}\n`;
    content += `   Source: ${company.source || 'N/A'}\n`;
    content += `   Created: ${company.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'N/A'}\n\n`;
  });
  
  return content;
};


