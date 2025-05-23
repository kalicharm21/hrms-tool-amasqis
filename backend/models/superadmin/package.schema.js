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
