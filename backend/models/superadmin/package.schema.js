import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
  planName: { type: String, required: true },
  planType: { type: String, required: true },
  price: { type: Number, required: true },
  planPosition: { type: String, required: true },
  planCurrency: { type: String, required: true },
  planCurrencytype: { type: String, required: true },
  discountType: { type: String, required: true },
  discount: { type: Number, required: true },
  limitationsInvoices: { type: Number, required: true },
  maxCustomers: { type: Number, required: true },
  product: { type: Number, required: true },
  supplier: { type: Number, required: true },
  planModules: { type: [String], required: true },
  accessTrial: { type: Boolean, required: true },
  trialDays: { type: Number, required: true },
  isRecommended: { type: Boolean, required: true },
  status: { type: String, required: true },
  description: { type: String, required: true },
  logo: { type: String, required: true },
});
export const Plan = mongoose.model("Plan", planSchema);

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  domain: { type: String, required: true },
  phone: { type: String, required: true },
  website: { type: String, required: true },
  address: { type: String, required: true },
  status: { type: String, default: true },

  // Plan details
  plan_id: { type: String, required: true },
  plan_name: { type: String, required: true },
  plan_type: { type: String, required: true },
  currency: { type: String, required: true },
  logo: { type: String, required: true },
});

export const Company = mongoose.model("Company", companySchema);

const leaveSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Employee' },
  companyId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Company' },
  leaveType: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true },
  noOfDays: { type: Number, required: true },
  status: { type: String, default: "pending" },  // e.g., pending, approved, declined
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  // Any other fields as needed
});
export const Leave = mongoose.model("Leave", leaveSchema);