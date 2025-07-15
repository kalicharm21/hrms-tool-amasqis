import mongoose from "mongoose";

const taskSchema = new Schema({
  title: { type: String, required: true },
  empIds: [{ type: Types.ObjectId, ref: 'employees', required: true }],
  projectId: { type: Types.ObjectId, ref: 'projects', required: true },
  starred: { type: Boolean, default: false },
  checked: { type: Boolean, default: false },
  status: { type: String, enum: ["onHold", "inprogress", "completed", "pending"], default: "pending" }
});
export const tasks = mongoose.model("tasks", taskSchema)

const projectSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  projLead: { type: Types.ObjectId, ref: 'leads', required: true },
  projManager: { type: Types.ObjectId, ref: 'employees', required: true },
  empMembers: [{ type: Types.ObjectId, ref: 'employees', required: true }],
  status: { type: String, enum: ["ongoing", "onHold", "completed", "cancelled"], default: "on-going" },
  startDate: { type: Date },
  dueDate: { type: Date },
  domain: { type: String },
  priority: { type: String, enum: ["high", "medium", "low"], default: "low" },
  clientName: { type: String },
  attachments: [{ type: String }],
}, { timestamps: true });

export const projects = mongoose.model("projects", projectSchema)

const meetingSchema = new mongoose.Schema({
  startTime: { type: Date, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, trim: true },
  tag: { type: String, trim: true },
  leadId: { type: String, required: true },
}, { timestamps: true, })

export const meetings = mongoose.model("meetings", meetingSchema);

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  proficiency: { type: Number, required: true, min: 0, max: 100 },
}, { timestamps: true, })

export const skills = mongoose.model("skills", skillSchema);

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  time: { type: Date, required: true, index: true },
  type: { type: String, required: true },
}, { timestamps: true, })

export const notifications = mongoose.model("notifications", notificationSchema);

const AttendanceSchema = new Schema({
  employeeId: { type: Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  punchIn: { type: Date },
  punchOut: { type: Date },
  breakDetails: [
    {
      start: { type: Date },
      end: { type: Date }
    }
  ],
  totalBreakDuration: { type: Number, default: 0 },
  totalProductiveDuration: { type: Number, default: 0 },
  attendanceStatus: { type: String, enum: ['onTime', 'late', 'absent'], required: true },
  mode: { type: String, enum: ["remote", "on-site"] },
}, { timestamps: true });

export const attendance = mongoose.model("attendance", AttendanceSchema);

import mongoose from 'mongoose';
const { Schema, Types } = mongoose;

const salaryHistorySchema = new Schema({
  empId: { type: Types.ObjectId, ref: 'employees', required: true },
  salary: { type: Number, required: true },
  effectiveDate: { type: Date, required: true },
  },
  {
    timestamps: true,
  });

export const SalaryHistory = mongoose.model('salaryHistory', salaryHistorySchema);
